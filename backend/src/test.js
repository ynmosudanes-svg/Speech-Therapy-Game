const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Test server is working!\n');
});
const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Test server running on port/pipe ${port}`);
});
