# Logique de Synchronisation

Ce document explique comment fonctionne la synchronisation entre Google Sheets, Bookla et Webflow.

---

## 🎯 Principe fondamental

**Google Sheets est la source de vérité.**

Le script de synchronisation (`/api/sync-services`) s'assure que :
- Chaque service du Sheet existe dans Bookla
- Chaque service du Sheet existe dans Webflow
- Les IDs (Bookla et Webflow) sont correctement enregistrés dans le Sheet

---

## 📊 Sources de données

| Source | Rôle | Données |
|--------|------|---------|
| **Google Sheets** | Source de vérité | Nom, prix, durée, slugs, IDs Bookla/Webflow |
| **Bookla** | Système de réservation | Services avec leurs IDs |
| **Webflow** | CMS du site | Items avec bookla-id pour le bouton de réservation |

---

## 🔄 Flux de synchronisation

```
┌─────────────────┐
│  Google Sheets  │  ← Source de vérité
│  (113 lignes)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Pour chaque    │
│  ligne du Sheet │
└────────┬────────┘
         │
         ├──────────────────────────────────────┐
         │                                      │
         ▼                                      ▼
┌─────────────────┐                  ┌─────────────────┐
│     BOOKLA      │                  │     WEBFLOW     │
│                 │                  │                 │
│ • A un ID ?     │                  │ • A un ID ?     │
│   → Vérifier    │                  │   → Vérifier    │
│     qu'il       │                  │     qu'il       │
│     existe      │                  │     existe      │
│                 │                  │                 │
│ • Pas d'ID ?    │                  │ • Pas d'ID ?    │
│   → Créer       │                  │   → Chercher    │
│   → Écrire ID   │                  │     par         │
│     dans Sheet  │                  │     bookla-id   │
│                 │                  │   → Si trouvé,  │
│                 │                  │     écrire ID   │
│                 │                  │   → Sinon,      │
│                 │                  │     créer       │
└─────────────────┘                  └─────────────────┘
```

---

## 📝 Étapes détaillées

### 1. Lecture du Sheet
```
GET Google Sheets API
→ Récupère toutes les lignes (colonnes A à Q)
→ Parse en objets Service avec rowIndex
```

### 2. Pré-chargement Webflow
```
GET /collections/{id}/items (paginé)
→ Cache tous les items indexés par bookla-id
→ Évite les appels répétés à l'API
```

### 3. Validation Bookla
```
GET /companies/{id}/services
→ Récupère tous les IDs existants
→ Permet de vérifier si un ID du Sheet est encore valide
```

### 4. Pour chaque service du Sheet

#### 4.1 Sync Bookla
```
SI bookla_service_id existe dans le Sheet:
    SI cet ID existe encore dans Bookla:
        → OK, rien à faire
    SINON:
        → L'ID est obsolète, on va recréer

SI pas de bookla_service_id (ou obsolète):
    → POST /companies/{id}/services (créer)
    → Écrire le nouvel ID dans le Sheet (colonne D)
```

#### 4.2 Sync Webflow
```
SI webflow_id existe dans le Sheet:
    → GET /collections/{id}/items/{webflow_id}
    SI l'item existe:
        → OK, rien à faire
    SINON:
        → L'ID est obsolète

SI pas de webflow_id (ou obsolète):
    → Chercher dans le cache par bookla-id
    SI trouvé:
        → Écrire l'ID trouvé dans le Sheet (colonne A)
    SINON:
        → POST /collections/{id}/items (créer)
        → Slug = "svc-{nom-du-service}"
        → Écrire le nouvel ID dans le Sheet
```

---

## 🛡️ Règles de sécurité

1. **Jamais de suppression automatique** : Le script ne supprime rien, ni dans Bookla, ni dans Webflow.

2. **Pas de mise à jour des données** : Le script ne modifie pas les prix/durées dans Bookla ou Webflow. Il ne fait que s'assurer que les items existent et que les IDs sont corrects.

3. **Idempotent** : Relancer le script plusieurs fois ne crée pas de doublons. Si tout est déjà synchronisé, il ne fait rien.

---

## 📋 Colonnes du Sheet utilisées

| Colonne | Nom | Lecture | Écriture |
|---------|-----|---------|----------|
| A | Webflow_ID | ✅ | ✅ |
| B | Webflow_Slug | ✅ | ❌ |
| C | Service_Name | ✅ | ❌ |
| D | Bookla_ServiceID | ✅ | ✅ |
| E | Duration_Minutes | ✅ | ❌ |
| F | Price_EUR | ✅ | ❌ |
| L | Visible | ✅ | ❌ |
| M | Option_Extra_Slug | ✅ | ❌ |
| N | Option_Extra_Price | ✅ | ❌ |
| O | Option_Extra_Duration | ✅ | ❌ |
| P | Bookla_UpdatedAt | ❌ | ✅ |

---

## 🚀 Comment lancer la synchro

### En local (test)
```bash
npx ts-node scripts/test-sync.ts
```

### Via l'API (production)
```
GET https://ton-app.vercel.app/api/sync-services?secret=TON_SECRET
```

### Réponse type
```json
{
  "message": "Sync complete",
  "summary": {
    "checked": 113,
    "bookla_created": 0,
    "webflow_created": 0,
    "sheet_updated": 0,
    "skipped": 113,
    "errors_count": 0
  }
}
```

- `checked` : Nombre de lignes traitées
- `skipped` : Lignes déjà synchronisées (rien à faire)
- `bookla_created` : Nouveaux services créés dans Bookla
- `webflow_created` : Nouveaux items créés dans Webflow
- `sheet_updated` : Lignes du Sheet mises à jour (IDs écrits)

---

## ⚠️ Cas particuliers

### Service supprimé de Bookla
Si un service est supprimé manuellement de Bookla, le script détectera que l'ID est invalide et en créera un nouveau.

### Service supprimé de Webflow
Si un item est supprimé de Webflow, le script le recréera avec un nouveau slug préfixé `svc-`.

### Doublon de slug Webflow
Si le slug existe déjà, le script ajoute les 6 derniers caractères du bookla-id comme suffixe.

---

*Dernière mise à jour : 25 Novembre 2025*

