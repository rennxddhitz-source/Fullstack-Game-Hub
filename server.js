const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const PLAYERS = {};
const FOOD = [];
const MAP_WIDTH = 2000;
const MAP_HEIGHT = 2000;

for (let i = 0; i < 150; i++) {
  FOOD.push({
    id: Math.random().toString(36).substr(2, 9),
    x: Math.random() * MAP_WIDTH,
    y: Math.random() * MAP_HEIGHT,
    color: `hsl(${Math.random() * 360}, 80%, 60%)`
  });
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  PLAYERS[socket.id] = {
    id: socket.id,
    x: Math.random() * MAP_WIDTH,
    y: Math.random() * MAP_HEIGHT,
    radius: 15,
    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
    score: 0,
    name: 'Player ' + socket.id.substr(0, 4)
  };

  socket.emit('currentPlayers', PLAYERS);
  socket.emit('foodList', FOOD);
  socket.broadcast.emit('newPlayer', PLAYERS[socket.id]);

  socket.on('playerMovement', (movementData) => {
    let player = PLAYERS[socket.id];
    if (player) {
      player.x = movementData.x;
      player.y = movementData.y;

      FOOD.forEach((food, index) => {
        let dist = Math.hypot(player.x - food.x, player.y - food.y);
        if (dist < player.radius) {
          player.score += 1;
          player.radius = 15 + Math.floor(player.score / 5);
          FOOD.splice(index, 1);
          
          FOOD.push({
            id: Math.random().toString(36).substr(2, 9),
            x: Math.random() * MAP_WIDTH,
            y: Math.random() * MAP_HEIGHT,
            color: `hsl(${Math.random() * 360}, 80%, 60%)`
          });

          io.emit('foodUpdate', FOOD);
        }
      });

      socket.broadcast.emit('playerMoved', player);
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    delete PLAYERS[socket.id];
    io.emit('disconnectPlayer', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
