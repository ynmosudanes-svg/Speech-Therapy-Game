const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    message: 'Hostinger is successfully running Node.js!'
  }));
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Minimal server listening on ${port}`);
});
