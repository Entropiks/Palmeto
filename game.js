// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const TILE_SIZE = 32;
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MOVEMENT_SPEED = 5;
const backgroundImage = new Image();
backgroundImage.src = './assets/gamebg.png'; // Replace with your image path

// Game map (0 = empty, 1 = solid block)
// Now with borders around the entire map (top, bottom, left, right)
let gameMap = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// Local player data
const player = {
    id: null,
    x: 100,
    y: 400, // Starting position adjusted
    width: TILE_SIZE,
    height: TILE_SIZE,
    velX: 0,
    velY: 0,
    jumping: false,
    color: 'red'
};

// Camera system
const camera = {
    x: 0,
    y: 0,
    width: 1280,
    height: 720,
    
    // Update camera position to follow player
    update: function() {
        // Center the camera on the player
        this.x = Math.floor(player.x + (player.width / 2) - (this.width / 2));
        this.y = Math.floor(player.y + (player.height / 2) - (this.height / 2));
        
        // Make sure the camera doesn't go outside the map boundaries
        this.x = Math.max(0, Math.min(this.x, gameMap[0].length * TILE_SIZE - this.width));
        this.y = Math.max(0, Math.min(this.y, gameMap.length * TILE_SIZE - this.height));
    }
};

// Add these constants at the top
const GAME_WIDTH = 1280;  // Base game width
const GAME_HEIGHT = 720;  // Base game height (16:9 ratio)
let scale = 1;           // Current scale factor
let offsetX = 0;         // Horizontal offset to center the game
let offsetY = 0;         // Vertical offset to center the game

// Update the canvas setup and resize function
function resizeCanvas() {
    // Get the window dimensions
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate the scaling factor to fit the game in the window
    const scaleX = windowWidth / GAME_WIDTH;
    const scaleY = windowHeight / GAME_HEIGHT;
    scale = Math.min(scaleX, scaleY);

    // Set canvas size to maintain aspect ratio
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    // Calculate offsets to center the game
    offsetX = (windowWidth - (GAME_WIDTH * scale)) / 2;
    offsetY = (windowHeight - (GAME_HEIGHT * scale)) / 2;

    // Apply scaling and centering using CSS
    canvas.style.width = `${GAME_WIDTH * scale}px`;
    canvas.style.height = `${GAME_HEIGHT * scale}px`;
    canvas.style.position = 'absolute';
    canvas.style.left = `${offsetX}px`;
    canvas.style.top = `${offsetY}px`;

    // Update camera dimensions
    camera.width = GAME_WIDTH;
    camera.height = GAME_HEIGHT;
}

// Add resize event listener and initial resize
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Other players in the game
let players = {};

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Socket.io connection
const socket = io();

// When connected to the server
socket.on('connect', () => {
    player.id = socket.id;
    console.log('Connected to server with ID:', player.id);
});

// When receiving updated player list from server
socket.on('players', (serverPlayers) => {
    players = serverPlayers;
});

// When receiving the map from the server
socket.on('map', (map) => {
    gameMap = map;
});

// Function to check collision with tiles
function checkTileCollision(x, y, width, height) {
    // Convert player position to grid coordinates
    const left = Math.floor(x / TILE_SIZE);
    const right = Math.floor((x + width - 1) / TILE_SIZE);
    const top = Math.floor(y / TILE_SIZE);
    const bottom = Math.floor((y + height - 1) / TILE_SIZE);
    
    // Check if any of these tiles are solid (1)
    for (let row = top; row <= bottom; row++) {
        for (let col = left; col <= right; col++) {
            if (row >= 0 && row < gameMap.length && col >= 0 && col < gameMap[0].length) {
                if (gameMap[row][col] === 1) {
                    return {
                        collision: true,
                        tileX: col * TILE_SIZE,
                        tileY: row * TILE_SIZE
                    };
                }
            }
        }
    }
    return { collision: false };
}

