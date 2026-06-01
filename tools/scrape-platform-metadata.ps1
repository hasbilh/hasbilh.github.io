param(
  [string]$DatabasePath = "data/discography.json",
  [int]$DelayMilliseconds = 350
)

$ErrorActionPreference = "Stop"

function Get-PropertyValue($Object, [string]$Name) {
  if ($null -eq $Object) { return $null }
  $prop = $Object.PSObject.Properties[$Name]
  if ($prop) { return $prop.Value }
  return $null
}

function Set-PropertyValue($Object, [string]$Name, $Value) {
  if ([string]::IsNullOrWhiteSpace([string]$Value)) { return $false }
  $current = Get-PropertyValue $Object $Name
  if ([string]$current -eq [string]$Value) { return $false }
  if ($Object.PSObject.Properties[$Name]) {
    $Object.$Name = $Value
  } else {
    $Object | Add-Member -NotePropertyName $Name -NotePropertyValue $Value
  }
  return $true
}

function Ensure-MetadataObject($Database, [string]$Title) {
  if (-not $Database.platformMetadata) {
    $Database | Add-Member -NotePropertyName platformMetadata -NotePropertyValue ([pscustomobject]@{})
  }
  if (-not $Database.platformMetadata.PSObject.Properties[$Title]) {
    $Database.platformMetadata | Add-Member -NotePropertyName $Title -NotePropertyValue ([pscustomobject]@{})
  }
  return $Database.platformMetadata.$Title
}

function Get-MetadataObject($Database, [string]$Title) {
  if (-not $Database.platformMetadata) { return $null }
  return Get-PropertyValue $Database.platformMetadata $Title
}

function Get-PlatformValue($Database, $Item, [string]$Name) {
  $itemValue = Get-PropertyValue $Item $Name
  if ($itemValue) { return $itemValue }
  $meta = Get-MetadataObject $Database $Item.title
  return Get-PropertyValue $meta $Name
}

function Get-SpotifyUrl($Item) {
  if ($Item.spotifyTrackId -and $Item.spotifyTrackId -match '^[A-Za-z0-9]{22}$') {
    return "https://open.spotify.com/track/$($Item.spotifyTrackId)"
  }
  if ($Item.spotifyId -and $Item.spotifyId -match '^[A-Za-z0-9]{22}$') {
    return "https://open.spotify.com/album/$($Item.spotifyId)"
  }
  return $null
}

function Get-AppleIdsFromUrl([string]$Url) {
  $result = [ordered]@{}
  if ([string]::IsNullOrWhiteSpace($Url)) { return $result }
  if ($Url -match '/album/[^/?#]+/(\d+)') { $result.appleAlbumId = $Matches[1] }
  if ($Url -match '[?&]i=(\d+)') { $result.appleTrackId = $Matches[1] }
  return $result
}

function Get-YouTubeIdFromUrl([string]$Url) {
  if ([string]::IsNullOrWhiteSpace($Url)) { return $null }
  if ($Url -match '[?&]v=([^&#]+)') { return $Matches[1] }
  if ($Url -match 'youtu\.be/([^?&#/]+)') { return $Matches[1] }
  return $null
}

function Get-NumericIdFromUrl([string]$Url, [string]$Kind) {
  if ([string]::IsNullOrWhiteSpace($Url)) { return $null }
  if ($Kind -eq 'deezer' -and $Url -match '/track/(\d+)') { return $Matches[1] }
  if ($Kind -eq 'tidal' -and $Url -match '/track/(\d+)') { return $Matches[1] }
  return $null
}

function Invoke-Json($Url) {
  try {
    return Invoke-RestMethod -Uri $Url -Headers @{ "User-Agent" = "hasbilh-discography-metadata/1.0" } -TimeoutSec 20
  } catch {
    return $null
  }
}

function Resolve-SongLink($Url) {
  if ([string]::IsNullOrWhiteSpace($Url)) { return $null }
  $encoded = [uri]::EscapeDataString($Url)
  return Invoke-Json "https://api.song.link/v1-alpha.1/links?url=$encoded&userCountry=ID"
}

function Search-Apple($Item) {
  $term = [uri]::EscapeDataString("$($Item.title) $($Item.artist)")
  $json = Invoke-Json "https://itunes.apple.com/search?term=$term&country=ID&media=music&entity=song&limit=5"
  if (-not $json -or -not $json.results) { return $null }
  $title = ([string]$Item.title).ToLowerInvariant()
  $artist = ([string]$Item.artist).ToLowerInvariant()
  return $json.results | Where-Object {
    $_.trackName -and $_.artistName -and
    ([string]$_.trackName).ToLowerInvariant() -eq $title -and
    $artist.Contains(([string]$_.artistName).ToLowerInvariant().Split(',')[0].Trim())
  } | Select-Object -First 1
}

