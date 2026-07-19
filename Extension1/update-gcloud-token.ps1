$token = (gcloud auth print-access-token).Trim()
$email = (gcloud config get-value account).Trim()
$json = @{
    token = $token
    email = $email
} | ConvertTo-Json
Set-Content -Path "$PSScriptRoot\gcloud-token.json" -Value $json -Encoding utf8
Write-Host "Updated gcloud-token.json with email: $email"
