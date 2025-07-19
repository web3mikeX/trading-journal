#\!/bin/bash\npkill -f "next" 2>/dev/null || true\nsleep 2\nlsof -ti:3000,3001  < /dev/null |  xargs kill -9 2>/dev/null || true\nsleep 1\necho "Starting development server..."\nnpm run dev
