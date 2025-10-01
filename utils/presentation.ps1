# =========================
# utils/presentation.ps1
# Clean setup + end-to-end smoke for chat
# Run:
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\utils\presentation.ps1
# =========================

$ErrorActionPreference = 'Stop'

# ---- Config ----
$BASE = "http://localhost:8080"
$HARRY_EMAIL = "harry8@example.com"
$ELISE_EMAIL = "elise8@example.com"
$PASSWORD = "password1"       # per your ask

# ---- Helpers ----
function Post-Json {
  param(
    [Parameter(Mandatory=$true)][string]$Url,
    [Parameter(Mandatory=$true)][hashtable]$Body,
    [string]$Token
  )
  $headers = @{ 'Content-Type' = 'application/json' }
  if ($Token) { $headers.Authorization = "Bearer $Token" }
  Invoke-RestMethod -Method POST -Uri $Url -Headers $headers -Body ($Body | ConvertTo-Json -Depth 6)
}

function Get-Json {
  param(
    [Parameter(Mandatory=$true)][string]$Url,
    [string]$Token
  )
  $headers = @{}
  if ($Token) { $headers.Authorization = "Bearer $Token" }
  Invoke-RestMethod -Method GET -Uri $Url -Headers $headers
}

function Delete-UserById {
  param(
    [Parameter(Mandatory=$true)][string]$UserId,
    [Parameter(Mandatory=$true)][string]$Token
  )
  $headers = @{ Authorization = "Bearer $Token" }
  Invoke-RestMethod -Method DELETE -Uri "$BASE/user/$UserId" -Headers $headers
}

function Try-Login {
  param(
    [Parameter(Mandatory=$true)][string]$Email,
    [Parameter(Mandatory=$true)][string]$Password
  )
  try {
    Post-Json -Url "$BASE/auth/login" -Body @{ email = $Email; password = $Password }
  } catch {
    return $null
  }
}

function Ensure-User-Deleted-IfExists {
  param(
    [Parameter(Mandatory=$true)][string]$Email,
    [Parameter(Mandatory=$true)][string]$Password
  )
  Write-Host "--- Cleanup (if exists): $Email ---"
  $login = Try-Login -Email $Email -Password $Password
  if ($null -ne $login) {
    $userId = $login.user._id
    try {
      $null = Delete-UserById -UserId $userId -Token $login.accessToken
      Write-Host "Deleted user: $Email -> $userId"
      Start-Sleep -Milliseconds 300
    } catch {
      Write-Warning ("Delete failed (non-fatal) for {0}: {1}" -f $Email, $_.Exception.Message)
    }
  } else {
    Write-Host "No existing user (or wrong password) for $Email. Skipping delete."
  }
}

function Create-User {
  param(
    [Parameter(Mandatory=$true)][string]$Email,
    [Parameter(Mandatory=$true)][string]$Password,
    [Parameter(Mandatory=$true)][string]$DisplayName,
    [Parameter(Mandatory=$true)][int]$Age,
    [Parameter(Mandatory=$true)][string]$AreaKey,
    [Parameter(Mandatory=$true)][string[]]$Interests
  )
  $payload = @{
    email       = $Email
    password    = $Password
    displayName = $DisplayName
    age         = $Age
    areaKey     = $AreaKey
    interests   = $Interests
  }
  $user = Post-Json -Url "$BASE/user" -Body $payload
  Write-Host "Created user: $Email -> $($user._id)"
  return $user
}

function Login-Or-Die {
  param(
    [Parameter(Mandatory=$true)][string]$Email,
    [Parameter(Mandatory=$true)][string]$Password
  )
  $login = Post-Json -Url "$BASE/auth/login" -Body @{ email = $Email; password = $Password }
  Write-Host ("Logged in: {0} -> token {1}..., id {2}" -f $Email, ($login.accessToken.Substring(0,10)), $login.user._id)
  return $login
}

function Get-FirstActiveMatchId {
  param(
    [Parameter(Mandatory=$true)][string]$BaseUrl,
    [Parameter(Mandatory=$true)][string]$Token
  )
  $headers = @{ Authorization = "Bearer $Token" }
  try {
    $matches = Invoke-RestMethod -Method GET -Uri "$BaseUrl/match/matches" -Headers $headers
    if ($null -eq $matches) { return $null }
    if ($matches -is [System.Array]) {
      if ($matches.Length -gt 0) { return $matches[0]._id } else { return $null }
    }
    return $matches._id
  } catch {
    Write-Warning "Failed to fetch matches: $($_.Exception.Message)"
    return $null
  }
}

