// content.js
// Declare all host panels globally so they are accessible to repositionButtonAndPanels
let calcHost, navPanel, tetrisHost, urlsHost;

// 1. Create the floating button
const floatingButton = document.createElement('button');
const iconUrl = chrome.runtime.getURL('soccer_kicking_icon.png');
floatingButton.innerHTML = `<img src="${iconUrl}" style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;" alt="SideKick Icon">`;
floatingButton.id = 'floating-calculator-btn';
floatingButton.title = 'Open Calculator';
Object.assign(floatingButton.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#2563eb', // blue
    color: 'white',
    border: 'none',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
    cursor: 'grab',
    zIndex: '2147483647',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s, background-color 0.2s',
    padding: '0',
    overflow: 'hidden'
});

floatingButton.onmouseenter = () => { floatingButton.style.transform = 'scale(1.05)'; };
floatingButton.onmouseleave = () => { floatingButton.style.transform = 'scale(1)'; };

// Dragging state variables
let isDragging = false;
let hasDragged = false;
let dragStartX = 0;
let dragStartY = 0;
let btnStartX = 0;
let btnStartY = 0;
let currentBtnLeft = window.innerWidth - 56 - 20; // Default matching right: 20px
let currentBtnTop = window.innerHeight - 56 - 20; // Default matching bottom: 20px

function repositionButtonAndPanels(left, top) {
    const btnWidth = 56;
    const btnHeight = 56;
    const padding = 10;

    const minLeft = padding;
    const maxLeft = window.innerWidth - btnWidth - padding;
    const minTop = padding;
    const maxTop = window.innerHeight - btnHeight - padding;

    // Clamp coordinates to keep button inside viewport
    currentBtnLeft = Math.max(minLeft, Math.min(left, maxLeft));
    currentBtnTop = Math.max(minTop, Math.min(top, maxTop));

    floatingButton.style.left = `${currentBtnLeft}px`;
    floatingButton.style.top = `${currentBtnTop}px`;
    floatingButton.style.bottom = 'auto';
    floatingButton.style.right = 'auto';

    // Position hosts dynamically relative to the floating button:
    // navPanel: width 200px, height auto (~250px)
    // calcHost: width 320px, height 480px
    // tetrisHost: width 480px, height 820px
    // urlsHost: width 768px, height 576px
    const hostsConfig = [
        { el: navPanel, width: 200, height: 250 },
        { el: calcHost, width: 320, height: 480 },
        { el: tetrisHost, width: 480, height: 820 },
        { el: urlsHost, width: 768, height: 576 }
    ];

    hostsConfig.forEach(config => {
        if (!config.el) return;

        // Horizontally: align host's right edge with button's right edge if on the right half,
        // otherwise align host's left edge with button's left edge.
        let hostLeft;
        if (currentBtnLeft + btnWidth / 2 > window.innerWidth / 2) {
            hostLeft = currentBtnLeft + btnWidth - config.width;
        } else {
            hostLeft = currentBtnLeft;
        }

        // Vertically: show host above button if on bottom half, otherwise show host below button.
        let hostTop;
        if (currentBtnTop + btnHeight / 2 > window.innerHeight / 2) {
            hostTop = currentBtnTop - config.height - 14;
        } else {
            hostTop = currentBtnTop + btnHeight + 14;
        }

        // Keep hosts within viewport bounds
        hostLeft = Math.max(padding, Math.min(hostLeft, window.innerWidth - config.width - padding));
        hostTop = Math.max(padding, Math.min(hostTop, window.innerHeight - config.height - padding));

        Object.assign(config.el.style, {
            left: `${hostLeft}px`,
            top: `${hostTop}px`,
            bottom: 'auto',
            right: 'auto'
        });
    });
}

// 2. Create the container with Shadow DOM for isolation
calcHost = document.createElement('div');
calcHost.id = 'floating-calculator-host';
Object.assign(calcHost.style, {
    position: 'fixed',
    bottom: '90px',
    right: '20px',
    width: '320px',
    height: '480px',
    zIndex: '2147483647',
    display: 'none',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    borderRadius: '16px',
    overflow: 'hidden',
    backgroundColor: '#0f172a'
});

const shadowRoot = calcHost.attachShadow({ mode: 'open' });

// Calculator UI
shadowRoot.innerHTML = `
  <style>
    :host {
      display: block;
      width: 100%;
      height: 100%;
      background-color: #0f172a;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f8fafc;
      box-sizing: border-box;
    }
    * { box-sizing: inherit; }
    .calculator { display: flex; flex-direction: column; height: 100%; }
    .display { background-color: #1e293b; padding: 24px 20px; text-align: right; min-height: 100px; display: flex; flex-direction: column; justify-content: flex-end; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .history { font-size: 14px; color: #94a3b8; min-height: 20px; margin-bottom: 8px; }
    .current { font-size: 40px; font-weight: 600; word-wrap: break-word; line-height: 1.1; margin: 0; }
    .keypad { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background-color: #334155; padding-top: 1px; flex-grow: 1; }
    button { border: none; background-color: #0f172a; color: #f8fafc; font-size: 24px; cursor: pointer; transition: background-color 0.15s ease; font-weight: 500; font-family: inherit; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; }
    button:hover { background-color: #1e293b; }
    button:active { background-color: #334155; }
    button.operator { background-color: #2563eb; color: #eff6ff; }
    button.operator:hover { background-color: #3b82f6; }
    button.operator:active { background-color: #60a5fa; }
    button.special { background-color: #475569; }
    button.special:hover { background-color: #64748b; }
    button.special:active { background-color: #94a3b8; }
    button.equals { background-color: #10b981; }
    button.equals:hover { background-color: #34d399; }
    button.equals:active { background-color: #6ee7b7; }
  </style>
  <div class="calculator">
    <div class="display">
      <div class="history" id="history"></div>
      <div class="current" id="current">0</div>
    </div>
    <div class="keypad" id="keypad">
      <button class="special" data-action="clear">C</button>
      <button class="special" data-action="delete">⌫</button>
      <button class="special" data-action="operator" data-val="%">%</button>
      <button class="operator" data-action="operator" data-val="/">÷</button>
      
      <button data-action="number" data-val="7">7</button>
      <button data-action="number" data-val="8">8</button>
      <button data-action="number" data-val="9">9</button>
      <button class="operator" data-action="operator" data-val="*">×</button>
      
      <button data-action="number" data-val="4">4</button>
      <button data-action="number" data-val="5">5</button>
      <button data-action="number" data-val="6">6</button>
      <button class="operator" data-action="operator" data-val="-">−</button>
      
      <button data-action="number" data-val="1">1</button>
      <button data-action="number" data-val="2">2</button>
      <button data-action="number" data-val="3">3</button>
      <button class="operator" data-action="operator" data-val="+">+</button>
      
      <button data-action="number" data-val="0" style="grid-column: span 2;">0</button>
      <button data-action="decimal" data-val=".">.</button>
      <button class="equals" data-action="calculate">=</button>
    </div>
  </div>
`;

