param(
  [Parameter(Mandatory = $true)]
  [string]$ApiKey,
  [string]$CredentialName = ("Google Gemini(PaLM) Api account Dev " + (Get-Date -Format "yyyyMMdd_HHmmss")),
  [string]$ProjectId = $env:N8N_PROJECT_ID,
  [string]$ApiHost = "https://generativelanguage.googleapis.com"
)

$ErrorActionPreference = "Stop"

if (-not $env:N8N_BASE_URL) {
  throw "N8N_BASE_URL is not set."
}

if (-not $env:N8N_API_KEY) {
  throw "N8N_API_KEY is not set."
}

if (-not $ProjectId) {
  throw "ProjectId is required. Pass -ProjectId or set N8N_PROJECT_ID."
}

$headers = @{
  "X-N8N-API-KEY" = $env:N8N_API_KEY
  "accept" = "application/json"
  "Content-Type" = "application/json"
}

$body = @{
  name = $CredentialName
  type = "googlePalmApi"
  data = @{
    apiKey = $ApiKey
    host = $ApiHost
  }
  projectId = $ProjectId
} | ConvertTo-Json -Depth 20

$response = Invoke-RestMethod -Uri ($env:N8N_BASE_URL.TrimEnd("/") + "/api/v1/credentials") `
  -Method POST `
  -Headers $headers `
  -Body $body `
  -TimeoutSec 60

$response | ConvertTo-Json -Depth 20
