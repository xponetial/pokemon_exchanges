CREATE TABLE aggregated_prices (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_listing_id   uuid REFERENCES external_listings(id) ON DELETE CASCADE,
  fair_value            numeric(10,2) NOT NULL,
  confidence_score      integer NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
  tcgplayer_price       numeric(10,2),
  pricecharting_price   numeric(10,2),
  ebay_comps_price      numeric(10,2),
  is_graded             boolean DEFAULT false,
  weights               jsonb,
  created_at            timestamptz DEFAULT now(),
  UNIQUE (external_listing_id)
);

ALTER TABLE aggregated_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_all_aggregated_prices" ON aggregated_prices FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
