-- ============================================================
-- Migration 010: Seed more AI tools
-- Ajoute ~20 outils IA populaires supplémentaires
-- ============================================================

-- Vérifier et insérer uniquement si le slug n'existe pas déjà
INSERT INTO ai_tools (slug, name, description, website_url, category, pricing, is_featured, logo_url)
VALUES
  ('perplexity', 'Perplexity AI', 'AI-powered search engine that provides accurate, cited answers to complex questions in real-time.', 'https://www.perplexity.ai', 'search', 'freemium', true, 'https://logo.clearbit.com/perplexity.ai'),
  ('cursor', 'Cursor', 'AI-first code editor built on VS Code. Autocomplete, chat, and AI-powered code generation for developers.', 'https://cursor.sh', 'coding', 'freemium', true, 'https://logo.clearbit.com/cursor.sh'),
  ('runway', 'Runway', 'AI creative suite for video generation, image editing, and multimedia content creation.', 'https://runwayml.com', 'video', 'freemium', true, 'https://logo.clearbit.com/runwayml.com'),
  ('elevenlabs', 'ElevenLabs', 'AI voice synthesis and cloning platform. Generate realistic speech in any voice and language.', 'https://elevenlabs.io', 'audio', 'freemium', true, 'https://logo.clearbit.com/elevenlabs.io'),
  ('notion-ai', 'Notion AI', 'AI writing assistant built into Notion. Summarize, brainstorm, translate, and draft content.', 'https://www.notion.so/product/ai', 'writing', 'paid', false, 'https://logo.clearbit.com/notion.so'),
  ('jasper', 'Jasper', 'AI content platform for marketing teams. Generate blog posts, ads, emails, and social content.', 'https://www.jasper.ai', 'writing', 'paid', false, 'https://logo.clearbit.com/jasper.ai'),
  ('suno', 'Suno', 'AI music generator. Create original songs with vocals, instruments, and lyrics from text prompts.', 'https://suno.com', 'audio', 'freemium', false, 'https://logo.clearbit.com/suno.com'),
  ('pika', 'Pika', 'AI video generator that creates and edits videos from text or images with cinematic quality.', 'https://pika.art', 'video', 'freemium', false, 'https://logo.clearbit.com/pika.art'),
  ('copilot', 'GitHub Copilot', 'AI pair programmer by GitHub. Suggests code completions, generates functions, and writes tests.', 'https://github.com/features/copilot', 'coding', 'paid', true, 'https://logo.clearbit.com/github.com'),
  ('gemini', 'Google Gemini', 'Google multimodal AI assistant. Chat, analyze images, generate code, and search the web.', 'https://gemini.google.com', 'chatbot', 'freemium', true, 'https://logo.clearbit.com/gemini.google.com'),
  ('sora', 'Sora', 'OpenAI text-to-video model. Generate realistic and imaginative video scenes from text descriptions.', 'https://openai.com/sora', 'video', 'paid', false, 'https://logo.clearbit.com/openai.com'),
  ('leonardo', 'Leonardo AI', 'AI image generation platform with fine-tuned models for game assets, concept art, and design.', 'https://leonardo.ai', 'image', 'freemium', false, 'https://logo.clearbit.com/leonardo.ai'),
  ('v0', 'v0 by Vercel', 'AI-powered UI generator. Describe a component and get production-ready React code instantly.', 'https://v0.dev', 'coding', 'freemium', false, 'https://logo.clearbit.com/v0.dev'),
  ('huggingface', 'Hugging Face', 'Open-source AI platform. Access thousands of models, datasets, and spaces for ML projects.', 'https://huggingface.co', 'platform', 'free', false, 'https://logo.clearbit.com/huggingface.co'),
  ('ideogram', 'Ideogram', 'AI image generator specialized in accurate text rendering within images and creative design.', 'https://ideogram.ai', 'image', 'freemium', false, 'https://logo.clearbit.com/ideogram.ai'),
  ('gamma', 'Gamma', 'AI-powered presentation and document creator. Generate polished slides and docs from a prompt.', 'https://gamma.app', 'productivity', 'freemium', false, 'https://logo.clearbit.com/gamma.app'),
  ('otter', 'Otter.ai', 'AI meeting assistant. Transcribe, summarize, and extract action items from meetings automatically.', 'https://otter.ai', 'productivity', 'freemium', false, 'https://logo.clearbit.com/otter.ai'),
  ('replicate', 'Replicate', 'Cloud platform to run open-source AI models via API. Deploy ML models without managing infrastructure.', 'https://replicate.com', 'platform', 'paid', false, 'https://logo.clearbit.com/replicate.com'),
  ('descript', 'Descript', 'AI-powered video and audio editor. Edit media by editing text transcripts — like editing a document.', 'https://www.descript.com', 'video', 'freemium', false, 'https://logo.clearbit.com/descript.com'),
  ('anthropic-claude', 'Claude (API)', 'Anthropic Claude API for developers. Build AI applications with advanced reasoning and analysis.', 'https://www.anthropic.com/api', 'platform', 'paid', false, 'https://logo.clearbit.com/anthropic.com')
