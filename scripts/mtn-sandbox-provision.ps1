# MTN MoMo Sandbox — create API User + API Key
#
# In SANDBOX there is usually NO "Create API User" button on the website.
# You create credentials with these two API calls (MTN docs: API User and Key Management).
#
# BEFORE RUNNING:
# 1. Subscribe to "Collection" on https://momodeveloper.mtn.com
# 2. Copy your Primary (or Secondary) subscription key from Profile → Subscriptions
# 3. Set it below OR run: $env:MTN_MOMO_SUBSCRIPTION_KEY = "your-key-here"
#
# Usage (PowerShell):
#   cd scripts
#   .\mtn-sandbox-provision.ps1
#
# Optional: set callback host to your domain (no https://), e.g. your-app.vercel.app

param(
  [string]$SubscriptionKey = $env:MTN_MOMO_SUBSCRIPTION_KEY,
  [string]$CallbackHost = "your-app.vercel.app"
)

$BaseUrl = "https://sandbox.momodeveloper.mtn.com/v1_0"

if ([string]::IsNullOrWhiteSpace($SubscriptionKey)) {
  Write-Host ""
  Write-Host "Missing subscription key." -ForegroundColor Red
  Write-Host "Set MTN_MOMO_SUBSCRIPTION_KEY or pass -SubscriptionKey"
  Write-Host "Get it from: momodeveloper.mtn.com -> Sign in -> Profile -> Subscriptions -> Collection -> Primary key"
  Write-Host ""
  exit 1
}

# Step 1: UUID becomes your API User (X-Reference-Id)
$ApiUser = [guid]::NewGuid().ToString()
Write-Host "Creating API User: $ApiUser" -ForegroundColor Cyan

$createUserHeaders = @{
  "X-Reference-Id"           = $ApiUser
  "Ocp-Apim-Subscription-Key" = $SubscriptionKey
  "Content-Type"             = "application/json"
}
$createUserBody = @{ providerCallbackHost = $CallbackHost } | ConvertTo-Json

try {
  $userResponse = Invoke-WebRequest -Uri "$BaseUrl/apiuser" -Method POST -Headers $createUserHeaders -Body $createUserBody -UseBasicParsing
  Write-Host "API User created (HTTP $($userResponse.StatusCode))" -ForegroundColor Green
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  $body = ""
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $body = $reader.ReadToEnd()
  }
  Write-Host "Create user failed (HTTP $status)" -ForegroundColor Red
  Write-Host $body
  if ($status -eq 409) {
    Write-Host "Hint: This UUID already exists. Run the script again (new UUID) or use your existing API User." -ForegroundColor Yellow
  }
  if ($status -eq 401 -or $status -eq 403) {
    Write-Host "Hint: Wrong subscription key, or you are not subscribed to Collection product." -ForegroundColor Yellow
  }
  exit 1
}

# Step 2: Generate API Key (shown ONCE in response body)
Write-Host "Generating API Key..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

$keyHeaders = @{
  "Ocp-Apim-Subscription-Key" = $SubscriptionKey
}

try {
  $keyResponse = Invoke-RestMethod -Uri "$BaseUrl/apiuser/$ApiUser/apikey" -Method POST -Headers $keyHeaders
  $ApiKey = $keyResponse.apiKey
} catch {
  Write-Host "Generate API key failed." -ForegroundColor Red
  Write-Host $_.Exception.Message
  Write-Host "Hint: Wait 5-10 seconds after creating the user, then run mtn-sandbox-step2-apikey.ps1" -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "========== SAVE THESE NOW (API key cannot be viewed again) ==========" -ForegroundColor Yellow
Write-Host "MTN_MOMO_API_USER=$ApiUser"
Write-Host "MTN_MOMO_API_KEY=$ApiKey"
Write-Host "MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY=(your primary/secondary key)"
Write-Host "MTN_MOMO_TARGET_ENVIRONMENT=sandbox"
Write-Host "MTN_MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com"
Write-Host "====================================================================="
Write-Host ""
Write-Host "Add the above to Vercel Environment Variables and local .env (never commit .env)." -ForegroundColor Green

# Save to gitignored file for convenience
$outFile = Join-Path $PSScriptRoot ".mtn-sandbox-credentials.local"
@(
  "# Created $(Get-Date -Format o) - DO NOT COMMIT",
  "MTN_MOMO_API_USER=$ApiUser",
  "MTN_MOMO_API_KEY=$ApiKey",
  "MTN_MOMO_TARGET_ENVIRONMENT=sandbox",
  "MTN_MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com"
) | Set-Content -Path $outFile -Encoding UTF8
Write-Host "Also saved to $outFile (keep private)" -ForegroundColor DarkGray