// Update player position
function updatePlayer() {
    // Horizontal movement
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.velX = -MOVEMENT_SPEED;
    } else if (keys['ArrowRight'] || keys['KeyD']) {
        player.velX = MOVEMENT_SPEED;
    } else {
        player.velX = 0;
    }
    
    // Apply gravity
    player.velY += GRAVITY;
    
    // Jump if on ground and space key is pressed
    if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && !player.jumping) {
        player.velY = JUMP_FORCE;
        player.jumping = true;
    }
    
    // Update horizontal position
    let newX = player.x + player.velX;
    const horizontalCollision = checkTileCollision(newX, player.y, player.width, player.height);
    
    if (!horizontalCollision.collision) {
        player.x = newX;
    } else {
        // Snap to the edge of the tile to eliminate the gap
        if (player.velX > 0) {
            // Moving right, snap to left edge of tile
            player.x = horizontalCollision.tileX - player.width;
        } else if (player.velX < 0) {
            // Moving left, snap to right edge of tile
            player.x = horizontalCollision.tileX + TILE_SIZE;
        }
        player.velX = 0;
    }
    
    // Update vertical position
    let newY = player.y + player.velY;
    const verticalCollision = checkTileCollision(player.x, newY, player.width, player.height);
    
    if (!verticalCollision.collision) {
        player.y = newY;
        player.jumping = true;
    } else {
        // Snap to the edge of the tile to eliminate the gap
        if (player.velY > 0) {
            // Moving down, snap to top edge of tile
            player.y = verticalCollision.tileY - player.height;
            player.jumping = false;
        } else if (player.velY < 0) {
            // Moving up, snap to bottom edge of tile
            player.y = verticalCollision.tileY + TILE_SIZE;
        }
        player.velY = 0;
    }
    
    // Send updated position to server
    socket.emit('updatePlayer', {
        x: player.x,
        y: player.y,
        velX: player.velX,
        velY: player.velY,
        jumping: player.jumping
    });
}

// Render game elements
function render() {
    // Clear the canvas with black bars
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw the background image
    if (backgroundImage.complete) {
        const dimensions = calculateBackgroundCover(backgroundImage, GAME_WIDTH, GAME_HEIGHT);
        ctx.drawImage(
            backgroundImage,
            dimensions.x,
            dimensions.y,
            dimensions.width,
            dimensions.height
        );
    }
    
    // Update camera position to follow player
    camera.update();
    
    // Calculate which tiles are visible on screen
    const startCol = Math.floor(camera.x / TILE_SIZE);
    const endCol = Math.min(gameMap[0].length - 1, Math.ceil((camera.x + camera.width) / TILE_SIZE));
    
    const startRow = Math.floor(camera.y / TILE_SIZE);
    const endRow = Math.min(gameMap.length - 1, Math.ceil((camera.y + camera.height) / TILE_SIZE));
    
    // Draw only the visible portion of the map
    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            if (gameMap[row][col] === 1) {
                ctx.fillStyle = 'black';
                ctx.fillRect(
                    col * TILE_SIZE - camera.x,
                    row * TILE_SIZE - camera.y,
                    TILE_SIZE,
                    TILE_SIZE
                );
            }
        }
    }
    
    // Draw other players
    for (const id in players) {
        if (id !== player.id) {
            const otherPlayer = players[id];
            ctx.fillStyle = 'blue';
            ctx.fillRect(
                otherPlayer.x - camera.x,
                otherPlayer.y - camera.y,
                TILE_SIZE,
                TILE_SIZE
            );
        }
    }
    
    // Draw local player
    ctx.fillStyle = player.color;
    ctx.fillRect(
        player.x - camera.x,
        player.y - camera.y,
        player.width,
        player.height
    );
}

// Game loop
function gameLoop() {
    updatePlayer();
    render();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();

// Add error handling for the image loading
backgroundImage.onerror = function() {
    console.error('Error loading background image');
};

backgroundImage.onload = function() {
    console.log('Background image loaded successfully');
};

// Add this function to calculate the scaled dimensions that maintain aspect ratio and cover the screen
function calculateBackgroundCover(image, targetWidth, targetHeight) {
    const imageRatio = image.width / image.height;
    const targetRatio = targetWidth / targetHeight;
    let width, height;

    if (targetRatio > imageRatio) {
        width = targetWidth;
        height = targetWidth / imageRatio;
    } else {
        height = targetHeight;
        width = targetHeight * imageRatio;
    }

    const x = (targetWidth - width) / 2;
    const y = (targetHeight - height) / 2;

    return { width, height, x, y };
}

// Add this function to convert screen coordinates to game coordinates
function screenToGameCoordinates(screenX, screenY) {
    return {
        x: (screenX - offsetX) / scale,
        y: (screenY - offsetY) / scale
    };
}

// Update mouse/touch input handling (if you have any)
canvas.addEventListener('mousedown', (e) => {
    const gameCoords = screenToGameCoordinates(e.clientX, e.clientY);
    // Use gameCoords.x and gameCoords.y for game logic
}); 