ON CONFLICT (slug) DO NOTHING;

-- Ajouter les traductions FR pour les nouveaux outils
INSERT INTO tool_translations (tool_id, locale, name, description)
SELECT t.id, 'fr', t.name,
  CASE t.slug
    WHEN 'perplexity' THEN 'Moteur de recherche alimenté par l''IA qui fournit des réponses précises et citées aux questions complexes en temps réel.'
    WHEN 'cursor' THEN 'Éditeur de code IA basé sur VS Code. Autocomplétion, chat et génération de code par IA pour les développeurs.'
    WHEN 'runway' THEN 'Suite créative IA pour la génération vidéo, l''édition d''images et la création de contenu multimédia.'
    WHEN 'elevenlabs' THEN 'Plateforme de synthèse et de clonage vocal par IA. Générez un discours réaliste dans n''importe quelle voix et langue.'
    WHEN 'notion-ai' THEN 'Assistant d''écriture IA intégré à Notion. Résumez, brainstormez, traduisez et rédigez du contenu.'
    WHEN 'jasper' THEN 'Plateforme de contenu IA pour les équipes marketing. Générez des articles, des publicités et du contenu social.'
    WHEN 'suno' THEN 'Générateur de musique IA. Créez des chansons originales avec voix, instruments et paroles à partir de prompts.'
    WHEN 'pika' THEN 'Générateur vidéo IA qui crée et édite des vidéos à partir de texte ou d''images avec une qualité cinématographique.'
    WHEN 'copilot' THEN 'Programmeur IA par GitHub. Suggère du code, génère des fonctions et écrit des tests automatiquement.'
    WHEN 'gemini' THEN 'Assistant IA multimodal de Google. Chat, analyse d''images, génération de code et recherche web.'
    WHEN 'sora' THEN 'Modèle texte-vers-vidéo d''OpenAI. Générez des scènes vidéo réalistes à partir de descriptions textuelles.'
    WHEN 'leonardo' THEN 'Plateforme de génération d''images IA avec des modèles pour les assets de jeux, l''art conceptuel et le design.'
    WHEN 'v0' THEN 'Générateur d''interface utilisateur par IA. Décrivez un composant et obtenez du code React prêt pour la production.'
    WHEN 'huggingface' THEN 'Plateforme IA open-source. Accédez à des milliers de modèles, datasets et espaces pour vos projets ML.'
    WHEN 'ideogram' THEN 'Générateur d''images IA spécialisé dans le rendu de texte précis dans les images et le design créatif.'
    WHEN 'gamma' THEN 'Créateur de présentations et documents par IA. Générez des slides et docs soignés à partir d''un prompt.'
    WHEN 'otter' THEN 'Assistant de réunion IA. Transcrivez, résumez et extrayez les actions à suivre de vos réunions.'
    WHEN 'replicate' THEN 'Plateforme cloud pour exécuter des modèles IA open-source via API. Déployez des modèles ML sans infrastructure.'
    WHEN 'descript' THEN 'Éditeur vidéo et audio alimenté par IA. Éditez vos médias en éditant des transcriptions textuelles.'
    WHEN 'anthropic-claude' THEN 'API Claude d''Anthropic pour les développeurs. Construisez des applications IA avec un raisonnement avancé.'
    ELSE t.description
  END
