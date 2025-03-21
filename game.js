// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const TILE_SIZE = 16;
const GRAVITY = 0.125;
const JUMP_FORCE = -4;
const MOVEMENT_SPEED = 1.25;
const backgroundImage = new Image();
backgroundImage.src = './assets/gamebg.png'; // Replace with your image path

// New tilemap constants
const SPRITESHEET_COLS = 8;
const SPRITESHEET_ROWS = 6;

// Load tilemap assets
const tileAtlas = new Image();
tileAtlas.src = './assets/spritesheet.png'; // Update with your spritesheet path

// Load and parse map data
let mapData = null;
fetch('./maps/map.json')
    .then(response => response.json())
    .then(data => {
        mapData = data;
        console.log('Map data loaded successfully');
    })
    .catch(error => console.error('Error loading map:', error));

// Add these near the top with other asset loading
const playerIdleAtlas = new Image();
playerIdleAtlas.src = './assets/characters/knight/idle_spritesheet.png';

// Load and parse idle animation data
let playerIdleData = null;
fetch('./assets/characters/knight/idle_map.json')
    .then(response => response.json())
    .then(data => {
        playerIdleData = data;
        console.log('Player idle animation data loaded successfully');
    })
    .catch(error => console.error('Error loading player idle animation:', error));

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
    color: 'red',
    // Update animation properties
    animationFrame: 0,
    frameCounter: 0,
    frameDuration: 11, // Increased from 8 to 15 to slow down the animation
    facingLeft: false
};

// I'll edit the game dimensions and camera setup
const GAME_WIDTH = 640;  // Reduced from 1280 to be 40 tiles wide (640/16)
const GAME_HEIGHT = 360; // Reduced from 720 to maintain 16:9 ratio (about 22 tiles high)
let scale = 1;           // Current scale factor
let offsetX = 0;         // Horizontal offset to center the game
let offsetY = 0;         // Vertical offset to center the game

// Camera system
const camera = {
    x: 0,
    y: 0,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    targetX: 0,
    targetY: 0,
    smoothness: 0.1,
    
    update: function() {
        // Center camera more tightly on player
        this.targetX = Math.floor(player.x - (this.width / 2) + (player.width / 2));
        this.targetY = Math.floor(player.y - (this.height / 2) + (player.height / 2));
        
        // Round the target positions to prevent sub-pixel movement
        this.targetX = Math.round(this.targetX);
        this.targetY = Math.round(this.targetY);
        
        // Smoothly move camera towards target with rounded result
        this.x = Math.round(this.x + (this.targetX - this.x) * this.smoothness);
        this.y = Math.round(this.y + (this.targetY - this.y) * this.smoothness);
        
        // Make sure the camera doesn't go outside the map boundaries using mapData
        if (mapData) {
            const mapWidth = mapData.mapWidth * TILE_SIZE;
            const mapHeight = mapData.mapHeight * TILE_SIZE;
            this.x = Math.max(0, Math.min(this.x, mapWidth - this.width));
            this.y = Math.max(0, Math.min(this.y, mapHeight - this.height));
        }
    }
};

// Update the canvas resize function
function resizeCanvas() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate the maximum scaling factor to fill the window while maintaining aspect ratio
    const scaleX = windowWidth / GAME_WIDTH;
    const scaleY = windowHeight / GAME_HEIGHT;
    scale = Math.max(scaleX, scaleY); // Changed to Math.max to fill the screen more

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

    canvas.style.imageRendering = 'pixelated';  // For Chrome
    canvas.style.imageRendering = '-moz-crisp-edges';  // For Firefox
    canvas.style.imageRendering = 'crisp-edges';  // For Safari
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

// Function to get tile source coordinates from tile ID
function getTileSourcePosition(tileId) {
    const id = parseInt(tileId);
    return {
        x: (id % SPRITESHEET_COLS) * TILE_SIZE,
        y: Math.floor(id / SPRITESHEET_COLS) * TILE_SIZE
    };
}

// Update collision detection to use the new map data
function checkTileCollision(x, y, width, height) {
    if (!mapData) return { collision: false };
    
    // Find collision layer
    const collisionLayer = mapData.layers.find(layer => layer.name === "collision");
    if (!collisionLayer) return { collision: false };
    
    // Convert position to tile coordinates
    const left = Math.floor(x / TILE_SIZE);
    const right = Math.floor((x + width - 1) / TILE_SIZE);
    const top = Math.floor(y / TILE_SIZE);
    const bottom = Math.floor((y + height - 1) / TILE_SIZE);
    
    // Check collision tiles in the area
    for (const tile of collisionLayer.tiles) {
        if (tile.x >= left && tile.x <= right && tile.y >= top && tile.y <= bottom) {
            return {
                collision: true,
                tileX: tile.x * TILE_SIZE,
                tileY: tile.y * TILE_SIZE
            };
        }
    }
    
    return { collision: false };
}

