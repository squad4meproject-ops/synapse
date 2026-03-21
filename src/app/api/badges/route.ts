import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const service = createServiceClient();

    const { data, error } = await service
      .from('badges')
      .select('id, name_en as name, description_en as description, icon as icon_url')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json([], { status: 500 });
  }
}
