# MTN MoMo Sandbox - Step 2 ONLY: generate API Key for an existing API User
#
# Usage:
#   $env:MTN_MOMO_SUBSCRIPTION_KEY = "your-primary-key"
#   .\mtn-sandbox-step2-apikey.ps1 -ApiUser "387faf96-2525-4293-84fe-ce49861b8041"
#
# This calls:
#   POST https://sandbox.momodeveloper.mtn.com/collection/v1_0/apiuser/{ApiUser}/apikey
# NOT bc-authorize (that is step 3, after you have the API key).

param(
  [Parameter(Mandatory = $true)]
  [string]$ApiUser,
  [string]$SubscriptionKey = $env:MTN_MOMO_SUBSCRIPTION_KEY
)

$BaseUrl = "https://sandbox.momodeveloper.mtn.com/v1_0"

if ([string]::IsNullOrWhiteSpace($SubscriptionKey)) {
  Write-Host "Set MTN_MOMO_SUBSCRIPTION_KEY to your Collection Primary key from momodeveloper.mtn.com" -ForegroundColor Red
  exit 1
}

Write-Host "Generating API Key for user: $ApiUser" -ForegroundColor Cyan
Write-Host "URL: $BaseUrl/apiuser/$ApiUser/apikey" -ForegroundColor DarkGray

$keyHeaders = @{ "Ocp-Apim-Subscription-Key" = $SubscriptionKey }

try {
  $keyResponse = Invoke-RestMethod -Uri "$BaseUrl/apiuser/$ApiUser/apikey" -Method POST -Headers $keyHeaders
  $ApiKey = $keyResponse.apiKey
} catch {
  Write-Host "Failed." -ForegroundColor Red
  $status = $_.Exception.Response.StatusCode.value__
  $body = ""
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $body = $reader.ReadToEnd()
  }
  if ($status) { Write-Host "HTTP status: $status" -ForegroundColor Red }
  if ($body) { Write-Host "Response: $body" -ForegroundColor Red }
  if (-not $status) { Write-Host $_.Exception.Message }
  Write-Host "If user was just created, wait 10 seconds and run again." -ForegroundColor Yellow
  Write-Host "If 404: API User may not exist - redo Step 1 with providerCallbackHost energyandlogics.com (no slash)." -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "========== COPY NOW - API key shown only once ==========" -ForegroundColor Yellow
Write-Host "MTN_MOMO_API_USER=$ApiUser"
Write-Host "MTN_MOMO_API_KEY=$ApiKey"
Write-Host "========================================================"
Write-Host ""
Write-Host "Add to Vercel Environment Variables. Do not commit to git." -ForegroundColor Green