// Add function to update player animation
function updatePlayerAnimation() {
    if (!playerIdleData) return;
    
    // Update frame counter
    player.frameCounter++;
    
    // Change frame when counter reaches frameDuration
    if (player.frameCounter >= player.frameDuration) {
        player.frameCounter = 0;
        player.animationFrame = (player.animationFrame + 1) % playerIdleData.layers[0].tiles.length;
    }
    
    // Update player direction based on movement
    if (player.velX < 0) {
        player.facingLeft = true;
    } else if (player.velX > 0) {
        player.facingLeft = false;
    }
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
    
    // Update horizontal position with rounding
    let newX = Math.round(player.x + player.velX);
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
    
    // Update vertical position with rounding
    let newY = Math.round(player.y + player.velY);
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
    
    // Ensure final positions are integers
    player.x = Math.round(player.x);
    player.y = Math.round(player.y);
    
    // Send updated position to server
    socket.emit('updatePlayer', {
        x: player.x,
        y: player.y,
        velX: player.velX,
        velY: player.velY,
        jumping: player.jumping
    });
    
    updatePlayerAnimation();
}

// Updated render function to use tilemap
function render() {
    // Clear the canvas with sky color
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw background if loaded
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
    
    // Update camera position
    camera.update();
    
    // Only render if map data and tile atlas are loaded
    if (mapData && tileAtlas.complete) {
        // Disable image smoothing to prevent blurry tiles
        ctx.imageSmoothingEnabled = false;
        
        // Round camera position to prevent sub-pixel rendering
        const cameraX = Math.round(camera.x);
        const cameraY = Math.round(camera.y);
        
        // Render each layer
        mapData.layers.forEach(layer => {
            layer.tiles.forEach(tile => {
                // Calculate screen position and round to prevent sub-pixel rendering
                const screenX = Math.round(tile.x * TILE_SIZE - cameraX);
                const screenY = Math.round(tile.y * TILE_SIZE - cameraY);
                
                // Only render if tile is visible on screen
                if (screenX > -TILE_SIZE && screenX < canvas.width &&
                    screenY > -TILE_SIZE && screenY < canvas.height) {
                    
                    // Get source coordinates from tile ID
                    const sourcePos = getTileSourcePosition(tile.id);
                    
                    // Draw the tile with integer coordinates
                    ctx.drawImage(
                        tileAtlas,
                        sourcePos.x,
                        sourcePos.y,
                        TILE_SIZE,
                        TILE_SIZE,
                        screenX,
                        screenY,
                        TILE_SIZE,
                        TILE_SIZE
                    );
                }
            });
        });
    }
    
    // Draw players with rounded coordinates
    for (const id in players) {
        if (id !== player.id) {
            const otherPlayer = players[id];
            ctx.fillStyle = 'blue';
            ctx.fillRect(
                Math.round(otherPlayer.x - camera.x),
                Math.round(otherPlayer.y - camera.y),
                TILE_SIZE,
                TILE_SIZE
            );
        }
    }
    
    // Draw local player with animation
    if (playerIdleData && playerIdleAtlas.complete) {
        // Set crisp pixel art rendering
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        
        const frame = playerIdleData.layers[0].tiles[player.animationFrame];
        const sourceX = parseInt(frame.id) * TILE_SIZE;
        const sourceY = 0;
        
        // Save the current context state
        ctx.save();
        
        // Position for the player sprite - ensure integer positions
        const playerScreenX = Math.floor(player.x - camera.x);
        const playerScreenY = Math.floor(player.y - camera.y);
        
        // If facing left, flip the sprite
        if (player.facingLeft) {
            ctx.scale(-1, 1);
            ctx.drawImage(
                playerIdleAtlas,
                sourceX, sourceY,
                TILE_SIZE, TILE_SIZE,
                -playerScreenX - TILE_SIZE, playerScreenY,
                TILE_SIZE, TILE_SIZE
            );
        } else {
            ctx.drawImage(
                playerIdleAtlas,
                sourceX, sourceY,
                TILE_SIZE, TILE_SIZE,
                playerScreenX, playerScreenY,
                TILE_SIZE, TILE_SIZE
            );
        }
        
        // Restore the context state
        ctx.restore();
    } else {
        // Fallback to rectangle if images aren't loaded
        ctx.fillStyle = player.color;
        ctx.fillRect(
            Math.round(player.x - camera.x),
            Math.round(player.y - camera.y),
            player.width,
            player.height
        );
    }
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