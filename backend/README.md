# Code Insight AI — Backend

NestJS + TypeScript backend implementing the **Code Insight AI** API.
Follows **Hexagonal Architecture** (Ports & Adapters).

## Structure

```
src/
├── domain/                 ← Pure (no Nest, no HTTP, no SDKs)
│   ├── models/             # Domain entities & value objects
│   ├── ports/              # Interfaces (RepositoryFetcher, Analyzer, AI)
│   └── use-cases/          # AnalyzeRepositoryUseCase
├── application/            # Orchestration services (framework-aware boundary)
├── infrastructure/         ← Adapters
│   ├── http/               # Controllers, DTOs (Nest)
│   ├── ai/                 # MockAIAdapter, OpenAIAdapter, factory
│   ├── repositories/       # FsRepositoryFetcher, HeuristicAnalyzerAdapter
│   └── app.module.ts       # Composition root (DI wiring)
└── main.ts
```

## Run

```bash
cp .env.example .env
npm install
npm run start:dev
```

- API: <http://localhost:3000/api/v1/analysis>
- Swagger UI: <http://localhost:3000/api/docs>

## Endpoints

| Method | Path                          | Description                          |
|--------|-------------------------------|--------------------------------------|
| POST   | `/api/v1/analysis/url`        | Analyze a public Git URL (JSON body) |
| POST   | `/api/v1/analysis/zip`        | Upload a `.zip` (multipart `file`)   |
| POST   | `/api/v1/analysis`            | Generic endpoint (URL or ZIP hint)    |

## Switching AI Provider

The AI port (`IAISummaryPort`) is bound via the `AiModule` based on `AI_PROVIDER`:

```
AI_PROVIDER=mock     # offline, deterministic (default)
AI_PROVIDER=openai   # requires OPENAI_API_KEY (skeleton included)
```

Adding Gemini / Anthropic / Ollama / Bedrock is just adding a new adapter
under `src/infrastructure/ai/` and a new branch in `AiModule`.

## Tests

```bash
npm test
```

## Security notes

- No real secrets in `.env.example`.
- `.gitignore` excludes `tmp/`, `.env`, `node_modules/`, `dist/`.
- Only **public** GitHub URLs are accepted by `FsRepositoryFetcher`.