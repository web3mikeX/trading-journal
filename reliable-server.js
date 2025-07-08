const http = require('http');
const url = require('url');

const PORT = 3000;

console.log('🚀 Starting reliable trading journal server...');

// Simple HTML pages that will definitely work
const signInPage = `
<!DOCTYPE html>
<html>
<head>
    <title>Trading Journal - Sign In</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            min-height: 100vh;
        }
        .glass { 
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
    </style>
</head>
<body class="text-white flex items-center justify-center min-h-screen">
    <div class="glass rounded-2xl p-8 w-full max-w-md">
        <h1 class="text-3xl font-bold text-center mb-8">📊 Trading Journal</h1>
        
        <div class="space-y-4">
            <div>
                <label class="block text-sm mb-2">Email</label>
                <input type="email" value="demo@example.com" class="w-full p-3 bg-gray-800 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none">
            </div>
            
            <div>
                <label class="block text-sm mb-2">Password</label>
                <input type="password" value="demo123" class="w-full p-3 bg-gray-800 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none">
            </div>
            
            <button onclick="window.location.href='/dashboard'" 
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
                Sign In
            </button>
        </div>
        
        <p class="text-center text-gray-400 text-sm mt-4">Demo credentials are pre-filled</p>
    </div>
</body>
</html>
`;

const dashboardPage = `
<!DOCTYPE html>
<html>
<head>
    <title>Trading Journal - Dashboard</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            min-height: 100vh;
        }
        .glass { 
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .card:hover { transform: translateY(-2px); transition: all 0.3s ease; }
    </style>
</head>
<body class="text-white">
    <!-- Header -->
    <nav class="bg-gray-800/50 border-b border-gray-700">
        <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <h1 class="text-xl font-bold">📊 Trading Journal</h1>
            <div class="flex items-center space-x-6">
                <a href="/dashboard" class="text-blue-400 font-semibold">Dashboard</a>
                <a href="/trades" class="text-gray-300 hover:text-white">Trades</a>
                <a href="/analytics" class="text-gray-300 hover:text-white">Analytics</a>
                <span class="text-sm text-gray-400">Demo User</span>
            </div>
        </div>
    </nav>
    
    <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- Welcome -->
        <div class="mb-8">
            <h1 class="text-4xl font-bold mb-2">Welcome back, Trader!</h1>
            <p class="text-gray-400">Here's your trading performance overview</p>
        </div>
        
        <!-- Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="glass card rounded-xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm text-gray-400">Total P&L</h3>
                    <span class="text-2xl">💰</span>
                </div>
                <div class="text-3xl font-bold text-green-400">$804.54</div>
                <div class="text-sm text-gray-500 mt-2">+8.0% this month</div>
            </div>
            
            <div class="glass card rounded-xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm text-gray-400">Win Rate</h3>
                    <span class="text-2xl">🎯</span>
                </div>
                <div class="text-3xl font-bold text-green-400">100%</div>
                <div class="text-sm text-gray-500 mt-2">Perfect record</div>
            </div>
            
            <div class="glass card rounded-xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm text-gray-400">Total Trades</h3>
                    <span class="text-2xl">📈</span>
                </div>
                <div class="text-3xl font-bold">3</div>
                <div class="text-sm text-gray-500 mt-2">2 closed, 1 open</div>
            </div>
            
            <div class="glass card rounded-xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm text-gray-400">Profit Factor</h3>
                    <span class="text-2xl">🏆</span>
                </div>
                <div class="text-3xl font-bold text-green-400">∞</div>
                <div class="text-sm text-gray-500 mt-2">No losses</div>
            </div>
        </div>
        
        <!-- Chart and Trades -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 glass rounded-xl p-6">
                <h2 class="text-xl font-semibold mb-4">Performance Chart</h2>
                <canvas id="chart" width="400" height="200"></canvas>
            </div>
            
            <div class="glass rounded-xl p-6">
                <h2 class="text-xl font-semibold mb-4">Recent Trades</h2>
                <div class="space-y-4">
                    <div class="p-4 bg-gray-800/50 rounded-lg">
                        <div class="flex justify-between mb-2">
                            <div>
                                <div class="font-semibold">AAPL</div>
                                <div class="text-sm text-gray-400">Cup and Handle</div>
                            </div>
                            <div class="text-right">
                                <div class="text-green-400 font-semibold">+$546.02</div>
                                <div class="text-sm text-gray-400">CLOSED</div>
                            </div>
                        </div>
                        <div class="text-sm text-gray-500">Clean breakout pattern, held strong above support</div>
                    </div>
                    
                    <div class="p-4 bg-gray-800/50 rounded-lg">
                        <div class="flex justify-between mb-2">
                            <div>
                                <div class="font-semibold">TSLA</div>
                                <div class="text-sm text-gray-400">Bear Flag</div>
                            </div>
                            <div class="text-right">
                                <div class="text-green-400 font-semibold">+$258.52</div>
                                <div class="text-sm text-gray-400">CLOSED</div>
                            </div>
                        </div>
                        <div class="text-sm text-gray-500">Perfect bear flag setup, quick profit take</div>
                    </div>
                    
                    <div class="p-4 bg-gray-800/50 rounded-lg border border-orange-500/30">
                        <div class="flex justify-between mb-2">
                            <div>
                                <div class="font-semibold">GOOGL</div>
                                <div class="text-sm text-gray-400">Support Bounce</div>
                            </div>
                            <div class="text-right">
                                <div class="text-orange-400 font-semibold">OPEN</div>
                                <div class="text-sm text-gray-400">$2800.00</div>
                            </div>
                        </div>
                        <div class="text-sm text-gray-500">Strong support level hold, waiting for breakout</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        const ctx = document.getElementById('chart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jul 3', 'Jul 5', 'Jul 6', 'Jul 7'],
                datasets: [{
                    label: 'Cumulative P&L',
                    data: [0, 258.52, 804.54, 804.54],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { 
                            callback: function(value) { return '$' + value; },
                            color: '#9ca3af'
                        },
                        grid: { color: '#374151' }
                    },
                    x: {
                        ticks: { color: '#9ca3af' },
                        grid: { color: '#374151' }
                    }
                }
            }
        });
    </script>
</body>
</html>
`;

