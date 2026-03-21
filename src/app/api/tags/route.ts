import { NextRequest, NextResponse } from 'next/server';
import { getPopularTags } from '@/lib/queries/tags';

// GET /api/tags — Get popular tags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const tags = await getPopularTags(Math.min(limit, 100));

    return NextResponse.json({ tags }, { status: 200 });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
