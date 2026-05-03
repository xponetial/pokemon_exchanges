-- Phase 2d: Price Snapshots + Caching
-- Stores pricing responses per source with TTL-based expiry.
-- Prevents repeated API calls and builds a price history over time.

CREATE TABLE price_snapshots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_key    text NOT NULL,         -- normalized key e.g. "charizard|base-set|psa|10"
  source      text NOT NULL CHECK (source IN ('tcgplayer', 'pricecharting', 'ebay_comps')),
  price       numeric(10,2),
  raw_data    jsonb,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (card_key, source)
);

CREATE INDEX idx_price_snapshots_key    ON price_snapshots(card_key, source);
CREATE INDEX idx_price_snapshots_expiry ON price_snapshots(expires_at);

ALTER TABLE price_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_all_price_snapshots" ON price_snapshots FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
