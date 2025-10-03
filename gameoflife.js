const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playBtn = document.getElementById('playBtn');

const MARGIN = window.innerWidth < 640 ? 20 : 40;
const availableWidth = window.innerWidth - MARGIN;
const availableHeight = window.innerHeight - MARGIN;

const minCellSize = window.innerWidth < 640 ? 1 : 2;
const maxCells = window.innerWidth < 640 ? 150 : 200;
const CELL_SIZE = Math.max(minCellSize, Math.floor(Math.min(availableWidth / maxCells, availableHeight / maxCells)));
const GRID_WIDTH = Math.floor(availableWidth / CELL_SIZE);
const GRID_HEIGHT = Math.floor(availableHeight / CELL_SIZE);

canvas.width = GRID_WIDTH * CELL_SIZE;
canvas.height = GRID_HEIGHT * CELL_SIZE;

canvas.style.imageRendering = 'pixelated';
canvas.style.imageRendering = '-moz-crisp-edges';
canvas.style.imageRendering = 'crisp-edges';
ctx.imageSmoothingEnabled = false;

const initialZoom = 3;
const initialVisibleCols = Math.floor(canvas.width / (CELL_SIZE * initialZoom));
const initialVisibleRows = Math.floor(canvas.height / (CELL_SIZE * initialZoom));
const initialCameraX = Math.floor(GRID_WIDTH / 2) - Math.floor(initialVisibleCols / 2);
const initialCameraY = Math.floor(GRID_HEIGHT / 2) - Math.floor(initialVisibleRows / 2);

let grid = createEmptyGrid();
let isRunning = false;
let intervalId = null;
let hasStarted = false;
let isDrawing = false;
let cameraX = initialCameraX;
let cameraY = initialCameraY;
let targetCameraX = initialCameraX;
let targetCameraY = initialCameraY;
let zoomLevel = 3;
let targetZoom = 3;

let trackingStartTime = null;
let isTrackingStarted = false;
let backgroundColor = '#E40C10';
let cellColor = '#000000';
let colorTransitionTriggered = false;
let redirectTriggered = false;
let navigationFadeStarted = false;

// Color interpolation functions
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function interpolateColor(color1, color2, factor) {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return color1;
    
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
    
    return rgbToHex(r, g, b);
}

function createEmptyGrid() {
    return Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(0));
}

function createInitialPattern() {
    grid = createEmptyGrid();
    
    const centerX = Math.floor(GRID_WIDTH / 2);
    const centerY = Math.floor(GRID_HEIGHT / 2);
    
    const patterns = [
        {x: centerX - 28, y: centerY - 16, cells: [
            [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,1,1,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,1,1,0,1,0,0,0,1,1,0,1,0,0,0,0,1,0,0,0,1,1,0,0,0,1,0,1,0,0,1,1,1,0,0,1,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,1,0,1,0,0,1,0,1,0,1,0,0,1,0,1,0,0,1,0,1,0,0,1,0,1,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,0,1,0,1,0,0,1,0,1,0,1,0,0,1,1,1,0,0,1,0,1,0,0,1,0,1,0,0,1,1,0,0,0,1,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,1,0,1,0,0,1,0,1,0,1,0,0,1,0,1,0,0,1,0,1,0,0,1,0,1,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,1,0,1,0,1,0,0,1,0,1,0,1,0,0,1,0,1,0,0,1,0,1,0,0,1,1,1,0,0,1,1,1,0,0,1,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]]},
    ];
    
    patterns.forEach(pattern => {
        for (let y = 0; y < pattern.cells.length; y++) {
            for (let x = 0; x < pattern.cells[y].length; x++) { 
                if (pattern.cells[y][x] === 1) {
                    const gridX = pattern.x + x;
                    const gridY = pattern.y + y;
                    if (gridX < GRID_WIDTH && gridY < GRID_HEIGHT) {
                        grid[gridY][gridX] = 1;
                    }
                }
            }
        }
    });
}

function countNeighbors(x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT) {
                count += grid[ny][nx];
            }
        }
    }
    return count;
}

function nextGeneration() {
    const newGrid = createEmptyGrid();
    
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const neighbors = countNeighbors(x, y);
            const cell = grid[y][x];
            
            if (cell === 1) {
                newGrid[y][x] = (neighbors === 2 || neighbors === 3) ? 1 : 0;
            } else {
                newGrid[y][x] = (neighbors === 3) ? 1 : 0;
            }
        }
    }
    
    grid = newGrid;
}

