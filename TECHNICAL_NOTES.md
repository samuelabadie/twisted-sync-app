# Notes Techniques & Décisions d'Implémentation

Ce document rassemble les choix techniques, les limitations rencontrées et les points d'attention pour les futures évolutions du projet.

## 1. Gestion des Paiements (Stripe)

### Passage de PaymentIntent à Checkout Sessions
**Pourquoi ?**
Initialement, le PRD mentionnait l'utilisation de `PaymentIntent` manuel. Cependant, cela nécessite de développer un frontend complexe (formulaire de carte bancaire sécurisé) pour finaliser le paiement.
Nous avons basculé vers **Stripe Checkout** qui génère une page de paiement hébergée par Stripe.
- **Avantage** : Pas de code frontend à maintenir, sécurité gérée par Stripe, UX optimisée mobile.
- **Impact** : Le webhook écoute désormais l'événement `checkout.session.completed` au lieu de `payment_intent.succeeded`.

### Webhook Stripe & Google Sheets
**Point d'attention :**
Le PRD demandait de "Mettre à jour le Sheet" lors d'un paiement réussi.
Or, le Google Sheet actuel (`twisted_template.csv`) est structuré pour gérer les **Services** (Catalogue), et non les **Réservations**.
- **Décision** : Le webhook confirme la réservation dans Bookla (action critique) mais **n'écrit rien dans le Sheet** pour l'instant, faute de destination appropriée.
- **Futur** : Créer un onglet "Bookings" dans le GSheet pour logger les transactions si nécessaire.

## 2. Tâches Planifiées (Cron Jobs)

### Limitation Vercel Hobby
**Problème :**
Le plan gratuit Vercel limite les Cron Jobs à **1 par jour**.
Notre besoin : Annuler les impayés toutes les **15 minutes**.
**Solution :**
Nous utilisons **GitHub Actions** (gratuit) comme déclencheur externe.
- Le workflow `.github/workflows/cleanup-cron.yml` appelle l'API `/api/cleanup-payments` toutes les 15 minutes.
- Cela contourne la limitation sans coût supplémentaire.

## 3. Webflow Sync

### Identification des Collections
L'ID de la Collection Webflow (`WEBFLOW_COLLECTION_ID`) est indispensable pour la synchro.
Il est configuré en dur via les variables d'environnement (`.env`) car il ne change pas (sauf si on recrée le site).
L'API `/api/test-webflow` permet de retrouver cet ID facilement si besoin.

## 4. Authentification Google Sheets

L'API Google Sheets est capricieuse avec le formatage de la clé privée (`private_key`) dans les variables d'environnement.
- **Règle d'or** : Le JSON `GOOGLE_CREDS` dans le `.env` doit être **minifié sur une seule ligne**. Tout saut de ligne casse le parsing.

---
*Dernière mise à jour : 24 Novembre 2025*

