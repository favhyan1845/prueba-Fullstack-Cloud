# Code Insight AI — Frontend

Angular 17 (standalone components + signals) client for the **Code Insight AI** API.
Implements a **Hexagonal Architecture** (domain/application/infrastructure/presentation).

## Structure

```
src/app/
├── domain/             ← Pure (no Angular DI, no HttpClient)
│   ├── models/         # AnalysisResult, ArchitecturePattern, ...
│   └── ports/          # AnalysisServicePort
├── application/        # Signal stores / use cases
├── infrastructure/     ← Adapters (HTTP)
│   └── api/            # HttpAnalysisAdapter
├── presentation/       ← UI (components, pages)
│   ├── components/
│   └── pages/
├── app.component.ts
├── app.config.ts       # DI composition root (wires ports -> adapters)
└── app.routes.ts
```

## Run

```bash
cp .env.example .env
npm install
npm start
```

Opens on <http://localhost:4200> and proxies `/api/**` to the backend at
`http://localhost:3000`.

## Build

```bash
npm run build
```

## Switching the API base URL

Override `API_BASE_URL` in `.env`. The default `proxy.conf.json` is the
easiest way to keep the frontend free of CORS during development.

## Security notes

- Only public repositories or dummy data.
- No tokens stored client-side.