function findGlider() {
    let maxX = -1;
    let minY = GRID_HEIGHT;
    let bestScore = -GRID_WIDTH;
    
    // Search in the right half and top half of grid (50% each dimension)
    const searchStartX = Math.floor(GRID_WIDTH * 0.5); // Start from middle, not 75%
    const searchHeight = Math.floor(GRID_HEIGHT * 0.5); // Search top half
    
    for (let y = 0; y < searchHeight; y++) {
        for (let x = searchStartX; x < GRID_WIDTH; x++) {
            if (grid[y][x] === 1) {
                const score = x - y;
                if (score > bestScore) {
                    bestScore = score;
                    maxX = x;
                    minY = y;
                }
            }
        }
    }
    
    if (maxX === -1) {
        return { x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2) };
    }
    
    return { x: maxX, y: minY };
}

function isNearCorner(gliderX, gliderY) {
    const cornerRadius = 40;
    const nearTopRight = gliderX > (GRID_WIDTH - cornerRadius) && gliderY < cornerRadius;    
    return nearTopRight;
}

function updateCamera() {
    if (!isRunning) return;
    
    const glider = findGlider();
    const centerX = Math.floor(GRID_WIDTH / 2);
    const centerY = Math.floor(GRID_HEIGHT / 2);
    const distanceFromCenter = Math.sqrt(Math.pow(glider.x - centerX, 2) + Math.pow(glider.y - centerY, 2));
    
    // Don't track until glider is at least 30 cells away from center
    if (distanceFromCenter < 30) {
        return; // Keep camera at initial position
    }
    
    // Start tracking timer when we begin following the glider
    if (!isTrackingStarted) {
        isTrackingStarted = true;
        trackingStartTime = Date.now();
        console.log('Tracking started! Timer begins now.');
    }
    
    // Check if near corner and adjust zoom
    const nearCorner = isNearCorner(glider.x, glider.y);
    if (nearCorner) {
        targetZoom = 8; // More dramatic zoom when near corner
    } else {
        targetZoom = 5; // Increased from 3 to 5 for more zoom while tracking
    }
    
    // Debug logging - show every frame when near corner
    if (nearCorner || Math.random() < 0.02) {
        console.log(`Glider: (${glider.x}, ${glider.y}), Distance from center: ${distanceFromCenter.toFixed(1)}, Grid: ${GRID_WIDTH}x${GRID_HEIGHT}, Near corner: ${nearCorner}, Zoom: ${zoomLevel.toFixed(2)}, Target: ${targetZoom}`);
    }
    
    const zoomSmoothing = 0.03;
    zoomLevel += (targetZoom - zoomLevel) * zoomSmoothing;
    
    const visibleCols = Math.floor(canvas.width / (CELL_SIZE * zoomLevel));
    const visibleRows = Math.floor(canvas.height / (CELL_SIZE * zoomLevel));
    
    const paddingX = nearCorner ? -8 : 0;
    const paddingY = nearCorner ? -8 : 0;
    
    targetCameraX = glider.x - Math.floor(visibleCols / 2) + paddingX;
    targetCameraY = glider.y - Math.floor(visibleRows / 2) + paddingY;
    
    targetCameraX = Math.max(0, Math.min(targetCameraX, GRID_WIDTH - visibleCols));
    targetCameraY = Math.max(0, Math.min(targetCameraY, GRID_HEIGHT - visibleRows));
    
    const smoothing = 0.1;
    cameraX += (targetCameraX - cameraX) * smoothing;
    cameraY += (targetCameraY - cameraY) * smoothing;
}

