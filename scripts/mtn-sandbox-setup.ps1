# MTN MoMo Sandbox - check API User, create if missing, then generate API Key
#
# IMPORTANT: Provisioning uses /v1_0/apiuser (NOT /collection/v1_0/apiuser)
#
# Before running:
# 1. Subscribe to Collection on https://momodeveloper.mtn.com
# 2. Register an Application under Profile -> Your Applications (required or you get 401)
# 3. Use Collection Primary key as MTN_MOMO_SUBSCRIPTION_KEY
#
# Usage:
#   $env:MTN_MOMO_SUBSCRIPTION_KEY = "your-primary-key"
#   .\mtn-sandbox-setup.ps1 -CallbackHost "energyandlogics.com"

param(
  [string]$ApiUser = ([guid]::NewGuid().ToString()),
  [string]$SubscriptionKey = $env:MTN_MOMO_SUBSCRIPTION_KEY,
  [string]$CallbackHost = "energyandlogics.com"
)

# Sandbox USER PROVISIONING (steps 1 + 2)
$ProvisionUrl = "https://sandbox.momodeveloper.mtn.com/v1_0"

if ([string]::IsNullOrWhiteSpace($SubscriptionKey)) {
  Write-Host "Set MTN_MOMO_SUBSCRIPTION_KEY to your Collection Primary key." -ForegroundColor Red
  exit 1
}

$CallbackHost = $CallbackHost.Trim().TrimEnd('/')
if ($CallbackHost -match '^https?://') {
  $CallbackHost = ($CallbackHost -replace '^https?://', '').Split('/')[0]
}

$headers = @{ "Ocp-Apim-Subscription-Key" = $SubscriptionKey }

function Read-ErrorBody($exception) {
  if (-not $exception.Response) { return "" }
  $reader = New-Object System.IO.StreamReader($exception.Response.GetResponseStream())
  return $reader.ReadToEnd()
}

function Show-401Help {
  Write-Host ""
  Write-Host "401 = subscription key rejected OR application not registered." -ForegroundColor Yellow
  Write-Host "Fix on https://momodeveloper.mtn.com/developer :" -ForegroundColor Yellow
  Write-Host "  1. Your Applications -> Register application (wait for approval)" -ForegroundColor Yellow
  Write-Host "  2. Your Subscriptions -> confirm Collection is active" -ForegroundColor Yellow
  Write-Host "  3. Try Secondary key if Primary fails" -ForegroundColor Yellow
  Write-Host "  4. Regenerate key if it was shared publicly" -ForegroundColor Yellow
}

# Check if API User exists
Write-Host "API User UUID: $ApiUser" -ForegroundColor Cyan
$userExists = $false
try {
  $userInfo = Invoke-RestMethod -Uri "$ProvisionUrl/apiuser/$ApiUser" -Method GET -Headers $headers
  $userExists = $true
  Write-Host "API User already exists." -ForegroundColor Green
  if ($userInfo.providerCallbackHost) {
    Write-Host "  Callback host: $($userInfo.providerCallbackHost)" -ForegroundColor DarkGray
  }
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  if ($status -eq 404) {
    Write-Host "API User not found - will create." -ForegroundColor Yellow
  } elseif ($status -eq 401) {
    Write-Host "Check failed (HTTP 401)" -ForegroundColor Red
    Show-401Help
    exit 1
  } else {
    Write-Host "Check failed (HTTP $status)" -ForegroundColor Red
    Write-Host (Read-ErrorBody $_.Exception)
    exit 1
  }
}

# Step 1: Create API User
if (-not $userExists) {
  $createHeaders = @{
    "X-Reference-Id"            = $ApiUser
    "Ocp-Apim-Subscription-Key" = $SubscriptionKey
    "Content-Type"              = "application/json"
  }
  $body = @{ providerCallbackHost = $CallbackHost } | ConvertTo-Json

  Write-Host "POST $ProvisionUrl/apiuser" -ForegroundColor Cyan
  Write-Host "  providerCallbackHost: $CallbackHost" -ForegroundColor DarkGray
  try {
    $create = Invoke-WebRequest -Uri "$ProvisionUrl/apiuser" -Method POST -Headers $createHeaders -Body $body -UseBasicParsing
    Write-Host "API User created (HTTP $($create.StatusCode))" -ForegroundColor Green
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    $errBody = Read-ErrorBody $_.Exception
    Write-Host "Create user failed (HTTP $status)" -ForegroundColor Red
    if ($errBody) { Write-Host $errBody }
    if ($status -eq 401) { Show-401Help }
    if ($status -eq 409) {
      Write-Host "UUID already used - run again without -ApiUser to get a new UUID." -ForegroundColor Yellow
    }
    exit 1
  }
  Start-Sleep -Seconds 3
}

# Step 2: Generate API Key
Write-Host "POST $ProvisionUrl/apiuser/$ApiUser/apikey" -ForegroundColor Cyan
try {
  $keyResponse = Invoke-RestMethod -Uri "$ProvisionUrl/apiuser/$ApiUser/apikey" -Method POST -Headers $headers
  $ApiKey = $keyResponse.apiKey
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  Write-Host "Generate API key failed (HTTP $status)" -ForegroundColor Red
  Write-Host (Read-ErrorBody $_.Exception)
  if ($status -eq 401) { Show-401Help }
  exit 1
}

Write-Host ""
Write-Host "========== SAVE IN VERCEL NOW ==========" -ForegroundColor Yellow
Write-Host "MTN_MOMO_API_USER=$ApiUser"
Write-Host "MTN_MOMO_API_KEY=$ApiKey"
Write-Host "MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY=(your primary key)"
Write-Host "MTN_MOMO_TARGET_ENVIRONMENT=sandbox"
Write-Host "MTN_MOMO_PROVISION_BASE_URL=https://sandbox.momodeveloper.mtn.com/v1_0"
Write-Host "MTN_MOMO_COLLECTION_BASE_URL=https://sandbox.momodeveloper.mtn.com/collection/v1_0"
Write-Host "MTN_MOMO_CALLBACK_HOST=$CallbackHost"
Write-Host "========================================"
