const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let players = [];
let currentTurnIndex = 0;

io.on("connection", (socket) => {
  console.log(`New player connected: ${socket.id}`);
  socket.emit("yourId", socket.id);

  players.push(socket);
  io.emit("players", players.map(p => p.id));

  if (players.length >= 2) startGame();

  socket.on("play", (data) => {
    if (players[currentTurnIndex].id === socket.id) {
      console.log(`Player ${socket.id} played: ${data.number}`);
      io.emit("played", { playerId: socket.id, number: data.number });
      currentTurnIndex = (currentTurnIndex + 1) % players.length;
      updateTurn();
    }
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    players = players.filter(p => p.id !== socket.id);
    if (players.length < 2) io.emit("waiting", "Waiting for more players...");
    if (currentTurnIndex >= players.length) currentTurnIndex = 0;
    updateTurn();
  });

  function updateTurn() {
    if (players.length >= 2) io.emit("turn", players[currentTurnIndex].id);
  }

  function startGame() {
    io.emit("start", "Game started!");
    updateTurn();
  }
});

const PORT = parseInt(process.env.PORT) || 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
