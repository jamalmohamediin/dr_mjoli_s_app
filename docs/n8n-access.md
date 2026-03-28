# n8n Access Setup

This project is configured to use your live n8n instance in two ways:

- Cursor MCP: `search_workflows`, `get_workflow_details`, `execute_workflow`
- Public API: full REST access for workflow CRUD through `scripts/n8n-api.ps1`

## Files

- `.cursor/mcp.json` points Cursor at `https://n8n.naiminvestments.com/mcp-server/http`
- `scripts/n8n-api.ps1` wraps the n8n public API with your user environment variables

## Required restart

Your secrets were stored as user environment variables:

- `N8N_BASE_URL`
- `N8N_API_KEY`
- `N8N_MCP_ACCESS_TOKEN`

Restart Cursor and any open terminal windows so they inherit the new variables.

## Cursor MCP

Cursor reads the workspace MCP server from `.cursor/mcp.json`.

The current n8n MCP server is live and authenticated, but it only exposes:

- `search_workflows`
- `get_workflow_details`
- `execute_workflow`

That is enough for discovery and running workflows. It is not enough for creating or editing workflows.

## Public API examples

List workflows:

```powershell
powershell -File .\scripts\n8n-api.ps1 -Method GET -ResourcePath workflows -Query "limit=10"
```

Get one workflow:

```powershell
powershell -File .\scripts\n8n-api.ps1 -Method GET -ResourcePath workflows/<workflow-id>
```

Create a workflow from a JSON file:

```powershell
powershell -File .\scripts\n8n-api.ps1 -Method POST -ResourcePath workflows -BodyFile .\workflow.json
```

Update a workflow from a JSON file:

```powershell
powershell -File .\scripts\n8n-api.ps1 -Method PATCH -ResourcePath workflows/<workflow-id> -BodyFile .\workflow.json
```

Delete a workflow:

```powershell
powershell -File .\scripts\n8n-api.ps1 -Method DELETE -ResourcePath workflows/<workflow-id>
```
