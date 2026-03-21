# SESSION 8A — Sécurité RGPD + Fix bugs

## CONTEXTE
Le projet Synapse est une plateforme communautaire IA (Next.js 14 + Supabase). Cette session couvre la mise en conformité RGPD et les corrections de bugs visuels.

**IMPORTANT** : Fais les étapes UNE PAR UNE, dans l'ordre. Attends ma confirmation entre chaque étape.

---

## ÉTAPE 1 : Bandeau de cookies (CookieBanner)

Crée un composant `src/components/layout/CookieBanner.tsx` :

**Spécifications :**
- Composant client (`"use client"`)
- Bandeau fixé en bas de page (position fixed, z-50)
- Fond sombre semi-transparent ou blanc avec bordure
- Texte : "This site uses essential cookies for authentication and language preferences. No tracking cookies are used." (en anglais, car le site est en anglais par défaut)
- Un seul bouton "OK, got it" qui ferme le bandeau
- Au clic sur "OK", stocker `cookie_consent=true` dans `localStorage` pour ne plus afficher le bandeau
- Au chargement, vérifier `localStorage` : si `cookie_consent` existe, ne pas afficher le bandeau
- Un lien vers `/privacy` ("Learn more")
- Design cohérent avec le reste du site (Tailwind, couleurs primary-600)
- Ajouter une petite animation d'entrée (slide up)

**Intégration :**
- Importer et ajouter `<CookieBanner />` dans `src/app/[locale]/layout.tsx`, juste avant la fermeture du `</body>` ou à la fin du contenu principal

