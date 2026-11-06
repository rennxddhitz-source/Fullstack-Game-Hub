const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

let PLAYERS = {};
let FOOD = [];
const MAP_WIDTH = 2000;
const MAP_HEIGHT = 2000;

for (let i = 0; i < 100; i++) {
  FOOD.push({
    id: Math.random().toString(36).substr(2, 9),
    x: Math.random() * MAP_WIDTH,
    y: Math.random() * MAP_HEIGHT,
    color: `hsl(${Math.random() * 360}, 80%, 60%)`
  });
}

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
  
  if (req.url === '/api/state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ players: PLAYERS, food: FOOD }));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/move') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        let data = JSON.parse(body);
        if (PLAYERS[data.id]) {
          let p = PLAYERS[data.id];
          p.x = data.x;
          p.y = data.y;
          p.radius = data.radius;
          p.score = data.score;

          FOOD.forEach((f, idx) => {
            let dist = Math.hypot(p.x - f.x, p.y - f.y);
            if (dist < p.radius) {
              p.score += 1;
              p.radius = 15 + Math.floor(p.score / 5);
              FOOD.splice(idx, 1);
              FOOD.push({
                id: Math.random().toString(36).substr(2, 9),
                x: Math.random() * MAP_WIDTH,
                y: Math.random() * MAP_HEIGHT,
                color: `hsl(${Math.random() * 360}, 80%, 60%)`
              });
            }
          });
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, food: FOOD }));
      } catch(e) {
        res.writeHead(400);
        res.end();
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/join') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let id = 'p_' + Math.random().toString(36).substr(2, 6);
      PLAYERS[id] = {
        id: id,
        x: Math.random() * MAP_WIDTH,
        y: Math.random() * MAP_HEIGHT,
        radius: 15,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        score: 0,
        name: 'Player ' + id.substr(2, 4)
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: id, player: PLAYERS[id] }));
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/leave') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        let data = JSON.parse(body);
        delete PLAYERS[data.id];
      } catch(e) {}
      res.writeHead(200);
      res.end();
    });
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('404 Not Found');
    } else {
      let ext = path.extname(filePath);
      let contentType = 'text/html';
      if (ext === '.js') contentType = 'text/javascript';
      if (ext === '.css') contentType = 'text/css';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
