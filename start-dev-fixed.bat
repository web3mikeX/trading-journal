@echo off
echo Starting DetaWise development server with Jest worker fix...
set NODE_OPTIONS=--max-old-space-size=8192
set UV_THREADPOOL_SIZE=1
cd /d "%~dp0"
npm run dev