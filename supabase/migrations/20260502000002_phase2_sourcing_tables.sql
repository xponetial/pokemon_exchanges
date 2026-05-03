-- Phase 2: Admin Sourcing Engine tables

-- External listings discovered from eBay / TCGplayer
CREATE TABLE external_listings (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source                  text NOT NULL CHECK (source IN ('ebay', 'tcgplayer')),
  external_id             text NOT NULL,
  title                   text NOT NULL,
  -- AI-normalized card data
  card_name               text,
  set_name                text,
  card_number             text,
  condition               text,
  grading_company         text,
  grade                   text,
  -- pricing
  price                   numeric(10,2) NOT NULL,
  market_price            numeric(10,2),
  price_diff_percent      numeric(5,2),
  -- external metadata
  url                     text NOT NULL,
  image_url               text,
  seller_name             text,
  seller_feedback_score   integer,
  seller_feedback_percent numeric(5,2),
  shipping_cost           numeric(10,2),
  ends_at                 timestamptz,
  -- lifecycle
  status                  text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'scoring', 'scored', 'watchlisted', 'purchased', 'ignored', 'expired')),
  raw_data                jsonb,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now(),
  UNIQUE (source, external_id)
);

-- AI deal scores linked to external listings
CREATE TABLE deal_scores (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_listing_id   uuid NOT NULL REFERENCES external_listings(id) ON DELETE CASCADE,
  -- 0–100 scores
  overall_score         integer NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  value_score           integer NOT NULL CHECK (value_score BETWEEN 0 AND 100),
  risk_score            integer NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  authenticity_score    integer NOT NULL CHECK (authenticity_score BETWEEN 0 AND 100),
  -- AI output
  reasoning             text,
  recommendation        text CHECK (recommendation IN ('buy', 'watch', 'skip')),
  flags                 text[],
  -- token tracking
  model_used            text,
  prompt_tokens         integer,
  completion_tokens     integer,
  created_at            timestamptz DEFAULT now()
);

-- Mitch's watchlist of interesting external listings
CREATE TABLE watchlist (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id              uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  external_listing_id   uuid NOT NULL REFERENCES external_listings(id) ON DELETE CASCADE,
  notes                 text,
  priority              text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  created_at            timestamptz DEFAULT now(),
  UNIQUE (admin_id, external_listing_id)
);

-- Cards Mitch has purchased from external sources
CREATE TABLE sourced_inventory (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id              uuid NOT NULL REFERENCES profiles(id),
  external_listing_id   uuid REFERENCES external_listings(id),
  -- card details
  card_name             text NOT NULL,
  set_name              text,
  card_number           text,
  condition             text NOT NULL,
  grading_company       text,
  grade                 text,
  -- financials
  purchase_price        numeric(10,2) NOT NULL,
  market_price          numeric(10,2),
  target_sell_price     numeric(10,2),
  -- lifecycle
  status                text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'received', 'listed', 'sold')),
  listing_id            uuid REFERENCES listings(id),
  -- metadata
  purchase_url          text,
  purchase_date         date,
  notes                 text,
  images                text[],
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_external_listings_source    ON external_listings(source);
CREATE INDEX idx_external_listings_status    ON external_listings(status);
CREATE INDEX idx_external_listings_score     ON deal_scores(overall_score DESC);
CREATE INDEX idx_watchlist_admin             ON watchlist(admin_id);
CREATE INDEX idx_sourced_inventory_admin     ON sourced_inventory(admin_id);
CREATE INDEX idx_sourced_inventory_status    ON sourced_inventory(status);

-- updated_at triggers
CREATE TRIGGER set_external_listings_updated_at
  BEFORE UPDATE ON external_listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_sourced_inventory_updated_at
  BEFORE UPDATE ON sourced_inventory
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS (admin-only — all rows)
ALTER TABLE external_listings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_scores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sourced_inventory   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_all_external_listings"   ON external_listings   FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "admins_all_deal_scores"         ON deal_scores         FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "admins_all_watchlist"           ON watchlist           FOR ALL USING (
  auth.uid() = admin_id
);
CREATE POLICY "admins_all_sourced_inventory"   ON sourced_inventory   FOR ALL USING (
  auth.uid() = admin_id
);