// Nav Panel
navPanel = document.createElement('div');
navPanel.id = 'floating-nav-panel';
Object.assign(navPanel.style, {
    position: 'fixed',
    bottom: '90px',
    right: '20px',
    width: '200px',
    zIndex: '2147483647',
    display: 'none',
    flexDirection: 'column',
    gap: '8px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
});

const buttonsData = [
    { text: 'Calculator', color: '#10b981' }, // green
    { text: 'Tetris', color: '#f59e0b' }, // yellow
    { text: 'My URLs', color: '#3b82f6' }, // blue
    { text: 'My Notes', color: '#8b5cf6' }, // purple
    { text: 'My Things To Do', color: '#ec4899' }  // pink
];

buttonsData.forEach(data => {
    const btn = document.createElement('button');
    btn.innerText = data.text;
    Object.assign(btn.style, {
        padding: '12px 16px',
        backgroundColor: data.color,
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.1s'
    });
    btn.onmouseenter = () => { btn.style.transform = 'scale(1.02)'; };
    btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; };

    if (data.text === 'Calculator') {
        btn.addEventListener('click', () => {
            navPanel.style.display = 'none';
            calcHost.style.display = 'block';
        });
    } else if (data.text === 'Tetris') {
        btn.addEventListener('click', () => {
            navPanel.style.display = 'none';
            tetrisHost.style.display = 'block';
        });
    } else if (data.text === 'My URLs') {
        btn.addEventListener('click', () => {
            navPanel.style.display = 'none';
            urlsHost.style.display = 'block';
        });
    }

    navPanel.appendChild(btn);
});

// --- TETRIS AUDIO ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, type, duration, vol = 0.05) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}
const tetrisSounds = {
    move: () => playTone(300, 'square', 0.1, 0.02),
    rotate: () => playTone(400, 'square', 0.1, 0.02),
    fall: () => playTone(250, 'square', 0.05, 0.01),
    lock: () => playTone(150, 'square', 0.15, 0.05),
    clear: () => {
        playTone(800, 'square', 0.1, 0.05);
        setTimeout(() => playTone(1200, 'square', 0.15, 0.05), 100);
    },
    gameover: () => {
        playTone(200, 'sawtooth', 0.3, 0.05);
        setTimeout(() => playTone(150, 'sawtooth', 0.4, 0.05), 300);
    }
};

// --- TETRIS LOGIC ---
tetrisHost = document.createElement('div');
tetrisHost.id = 'floating-tetris-host';
Object.assign(tetrisHost.style, {
    position: 'fixed', bottom: '90px', right: '20px', width: '480px', height: '820px',
    zIndex: '2147483647', display: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    borderRadius: '16px', overflow: 'hidden', backgroundColor: '#0f172a'
});
const tetrisRoot = tetrisHost.attachShadow({ mode: 'open' });
tetrisRoot.innerHTML = `
<style>
    :host { display:block; width:100%; height:100%; background:#0f172a; color:#fff; font-family:sans-serif; }
    .container { display:flex; flex-direction:column; align-items:center; padding: 20px; }
    h2 { margin: 0 0 10px 0; font-size: 20px; color: #f59e0b; }
    canvas { background:#1e293b; border: 2px solid #334155; border-radius: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    .score { margin: 10px 0; font-size:18px; font-weight:bold; }
    .instructions { font-size: 12px; color:#94a3b8; text-align:center; }
</style>
<div class="container">
    <h2>Tetris</h2>
    <div class="score">Score: <span id="score-val">0</span></div>
    <canvas id="tetris-canvas" width="400" height="680"></canvas>
    <div class="instructions">Arrows to move/rotate<br>Down to drop<br>Esc to close</div>
</div>
`;
const tCanvas = tetrisRoot.getElementById('tetris-canvas');
const tCtx = tCanvas.getContext('2d');
tCtx.scale(40, 40);

const arena = [];
while (arena.length < 17) arena.push(new Array(10).fill(0));

const player = { pos: { x: 0, y: 0 }, matrix: null, score: 0 };
const colors = [null, '#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                tCtx.fillStyle = colors[value];
                tCtx.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) return true;
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = value;
        });
    });
}

function arenaSweep() {
    let rowCount = 1;
    let linesCleared = false;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) continue outer;
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        player.score += rowCount * 10;
        rowCount *= 2;
        linesCleared = true;
    }
    if (linesCleared) tetrisSounds.clear();
    tetrisRoot.getElementById('score-val').innerText = player.score;
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        tetrisSounds.lock();
        playerReset();
        arenaSweep();
    } else {
        tetrisSounds.fall();
    }
    dropCounter = 0;
}

function playerHardDrop() {
    while (!collide(arena, player)) {
        player.pos.y++;
    }
    player.pos.y--;
    merge(arena, player);
    tetrisSounds.lock();
    playerReset();
    arenaSweep();
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    } else {
        tetrisSounds.move();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    for (let y = 0; y < player.matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [player.matrix[x][y], player.matrix[y][x]] = [player.matrix[y][x], player.matrix[x][y]];
        }
    }
    if (dir > 0) player.matrix.forEach(row => row.reverse());
    else player.matrix.reverse();

    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            for (let y = 0; y < player.matrix.length; ++y) {
                for (let x = 0; x < y; ++x) {
                    [player.matrix[x][y], player.matrix[y][x]] = [player.matrix[y][x], player.matrix[x][y]];
                }
            }
            if (-dir > 0) player.matrix.forEach(row => row.reverse());
            else player.matrix.reverse();
            player.pos.x = pos;
            return;
        }
    }
    tetrisSounds.rotate();
}

function createPiece(type) {
    if (type === 'T') return [[0, 0, 0], [1, 1, 1], [0, 1, 0]];
    if (type === 'O') return [[2, 2], [2, 2]];
    if (type === 'L') return [[0, 3, 0], [0, 3, 0], [0, 3, 3]];
    if (type === 'J') return [[0, 4, 0], [0, 4, 0], [4, 4, 0]];
    if (type === 'I') return [[0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0]];
    if (type === 'S') return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
    if (type === 'Z') return [[7, 7, 0], [0, 7, 7], [0, 0, 0]];
}

function playerReset() {
    const pieces = 'ILJOTSZ';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        tetrisSounds.gameover();
        arena.forEach(row => row.fill(0));
        player.score = 0;
        tetrisRoot.getElementById('score-val').innerText = player.score;
    }
}

function draw() {
    tCtx.fillStyle = '#1e293b';
    tCtx.fillRect(0, 0, tCanvas.width, tCanvas.height);
    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
}

let dropCounter = 0;
let lastTime = 0;
function tetrisUpdate(time = 0) {
    if (tetrisHost.style.display !== 'block') {
        lastTime = time;
        requestAnimationFrame(tetrisUpdate);
        return;
    }
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > 500) { playerDrop(); }
    draw();
    requestAnimationFrame(tetrisUpdate);
}
playerReset();
tetrisUpdate();

