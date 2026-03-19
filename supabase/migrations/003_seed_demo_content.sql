-- Seed demo content for Synapse platform
-- Run after 001_initial_schema.sql and 002_grant_permissions.sql

-- ============================================================
-- 1. Admin user
-- ============================================================
INSERT INTO public.users (id, email, display_name, avatar_url, bio)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'squad4me.project@gmail.com',
  'Benjamin',
  'https://api.dicebear.com/7.x/initials/svg?seed=Benjamin',
  'Founder of Synapse. Passionate about AI, community building, and making technology accessible to everyone.'
);

-- ============================================================
-- 2. Articles
-- ============================================================

-- Article 1: The Rise of AI Agents
INSERT INTO public.articles (id, slug, author_id, cover_image_url, published_at, is_published)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'rise-of-ai-agents-2025',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80',
  '2025-12-15T10:00:00Z',
  true
);

-- Article 2: ChatGPT vs Claude vs Gemini
INSERT INTO public.articles (id, slug, author_id, cover_image_url, published_at, is_published)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'chatgpt-vs-claude-vs-gemini-comparison',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'https://images.unsplash.com/photo-1684369175833-4b445ad6bfb5?w=1200&q=80',
  '2025-12-20T14:00:00Z',
  true
);

-- Article 3: How to Write Perfect AI Prompts
INSERT INTO public.articles (id, slug, author_id, cover_image_url, published_at, is_published)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'how-to-write-perfect-ai-prompts-beginners-guide',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=1200&q=80',
  '2025-12-28T09:00:00Z',
  true
);

-- ============================================================
-- 3. Article translations
-- ============================================================

-- ----- Article 1: AI Agents — EN -----
INSERT INTO public.article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'en',
  'The Rise of AI Agents in 2025',
  'Autonomous AI agents are transforming the way we work, code, and make decisions. From software engineering to customer support, these intelligent systems are becoming indispensable collaborators.',
  '## What Are AI Agents?

AI agents are autonomous systems that can perceive their environment, make decisions, and take actions to achieve specific goals — all without constant human oversight. Unlike traditional chatbots that respond to single prompts, agents can plan multi-step workflows, use tools, browse the web, write and execute code, and even collaborate with other agents.

## Why 2025 Is the Tipping Point

Several breakthroughs converged this year to make AI agents practical. First, foundation models like Claude, GPT-4, and Gemini reached a level of reasoning that makes reliable tool use possible. Second, frameworks such as LangGraph, CrewAI, and the Anthropic Agent SDK lowered the barrier to building production-grade agents. Third, enterprises started deploying agents in real workflows — from automated code review pipelines to autonomous customer support triage.

## What This Means for You

Whether you are a developer, a product manager, or a startup founder, understanding AI agents is no longer optional. Start by experimenting with simple agent loops: give a model a goal, a set of tools, and a feedback mechanism. You will be surprised how quickly a well-designed agent can outperform a manual workflow. The companies that embrace agentic AI today will have a significant competitive advantage tomorrow.',
  'The Rise of AI Agents in 2025 — Synapse',
  'Discover how autonomous AI agents are reshaping industries in 2025 and why they matter for your career and business.'
);

-- ----- Article 1: AI Agents — FR -----
INSERT INTO public.article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'fr',
  'L''essor des agents IA en 2025',
  'Les agents IA autonomes transforment notre façon de travailler, de coder et de prendre des décisions. Du génie logiciel au support client, ces systèmes intelligents deviennent des collaborateurs indispensables.',
  '## Qu''est-ce qu''un agent IA ?

Les agents IA sont des systèmes autonomes capables de percevoir leur environnement, de prendre des décisions et d''exécuter des actions pour atteindre des objectifs précis — le tout sans supervision humaine constante. Contrairement aux chatbots classiques qui répondent à des requêtes isolées, les agents peuvent planifier des workflows en plusieurs étapes, utiliser des outils, naviguer sur le web, écrire et exécuter du code, et même collaborer avec d''autres agents.

## Pourquoi 2025 est un tournant

