$ErrorActionPreference = "Stop"

$roots = @(
  "C:\Program Files",
  "C:\Program Files (x86)",
  "$env:USERPROFILE\AppData\Local",
  "C:\Users\jamal\AppData\Local"
) | Where-Object { Test-Path $_ }

$found = @()

foreach ($root in $roots) {
  try {
    $found += Get-ChildItem -Path $root -Filter node.exe -File -Recurse -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty FullName
  } catch {
    continue
  }
}

$found = $found | Sort-Object -Unique

[ordered]@{
  found = $found
} | ConvertTo-Json -Depth 10
