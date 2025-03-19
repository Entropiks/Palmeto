const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const level1 = require('./maps/map1.js');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files
app.use(express.static(path.join(__dirname, '.')));
app.use('/maps', express.static(path.join(__dirname, 'maps')));

// Use the map from level1.js
const gameMap = level1.map;

// Store connected players
const players = {};

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    
    // Initialize a new player
    players[socket.id] = {
        id: socket.id,
        x: 100,
        y: 100, // Starting position adjusted
        velX: 0,
        velY: 0
    };
    
    // Send the current map to the new player
    socket.emit('map', gameMap);
    
    // Send the current players to the new player
    io.emit('players', players);
    
    // Handle player updates
    socket.on('updatePlayer', (data) => {
        // Update the player's data
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].velX = data.velX;
            players[socket.id].velY = data.velY;
            
            // Broadcast updated players to all clients
            io.emit('players', players);
        }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        delete players[socket.id];
        io.emit('players', players);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 