Plusieurs avancées ont convergé cette année pour rendre les agents IA viables. Premièrement, les modèles fondamentaux comme Claude, GPT-4 et Gemini ont atteint un niveau de raisonnement qui rend l''utilisation fiable d''outils possible. Deuxièmement, des frameworks comme LangGraph, CrewAI et le SDK Agent d''Anthropic ont simplifié la création d''agents de qualité production. Troisièmement, les entreprises ont commencé à déployer des agents dans des workflows réels — des pipelines de revue de code automatisée au triage autonome du support client.

## Ce que cela signifie pour vous

Que vous soyez développeur, chef de produit ou fondateur de startup, comprendre les agents IA n''est plus optionnel. Commencez par expérimenter avec des boucles d''agents simples : donnez à un modèle un objectif, un ensemble d''outils et un mécanisme de feedback. Vous serez surpris de la rapidité avec laquelle un agent bien conçu peut surpasser un workflow manuel. Les entreprises qui adoptent l''IA agentique aujourd''hui auront un avantage compétitif significatif demain.',
  'L''essor des agents IA en 2025 — Synapse',
  'Découvrez comment les agents IA autonomes transforment les industries en 2025 et pourquoi ils comptent pour votre carrière.'
);

-- ----- Article 1: AI Agents — ES -----
INSERT INTO public.article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'es',
  'El auge de los agentes de IA en 2025',
  'Los agentes de IA autónomos están transformando nuestra forma de trabajar, programar y tomar decisiones. Desde la ingeniería de software hasta la atención al cliente, estos sistemas inteligentes se están convirtiendo en colaboradores indispensables.',
  '## ¿Qué son los agentes de IA?

Los agentes de IA son sistemas autónomos capaces de percibir su entorno, tomar decisiones y ejecutar acciones para alcanzar objetivos específicos, todo sin supervisión humana constante. A diferencia de los chatbots tradicionales que responden a mensajes aislados, los agentes pueden planificar flujos de trabajo de varios pasos, usar herramientas, navegar por la web, escribir y ejecutar código, e incluso colaborar con otros agentes.

## Por qué 2025 es el punto de inflexión

Varios avances convergieron este año para hacer que los agentes de IA sean prácticos. Primero, los modelos fundacionales como Claude, GPT-4 y Gemini alcanzaron un nivel de razonamiento que hace posible el uso fiable de herramientas. Segundo, frameworks como LangGraph, CrewAI y el SDK de Agentes de Anthropic redujeron la barrera para construir agentes de calidad producción. Tercero, las empresas comenzaron a desplegar agentes en flujos de trabajo reales — desde pipelines de revisión de código automatizada hasta triaje autónomo de soporte al cliente.

## Lo que esto significa para ti

Ya seas desarrollador, product manager o fundador de startup, entender los agentes de IA ya no es opcional. Comienza experimentando con bucles de agentes simples: dale a un modelo un objetivo, un conjunto de herramientas y un mecanismo de retroalimentación. Te sorprenderá lo rápido que un agente bien diseñado puede superar un flujo de trabajo manual. Las empresas que adopten la IA agéntica hoy tendrán una ventaja competitiva significativa mañana.',
  'El auge de los agentes de IA en 2025 — Synapse',
  'Descubre cómo los agentes de IA autónomos están transformando las industrias en 2025 y por qué importan para tu carrera.'
);

-- ----- Article 2: Comparison — EN -----
INSERT INTO public.article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'en',
  'ChatGPT vs Claude vs Gemini: Which AI is Best for You?',
  'With so many AI assistants available, choosing the right one can be overwhelming. We compare the three leading models across writing, coding, reasoning, and everyday tasks to help you decide.',
  '## The Big Three in 2025

The AI assistant landscape is dominated by three major players: OpenAI''s ChatGPT (powered by GPT-4o and o1), Anthropic''s Claude (powered by Claude 4 Sonnet and Opus), and Google''s Gemini (powered by Gemini 2.0). Each has distinct strengths that make it better suited for different use cases.

## Head-to-Head Comparison

