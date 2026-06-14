import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Delete saved listings
    await supabaseAdmin.from('saved_listings').delete().eq('user_id', user.id);

    // Delete credits row
    await supabaseAdmin.from('credits').delete().eq('user_id', user.id);

    // Delete the user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) return Response.json({ error: deleteError.message }, { status: 500 });

    return Response.json({ success: true });
  } catch (err) {
    console.error('Delete account error:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
