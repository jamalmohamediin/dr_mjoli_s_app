param(
  [Parameter(Mandatory = $true)]
  [string]$ApiKey,
  [string]$WorkflowId = "maGR6crURDdaw5LU"
)

$ErrorActionPreference = "Stop"

if ($ApiKey.Length -ge 2) {
  if (($ApiKey.StartsWith('"') -and $ApiKey.EndsWith('"')) -or ($ApiKey.StartsWith("'") -and $ApiKey.EndsWith("'"))) {
    $ApiKey = $ApiKey.Substring(1, $ApiKey.Length - 2)
  }
}

if (-not $env:N8N_BASE_URL) {
  throw "N8N_BASE_URL is not set."
}

if (-not $env:N8N_API_KEY) {
  throw "N8N_API_KEY is not set."
}

$baseUrl = $env:N8N_BASE_URL.TrimEnd("/")
$headers = @{
  "X-N8N-API-KEY" = $env:N8N_API_KEY
  "accept" = "application/json"
}
$backupDir = Join-Path $PSScriptRoot "n8n-workflow-backups"

if (-not (Test-Path -LiteralPath $backupDir)) {
  New-Item -ItemType Directory -Path $backupDir | Out-Null
}

function Invoke-N8nApi {
  param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("GET", "POST", "PUT")]
    [string]$Method,
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [object]$Body
  )

  $request = @{
    Uri = "$baseUrl/api/v1/$Path"
    Method = $Method
    Headers = $headers
    TimeoutSec = 60
  }

  if ($null -ne $Body) {
    $request["ContentType"] = "application/json"
    $request["Body"] = ($Body | ConvertTo-Json -Depth 100)
  }

  Invoke-RestMethod @request
}

$workflow = Invoke-N8nApi -Method GET -Path "workflows/$WorkflowId"
$backupFile = Join-Path $backupDir ("{0}_{1}.json" -f $WorkflowId, (Get-Date -Format "yyyyMMdd_HHmmss"))
$workflow | ConvertTo-Json -Depth 100 | Set-Content -LiteralPath $backupFile

$analyzeNode = $workflow.nodes | Where-Object { $_.name -eq "Analyze document" } | Select-Object -First 1
if (-not $analyzeNode) {
  throw "Analyze document node was not found."
}

$jsCode = @'
const prompt = `Extract structured details from this patient sticker image.
Return only valid JSON, nothing else.

The JSON schema must match exactly:
{
  "name": "",
  "patientId": "",
  "sex": "",
  "age": "",
  "dateOfBirth": "",
  "addressTown": "",
  "addressDistrict": "",
  "addressPostalCode": "",
  "addressPostBox": "",
  "medicalAidName": "",
  "medicalAidNumber": "",
  "mainMember": "",
  "mainMemberId": "",
  "authorization": "",
  "workNumber": "",
  "homeNumber": "",
  "dependCode": "",
  "hospitalName": "",
  "hospitalVisitNumber": "",
  "doctorName": "",
  "doctorPracticeNumber": "",
  "visitDate": "",
  "visitTime": ""
}

Extraction rules:
- hospitalVisitNumber must be the complete top-most sticker row exactly as printed, including letters, spaces, hyphens, and trailing codes.
- patientId must come from the value after ID:.
- dateOfBirth must come from DOB in YYYY-MM-DD.
- age must be human-readable, for example 86 Years.
- sex must be Female or Male exactly if visible.
- medicalAidName must come from MED.
- medicalAidNumber must come from the number on the MED row and must not include the leading #.
- mainMember must come from MEM.
- mainMemberId must come from the ID value below WK.
- workNumber must come from WK.
- homeNumber must come from HM.
- authorization must come from AUTH.
- dependCode must come from DEPEND CODE.
- doctorName must come from the doctor line above the barcodes.
- doctorPracticeNumber must come from DR Pr No.
- hospitalName must come from the line below the barcodes.
- addressTown, addressDistrict, addressPostalCode, and addressPostBox must preserve the printed values from the separate address lines.
- If the same town or district appears on two separate lines, populate both addressTown and addressDistrict with that repeated value.
- addressPostBox must keep the P.O Box label if it exists, for example P.O Box 286.
- If a field is missing, leave it as an empty string.
- If the upload is not a hospital patient sticker, or the text is unreadable, return every field as an empty string.
- Do not guess, infer, or invent values.
- Do not add extra fields.
- Do not include explanations.
Output must be valid JSON only.`;