**Writing & Creativity:** Claude excels at nuanced, long-form writing with a natural tone. ChatGPT is versatile and handles a wide range of creative formats. Gemini integrates well with Google Workspace, making it ideal for drafting emails and documents within that ecosystem.

**Coding:** Claude has emerged as the top choice for developers, especially with Claude Code for terminal-based workflows. ChatGPT''s code interpreter remains powerful for data analysis. Gemini shines when working with Google Cloud and Firebase integrations.

**Reasoning & Analysis:** Claude Opus leads on complex reasoning benchmarks and handles long documents (up to 200K tokens) with remarkable accuracy. GPT-4o is fast and reliable for most tasks. Gemini 2.0 Flash offers the best speed-to-quality ratio for lighter workloads.

## Our Recommendation

There is no single "best" AI — it depends on your workflow. If you write code daily, try Claude. If you need a versatile all-rounder with plugins, ChatGPT is hard to beat. If you live in the Google ecosystem, Gemini will feel like a natural extension of your tools. The best strategy? Try all three with your real tasks and see which one clicks.',
  'ChatGPT vs Claude vs Gemini: AI Comparison 2025 — Synapse',
  'An in-depth comparison of ChatGPT, Claude, and Gemini to help you choose the best AI assistant for your needs.'
);

-- ----- Article 2: Comparison — FR -----
INSERT INTO public.article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'fr',
  'ChatGPT vs Claude vs Gemini : quelle IA choisir ?',
  'Avec autant d''assistants IA disponibles, choisir le bon peut être déroutant. Nous comparons les trois modèles leaders en écriture, codage, raisonnement et tâches quotidiennes pour vous aider à décider.',
  '## Les trois géants en 2025

Le paysage des assistants IA est dominé par trois acteurs majeurs : ChatGPT d''OpenAI (propulsé par GPT-4o et o1), Claude d''Anthropic (propulsé par Claude 4 Sonnet et Opus) et Gemini de Google (propulsé par Gemini 2.0). Chacun possède des forces distinctes qui le rendent mieux adapté à différents cas d''usage.

## Comparaison face à face

**Écriture & Créativité :** Claude excelle dans l''écriture longue et nuancée avec un ton naturel. ChatGPT est polyvalent et gère un large éventail de formats créatifs. Gemini s''intègre parfaitement à Google Workspace, ce qui le rend idéal pour rédiger des emails et documents dans cet écosystème.

**Codage :** Claude s''est imposé comme le choix numéro un des développeurs, notamment avec Claude Code pour les workflows en terminal. L''interpréteur de code de ChatGPT reste puissant pour l''analyse de données. Gemini brille avec les intégrations Google Cloud et Firebase.

**Raisonnement & Analyse :** Claude Opus domine les benchmarks de raisonnement complexe et traite les longs documents (jusqu''à 200K tokens) avec une précision remarquable. GPT-4o est rapide et fiable pour la plupart des tâches. Gemini 2.0 Flash offre le meilleur ratio vitesse/qualité pour les charges légères.

## Notre recommandation

Il n''y a pas de "meilleure" IA unique — tout dépend de votre workflow. Si vous codez quotidiennement, essayez Claude. Si vous cherchez un assistant polyvalent avec des plugins, ChatGPT est difficile à battre. Si vous vivez dans l''écosystème Google, Gemini sera une extension naturelle de vos outils. La meilleure stratégie ? Testez les trois avec vos vraies tâches et voyez lequel vous convient.',
  'ChatGPT vs Claude vs Gemini : comparatif IA 2025 — Synapse',
  'Comparatif approfondi de ChatGPT, Claude et Gemini pour vous aider à choisir le meilleur assistant IA.'
);

-- ----- Article 2: Comparison — ES -----
INSERT INTO public.article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'es',
  'ChatGPT vs Claude vs Gemini: ¿Cuál es la mejor IA para ti?',
  'Con tantos asistentes de IA disponibles, elegir el correcto puede ser abrumador. Comparamos los tres modelos líderes en escritura, programación, razonamiento y tareas cotidianas para ayudarte a decidir.',
  '## Los tres grandes en 2025

