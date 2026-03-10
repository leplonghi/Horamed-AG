$projectRoot = "C:\Antigravity\horamed\horamed"
$srcDir = "$projectRoot\src"
$csrDir = "$projectRoot\node_modules\@phosphor-icons\react\dist\csr"
$outputFile = "$projectRoot\broken_icons.txt"

$brokenIcons = @{}
$validIcons = @{}
$fileCount = 0

$files = Get-ChildItem -Path $srcDir -Recurse -Include "*.tsx","*.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $importMatches = [regex]::Matches($content, 'import\s*\{([^}]+)\}\s*from\s*["'']@phosphor-icons/react["'']')

    foreach ($match in $importMatches) {
        $importBlock = $match.Groups[1].Value
        $items = $importBlock -split ','
        foreach ($item in $items) {
            $item = $item.Trim()
            if ($item -eq '') { continue }
            $parts = $item -split '\s+as\s+'
            $iconName = $parts[0].Trim()
            if ($iconName -eq '') { continue }

            $iconFile = "$csrDir\$iconName.es.js"
            if (-not (Test-Path $iconFile)) {
                if (-not $brokenIcons.ContainsKey($iconName)) {
                    $brokenIcons[$iconName] = @()
                }
                $relPath = $file.FullName.Replace($projectRoot, '').TrimStart('\')
                if ($brokenIcons[$iconName] -notcontains $relPath) {
                    $brokenIcons[$iconName] += $relPath
                }
            } else {
                $validIcons[$iconName] = $true
            }
        }
    }
    $fileCount++
}

$output = @()
$output += "=== AUDITORIA DE ICONES PHOSPHOR-ICONS ==="
$output += "Arquivos escaneados: $fileCount"
$output += "Icones validos encontrados: $($validIcons.Count)"
$output += "Icones invalidos encontrados: $($brokenIcons.Count)"
$output += ""
$output += "=== ICONES INVALIDOS (nao existem em dist/csr/*.es.js) ==="
$output += ""

foreach ($icon in ($brokenIcons.Keys | Sort-Object)) {
    $output += "INVALIDO: $icon"
    foreach ($f in $brokenIcons[$icon]) {
        $output += "  -> $f"
    }
    $output += ""
}

$output | Out-File -FilePath $outputFile -Encoding UTF8
Write-Host "Auditoria concluida."
Write-Host "Arquivos escaneados: $fileCount"
Write-Host "Icones INVALIDOS: $($brokenIcons.Count)"
Write-Host "Icones validos: $($validIcons.Count)"
Write-Host "Resultado em: $outputFile"
