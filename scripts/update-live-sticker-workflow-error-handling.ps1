param(
  [string]$WorkflowId = "maGR6crURDdaw5LU"
)

$ErrorActionPreference = "Stop"

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

function New-ConnectionClone {
  param([object[]]$Items)

  $result = @()

  foreach ($item in @($Items)) {
    $result += [pscustomobject]@{
      node = $item.node
      type = $item.type
      index = $item.index
    }
  }

  return ,$result
}

$workflow = Invoke-N8nApi -Method GET -Path "workflows/$WorkflowId"
$backupFile = Join-Path $backupDir ("{0}_{1}.json" -f $WorkflowId, (Get-Date -Format "yyyyMMdd_HHmmss"))
$workflow | ConvertTo-Json -Depth 100 | Set-Content -LiteralPath $backupFile

$analyzeNode = $workflow.nodes | Where-Object { $_.name -eq "Analyze document" } | Select-Object -First 1
if (-not $analyzeNode) {
  throw "Analyze document node was not found."
}

$cleaningNode = $workflow.nodes | Where-Object { $_.name -eq "Cleaning the json received" } | Select-Object -First 1
if (-not $cleaningNode) {
  throw "Cleaning the json received node was not found."
}

if ($analyzeNode.PSObject.Properties["onError"]) {
  $analyzeNode.onError = "continueErrorOutput"
} else {
  $analyzeNode | Add-Member -NotePropertyName onError -NotePropertyValue "continueErrorOutput" -Force
}

$analyzeConnections = $workflow.connections.PSObject.Properties["Analyze document"].Value
if (-not $analyzeConnections -or -not $analyzeConnections.main -or $analyzeConnections.main.Count -eq 0) {
  throw "Analyze document node does not have a regular output connection."
}

$primaryOutput = New-ConnectionClone -Items $analyzeConnections.main[0]
if ($primaryOutput.Count -eq 0) {
  throw "Analyze document node primary output is empty."
}

$analyzeConnections.main = @(
  (New-ConnectionClone -Items $primaryOutput),
  (New-ConnectionClone -Items $primaryOutput)
)

$cleaningNode.parameters.jsCode = @'
const emptyPatientInfo = () => ({
  name: "",
  patientId: "",
  sex: "",
  age: "",
  dateOfBirth: "",
  address: "",
  medicalAidName: "",
  medicalAidNumber: "",
  mainMember: "",
  mainMemberId: "",
  authorization: "",
  workNumber: "",
  homeNumber: "",
  dependCode: "",
  hospitalName: "",
  hospitalVisitNumber: "",
  doctorName: "",
  doctorPracticeNumber: "",
  visitDate: "",
  visitTime: "",
});

const createError = (error, extra = {}) => [
  {
    json: {
      success: false,
      error,
      ...extra,
    },
  },
];

const asText = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
};

const stripCodeFences = (value) => {
  const fence = String.fromCharCode(96, 96, 96);
  return String(value || "")
    .split(fence + "json")
    .join("")
    .split(fence)
    .join("")
    .trim();
};

const pad = (value) => String(value).padStart(2, "0");

