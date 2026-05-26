import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('intake_items')
      .select(`
        id,
        item_number,
        item_title,
        current_price,
        photo_url,
        listing_url_1,
        listing_url_2,
        listing_url_3,
        listing_url_4,
        listed_at,
        listing_stage,
        status
      `)
      .eq('status', 'available')
      .eq('listing_stage', 'live')
      .order('listed_at', { ascending: false });

    if (error) throw error;

    return Response.json({ items: data || [] });
  } catch (err) {
    console.error('Shop API error:', err);
    return Response.json({ error: 'Failed to load items' }, { status: 500 });
  }
}
