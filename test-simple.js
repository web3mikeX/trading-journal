const http = require('http');

const server = http.createServer((req, res) => {
  console.log('Request received:', req.url);
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head><title>Trading Journal Test</title></head>
      <body>
        <h1>🎉 Trading Journal is Working!</h1>
        <p>Connection successful on localhost:3000</p>
        <p>URL: ${req.url}</p>
        <p>Time: ${new Date().toISOString()}</p>
      </body>
    </html>
  `);
});

server.listen(3000, '127.0.0.1', () => {
  console.log('✅ Server is running on http://127.0.0.1:3000');
  console.log('✅ Server is running on http://localhost:3000');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  server.close(() => process.exit(0));
});