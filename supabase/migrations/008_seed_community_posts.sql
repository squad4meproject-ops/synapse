-- ============================================================
-- Migration 008: Seed demo community posts
-- Utilise l'admin existant (benjamin@synapse.ai) comme auteur
-- ============================================================

-- Récupérer l'ID de l'admin
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM users WHERE email = 'benjamin@synapse.ai' LIMIT 1;

  IF admin_id IS NULL THEN
    RAISE NOTICE 'Admin user not found, skipping seed';
    RETURN;
  END IF;

  -- Post 1: Création IA
  INSERT INTO posts (id, author_id, category, content, locale) VALUES
  ('00000000-0000-0000-0000-000000000101', admin_id, 'creation',
   'Just created this cyberpunk cityscape using Midjourney v6. The level of detail is insane! Used the prompt below with --ar 16:9 --style raw. What do you think?',
   'en');

  -- Post 2: Prompt partagé
  INSERT INTO posts (id, author_id, category, content, prompt_content, locale) VALUES
  ('00000000-0000-0000-0000-000000000102', admin_id, 'prompt',
   'Here''s my go-to prompt for generating professional headshots with Stable Diffusion. Works great for LinkedIn photos!',
   'Professional headshot portrait of a [gender] [age] [ethnicity] person, wearing [clothing], soft studio lighting, shallow depth of field, neutral background, shot on Canon EOS R5, 85mm f/1.4, high resolution, photorealistic',
   'en');

  -- Post 3: Question
  INSERT INTO posts (id, author_id, category, content, locale) VALUES
  ('00000000-0000-0000-0000-000000000103', admin_id, 'question',
   'What''s the best AI tool for transcribing long meetings? I''ve tried Otter.ai but it struggles with multiple speakers. Any recommendations?',
   'en');

  -- Post 4: Discussion
  INSERT INTO posts (id, author_id, category, content, locale) VALUES
  ('00000000-0000-0000-0000-000000000104', admin_id, 'discussion',
   'Hot take: AI-generated art is not "cheating" — it''s a new medium. Just like photography wasn''t cheating when painters criticized it in the 1800s. The skill is in the prompting, curation, and creative vision. Change my mind.',
   'en');

  -- Post 5: Tool Review
  INSERT INTO posts (id, author_id, category, content, locale) VALUES
  ('00000000-0000-0000-0000-000000000105', admin_id, 'tool_review',
   'Been using Claude for coding assistance for 3 months now. Honest review: it''s incredible for explaining complex code, writing tests, and debugging. Where it falls short: very large codebases and real-time data. Overall 9/10 for developers.',
   'en');

  -- Post 6: Création IA en français
  INSERT INTO posts (id, author_id, category, content, locale) VALUES
  ('00000000-0000-0000-0000-000000000106', admin_id, 'creation',
   'J''ai généré cette série de portraits Renaissance avec DALL-E 3. Le style est bluffant, on dirait des vrais tableaux du 16e siècle. L''IA comprend vraiment les techniques de clair-obscur !',
   'fr');

  -- Quelques commentaires de démo
  INSERT INTO comments (post_id, author_id, content) VALUES
  ('00000000-0000-0000-0000-000000000103', admin_id,
   'I''ve had great results with Whisper (OpenAI). It handles multiple speakers well and it''s free to run locally!');

  INSERT INTO comments (post_id, author_id, content) VALUES
  ('00000000-0000-0000-0000-000000000104', admin_id,
   'I agree! The creativity is in how you use the tool, not just pressing a button. Prompt engineering is a real skill.');

END $$;