FROM ai_tools t
WHERE t.slug IN ('perplexity','cursor','runway','elevenlabs','notion-ai','jasper','suno','pika','copilot','gemini','sora','leonardo','v0','huggingface','ideogram','gamma','otter','replicate','descript','anthropic-claude')
AND NOT EXISTS (SELECT 1 FROM tool_translations tt WHERE tt.tool_id = t.id AND tt.locale = 'fr');

-- Ajouter les traductions ES pour les nouveaux outils
INSERT INTO tool_translations (tool_id, locale, name, description)
SELECT t.id, 'es', t.name,
  CASE t.slug
    WHEN 'perplexity' THEN 'Motor de búsqueda impulsado por IA que proporciona respuestas precisas y citadas a preguntas complejas en tiempo real.'
    WHEN 'cursor' THEN 'Editor de código IA basado en VS Code. Autocompletado, chat y generación de código por IA para desarrolladores.'
    WHEN 'runway' THEN 'Suite creativa de IA para generación de video, edición de imágenes y creación de contenido multimedia.'
    WHEN 'elevenlabs' THEN 'Plataforma de síntesis y clonación de voz por IA. Genera discurso realista en cualquier voz e idioma.'
    WHEN 'notion-ai' THEN 'Asistente de escritura IA integrado en Notion. Resume, genera ideas, traduce y redacta contenido.'
    WHEN 'jasper' THEN 'Plataforma de contenido IA para equipos de marketing. Genera artículos, anuncios y contenido social.'
    WHEN 'suno' THEN 'Generador de música IA. Crea canciones originales con voces, instrumentos y letras a partir de prompts.'
    WHEN 'pika' THEN 'Generador de video IA que crea y edita videos a partir de texto o imágenes con calidad cinematográfica.'
    WHEN 'copilot' THEN 'Programador IA de GitHub. Sugiere código, genera funciones y escribe pruebas automáticamente.'
    WHEN 'gemini' THEN 'Asistente IA multimodal de Google. Chat, análisis de imágenes, generación de código y búsqueda web.'
    WHEN 'sora' THEN 'Modelo texto-a-video de OpenAI. Genera escenas de video realistas a partir de descripciones textuales.'
    WHEN 'leonardo' THEN 'Plataforma de generación de imágenes IA con modelos para assets de juegos, arte conceptual y diseño.'
    WHEN 'v0' THEN 'Generador de interfaces de usuario por IA. Describe un componente y obtén código React listo para producción.'
    WHEN 'huggingface' THEN 'Plataforma IA de código abierto. Accede a miles de modelos, datasets y espacios para proyectos de ML.'
    WHEN 'ideogram' THEN 'Generador de imágenes IA especializado en renderizado preciso de texto en imágenes y diseño creativo.'
    WHEN 'gamma' THEN 'Creador de presentaciones y documentos por IA. Genera diapositivas y docs pulidos a partir de un prompt.'
    WHEN 'otter' THEN 'Asistente de reuniones IA. Transcribe, resume y extrae acciones a seguir de tus reuniones automáticamente.'
    WHEN 'replicate' THEN 'Plataforma cloud para ejecutar modelos IA de código abierto vía API. Despliega modelos ML sin infraestructura.'
    WHEN 'descript' THEN 'Editor de video y audio impulsado por IA. Edita tus medios editando transcripciones de texto.'
    WHEN 'anthropic-claude' THEN 'API Claude de Anthropic para desarrolladores. Construye aplicaciones IA con razonamiento avanzado.'
    ELSE t.description
  END
FROM ai_tools t
WHERE t.slug IN ('perplexity','cursor','runway','elevenlabs','notion-ai','jasper','suno','pika','copilot','gemini','sora','leonardo','v0','huggingface','ideogram','gamma','otter','replicate','descript','anthropic-claude')
AND NOT EXISTS (SELECT 1 FROM tool_translations tt WHERE tt.tool_id = t.id AND tt.locale = 'es');
