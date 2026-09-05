# Code Insight AI — Fullstack Cloud Challenge 🚀

> Automated reverse engineering of source repositories.
> Built with **Angular 17** + **NestJS 10** following a **Hexagonal Architecture**
> in both the frontend and the backend.

## ✨ What it does

1. Accepts a **public Git URL** or a **ZIP upload** of a repository.
2. Clones / extracts the project into a sandboxed temp directory.
3. Runs **static analysis** to infer language, framework, components,
   APIs consumed and the **architectural pattern** (Hexagonal, Clean, MVC,
   Microservices, N-Layer, Monolith).
4. Calls a **pluggable AI port** (`mock` by default, swap for OpenAI/Gemini/
   Anthropic/Ollama/Bedrock) for a human-friendly functional summary.
5. Surfaces **findings & recommendations** (secrets, no-tests, missing README,
   no error handling, …) through a clean Angular UI.

## 🧱 Repository layout

```
prueba-Fullstack-Cloud/
├── agent_definition.md     # Profile of the AI agent used to build this
├── backend/                # NestJS + TypeScript (hexagonal)
│   ├── src/
│   │   ├── domain/         # Models, ports (interfaces), use cases
│   │   ├── application/    # Application services (orchestration)
│   │   ├── infrastructure/ # Controllers, AI adapters, analyzers, DI wiring
│   │   └── main.ts
│   └── package.json, tsconfig.json, nest-cli.json, .env.example, README.md
├── frontend/               # Angular 17 standalone + signals (hexagonal)
│   ├── src/app/
│   │   ├── domain/         # Pure models & ports (framework-agnostic)
│   │   ├── application/    # Signal-based stores / use cases
│   │   ├── infrastructure/ # HTTP adapters (HttpClient)
│   │   └── presentation/   # Standalone components & pages
│   ├── angular.json, tsconfig.json, tailwind.config.js, proxy.conf.json
│   └── package.json, README.md
├── .gitignore              # Repository-wide ignores
└── README.md               # ← you are here
```

## ⚡ Quick start

### Prerequisites
- **Node.js 20+** and **npm 10+**
- **Git** (for the URL analyzer)
- Internet access for `npm install`

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

Backend listens on **http://localhost:3000** and exposes:
- Swagger UI → <http://localhost:3000/api/docs>
- `POST /api/v1/analysis/url` (JSON `{ "url": "https://github.com/..." }`)
- `POST /api/v1/analysis/zip` (multipart `file`)

### 2. Frontend

```bash
cd ../frontend
cp .env.example .env
npm install
npm start
```

Open <http://localhost:4200>. The dev server proxies `/api/**` to the backend
through `proxy.conf.json`.

## 🤖 Switching the AI provider

The `AI_PROVIDER` env variable chooses which `IAISummaryPort` implementation is
wired at the composition root (`backend/src/infrastructure/ai/ai.module.ts`):

| Provider   | Status | How to enable                                          |
|------------|--------|--------------------------------------------------------|
| `mock`     | ✅ active (default) | No setup, deterministic, offline            |
| `openai`   | 🟡 skeleton | Set `AI_PROVIDER=openai` and `OPENAI_API_KEY=sk-...` |
| `gemini`   | ⬜ plug-in | Drop a `GeminiAdapter` and add a `case 'gemini':` branch |
| `ollama`   | ⬜ plug-in | Set `OLLAMA_BASE_URL=http://localhost:11434`           |
| `anthropic`, `bedrock` | ⬜ plug-in | Follow the same pattern |

The domain layer **never changes** when swapping providers — that's the whole
point of the hexagonal split.

## 🧪 Verification & demos

- **Demo ZIP**: drop any small Node.js project (e.g. an Express server you own)
  into a ZIP and upload it through the UI to see the analyzer in action.
- **Demo URL**: pick a public GitHub repo such as `https://github.com/expressjs/express`.

## 🛡 Security

Following the bank restrictions:
- Only **public** GitHub HTTPS URLs are accepted.
- No credentials/secrets ever hardcoded — see `.env.example`.
- `.gitignore` excludes `.env`, `node_modules/`, `dist/`, `tmp/`, `coverage/`.

## 🏛 Architectural rationale

### Backend (NestJS)
- `domain/` — pure TypeScript (no decorators, no `@nestjs/*` imports). Defines
  ports: `IRepositoryFetcher`, `IRepositoryAnalyzer`, `IAISummaryPort`, and the
  `AnalyzeRepositoryUseCase`.
- `infrastructure/` — NestJS-specific adapters:
  - `FsRepositoryFetcher` (git clone / zip extract)
  - `HeuristicAnalyzerAdapter` (language/framework/components/architecture/findings)
  - `MockAIAdapter`, `OpenAIAdapter` + `AiModule` (factory)
  - `AnalyzeController` (HTTP DTOs via `class-validator` + Swagger)
- `application/AnalysisService` — instantiates the use case with injected ports.

### Frontend (Angular)
- `domain/` — pure interfaces (`AnalysisServicePort`) and models.
- `application/` — `AnalysisStore` with `signal()`/`computed()` for state.
- `infrastructure/` — `HttpAnalysisAdapter` (only place where `HttpClient` is imported).
- `presentation/` — standalone components and the home page.

Dependency inversion is enforced by `app.config.ts`, which is the **only** file
that maps `ANALYSIS_SERVICE` token → `HttpAnalysisAdapter` instance.

## 📦 What's NOT in scope (4-hour MVP)

- Real OpenAI SDK call (placeholder stub with TODO).
- Authentication / multi-tenant.
- Persistent storage (PostgreSQL was avoided to keep the bootstrap self-contained).
- Production AWS deployment diagram (see the PDF — `Opción B`).

## 📜 License & ethics

This challenge was developed for the **Code Insight AI: Ingeniería Inversa
Automatizada de Repositorios** kata. No bank internal code, no proprietary
repositories and no real secrets have been used.
