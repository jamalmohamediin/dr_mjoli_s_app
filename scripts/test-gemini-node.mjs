import fs from "node:fs";
import path from "node:path";

const [apiKey, model = "gemini-2.5-flash", prompt = "Reply with OK only.", imagePath] = process.argv.slice(2);

if (!apiKey) {
  console.error("Usage: node scripts/test-gemini-node.mjs <apiKey> [model] [prompt]");
  process.exit(1);
}

const parts = [{ text: prompt }];

if (imagePath) {
  const resolvedPath = path.resolve(imagePath);
  const bytes = fs.readFileSync(resolvedPath);
  const extension = path.extname(resolvedPath).toLowerCase();
  const mimeType = extension === ".png" ? "image/png" : extension === ".webp" ? "image/webp" : "image/jpeg";

  parts.push({
    inline_data: {
      mime_type: mimeType,
      data: bytes.toString("base64"),
    },
  });
}

const body = {
  contents: [
    {
      parts,
    },
  ],
};

if (imagePath) {
  body.generationConfig = {
    temperature: 0,
    responseMimeType: "application/json",
  };
}

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
  {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-client": "codex-test/1.0",
    },
    body: JSON.stringify(body),
  },
);

console.log("status", response.status);
console.log(await response.text());
