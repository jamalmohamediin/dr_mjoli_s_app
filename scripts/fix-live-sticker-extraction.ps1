param(
  [Parameter(Mandatory = $true)]
  [string]$ApiKey
)

$ErrorActionPreference = "Stop"

$credentialResponse = & "$PSScriptRoot\create-n8n-gemini-credential.ps1" -ApiKey $ApiKey | ConvertFrom-Json

if (-not $credentialResponse.id) {
  throw "Failed to create Gemini credential."
}

$credentialId = [string]$credentialResponse.id
$credentialName = [string]$credentialResponse.name

& "$PSScriptRoot\fix-n8n-gemini-credential.ps1" `
  -NewCredentialId $credentialId `
  -NewCredentialName $credentialName `
  -WorkflowIds @("maGR6crURDdaw5LU")
