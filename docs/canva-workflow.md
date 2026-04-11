# Stable Canva API / Connector Workflow

This setup uses API calls and connector orchestration instead of browser automation.  
It is more stable for production, retries, and audit logs.

## Environment Variables

Set these once in your terminal/session:

- `CANVA_ACCESS_TOKEN` (required)
- `CANVA_BASE_URL` (optional, default `https://api.canva.com/rest/v1`)
- `CANVA_API_TIMEOUT_SECONDS` (optional, default `120`)
- `N8N_BASE_URL` and `N8N_API_KEY` if you orchestrate with n8n

## Local Canva API Wrapper

Use the project helper script:

```powershell
powershell -File .\scripts\canva-api.ps1 -Method GET -ResourcePath designs -Query "limit=10"
```

Example create-from-template call (payload shape depends on your Canva API app):

```powershell
powershell -File .\scripts\canva-api.ps1 `
  -Method POST `
  -ResourcePath designs `
  -BodyJson '{ "design_type": { "type": "custom", "width": 1080, "height": 1080 }, "title": "Auto Design Draft" }'
```

## Stable Connector Pattern (Recommended)

1. App emits a single payload with a unique `jobId` and template variables.
2. n8n webhook receives payload and stores `jobId` for idempotency.
3. n8n calls Canva API using `scripts/canva-api.ps1` semantics (or n8n HTTP Request node).
4. n8n polls Canva job/export endpoint with retry + backoff.
5. n8n writes final asset URL/status back to your app data store.
6. App displays final status and asset link.

## Reliability Rules

- Use `jobId` as idempotency key so retries do not create duplicates.
- Keep Canva calls in a queue worker (not on UI request thread).
- Save raw request/response JSON for each step.
- Use exponential backoff on Canva 429/5xx responses.
- Mark failed jobs with retry count and a dead-letter state.

## n8n Quick Start

Create a workflow with these blocks:

1. `Webhook` (input from app)
2. `Function` (validate payload, generate idempotency key)
3. `HTTP Request` (Canva create/update/export)
4. `Wait` + loop (`IF`) until export is ready
5. `HTTP Request`/DB node to store final status in your backend
6. `Respond to Webhook`

This gives you a stable API-first Canva pipeline that is observable and recoverable.
