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
let SPRITESHEET_COLS = 0;
let SPRITESHEET_ROWS = 0;
let MAP_WIDTH = 0;
let MAP_HEIGHT = 0;

// Load tilemap assets
const tileAtlas = new Image();
tileAtlas.src = './assets/maps/level1/spritesheet.png'; // Update with your spritesheet path

// Load and parse map data
let mapData = null;
fetch('./assets/maps/level1/map.json')
    .then(response => response.json())
    .then(data => {
        mapData = data;
        MAP_WIDTH = data.mapWidth;
        MAP_HEIGHT = data.mapHeight;
        
        // Validate required layers exist
        const decorationLayer = data.layers.find(l => l.name === "decoration");
        const collisionLayer = data.layers.find(l => l.name === "collision");
        
        if (!decorationLayer || !collisionLayer) {
            console.error('Missing required layers. Map must have "decoration" and "collision" layers.');
            return;
        }

        // Convert all tile IDs to numbers
        data.layers.forEach(layer => {
            layer.tiles = layer.tiles.map(tile => ({
                ...tile,
                id: Number(tile.id),
                x: Number(tile.x),
                y: Number(tile.y)
            }));
        });

        console.log('Map loaded successfully:', {
            width: MAP_WIDTH,
            height: MAP_HEIGHT,
            decorationTiles: decorationLayer.tiles.length,
            collisionTiles: collisionLayer.tiles.length
        });
        
        // Position player at a good starting point
        player.x = 100;
        player.y = 100;
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
    frameDuration: 15, // Increased from 8 to 15 to slow down the animation
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
        
        // Make sure the camera doesn't go outside the map boundaries
        if (mapData) {
            const maxX = (MAP_WIDTH * TILE_SIZE) - this.width;
            const maxY = (MAP_HEIGHT * TILE_SIZE) - this.height;
            this.x = Math.max(0, Math.min(this.x, maxX));
            this.y = Math.max(0, Math.min(this.y, maxY));
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

// Update the tileAtlas loading to properly handle any size spritesheet
tileAtlas.onload = function() {
    SPRITESHEET_COLS = Math.floor(tileAtlas.width / TILE_SIZE);
    SPRITESHEET_ROWS = Math.floor(tileAtlas.height / TILE_SIZE);
    
    console.log('Spritesheet loaded:', {
        path: tileAtlas.src,
        width: tileAtlas.width,
        height: tileAtlas.height,
        tileSize: TILE_SIZE,
        cols: SPRITESHEET_COLS,
        rows: SPRITESHEET_ROWS,
        totalTiles: SPRITESHEET_COLS * SPRITESHEET_ROWS
    });
    
    // Test a few tile IDs to verify mapping
    console.log('Sample tile positions:');
    for (let i = 0; i < 10; i++) {
        const pos = getTileSourcePosition(i);
        console.log(`Tile ID ${i} -> Position:`, pos);
    }
};

// Add error handling for the spritesheet
tileAtlas.onerror = function() {
    console.error('Failed to load spritesheet:', tileAtlas.src);
};

// Update getTileSourcePosition function to correctly map tile IDs to spritesheet positions
function getTileSourcePosition(tileId) {
    // Ensure tileId is a number and valid
    tileId = Number(tileId);
    
    // Check for invalid tile IDs
    if (isNaN(tileId) || tileId < 0) {
        console.warn('Invalid tile ID:', tileId);
        return null;
    }
    
    // Calculate position in spritesheet
    // Note: We're not subtracting 1 from tileId anymore
    const sourceX = (tileId % SPRITESHEET_COLS) * TILE_SIZE;
    const sourceY = Math.floor(tileId / SPRITESHEET_COLS) * TILE_SIZE;
    
    // Debug log for troubleshooting
    if (tileId < 5) { // Only log a few IDs to avoid console spam
        console.log(`Tile ID ${tileId} maps to position:`, { sourceX, sourceY });
    }
    
    return { x: sourceX, y: sourceY };
}

// Update collision detection to be more efficient
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

    // Check map boundaries
    if (left < 0 || right >= MAP_WIDTH || top < 0 || bottom >= MAP_HEIGHT) {
        return { collision: true };
    }

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
    
    // Add this at the end
    updatePlayerAnimation();
}

// Updated render function to use tilemap
function render() {
    // Clear the canvas with sky color
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Disable image smoothing for the entire canvas
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    
    // Draw background if loaded
    if (backgroundImage.complete) {
        const dimensions = calculateBackgroundCover(backgroundImage, GAME_WIDTH, GAME_HEIGHT);
        ctx.drawImage(
            backgroundImage,
            Math.round(dimensions.x),
            Math.round(dimensions.y),
            Math.round(dimensions.width),
            Math.round(dimensions.height)
        );
    }
    
    // Update camera position
    camera.update();
    
    // Only render if all assets are loaded
    if (mapData && tileAtlas.complete && SPRITESHEET_COLS > 0) {
        const cameraX = Math.round(camera.x);
        const cameraY = Math.round(camera.y);

        // Render each layer in order (decoration first, then collision)
        mapData.layers.forEach(layer => {
            // Skip rendering if layer has no tiles
            if (!Array.isArray(layer.tiles) || layer.tiles.length === 0) return;

            // Process each tile in the layer
            layer.tiles.forEach(tile => {
                // Convert to numbers if they're strings
                const tileId = Number(tile.id);
                const tileX = Number(tile.x);
                const tileY = Number(tile.y);
                
                // Calculate screen position
                const screenX = Math.round(tileX * TILE_SIZE - cameraX);
                const screenY = Math.round(tileY * TILE_SIZE - cameraY);
                
                // Skip if off screen
                if (screenX < -TILE_SIZE || screenX > canvas.width ||
                    screenY < -TILE_SIZE || screenY > canvas.height) {
                    return;
                }
                
                // Get source coordinates from tile ID
                const sourcePos = getTileSourcePosition(tileId);
                if (!sourcePos) return; // Skip if no valid source position
                
                try {
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
                } catch (error) {
                    console.error('Error drawing tile:', {
                        id: tileId,
                        position: { x: tileX, y: tileY },
                        sourcePos,
                        error: error.message
                    });
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
        const frame = playerIdleData.layers[0].tiles[player.animationFrame];
        const sourceX = parseInt(frame.id) * TILE_SIZE;
        const sourceY = 0;
        
        // Save the current context state
        ctx.save();
        
        // Position for the player sprite - ensure whole numbers
        const playerScreenX = Math.floor(player.x - camera.x);
        const playerScreenY = Math.floor(player.y - camera.y);
        
        // If facing left, flip the sprite
        if (player.facingLeft) {
            ctx.scale(-1, 1);
            ctx.drawImage(
                playerIdleAtlas,
                Math.floor(sourceX), Math.floor(sourceY),
                TILE_SIZE, TILE_SIZE,
                -playerScreenX - TILE_SIZE, playerScreenY,
                TILE_SIZE, TILE_SIZE
            );
        } else {
            ctx.drawImage(
                playerIdleAtlas,
                Math.floor(sourceX), Math.floor(sourceY),
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