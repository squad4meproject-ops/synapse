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