// --- MY URLS PANEL ---
urlsHost = document.createElement('div');
urlsHost.id = 'floating-urls-host';
Object.assign(urlsHost.style, {
    position: 'fixed', bottom: '90px', right: '20px', width: '768px', height: '576px',
    zIndex: '2147483647', display: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    borderRadius: '16px', overflow: 'hidden', backgroundColor: '#f8fafc'
});
const urlsRoot = urlsHost.attachShadow({ mode: 'open' });

urlsRoot.innerHTML = `
<style>
    :host { display:block; width:100%; height:100%; background:#f8fafc; color:#1e293b; font-family: Verdana, sans-serif; box-sizing: border-box; position: relative; }
    * { box-sizing: inherit; }
    .header { padding: 10px; display: flex; justify-content: flex-end; align-items: center; background: #e2e8f0; border-bottom: 1px solid #cbd5e1; }
    .header label { font-size: 14px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; height: calc(100% - 41px); }
    .quadrant { padding: 10px; display: flex; flex-direction: column; overflow-y: auto; }
    .q-daily { background-color: #bbf7d0; } /* pastel green (darkened) */
    .q-media { background-color: #fce7f3; } /* pastel pink */
    .q-financial { background-color: #bae6fd; } /* pastel blue (darkened) */
    .q-fun { background-color: #fef08a; } /* pastel yellow */
    .title { font-family: Verdana, sans-serif; font-size: 12px; font-weight: bold; text-align: center; margin-top: 0; margin-bottom: 8px; color: #475569; }
    .title-input {
        font-family: Verdana, sans-serif;
        font-size: 12px;
        font-weight: bold;
        text-align: center;
        margin: 0;
        color: #475569;
        border: 1px solid #cbd5e1;
        background: white;
        border-radius: 4px;
        width: 100%;
        box-sizing: border-box;
        padding: 4px;
    }
    .title-input:focus {
        border-color: #3b82f6;
        outline: none;
    }
    
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    td {
        padding: 4px;
        vertical-align: middle;
        font-family: Verdana, sans-serif;
        font-size: 10px;
        height: 38px;
        box-sizing: border-box;
        position: relative;
    }
    
    .display-mode td { border: none; }
    .edit-mode td { border: 1px solid #cbd5e1; }

    /* Display Mode link */
    .display-link {
        font-family: Verdana, sans-serif;
        font-size: 10px;
        text-decoration: none;
        word-break: break-all;
        display: block;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        border-radius: 4px;
    }
    .display-link:hover { text-decoration: underline; opacity: 0.9; }
    
    /* Edit Mode cell container */
    .edit-cell-container {
        display: flex;
        flex-direction: column;
        gap: 2px;
        width: 100%;
        height: 100%;
        justify-content: center;
        position: relative;
        padding-right: 14px; /* leave room for palette icon */
    }
    
    .cell-input {
        font-family: Verdana, sans-serif;
        font-size: 9px;
        padding: 2px;
        border: 1px solid #cbd5e1;
        border-radius: 3px;
        width: 100%;
        background: white;
        color: #1e293b;
        box-sizing: border-box;
    }
    .cell-input:focus {
        border-color: #3b82f6;
        outline: none;
    }
    
    .btn-color-picker {
        position: absolute;
        top: 50%;
        right: 0;
        transform: translateY(-50%);
        font-size: 10px;
        cursor: pointer;
        background: transparent;
        border: none;
        padding: 0;
        line-height: 1;
        opacity: 0.6;
        transition: opacity 0.15s;
    }
    .btn-color-picker:hover {
        opacity: 1;
    }

    /* Google Docs Color Picker Popover */
    #color-picker-popover {
        position: absolute;
        z-index: 100000;
        background: white;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.25);
        padding: 10px;
        display: none;
        width: 160px;
        color: #1e293b;
        font-family: sans-serif;
    }
    .color-picker-section {
        margin-bottom: 10px;
    }
    .color-picker-title {
        font-size: 9px;
        font-weight: bold;
        margin-bottom: 4px;
        text-transform: uppercase;
        color: #64748b;
        display: flex;
        align-items: center;
        gap: 4px;
    }
    .color-grid {
        display: grid;
        grid-template-columns: repeat(10, 1fr);
        gap: 2px;
    }
    .color-box {
        width: 12px;
        height: 12px;
        border-radius: 2px;
        cursor: pointer;
        border: 1px solid #e2e8f0;
        box-sizing: border-box;
    }
    .color-box:hover {
        transform: scale(1.2);
        border-color: #64748b;
        z-index: 1;
    }
    .popover-footer {
        border-top: 1px solid #e2e8f0;
        padding-top: 8px;
        display: flex;
        gap: 4px;
    }
    .btn-popover {
        flex: 1;
        padding: 4px;
        font-size: 8px;
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
    }
    .btn-popover:hover {
        background: #e2e8f0;
    }
    .format-option {
        margin-bottom: 6px;
        font-size: 10px;
        display: flex;
        align-items: center;
        gap: 6px;
        color: #475569;
        width: 100%;
    }
    .format-option label {
        display: flex;
        align-items: center;
        gap: 4px;
        font-weight: bold;
        cursor: pointer;
        font-size: 10px;
        color: #475569;
    }
    .format-option select {
        font-size: 9px;
        padding: 2px;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        background: white;
        color: #1e293b;
        cursor: pointer;
    }
    .color-box.selected {
        outline: 2px solid #2563eb;
        outline-offset: 1px;
        box-shadow: 0 0 4px rgba(37,99,235,0.6);
        transform: scale(1.15);
        z-index: 2;
        border-color: #1e293b;
    }
    /* Drag Mode styles */
    .drag-mode td {
        border: 1px dashed #a7f3d0;
        cursor: grab;
        transition: border-color 0.15s, background-color 0.15s;
    }
    .drag-mode td:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }
    .drag-mode td.drag-over {
        border: 2px dashed #2563eb !important;
        background-color: rgba(37, 99, 235, 0.15) !important;
    }
    .drag-mode td.drag-source {
        opacity: 0.4;
        border: 1px dashed #ef4444 !important;
    }
</style>
<div class="header">
    <label>
        <input type="checkbox" id="mode-toggle"> Edit Mode
    </label>
    <label style="margin-left: 15px;">
        <input type="checkbox" id="drag-toggle"> Drag Mode
    </label>
</div>
<div class="grid">
    <div class="quadrant q-daily">
        <h2 class="title" id="title-Daily">Daily</h2>
        <div id="list-Daily"></div>
    </div>
    <div class="quadrant q-media">
        <h2 class="title" id="title-Media">Media</h2>
        <div id="list-Media"></div>
    </div>
    <div class="quadrant q-financial">
        <h2 class="title" id="title-Financial">Financial</h2>
        <div id="list-Financial"></div>
    </div>
    <div class="quadrant q-fun">
        <h2 class="title" id="title-Fun">Fun</h2>
        <div id="list-Fun"></div>
    </div>
</div>

<!-- Custom Google Docs Style Color Picker Popover -->
<div id="color-picker-popover">
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">
        <span style="font-size: 10px; font-weight: bold; color: #475569;">Format Cell</span>
        <a href="#" id="link-close-popover" style="font-size: 10px; color: #2563eb; text-decoration: none; font-weight: bold;">Close</a>
    </div>
    <div class="color-picker-section" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 8px;">
        <div class="color-picker-title">✏️ Typography</div>
        <div class="format-option">
            <label><input type="checkbox" id="cell-bold-checkbox"> Bold</label>
        </div>
        <div class="format-option" style="justify-content: space-between;">
            <label style="width: 100%; display: flex; justify-content: space-between; align-items: center;">Font:
                <select id="cell-font-family">
                    <option value="Verdana, sans-serif">Verdana</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Courier New, monospace">Courier</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Impact, sans-serif">Impact</option>
                    <option value="Times New Roman, serif">Times</option>
                    <option value="'Comic Sans MS', 'Comic Sans', cursive">Comic Sans</option>
                </select>
            </label>
        </div>
        <div class="format-option" style="justify-content: space-between;">
            <label style="width: 100%; display: flex; justify-content: space-between; align-items: center;">Size:
                <select id="cell-font-size">
                    <option value="8px">8px</option>
                    <option value="9px">9px</option>
                    <option value="10px">10px</option>
                    <option value="11px">11px</option>
                    <option value="12px">12px</option>
                    <option value="14px">14px</option>
                    <option value="16px">16px</option>
                </select>
            </label>
        </div>
    </div>
    <div class="color-picker-section">
        <div class="color-picker-title">
            <span>A</span> Text Color
        </div>
        <div class="color-grid" id="text-color-grid"></div>
    </div>
    <div class="color-picker-section">
        <div class="color-picker-title">
            <span>✏️</span> Highlight Color
        </div>
        <div class="color-grid" id="bg-color-grid"></div>
    </div>
    <div class="popover-footer">
        <button class="btn-popover" id="btn-reset-cell" style="width: 100%;">Reset Colors</button>
    </div>
</div>
`;

