# Registre des traitements de données personnelles — Synapse

## Responsable du traitement
- **Nom** : Benjamin Martin
- **Email** : squad4me.project@gmail.com
- **Statut** : Micro-entrepreneur

## Traitement 1 : Gestion des comptes utilisateurs
- **Finalité** : Permettre l'inscription, la connexion et la gestion du profil
- **Base légale** : Exécution du contrat (CGU)
- **Données collectées** : Email, nom d'affichage, nom d'utilisateur, bio, avatar (via OAuth), liens sociaux
- **Durée de conservation** : Jusqu'à suppression du compte par l'utilisateur
- **Destinataires** : Supabase (hébergeur BDD, serveur Frankfurt), Vercel (hébergeur site)
- **Transfert hors UE** : Vercel (USA) — clauses contractuelles types

## Traitement 2 : Contenu communautaire (UGC)
- **Finalité** : Permettre la publication de posts, commentaires, likes, favoris
- **Base légale** : Exécution du contrat (CGU)
- **Données collectées** : Contenu des posts, commentaires, catégorie, langue, liens, prompts partagés
- **Durée de conservation** : Jusqu'à suppression par l'utilisateur ou suppression du compte
- **Destinataires** : Supabase (hébergeur BDD)

## Traitement 3 : Authentification OAuth
- **Finalité** : Permettre la connexion via Google ou GitHub
- **Base légale** : Consentement (choix du mode de connexion)
- **Données collectées** : Identifiant OAuth, email, avatar URL (transmis par le provider)
- **Durée de conservation** : Jusqu'à suppression du compte
- **Destinataires** : Supabase Auth, Google (si OAuth Google), GitHub (si OAuth GitHub)
- **Transfert hors UE** : Google (USA), GitHub (USA) — clauses contractuelles types

## Traitement 4 : Traduction automatique
- **Finalité** : Traduire les posts de la communauté via IA
- **Base légale** : Intérêt légitime (améliorer l'expérience utilisateur)
- **Données collectées** : Contenu du post envoyé à l'API Anthropic pour traduction
- **Durée de conservation** : Pas de stockage (traitement à la volée)
- **Destinataires** : Anthropic (API Claude Haiku)
- **Transfert hors UE** : Anthropic (USA) — pas de stockage des données

## Traitement 5 : Cookies techniques
- **Finalité** : Gestion de la session d'authentification et de la préférence de langue
- **Base légale** : Intérêt légitime (fonctionnement du site)
- **Données collectées** : Cookies de session Supabase, préférence de langue (localStorage)
- **Durée de conservation** : Session (cookies de session), indéfinie (préférence langue)

## Mesures de sécurité
- Authentification via Supabase Auth (tokens JWT)
- Row Level Security (RLS) activée sur toutes les tables
- Clé service_role utilisée uniquement côté serveur après vérification auth
- HTTPS obligatoire (Vercel)
- Base de données hébergée en Europe (Frankfurt)

## Droits des personnes
Les utilisateurs peuvent :
- Accéder à leurs données via leur page profil
- Modifier leurs données via leur page profil
- Supprimer leur compte (et toutes les données associées) via le bouton "Supprimer mon compte"
- Contacter le responsable par email : squad4me.project@gmail.com

---
*Document créé le 20/03/2026 — Dernière mise à jour : 20/03/2026*
