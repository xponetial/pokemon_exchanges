-- ============================================================
-- Pokemon Exchanges — Phase 1 fixes
-- 1. Auto-mark listing as sold when purchased (trigger)
-- 2. Storage RLS policies for listing-images bucket
-- ============================================================

-- ── Trigger: mark listing sold on order_item insert ────────
CREATE OR REPLACE FUNCTION public.mark_listing_sold_on_purchase()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.listings SET status = 'sold' WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_item_purchased
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.mark_listing_sold_on_purchase();

-- ── Storage RLS policies for listing-images ────────────────
-- Authenticated sellers can upload to their own folder:
-- path structure: listings/{user_id}/{filename}
CREATE POLICY "Sellers can upload listing images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Anyone can view listing images (bucket is public)
CREATE POLICY "Anyone can view listing images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');

-- Sellers can delete their own images
CREATE POLICY "Sellers can delete own listing images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
