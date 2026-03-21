import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isUserAdmin } from '@/lib/queries/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { badge_id } = body;

    if (!badge_id) {
      return NextResponse.json({ error: 'Badge ID is required' }, { status: 400 });
    }

    const service = createServiceClient();

    const { error: insertError } = await service
      .from('user_badges')
      .insert({ user_id: userId, badge_id });

    if (insertError) {
      // Ignore if already exists
      if (insertError.code !== '23505') {
        console.error('Error awarding badge:', insertError);
        return NextResponse.json({ error: 'Failed to award badge' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in award badge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
