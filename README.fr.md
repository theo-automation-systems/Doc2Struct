[English](README.md) | **Français**

# Doc2Struct

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue)
![Groq](https://img.shields.io/badge/LLM-Groq-orange)

Intelligence documentaire par IA — importez des fichiers non structurés, extrayez des données structurées et exportez les résultats en quelques secondes.

**Application live :** [doc2-struct.vercel.app](https://doc2-struct.vercel.app)

<p align="center">
  <img src="docs/screenshots/Dashboard.png" alt="Tableau de bord Doc2Struct" width="800" />
</p>

<p align="center">
  <img src="docs/screenshots/Workspace.png" alt="Espace de travail Doc2Struct" width="800" />
</p>

<p align="center">
  <img src="docs/screenshots/Extracted_Fields_Demo.png" alt="Champs extraits avec surlignages PDF" width="800" />
</p>

## Problème

La plupart des organisations s'appuient encore sur la saisie manuelle pour traiter des documents tels que :

- factures
- CV et candidatures
- contrats
- formulaires internes
- rapports financiers

Cela entraîne :

- une ressaisie manuelle chronophage
- des erreurs humaines dans les systèmes structurés (CRM, ERP, tableurs)
- des workflows opérationnels lents
- une gestion documentaire fragmentée entre plusieurs outils

## Solution

Doc2Struct automatise la transformation de documents non structurés en données structurées et validées.

Il fournit :

- l'import et le stockage de documents
- une classification par IA (facture, CV, contrat, rapport, etc.)
- une extraction de champs structurés avec score de confiance
- une interface de relecture avec surlignage au niveau du PDF
- l'export en JSON, CSV, Excel
- une architecture API-first pour l'intégration dans les systèmes métier

## Public cible

- Équipes finance traitant factures et notes de frais
- Équipes RH gérant CV et documents de recrutement
- Équipes juridiques examinant contrats et accords
- Équipes opérations digitalisant des workflows internes
- Startups et entreprises construisant des outils d'automatisation internes

## Capacités clés

### Traitement documentaire

- Import PDF, DOCX, XLSX, TXT (jusqu'à 50 Mo)
- Workflow d'analyse automatique ou manuel
- Suivi du cycle de vie (import → analyse → terminé)

### Extraction IA

- Extraction structurée pilotée par schéma (pas de texte libre)
- Classification des documents
- Score de confiance par champ
- Résumés, insights clés et extraction d'actions

### Interface de relecture

- Aperçu PDF et champs extraits côte à côte
- Éléments extraits surlignés dans le document
- Indicateurs de confiance par champ
- Historique d'analyse et persistance

### Export et intégration

- JSON (sortie structurée complète)
- CSV (données tabulaires)
- Excel (.xlsx)
- API REST pour les systèmes externes

## Pourquoi pas simplement ChatGPT ?

Contrairement aux outils de prompting génériques, Doc2Struct offre :

- des schémas déterministes par type de document
- des sorties structurées et validées (pas du texte brut)
- un stockage persistant et un historique documentaire
- des pipelines d'extraction reproductibles
- une API REST prête pour l'intégration
- une UX dédiée à la relecture et la validation

## Parcours produit

```text
Import du document
  → classification du type
  → extraction des champs structurés (IA)
  → relecture avec surlignages PDF
  → export vers les outils métier (CSV / JSON / Excel)
```

## Principes de conception

- **Architecture API-first :** chaque fonctionnalité est accessible par programmation
- **Extraction pilotée par schéma :** sorties structurées plutôt que réponses en texte libre
- **Traitement asynchrone :** workflow d'analyse scalable en arrière-plan
- **Séparation des rôles dans l'UI :**
  - Dashboard = point d'entrée + gestion des documents
  - Workspace = environnement d'analyse et de relecture
- **Dégradation gracieuse :** mode local de secours sans base de données
- **Exécution maîtrisée des coûts :** analyse déclenchée explicitement par l'utilisateur

## Fonctionnalités

### UI / UX

- Dashboard (import + documents récents)
- Workspace (analyse + visionneuse PDF + champs extraits)
- Glisser-déposer pour l'import
- Déclenchement manuel de l'analyse
- Mode sombre / clair
- Indicateur de statut backend en direct

### Couche IA

- Intégration LLM Groq (modèles Llama)
- Moteur de classification documentaire
- Pipeline d'extraction structurée
- Score de confiance par champ
- Génération de résumés et d'insights

### Backend

- API REST FastAPI
- Pipeline de traitement documentaire asynchrone
- Persistance PostgreSQL (Neon)
- Fallback en mémoire pour le développement local
- Documentation OpenAPI complète

### Export

- Sortie structurée JSON
- Export tabulaire CSV
- Export Excel pour les workflows métier

## Stack technique

| Couche | Technologie |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Backend | FastAPI, Pydantic, SQLAlchemy async, Uvicorn |
| Base de données | Neon PostgreSQL (asyncpg) |
| IA | Groq (Llama 3.1 / 3.3) |
| Parsing | pdfplumber, PyMuPDF, python-docx, pandas, openpyxl |
| Déploiement | Vercel (frontend), Railway (backend) |

## Architecture

```text
Frontend (Next.js)
        ↓
Backend FastAPI
        ↓
Extraction LLM (Groq)
        ↓
Couche de parsing documentaire
        ↓
PostgreSQL (Neon)
```

## Décisions de conception clés

- Les documents sont stockés avant traitement (workflow découplé)
- L'analyse est explicite (coût + contrôle)
- Extraction par schéma plutôt que prompting en texte libre
- UI optimiste avec polling pour les jobs asynchrones
- Pipeline d'export multi-formats pour l'intégration réelle
- Séparation Dashboard / Workspace calquée sur les SaaS enterprise

## Installation

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Créer `.env` :

```env
GROQ_API_KEY=your_key
DATABASE_URL=your_neon_url
```

Lancer :

```powershell
uvicorn main:app --reload --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

`.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Déploiement

| Composant | Plateforme |
| --- | --- |
| Frontend | [Vercel](https://doc2-struct.vercel.app) — Root Directory : `frontend` |
| Backend | Railway — Root Directory : `backend` |
| Base de données | Neon |

**Vercel :** `NEXT_PUBLIC_API_URL=https://doc2struct-production.up.railway.app`  
**Railway :** `FRONTEND_URL=https://doc2-struct.vercel.app` (CORS)

### API

| Ressource | URL |
| --- | --- |
| Swagger UI | [doc2struct-production.up.railway.app/docs](https://doc2struct-production.up.railway.app/docs) |
| Health check | [doc2struct-production.up.railway.app/health](https://doc2struct-production.up.railway.app/health) |

```text
GET    /health
GET    /api/v1/stats
GET    /api/v1/documents/
POST   /api/v1/documents/upload
POST   /api/v1/documents/{id}/analyze
GET    /api/v1/documents/{id}
GET    /api/v1/documents/{id}/extraction
POST   /api/v1/documents/{id}/export
DELETE /api/v1/documents/{id}
```

## Jeu de démo

Des PDFs d'exemple sont fournis dans `frontend/public/samples/` :

| Fichier | Usage |
| --- | --- |
| `sample-invoice.pdf` | Facture simple (test rapide) |
| `sample-invoice-detailed.pdf` | Facture B2B réaliste — 11 lignes, remises, TVA |
| `sample-resume.pdf` | CV simple (test rapide) |
| `sample-resume-dense.pdf` | CV dense 2 pages — 5 postes, certifications, publications |
| `sample-contract.pdf` | NDA simple (test rapide) |
| `sample-contract-msa.pdf` | Contrat cadre 3 pages avec annexes |
| `sample-report.pdf` | Rapport financier de démo |
| `client-capex-request.pdf` | Formulaire interne CAPEX enterprise |
| `client-it-access-request.pdf` | Demande de licences et accès IT |

Régénérer :

```powershell
cd samples
python generate_all_samples.py
python generate_realistic_samples.py
python generate_enterprise_samples.py
```

## Roadmap

- OAuth / espaces de travail par équipe
- Webhooks à la fin du traitement
- Connecteurs Google Drive / SharePoint
- Schémas d'extraction personnalisés par client
- Versioning des prompts + système d'évaluation
- Journaux d'audit (enterprise)
- Facturation et suivi d'usage

## Ce que ce projet démontre

- Architecture SaaS full-stack
- Système d'extraction structurée par LLM
- Conception backend prête pour la production
- Pipeline de traitement documentaire à l'échelle
- Approche produit API-first
- Patterns UX orientés enterprise
