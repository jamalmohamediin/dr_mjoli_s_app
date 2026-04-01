param(
  [Parameter(Mandatory = $true)]
  [string]$NewCredentialId,
  [Parameter(Mandatory = $true)]
  [string]$NewCredentialName,
  [Parameter(Mandatory = $true)]
  [string[]]$WorkflowIds
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
    [ValidateSet("GET", "POST", "PATCH", "PUT")]
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

function Get-GeminiCredentialInfo {
  param([object[]]$Nodes)

  foreach ($node in $Nodes) {
    if ($node.name -eq "Analyze document" -and $node.credentials -and $node.credentials.googlePalmApi) {
      return $node.credentials.googlePalmApi
    }
  }

  return $null
}

function Update-GeminiCredential {
  param(
    [object[]]$Nodes,
    [string]$TargetCredentialId,
    [string]$TargetCredentialName
  )

  $updated = $false

  foreach ($node in $Nodes) {
    if ($node.name -ne "Analyze document") {
      continue
    }

    if (-not $node.credentials) {
      $node | Add-Member -NotePropertyName credentials -NotePropertyValue @{} -Force
    }

    $currentCredential = $node.credentials.googlePalmApi
    if (-not $currentCredential) {
      $node.credentials.googlePalmApi = @{
        id = $TargetCredentialId
        name = $TargetCredentialName
      }
      $updated = $true
      continue
    }

    if ($currentCredential.id -ne $TargetCredentialId -or $currentCredential.name -ne $TargetCredentialName) {
      $node.credentials.googlePalmApi.id = $TargetCredentialId
      $node.credentials.googlePalmApi.name = $TargetCredentialName
      $updated = $true
    }
  }

  return $updated
}

$results = @()

foreach ($workflowId in $WorkflowIds) {
  $workflow = Invoke-N8nApi -Method GET -Path "workflows/$workflowId"
  $backupFile = Join-Path $backupDir ("{0}_{1}.json" -f $workflowId, (Get-Date -Format "yyyyMMdd_HHmmss"))
  $workflow | ConvertTo-Json -Depth 100 | Set-Content -LiteralPath $backupFile

  $draftCredential = Get-GeminiCredentialInfo -Nodes $workflow.nodes
  $activeCredential = if ($workflow.activeVersion) {
    Get-GeminiCredentialInfo -Nodes $workflow.activeVersion.nodes
  } else {
    $null
  }

  $draftUpdated = Update-GeminiCredential -Nodes $workflow.nodes `
    -TargetCredentialId $NewCredentialId `
    -TargetCredentialName $NewCredentialName

  if ($draftUpdated) {
    $updateSettings = @{}
    if ($workflow.settings -and $workflow.settings.executionOrder) {
      $updateSettings.executionOrder = $workflow.settings.executionOrder
    }

    $updateBody = @{
      name = $workflow.name
      nodes = $workflow.nodes
      connections = $workflow.connections
    }

    if ($updateSettings.Count -gt 0) {
      $updateBody.settings = $updateSettings
    }

    $null = Invoke-N8nApi -Method PUT -Path "workflows/$workflowId" -Body $updateBody

    $workflow = Invoke-N8nApi -Method GET -Path "workflows/$workflowId"
    $draftCredential = Get-GeminiCredentialInfo -Nodes $workflow.nodes
  }

  $shouldActivate = $false
  if (-not $workflow.activeVersion) {
    $shouldActivate = $true
  } elseif (-not $activeCredential) {
    $shouldActivate = $true
  } elseif ($activeCredential.id -ne $NewCredentialId) {
    $shouldActivate = $true
  } elseif ($workflow.activeVersionId -ne $workflow.versionId) {
    $shouldActivate = $true
  }

  if ($shouldActivate) {
    $null = Invoke-N8nApi -Method POST -Path "workflows/$workflowId/activate" -Body @{
      versionId = $workflow.versionId
    }
    $workflow = Invoke-N8nApi -Method GET -Path "workflows/$workflowId"
    $activeCredential = if ($workflow.activeVersion) {
      Get-GeminiCredentialInfo -Nodes $workflow.activeVersion.nodes
    } else {
      $null
    }
  }

  $results += [pscustomobject]@{
    workflowId = $workflowId
    workflowName = $workflow.name
    draftVersionId = $workflow.versionId
    activeVersionId = $workflow.activeVersionId
    draftCredentialId = $draftCredential.id
    activeCredentialId = if ($activeCredential) { $activeCredential.id } else { "" }
    backupFile = $backupFile
    active = $workflow.active
  }
}

$results | ConvertTo-Json -Depth 10