let myUrlsData = {
    titles: {
        Daily: { text: 'Daily', bgColor: '', fgColor: '', fontWeight: 'bold', fontFamily: 'Verdana, sans-serif', fontSize: '12px' },
        Media: { text: 'Media', bgColor: '', fgColor: '', fontWeight: 'bold', fontFamily: 'Verdana, sans-serif', fontSize: '12px' },
        Financial: { text: 'Financial', bgColor: '', fgColor: '', fontWeight: 'bold', fontFamily: 'Verdana, sans-serif', fontSize: '12px' },
        Fun: { text: 'Fun', bgColor: '', fgColor: '', fontWeight: 'bold', fontFamily: 'Verdana, sans-serif', fontSize: '12px' }
    },
    Daily: Array.from({ length: 20 }, () => ({ name: '', url: '', bgColor: '', fgColor: '', fontWeight: 'normal', fontFamily: 'Verdana, sans-serif', fontSize: '10px' })),
    Media: Array.from({ length: 20 }, () => ({ name: '', url: '', bgColor: '', fgColor: '', fontWeight: 'normal', fontFamily: 'Verdana, sans-serif', fontSize: '10px' })),
    Financial: Array.from({ length: 20 }, () => ({ name: '', url: '', bgColor: '', fgColor: '', fontWeight: 'normal', fontFamily: 'Verdana, sans-serif', fontSize: '10px' })),
    Fun: Array.from({ length: 20 }, () => ({ name: '', url: '', bgColor: '', fgColor: '', fontWeight: 'normal', fontFamily: 'Verdana, sans-serif', fontSize: '10px' }))
};

let isEditMode = false;
let isDragMode = false;

function saveUrls() {
    chrome.storage.local.set({ myUrlsData });
}

const paletteColors = [
    // Grayscale
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
    // Theme hues
    '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
    // Google Docs standard shade blocks
    '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
    '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
    '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
    '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
    '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130'
];

const textGrid = urlsRoot.getElementById('text-color-grid');
const bgGrid = urlsRoot.getElementById('bg-color-grid');
const popover = urlsRoot.getElementById('color-picker-popover');
let activePopoverCell = null; // { quad, index }

paletteColors.forEach(color => {
    // Text Color Box
    const textBox = document.createElement('div');
    textBox.className = 'color-box';
    textBox.style.backgroundColor = color;
    textBox.setAttribute('data-color', color.toLowerCase());
    textBox.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activePopoverCell) {
            if (activePopoverCell.isTitle) {
                myUrlsData.titles[activePopoverCell.quad].fgColor = color;
            } else {
                const { quad, index } = activePopoverCell;
                myUrlsData[quad][index].fgColor = color;
            }
            saveUrls();
            renderUrls();

            textGrid.querySelectorAll('.color-box').forEach(box => box.classList.remove('selected'));
            textBox.classList.add('selected');
        }
    });
    textGrid.appendChild(textBox);

    // Background Color Box
    const bgBox = document.createElement('div');
    bgBox.className = 'color-box';
    bgBox.style.backgroundColor = color;
    bgBox.setAttribute('data-color', color.toLowerCase());
    bgBox.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activePopoverCell) {
            if (activePopoverCell.isTitle) {
                myUrlsData.titles[activePopoverCell.quad].bgColor = color;
            } else {
                const { quad, index } = activePopoverCell;
                myUrlsData[quad][index].bgColor = color;
            }
            saveUrls();
            renderUrls();

            bgGrid.querySelectorAll('.color-box').forEach(box => box.classList.remove('selected'));
            bgBox.classList.add('selected');
        }
    });
    bgGrid.appendChild(bgBox);
});

// Setup popover controls listeners
urlsRoot.getElementById('cell-bold-checkbox').addEventListener('change', (e) => {
    if (activePopoverCell) {
        if (activePopoverCell.isTitle) {
            myUrlsData.titles[activePopoverCell.quad].fontWeight = e.target.checked ? 'bold' : 'normal';
        } else {
            const { quad, index } = activePopoverCell;
            myUrlsData[quad][index].fontWeight = e.target.checked ? 'bold' : 'normal';
        }
        saveUrls();
        renderUrls();
    }
});

urlsRoot.getElementById('cell-font-family').addEventListener('change', (e) => {
    if (activePopoverCell) {
        if (activePopoverCell.isTitle) {
            myUrlsData.titles[activePopoverCell.quad].fontFamily = e.target.value;
        } else {
            const { quad, index } = activePopoverCell;
            myUrlsData[quad][index].fontFamily = e.target.value;
        }
        e.target.style.fontFamily = e.target.value;
        saveUrls();
        renderUrls();
    }
});

