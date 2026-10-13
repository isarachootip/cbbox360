const http = require('http');
const fs = require('fs');
const path = require('path');
const dir = __dirname;
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') { res.end(); return; }
  const name = (new URL(req.url, 'http://x').searchParams.get('name') || 'shot').replace(/[^a-z0-9_-]/gi, '');
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString();
    const b64 = body.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(path.join(dir, name + '.png'), Buffer.from(b64, 'base64'));
    console.log('saved', name);
    res.end('ok');
  });
}).listen(5999, '127.0.0.1', () => console.log('listening 5999'));
