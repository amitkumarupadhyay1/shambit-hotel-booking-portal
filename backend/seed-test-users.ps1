Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Shambit Hotels - Database Seeding" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will clear ALL data and create test users:" -ForegroundColor Yellow
Write-Host "- Admin: admin@shambithotels.com" -ForegroundColor Green
Write-Host "- Hotel Owner: owner@example.com" -ForegroundColor Green
Write-Host "- Customer: customer@example.com" -ForegroundColor Green
Write-Host ""

$confirm = Read-Host "Are you sure you want to continue? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Operation cancelled." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "Running database seeding..." -ForegroundColor Blue
npm run seed:test-users

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Seeding Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Read-Host "Press Enter to exit"