@echo off
REM Clean build and restart API server

echo.
echo ========================================
echo  Cleaning and Rebuilding API Server
echo ========================================
echo.

REM Navigate to api-server directory
cd artifacts\api-server

REM Remove dist folder
echo Removing old build...
if exist dist (
    rmdir /s /q dist
    echo ✓ Old build removed
) else (
    echo ✓ No old build found
)

echo.
echo Building new version...
pnpm build

echo.
echo ========================================
echo  Starting API Server
echo ========================================
echo.

pnpm start

pause
