-- Migration: Tool translations + logo fixes
-- Adds i18n support for AI tools and fixes broken logo URLs

-- ============================================================
-- 1. Tool translations table
-- ============================================================
CREATE TABLE public.tool_translations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id uuid REFERENCES public.ai_tools(id) ON DELETE CASCADE NOT NULL,
  locale text NOT NULL CHECK (locale IN ('en', 'fr', 'es')),
  name text NOT NULL,
  description text NOT NULL,
  UNIQUE (tool_id, locale)
);

CREATE INDEX idx_tool_translations_locale ON public.tool_translations(tool_id, locale);

-- RLS
ALTER TABLE public.tool_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.tool_translations FOR SELECT USING (true);

-- GRANT permissions
GRANT SELECT ON public.tool_translations TO anon, authenticated;
GRANT ALL ON public.tool_translations TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.tool_translations TO authenticated;

-- ============================================================
-- 2. Fix broken logo URLs (use Clearbit Logo API)
-- ============================================================
UPDATE public.ai_tools SET logo_url = 'https://logo.clearbit.com/openai.com'    WHERE slug = 'chatgpt';
UPDATE public.ai_tools SET logo_url = 'https://logo.clearbit.com/anthropic.com' WHERE slug = 'claude';
UPDATE public.ai_tools SET logo_url = 'https://logo.clearbit.com/midjourney.com' WHERE slug = 'midjourney';
UPDATE public.ai_tools SET logo_url = 'https://logo.clearbit.com/openai.com'    WHERE slug = 'dall-e';
UPDATE public.ai_tools SET logo_url = 'https://logo.clearbit.com/cursor.com'    WHERE slug = 'cursor';
UPDATE public.ai_tools SET logo_url = 'https://logo.clearbit.com/perplexity.ai' WHERE slug = 'perplexity';
UPDATE public.ai_tools SET logo_url = 'https://logo.clearbit.com/runwayml.com'  WHERE slug = 'runway';
UPDATE public.ai_tools SET logo_url = 'https://logo.clearbit.com/notion.so'     WHERE slug = 'notion-ai';

-- ============================================================
-- 3. French translations for all 8 tools
-- ============================================================
INSERT INTO public.tool_translations (tool_id, locale, name, description)
SELECT id, 'fr', 'ChatGPT',
  'Assistant IA conversationnel d''OpenAI propulsé par GPT-4o. Excelle en rédaction, analyse, programmation et tâches créatives avec prise en charge des plugins, génération d''images et navigation web.'
FROM public.ai_tools WHERE slug = 'chatgpt';

INSERT INTO public.tool_translations (tool_id, locale, name, description)
SELECT id, 'fr', 'Claude',
  'Assistant IA d''Anthropic reconnu pour son raisonnement nuancé, sa compréhension de contextes longs jusqu''à 200K tokens et ses capacités exceptionnelles en programmation. Disponible via le web, l''API et Claude Code en ligne de commande.'
FROM public.ai_tools WHERE slug = 'claude';

INSERT INTO public.tool_translations (tool_id, locale, name, description)
SELECT id, 'fr', 'Midjourney',
  'Outil de génération d''images par IA leader du marché, créant des visuels artistiques époustouflants à partir de descriptions textuelles. Réputé pour sa qualité esthétique distinctive et ses capacités photoréalistes.'
FROM public.ai_tools WHERE slug = 'midjourney';

INSERT INTO public.tool_translations (tool_id, locale, name, description)
SELECT id, 'fr', 'DALL-E',
  'Modèle de génération d''images d''OpenAI qui crée des images réalistes et des œuvres d''art à partir de descriptions en langage naturel. Intégré à ChatGPT Plus et disponible via l''API pour les développeurs.'
FROM public.ai_tools WHERE slug = 'dall-e';

INSERT INTO public.tool_translations (tool_id, locale, name, description)
SELECT id, 'fr', 'Cursor',
  'Éditeur de code propulsé par l''IA, basé sur VS Code, qui intègre des modèles de pointe directement dans votre workflow de développement. Propose l''autocomplétion intelligente, le chat et l''édition contextuelle du code.'
FROM public.ai_tools WHERE slug = 'cursor';

