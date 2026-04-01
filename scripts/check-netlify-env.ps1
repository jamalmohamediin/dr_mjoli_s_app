$ErrorActionPreference = "Stop"

$result = [ordered]@{
  hasNetlifyAuthTokenEnv = [bool]$env:NETLIFY_AUTH_TOKEN
  hasNetlifySiteIdEnv = [bool]$env:NETLIFY_SITE_ID
  roamingNetlifyDir = Test-Path "$env:USERPROFILE\AppData\Roaming\netlify"
  configNetlifyDir = Test-Path "$env:USERPROFILE\.config\netlify"
  roamingNpmDir = Test-Path "$env:USERPROFILE\AppData\Roaming\npm"
  netlifyCmdInRoamingNpm = Test-Path "$env:USERPROFILE\AppData\Roaming\npm\netlify.cmd"
  netlifyExeInRoamingNpm = Test-Path "$env:USERPROFILE\AppData\Roaming\npm\netlify.exe"
}

$result | ConvertTo-Json -Depth 10
