param(
    [string]$Title,
    [string]$Link,
    [string]$Description
)

$File = "rss.xml"
$Date = (Get-Date).ToString("r")
$Id = [guid]::NewGuid().ToString()

$Item = @"
<item>
<title>$Title</title>
<link>$Link</link>
<description>$Description</description>
<pubDate>$Date</pubDate>
<guid>$Id</guid>
</item>

</channel>
</rss>
"@

$Content = Get-Content $File -Raw
$Content = $Content -replace "</channel>\s*</rss>", ""

$NewContent = $Content + $Item

Set-Content -Path $File -Value $NewContent -Encoding UTF8

Write-Host "RSS updated OK"