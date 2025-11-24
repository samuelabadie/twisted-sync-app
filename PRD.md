# Twisted — Backend Sync Platform (Google Sheets → Bookla → Webflow → Stripe)

## 1. Contexte
Twisted est un salon de coiffure premium fonctionnant sur un système de réservation en ligne via **Bookla**, un site Webflow et des paiements via **Stripe**.

Aujourd’hui, la gestion des services (prix, durées, options, images, disponibilités…) est manuelle, fragmentée et difficile à maintenir. Le but est de construire un **backend unifié**, déployé sur **Vercel**, permettant :

- De lire un **Google Spreadsheet** comme source de vérité.
- De synchroniser automatiquement Bookla, Webflow et Stripe.
- De gérer automatiquement la génération d’acompte (30%).
- De supporter un système parent + options cohérent.
- De créer/mettre à jour tous les services sans action manuelle technique.
- D’assurer l’automatisation des annulations et confirmations.

Le back-office de Twisted (Spreadsheet + backend) doit devenir **la seule source fiable**, Webflow et Bookla deviennent des "miroirs" synchronisés.

---

## 2. Objectif du projet
Construire un backend Node/TypeScript déployé sur Vercel permettant :

1. **Importer et valider les données d’un Google Spreadsheet**.
2. **Générer dynamiquement les services Bookla** (parent + options) :
   - Si un service n'existe pas → il est créé côté Bookla.
   - Si un service existe mais change → il est mis à jour.
   - Le backend écrit le `bookla_service_id` dans le sheet.
3. **Mettre à jour le CMS Webflow** pour chaque service parent :
   - Création d’un item CMS si nouvelle entrée.
   - Mise à jour si entrée existante.
   - Avec ID Bookla parent + IDs des options.
4. **Générer un PaymentIntent Stripe pour acompte (30%)**.
5. **Envoyer automatiquement un email avec lien de paiement Stripe**.
6. **Annuler automatiquement dans Bookla si pas payé après X minutes**.
7. **Confirmer automatiquement dans Bookla si Stripe confirme le paiement**.

---

## 3. Architecture générale

### 3.1 Source de vérité : Google Sheets
- La cliente édite un Sheet.
- Le backend lit les données (via Google Service Account).
- Le backend met à jour des colonnes telles que :
  - `Bookla_ServiceID`
  - `Webflow_ID`
  - `Bookla_UpdatedAt`


### 3.2 Backend : Vercel
Fonctionnalités clés :
- API Routes Vercel pour synchronisation (cron ou manuelle).
- Webhooks Stripe & Bookla.
- App logic (calcul des options, validation, synchronisation…).

### 3.3 Cibles synchronisées

#### Bookla API
- Création de services
- Mise à jour des services
- Buffers automatiques (15m avant/après)
- Durée calculée (base + options)
- Prix calculé (base + options)
- Time interval = 30 min

#### Webflow CMS
Pour chaque **service parent** :
- Un item CMS avec :
  - Nom
  - Descriptions
  - Prix (base)
  - Bookla ID
  - Slug

#### Stripe API
- Création d’un PaymentIntent (acompte 30% du prix total).
- Génération d’un lien de paiement à envoyer par email.
- Webhook : `payment_intent.succeeded`.


### 3.4 Automations
- Lors d’une réservation Bookla → webhook → le backend :
  1. Récupère la réservation.
  2. Calcule 30%.
  3. Crée PaymentIntent Stripe.
  4. Envoie email avec lien Stripe.
  5. Stocke en DB ou Sheets.

- Cron 15 min :
  - Si pas payé → annuler dans Bookla.

- Webhook Stripe :
  - Si payé → confirmer la réservation dans Bookla.

---

## 4. Modèle de données (Google Sheets)
Une ligne = un service parent **ou** un service option.

### Colonnes (Structure CSV `twisted_template.csv`)
| Colonne | Type | Description |
|---------|------|-------------|
| `Webflow_ID` | string | ID de l'item CMS Webflow (généré/mis à jour) |
| `Webflow_Slug` | string | Identifiant unique du groupe (parent + options) |
| `Service_Name` | string | Nom du service |
| `Bookla_ServiceID` | string | ID du service Bookla (généré/mis à jour) |
| `Duration_Minutes` | number | Durée de base |
| `Price_EUR` | number | Prix de base |
| `Category_Slug` | string | Slug de la catégorie |
| `Bookla_CategoryID` | string | ID de la catégorie Bookla |
| `Resource_Slug` | string | Slug de la ressource |
| `Bookla_ResourceID` | string | ID de la ressource Bookla |
| `Capacity_Spots` | number | Capacité (défaut 1) |
| `Visible` | boolean | Visibilité (TRUE/FALSE) |
| `Option_Extra_Slug` | string | Vide pour parent, slug pour option |
| `Option_Extra_Price` | number | Prix additionnel pour l'option |
| `Option_Extra_Duration` | number | Durée additionnelle pour l'option |
| `Bookla_UpdatedAt` | string | Date dernière synchro Bookla |
| `Notes_Internal` | string | Notes internes |

