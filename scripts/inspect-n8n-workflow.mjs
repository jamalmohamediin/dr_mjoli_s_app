const workflowId = process.argv[2];

if (!workflowId) {
  console.error("Usage: node scripts/inspect-n8n-workflow.mjs <workflowId>");
  process.exit(1);
}

const baseUrl = process.env.N8N_BASE_URL;
const apiKey = process.env.N8N_API_KEY;

if (!baseUrl || !apiKey) {
  console.error("N8N_BASE_URL and N8N_API_KEY must be set.");
  process.exit(1);
}

const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/v1/workflows/${workflowId}`, {
  headers: {
    "X-N8N-API-KEY": apiKey,
    accept: "application/json",
  },
});

if (!response.ok) {
  console.error("Failed to fetch workflow", response.status, await response.text());
  process.exit(1);
}

const workflow = await response.json();

console.log(`Workflow: ${workflow.name} (${workflow.id})`);
console.log(`Version: ${workflow.versionId}`);
console.log("");
console.log("Nodes:");

for (const node of workflow.nodes || []) {
  console.log(`- ${node.name}: ${node.type} v${node.typeVersion}`);
}

console.log("");
console.log("Connections:");

for (const [sourceName, outputs] of Object.entries(workflow.connections || {})) {
  const mainOutputs = outputs.main || [];
  mainOutputs.forEach((targets, outputIndex) => {
    targets.forEach((target) => {
      console.log(`- ${sourceName}[${outputIndex}] -> ${target.node}[${target.index}]`);
    });
  });
}
