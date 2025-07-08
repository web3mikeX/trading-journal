const http = require('http');

console.log('Starting simple test server...');

const server = http.createServer((req, res) => {
  console.log('Request received:', req.url);
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head><title>Trading Journal Test</title></head>
      <body>
        <h1>🎉 Trading Journal is Working!</h1>
        <p><strong>Connection successful!</strong></p>
        <p>URL: ${req.url}</p>
        <p>Time: ${new Date().toISOString()}</p>
        <p><a href="/dashboard">Go to Dashboard</a></p>
      </body>
    </html>
  `);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

server.listen(3000, '127.0.0.1', () => {
  console.log('✅ Server listening on http://127.0.0.1:3000');
  console.log('✅ Server listening on http://localhost:3000');
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.close(() => process.exit(0));
});