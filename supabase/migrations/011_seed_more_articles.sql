-- ============================================================
-- Migration 011: Seed more articles with translations
-- ============================================================

-- On récupère l'admin (Benjamin)
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM users WHERE email = 'squad4me.project@gmail.com' LIMIT 1;

  IF admin_id IS NULL THEN
    RAISE NOTICE 'Admin not found, skipping article seed.';
    RETURN;
  END IF;

  -- Article 4: Top 10 Free AI Tools
  INSERT INTO articles (slug, author_id, is_published, published_at)
  VALUES ('top-10-free-ai-tools-2026', admin_id, true, NOW() - INTERVAL '2 days')
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
  SELECT a.id, 'en',
    'Top 10 Free AI Tools You Should Try in 2026',
    'Discover the best free AI tools available right now — from image generation to coding assistants.',
    E'## Why Free AI Tools Matter\n\nThe AI landscape has evolved dramatically. Many powerful tools now offer generous free tiers that rival paid alternatives from just a year ago.\n\n## 1. ChatGPT (Free Tier)\nOpenAI''s flagship chatbot remains one of the most versatile AI assistants. The free tier now includes GPT-4o mini with web browsing.\n\n## 2. Claude by Anthropic\nKnown for its thoughtful, nuanced responses and excellent coding abilities. The free tier is surprisingly generous.\n\n## 3. Hugging Face\nThe GitHub of machine learning. Access thousands of open-source models, datasets, and spaces — completely free.\n\n## 4. Midjourney (Free Trial)\nStill the gold standard for AI art. The limited free trial lets you create 25 images to test the platform.\n\n## 5. Perplexity AI\nAn AI-powered search engine that provides sourced answers. 5 free Pro searches per day.\n\n## 6. Gamma\nCreate beautiful presentations from a simple prompt. The free tier includes unlimited AI-generated slides.\n\n## 7. ElevenLabs\nGenerate realistic AI voices for free. Perfect for content creators and podcasters.\n\n## 8. Leonardo AI\nA powerful alternative to Midjourney with 150 free image generations per day.\n\n## 9. Suno\nCreate original songs with AI — vocals, instruments, and lyrics included. 10 free songs per day.\n\n## 10. v0 by Vercel\nDescribe a UI component and get production-ready React code. Essential for developers.\n\n## Conclusion\nThe best time to explore AI tools is now. Most offer free tiers that are more than enough to get started.',
    'Top 10 Free AI Tools 2026 | Synapse',
    'Discover the best free AI tools in 2026: ChatGPT, Claude, Midjourney, Perplexity, and more.'
  FROM articles a WHERE a.slug = 'top-10-free-ai-tools-2026'
  AND NOT EXISTS (SELECT 1 FROM article_translations WHERE article_id = a.id AND locale = 'en');

  INSERT INTO article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
  SELECT a.id, 'fr',
    'Top 10 des outils IA gratuits à essayer en 2026',
    'Découvrez les meilleurs outils IA gratuits disponibles — de la génération d''images aux assistants de codage.',
    E'## Pourquoi les outils IA gratuits comptent\n\nLe paysage de l''IA a considérablement évolué. De nombreux outils puissants offrent maintenant des niveaux gratuits généreux.\n\n## 1. ChatGPT (Gratuit)\nLe chatbot phare d''OpenAI reste l''un des assistants IA les plus polyvalents.\n\n## 2. Claude par Anthropic\nConnu pour ses réponses nuancées et ses excellentes capacités de codage.\n\n## 3. Hugging Face\nLe GitHub du machine learning. Accédez à des milliers de modèles open-source gratuitement.\n\n## 4. Midjourney (Essai gratuit)\nToujours la référence pour l''art IA. L''essai gratuit permet de créer 25 images.\n\n## 5. Perplexity AI\nUn moteur de recherche IA qui fournit des réponses sourcées.\n\n## 6. Gamma\nCréez de belles présentations à partir d''un simple prompt.\n\n## 7. ElevenLabs\nGénérez des voix IA réalistes gratuitement.\n\n## 8. Leonardo AI\nUne alternative puissante à Midjourney avec 150 générations gratuites par jour.\n\n## 9. Suno\nCréez des chansons originales avec l''IA.\n\n## 10. v0 par Vercel\nDécrivez un composant UI et obtenez du code React prêt pour la production.\n\n## Conclusion\nLe meilleur moment pour explorer les outils IA, c''est maintenant.',
    'Top 10 outils IA gratuits 2026 | Synapse',
    'Découvrez les meilleurs outils IA gratuits en 2026.'
  FROM articles a WHERE a.slug = 'top-10-free-ai-tools-2026'
  AND NOT EXISTS (SELECT 1 FROM article_translations WHERE article_id = a.id AND locale = 'fr');

  INSERT INTO article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
  SELECT a.id, 'es',
    'Los 10 mejores herramientas de IA gratuitas para probar en 2026',
    'Descubre las mejores herramientas de IA gratuitas disponibles — desde generación de imágenes hasta asistentes de codificación.',
    E'## Por qué importan las herramientas de IA gratuitas\n\nEl panorama de la IA ha evolucionado dramáticamente. Muchas herramientas potentes ahora ofrecen niveles gratuitos generosos.\n\n## 1. ChatGPT (Gratis)\nEl chatbot insignia de OpenAI sigue siendo uno de los asistentes más versátiles.\n\n## 2. Claude de Anthropic\nConocido por sus respuestas matizadas y excelentes capacidades de codificación.\n\n## 3. Hugging Face\nEl GitHub del aprendizaje automático. Miles de modelos de código abierto gratis.\n\n## 4. Midjourney (Prueba gratuita)\nSigue siendo el estándar para el arte IA.\n\n## 5. Perplexity AI\nUn motor de búsqueda IA con respuestas citadas.\n\n## 6. Gamma\nCrea presentaciones hermosas desde un prompt.\n\n## 7. ElevenLabs\nGenera voces IA realistas gratis.\n\n## 8. Leonardo AI\nAlternativa a Midjourney con 150 generaciones gratuitas por día.\n\n## 9. Suno\nCrea canciones originales con IA.\n\n## 10. v0 de Vercel\nDescribe un componente UI y obtén código React listo.\n\n## Conclusión\nEl mejor momento para explorar herramientas de IA es ahora.',
    'Top 10 herramientas IA gratuitas 2026 | Synapse',
    'Descubre las mejores herramientas de IA gratuitas en 2026.'
  FROM articles a WHERE a.slug = 'top-10-free-ai-tools-2026'
  AND NOT EXISTS (SELECT 1 FROM article_translations WHERE article_id = a.id AND locale = 'es');

  -- Article 5: How AI Is Changing Education
  INSERT INTO articles (slug, author_id, is_published, published_at)
  VALUES ('how-ai-is-changing-education', admin_id, true, NOW() - INTERVAL '4 days')
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
  SELECT a.id, 'en',
    'How AI Is Transforming Education in 2026',
    'From personalized tutoring to automated grading, AI is reshaping how we learn and teach.',
    E'## The Education Revolution\n\nArtificial intelligence is fundamentally changing education at every level. From elementary schools to universities, AI tools are creating personalized learning experiences that were impossible just a few years ago.\n\n## Personalized Learning at Scale\n\nAI tutors like Khan Academy''s Khanmigo can now adapt to each student''s pace and learning style, providing one-on-one attention that was previously only available through private tutoring.\n\n## Automated Assessment\n\nTeachers spend an average of 10 hours per week grading. AI tools can now provide instant feedback on essays, code assignments, and even creative projects.\n\n## Language Learning Revolution\n\nAI conversation partners have made language learning more accessible than ever. Tools like Duolingo Max use GPT-4 to create realistic conversation practice.\n\n## The Challenges\n\nNot everything is positive. Concerns about academic integrity, the digital divide, and over-reliance on technology remain valid.\n\n## Looking Forward\n\nThe future of education is hybrid: AI handles personalization and repetitive tasks while human teachers focus on inspiration, mentorship, and critical thinking.',
    'How AI Is Changing Education | Synapse',
    'Discover how AI is transforming education with personalized learning, automated grading, and more.'
  FROM articles a WHERE a.slug = 'how-ai-is-changing-education'
  AND NOT EXISTS (SELECT 1 FROM article_translations WHERE article_id = a.id AND locale = 'en');

  INSERT INTO article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
  SELECT a.id, 'fr',
    'Comment l''IA transforme l''éducation en 2026',
    'Du tutorat personnalisé à la correction automatique, l''IA révolutionne notre façon d''apprendre et d''enseigner.',
    E'## La révolution de l''éducation\n\nL''intelligence artificielle change fondamentalement l''éducation à tous les niveaux.\n\n## Apprentissage personnalisé\n\nLes tuteurs IA peuvent maintenant s''adapter au rythme et au style de chaque étudiant.\n\n## Évaluation automatisée\n\nLes enseignants passent en moyenne 10 heures par semaine à corriger. L''IA peut fournir un feedback instantané.\n\n## Révolution de l''apprentissage des langues\n\nLes partenaires de conversation IA ont rendu l''apprentissage des langues plus accessible.\n\n## Les défis\n\nLes préoccupations concernant l''intégrité académique et la fracture numérique restent valides.\n\n## Perspectives\n\nL''avenir de l''éducation est hybride.',
    'Comment l''IA transforme l''éducation | Synapse',
    'Découvrez comment l''IA transforme l''éducation.'
  FROM articles a WHERE a.slug = 'how-ai-is-changing-education'
  AND NOT EXISTS (SELECT 1 FROM article_translations WHERE article_id = a.id AND locale = 'fr');

  INSERT INTO article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
  SELECT a.id, 'es',
    'Cómo la IA está transformando la educación en 2026',
    'Desde tutorías personalizadas hasta calificación automatizada, la IA está cambiando cómo aprendemos.',
    E'## La revolución educativa\n\nLa inteligencia artificial está cambiando la educación en todos los niveles.\n\n## Aprendizaje personalizado\n\nLos tutores IA se adaptan al ritmo de cada estudiante.\n\n## Evaluación automatizada\n\nLa IA proporciona retroalimentación instantánea.\n\n## Revolución en el aprendizaje de idiomas\n\nLos compañeros de conversación IA han hecho el aprendizaje más accesible.\n\n## Desafíos\n\nLas preocupaciones sobre integridad académica siguen vigentes.\n\n## Perspectivas\n\nEl futuro de la educación es híbrido.',
    'Cómo la IA transforma la educación | Synapse',
    'Descubre cómo la IA está transformando la educación.'
  FROM articles a WHERE a.slug = 'how-ai-is-changing-education'
  AND NOT EXISTS (SELECT 1 FROM article_translations WHERE article_id = a.id AND locale = 'es');

  -- Article 6: AI for Small Business
  INSERT INTO articles (slug, author_id, is_published, published_at)
  VALUES ('ai-tools-for-small-business', admin_id, true, NOW() - INTERVAL '6 days')
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
  SELECT a.id, 'en',
    '7 AI Tools Every Small Business Should Use',
    'Save time and money with these essential AI tools designed for entrepreneurs and small teams.',
    E'## AI Levels the Playing Field\n\nSmall businesses can now access AI capabilities that were once exclusive to large corporations.\n\n## 1. ChatGPT / Claude for Customer Service\nSet up an AI chatbot to handle common customer questions 24/7.\n\n## 2. Jasper for Marketing Content\nGenerate blog posts, social media content, and email campaigns in minutes.\n\n## 3. Canva AI for Design\nCreate professional graphics, logos, and marketing materials without a designer.\n\n## 4. Otter.ai for Meeting Notes\nNever miss an action item again with AI-powered meeting transcription.\n\n## 5. QuickBooks AI for Accounting\nAutomate bookkeeping, expense tracking, and financial forecasting.\n\n## 6. Grammarly for Communication\nEnsure every email and document is polished and professional.\n\n## 7. Zapier AI for Automation\nConnect your tools and automate repetitive workflows without coding.\n\n## Getting Started\nStart with one or two tools that address your biggest pain points, then expand as you see results.',
    '7 AI Tools for Small Business | Synapse',
    'Essential AI tools for small businesses: customer service, marketing, design, and more.'
  FROM articles a WHERE a.slug = 'ai-tools-for-small-business'
  AND NOT EXISTS (SELECT 1 FROM article_translations WHERE article_id = a.id AND locale = 'en');

  INSERT INTO article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
  SELECT a.id, 'fr',
    '7 outils IA indispensables pour les petites entreprises',
    'Gagnez du temps et de l''argent avec ces outils IA essentiels pour les entrepreneurs.',
    E'## L''IA égalise les chances\n\nLes petites entreprises peuvent désormais accéder à des capacités IA autrefois réservées aux grandes entreprises.\n\n## 1. ChatGPT / Claude pour le service client\nMettez en place un chatbot IA 24/7.\n\n## 2. Jasper pour le contenu marketing\nGénérez des articles et des campagnes email en quelques minutes.\n\n## 3. Canva IA pour le design\nCréez des visuels professionnels sans graphiste.\n\n## 4. Otter.ai pour les réunions\nNe manquez plus jamais une action à suivre.\n\n## 5. QuickBooks IA pour la comptabilité\nAutomatisez la tenue de livres.\n\n## 6. Grammarly pour la communication\nAssurez que chaque email soit impeccable.\n\n## 7. Zapier IA pour l''automatisation\nConnectez vos outils sans coder.\n\n## Pour commencer\nCommencez par un ou deux outils.',
    '7 outils IA pour petites entreprises | Synapse',
    'Outils IA essentiels pour les petites entreprises.'
  FROM articles a WHERE a.slug = 'ai-tools-for-small-business'
  AND NOT EXISTS (SELECT 1 FROM article_translations WHERE article_id = a.id AND locale = 'fr');

  INSERT INTO article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
  SELECT a.id, 'es',
    '7 herramientas de IA para pequeñas empresas',
    'Ahorra tiempo y dinero con estas herramientas esenciales de IA para emprendedores.',
    E'## La IA iguala las condiciones\n\nLas pequeñas empresas ahora pueden acceder a capacidades de IA antes exclusivas de grandes corporaciones.\n\n## 1. ChatGPT / Claude para servicio al cliente\n## 2. Jasper para contenido de marketing\n## 3. Canva IA para diseño\n## 4. Otter.ai para reuniones\n## 5. QuickBooks IA para contabilidad\n## 6. Grammarly para comunicación\n## 7. Zapier IA para automatización\n\n## Para empezar\nComienza con una o dos herramientas.',
    '7 herramientas IA para pequeñas empresas | Synapse',
    'Herramientas IA esenciales para pequeñas empresas.'
  FROM articles a WHERE a.slug = 'ai-tools-for-small-business'
  AND NOT EXISTS (SELECT 1 FROM article_translations WHERE article_id = a.id AND locale = 'es');

  -- Article 7: The Ethics of AI Art
  INSERT INTO articles (slug, author_id, is_published, published_at)
  VALUES ('ethics-of-ai-generated-art', admin_id, true, NOW() - INTERVAL '8 days')
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
  SELECT a.id, 'en',
    'The Ethics of AI-Generated Art: Where Do We Draw the Line?',
    'AI art raises important questions about creativity, copyright, and the future of human artists.',
    E'## A New Creative Frontier\n\nAI image generators like Midjourney, DALL-E, and Stable Diffusion have democratized visual creation. Anyone can now produce stunning artwork in seconds. But at what cost?\n\n## The Copyright Debate\n\nAI models are trained on billions of images, many created by human artists who never consented to their work being used as training data. Several lawsuits are currently challenging this practice.\n\n## Impact on Professional Artists\n\nMany illustrators, concept artists, and graphic designers report losing work to AI-generated alternatives. Some studios now use AI for tasks that once employed dozens of artists.\n\n## The Authenticity Question\n\nIs AI-generated art really "art"? While the tool is new, the creative intent behind the prompt still comes from a human mind.\n\n## Finding Balance\n\nThe key is not to ban AI art but to ensure fair compensation for training data artists and transparency about AI involvement.\n\n## Conclusion\n\nAI art is here to stay. The question is how we integrate it ethically into our creative ecosystem.',
    'Ethics of AI Art | Synapse',
    'Exploring the ethics of AI-generated art: copyright, creativity, and the impact on human artists.'
  FROM articles a WHERE a.slug = 'ethics-of-ai-generated-art'
  AND NOT EXISTS (SELECT 1 FROM article_translations WHERE article_id = a.id AND locale = 'en');

  INSERT INTO article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
  SELECT a.id, 'fr',
    'L''éthique de l''art généré par IA : où tracer la ligne ?',
    'L''art IA soulève des questions sur la créativité, le droit d''auteur et l''avenir des artistes.',
    E'## Une nouvelle frontière créative\n\nLes générateurs d''images IA ont démocratisé la création visuelle. Mais à quel prix ?\n\n## Le débat sur le droit d''auteur\n\nLes modèles IA sont entraînés sur des milliards d''images, souvent sans le consentement des artistes.\n\n## L''impact sur les artistes professionnels\n\nDe nombreux illustrateurs signalent une perte de travail au profit de l''IA.\n\n## La question de l''authenticité\n\nL''art généré par IA est-il vraiment de l''art ?\n\n## Trouver l''équilibre\n\nLa clé n''est pas d''interdire l''art IA mais d''assurer une compensation équitable.\n\n## Conclusion\n\nL''art IA est là pour rester.',
    'Éthique de l''art IA | Synapse',
    'L''éthique de l''art généré par IA.'
  FROM articles a WHERE a.slug = 'ethics-of-ai-generated-art'
  AND NOT EXISTS (SELECT 1 FROM article_translations WHERE article_id = a.id AND locale = 'fr');

  INSERT INTO article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
  SELECT a.id, 'es',
    'La ética del arte generado por IA: ¿dónde trazamos la línea?',
    'El arte IA plantea preguntas sobre creatividad, derechos de autor y el futuro de los artistas.',
    E'## Una nueva frontera creativa\n\nLos generadores de imágenes IA han democratizado la creación visual. ¿Pero a qué costo?\n\n## El debate sobre derechos de autor\n\nLos modelos IA se entrenan con miles de millones de imágenes sin consentimiento.\n\n## Impacto en artistas profesionales\n\nMuchos ilustradores reportan pérdida de trabajo.\n\n## La pregunta de la autenticidad\n\n¿Es el arte generado por IA realmente arte?\n\n## Encontrar el equilibrio\n\nLa clave es asegurar compensación justa.\n\n## Conclusión\n\nEl arte IA llegó para quedarse.',
    'Ética del arte IA | Synapse',
    'La ética del arte generado por IA.'
  FROM articles a WHERE a.slug = 'ethics-of-ai-generated-art'
  AND NOT EXISTS (SELECT 1 FROM article_translations WHERE article_id = a.id AND locale = 'es');

  -- Article 8: Beginner's Guide to Prompt Engineering
  INSERT INTO articles (slug, author_id, is_published, published_at)
  VALUES ('beginners-guide-prompt-engineering', admin_id, true, NOW() - INTERVAL '10 days')
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
  SELECT a.id, 'en',
    'Prompt Engineering 101: A Beginner''s Guide to Getting Better AI Results',
    'Learn the fundamentals of prompt engineering to get dramatically better results from any AI tool.',
    E'## What Is Prompt Engineering?\n\nPrompt engineering is the art of crafting instructions that get the best possible output from AI models. Think of it as learning to communicate effectively with a very capable but literal assistant.\n\n## The Basic Framework\n\n### 1. Be Specific\nBad: "Write something about dogs"\nGood: "Write a 200-word blog post about the top 3 benefits of adopting senior dogs, targeting first-time pet owners"\n\n### 2. Provide Context\nTell the AI who it should be, who the audience is, and what the goal is.\n\n### 3. Use Examples\nShowing the AI what you want (few-shot prompting) is often more effective than describing it.\n\n### 4. Iterate\nYour first prompt is rarely your best. Refine based on results.\n\n## Advanced Techniques\n\n### Chain-of-Thought\nAsk the AI to "think step by step" for complex reasoning tasks.\n\n### Role Playing\n"You are a senior software engineer reviewing this code..."\n\n### Output Formatting\nSpecify the exact format: JSON, markdown, bullet points, table, etc.\n\n## Practice Makes Perfect\n\nThe best way to improve is to experiment. Try different approaches and see what works.',
    'Prompt Engineering Guide | Synapse',
    'Learn prompt engineering fundamentals to get better results from ChatGPT, Claude, and other AI tools.'
  FROM articles a WHERE a.slug = 'beginners-guide-prompt-engineering'
  AND NOT EXISTS (SELECT 1 FROM article_translations WHERE article_id = a.id AND locale = 'en');

  INSERT INTO article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
  SELECT a.id, 'fr',
    'Prompt Engineering 101 : Guide du débutant pour de meilleurs résultats IA',
    'Apprenez les bases du prompt engineering pour obtenir des résultats drastiquement meilleurs de n''importe quel outil IA.',
    E'## Qu''est-ce que le Prompt Engineering ?\n\nLe prompt engineering est l''art de formuler des instructions pour obtenir le meilleur résultat possible des modèles IA.\n\n## Le cadre de base\n\n### 1. Soyez spécifique\nMauvais : "Écris quelque chose sur les chiens"\nBon : "Écris un article de 200 mots sur les 3 avantages d''adopter un chien senior"\n\n### 2. Fournissez du contexte\n\n### 3. Utilisez des exemples\n\n### 4. Itérez\n\n## Techniques avancées\n\n### Chain-of-Thought\nDemandez à l''IA de "réfléchir étape par étape".\n\n### Jeu de rôle\n"Tu es un ingénieur senior qui revoit ce code..."\n\n### Format de sortie\nSpécifiez le format : JSON, markdown, tableaux, etc.\n\n## La pratique rend parfait\n\nLa meilleure façon de s''améliorer est d''expérimenter.',
    'Guide Prompt Engineering | Synapse',
    'Apprenez les bases du prompt engineering.'
  FROM articles a WHERE a.slug = 'beginners-guide-prompt-engineering'
  AND NOT EXISTS (SELECT 1 FROM article_translations WHERE article_id = a.id AND locale = 'fr');

  INSERT INTO article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
  SELECT a.id, 'es',
    'Prompt Engineering 101: Guía para principiantes para mejores resultados de IA',
    'Aprende los fundamentos del prompt engineering para obtener mejores resultados de cualquier herramienta de IA.',
    E'## ¿Qué es el Prompt Engineering?\n\nEl prompt engineering es el arte de crear instrucciones para obtener el mejor resultado posible de los modelos de IA.\n\n## El marco básico\n\n### 1. Sé específico\n### 2. Proporciona contexto\n### 3. Usa ejemplos\n### 4. Itera\n\n## Técnicas avanzadas\n\n### Chain-of-Thought\n### Juego de roles\n### Formato de salida\n\n## La práctica hace al maestro\n\nLa mejor forma de mejorar es experimentar.',
    'Guía Prompt Engineering | Synapse',
    'Aprende los fundamentos del prompt engineering.'
  FROM articles a WHERE a.slug = 'beginners-guide-prompt-engineering'
  AND NOT EXISTS (SELECT 1 FROM article_translations WHERE article_id = a.id AND locale = 'es');

END $$;
