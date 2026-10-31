# Build single-file deliverable: out/star-box.html
# Inlines CSS, JS and card images (base64) into one HTML file.
$ErrorActionPreference = 'Stop'

$root  = Split-Path -Parent $PSScriptRoot
$src   = Join-Path $root 'src'
$outD  = Join-Path $root 'out'
if (-not (Test-Path $outD)) { New-Item -ItemType Directory -Path $outD | Out-Null }

$enc  = New-Object System.Text.UTF8Encoding($false)
$indexPath = Join-Path $src 'index.html'
$html = [System.IO.File]::ReadAllText($indexPath, [System.Text.Encoding]::UTF8)

# 1) inline CSS
Get-ChildItem (Join-Path $src 'parts') -Filter *.css | Sort-Object Name | ForEach-Object {
  $tag = '<link rel="stylesheet" href="parts/' + $_.Name + '">'
  $css = [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8)
  $html = $html.Replace($tag, "<style>`n$css`n</style>")
}

# 2) inline JS
Get-ChildItem (Join-Path $src 'js') -Filter *.js | Sort-Object Name | ForEach-Object {
  $tag = '<script src="js/' + $_.Name + '"></script>'
  $js  = [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8)
  $html = $html.Replace($tag, "<script>`n$js`n</script>")
}

# 3) inline images
$imgDir = Join-Path $src 'assets\cards-web'
$pairs = New-Object System.Collections.Generic.List[string]
Get-ChildItem $imgDir -Filter *.jpg | Sort-Object Name | ForEach-Object {
  $b64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($_.FullName))
  $pairs.Add('"' + $_.BaseName + '":"' + $b64 + '"')
}
$json = '{' + ($pairs -join ',') + '}'
$html = $html.Replace('/*__IMG_DATA__*/null', $json)

$target = Join-Path $outD 'star-box.html'
[System.IO.File]::WriteAllText($target, $html, $enc)

$len = (Get-Item $target).Length
$left = ([regex]::Matches($html, '<script src=')).Count + ([regex]::Matches($html, '<link rel="stylesheet"')).Count
Write-Host ("Built: {0}" -f $target)
Write-Host ("Size : {0:N0} bytes ({1:N1} MB)" -f $len, ($len / 1MB))
Write-Host ("External refs left: {0}" -f $left)
Write-Host ("Images embedded : {0}" -f $pairs.Count)