urlsRoot.getElementById('cell-font-size').addEventListener('change', (e) => {
    if (activePopoverCell) {
        if (activePopoverCell.isTitle) {
            myUrlsData.titles[activePopoverCell.quad].fontSize = e.target.value;
        } else {
            const { quad, index } = activePopoverCell;
            myUrlsData[quad][index].fontSize = e.target.value;
        }
        e.target.style.fontSize = e.target.value;
        saveUrls();
        renderUrls();
    }
});

urlsRoot.getElementById('btn-reset-cell').addEventListener('click', (e) => {
    e.stopPropagation();
    if (activePopoverCell) {
        if (activePopoverCell.isTitle) {
            const { quad } = activePopoverCell;
            myUrlsData.titles[quad].bgColor = '';
            myUrlsData.titles[quad].fgColor = '';
            myUrlsData.titles[quad].fontWeight = 'bold';
            myUrlsData.titles[quad].fontFamily = 'Verdana, sans-serif';
            myUrlsData.titles[quad].fontSize = '12px';
        } else {
            const { quad, index } = activePopoverCell;
            myUrlsData[quad][index].bgColor = '';
            myUrlsData[quad][index].fgColor = '';
            myUrlsData[quad][index].fontWeight = 'normal';
            myUrlsData[quad][index].fontFamily = 'Verdana, sans-serif';
            myUrlsData[quad][index].fontSize = '10px';
        }
        saveUrls();
        renderUrls();

        // Sync inputs
        const currentData = activePopoverCell.isTitle ? myUrlsData.titles[activePopoverCell.quad] : myUrlsData[activePopoverCell.quad][activePopoverCell.index];
        urlsRoot.getElementById('cell-bold-checkbox').checked = currentData.fontWeight === 'bold';
        
        const fontFamilySelect = urlsRoot.getElementById('cell-font-family');
        fontFamilySelect.value = currentData.fontFamily || 'Verdana, sans-serif';
        fontFamilySelect.style.fontFamily = fontFamilySelect.value;
        
        const fontSizeSelect = urlsRoot.getElementById('cell-font-size');
        fontSizeSelect.value = currentData.fontSize || (activePopoverCell.isTitle ? '12px' : '10px');
        fontSizeSelect.style.fontSize = fontSizeSelect.value;

        textGrid.querySelectorAll('.color-box').forEach(box => box.classList.remove('selected'));
        bgGrid.querySelectorAll('.color-box').forEach(box => box.classList.remove('selected'));
    }
});

urlsRoot.getElementById('link-close-popover').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    popover.style.display = 'none';
    activePopoverCell = null;
});

// Close popover when clicking anywhere else in the urls panel
urlsHost.addEventListener('click', () => {
    popover.style.display = 'none';
    activePopoverCell = null;
});
popover.addEventListener('click', (e) => {
    e.stopPropagation();
});

