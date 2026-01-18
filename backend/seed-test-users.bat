@echo off
echo.
echo ========================================
echo   Shambit Hotels - Database Seeding
echo ========================================
echo.
echo This will clear ALL data and create test users:
echo - Admin: admin@shambithotels.com
echo - Hotel Owner: owner@example.com  
echo - Customer: customer@example.com
echo.
set /p confirm="Are you sure you want to continue? (y/N): "
if /i "%confirm%" neq "y" (
    echo Operation cancelled.
    pause
    exit /b 0
)

echo.
echo Running database seeding...
npm run seed:test-users

echo.
echo ========================================
echo   Seeding Complete!
echo ========================================
pause