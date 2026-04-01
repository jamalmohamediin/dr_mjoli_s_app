const workflowId = process.argv[2];
const limit = Number(process.argv[3] || 5);

const baseUrl = process.env.N8N_BASE_URL;
const apiKey = process.env.N8N_API_KEY;

if (!baseUrl || !apiKey) {
  console.error("N8N_BASE_URL and N8N_API_KEY must be set.");
  process.exit(1);
}

const query = new URLSearchParams();
query.set("limit", String(limit));
if (workflowId) {
  query.set("workflowId", workflowId);
}
query.set("includeData", "false");

const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/v1/executions?${query.toString()}`, {
  headers: {
    "X-N8N-API-KEY": apiKey,
    accept: "application/json",
  },
});

if (!response.ok) {
  console.error("Failed to fetch executions", response.status, await response.text());
  process.exit(1);
}

const data = await response.json();
console.log(JSON.stringify(data, null, 2));