function renderUrls() {
    const quadrants = ['Daily', 'Media', 'Financial', 'Fun'];

    quadrants.forEach(quad => {
        const titleEl = urlsRoot.getElementById('title-' + quad);
        if (titleEl) {
            titleEl.innerHTML = '';
            const tData = myUrlsData.titles[quad];
            
            // Apply styles to titleEl
            titleEl.style.backgroundColor = tData.bgColor || '';
            titleEl.style.color = tData.fgColor || '#475569';
            titleEl.style.fontWeight = tData.fontWeight || 'bold';
            titleEl.style.fontFamily = tData.fontFamily || 'Verdana, sans-serif';
            titleEl.style.fontSize = tData.fontSize || '12px';
            titleEl.style.borderRadius = tData.bgColor ? '4px' : '';
            titleEl.style.padding = tData.bgColor ? '4px' : '0';

            if (isEditMode) {
                // Clear titleEl outer styles in edit mode to avoid duplication with input styling
                titleEl.style.backgroundColor = '';
                titleEl.style.color = '';
                titleEl.style.fontWeight = 'normal';
                titleEl.style.padding = '0';
                titleEl.style.borderRadius = '';

                const container = document.createElement('div');
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.gap = '4px';
                container.style.width = '100%';
                container.style.position = 'relative';

                const input = document.createElement('input');
                input.className = 'title-input';
                input.value = tData.text;
                input.style.backgroundColor = tData.bgColor || 'white';
                input.style.color = tData.fgColor || '#475569';
                input.style.fontWeight = tData.fontWeight || 'bold';
                input.style.fontFamily = tData.fontFamily || 'Verdana, sans-serif';
                input.style.fontSize = tData.fontSize || '12px';

                input.addEventListener('input', (e) => {
                    myUrlsData.titles[quad].text = e.target.value;
                    saveUrls();
                });

                const pickerBtn = document.createElement('button');
                pickerBtn.className = 'btn-color-picker';
                pickerBtn.style.position = 'static';
                pickerBtn.style.transform = 'none';
                pickerBtn.innerText = '🎨';
                pickerBtn.title = 'Format Title';
                pickerBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    activePopoverCell = { quad, isTitle: true };
                    
                    const rect = pickerBtn.getBoundingClientRect();
                    const hostRect = urlsHost.getBoundingClientRect();
                    
                    let topPos = rect.bottom - hostRect.top;
                    let leftPos = rect.left - hostRect.left - 130;
                    
                    if (leftPos < 10) leftPos = 10;
                    const popoverHeight = 420;
                    if (topPos + popoverHeight > hostRect.height) {
                        topPos = hostRect.height - popoverHeight - 10;
                    }
                    if (topPos < 10) topPos = 10;
                    
                    // Sync popup controls with current title state
                    urlsRoot.getElementById('cell-bold-checkbox').checked = tData.fontWeight === 'bold';
                    
                    const fontFamilySelect = urlsRoot.getElementById('cell-font-family');
                    fontFamilySelect.value = tData.fontFamily || 'Verdana, sans-serif';
                    fontFamilySelect.style.fontFamily = fontFamilySelect.value;
                    
                    const fontSizeSelect = urlsRoot.getElementById('cell-font-size');
                    fontSizeSelect.value = tData.fontSize || '12px';
                    fontSizeSelect.style.fontSize = fontSizeSelect.value;

                    // Sync selected outlines in color grids
                    textGrid.querySelectorAll('.color-box').forEach(box => box.classList.remove('selected'));
                    bgGrid.querySelectorAll('.color-box').forEach(box => box.classList.remove('selected'));

                    if (tData.fgColor) {
                        const selText = textGrid.querySelector(`.color-box[data-color="${tData.fgColor.toLowerCase()}"]`);
                        if (selText) selText.classList.add('selected');
                    }
                    if (tData.bgColor) {
                        const selBg = bgGrid.querySelector(`.color-box[data-color="${tData.bgColor.toLowerCase()}"]`);
                        if (selBg) selBg.classList.add('selected');
                    }
                    
                    popover.style.top = `${topPos}px`;
                    popover.style.left = `${leftPos}px`;
                    popover.style.display = 'block';
                });

                container.appendChild(input);
                container.appendChild(pickerBtn);
                titleEl.appendChild(container);
            } else {
                titleEl.innerText = tData.text;
            }
        }

        const listDiv = urlsRoot.getElementById('list-' + quad);
        listDiv.innerHTML = '';

        const table = document.createElement('table');
        if (isEditMode) {
            table.className = 'edit-mode';
        } else if (isDragMode) {
            table.className = 'drag-mode';
        } else {
            table.className = 'display-mode';
        }

        for (let r = 0; r < 10; r++) {
            const tr = document.createElement('tr');
            for (let c = 0; c < 2; c++) {
                const td = document.createElement('td');
                const cellIndex = r * 2 + c;
                const item = myUrlsData[quad][cellIndex];

                if (item.bgColor) td.style.backgroundColor = item.bgColor;
                if (item.fgColor) td.style.color = item.fgColor;
                td.style.fontWeight = item.fontWeight || 'normal';
                td.style.fontFamily = item.fontFamily || 'Verdana, sans-serif';
                td.style.fontSize = item.fontSize || '10px';

                td.setAttribute('data-quad', quad);
                td.setAttribute('data-index', cellIndex.toString());

                if (isDragMode) {
                    if (item.name || item.url) {
                        td.setAttribute('draggable', 'true');
                        td.addEventListener('dragstart', (e) => {
                            td.classList.add('drag-source');
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', JSON.stringify({ quad, index: cellIndex }));
                        });
                        td.addEventListener('dragend', () => {
                            td.classList.remove('drag-source');
                            urlsRoot.querySelectorAll('td').forEach(el => {
                                el.classList.remove('drag-over');
                                el.classList.remove('drag-source');
                            });
                        });
                    }

                    td.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        td.classList.add('drag-over');
                    });

                    td.addEventListener('dragleave', () => {
                        td.classList.remove('drag-over');
                    });

                    td.addEventListener('drop', (e) => {
                        e.preventDefault();
                        td.classList.remove('drag-over');
                        try {
                            const sourceDataStr = e.dataTransfer.getData('text/plain');
                            if (sourceDataStr) {
                                const source = JSON.parse(sourceDataStr);
                                const sourceQuad = source.quad;
                                const sourceIndex = parseInt(source.index, 10);
                                
                                const itemA = { ...myUrlsData[sourceQuad][sourceIndex] };
                                const itemB = { ...myUrlsData[quad][cellIndex] };
                                
                                const isOccupied = (item) => !!(item.name || item.url);
                                
                                if (isOccupied(itemB)) {
                                    const targetEmptyIndices = [];
                                    for (let i = 0; i < 20; i++) {
                                        if (quad === sourceQuad && i === sourceIndex) {
                                            continue;
                                        }
                                        if (!isOccupied(myUrlsData[quad][i])) {
                                            targetEmptyIndices.push(i);
                                        }
                                    }
                                    
                                    if (targetEmptyIndices.length > 0) {
                                        const getDistance = (idx1, idx2) => {
                                            const r1 = Math.floor(idx1 / 2), c1 = idx1 % 2;
                                            const r2 = Math.floor(idx2 / 2), c2 = idx2 % 2;
                                            return Math.abs(r1 - r2) + Math.abs(c1 - c2);
                                        };
                                        
                                        targetEmptyIndices.sort((x, y) => getDistance(x, cellIndex) - getDistance(y, cellIndex));
                                        const closestEmptyIndex = targetEmptyIndices[0];
                                        
                                        myUrlsData[quad][closestEmptyIndex] = itemB;
                                        myUrlsData[quad][cellIndex] = itemA;
                                        myUrlsData[sourceQuad][sourceIndex] = { name: '', url: '', bgColor: '', fgColor: '', fontWeight: 'normal', fontFamily: 'Verdana, sans-serif', fontSize: '10px' };
                                    } else {
                                        myUrlsData[sourceQuad][sourceIndex] = itemB;
                                        myUrlsData[quad][cellIndex] = itemA;
                                    }
                                } else {
                                    myUrlsData[quad][cellIndex] = itemA;
                                    myUrlsData[sourceQuad][sourceIndex] = { name: '', url: '', bgColor: '', fgColor: '', fontWeight: 'normal', fontFamily: 'Verdana, sans-serif', fontSize: '10px' };
                                }

                                saveUrls();
                                renderUrls();
                            }
                        } catch (err) {
                            console.error('Drag and drop error:', err);
                        }
                    });
                }

                if (isEditMode) {
                    const container = document.createElement('div');
                    container.className = 'edit-cell-container';

                    const nameInput = document.createElement('input');
                    nameInput.className = 'cell-input';
                    nameInput.type = 'text';
                    nameInput.value = item.name;
                    nameInput.placeholder = 'Name';
                    nameInput.addEventListener('input', (e) => {
                        myUrlsData[quad][cellIndex].name = e.target.value;
                        saveUrls();
                    });

                    const urlInput = document.createElement('input');
                    urlInput.className = 'cell-input';
                    urlInput.type = 'text';
                    urlInput.value = item.url;
                    urlInput.placeholder = 'URL';
                    urlInput.addEventListener('input', (e) => {
                        myUrlsData[quad][cellIndex].url = e.target.value;
                        saveUrls();
                    });

                    const pickerBtn = document.createElement('button');
                    pickerBtn.className = 'btn-color-picker';
                    pickerBtn.innerText = '🎨';
                    pickerBtn.title = 'Format Cell';
                    pickerBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        activePopoverCell = { quad, index: cellIndex };
                        
                        const rect = pickerBtn.getBoundingClientRect();
                        const hostRect = urlsHost.getBoundingClientRect();
                        
                        let topPos = rect.bottom - hostRect.top;
                        let leftPos = rect.left - hostRect.left - 130;
                        
                        if (leftPos < 10) leftPos = 10;
                        const popoverHeight = 420;
                        if (topPos + popoverHeight > hostRect.height) {
                            topPos = hostRect.height - popoverHeight - 10;
                        }
                        if (topPos < 10) topPos = 10;
                        
                        // Sync popup controls with current cell state
                        urlsRoot.getElementById('cell-bold-checkbox').checked = item.fontWeight === 'bold';
                        
                        const fontFamilySelect = urlsRoot.getElementById('cell-font-family');
                        fontFamilySelect.value = item.fontFamily || 'Verdana, sans-serif';
                        fontFamilySelect.style.fontFamily = fontFamilySelect.value;
                        
                        const fontSizeSelect = urlsRoot.getElementById('cell-font-size');
                        fontSizeSelect.value = item.fontSize || '10px';
                        fontSizeSelect.style.fontSize = fontSizeSelect.value;

                        // Sync selected outlines in color grids
                        textGrid.querySelectorAll('.color-box').forEach(box => box.classList.remove('selected'));
                        bgGrid.querySelectorAll('.color-box').forEach(box => box.classList.remove('selected'));

                        if (item.fgColor) {
                            const selText = textGrid.querySelector(`.color-box[data-color="${item.fgColor.toLowerCase()}"]`);
                            if (selText) selText.classList.add('selected');
                        }
                        if (item.bgColor) {
                            const selBg = bgGrid.querySelector(`.color-box[data-color="${item.bgColor.toLowerCase()}"]`);
                            if (selBg) selBg.classList.add('selected');
                        }
                        
                        popover.style.top = `${topPos}px`;
                        popover.style.left = `${leftPos}px`;
                        popover.style.display = 'block';
                    });

                    container.appendChild(nameInput);
                    container.appendChild(urlInput);
                    container.appendChild(pickerBtn);
                    td.appendChild(container);
                } else {
                    if (item.name || item.url) {
                        const link = document.createElement('a');
                        link.className = 'display-link';
                        link.href = (item.url && !item.url.startsWith('http')) ? 'https://' + item.url : item.url;
                        link.target = '_blank';
                        link.innerText = item.name || item.url;
                        
                        link.style.fontWeight = item.fontWeight || 'normal';
                        link.style.fontFamily = item.fontFamily || 'Verdana, sans-serif';
                        link.style.fontSize = item.fontSize || '10px';
                        if (item.fgColor) {
                            link.style.color = item.fgColor;
                        } else {
                            link.style.color = '#2563eb';
                        }
                        if (isDragMode) {
                            link.style.pointerEvents = 'none';
                        }
                        td.appendChild(link);
                    }
                }
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        listDiv.appendChild(table);
    });

    const modeToggle = urlsRoot.getElementById('mode-toggle');
    modeToggle.checked = isEditMode;
    const dragToggle = urlsRoot.getElementById('drag-toggle');
    dragToggle.checked = isDragMode;
}