function render() {
    if (isTrackingStarted && trackingStartTime) {
        const elapsedTime = Date.now() - trackingStartTime;
        
        if (elapsedTime >= 4500) {
            const transitionStart = 4500;
            const transitionDuration = 2000;
            const transitionProgress = Math.min((elapsedTime - transitionStart) / transitionDuration, 1);
            
            backgroundColor = interpolateColor('#E40C10', '#000000', transitionProgress);
            
            
            document.body.style.backgroundColor = backgroundColor;
            
            // Smooth cell transition from black to white (starts halfway through background transition)
            if (transitionProgress >= 0.5) {
                const cellTransitionProgress = Math.min((transitionProgress - 0.5) * 2, 1);
                cellColor = interpolateColor('#000000', '#FFFFFF', cellTransitionProgress);
                
                // Smooth text color transitions
                const textColor = interpolateColor('#000000', '#FFFFFF', cellTransitionProgress);
                const title = document.querySelector('h1');
                const subtitle = document.querySelector('p');
                if (title) title.style.color = textColor;
                if (subtitle) subtitle.style.color = textColor;
            }
            
            if (!colorTransitionTriggered && transitionProgress >= 1) {
                colorTransitionTriggered = true;
                console.log('Smooth color transition completed!');
            }
        }
        
        // Start navigation fade to black
        if (elapsedTime >= 10000 && !navigationFadeStarted) {
            navigationFadeStarted = true;
            console.log('Starting navigation fade to black...');
        }
        
        // Handle navigation fade
        if (navigationFadeStarted) {
            const fadeStart = 10000;
            const fadeDuration = 1500;
            const fadeProgress = Math.min((elapsedTime - fadeStart) / fadeDuration, 1);
            
            const currentBg = backgroundColor;
            const currentCell = cellColor;
            
            backgroundColor = interpolateColor(currentBg, '#000000', fadeProgress);
            cellColor = interpolateColor(currentCell, '#000000', fadeProgress);
            
            document.body.style.backgroundColor = backgroundColor;
            const textColor = interpolateColor('#FFFFFF', '#000000', fadeProgress);
            const title = document.querySelector('h1');
            const subtitle = document.querySelector('p');
            if (title) title.style.color = textColor;
            if (subtitle) subtitle.style.color = textColor;
            
            if (fadeProgress >= 1 && !redirectTriggered) {
                redirectTriggered = true;
                console.log('Fade complete, redirecting to projects page...');
                document.body.style.transition = 'background-color 0.8s ease-out';
                setTimeout(() => {
                    window.location.href = 'projects.html';
                }, 100);
                return;
            }
        }
    }
    
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const startX = Math.floor(cameraX);
    const startY = Math.floor(cameraY);
    const effectiveCellSize = CELL_SIZE * zoomLevel;
    const visibleCols = Math.ceil(canvas.width / effectiveCellSize) + 1;
    const visibleRows = Math.ceil(canvas.height / effectiveCellSize) + 1;

    // Render visible cells with current cell color
    ctx.fillStyle = cellColor;
    for (let y = 0; y < visibleRows; y++) {
        for (let x = 0; x < visibleCols; x++) {
            const gridX = startX + x;
            const gridY = startY + y;
            
            if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
                if (grid[gridY][gridX] === 1) {
                    const screenX = (x - (cameraX - startX)) * effectiveCellSize;
                    const screenY = (y - (cameraY - startY)) * effectiveCellSize;
                    ctx.fillRect(screenX, screenY, effectiveCellSize, effectiveCellSize);
                }
            }
        }
    }
}

function toggleSimulation() {
    if (isRunning) {
        clearInterval(intervalId);
        isRunning = false;
    } else {
        if (!hasStarted) {
            hasStarted = true;
        }
        intervalId = setInterval(() => {
            nextGeneration();
            updateCamera();
            render();
        }, 50);
        isRunning = true;
    }
}

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const effectiveCellSize = CELL_SIZE * zoomLevel;
    return {
        x: Math.floor((e.clientX - rect.left) / effectiveCellSize + cameraX),
        y: Math.floor((e.clientY - rect.top) / effectiveCellSize + cameraY)
    };
}

function drawCell(x, y) {
    if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
        grid[y][x] = grid[y][x] === 1 ? 0 : 1;
        render();
    }
}

canvas.addEventListener('mousedown', (e) => {
    if (!isRunning && hasStarted) {
        isDrawing = true;
        const pos = getMousePos(e);
        drawCell(pos.x, pos.y);
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawing && !isRunning && hasStarted) {
        const pos = getMousePos(e);
        drawCell(pos.x, pos.y);
    }
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

canvas.addEventListener('mouseleave', () => {
    isDrawing = false;
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!isRunning && hasStarted) {
        isDrawing = true;
        const touch = e.touches[0];
        const pos = getMousePos(touch);
        drawCell(pos.x, pos.y);
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isDrawing && !isRunning && hasStarted) {
        const touch = e.touches[0];
        const pos = getMousePos(touch);
        drawCell(pos.x, pos.y);
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    isDrawing = false;
});

function resizeCanvas() {
    if (!hasStarted) return;
    
    const newMargin = window.innerWidth < 640 ? 20 : 40;
    const newAvailableWidth = window.innerWidth - newMargin;
    const newAvailableHeight = window.innerHeight - newMargin;
    
    const minCells = window.innerWidth < 640 ? 60 : 80;
    const maxCells = window.innerWidth < 640 ? 40 : 50;
    const newCellSize = Math.floor(Math.min(newAvailableWidth / minCells, newAvailableHeight / maxCells));
    const newGridWidth = Math.floor(newAvailableWidth / newCellSize);
    const newGridHeight = Math.floor(newAvailableHeight / newCellSize);
    
    if (Math.abs(newGridWidth - GRID_WIDTH) > 5 || Math.abs(newGridHeight - GRID_HEIGHT) > 5) {
        location.reload();
    }
}

window.addEventListener('resize', resizeCanvas);

createInitialPattern();
render();

playBtn.addEventListener('click', toggleSimulation);