**PAS besoin de :**
- Gérer le consentement (ce sont des cookies techniques = exemptés)
- Bloquer quoi que ce soit avant le consentement
- i18n pour ce composant (on garde le texte en anglais, c'est OK pour un bandeau informatif)

---

## ÉTAPE 2 : Bouton "Supprimer mon compte"

### 2a. Créer l'API route `/api/account/delete`

Crée le fichier `src/app/api/account/delete/route.ts` :

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function DELETE() {
  try {
    // 1. Vérifier l'authentification
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Utiliser le service client pour supprimer les données
    const serviceClient = createServiceClient();

    // Trouver l'utilisateur interne
    const { data: userData } = await serviceClient
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userData) {
      // Supprimer l'utilisateur de la table users
      // Les FK ON DELETE CASCADE supprimeront : posts, comments, likes, bookmarks
      await serviceClient
        .from('users')
        .delete()
        .eq('id', userData.id);
    }

    // 3. Supprimer le compte auth via admin API
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 2b. Ajouter les traductions

Dans `src/messages/en.json`, ajouter dans le namespace `"profile"` :
```json
"deleteAccount": "Delete my account",
"deleteAccountWarning": "This action is irreversible. All your posts, comments, likes, and bookmarks will be permanently deleted.",
"deleteAccountConfirm": "Type DELETE to confirm",
"deleteAccountButton": "Permanently delete my account",
"deleting": "Deleting..."
```

Dans `src/messages/fr.json`, ajouter dans le namespace `"profile"` :
```json
"deleteAccount": "Supprimer mon compte",
"deleteAccountWarning": "Cette action est irréversible. Tous vos posts, commentaires, likes et favoris seront définitivement supprimés.",
"deleteAccountConfirm": "Tapez SUPPRIMER pour confirmer",
"deleteAccountButton": "Supprimer définitivement mon compte",
"deleting": "Suppression..."
```

Dans `src/messages/es.json`, ajouter dans le namespace `"profile"` :
```json
"deleteAccount": "Eliminar mi cuenta",
"deleteAccountWarning": "Esta acción es irreversible. Todas tus publicaciones, comentarios, likes y favoritos serán eliminados permanentemente.",
"deleteAccountConfirm": "Escribe ELIMINAR para confirmar",
"deleteAccountButton": "Eliminar permanentemente mi cuenta",
"deleting": "Eliminando..."
```

### 2c. Ajouter le bouton dans la page profil

Dans `src/app/[locale]/profile/page.tsx`, ajouter APRÈS le `</form>` (après le bouton "Save changes") :

1. Ajouter un nouvel état :
```typescript
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [deleteConfirmText, setDeleteConfirmText] = useState("");
const [deleting, setDeleting] = useState(false);
```

2. Ajouter la fonction de suppression :
```typescript
const handleDeleteAccount = async () => {
  setDeleting(true);
  try {
    const response = await fetch('/api/account/delete', {
      method: 'DELETE',
    });

    if (response.ok) {
      // Déconnecter et rediriger
      await supabase.auth.signOut();
      router.push('/');
    } else {
      const data = await response.json();
      setMessage({ type: 'error', text: data.error || 'Failed to delete account' });
    }
  } catch {
    setMessage({ type: 'error', text: 'Failed to delete account' });
  }
  setDeleting(false);
};
```

3. Ajouter le JSX (section "Danger Zone") APRÈS le `</form>` et AVANT la dernière `</div>` :
```tsx
{/* Danger Zone */}
<div className="mt-12 rounded-lg border-2 border-red-200 bg-red-50 p-6">
  <h2 className="text-lg font-semibold text-red-700">{t("deleteAccount")}</h2>
  <p className="mt-2 text-sm text-red-600">{t("deleteAccountWarning")}</p>

  {!showDeleteConfirm ? (
    <button
      type="button"
      onClick={() => setShowDeleteConfirm(true)}
      className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
    >
      {t("deleteAccount")}
    </button>
  ) : (
    <div className="mt-4 space-y-3">
      <p className="text-sm font-medium text-red-700">{t("deleteAccountConfirm")}</p>
      <input
        type="text"
        value={deleteConfirmText}
        onChange={(e) => setDeleteConfirmText(e.target.value)}
        className="w-full rounded-md border border-red-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        placeholder="DELETE"
      />
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleteConfirmText !== "DELETE" || deleting}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? t("deleting") : t("deleteAccountButton")}
        </button>
        <button
          type="button"
          onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )}
</div>
```

**ATTENTION pour la confirmation :** Le mot à taper est "DELETE" (en dur), pas une traduction. C'est plus simple et universel.

---

## ÉTAPE 3 : Fix CSS des mentions légales

Dans `src/app/[locale]/legal/page.tsx`, le problème est que les `<ul>` ne s'affichent pas correctement avec le plugin `prose` de Tailwind.

**Solution :** Ajouter les classes Tailwind pour forcer l'affichage des listes :

Remplacer :
```tsx
<div className="prose prose-gray mt-8 max-w-none">
```

Par :
```tsx
<div className="prose prose-gray mt-8 max-w-none prose-ul:list-disc prose-ul:pl-6 prose-li:my-1">
```

**ET corriger le SIRET :**

Remplacer :
```tsx
<li><strong>SIRET :</strong> 53700000546100579</li>
```

Par :
```tsx
<li><strong>SIRET :</strong> 99490599000010</li>
```

---

## ÉTAPE 4 : Documents internes RGPD

### 4a. Créer `REGISTRE_TRAITEMENTS.md` à la racine du projet

Contenu :
```markdown
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
```

### 4b. Créer `PROCEDURE_FUITE_DONNEES.md` à la racine du projet

Contenu :
```markdown
# Procédure de notification en cas de violation de données — Synapse

## 1. Détection
En cas de suspicion de fuite de données (compromission de Supabase, accès non autorisé, etc.) :
- Vérifier les logs Supabase (Dashboard > Logs)
- Vérifier les accès API (Dashboard > API > Logs)
- Identifier les données potentiellement compromises

## 2. Évaluation
Déterminer :
- La nature de la violation (accès non autorisé, fuite, perte)
- Les catégories de données affectées (emails, profils, posts)
- Le nombre approximatif de personnes concernées
- Les conséquences probables pour les personnes

## 3. Mesures immédiates
- Révoquer les clés API compromises (Supabase Dashboard > Settings > API)
- Régénérer SUPABASE_SERVICE_ROLE_KEY et ANON_KEY si nécessaire
- Mettre à jour les variables d'environnement sur Vercel
- Si nécessaire, désactiver temporairement l'accès au site

## 4. Notification à la CNIL (obligatoire sous 72h)
Si la violation est susceptible d'engendrer un risque pour les droits et libertés des personnes :
- **Délai** : 72 heures maximum après la prise de connaissance
- **Comment** : Via le téléservice de notification sur cnil.fr
- **Informations à fournir** :
  - Nature de la violation
  - Catégories et nombre approximatif de personnes concernées
  - Coordonnées du responsable (Benjamin Martin, squad4me.project@gmail.com)
  - Conséquences probables
  - Mesures prises pour y remédier

## 5. Notification aux personnes concernées
Si la violation est susceptible d'engendrer un risque ÉLEVÉ :
- Envoyer un email à tous les utilisateurs concernés
- Contenu : nature de la fuite, données concernées, mesures prises, recommandations
- Recommander le changement de mot de passe si applicable

## 6. Documentation
Tenir un registre de l'incident :
- Date de détection
- Nature de la violation
- Données et personnes concernées
- Mesures prises
- Notifications effectuées (CNIL, utilisateurs)

## Contacts utiles
- **CNIL** : https://www.cnil.fr/fr/notifier-une-violation-de-donnees-personnelles
- **Supabase support** : support@supabase.io
- **Responsable** : Benjamin Martin — squad4me.project@gmail.com

---
*Document créé le 20/03/2026 — Dernière mise à jour : 20/03/2026*
```

---

## ÉTAPE 5 : Tester et commiter

1. Lancer `npm run build` pour vérifier que tout compile
2. Tester le site localement (`npm run dev`) :
   - Vérifier que le bandeau de cookies apparaît
   - Cliquer "OK", recharger → ne doit plus apparaître
   - Aller sur `/profile` → vérifier que la section "Danger Zone" apparaît en bas
   - Aller sur `/legal` → vérifier que les listes s'affichent correctement
   - Vérifier que le SIRET est bien `99490599000010`
3. Commiter :
```bash
git add src/components/layout/CookieBanner.tsx src/app/api/account/delete/route.ts src/app/\[locale\]/layout.tsx src/app/\[locale\]/profile/page.tsx src/app/\[locale\]/legal/page.tsx src/messages/en.json src/messages/fr.json src/messages/es.json REGISTRE_TRAITEMENTS.md PROCEDURE_FUITE_DONNEES.md
git commit -m "Add GDPR compliance: cookie banner, account deletion, legal fixes, internal docs"
git push
```

---

## RÉSUMÉ DES FICHIERS MODIFIÉS/CRÉÉS

| Action | Fichier |
|--------|---------|
| CRÉER | `src/components/layout/CookieBanner.tsx` |
| CRÉER | `src/app/api/account/delete/route.ts` |
| MODIFIER | `src/app/[locale]/layout.tsx` (ajouter CookieBanner) |
| MODIFIER | `src/app/[locale]/profile/page.tsx` (ajouter Danger Zone) |
| MODIFIER | `src/app/[locale]/legal/page.tsx` (fix CSS + SIRET) |
| MODIFIER | `src/messages/en.json` (traductions delete account) |
| MODIFIER | `src/messages/fr.json` (traductions delete account) |
| MODIFIER | `src/messages/es.json` (traductions delete account) |
| CRÉER | `REGISTRE_TRAITEMENTS.md` (document interne) |
| CRÉER | `PROCEDURE_FUITE_DONNEES.md` (document interne) |
