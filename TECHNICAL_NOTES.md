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

## 5. Compatibilité Next.js 16 / Turbopack (Production)

### Remplacement de `sib-api-v3-sdk` par l'API HTTP Brevo

**Problème :**
Le SDK officiel Brevo (anciennement Sendinblue) `sib-api-v3-sdk` utilise un format de module AMD/UMD incompatible avec **Turbopack** (le bundler de Next.js 16+). Le build échouait avec l'erreur :
```
Module not found: Can't resolve 'sib-api-v3-sdk'
```

**Solution :**
Remplacement du SDK par des appels HTTP directs à l'API Brevo dans `src/utils/email.ts` :
```typescript
const response = await fetch('https://api.brevo.com/v3/smtp/email', {
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'api-key': this.apiKey,
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    sender: { name, email },
    to: [{ email: to }],
    subject,
    htmlContent,
    textContent,
  }),
});
```
- **Avantage** : Aucune dépendance externe, compatible avec tous les bundlers, code plus léger.
- **Note** : Le package `sib-api-v3-sdk` est de toute façon **déprécié** par npm.

### Initialisation "Lazy" de Stripe

**Problème :**
L'initialisation de Stripe au niveau du module (top-level) échouait au build :
```typescript
// ❌ Échoue au build car STRIPE_SECRET_KEY n'existe pas à ce moment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { ... })
```
Erreur : `Neither apiKey nor config.authenticator provided`

Les variables d'environnement ne sont pas disponibles lors de la phase de "page data collection" de Next.js.

**Solution :**
Encapsuler l'initialisation dans une fonction appelée uniquement au runtime :
```typescript
// ✅ Initialisation lazy - appelée seulement quand la route est invoquée
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
  })
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  // ...
}
```
- **Impact** : Appliqué dans `app/api/bookla-webhook/route.ts` et `app/api/stripe-webhook/route.ts`.

### Version de l'API Stripe

La version du SDK Stripe installée (`stripe@20.x`) requiert une version d'API spécifique.
- **Ancienne** : `2025-04-30.basil` (incompatible)
- **Actuelle** : `2025-11-17.clover` ✅

En cas de mise à jour du package Stripe, vérifier la version d'API attendue via les types TypeScript.

---
*Dernière mise à jour : 27 Novembre 2025*

