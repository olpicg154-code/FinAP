$rssPath = "C:\FinAP\rss.xml"
$outputPath = "C:\FinAP\news-bar.html"

[xml]$rss = Get-Content $rssPath

$items = $rss.rss.channel.item | Select-Object -First 10

$text = ""

foreach ($item in $items) {
    $text += " ● $($item.title) | "
}

$html = @"
<div style="background:#0b0f1a;color:#fff;padding:10px;white-space:nowrap;overflow:hidden;">
<marquee>
$text
</marquee>
</div>
"@

Set-Content -Path $outputPath -Value $html -Encoding UTF8

Write-Host "NEWS BAR UPDATED"