function Read-ChatThread {
  param(
    [Parameter(Mandatory = $true)]
    [string]$BaseUrl,
    [Parameter(Mandatory = $true)]
    [string]$Token,
    [Parameter(Mandatory = $true)]
    [string]$MatchId,
    [int]$Limit = 50
  )

  if ([string]::IsNullOrWhiteSpace($MatchId)) {
    Write-Error "MatchId is empty."
    return
  }
  if ($MatchId -notmatch '^[a-fA-F0-9]{24}$') {
    Write-Error "MatchId looks invalid: '$MatchId'"
    return
  }

  $headers = @{ Authorization = "Bearer $Token" }

  # Build URL WITHOUT interpolation (avoids hidden character/backtick issues)
  $base = $BaseUrl.TrimEnd('/')
  $url  = [System.String]::Format("{0}/chat/{1}?limit={2}", $base, $MatchId, $Limit)

  Write-Host "Reading thread from: $url"
  try {
    $msgs = Invoke-RestMethod -Method GET -Uri $url -Headers $headers
    if ($msgs -is [System.Array]) {
      Write-Host "Received $($msgs.Count) messages."
    } else {
      Write-Host "Response (non-array):" ($msgs | ConvertTo-Json -Depth 6)
    }
    return $msgs
  } catch {
    Write-Error "Read failed: $($_.ErrorDetails.Message)"
  }
}


# ---- 0) Clean slate (delete if exists) ----
Ensure-User-Deleted-IfExists -Email $HARRY_EMAIL -Password $PASSWORD
Ensure-User-Deleted-IfExists -Email $ELISE_EMAIL -Password $PASSWORD

# ---- 1) Create users ----
Write-Host "`n--- Creating users ---"
$harryUser = Create-User -Email $HARRY_EMAIL -Password $PASSWORD -DisplayName "Harry" -Age 27 -AreaKey "inner_west" -Interests @("music","food","technology")
$eliseUser = Create-User -Email $ELISE_EMAIL -Password $PASSWORD -DisplayName "Elise" -Age 26 -AreaKey "eastern_suburbs" -Interests @("art","books","travel")

# ---- 2) Login both ----
Write-Host "`n--- Logging in ---"
$harryLogin = Login-Or-Die -Email $HARRY_EMAIL -Password $PASSWORD
$HARRY_TOKEN = $harryLogin.accessToken
$HARRY_ID = $harryLogin.user._id

$eliseLogin = Login-Or-Die -Email $ELISE_EMAIL -Password $PASSWORD
$ELISE_TOKEN = $eliseLogin.accessToken
$ELISE_ID = $eliseLogin.user._id

# Sanity: tokens exist
Write-Host ("Harry token prefix: {0}" -f $HARRY_TOKEN.Substring(0,10))
Write-Host ("Elise token prefix: {0}" -f $ELISE_TOKEN.Substring(0,10))

# ---- 3) Mutual like to create a match ----
Write-Host "`n--- Creating match via swipes ---"
$resH = Post-Json -Url "$BASE/match/swipe" -Token $HARRY_TOKEN -Body @{ toUserId = $ELISE_ID; action = "like" }
$resE = Post-Json -Url "$BASE/match/swipe" -Token $ELISE_TOKEN -Body @{ toUserId = $HARRY_ID; action = "like" }

$MATCH_ID = $null
if ($resH.match -and $resH.match._id) { $MATCH_ID = $resH.match._id }
if (-not $MATCH_ID -and $resE.match -and $resE.match._id) { $MATCH_ID = $resE.match._id }
if (-not $MATCH_ID) {
  $harryMatches = Get-Json -Url "$BASE/match/matches" -Token $HARRY_TOKEN
  if ($harryMatches -is [System.Array] -and $harryMatches.Length -gt 0) {
    $MATCH_ID = $harryMatches[0]._id
  } elseif ($harryMatches._id) {
    $MATCH_ID = $harryMatches._id
  }
}
Write-Host "MATCH_ID = $MATCH_ID"
if (-not $MATCH_ID) { throw "Could not derive MATCH_ID. Aborting." }

# ---- 4) Send two chat messages ----
Write-Host "`n--- Sending chat messages ---"
$send1 = Post-Json -Url "$BASE/chat/$MATCH_ID" -Token $HARRY_TOKEN -Body @{ body = "Hey Elise" }
Write-Host ("Harry send ok: {0}  -> {1}" -f ($send1.ok), $send1.message.body)

$send2 = Post-Json -Url "$BASE/chat/$MATCH_ID" -Token $ELISE_TOKEN -Body @{ body = "Hi Harry! All good here." }
Write-Host ("Elise send ok: {0}  -> {1}" -f ($send2.ok), $send2.message.body)

# ---- 5) Read thread ----
Write-Host "`n--- Reading thread ---"
if ($MATCH_ID -notmatch '^[a-fA-F0-9]{24}$') {
  Write-Error "MATCH_ID is missing/invalid; cannot read thread."
  return
}
Write-Host "Harry token prefix: $($HARRY_TOKEN.Substring(0,10))"
$thread = Read-ChatThread -BaseUrl $BASE -Token $HARRY_TOKEN -MatchId $MATCH_ID -Limit 50
if ($thread -is [System.Array]) {
  if ($thread.Count -gt 0) {
    $thread | ConvertTo-Json -Depth 6
  } else {
    Write-Host "No messages returned."
  }
} else {
  $thread | ConvertTo-Json -Depth 6
}

Write-Host "`nDone."