El panorama de los asistentes de IA está dominado por tres actores principales: ChatGPT de OpenAI (impulsado por GPT-4o y o1), Claude de Anthropic (impulsado por Claude 4 Sonnet y Opus) y Gemini de Google (impulsado por Gemini 2.0). Cada uno tiene fortalezas distintas que lo hacen más adecuado para diferentes casos de uso.

## Comparación directa

**Escritura y Creatividad:** Claude destaca en escritura larga y matizada con un tono natural. ChatGPT es versátil y maneja una amplia gama de formatos creativos. Gemini se integra perfectamente con Google Workspace, lo que lo hace ideal para redactar correos y documentos en ese ecosistema.

**Programación:** Claude se ha convertido en la opción principal para desarrolladores, especialmente con Claude Code para flujos de trabajo en terminal. El intérprete de código de ChatGPT sigue siendo potente para análisis de datos. Gemini brilla con las integraciones de Google Cloud y Firebase.

**Razonamiento y Análisis:** Claude Opus lidera en benchmarks de razonamiento complejo y procesa documentos largos (hasta 200K tokens) con una precisión notable. GPT-4o es rápido y fiable para la mayoría de tareas. Gemini 2.0 Flash ofrece la mejor relación velocidad/calidad para cargas ligeras.

## Nuestra recomendación

No hay una "mejor" IA única — depende de tu flujo de trabajo. Si programas a diario, prueba Claude. Si necesitas un asistente versátil con plugins, ChatGPT es difícil de superar. Si vives en el ecosistema de Google, Gemini será una extensión natural de tus herramientas. ¿La mejor estrategia? Prueba los tres con tus tareas reales y descubre cuál encaja mejor.',
  'ChatGPT vs Claude vs Gemini: comparativa IA 2025 — Synapse',
  'Comparativa detallada de ChatGPT, Claude y Gemini para ayudarte a elegir el mejor asistente de IA.'
);

-- ----- Article 3: Prompts Guide — EN -----
INSERT INTO public.article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'en',
  'How to Write Perfect AI Prompts: A Beginner''s Guide',
  'The quality of your AI output depends entirely on the quality of your input. Learn the proven techniques that separate vague, disappointing results from precise, powerful responses.',
  '## Why Prompts Matter More Than You Think

Most people treat AI prompts like Google searches — short, vague, and hoping for the best. But modern AI models are far more capable when given clear instructions. The difference between "write me a blog post" and a well-structured prompt can be the difference between generic filler and genuinely useful content. Prompt engineering is not magic; it is a learnable skill.

## The Five Principles of Effective Prompts

**1. Be Specific:** Instead of "help me with marketing," try "write three Instagram caption options for a SaaS product launch targeting small business owners." The more context you provide, the better the output.

**2. Define the Role:** Start with "You are a senior data analyst..." or "Act as a UX copywriter..." to frame the model''s perspective and vocabulary.

**3. Give Examples:** Show the model what you want. Include a sample of the tone, format, or structure you expect. This technique, called few-shot prompting, dramatically improves consistency.

**4. Set Constraints:** Specify word count, format (bullet points, table, JSON), tone (formal, casual), and audience. Constraints focus the output and reduce the need for follow-up edits.

**5. Iterate:** Your first prompt is a draft. Read the output, identify what is missing or wrong, and refine your prompt. The best results come from a conversation, not a single shot.

## Putting It All Together

Here is a template you can adapt for almost any task: "You are [role]. I need you to [task] for [audience]. The output should be [format] and approximately [length]. Here is an example of what I am looking for: [example]. Important constraints: [list constraints]." Start with this structure, and you will immediately see a leap in quality from every AI tool you use.',
  'How to Write Perfect AI Prompts — Synapse',
  'A beginner-friendly guide to writing effective AI prompts that get better results from ChatGPT, Claude, and other AI tools.'
);

