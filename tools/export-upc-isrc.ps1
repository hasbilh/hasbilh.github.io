$ErrorActionPreference = "Stop"

function Get-Field {
  param([string]$Text, [string]$Name)
  $m = [regex]::Match($Text, "$Name\s*:\s*(null|`"([^`"]*)`"|(\d+))")
  if (-not $m.Success -or $m.Groups[1].Value -eq "null") { return $null }
  if ($m.Groups[2].Success) { return $m.Groups[2].Value }
  return $m.Groups[3].Value
}

function Escape-XmlText {
  param([AllowNull()][string]$Text)
  if ($null -eq $Text) { return "" }
  return [System.Security.SecurityElement]::Escape($Text)
}

function Invoke-Json {
  param([string]$Uri)
  try {
    Start-Sleep -Milliseconds 120
    return Invoke-RestMethod -Uri $Uri -Headers @{ "User-Agent" = "Mozilla/5.0 metadata-export" }
  } catch {
    return $null
  }
}

function Get-UpcFromArtwork {
  param($Result)
  $art = $Result.artworkUrl100
  if (-not $art) { return $null }
  $m = [regex]::Match($art, "/([0-9]{8,14})(?:_cover)?\.(?:jpg|jpeg|png)(?:/|$)")
  if ($m.Success) { return $m.Groups[1].Value }
  return $null
}

function Normalize {
  param([AllowNull()][string]$Value)
  if ($null -eq $Value) { return "" }
  return ($Value.ToLowerInvariant() -replace "[^a-z0-9]+", " ").Trim()
}

$database = Get-Content "data/discography.json" -Raw | ConvertFrom-Json

$platformByTitle = @{}
foreach ($property in $database.platformMetadata.PSObject.Properties) {
  $meta = $property.Value
  $platformByTitle[$property.Name] = @{
    appleTrackId = $meta.appleTrackId
    appleAlbumId = $meta.appleAlbumId
    deezerTrackId = $meta.deezerTrackId
    youtubeId = $meta.youtubeId
    youtubeMusicId = $meta.youtubeMusicId
  }
}

$items = New-Object System.Collections.Generic.List[object]
foreach ($entry in $database.discography) {
  $title = $entry.title
  if (-not $title) { continue }
  $items.Add([pscustomobject]@{
    Title = $title
    Artist = $entry.artist
    Category = $entry.type
    Year = $entry.year
    ReleaseDate = $entry.releaseDate
    SpotifyTrackId = $entry.spotifyTrackId
    SpotifyAlbumId = $entry.spotifyId
    AppleId = $entry.appleId
    DeezerTrackId = $entry.deezerTrackId
    YouTubeId = $entry.youtubeId
    YouTubeMusicId = $entry.youtubeMusicId
  })
}

$rows = New-Object System.Collections.Generic.List[object]
$seenAlbumUpc = @{}
$i = 0
foreach ($item in $items) {
  $i++
  Write-Host "[$i/$($items.Count)] $($item.Title)"

  $platform = $platformByTitle[$item.Title]
  $youtubeId = $item.YouTubeId
  $youtubeMusicId = $item.YouTubeMusicId
  if ($platform) {
    if (-not $youtubeId) { $youtubeId = $platform.youtubeId }
    if (-not $youtubeMusicId) { $youtubeMusicId = $platform.youtubeMusicId }
  }
  if (-not $youtubeMusicId -and $youtubeId) { $youtubeMusicId = $youtubeId }
  $youtubeUrl = $(if ($youtubeId) { "https://www.youtube.com/watch?v=$youtubeId" } else { "" })
  $youtubeMusicUrl = $(if ($youtubeMusicId) { "https://music.youtube.com/watch?v=$youtubeMusicId" } else { "" })

  $deezerId = $item.DeezerTrackId
  if (-not $deezerId -and $platform) { $deezerId = $platform.deezerTrackId }

  $isrc = $null
  $deezerSource = $null
  if ($deezerId) {
    $dz = Invoke-Json "https://api.deezer.com/track/$deezerId"
    if ($dz -and -not $dz.error) {
      $isrc = $dz.isrc
      $deezerSource = "Deezer track API"
    }
  }

  if (-not $isrc) {
    $query = [uri]::EscapeDataString("$($item.Title) $($item.Artist)")
    $search = Invoke-Json "https://api.deezer.com/search/track?q=$query&limit=5"
    if ($search -and $search.data) {
      $itemTitleNorm = Normalize $item.Title
      $best = $search.data | Where-Object { (Normalize $_.title) -eq $itemTitleNorm } | Select-Object -First 1
      if ($best) {
        $dz = Invoke-Json "https://api.deezer.com/track/$($best.id)"
        if ($dz -and -not $dz.error) {
          $isrc = $dz.isrc
          $deezerId = "$($best.id)"
          $deezerSource = "Deezer search + track API"
        }
      }
    }
  }

  $appleTrackId = $null
  $appleAlbumId = $null
  if ($platform) {
    $appleTrackId = $platform.appleTrackId
    $appleAlbumId = $platform.appleAlbumId
  }
  if (-not $appleAlbumId -and $item.AppleId) { $appleAlbumId = $item.AppleId }

  $upc = $null
  $appleSource = $null
  if ($appleAlbumId -and $seenAlbumUpc.ContainsKey($appleAlbumId)) {
    $upc = $seenAlbumUpc[$appleAlbumId]
    $appleSource = "Cached Apple album artwork code"
  }
  if (-not $upc -and $appleTrackId) {
    $apple = Invoke-Json "https://itunes.apple.com/lookup?id=$appleTrackId&country=id"
    if ($apple -and $apple.resultCount -gt 0) {
      $upc = Get-UpcFromArtwork $apple.results[0]
      if (-not $appleAlbumId) { $appleAlbumId = "$($apple.results[0].collectionId)" }
      if ($upc -and $appleAlbumId) { $seenAlbumUpc[$appleAlbumId] = $upc }
      $appleSource = "iTunes lookup artwork code"
    }
  }
  if (-not $upc -and $appleAlbumId) {
    $apple = Invoke-Json "https://itunes.apple.com/lookup?id=$appleAlbumId&entity=song&country=id"
    if ($apple -and $apple.resultCount -gt 0) {
      $song = $apple.results | Where-Object { $_.wrapperType -eq "track" } | Select-Object -First 1
      if (-not $song) { $song = $apple.results[0] }
      $upc = Get-UpcFromArtwork $song
      if ($upc) { $seenAlbumUpc[$appleAlbumId] = $upc }
      $appleSource = "iTunes album lookup artwork code"
    }
  }
  if (-not $upc) {
    $term = [uri]::EscapeDataString("$($item.Title) $($item.Artist)")
    $apple = Invoke-Json "https://itunes.apple.com/search?term=$term&entity=song&country=id&limit=5"
    if ($apple -and $apple.resultCount -gt 0) {
      $itemTitleNorm = Normalize $item.Title
      $song = $apple.results | Where-Object { (Normalize $_.trackName) -eq $itemTitleNorm } | Select-Object -First 1
      if ($song) {
        $upc = Get-UpcFromArtwork $song
        if ($song.collectionId) { $appleAlbumId = "$($song.collectionId)" }
        if ($song.trackId) { $appleTrackId = "$($song.trackId)" }
        $appleSource = "iTunes search artwork code"
      }
    }
  }

  $rows.Add([pscustomobject]@{
    Judul = $item.Title
    Artist = $item.Artist
    Kategori = $item.Category
    Tahun = $item.Year
    TanggalRilis = $item.ReleaseDate
    UPC = $upc
    ISRC = $isrc
    SpotifyTrackId = $item.SpotifyTrackId
    SpotifyAlbumId = $item.SpotifyAlbumId
    YouTubeUrl = $youtubeUrl
    YouTubeMusicUrl = $youtubeMusicUrl
    AppleTrackId = $appleTrackId
    AppleAlbumId = $appleAlbumId
    DeezerTrackId = $deezerId
    SumberUPC = $appleSource
    SumberISRC = $deezerSource
    Catatan = $(if (-not $upc -or -not $isrc) { "Perlu verifikasi manual" } else { "" })
  })
}

$csvPath = "upc-isrc-discography.csv"
$rows | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8

$xlsPath = "upc-isrc-discography.xls"
$headers = @("Judul","Artist","Kategori","Tahun","TanggalRilis","UPC","ISRC","SpotifyTrackId","SpotifyAlbumId","YouTubeUrl","YouTubeMusicUrl","AppleTrackId","AppleAlbumId","DeezerTrackId","SumberUPC","SumberISRC","Catatan")
$xml = New-Object System.Text.StringBuilder
[void]$xml.AppendLine('<?xml version="1.0"?>')
[void]$xml.AppendLine('<?mso-application progid="Excel.Sheet"?>')
[void]$xml.AppendLine('<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">')
[void]$xml.AppendLine('<Worksheet ss:Name="UPC ISRC Discography"><Table>')
[void]$xml.AppendLine('<Row>' + (($headers | ForEach-Object { '<Cell><Data ss:Type="String">' + (Escape-XmlText $_) + '</Data></Cell>' }) -join '') + '</Row>')
foreach ($row in $rows) {
  [void]$xml.AppendLine('<Row>' + (($headers | ForEach-Object {
    $v = $row.$_
    '<Cell><Data ss:Type="String">' + (Escape-XmlText "$v") + '</Data></Cell>'
  }) -join '') + '</Row>')
}
[void]$xml.AppendLine('</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane><ActivePane>2</ActivePane></WorksheetOptions></Worksheet>')
[void]$xml.AppendLine('</Workbook>')
[System.IO.File]::WriteAllText((Join-Path (Get-Location) $xlsPath), $xml.ToString(), [System.Text.Encoding]::UTF8)

$missingUpc = ($rows | Where-Object { -not $_.UPC }).Count
$missingIsrc = ($rows | Where-Object { -not $_.ISRC }).Count
Write-Host "Exported $($rows.Count) rows to $xlsPath and $csvPath"
Write-Host "Missing UPC: $missingUpc"
Write-Host "Missing ISRC: $missingIsrc"
