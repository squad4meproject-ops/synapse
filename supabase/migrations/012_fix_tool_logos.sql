-- ============================================================
-- Migration 012: Fix broken tool logos
-- Utilise Google Favicon API comme fallback fiable
-- ============================================================

UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=cursor.sh&sz=64' WHERE slug = 'cursor' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%cursor%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=runwayml.com&sz=64' WHERE slug = 'runway' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%runwayml%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=elevenlabs.io&sz=64' WHERE slug = 'elevenlabs' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%elevenlabs%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=notion.so&sz=64' WHERE slug = 'notion-ai' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%notion%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=jasper.ai&sz=64' WHERE slug = 'jasper' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%jasper%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=suno.com&sz=64' WHERE slug = 'suno' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%suno%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=pika.art&sz=64' WHERE slug = 'pika' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%pika%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=github.com&sz=64' WHERE slug = 'copilot' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%github%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=gemini.google.com&sz=64' WHERE slug = 'gemini' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%gemini%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=openai.com&sz=64' WHERE slug = 'sora' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=leonardo.ai&sz=64' WHERE slug = 'leonardo' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%leonardo%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=v0.dev&sz=64' WHERE slug = 'v0' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%v0%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=huggingface.co&sz=64' WHERE slug = 'huggingface' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%huggingface%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=ideogram.ai&sz=64' WHERE slug = 'ideogram' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%ideogram%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=gamma.app&sz=64' WHERE slug = 'gamma' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%gamma%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=otter.ai&sz=64' WHERE slug = 'otter' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%otter%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=replicate.com&sz=64' WHERE slug = 'replicate' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%replicate%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=descript.com&sz=64' WHERE slug = 'descript' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%descript%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=anthropic.com&sz=64' WHERE slug = 'anthropic-claude' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%anthropic%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=perplexity.ai&sz=64' WHERE slug = 'perplexity' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%perplexity%');