function ensure20Cells(data) {
    const result = [];
    for (let i = 0; i < 20; i++) {
        if (data && data[i]) {
            result.push({
                name: data[i].name || '',
                url: data[i].url || '',
                bgColor: data[i].bgColor || '',
                fgColor: data[i].fgColor || '',
                fontWeight: data[i].fontWeight || 'normal',
                fontFamily: data[i].fontFamily || 'Verdana, sans-serif',
                fontSize: data[i].fontSize || '10px'
            });
        } else {
            result.push({ name: '', url: '', bgColor: '', fgColor: '', fontWeight: 'normal', fontFamily: 'Verdana, sans-serif', fontSize: '10px' });
        }
    }
    return result;
}

// Load from storage
chrome.storage.local.get(['myUrlsData'], (result) => {
    const normalizeTitle = (titleVal, defaultText) => {
        if (!titleVal) {
            return { text: defaultText, bgColor: '', fgColor: '', fontWeight: 'bold', fontFamily: 'Verdana, sans-serif', fontSize: '12px' };
        }
        if (typeof titleVal === 'string') {
            return { text: titleVal, bgColor: '', fgColor: '', fontWeight: 'bold', fontFamily: 'Verdana, sans-serif', fontSize: '12px' };
        }
        return {
            text: titleVal.text || defaultText,
            bgColor: titleVal.bgColor || '',
            fgColor: titleVal.fgColor || '',
            fontWeight: titleVal.fontWeight || 'bold',
            fontFamily: titleVal.fontFamily || 'Verdana, sans-serif',
            fontSize: titleVal.fontSize || '12px'
        };
    };

    if (result.myUrlsData) {
        const loadedTitles = result.myUrlsData.titles || {};
        myUrlsData = {
            titles: {
                Daily: normalizeTitle(loadedTitles.Daily, 'Daily'),
                Media: normalizeTitle(loadedTitles.Media, 'Media'),
                Financial: normalizeTitle(loadedTitles.Financial, 'Financial'),
                Fun: normalizeTitle(loadedTitles.Fun, 'Fun')
            },
            Daily: ensure20Cells(result.myUrlsData.Daily),
            Media: ensure20Cells(result.myUrlsData.Media),
            Financial: ensure20Cells(result.myUrlsData.Financial),
            Fun: ensure20Cells(result.myUrlsData.Fun)
        };
    } else {
        const initQuad = () => Array.from({ length: 20 }, () => ({ name: '', url: '', bgColor: '', fgColor: '', fontWeight: 'normal', fontFamily: 'Verdana, sans-serif', fontSize: '10px' }));
        myUrlsData = {
            titles: {
                Daily: normalizeTitle(null, 'Daily'),
                Media: normalizeTitle(null, 'Media'),
                Financial: normalizeTitle(null, 'Financial'),
                Fun: normalizeTitle(null, 'Fun')
            },
            Daily: initQuad(),
            Media: initQuad(),
            Financial: initQuad(),
            Fun: initQuad()
        };
        // Default samples
        myUrlsData.Daily[0] = { name: 'Google', url: 'https://google.com', bgColor: '', fgColor: '', fontWeight: 'normal', fontFamily: 'Verdana, sans-serif', fontSize: '10px' };
        myUrlsData.Media[0] = { name: 'YouTube', url: 'https://youtube.com', bgColor: '', fgColor: '', fontWeight: 'normal', fontFamily: 'Verdana, sans-serif', fontSize: '10px' };
        myUrlsData.Financial[0] = { name: 'Chase', url: 'https://chase.com', bgColor: '', fgColor: '', fontWeight: 'normal', fontFamily: 'Verdana, sans-serif', fontSize: '10px' };
        myUrlsData.Fun[0] = { name: 'Reddit', url: 'https://reddit.com', bgColor: '', fgColor: '', fontWeight: 'normal', fontFamily: 'Verdana, sans-serif', fontSize: '10px' };
    }
    renderUrls();
});

// Mode Toggle
const modeToggle = urlsRoot.getElementById('mode-toggle');
const dragToggle = urlsRoot.getElementById('drag-toggle');

modeToggle.addEventListener('change', (e) => {
    isEditMode = e.target.checked;
    if (isEditMode) {
        isDragMode = false;
        dragToggle.checked = false;
    }
    renderUrls();
});

dragToggle.addEventListener('change', (e) => {
    isDragMode = e.target.checked;
    if (isDragMode) {
        isEditMode = false;
        modeToggle.checked = false;
    }
    renderUrls();
});

document.body.appendChild(floatingButton);
document.body.appendChild(navPanel);
document.body.appendChild(calcHost);
document.body.appendChild(tetrisHost);
document.body.appendChild(urlsHost);

// Toggle visibility
floatingButton.addEventListener('click', () => {
    // If the button was dragged, ignore the click event and reset flag
    if (hasDragged) {
        hasDragged = false;
        return;
    }
    if (calcHost.style.display === 'block') {
        calcHost.style.display = 'none';
        navPanel.style.display = 'flex';
    } else {
        if (navPanel.style.display === 'none') {
            navPanel.style.display = 'flex';
        } else {
            navPanel.style.display = 'none';
        }
    }
});