function Search-Deezer($Item) {
  $term = [uri]::EscapeDataString("$($Item.title) $($Item.artist)")
  $json = Invoke-Json "https://api.deezer.com/search/track?q=$term&limit=5"
  if (-not $json -or -not $json.data) { return $null }
  $title = ([string]$Item.title).ToLowerInvariant()
  return $json.data | Where-Object {
    $_.title -and ([string]$_.title).ToLowerInvariant() -eq $title
  } | Select-Object -First 1
}

$db = Get-Content -Raw $DatabasePath | ConvertFrom-Json
if (-not $db.platformMetadata) {
  $db | Add-Member -NotePropertyName platformMetadata -NotePropertyValue ([pscustomobject]@{})
}

$stats = [ordered]@{
  checked = 0
  changedItems = 0
  fieldsChanged = 0
  songlinkHits = 0
  appleFallbackHits = 0
  deezerFallbackHits = 0
}

foreach ($item in $db.discography) {
  $stats.checked++
  $meta = Ensure-MetadataObject $db $item.title
  $before = ($meta | ConvertTo-Json -Compress)
  $sourceUrl = Get-SpotifyUrl $item
  if (-not $sourceUrl) {
    $sourceUrl = Get-PlatformValue $db $item 'appleUrl'
  }
  if (-not $sourceUrl) {
    $deezerExisting = Get-PlatformValue $db $item 'deezerTrackId'
    if ($deezerExisting) { $sourceUrl = "https://www.deezer.com/track/$deezerExisting" }
  }

  $resolved = Resolve-SongLink $sourceUrl
  if ($resolved -and $resolved.linksByPlatform) {
    $stats.songlinkHits++

    $appleUrl = Get-PropertyValue (Get-PropertyValue $resolved.linksByPlatform 'appleMusic') 'url'
    if ($appleUrl) {
      if (Set-PropertyValue $meta 'appleUrl' $appleUrl) { $stats.fieldsChanged++ }
      $ids = Get-AppleIdsFromUrl $appleUrl
      if ($ids.appleTrackId -and (Set-PropertyValue $meta 'appleTrackId' $ids.appleTrackId)) { $stats.fieldsChanged++ }
      if ($ids.appleAlbumId -and (Set-PropertyValue $meta 'appleAlbumId' $ids.appleAlbumId)) { $stats.fieldsChanged++ }
    }

    $youtubeMusicUrl = Get-PropertyValue (Get-PropertyValue $resolved.linksByPlatform 'youtubeMusic') 'url'
    $youtubeMusicId = Get-YouTubeIdFromUrl $youtubeMusicUrl
    if ($youtubeMusicId -and (Set-PropertyValue $meta 'youtubeMusicId' $youtubeMusicId)) { $stats.fieldsChanged++ }

    $deezerUrl = Get-PropertyValue (Get-PropertyValue $resolved.linksByPlatform 'deezer') 'url'
    $deezerTrackId = Get-NumericIdFromUrl $deezerUrl 'deezer'
    if ($deezerTrackId -and (Set-PropertyValue $meta 'deezerTrackId' $deezerTrackId)) { $stats.fieldsChanged++ }

    $tidalUrl = Get-PropertyValue (Get-PropertyValue $resolved.linksByPlatform 'tidal') 'url'
    $tidalTrackId = Get-NumericIdFromUrl $tidalUrl 'tidal'
    if ($tidalTrackId -and (Set-PropertyValue $meta 'tidalTrackId' $tidalTrackId)) { $stats.fieldsChanged++ }

    $soundcloudUrl = Get-PropertyValue (Get-PropertyValue $resolved.linksByPlatform 'soundcloud') 'url'
    if ($soundcloudUrl -and (Set-PropertyValue $meta 'soundcloudUrl' $soundcloudUrl)) { $stats.fieldsChanged++ }
  }

  if (-not (Get-PlatformValue $db $item 'appleTrackId')) {
    $apple = Search-Apple $item
    if ($apple) {
      $stats.appleFallbackHits++
      if (Set-PropertyValue $meta 'appleUrl' $apple.trackViewUrl) { $stats.fieldsChanged++ }
      if (Set-PropertyValue $meta 'appleTrackId' ([string]$apple.trackId)) { $stats.fieldsChanged++ }
      if (Set-PropertyValue $meta 'appleAlbumId' ([string]$apple.collectionId)) { $stats.fieldsChanged++ }
    }
  }

  if (-not (Get-PlatformValue $db $item 'deezerTrackId')) {
    $deezer = Search-Deezer $item
    if ($deezer) {
      $stats.deezerFallbackHits++
      if (Set-PropertyValue $meta 'deezerTrackId' ([string]$deezer.id)) { $stats.fieldsChanged++ }
    }
  }

  $after = ($meta | ConvertTo-Json -Compress)
  if ($before -ne $after) { $stats.changedItems++ }
  Start-Sleep -Milliseconds $DelayMilliseconds
}

$json = $db | ConvertTo-Json -Depth 20
Set-Content -Path $DatabasePath -Value $json -Encoding UTF8
$stats | ConvertTo-Json
