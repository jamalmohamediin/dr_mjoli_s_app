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

$baseUrl = $env:CANVA_BASE_URL
$accessToken = $env:CANVA_ACCESS_TOKEN
$timeoutSeconds = $env:CANVA_API_TIMEOUT_SECONDS

if (-not $baseUrl) {
  $baseUrl = "https://api.canva.com/rest/v1"
}

if (-not $accessToken) {
  throw "CANVA_ACCESS_TOKEN is not set."
}

if ($BodyFile -and $BodyJson) {
  throw "Use either -BodyFile or -BodyJson, not both."
}

if (-not $timeoutSeconds) {
  $timeoutSeconds = 120
}

$uri = "{0}/{1}" -f $baseUrl.TrimEnd('/'), $ResourcePath.TrimStart('/')

if ($Query) {
  $uri = if ($Query.StartsWith("?")) {
    "{0}{1}" -f $uri, $Query
  } else {
    "{0}?{1}" -f $uri, $Query
  }
}

$headers = @{
  "Authorization" = "Bearer $accessToken"
  "accept" = "application/json"
}

$request = @{
  Uri = $uri
  Method = $Method
  Headers = $headers
  TimeoutSec = [int]$timeoutSeconds
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
