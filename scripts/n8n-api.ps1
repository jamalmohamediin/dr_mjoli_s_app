param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("GET", "POST", "PATCH", "PUT", "DELETE")]
  [string]$Method,

  [Parameter(Mandatory = $true)]
  [string]$ResourcePath,

  [string]$Query,
  [string]$BodyFile,
  [string]$BodyJson,
  [string]$OutFile
)

$ErrorActionPreference = "Stop"

$baseUrl = $env:N8N_BASE_URL
$apiKey = $env:N8N_API_KEY

if (-not $baseUrl) {
  throw "N8N_BASE_URL is not set."
}

if (-not $apiKey) {
  throw "N8N_API_KEY is not set."
}

if ($BodyFile -and $BodyJson) {
  throw "Use either -BodyFile or -BodyJson, not both."
}

$uri = "{0}/api/v1/{1}" -f $baseUrl.TrimEnd('/'), $ResourcePath.TrimStart('/')

if ($Query) {
  $uri = if ($Query.StartsWith("?")) {
    "{0}{1}" -f $uri, $Query
  } else {
    "{0}?{1}" -f $uri, $Query
  }
}

$headers = @{
  "X-N8N-API-KEY" = $apiKey
  "accept" = "application/json"
}

$request = @{
  Uri = $uri
  Method = $Method
  Headers = $headers
  TimeoutSec = 60
}

if ($BodyFile -or $BodyJson) {
  $body = if ($BodyFile) { Get-Content -Raw -Path $BodyFile } else { $BodyJson }
  $request["ContentType"] = "application/json"
  $request["Body"] = $body
}

$response = Invoke-RestMethod @request
$json = $response | ConvertTo-Json -Depth 100

if ($OutFile) {
  Set-Content -Path $OutFile -Value $json
} else {
  Write-Output $json
}
