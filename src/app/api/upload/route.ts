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

    // 2. Lire le fichier du FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Vérifier le type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Vercel Hobby plan limite le body à 4.5MB — on limite à 4MB pour être safe
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 4MB)' }, { status: 400 });
    }

    // 3. Convertir le File en Buffer (fix compatibilité Node.js / Supabase SDK)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Upload vers Supabase Storage
    const serviceClient = createServiceClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: uploadError } = await serviceClient.storage
      .from('post-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // 5. Construire l'URL publique
    const { data: { publicUrl } } = serviceClient.storage
      .from('post-images')
      .getPublicUrl(fileName);

    console.log(`Image uploaded successfully: ${fileName} (${file.size} bytes)`);
    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