const asText = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
};

const webhookItem = $("Patient Stickers Extraction").first();
const uploadedFile = webhookItem?.binary?.file;
const mimeType = asText(
  uploadedFile?.mimeType || uploadedFile?.fileMimeType || uploadedFile?.fileType,
).toLowerCase();

if (!uploadedFile) {
  return [{ json: { error: "Patient sticker image is required." } }];
}

if (!mimeType.startsWith("image/")) {
  return [{ json: { error: "Only image uploads are supported." } }];
}

try {
  const binaryBuffer = await this.helpers.getBinaryDataBuffer(0, "file");
  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType || "image/jpeg",
              data: binaryBuffer.toString("base64"),
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
    },
  };

  const response = await this.helpers.httpRequest({
    method: "POST",
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    qs: {
      key: "__API_KEY__",
    },
    headers: {
      "content-type": "application/json",
      "x-goog-api-client": "n8n-sticker-extraction/1.0",
    },
    body: requestBody,
    json: true,
    returnFullResponse: true,
  });

  const payload = response?.body ?? null;
  const statusCode = Number(response?.statusCode || 0);

  if (statusCode < 200 || statusCode >= 300) {
    return [{
      json: {
        error: payload?.error?.message || `Gemini request failed (${statusCode || "unknown"}).`,
        details: payload?.error?.details || [],
      },
    }];
  }

  const modelText = (payload?.candidates || [])
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => asText(part?.text))
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!modelText) {
    return [{ json: { error: "Gemini returned no text output.", rawModelResponse: payload } }];
  }

  return [{ json: { text: modelText } }];
} catch (error) {
  return [{
    json: {
      error: error?.message || "Gemini request failed.",
    },
  }];
}
'@

$jsCode = $jsCode.Replace("__API_KEY__", $ApiKey)

$analyzeNode.parameters = @{
  mode = "runOnceForAllItems"
  language = "javaScript"
  jsCode = $jsCode
}

$analyzeNode.type = "n8n-nodes-base.code"
$analyzeNode.typeVersion = 2

if ($analyzeNode.PSObject.Properties["credentials"]) {
  $analyzeNode.PSObject.Properties.Remove("credentials")
}

$updateSettings = @{}
if ($workflow.settings -and $workflow.settings.executionOrder) {
  $updateSettings.executionOrder = $workflow.settings.executionOrder
}
if ($workflow.settings -and $workflow.settings.callerPolicy) {
  $updateSettings.callerPolicy = $workflow.settings.callerPolicy
}

$updateBody = @{
  name = $workflow.name
  nodes = $workflow.nodes
  connections = $workflow.connections
}

if ($updateSettings.Count -gt 0) {
  $updateBody.settings = $updateSettings
}

$null = Invoke-N8nApi -Method PUT -Path "workflows/$WorkflowId" -Body $updateBody
$updatedWorkflow = Invoke-N8nApi -Method GET -Path "workflows/$WorkflowId"
$null = Invoke-N8nApi -Method POST -Path "workflows/$WorkflowId/activate" -Body @{
  versionId = $updatedWorkflow.versionId
}
$activatedWorkflow = Invoke-N8nApi -Method GET -Path "workflows/$WorkflowId"

[pscustomobject]@{
  workflowId = $activatedWorkflow.id
  workflowName = $activatedWorkflow.name
  versionId = $activatedWorkflow.versionId
  activeVersionId = $activatedWorkflow.activeVersionId
  analyzeNodeType = ($activatedWorkflow.nodes | Where-Object { $_.name -eq "Analyze document" } | Select-Object -First 1).type
  backupFile = $backupFile
} | ConvertTo-Json -Depth 20