// Dragging Logic
floatingButton.addEventListener('mousedown', (e) => {
    // Only allow dragging with left-click
    if (e.button !== 0) return;

    isDragging = true;
    hasDragged = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    const rect = floatingButton.getBoundingClientRect();
    btnStartX = rect.left;
    btnStartY = rect.top;

    floatingButton.style.cursor = 'grabbing';
    e.preventDefault(); // Prevents cursor text/highlighting issues
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasDragged = true;
    }

    repositionButtonAndPanels(btnStartX + dx, btnStartY + dy);
});

window.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        floatingButton.style.cursor = 'grab';
    }
});

// Window Resize Handling
window.addEventListener('resize', () => {
    repositionButtonAndPanels(currentBtnLeft, currentBtnTop);
});

// Initialize position using top/left coordinates
repositionButtonAndPanels(currentBtnLeft, currentBtnTop);

// Calculator Logic inside Shadow DOM
const currentDisplay = shadowRoot.getElementById('current');
const historyDisplay = shadowRoot.getElementById('history');
const keypad = shadowRoot.getElementById('keypad');

let currentOperand = '0';
let previousOperand = '';
let operation = null;
let shouldResetScreen = false;

function formatNumber(number) {
    if (number === '-' || number === '') return number;
    const stringNumber = number.toString();
    const integerDigits = parseFloat(stringNumber.split('.')[0]);
    const decimalDigits = stringNumber.split('.')[1];
    let integerDisplay = isNaN(integerDigits) ? '' : integerDigits.toLocaleString('en', { maximumFractionDigits: 0 });
    return decimalDigits != null ? `${integerDisplay}.${decimalDigits}` : integerDisplay;
}

function updateDisplay() {
    currentDisplay.innerText = formatNumber(currentOperand);
    if (operation != null) {
        let opSymbol = operation;
        if (operation === '*') opSymbol = '×';
        if (operation === '/') opSymbol = '÷';
        historyDisplay.innerText = `${formatNumber(previousOperand)} ${opSymbol}`;
    } else {
        historyDisplay.innerText = '';
    }
}

function clear() { currentOperand = '0'; previousOperand = ''; operation = null; shouldResetScreen = false; }
function deleteNumber() { if (currentOperand === '0' || shouldResetScreen) { shouldResetScreen = false; return; } currentOperand = currentOperand.toString().slice(0, -1); if (currentOperand === '' || currentOperand === '-') currentOperand = '0'; }
function appendNumber(number) { if (currentOperand === '0' && number !== '.') { currentOperand = number; return; } if (shouldResetScreen) { currentOperand = number; shouldResetScreen = false; return; } if (number === '.' && currentOperand.includes('.')) return; currentOperand = currentOperand.toString() + number; }
function chooseOperation(op) { if (currentOperand === '0' && op === '-') { currentOperand = '-'; return; } if (currentOperand === '-' || currentOperand === '') return; if (previousOperand !== '') { calculate(); } operation = op; previousOperand = currentOperand; currentOperand = '0'; }

function calculate() {
    let result;
    const prev = parseFloat(previousOperand);
    const current = parseFloat(currentOperand);
    if (isNaN(prev) || isNaN(current)) return;
    switch (operation) {
        case '+': result = prev + current; break;
        case '-': result = prev - current; break;
        case '*': result = prev * current; break;
        case '/': result = current === 0 ? 'Error' : prev / current; break;
        case '%': result = prev % current; break;
        default: return;
    }
    currentOperand = result === 'Error' ? 'Error' : result.toString();
    operation = null; previousOperand = ''; shouldResetScreen = true;
}

keypad.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') return;
    if (currentOperand === 'Error' && e.target.dataset.action !== 'clear') clear();
    const btn = e.target;
    const action = btn.dataset.action;
    const val = btn.dataset.val;
    if (action === 'number') appendNumber(val);
    else if (action === 'operator') chooseOperation(val);
    else if (action === 'decimal') appendNumber(val);
    else if (action === 'clear') clear();
    else if (action === 'delete') deleteNumber();
    else if (action === 'calculate') calculate();
    updateDisplay();
});

document.addEventListener('keydown', (e) => {
    // Global shortcut: Alt + S or Ctrl + Shift + S to toggle the floating button itself
    if ((e.altKey && e.key.toLowerCase() === 's') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's')) {
        e.preventDefault();
        if (floatingButton.style.display !== 'none') {
            floatingButton.style.display = 'none';
            calcHost.style.display = 'none';
            navPanel.style.display = 'none';
            tetrisHost.style.display = 'none';
            urlsHost.style.display = 'none';
        } else {
            floatingButton.style.display = 'flex';
        }
        return;
    }

    // Escape tiered shutdown logic
    if (e.key === 'Escape') {
        if (calcHost.style.display === 'block') {
            // If calculator is open, return to nav panel
            calcHost.style.display = 'none';
            navPanel.style.display = 'flex';
            clear();
            updateDisplay();
            return;
        } else if (tetrisHost.style.display === 'block') {
            // If tetris is open, return to nav panel
            tetrisHost.style.display = 'none';
            navPanel.style.display = 'flex';
            return;
        } else if (urlsHost.style.display === 'block') {
            // If urls panel is open, return to nav panel
            urlsHost.style.display = 'none';
            navPanel.style.display = 'flex';
            return;
        } else if (navPanel.style.display === 'flex') {
            // If nav panel is open, close it
            navPanel.style.display = 'none';
            return;
        } else {
            // If all panels are closed, pressing Escape hides/shows the floating icon
            if (floatingButton.style.display !== 'none') {
                floatingButton.style.display = 'none';
            } else {
                floatingButton.style.display = 'flex';
            }
            return;
        }
    }

    // Tetris Controls
    if (tetrisHost.style.display === 'block') {
        if (e.key === 'ArrowLeft') { playerMove(-1); e.preventDefault(); return; }
        if (e.key === 'ArrowRight') { playerMove(1); e.preventDefault(); return; }
        if (e.key === 'ArrowDown') { playerHardDrop(); e.preventDefault(); return; }
        if (e.key === 'ArrowUp') { playerRotate(1); e.preventDefault(); return; }
        return; // Prevent calculator keys processing if tetris is open
    }

    // Only capture keyboard input if the floating calculator is currently visible
    if (calcHost.style.display === 'none') return;

    // Prevent default interactions like page scrolling (e.g. from space bar or arrows if mapped)
    // but usually only prevent it for known calculator keys, especially Enter

    if (currentOperand === 'Error' && e.key !== 'Escape') {
        clear();
    }

    if (e.key >= '0' && e.key <= '9') {
        appendNumber(e.key);
        updateDisplay();
    } else if (e.key === '.') {
        appendNumber(e.key);
        updateDisplay();
    } else if (e.key === '=' || e.key === 'Enter') {
        e.preventDefault();
        calculate();
        updateDisplay();
    } else if (e.key === 'Backspace') {
        deleteNumber();
        updateDisplay();
    } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/' || e.key === '%') {
        chooseOperation(e.key);
        updateDisplay();
    }
});

updateDisplay();