import http from 'http';
import fs from 'fs';
import path from 'path';

const root = path.resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || 5173);
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.wav':'audio/wav', '.mp3':'audio/mpeg', '.aiff':'audio/aiff', '.aif':'audio/aiff' };

http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';
  let file = path.join(root, url);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, () => console.log(`Pangea running at http://localhost:${port}`));