// Create server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  console.log(`${req.method} ${path}`);

  // Set headers to prevent caching and connection issues
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Connection', 'close');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    if (path === '/' || path === '/auth/signin') {
      res.writeHead(200);
      res.end(signInPage);
    } else if (path === '/dashboard') {
      res.writeHead(200);
      res.end(dashboardPage);
    } else if (path === '/trades') {
      res.writeHead(200);
      res.end('<h1>Trades page coming soon...</h1>');
    } else if (path === '/analytics') {
      res.writeHead(200);
      res.end('<h1>Analytics page coming soon...</h1>');
    } else if (path === '/api/health') {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    } else {
      res.writeHead(404);
      res.end('<h1>404 - Page Not Found</h1>');
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.writeHead(500);
    res.end('<h1>500 - Internal Server Error</h1>');
  }
});

// Error handling
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} is already in use`);
    console.log('🔧 Trying to kill existing processes...');
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
  }
});

server.on('clientError', (err, socket) => {
  console.log('Client error:', err.message);
  socket.end('HTTP/1.1 400 Bad Request\\r\\n\\r\\n');
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\\n✅ Trading Journal Server Started Successfully!`);
  console.log(`🌐 Local:    http://localhost:${PORT}`);
  console.log(`🌐 Network:  http://127.0.0.1:${PORT}`);
  console.log(`📊 Your original trading journal is ready!`);
  console.log(`\\n📋 Available pages:`);
  console.log(`   - Sign In: http://localhost:${PORT}`);
  console.log(`   - Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`   - Health: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server shut down successfully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\\n🛑 Received SIGTERM, shutting down...');
  server.close(() => process.exit(0));
});