const normalizeDate = (value) => {
  const raw = asText(value);
  if (!raw) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const ymd = raw.match(/^(\d{4})[\/](\d{2})[\/](\d{2})$/);
  if (ymd) {
    return ymd[1] + "-" + ymd[2] + "-" + ymd[3];
  }

  const dmy = raw.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if (dmy) {
    return dmy[3] + "-" + dmy[2] + "-" + dmy[1];
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.getFullYear() + "-" + pad(parsed.getMonth() + 1) + "-" + pad(parsed.getDate());
};

const normalizeTime = (value) => {
  const raw = asText(value);
  if (!raw) {
    return "";
  }

  const match = raw.match(/(\d{1,2}):(\d{2})/);
  if (!match) {
    return "";
  }

  return pad(Number(match[1])) + ":" + match[2];
};

const normalizeGender = (value) => {
  const raw = asText(value);
  const lower = raw.toLowerCase();

  if (!lower) {
    return "";
  }

  if (lower.includes("female")) {
    return "female";
  }

  if (lower.includes("male")) {
    return "male";
  }

  return "other";
};

const joinAddress = (data) => {
  const orderedParts = [
    data.addressTown,
    data.addressDistrict,
    data.addressPostalCode,
    data.addressPostBox,
  ]
    .map(asText)
    .filter(Boolean);

  if (orderedParts.length > 0) {
    return orderedParts.join(", ");
  }

  return asText(data.address)
    .split(/\r?\n|,/)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
};

const workflowError = $json.error || null;
if (workflowError) {
  const message = typeof workflowError === "string"
    ? asText(workflowError)
    : asText(workflowError.description) ||
      asText(workflowError.message) ||
      asText(workflowError.messages?.[0]) ||
      "Patient sticker extraction failed.";

  return createError(message, {
    details: {
      node: typeof workflowError === "string" ? "" : asText(workflowError.node?.name),
      name: typeof workflowError === "string" ? "" : asText(workflowError.name),
    },
  });
}

const webhookItem = $("Patient Stickers Extraction").first();
const uploadedFile = webhookItem?.binary?.file;
const mimeType = asText(
  uploadedFile?.mimeType || uploadedFile?.fileMimeType || uploadedFile?.fileType,
).toLowerCase();

if (!uploadedFile) {
  return createError("Patient sticker image is required.");
}

if (!mimeType.startsWith("image/")) {
  return createError("Only image uploads are supported.");
}

const rawResponse = $json.content?.parts?.[0]?.text || $json.output || $json.text || $json.response || "";
if (!asText(rawResponse)) {
  return createError("No patient sticker details could be extracted from the image.");
}

let parsed;
try {
  parsed = JSON.parse(stripCodeFences(rawResponse));
} catch (error) {
  return createError("Failed to parse model response: " + error.message, {
    raw: asText(rawResponse),
  });
}

const patientInfo = emptyPatientInfo();
patientInfo.name = asText(parsed.name);
patientInfo.patientId = asText(parsed.patientId || parsed.id).replace(/^#/, "");
patientInfo.sex = normalizeGender(parsed.sex || parsed.gender);
patientInfo.age = asText(parsed.age);
patientInfo.dateOfBirth = normalizeDate(parsed.dateOfBirth || parsed.dob);
patientInfo.address = joinAddress(parsed);
patientInfo.medicalAidName = asText(parsed.medicalAidName);
patientInfo.medicalAidNumber = asText(parsed.medicalAidNumber).replace(/^#/, "");
patientInfo.mainMember = asText(parsed.mainMember);
patientInfo.mainMemberId = asText(parsed.mainMemberId);
patientInfo.authorization = asText(parsed.authorization);
patientInfo.workNumber = asText(parsed.workNumber);
patientInfo.homeNumber = asText(parsed.homeNumber);
patientInfo.dependCode = asText(parsed.dependCode);
patientInfo.hospitalName = asText(parsed.hospitalName);
patientInfo.hospitalVisitNumber = asText(parsed.hospitalVisitNumber);
patientInfo.doctorName = asText(parsed.doctorName);
patientInfo.doctorPracticeNumber = asText(parsed.doctorPracticeNumber);
patientInfo.visitDate = normalizeDate(parsed.visitDate || parsed.date);
patientInfo.visitTime = normalizeTime(parsed.visitTime || parsed.time);

const meaningfulFieldCount = Object.values(patientInfo).filter((value) => asText(value)).length;
if (!meaningfulFieldCount) {
  return createError("No patient sticker details could be extracted from the image.");
}

return [{ json: { success: true, patientInfo } }];
'@

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
  analyzeNodeOnError = ($activatedWorkflow.nodes | Where-Object { $_.name -eq "Analyze document" } | Select-Object -First 1).onError
  backupFile = $backupFile
} | ConvertTo-Json -Depth 20