### Calculs backend
- **Parent**: `final_price = Price_EUR`, `final_duration = Duration_Minutes`
- **Option**: `final_price = Parent.Price_EUR + Option_Extra_Price`, `final_duration = Parent.Duration_Minutes + Option_Extra_Duration`

---

## 5. API du backend
### 5.1 `/api/sync-services` (POST)
**Fonction :** synchronisation complète.

Étapes :
1. Lire le sheet.
2. Valider les données.
3. Calculer final_price & final_duration.
4. Synchroniser Bookla.
5. Écrire `bookla_service_id` dans Sheet.
6. Synchroniser Webflow CMS.
7. Écrire `webflow_item_id` dans Sheet.
8. Retourner un rapport JSON (créés / mis à jour / ignorés).

Sécurité : header `Authorization: Bearer SYNC_SECRET`.

---

### 5.2 `/api/bookla-webhook` (POST)
Reçoit `booking.created`.

Pipeline :
1. Identifier service réservé.
2. Chercher prix final dans Sheet.
3. Calculer acompte.
4. Créer PaymentIntent Stripe.
5. Envoyer email avec lien de paiement.
6. Enregistrer dans Sheet/DB.

---

### 5.3 `/api/stripe-webhook` (POST)
Reçoit `payment_intent.succeeded`.

Pipeline :
1. Lire metadata (réservation ID, email…).
2. Confirmer réservation Bookla.
3. Mettre à jour Sheet.

---

### 5.4 Cron `/api/cleanup-payments` (GET)
Toutes les X minutes :

1. Lister les réservations non payées.
2. Si > 15 minutes → annuler dans Bookla.
3. Marquer "annulé" dans Sheet.

---

## 6. Clients API à coder
### 6.1 `GoogleSheetsService`
- `getServices()`
- `updateRow(rowIndex, data)`
- Utilise API Google Sheets + service account.

### 6.2 `BooklaClient`
- `createService(payload)`
- `updateService(serviceId, payload)`
- `confirmBooking(id)`
- `cancelBooking(id)`

### 6.3 `WebflowClient`
- `findItemBySlug(collectionId, slug)`
- `createItem(collectionId, payload)`
- `updateItem(collectionId, itemId, payload)`

### 6.4 `StripeClient`
- `createPaymentIntent(amount, metadata)`

---

## 7. Algorithme parent + options (Implémentation)
Pour chaque groupe défini par `Webflow_Slug` :
1. Identifier la ligne "Parent" (où `Option_Extra_Slug` est vide).
2. Identifier les lignes "Option" (où `Option_Extra_Slug` est rempli).
3. Calculer les valeurs finales pour chaque entrée :
   - **Parent** : valeurs de base (`Price_EUR`, `Duration_Minutes`).
   - **Option** : valeurs du parent + deltas (`Option_Extra_Price`, `Option_Extra_Duration`).
4. Créer ou mettre à jour **un service Bookla distinct** pour chaque entrée (Parent et Options).
5. Sauvegarder les `Bookla_ServiceID` dans les lignes correspondantes du Sheet.
6. Pour le **Parent uniquement** : Créer ou mettre à jour **1 item CMS Webflow**.
   - L'item Webflow agrège les informations (nom, prix de base) et stocke les IDs Bookla correspondants (via champ personnalisé).

---

## 8. Déploiement
- Repo GitHub → Vercel.
- Routes serverless.
- Cron Vercel pour `/api/sync-services` et `/api/cleanup-payments`.
- Variables d’environnement complètes (incluant `WEBFLOW_COLLECTION_ID`).

---

## 9. Ce que doit livrer le développeur
1. **Backend complet** en TypeScript.
2. **Services** :
   - GoogleSheetsService
   - BooklaClient
   - WebflowClient
   - StripeClient
3. **Endpoints** :
   - `/api/sync-services`
   - `/api/bookla-webhook`
   - `/api/stripe-webhook`
   - `/api/cleanup-payments`
4. **Validation** via Zod.
5. **Gestion des erreurs** & logs.
6. **Documentation d’installation**.

---

## 10. Bonus (optionnel)
- Tableau admin interne (React/Next) pour voir l’état des services.

---

# Fin du document
