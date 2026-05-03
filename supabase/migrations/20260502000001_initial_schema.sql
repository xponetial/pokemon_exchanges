-- ============================================================
-- Pokemon Exchanges — Initial Schema
-- Phase 1 MVP
-- ============================================================

-- ── Profiles (extends auth.users) ──────────────────────────
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'buyer'
                  CHECK (role IN ('buyer', 'seller', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Sellers ────────────────────────────────────────────────
CREATE TABLE public.sellers (
  id                        UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_account_id         TEXT,
  stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  display_name              TEXT NOT NULL,
  bio                       TEXT,
  rating                    NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_sales               INT NOT NULL DEFAULT 0,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Cards catalog ──────────────────────────────────────────
CREATE TABLE public.cards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  set_name      TEXT NOT NULL,
  set_code      TEXT NOT NULL,
  number        TEXT NOT NULL,
  rarity        TEXT,
  hp            TEXT,
  types         TEXT[],
  image_url     TEXT,
  tcg_player_id TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (set_code, number)
);

-- ── Listings ───────────────────────────────────────────────
CREATE TABLE public.listings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id        UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  card_id          UUID REFERENCES public.cards(id),
  -- denormalized card info for seller-entered listings without a catalog match
  card_name        TEXT,
  set_name         TEXT,
  card_number      TEXT,
  condition        TEXT NOT NULL CHECK (condition IN ('Graded', 'Raw')),
  grading_company  TEXT CHECK (grading_company IN ('PSA', 'BGS', 'CGC', 'SGC')),
  grade            TEXT,
  raw_condition    TEXT CHECK (
                    raw_condition IN (
                      'Mint', 'Near Mint', 'Lightly Played',
                      'Moderately Played', 'Heavily Played', 'Damaged'
                    )),
  price            NUMERIC(10,2) NOT NULL CHECK (price > 0),
  title            TEXT NOT NULL,
  description      TEXT,
  images           TEXT[] NOT NULL DEFAULT '{}',
  status           TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'sold', 'inactive', 'removed')),
  views            INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listings_seller_id ON public.listings(seller_id);
CREATE INDEX idx_listings_status    ON public.listings(status);
CREATE INDEX idx_listings_price     ON public.listings(price);
CREATE INDEX idx_listings_card_id   ON public.listings(card_id);

-- ── Orders ─────────────────────────────────────────────────
CREATE TABLE public.orders (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id                 UUID NOT NULL REFERENCES public.profiles(id),
  seller_id                UUID NOT NULL REFERENCES public.sellers(id),
  stripe_payment_intent_id TEXT,
  stripe_transfer_id       TEXT,
  subtotal                 NUMERIC(10,2) NOT NULL,
  platform_fee             NUMERIC(10,2) NOT NULL,
  seller_payout            NUMERIC(10,2) NOT NULL,
  total                    NUMERIC(10,2) NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'pending'
                             CHECK (status IN (
                               'pending', 'payment_captured', 'shipped',
                               'delivered', 'complete', 'disputed',
                               'refunded', 'cancelled'
                             )),
  escrow_released_at       TIMESTAMPTZ,
  shipping_address         JSONB,
  tracking_number          TEXT,
  tracking_carrier         TEXT,
  notes                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer_id  ON public.orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX idx_orders_status    ON public.orders(status);

-- ── Order items ────────────────────────────────────────────
CREATE TABLE public.order_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id),
  price      NUMERIC(10,2) NOT NULL,
  quantity   INT NOT NULL DEFAULT 1
);

CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- ── updated_at triggers ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- sellers
CREATE POLICY "Sellers are viewable by everyone"
  ON public.sellers FOR SELECT USING (true);
CREATE POLICY "Sellers can update own record"
  ON public.sellers FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Sellers can insert own record"
  ON public.sellers FOR INSERT WITH CHECK (auth.uid() = id);

-- cards
CREATE POLICY "Cards are viewable by everyone"
  ON public.cards FOR SELECT USING (true);
CREATE POLICY "Admins can insert cards"
  ON public.cards FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- listings
CREATE POLICY "Active listings are viewable by everyone"
  ON public.listings FOR SELECT USING (status = 'active' OR seller_id = auth.uid());
CREATE POLICY "Sellers can insert their own listings"
  ON public.listings FOR INSERT WITH CHECK (seller_id = auth.uid());
CREATE POLICY "Sellers can update their own listings"
  ON public.listings FOR UPDATE USING (seller_id = auth.uid());
CREATE POLICY "Sellers can delete their own listings"
  ON public.listings FOR DELETE USING (seller_id = auth.uid());

-- orders
CREATE POLICY "Buyers can view their own orders"
  ON public.orders FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "Buyers can create orders"
  ON public.orders FOR INSERT WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Buyers can update their own orders"
  ON public.orders FOR UPDATE USING (buyer_id = auth.uid());

-- order_items
CREATE POLICY "Order participants can view items"
  ON public.order_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_id AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );
CREATE POLICY "Buyers can insert order items"
  ON public.order_items FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_id AND buyer_id = auth.uid()
    )
  );
