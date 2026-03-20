import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier l'auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Lire le FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null; // 'avatar' or 'banner'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || (type !== 'avatar' && type !== 'banner')) {
      return NextResponse.json({ error: 'Invalid type. Must be "avatar" or "banner"' }, { status: 400 });
    }

    // Vérifier le type MIME
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    // 3. Trouver l'utilisateur interne
    const serviceClient = createServiceClient();
    const { data: userData } = await serviceClient
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 4. Convertir en Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Upload vers Supabase Storage
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userData.id}/${type}.${ext}`;

    const { error: uploadError } = await serviceClient.storage
      .from('user-avatars')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // 6. Construire l'URL publique avec cache buster
    const { data: { publicUrl } } = serviceClient.storage
      .from('user-avatars')
      .getPublicUrl(fileName);

    const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

    // 7. Mettre à jour la colonne correspondante dans users
    const updateField = type === 'avatar' ? 'avatar_url' : 'banner_url';
    const { error: updateError } = await serviceClient
      .from('users')
      .update({ [updateField]: urlWithCacheBuster })
      .eq('id', userData.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    console.log(`${type} uploaded successfully for user ${userData.id}`);
    return NextResponse.json({ url: urlWithCacheBuster });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