-- ----- Article 3: Prompts Guide — FR -----
INSERT INTO public.article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'fr',
  'Comment écrire des prompts IA parfaits : guide du débutant',
  'La qualité de vos résultats IA dépend entièrement de la qualité de vos instructions. Apprenez les techniques éprouvées qui séparent les résultats vagues et décevants des réponses précises et puissantes.',
  '## Pourquoi les prompts comptent plus que vous ne le pensez

La plupart des gens traitent les prompts IA comme des recherches Google — courts, vagues, en espérant que ça marche. Mais les modèles IA modernes sont bien plus performants quand on leur donne des instructions claires. La différence entre "écris-moi un article" et un prompt bien structuré peut être la différence entre du remplissage générique et un contenu véritablement utile. Le prompt engineering n''est pas de la magie ; c''est une compétence qui s''apprend.

## Les cinq principes d''un prompt efficace

**1. Soyez spécifique :** Au lieu de "aide-moi avec le marketing", essayez "écris trois options de légende Instagram pour le lancement d''un produit SaaS ciblant les propriétaires de petites entreprises." Plus vous fournissez de contexte, meilleur sera le résultat.

**2. Définissez le rôle :** Commencez par "Tu es un analyste de données senior..." ou "Agis comme un rédacteur UX..." pour cadrer la perspective et le vocabulaire du modèle.

**3. Donnez des exemples :** Montrez au modèle ce que vous attendez. Incluez un échantillon du ton, du format ou de la structure souhaitée. Cette technique, appelée few-shot prompting, améliore considérablement la cohérence.

**4. Fixez des contraintes :** Précisez le nombre de mots, le format (puces, tableau, JSON), le ton (formel, décontracté) et l''audience. Les contraintes focalisent le résultat et réduisent les retouches.

**5. Itérez :** Votre premier prompt est un brouillon. Lisez le résultat, identifiez ce qui manque ou ce qui ne va pas, et affinez votre prompt. Les meilleurs résultats viennent d''une conversation, pas d''un seul essai.

## Mettre tout ensemble

Voici un template adaptable à presque toutes les tâches : "Tu es [rôle]. J''ai besoin que tu [tâche] pour [audience]. Le résultat doit être en [format] et d''environ [longueur]. Voici un exemple de ce que j''attends : [exemple]. Contraintes importantes : [liste des contraintes]." Partez de cette structure et vous verrez immédiatement un bond de qualité avec chaque outil IA.',
  'Comment écrire des prompts IA parfaits — Synapse',
  'Guide pour débutants sur l''écriture de prompts IA efficaces pour obtenir de meilleurs résultats avec ChatGPT, Claude et autres outils IA.'
);

-- ----- Article 3: Prompts Guide — ES -----
INSERT INTO public.article_translations (article_id, locale, title, excerpt, content, meta_title, meta_description)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'es',
  'Cómo escribir prompts de IA perfectos: guía para principiantes',
  'La calidad de tus resultados de IA depende completamente de la calidad de tus instrucciones. Aprende las técnicas probadas que separan los resultados vagos y decepcionantes de las respuestas precisas y potentes.',
  '## Por qué los prompts importan más de lo que crees

La mayoría de personas tratan los prompts de IA como búsquedas de Google — cortos, vagos, esperando lo mejor. Pero los modelos de IA modernos son mucho más capaces cuando reciben instrucciones claras. La diferencia entre "escríbeme un artículo" y un prompt bien estructurado puede ser la diferencia entre relleno genérico y contenido genuinamente útil. La ingeniería de prompts no es magia; es una habilidad que se puede aprender.

## Los cinco principios de un prompt efectivo

**1. Sé específico:** En lugar de "ayúdame con el marketing", prueba "escribe tres opciones de pie de foto para Instagram para el lanzamiento de un producto SaaS dirigido a propietarios de pequeñas empresas." Cuanto más contexto proporciones, mejor será el resultado.

**2. Define el rol:** Comienza con "Eres un analista de datos senior..." o "Actúa como un redactor UX..." para enmarcar la perspectiva y el vocabulario del modelo.

**3. Da ejemplos:** Muéstrale al modelo lo que quieres. Incluye una muestra del tono, formato o estructura que esperas. Esta técnica, llamada few-shot prompting, mejora drásticamente la consistencia.

