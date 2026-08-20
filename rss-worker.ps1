$feedUrl = "https://finap.com.ua/feed/"
$outputJson = "C:\FinAP\news.json"
$outputHtml = "C:\FinAP\news-bar.html"

$filters = @("банки","НБУ","податки","санкції")

function Get-RSS {
    try {
        [xml]$rss = Invoke-WebRequest -Uri $feedUrl -UseBasicParsing -TimeoutSec 10
        return $rss.rss.channel.item
    } catch {
        Write-Host "RSS ERROR"
        return @()
    }
}

function Filter-News($items) {
    return $items | Where-Object {
        $text = ($_.title + " " + $_.description).ToLower()
        foreach ($f in $filters) {
            if ($text.Contains($f.ToLower())) {
                return $true
            }
        }
        return $false
    }
}

Write-Host "RSS WARM START..."

while ($true) {

    $items = Get-RSS | Select-Object -First 30
    $items = Filter-News $items

    $json = $items | ForEach-Object {
        [PSCustomObject]@{
            title = $_.title
            link  = $_.link
        }
    }

    $json | ConvertTo-Json -Depth 3 | Set-Content $outputJson -Encoding UTF8

    $text = ($items | ForEach-Object { "● $($_.title)" }) -join " | "

    $html = @"
<div class="finap-ticker">
  <div class="ticker-badge">FINAP NEWS</div>
  <div class="ticker-track-wrapper">
    <div class="ticker-track">$text</div>
  </div>
</div>
"@

    Set-Content $outputHtml $html -Encoding UTF8

    Write-Host "RSS UPDATED ✔"

    Start-Sleep -Seconds 45
}