INSERT INTO public.tool_translations (tool_id, locale, name, description)
SELECT id, 'fr', 'Perplexity',
  'Moteur de recherche propulsé par l''IA qui fournit des réponses directes et sourcées aux questions complexes en parcourant le web en temps réel. Combine la précision de la recherche avec la fluidité de l''IA.'
FROM public.ai_tools WHERE slug = 'perplexity';

INSERT INTO public.tool_translations (tool_id, locale, name, description)
SELECT id, 'fr', 'Runway',
  'Plateforme d''IA créative spécialisée dans la génération et le montage vidéo. Son modèle Gen-3 Alpha peut générer des clips vidéo cinématographiques à partir de prompts textuels ou d''images avec une cohérence impressionnante.'
FROM public.ai_tools WHERE slug = 'runway';

INSERT INTO public.tool_translations (tool_id, locale, name, description)
SELECT id, 'fr', 'Notion AI',
  'Assistant IA de rédaction et de productivité intégré à Notion. Aide à rédiger, résumer, traduire et brainstormer directement dans votre espace de travail, avec un accès complet à vos notes et documents.'
FROM public.ai_tools WHERE slug = 'notion-ai';

-- ============================================================
-- 4. Spanish translations for all 8 tools
-- ============================================================
INSERT INTO public.tool_translations (tool_id, locale, name, description)
SELECT id, 'es', 'ChatGPT',
  'Asistente de IA conversacional de OpenAI impulsado por GPT-4o. Destaca en redacción, análisis, programación y tareas creativas con soporte para plugins, generación de imágenes y navegación web.'
FROM public.ai_tools WHERE slug = 'chatgpt';

INSERT INTO public.tool_translations (tool_id, locale, name, description)
SELECT id, 'es', 'Claude',
  'Asistente de IA de Anthropic reconocido por su razonamiento matizado, comprensión de contextos largos de hasta 200K tokens y capacidades excepcionales de programación. Disponible a través de la web, API y Claude Code en línea de comandos.'
FROM public.ai_tools WHERE slug = 'claude';

INSERT INTO public.tool_translations (tool_id, locale, name, description)
SELECT id, 'es', 'Midjourney',
  'Herramienta líder de generación de imágenes por IA que crea visuales artísticos impresionantes a partir de descripciones textuales. Conocida por su calidad estética distintiva y sus capacidades fotorrealistas.'
FROM public.ai_tools WHERE slug = 'midjourney';

INSERT INTO public.tool_translations (tool_id, locale, name, description)
SELECT id, 'es', 'DALL-E',
  'Modelo de generación de imágenes de OpenAI que crea imágenes realistas y arte a partir de descripciones en lenguaje natural. Integrado en ChatGPT Plus y disponible a través de la API para desarrolladores.'
FROM public.ai_tools WHERE slug = 'dall-e';

INSERT INTO public.tool_translations (tool_id, locale, name, description)
SELECT id, 'es', 'Cursor',
  'Editor de código impulsado por IA basado en VS Code que integra modelos de vanguardia directamente en tu flujo de desarrollo. Ofrece autocompletado inteligente, chat y edición contextual del código.'
FROM public.ai_tools WHERE slug = 'cursor';

INSERT INTO public.tool_translations (tool_id, locale, name, description)
SELECT id, 'es', 'Perplexity',
  'Motor de búsqueda impulsado por IA que proporciona respuestas directas y con fuentes a preguntas complejas buscando en la web en tiempo real. Combina la precisión de la búsqueda con la fluidez de la IA.'
FROM public.ai_tools WHERE slug = 'perplexity';

INSERT INTO public.tool_translations (tool_id, locale, name, description)
SELECT id, 'es', 'Runway',
  'Plataforma de IA creativa especializada en generación y edición de video. Su modelo Gen-3 Alpha puede generar clips de video cinematográficos a partir de prompts de texto o imagen con una consistencia impresionante.'
FROM public.ai_tools WHERE slug = 'runway';

INSERT INTO public.tool_translations (tool_id, locale, name, description)
SELECT id, 'es', 'Notion AI',
  'Asistente de IA para redacción y productividad integrado en Notion. Ayuda a redactar, resumir, traducir y hacer lluvia de ideas directamente en tu espacio de trabajo, con acceso completo a tus notas y documentos.'
FROM public.ai_tools WHERE slug = 'notion-ai';
