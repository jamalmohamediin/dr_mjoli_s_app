const executionId = process.argv[2];

if (!executionId) {
  console.error("Usage: node scripts/inspect-n8n-execution.mjs <executionId>");
  process.exit(1);
}

const baseUrl = process.env.N8N_BASE_URL;
const apiKey = process.env.N8N_API_KEY;

if (!baseUrl || !apiKey) {
  console.error("N8N_BASE_URL and N8N_API_KEY must be set.");
  process.exit(1);
}

const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/v1/executions/${executionId}?includeData=true`, {
  headers: {
    "X-N8N-API-KEY": apiKey,
    accept: "application/json",
  },
});

if (!response.ok) {
  console.error("Failed to fetch execution", response.status, await response.text());
  process.exit(1);
}

const execution = await response.json();
console.log(JSON.stringify(execution, null, 2));
