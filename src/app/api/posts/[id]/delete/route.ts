import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier l'auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Trouver l'utilisateur interne
    const serviceClient = createServiceClient();
    const { data: userData } = await serviceClient
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Vérifier que le post appartient à l'utilisateur
    const { data: post } = await serviceClient
      .from('posts')
      .select('id, author_id')
      .eq('id', id)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.author_id !== userData.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Supprimer les images du storage (optionnel, nettoie le storage)
    const { data: images } = await serviceClient
      .from('post_images')
      .select('image_url')
      .eq('post_id', id);

    if (images && images.length > 0) {
      const paths = images
        .map((img: { image_url: string }) => {
          // Extraire le path du fichier depuis l'URL publique
          const match = img.image_url.match(/post-images\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[];

      if (paths.length > 0) {
        await serviceClient.storage.from('post-images').remove(paths);
      }
    }

    // Supprimer le post (CASCADE supprime images, comments, likes, bookmarks)
    const { error: deleteError } = await serviceClient
      .from('posts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting post:', deleteError);
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