**4. Establece restricciones:** Especifica el número de palabras, formato (viñetas, tabla, JSON), tono (formal, casual) y audiencia. Las restricciones enfocan el resultado y reducen la necesidad de ediciones posteriores.

**5. Itera:** Tu primer prompt es un borrador. Lee el resultado, identifica lo que falta o está mal, y refina tu prompt. Los mejores resultados vienen de una conversación, no de un solo intento.

## Poniendo todo junto

Aquí tienes una plantilla adaptable a casi cualquier tarea: "Eres [rol]. Necesito que [tarea] para [audiencia]. El resultado debe estar en [formato] y tener aproximadamente [longitud]. Aquí tienes un ejemplo de lo que busco: [ejemplo]. Restricciones importantes: [lista de restricciones]." Comienza con esta estructura y verás inmediatamente un salto de calidad con cada herramienta de IA que uses.',
  'Cómo escribir prompts de IA perfectos — Synapse',
  'Guía para principiantes sobre cómo escribir prompts de IA efectivos para obtener mejores resultados con ChatGPT, Claude y otras herramientas.'
);

-- ============================================================
-- 4. AI Tools
-- ============================================================

INSERT INTO public.ai_tools (slug, name, description, logo_url, website_url, category, pricing, is_featured) VALUES
(
  'chatgpt',
  'ChatGPT',
  'OpenAI''s conversational AI assistant powered by GPT-4o. Excels at writing, analysis, coding, and creative tasks with support for plugins, image generation, and web browsing.',
  'https://cdn.oaistatic.com/assets/favicon-miwirzcz.ico',
  'https://chat.openai.com',
  'chatbot',
  'freemium',
  true
),
(
  'claude',
  'Claude',
  'Anthropic''s AI assistant known for nuanced reasoning, long-context understanding up to 200K tokens, and exceptional coding abilities. Available via web, API, and Claude Code CLI.',
  'https://claude.ai/favicon.ico',
  'https://claude.ai',
  'chatbot',
  'freemium',
  true
),
(
  'midjourney',
  'Midjourney',
  'Industry-leading AI image generation tool that creates stunning, artistic visuals from text descriptions. Known for its distinctive aesthetic quality and photorealistic capabilities.',
  'https://www.midjourney.com/favicon.ico',
  'https://www.midjourney.com',
  'image',
  'paid',
  true
),
(
  'dall-e',
  'DALL-E',
  'OpenAI''s image generation model that creates realistic images and art from natural language descriptions. Integrated into ChatGPT Plus and available via API for developers.',
  'https://cdn.oaistatic.com/assets/favicon-miwirzcz.ico',
  'https://openai.com/dall-e-3',
  'image',
  'freemium',
  false
),
(
  'cursor',
  'Cursor',
  'AI-powered code editor built on VS Code that integrates frontier models directly into your development workflow. Features intelligent autocomplete, chat, and codebase-aware editing.',
  'https://www.cursor.com/favicon.ico',
  'https://www.cursor.com',
  'coding',
  'freemium',
  false
),
(
  'perplexity',
  'Perplexity',
  'AI-powered search engine that provides direct, cited answers to complex questions by searching the web in real time. Combines the accuracy of search with the fluency of AI.',
  'https://www.perplexity.ai/favicon.ico',
  'https://www.perplexity.ai',
  'search',
  'freemium',
  false
),
(
  'runway',
  'Runway',
  'Creative AI platform specializing in video generation and editing. Its Gen-3 Alpha model can generate cinematic video clips from text or image prompts with impressive consistency.',
  'https://runway.com/favicon.ico',
  'https://runway.com',
  'video',
  'paid',
  false
),
(
  'notion-ai',
  'Notion AI',
  'AI writing and productivity assistant built into Notion. Helps draft, summarize, translate, and brainstorm directly within your workspace, with full access to your notes and docs.',
  'https://www.notion.so/favicon.ico',
  'https://www.notion.so/product/ai',
  'productivity',
  'freemium',
  false
);
