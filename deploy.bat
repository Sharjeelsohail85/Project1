@echo off
cd /d "%~dp0"
node "C:\Program Files\nodejs\node_modules\npm\bin\npx-cli.js" wrangler deploy
pause