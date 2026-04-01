param(
  [Parameter(Mandatory = $true)]
  [string]$ApiKey,
  [string]$ImagePath = "src/assets/appendectomy.jpg",
  [switch]$UseQueryString,
  [switch]$TextOnly,
  [string]$Prompt = "Reply with OK only.",
  [string]$Model = "gemini-2.5-flash"
)

$ErrorActionPreference = "Stop"

$parts = @(
  @{ text = $Prompt }
)

if (-not $TextOnly) {
  $resolvedImagePath = Resolve-Path -LiteralPath $ImagePath
  $imageBytes = [System.IO.File]::ReadAllBytes($resolvedImagePath)
  $imageBase64 = [System.Convert]::ToBase64String($imageBytes)
  $extension = [System.IO.Path]::GetExtension($resolvedImagePath.Path).ToLowerInvariant()

  $mimeType = switch ($extension) {
    ".png" { "image/png" }
    ".webp" { "image/webp" }
    default { "image/jpeg" }
  }

  $parts += @{
    inline_data = @{
      mime_type = $mimeType
      data = $imageBase64
    }
  }
}

$bodyObject = @{
  contents = @(
    @{
      role = "user"
      parts = $parts
    }
  )
}

if (-not $TextOnly) {
  $bodyObject["generationConfig"] = @{
    temperature = 0
    responseMimeType = "application/json"
  }
}

$body = $bodyObject | ConvertTo-Json -Depth 100

try {
  $uri = "https://generativelanguage.googleapis.com/v1beta/models/$Model`:generateContent"
  $headers = @{}

  if ($UseQueryString) {
    $uri += "?key=" + [System.Uri]::EscapeDataString($ApiKey)
  } else {
    $headers["x-goog-api-key"] = $ApiKey
  }

  $response = Invoke-RestMethod `
    -Method POST `
    -Uri $uri `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $body `
    -TimeoutSec 120

  $response | ConvertTo-Json -Depth 100
} catch {
  $webResponse = $_.Exception.Response
  if (-not $webResponse) {
    throw
  }

  $stream = $webResponse.GetResponseStream()
  $reader = New-Object System.IO.StreamReader($stream)
  $responseBody = $reader.ReadToEnd()
  throw $responseBody
}
