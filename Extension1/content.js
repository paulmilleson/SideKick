// content.js
// Declare all host panels globally so they are accessible to repositionButtonAndPanels
let calcHost, navPanel, tetrisHost, urlsHost, notesHost;

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
        { el: urlsHost, width: 768, height: 576 },
        { el: notesHost, width: 768, height: 576 }
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
    } else if (data.text === 'My Notes') {
        btn.addEventListener('click', () => {
            navPanel.style.display = 'none';
            notesHost.style.display = 'block';
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
    /* Small Box Mode styles */
    .small-box-mode td {
        height: 28px !important;
        padding: 2px !important;
    }
    .small-box-mode .display-link {
        font-size: 9px !important;
    }
    .small-box-mode .cell-input {
        font-size: 8px !important;
        padding: 1px !important;
    }
    .small-box-mode .btn-color-picker {
        font-size: 8px !important;
    }
</style>
<div class="header">
    <label>
        <input type="checkbox" id="mode-toggle"> Edit Mode
    </label>
    <label style="margin-left: 15px;">
        <input type="checkbox" id="drag-toggle"> Drag Mode
    </label>
    <label style="margin-left: 15px;">
        <input type="checkbox" id="small-box-toggle"> Small Box Mode
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
let isSmallBoxMode = false;

function saveUrls() {
    chrome.storage.local.set({ myUrlsData });
}

// --- MY NOTES PANEL (Option 3) ---
notesHost = document.createElement('div');
notesHost.id = 'floating-notes-host';
Object.assign(notesHost.style, {
    position: 'fixed', bottom: '90px', right: '20px', width: '768px', height: '576px',
    zIndex: '2147483647', display: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    borderRadius: '16px', overflow: 'hidden', backgroundColor: '#f1f5f9'
});
const notesRoot = notesHost.attachShadow({ mode: 'open' });

notesRoot.innerHTML = `
<style>
    :host {
        display: block; width: 100%; height: 100%; background: #f1f5f9; color: #1e293b;
        font-family: system-ui, -apple-system, sans-serif; box-sizing: border-box; position: relative;
    }
    * { box-sizing: inherit; }
    .notes-container { display: flex; flex-direction: column; height: 100%; }
    .header { padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; background: #ffffff; border-bottom: 1px solid #cbd5e1; gap: 8px; }
    
    .header-left { display: flex; align-items: center; gap: 8px; }
    .doc-title-input { font-size: 14px; font-weight: bold; border: 1px solid transparent; padding: 4px 8px; border-radius: 4px; width: 220px; font-family: inherit; }
    .doc-title-input:hover { border-color: #cbd5e1; }
    .doc-title-input:focus { border-color: #2563eb; outline: none; background: #fff; }
    
    .header-actions { display: flex; align-items: center; gap: 6px; }
    .theme-select { font-size: 11px; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; background: white; cursor: pointer; }
    .header-btn { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; }
    .header-btn:hover { background: #cbd5e1; }

    /* Main Layout with Sidebar File Manager */
    .notes-main-layout { display: flex; flex: 1; overflow: hidden; }
    
    .notes-sidebar {
        width: 200px;
        background: #f8fafc;
        border-right: 1px solid #cbd5e1;
        display: flex;
        flex-direction: column;
        padding: 12px;
        gap: 12px;
        overflow-y: auto;
    }
    
    .new-doc-btn {
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 8px 12px;
        font-weight: bold;
        cursor: pointer;
        font-size: 13px;
        text-align: center;
        transition: background 0.15s;
    }
    .new-doc-btn:hover { background: #1d4ed8; }
    
    .notes-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1;
        overflow-y: auto;
    }
    
    .note-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        cursor: pointer;
        transition: border-color 0.15s, background-color 0.15s;
    }
    .note-item:hover { background: #f1f5f9; border-color: #cbd5e1; }
    .note-item.active { background: #e2e8f0; border-color: #94a3b8; }
    
    .note-item-info { display: flex; flex-direction: column; gap: 2px; flex: 1; overflow: hidden; }
    .note-item-title { font-size: 12px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #1e293b; }
    .note-item-date { font-size: 10px; color: #64748b; }
    
    .note-item-delete {
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.15s, background 0.15s;
    }
    .note-item-delete:hover { color: #ef4444; background: #fee2e2; }
    
    .notes-editor-area { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
    
    .toolbar { display: flex; flex-wrap: wrap; gap: 4px; padding: 6px 12px; background: #f8fafc; border-bottom: 1px solid #cbd5e1; align-items: center; }
    .toolbar-group { display: flex; align-items: center; gap: 2px; border-right: 1px solid #cbd5e1; padding-right: 4px; margin-right: 2px; }
    .toolbar-btn { background: transparent; border: none; padding: 4px 6px; cursor: pointer; border-radius: 4px; font-size: 13px; display: flex; align-items: center; justify-content: center; min-width: 24px; min-height: 24px; color: #475569; }
    .toolbar-btn:hover { background: #e2e8f0; color: #0f172a; }
    .toolbar-btn.active { background: #cbd5e1; color: #0f172a; }
    
    .toolbar-select { font-size: 11px; padding: 2px 4px; border: 1px solid #cbd5e1; border-radius: 4px; background: white; cursor: pointer; }
    
    .editor-wrapper { flex: 1; overflow-y: auto; padding: 20px; display: flex; justify-content: center; transition: background 0.2s; }
    .editor-page {
        width: 100%; max-width: 700px; min-height: 420px; background: #ffffff; padding: 40px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
        outline: none; box-sizing: border-box; border-radius: 2px; line-height: 1.6; font-size: 14px;
        transition: background-color 0.2s, color 0.2s;
    }
    .editor-page table { border-collapse: collapse; width: 100%; margin: 12px 0; border: none; }
    .editor-page th, .editor-page td { border: 1px solid #cbd5e1; padding: 8px; vertical-align: top; }
    .editor-page img { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; }
    .editor-page a { cursor: pointer; }
    
    .footer { padding: 4px 12px; display: flex; justify-content: space-between; align-items: center; background: #ffffff; border-top: 1px solid #cbd5e1; font-size: 11px; color: #64748b; }

    /* Theme Styles */
    .theme-light .editor-wrapper { background: #f1f5f9; }
    .theme-light .editor-page { background: #ffffff; color: #1e293b; }
    
    .theme-dark .editor-wrapper { background: #0f172a; }
    .theme-dark .editor-page { background: #1e293b; color: #f8fafc; }
    
    .theme-sepia .editor-wrapper { background: #fcf6e8; }
    .theme-sepia .editor-page { background: #f4ecd8; color: #433422; }
    
    .theme-ocean .editor-wrapper { background: #e0f2fe; }
    .theme-ocean .editor-page { background: #ffffff; color: #0369a1; }
    
    /* Visual Insert Dropdown Styles */
    .insert-menu-container { position: relative; display: inline-block; }
    .dropdown-panel {
        display: none; position: absolute; top: 100%; left: 0; background: white;
        border: 1px solid #cbd5e1; border-radius: 6px; box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        z-index: 1000; width: 280px; padding: 12px; font-family: inherit; font-size: 13px; color: #1e293b;
        text-align: left;
    }
    .dropdown-panel-title { font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center; }
    
    /* Table sub-panel grid style */
    .grid-container { display: grid; grid-template-columns: repeat(5, 24px); gap: 4px; margin-bottom: 8px; justify-content: center; }
    .grid-square { width: 24px; height: 24px; border: 1px solid #cbd5e1; border-radius: 3px; cursor: pointer; transition: background 0.15s; }
    .grid-square.highlighted { background: #3b82f6; border-color: #2563eb; }
    
    /* Divider styles */
    .divider-option { display: flex; align-items: center; justify-content: space-between; padding: 6px; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 4px; cursor: pointer; transition: background 0.15s; }
    .divider-option:hover { background: #f1f5f9; }
    
    /* Borders styles */
    .borders-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 8px; }
    .border-toggle-btn { background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 500; text-align: center; color: #1e293b; }
    .border-toggle-btn:hover { background: #e2e8f0; }
    .border-toggle-btn.active { background: #2563eb; color: white; border-color: #1d4ed8; }
    
    /* Thickness options styles */
    .thickness-option { display: flex; align-items: center; justify-content: space-between; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; margin-bottom: 4px; cursor: pointer; }
    .thickness-option:hover { background: #f1f5f9; }
    .thickness-option.active { border-color: #2563eb; background: #eff6ff; }
    
    /* Padding selector buttons */
    .padding-option-btn { background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 4px; cursor: pointer; text-align: center; flex: 1; font-size: 11px; color: #1e293b; }
    .padding-option-btn:hover { background: #e2e8f0; }

    /* Context Menu Styles */
    .context-menu {
        background: white;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        width: 260px;
        font-family: inherit;
        font-size: 12px;
        color: #1e293b;
        overflow: hidden;
    }
    .context-menu-item {
        padding: 8px 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background 0.15s;
    }
    .context-menu-item:hover {
        background: #f1f5f9;
    }
</style>
<div class="notes-container theme-light" id="notes-container">
    <div class="header">
        <div class="header-left">
            <span style="font-size: 14px; font-weight: bold; color: #475569;">📄 My Notes</span>
            <input type="text" class="doc-title-input" id="doc-title-input" value="Untitled Document" placeholder="Document Title">
        </div>
        
        <div class="header-actions">
            <select class="theme-select" id="theme-select" title="Select Theme">
                <option value="light">☀️ Light</option>
                <option value="dark">🌙 Dark</option>
                <option value="sepia">📜 Sepia</option>
                <option value="ocean">🌊 Ocean</option>
            </select>
            <button class="header-btn" id="btn-print-note" title="Print Document">🖨️ Print</button>
            <button class="header-btn" id="btn-share-clipboard" title="Copy to Clipboard">📋 Copy</button>
            <select class="theme-select" id="export-format-select" title="Export Note" style="font-size: 11px; padding: 4px 8px; border: 1px solid #2563eb; border-radius: 4px; font-weight: bold; background: #2563eb; color: white; cursor: pointer; outline: none; height: 26px;">
                <option value="" disabled selected>💾 Export</option>
                <option value="html">HTML</option>
                <option value="docx">DOCX</option>
                <option value="pdf">PDF</option>
                <option value="txt">TXT</option>
                <option value="rtf">RTF</option>
                <option value="mhtml">MHTML</option>
                <option value="md">Markdown (.md)</option>
            </select>
            <button class="header-btn" id="btn-fullscreen-toggle" title="Maximize Window">⛶ Full Screen</button>
            <a href="#" id="link-close-notes" style="font-size: 12px; color: #2563eb; text-decoration: none; font-weight: bold; margin-left: 8px;">Close</a>
        </div>
    </div>
    
    <div class="notes-main-layout">
        <!-- Sidebar File Manager -->
        <div class="notes-sidebar">
            <button class="new-doc-btn" id="btn-new-note-sidebar">+ New Note</button>
            <button class="header-btn" id="btn-local-folder-trigger" style="width: 100%; font-size: 11px; margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 4px;" title="Open files using File Explorer">
                <svg viewBox="0 0 24 24" width="14" height="14" style="vertical-align: middle;"><path fill="#eab308" d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/><rect x="4" y="8" width="16" height="10" fill="#0284c7" rx="1"/></svg>
                Explorer
            </button>
            
            <div id="google-account-status" style="font-size: 10px; color: #64748b; text-align: center; margin-top: 6px; display: flex; flex-direction: column; gap: 2px;">
                <span>Not signed in</span>
                <a href="#" id="btn-google-signin-trigger" style="color: #2563eb; text-decoration: underline; cursor: pointer;">Sign In</a>
            </div>
            
            <button class="header-btn" id="btn-google-drive-trigger" style="width: 100%; font-size: 11px; margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 4px;" title="Open files using Google Drive">
                <svg viewBox="0 0 24 24" width="14" height="14" style="vertical-align: middle;"><path fill="#4285F4" d="M19.37 13.55L14.73 5.5h-5.46l4.63 8.05z"/><path fill="#34A853" d="M9.27 5.5H3.8l4.64 8.05h5.47z"/><path fill="#FBBC05" d="M8.44 13.55L3 23h5.45l5.47-9.45z"/><path fill="#EA4335" d="M19.37 13.55H8.44l-2.73 4.72h10.93z"/></svg>
                Google Drive
            </button>
            <input type="file" id="file-import-input" style="display: none;">
            <input type="file" id="image-insert-input" accept="image/*" style="display: none;">
            <div class="notes-list" id="notes-list"></div>
        </div>
        
        <!-- Context Menu Overlay -->
        <div id="notes-context-menu" class="context-menu" style="display: none; position: fixed; z-index: 99999;">
            <div id="ctx-file-path-header" style="font-size: 10px; color: #64748b; background: #f1f5f9; padding: 8px 12px; border-bottom: 1px solid #cbd5e1; word-break: break-all; font-family: monospace; line-height: 1.4;">
                📁 Path
            </div>
            <div style="display: flex; flex-direction: column;">
                <div class="context-menu-item" id="ctx-opt-copy-path">📋 Copy Path</div>
                <div class="context-menu-item" id="ctx-opt-save-as">💾 Save As...</div>
                <div class="context-menu-item" id="ctx-opt-rename">✏️ Rename</div>
                <div class="context-menu-item" id="ctx-opt-duplicate">👯 Duplicate</div>
                <div class="context-menu-item" id="ctx-opt-delete" style="color: #ef4444;">❌ Delete</div>
            </div>
        </div>
        
        <!-- Google Drive Picker Modal -->
        <div id="drive-modal-overlay" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 99999; align-items: center; justify-content: center;">
            <div style="background: white; border-radius: 8px; width: 480px; max-height: 80%; display: flex; flex-direction: column; box-shadow: 0 10px 25px rgba(0,0,0,0.2); overflow: hidden;">
                <div style="background: #2563eb; color: white; padding: 12px 16px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
                    <span style="display: flex; align-items: center; gap: 4px;">
                        <svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align: middle;"><path fill="#ffffff" d="M19.37 13.55L14.73 5.5h-5.46l4.63 8.05z"/><path fill="#ffffff" d="M9.27 5.5H3.8l4.64 8.05h5.47z"/><path fill="#ffffff" d="M8.44 13.55L3 23h5.45l5.47-9.45z"/><path fill="#ffffff" d="M19.37 13.55H8.44l-2.73 4.72h10.93z"/></svg>
                        Google Drive (<span id="drive-email-val">owner@gmail.com</span>)
                        <a href="#" id="btn-change-drive-email" style="color: #93c5fd; font-size: 11px; text-decoration: underline; margin-left: 6px; cursor: pointer;">[Change]</a>
                    </span>
                    <button id="close-drive-modal" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; font-weight: bold; padding: 0 4px; line-height: 1;">&times;</button>
                </div>
                <div style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #64748b; font-weight: bold;">
                    Select a document to edit:
                </div>
                <div id="drive-file-list" style="flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 4px; max-height: 350px;">
                    <!-- Files list dynamic -->
                </div>
            </div>
        </div>
        
        <!-- Google Sign-In Form Modal -->
        <div id="signin-modal-overlay" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 100000; align-items: center; justify-content: center;">
            <div style="background: white; border-radius: 8px; width: 360px; padding: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); display: flex; flex-direction: column; gap: 12px; font-family: inherit;">
                <div style="font-weight: bold; font-size: 14px; text-align: center; color: #1e293b;">Sign In with Google</div>
                <div style="font-size: 11px; color: #64748b; text-align: center; line-height: 1.4;">Enter your Google Account email to authenticate and sync your notes.</div>
                <input type="email" id="signin-email-input" placeholder="example@gmail.com" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; box-sizing: border-box;">
                
                <div style="font-size: 11px; color: #64748b; font-weight: bold; margin-top: 4px; text-align: left;">OAuth Access Token (Optional for manual override):</div>
                <input type="password" id="signin-token-input" placeholder="ya29.a0Acv..." style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; box-sizing: border-box;">
                
                <button class="new-doc-btn" id="btn-signin-submit" style="width: 100%; background: #2563eb; color: white; padding: 8px; font-weight: bold; border-radius: 4px; border: none; cursor: pointer; font-size: 12px;">Authenticate & Sign In</button>
                <button id="btn-signin-cancel" style="background: none; border: none; color: #64748b; font-size: 11px; cursor: pointer; text-decoration: underline; align-self: center;">Cancel</button>
            </div>
        </div>
        
        <!-- Editor Area -->
        <div class="notes-editor-area">
            <div class="toolbar">
                <div class="toolbar-group">
                    <select class="toolbar-select" id="font-family-select" title="Font Family">
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="Verdana, sans-serif">Verdana</option>
                        <option value="Courier New, monospace">Courier</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="Impact, sans-serif">Impact</option>
                        <option value="Times New Roman, serif">Times</option>
                        <option value="'Comic Sans MS', 'Comic Sans', cursive">Comic Sans</option>
                    </select>
                    <select class="toolbar-select" id="font-size-select" title="Font Size">
                        <option value="3">12px</option>
                        <option value="1">8px</option>
                        <option value="2">10px</option>
                        <option value="4">14px</option>
                        <option value="5">18px</option>
                        <option value="6">24px</option>
                        <option value="7">36px</option>
                    </select>
                </div>
                
                <div class="toolbar-group">
                    <button class="toolbar-btn" id="btn-bold" title="Bold" data-cmd="bold"><b>B</b></button>
                    <button class="toolbar-btn" id="btn-italic" title="Italic" data-cmd="italic"><i>I</i></button>
                    <button class="toolbar-btn" id="btn-underline" title="Underline" data-cmd="underline"><u>U</u></button>
                    <button class="toolbar-btn" id="btn-strike" title="Strikethrough" data-cmd="strikeThrough"><s>S</s></button>
                </div>
                
                <div class="toolbar-group" style="gap: 6px;">
                    <div style="display: flex; align-items: center; gap: 2px;">
                        <span style="font-size: 11px; font-weight: bold; color: #64748b;">A</span>
                        <input type="color" id="note-fg-color" title="Text Color" style="width: 20px; height: 20px; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; padding: 0; background: transparent;" value="#1e293b">
                    </div>
                    <div style="display: flex; align-items: center; gap: 2px;">
                        <span style="font-size: 11px; font-weight: bold; color: #64748b;">✏️</span>
                        <input type="color" id="note-bg-color" title="Highlight Color" style="width: 20px; height: 20px; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; padding: 0; background: transparent;" value="#ffffff">
                    </div>
                </div>
                
                <div class="toolbar-group">
                    <button class="toolbar-btn" id="btn-align-left" title="Align Left" data-cmd="justifyLeft"> Align L</button>
                    <button class="toolbar-btn" id="btn-align-center" title="Align Center" data-cmd="justifyCenter"> Align C</button>
                    <button class="toolbar-btn" id="btn-align-right" title="Align Right" data-cmd="justifyRight"> Align R</button>
                </div>
                
                <div class="toolbar-group">
                    <div class="insert-menu-container">
                        <button class="header-btn" id="btn-insert-dropdown" style="font-weight: bold; background: #cbd5e1; color: #0f172a; display: flex; align-items: center; gap: 4px; height: 26px; font-size: 11px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                            ➕ Insert <span style="font-size: 8px;">▼</span>
                        </button>
                        <div id="insert-menu-dropdown" class="dropdown-panel">
                            <!-- Graphical Menu Rendered in Javascript -->
                        </div>
                    </div>
                </div>
                
                <div class="toolbar-group">
                    <button class="toolbar-btn" id="btn-list-bullet" title="Bulleted List" data-cmd="insertUnorderedList">• List</button>
                    <button class="toolbar-btn" id="btn-list-number" title="Numbered List" data-cmd="insertOrderedList">1. List</button>
                </div>
                
                <button class="toolbar-btn" id="btn-clear-format" title="Clear Formatting" data-cmd="removeFormat">Tx</button>
            </div>
            
            <div class="editor-wrapper" id="editor-wrapper">
                <div class="editor-page" id="editor-page" contenteditable="true">
                    <div>Start writing your notes here...</div>
                </div>
            </div>
            
            <div class="footer">
                <div>Words: <span id="word-count">0</span> | Characters: <span id="char-count">0</span></div>
                <div id="save-status">All changes saved locally</div>
            </div>
        </div>
    </div>
</div>
`;

let myNotesData = {
    currentNoteId: '',
    notes: {}
};

let autoSaveTimeout = null;

function parseRTF(rtfText) {
    let clean = rtfText;
    clean = clean.replace(/\\rtf1[\s\S]*?\\deflang\d+/, '');
    clean = clean.replace(/\\fonttbl[\s\S]*?\\colortbl[\s\S]*?\\stylesheet[\s\S]*?\\info[\s\S]*?\}/g, '');
    clean = clean.replace(/\\b\s+([\s\S]*?)\\b0/g, '<strong>$1</strong>');
    clean = clean.replace(/\\b\s+([\s\S]*?)(?=\\[a-z]|$)/g, '<strong>$1</strong>');
    clean = clean.replace(/\\i\s+([\s\S]*?)\\i0/g, '<em>$1</em>');
    clean = clean.replace(/\\par\s*/g, '<br>');
    clean = clean.replace(/\\[a-z-]+\d*\s*/g, '');
    clean = clean.replace(/[\{\}]/g, '');
    return clean.trim();
}

async function unzipDocx(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    let offset = 0;
    
    while (offset < arrayBuffer.byteLength - 30) {
        const sig = view.getUint32(offset, true);
        if (sig === 0x04034b50) { // Local file header signature
            const compression = view.getUint16(offset + 8, true);
            const compressedSize = view.getUint32(offset + 18, true);
            const uncompressedSize = view.getUint32(offset + 22, true);
            const fileNameLength = view.getUint16(offset + 26, true);
            const extraFieldLength = view.getUint16(offset + 28, true);
            
            const fileNameBytes = new Uint8Array(arrayBuffer, offset + 30, fileNameLength);
            const fileName = new TextDecoder().decode(fileNameBytes);
            
            const dataOffset = offset + 30 + fileNameLength + extraFieldLength;
            
            if (fileName === 'word/document.xml') {
                const compressedData = new Uint8Array(arrayBuffer, dataOffset, compressedSize);
                
                if (compression === 0) { // Uncompressed
                    return new TextDecoder().decode(compressedData);
                } else if (compression === 8) { // Deflate
                    const ds = new DecompressionStream('deflate-raw');
                    const writer = ds.writable.getWriter();
                    writer.write(compressedData);
                    writer.close();
                    
                    const response = new Response(ds.readable);
                    const decompressedBuffer = await response.arrayBuffer();
                    return new TextDecoder().decode(decompressedBuffer);
                }
            }
            offset = dataOffset + compressedSize;
        } else {
            offset++;
        }
    }
    throw new Error("word/document.xml not found in docx structure");
}

function parseDocxXML(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");
    const bodyNode = xmlDoc.getElementsByTagName("w:body")[0];
    if (!bodyNode) return "<div>Empty Document</div>";
    
    return parseNodes(bodyNode);
}

function parseNodes(parentNode) {
    let html = "";
    const children = parentNode.childNodes;
    
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        const localName = node.localName;
        
        if (localName === "p") {
            const pHTML = parseRuns(node);
            if (pHTML) {
                html += `<div>${pHTML}</div>`;
            } else {
                html += `<div><br></div>`;
            }
        } else if (localName === "tbl") {
            html += parseTable(node);
        } else {
            if (node.hasChildNodes()) {
                html += parseNodes(node);
            }
        }
    }
    return html;
}

function parseRuns(pNode) {
    let pHTML = "";
    const runs = pNode.getElementsByTagName("w:r");
    for (let j = 0; j < runs.length; j++) {
        const r = runs[j];
        let textVal = "";
        const tTags = r.getElementsByTagName("w:t");
        for (let k = 0; k < tTags.length; k++) {
            textVal += tTags[k].textContent;
        }
        
        if (textVal) {
            const isBold = r.getElementsByTagName("w:b").length > 0;
            const isItalic = r.getElementsByTagName("w:i").length > 0;
            
            let formatted = textVal;
            if (isBold) formatted = `<strong>${formatted}</strong>`;
            if (isItalic) formatted = `<em>${formatted}</em>`;
            pHTML += formatted;
        }
    }
    return pHTML;
}

function parseTable(tblNode) {
    let tblHTML = `<table style="border-collapse: collapse; width: 100%; border: 1px solid #cbd5e1; margin: 12px 0;">`;
    const children = tblNode.childNodes;
    for (let i = 0; i < children.length; i++) {
        const row = children[i];
        if (row.localName === "tr") {
            tblHTML += `<tr>`;
            const rowChildren = row.childNodes;
            for (let j = 0; j < rowChildren.length; j++) {
                const cell = rowChildren[j];
                if (cell.localName === "tc") {
                    tblHTML += `<td style="border: 1px solid #cbd5e1; padding: 8px; vertical-align: top;">`;
                    tblHTML += parseNodes(cell);
                    tblHTML += `</td>`;
                }
            }
            tblHTML += `</tr>`;
        }
    }
    tblHTML += `</table>`;
    return tblHTML;
}

function parseMarkdownToHTML(md) {
    let html = md;
    html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold / Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Unordered Lists
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/sg, '<ul>$1</ul>');
    
    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color: #2563eb; text-decoration: underline;">$1</a>');
    
    // Tables
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = "";
    let finalLines = [];
    
    for (let line of lines) {
        if (line.trim().startsWith('|')) {
            if (!inTable) {
                inTable = true;
                tableHtml = `<table style="border-collapse: collapse; width: 100%; border: none; margin: 12px 0;">`;
            }
            const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
            if (line.includes('---')) {
                // skip separator line
                continue;
            }
            tableHtml += `<tr>`;
            for (let cell of cells) {
                tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 8px; vertical-align: top;">${cell}</td>`;
            }
            tableHtml += `</tr>`;
        } else {
            if (inTable) {
                inTable = false;
                tableHtml += `</table>`;
                finalLines.push(tableHtml);
            }
            finalLines.push(line);
        }
    }
    if (inTable) {
        tableHtml += `</table>`;
        finalLines.push(tableHtml);
    }
    html = finalLines.join('\n');
    
    // Paragraphs
    html = html.split(/\n\n+/).map(p => {
        if (!p.trim().startsWith('<h') && !p.trim().startsWith('<ul') && !p.trim().startsWith('<li') && !p.trim().startsWith('<table') && p.trim()) {
            return `<p>${p.replace(/\n/g, '<br>')}</p>`;
        }
        return p;
    }).join('\n');
    
    return `<div>${html}</div>`;
}

function convertHTMLToMarkdown(html) {
    let temp = document.createElement('div');
    temp.innerHTML = html;
    
    function nodeToMarkdown(node) {
        if (node.nodeType === 3) {
            return node.nodeValue;
        }
        if (node.nodeType === 1) {
            let text = "";
            for (let child of node.childNodes) {
                text += nodeToMarkdown(child);
            }
            const tag = node.nodeName;
            if (tag === 'H1') return `\n# ${text.trim()}\n`;
            if (tag === 'H2') return `\n## ${text.trim()}\n`;
            if (tag === 'H3') return `\n### ${text.trim()}\n`;
            if (tag === 'P') return `\n${text.trim()}\n`;
            if (tag === 'BR') return `\n`;
            if (tag === 'B' || tag === 'STRONG') return `**${text}**`;
            if (tag === 'I' || tag === 'EM') return `*${text}*`;
            if (tag === 'A') {
                const href = node.getAttribute('href') || '#';
                return `[${text}](${href})`;
            }
            if (tag === 'LI') return `- ${text.trim()}\n`;
            if (tag === 'UL') return `\n${text}\n`;
            if (tag === 'TR') {
                let cells = [];
                for (let cell of node.children) {
                    cells.push(nodeToMarkdown(cell).trim().replace(/\n/g, ' '));
                }
                return `| ${cells.join(' | ')} |\n`;
            }
            if (tag === 'TABLE') {
                let rows = [];
                for (let child of node.childNodes) {
                    if (child.nodeName === 'TR') {
                        rows.push(nodeToMarkdown(child));
                    } else {
                        for (let tr of child.childNodes) {
                            if (tr.nodeName === 'TR') {
                                rows.push(nodeToMarkdown(tr));
                            }
                        }
                    }
                }
                if (rows.length > 0) {
                    const firstRowCells = rows[0].split('|').length - 2;
                    if (firstRowCells > 0) {
                        let separator = `|${' --- |'.repeat(firstRowCells)}\n`;
                        rows.splice(1, 0, separator);
                    }
                    return `\n${rows.join('')}\n`;
                }
                return "";
            }
            if (tag === 'DIV') return `\n${text}\n`;
            return text;
        }
        return "";
    }
    return nodeToMarkdown(temp).trim().replace(/\n\n+/g, '\n\n');
}

let currentGoogleEmail = null;
let currentGoogleToken = null;

function renderGoogleAccountStatus(email) {
    const statusEl = notesRoot.getElementById('google-account-status');
    if (!statusEl) return;
    
    if (email) {
        statusEl.innerHTML = `
            <span>Account: <strong>${email}</strong></span>
            <a href="#" id="btn-google-signout" style="color: #ef4444; text-decoration: underline; cursor: pointer; font-size: 10px;">Switch Account</a>
        `;
        notesRoot.getElementById('btn-google-signout').addEventListener('click', (e) => {
            e.preventDefault();
            notesRoot.getElementById('signin-modal-overlay').style.display = 'flex';
        });
    } else {
        statusEl.innerHTML = `
            <span>Not signed in</span>
            <a href="#" id="btn-google-signin-trigger" style="color: #2563eb; text-decoration: underline; cursor: pointer; font-size: 10px;">Sign In</a>
        `;
        notesRoot.getElementById('btn-google-signin-trigger').addEventListener('click', (e) => {
            e.preventDefault();
            notesRoot.getElementById('signin-modal-overlay').style.display = 'flex';
        });
    }
}

function setGoogleAccount(email, token = null) {
    const oldEmail = currentGoogleEmail;
    currentGoogleEmail = email;
    currentGoogleToken = token;
    renderGoogleAccountStatus(email);
    
    if (email) {
        chrome.storage.local.set({ signedInEmail: email, manualOAuthToken: token });
        // Update all existing note paths that used the old email (or default)
        const targetOld = oldEmail || 'owner@gmail.com';
        for (let noteId in myNotesData.notes) {
            const note = myNotesData.notes[noteId];
            if (note.googleDriveFileId) {
                if (note.gmail === targetOld) {
                    note.gmail = email;
                }
                note.fullPath = note.fullPath.replace(targetOld, email);
            } else {
                note.fullPath = `G:\\My Drive (${email})\\${note.title}.html`;
            }
        }
        saveNotes();
        renderNotesList();
    } else {
        chrome.storage.local.remove(['signedInEmail', 'manualOAuthToken']);
    }
}

function initGoogleAccount() {
    chrome.storage.local.get(['signedInEmail', 'manualOAuthToken'], function(res) {
        if (res.manualOAuthToken) {
            currentGoogleToken = res.manualOAuthToken;
            notesRoot.getElementById('signin-token-input').value = res.manualOAuthToken;
        }
        if (res.signedInEmail) {
            notesRoot.getElementById('signin-email-input').value = res.signedInEmail;
            setGoogleAccount(res.signedInEmail, res.manualOAuthToken || null);
        } else if (typeof chrome !== 'undefined' && chrome.identity && chrome.identity.getProfileUserInfo) {
            chrome.identity.getProfileUserInfo({ accountStatus: 'ANY' }, function(userInfo) {
                if (userInfo && userInfo.email) {
                    setGoogleAccount(userInfo.email, res.manualOAuthToken || null);
                } else {
                    renderGoogleAccountStatus(null);
                }
            });
        } else {
            renderGoogleAccountStatus(null);
        }
    });
}

function saveNotes() {
    chrome.storage.local.set({ myNotesData });
    const status = notesRoot.getElementById('save-status');
    if (status) {
        const curId = myNotesData.currentNoteId;
        const note = (curId && myNotesData.notes[curId]) ? myNotesData.notes[curId] : null;
        if (note && note.googleDriveFileId) {
            status.innerText = `Saved locally & synced to Google Drive (${note.gmail || currentGoogleEmail || 'owner@gmail.com'})`;
        } else {
            status.innerText = 'All changes saved locally';
        }
    }
}

function triggerAutoSave() {
    const status = notesRoot.getElementById('save-status');
    if (status) status.innerText = 'Saving...';
    
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        const curId = myNotesData.currentNoteId;
        if (curId && myNotesData.notes[curId]) {
            myNotesData.notes[curId].title = notesRoot.getElementById('doc-title-input').value;
            myNotesData.notes[curId].content = notesRoot.getElementById('editor-page').innerHTML;
            myNotesData.notes[curId].theme = notesRoot.getElementById('theme-select').value;
            myNotesData.notes[curId].lastModified = Date.now();
            
            // If it is a Google Drive document, update its simulated/real path as well
            const activeEmail = currentGoogleEmail || 'owner@gmail.com';
            if (myNotesData.notes[curId].googleDriveFileId) {
                const gmail = myNotesData.notes[curId].gmail || activeEmail;
                const folderPath = myNotesData.notes[curId].folderPath || '\\My Drive';
                myNotesData.notes[curId].fullPath = `${gmail}:${folderPath}\\${myNotesData.notes[curId].title}`;
                if (!myNotesData.notes[curId].fullPath.endsWith('.md') && !myNotesData.notes[curId].fullPath.endsWith('.txt') && !myNotesData.notes[curId].fullPath.endsWith('.docx') && !myNotesData.notes[curId].fullPath.endsWith('.html')) {
                    myNotesData.notes[curId].fullPath += '.html';
                }
                
                if (currentGoogleToken) {
                    const fileId = myNotesData.notes[curId].googleDriveFileId;
                    const fileTitle = myNotesData.notes[curId].title;
                    const isMd = fileTitle.endsWith('.md') || myNotesData.notes[curId].fullPath.endsWith('.md');
                    let contentToUpload = myNotesData.notes[curId].content;
                    if (isMd) {
                        contentToUpload = convertHTMLToMarkdown(contentToUpload);
                    }
                    
                    fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': 'Bearer ' + currentGoogleToken,
                            'Content-Type': isMd ? 'text/markdown' : 'text/html'
                        },
                        body: contentToUpload
                    })
                    .then(r => {
                        if (r.status === 401) {
                            handleAuthFailure();
                        } else if (r.ok) {
                            console.log("Successfully synced note to Google Drive");
                        }
                    })
                    .catch(err => console.error("Drive sync failed:", err));
                }
            } else {
                myNotesData.notes[curId].fullPath = `G:\\My Drive (${activeEmail})\\${myNotesData.notes[curId].title}.html`;
            }
            
            saveNotes();
        }
        renderNotesList();
    }, 1000);
}

function createBlankNote(title = 'Untitled Note') {
    const id = 'note-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const activeEmail = currentGoogleEmail || 'owner@gmail.com';
    myNotesData.notes[id] = {
        id,
        title,
        content: '<div>Start writing your notes here...</div>',
        theme: 'light',
        lastModified: Date.now(),
        fullPath: `G:\\My Drive (${activeEmail})\\${title}.html`
    };
    myNotesData.currentNoteId = id;
    saveNotes();
    loadNote(id);
    renderNotesList();
}

function loadNote(id) {
    if (!id || !myNotesData.notes[id]) return;
    myNotesData.currentNoteId = id;
    
    const note = myNotesData.notes[id];
    notesRoot.getElementById('doc-title-input').value = note.title;
    notesRoot.getElementById('editor-page').innerHTML = note.content;
    notesRoot.getElementById('theme-select').value = note.theme || 'light';
    
    const container = notesRoot.getElementById('notes-container');
    container.className = `notes-container theme-${note.theme || 'light'}`;
    
    updateWordAndCharCount();
    
    notesRoot.querySelectorAll('.note-item').forEach(el => {
        if (el.dataset.id === id) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
}

async function parsePDF(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    const textDecoder = new TextDecoder('utf-8');
    let fullText = "";
    
    let offset = 0;
    const streamSig = new TextEncoder().encode("stream\r\n");
    const streamSig2 = new TextEncoder().encode("stream\n");
    const endStreamSig = new TextEncoder().encode("endstream");
    
    function findBytes(pattern, startOffset) {
        for (let i = startOffset; i < bytes.length - pattern.length; i++) {
            let match = true;
            for (let j = 0; j < pattern.length; j++) {
                if (bytes[i + j] !== pattern[j]) {
                    match = false;
                    break;
                }
            }
            if (match) return i;
        }
        return -1;
    }
    
    while (true) {
        let start = findBytes(streamSig, offset);
        let sigLen = streamSig.length;
        if (start === -1) {
            start = findBytes(streamSig2, offset);
            sigLen = streamSig2.length;
        }
        if (start === -1) break;
        
        const end = findBytes(endStreamSig, start + sigLen);
        if (end === -1) break;
        
        const streamData = bytes.slice(start + sigLen, end);
        offset = end + endStreamSig.length;
        
        const headerStart = Math.max(0, start - 200);
        const headerText = textDecoder.decode(bytes.slice(headerStart, start));
        
        if (headerText.includes("/FlateDecode") || headerText.includes("/Fl")) {
            try {
                const ds = new DecompressionStream('deflate');
                const writer = ds.writable.getWriter();
                writer.write(streamData);
                writer.close();
                
                const response = new Response(ds.readable);
                const decompressed = await response.arrayBuffer();
                const decompressedText = new TextDecoder('latin1').decode(decompressed);
                
                const textBlocks = decompressedText.match(/BT[\s\S]*?ET/g);
                if (textBlocks) {
                    for (const block of textBlocks) {
                        const regex = /\(([^)]*)\)/g;
                        let match;
                        let blockText = "";
                        while ((match = regex.exec(block)) !== null) {
                            blockText += match[1];
                        }
                        if (blockText.trim()) {
                            fullText += `<div>${blockText.replace(/\\(.)/g, '$1')}</div>`;
                        }
                    }
                }
            } catch (e) {
                // Ignore non-deflate streams or decryption errors
            }
        }
    }
    
    return fullText || "<div>[Parsed PDF - No text runs found]</div>";
}

async function convertLocalFileToNote(name, file) {
    let content = '';
    try {
        if (name.endsWith('.docx')) {
            const arrayBuffer = await file.arrayBuffer();
            const xmlText = await unzipDocx(arrayBuffer);
            content = parseDocxXML(xmlText);
        } else if (name.endsWith('.pdf')) {
            const arrayBuffer = await file.arrayBuffer();
            content = await parsePDF(arrayBuffer);
        } else {
            const text = await file.text();
            if (name.endsWith('.html')) {
                content = text;
            } else if (name.endsWith('.rtf')) {
                content = parseRTF(text);
            } else if (name.endsWith('.md')) {
                content = parseMarkdownToHTML(text);
            } else {
                content = `<div>${text.replace(/\n/g, '<br>')}</div>`;
            }
        }
        
        const noteTitle = name.substring(0, name.lastIndexOf('.')) || name;
        const id = 'note-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        
        myNotesData.notes[id] = {
            id,
            title: noteTitle,
            content: content,
            theme: 'light',
            lastModified: Date.now(),
            fullPath: `G:\\My Drive (owner@gmail.com)\\${name}`
        };
        myNotesData.currentNoteId = id;
        saveNotes();
        loadNote(id);
        renderNotesList();
        
        const status = notesRoot.getElementById('save-status');
        if (status) {
            status.innerText = `Converted '${name}' to editable Note`;
        }
    } catch (err) {
        console.error("Failed to convert file:", err);
        alert(`Failed to convert and import file: ${name}`);
    }
}

function createNoteItemElement(note) {
    const activeId = myNotesData.currentNoteId;
    const item = document.createElement('div');
    item.className = 'note-item' + (note.id === activeId ? ' active' : '');
    item.setAttribute('data-id', note.id);
    item.addEventListener('click', () => {
        loadNote(note.id);
    });
    
    const info = document.createElement('div');
    info.className = 'note-item-info';
    
    const titleSpan = document.createElement('span');
    titleSpan.className = 'note-item-title';
    titleSpan.innerText = note.title || 'Untitled Note';
    
    const dateSpan = document.createElement('span');
    dateSpan.className = 'note-item-date';
    
    const date = new Date(note.lastModified);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    dateSpan.innerText = `${monthNames[date.getMonth()]} ${date.getDate()}, ${formattedHours}:${minutes} ${ampm}`;
    
    info.appendChild(titleSpan);
    info.appendChild(dateSpan);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'note-item-delete';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = 'Delete Note';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteNoteById(note.id);
    });
    
    item.appendChild(info);
    item.appendChild(deleteBtn);
    return item;
}

function renderNotesList() {
    const listContainer = notesRoot.getElementById('notes-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    
    const extHeader = document.createElement('div');
    extHeader.style.cssText = 'font-size: 11px; font-weight: bold; color: #64748b; margin-top: 8px; margin-bottom: 4px;';
    extHeader.innerText = 'DOCUMENTS';
    listContainer.appendChild(extHeader);
    
    const extNotes = Object.values(myNotesData.notes).sort((a, b) => b.lastModified - a.lastModified);
    extNotes.forEach(note => {
        const item = createNoteItemElement(note);
        listContainer.appendChild(item);
    });
}

function deleteNoteById(id) {
    if (Object.keys(myNotesData.notes).length <= 1) {
        if (confirm('Delete this note? It is your last note, a new blank note will be created.')) {
            delete myNotesData.notes[id];
            createBlankNote();
        }
        return;
    }
    
    if (confirm('Are you sure you want to delete this note?')) {
        delete myNotesData.notes[id];
        if (myNotesData.currentNoteId === id) {
            const nextId = Object.keys(myNotesData.notes)[0];
            myNotesData.currentNoteId = nextId;
            loadNote(nextId);
        }
        saveNotes();
        renderNotesList();
    }
}

function updateWordAndCharCount() {
    const page = notesRoot.getElementById('editor-page');
    if (!page) return;
    const text = page.innerText || '';
    const charCount = text.length;
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    
    notesRoot.getElementById('word-count').innerText = wordCount;
    notesRoot.getElementById('char-count').innerText = charCount;
}

// Attach event listeners
notesRoot.getElementById('btn-new-note-sidebar').addEventListener('click', () => {
    createBlankNote();
});

function insertTableAction() {
    const rows = prompt("Enter number of rows:", "3");
    const cols = prompt("Enter number of columns:", "3");
    if (!rows || !cols || isNaN(rows) || isNaN(cols)) return;
    
    let tableHtml = `<table style="border-collapse: collapse; width: 100%; border: 1px solid #cbd5e1; margin: 12px 0;">`;
    for (let r = 0; r < parseInt(rows); r++) {
        tableHtml += `<tr>`;
        for (let c = 0; c < parseInt(cols); c++) {
            tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 8px; vertical-align: top;"><br></td>`;
        }
        tableHtml += `</tr>`;
    }
    tableHtml += `</table>`;
    
    document.execCommand('insertHTML', false, tableHtml);
    notesRoot.getElementById('editor-page').focus();
    triggerAutoSave();
}

function insertImageAction() {
    const loadLocal = confirm("Do you want to upload a local image file?\n\n(Click 'Cancel' to enter a Web URL instead)");
    if (loadLocal) {
        notesRoot.getElementById('image-insert-input').click();
    } else {
        const url = prompt("Enter Image Web URL:");
        if (url) {
            const imgHtml = `<img src="${url}" style="max-width: 100%; border-radius: 8px; margin: 12px 0;">`;
            document.execCommand('insertHTML', false, imgHtml);
            notesRoot.getElementById('editor-page').focus();
            triggerAutoSave();
        }
    }
}

function insertLineAction() {
    const type = prompt("Enter line type ('solid', 'dashed', 'dotted', 'double'):", "solid");
    if (!type || !['solid', 'dashed', 'dotted', 'double'].includes(type.toLowerCase())) {
        alert("Invalid line type selected.");
        return;
    }
    const thickness = prompt("Enter line thickness (1 to 5):", "2");
    const thickVal = parseInt(thickness);
    if (isNaN(thickVal) || thickVal < 1 || thickVal > 5) {
        alert("Invalid line thickness. Select 1 to 5.");
        return;
    }
    const lineHtml = `<hr style="border: none; border-top: ${thickVal}px ${type.toLowerCase()} #cbd5e1; margin: 16px 0;">`;
    document.execCommand('insertHTML', false, lineHtml);
    notesRoot.getElementById('editor-page').focus();
    triggerAutoSave();
}

function insertLinkAction() {
    const url = prompt("Enter hyperlink URL:", "https://");
    if (url) {
        document.execCommand('createLink', false, url);
        notesRoot.getElementById('editor-page').focus();
        triggerAutoSave();
    }
}

function tableBorderAction() {
    const cell = getActiveCell();
    if (!cell) {
        alert("Place cursor inside a table cell to edit borders.");
        return;
    }
    const sidesInput = prompt("Which borders to turn on? (e.g. 'top,bottom', 'left', 'all', 'none'):", "all");
    if (sidesInput === null) return;
    const sizeInput = prompt("Border size (1, 2, or 3):", "1");
    if (sizeInput === null) return;
    
    const size = parseInt(sizeInput);
    if (isNaN(size) || size < 1 || size > 3) {
        alert("Invalid border size. Select 1, 2, or 3.");
        return;
    }
    
    const sides = sidesInput.toLowerCase().split(',').map(s => s.trim());
    const isAll = sides.includes('all');
    const isNone = sides.includes('none');
    const borderVal = `${size}px solid #cbd5e1`;
    
    if (isNone) {
        cell.style.border = 'none';
    } else {
        if (isAll || sides.includes('top')) cell.style.borderTop = borderVal;
        else cell.style.borderTop = 'none';
        
        if (isAll || sides.includes('bottom')) cell.style.borderBottom = borderVal;
        else cell.style.borderBottom = 'none';
        
        if (isAll || sides.includes('left')) cell.style.borderLeft = borderVal;
        else cell.style.borderLeft = 'none';
        
        if (isAll || sides.includes('right')) cell.style.borderRight = borderVal;
        else cell.style.borderRight = 'none';
    }
    triggerAutoSave();
}

function tablePaddingAction() {
    const cell = getActiveCell();
    if (!cell) {
        alert("Place cursor inside a table cell to edit cell padding.");
        return;
    }
    const table = cell.closest('table');
    if (!table) return;
    const padding = prompt("Enter cell padding (e.g. '4px', '8px', '12px'):", cell.style.padding || "8px");
    if (padding !== null) {
        const cells = table.getElementsByTagName('td');
        for (let i = 0; i < cells.length; i++) {
            cells[i].style.padding = padding;
        }
        triggerAutoSave();
    }
}

const insertDropdown = notesRoot.getElementById('insert-menu-dropdown');

notesRoot.getElementById('btn-insert-dropdown').addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = insertDropdown.style.display === 'block';
    if (!isVisible) {
        insertDropdown.style.display = 'block';
        renderInsertMainMenu();
    } else {
        insertDropdown.style.display = 'none';
    }
});

document.addEventListener('click', () => {
    if (insertDropdown) insertDropdown.style.display = 'none';
});

if (insertDropdown) {
    insertDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

function renderInsertMainMenu() {
    insertDropdown.innerHTML = `
        <div class="dropdown-panel-title">Insert Element</div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
            <button class="border-toggle-btn" id="menu-opt-table" style="text-align: left; width: 100%; display: flex; align-items: center; gap: 8px;">📊 Table Creator & Editor</button>
            <button class="border-toggle-btn" id="menu-opt-image" style="text-align: left; width: 100%; display: flex; align-items: center; gap: 8px;">🖼️ Image Uploader</button>
            <button class="border-toggle-btn" id="menu-opt-line" style="text-align: left; width: 100%; display: flex; align-items: center; gap: 8px;">➖ Divider Line</button>
            <button class="border-toggle-btn" id="menu-opt-link" style="text-align: left; width: 100%; display: flex; align-items: center; gap: 8px;">🔗 Hyperlink</button>
            <button class="border-toggle-btn" id="menu-opt-unlink" style="text-align: left; width: 100%; display: flex; align-items: center; gap: 8px;">🔗 Remove Link</button>
        </div>
    `;
    
    notesRoot.getElementById('menu-opt-table').addEventListener('click', renderTableTool);
    notesRoot.getElementById('menu-opt-image').addEventListener('click', renderImageSelector);
    notesRoot.getElementById('menu-opt-line').addEventListener('click', renderLineSelector);
    notesRoot.getElementById('menu-opt-link').addEventListener('click', renderLinkSelector);
    notesRoot.getElementById('menu-opt-unlink').addEventListener('click', () => {
        restoreSelection();
        document.execCommand('unlink', false, null);
        notesRoot.getElementById('editor-page').focus();
        triggerAutoSave();
        insertDropdown.style.display = 'none';
    });
}

function renderTableTool() {
    const cell = getActiveCell();
    const isEditing = !!cell;
    
    let selectedRows = 0;
    let selectedCols = 0;
    let selectedPadding = "8px";
    let selectedThickness = 1;
    let selectedSides = ['all'];
    
    insertDropdown.innerHTML = `
        <div class="dropdown-panel-title">
            <span>${isEditing ? '📊 Table Editor' : '📊 Create Table'}</span>
            <button id="menu-back" style="background: none; border: none; cursor: pointer; color: #2563eb; font-weight: bold;"><- Back</button>
        </div>
        
        ${!isEditing ? `
            <div id="table-dimensions-label" style="font-weight: 500; font-size: 11px; color: #64748b; margin-bottom: 8px; text-align: center;">Click grid to select size: 0 x 0</div>
            <div class="grid-container" id="grid-container"></div>
        ` : ''}
        
        <div style="font-size: 11px; font-weight: bold; color: #64748b; margin-top: 8px; margin-bottom: 6px;">1. Cell Padding</div>
        <div style="display: flex; gap: 4px; margin-bottom: 8px;">
            <button class="padding-option-btn" id="pad-compact" data-pad="4px" style="padding: 4px 6px;">Compact (4px)</button>
            <button class="padding-option-btn active" id="pad-normal" data-pad="8px" style="padding: 4px 6px;">Normal (8px)</button>
            <button class="padding-option-btn" id="pad-spacious" data-pad="16px" style="padding: 4px 6px;">Spacious (16)</button>
        </div>
        
        <div style="font-size: 11px; font-weight: bold; color: #64748b; margin-bottom: 6px;">2. Toggle Border Side</div>
        <div class="borders-grid" style="margin-bottom: 8px;">
            <button class="border-toggle-btn active" data-side="all">All</button>
            <button class="border-toggle-btn" data-side="none">None</button>
            <button class="border-toggle-btn" data-side="top">Top</button>
            <button class="border-toggle-btn" data-side="bottom">Bottom</button>
            <button class="border-toggle-btn" data-side="left">Left</button>
            <button class="border-toggle-btn" data-side="right">Right</button>
        </div>
        
        <div style="font-size: 11px; font-weight: bold; color: #64748b; margin-bottom: 6px;">3. Border Thickness</div>
        <div style="display: flex; gap: 4px; margin-bottom: 8px;">
            <button class="border-toggle-btn active" data-border-size="1">1px</button>
            <button class="border-toggle-btn" data-border-size="2">2px</button>
            <button class="border-toggle-btn" data-border-size="3">3px</button>
        </div>
        
        <label style="display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: bold; color: #64748b; margin-bottom: 12px; cursor: pointer; text-align: left;">
            <input type="checkbox" id="chk-dark-borders" checked style="cursor: pointer; margin: 0;">
            Black Borders (uncheck for Gray)
        </label>
        
        <button class="new-doc-btn" id="table-action-submit" style="width: 100%; font-size: 12px; background: #2563eb; color: white;">
            ${isEditing ? 'Apply Table Styles' : 'Insert Table'}
        </button>
    `;
    
    if (!isEditing) {
        const container = notesRoot.getElementById('grid-container');
        const label = notesRoot.getElementById('table-dimensions-label');
        
        for (let r = 1; r <= 5; r++) {
            for (let c = 1; c <= 5; c++) {
                const gridSquare = document.createElement('div');
                gridSquare.className = 'grid-square';
                gridSquare.dataset.row = r;
                gridSquare.dataset.col = c;
                container.appendChild(gridSquare);
                
                gridSquare.addEventListener('mouseover', () => {
                    if (selectedRows === 0) {
                        label.innerText = `Click to set size: ${c} cols x ${r} rows`;
                        const squares = container.getElementsByClassName('grid-square');
                        for (let sq of squares) {
                            const sr = parseInt(sq.dataset.row);
                            const sc = parseInt(sq.dataset.col);
                            if (sr <= r && sc <= c) {
                                sq.classList.add('highlighted');
                            } else {
                                sq.classList.remove('highlighted');
                            }
                        }
                    }
                });
                
                gridSquare.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectedRows = r;
                    selectedCols = c;
                    label.innerText = `Selected Size: ${c} cols x ${r} rows`;
                    const squares = container.getElementsByClassName('grid-square');
                    for (let sq of squares) {
                        const sr = parseInt(sq.dataset.row);
                        const sc = parseInt(sq.dataset.col);
                        if (sr <= r && sc <= c) {
                            sq.classList.add('highlighted');
                            sq.style.background = '#10b981';
                        } else {
                            sq.classList.remove('highlighted');
                            sq.style.background = '';
                        }
                    }
                });
            }
        }
    } else {
        if (cell.style.padding === '4px') {
            notesRoot.getElementById('pad-compact').classList.add('active');
            notesRoot.getElementById('pad-normal').classList.remove('active');
            selectedPadding = "4px";
        } else if (cell.style.padding === '16px') {
            notesRoot.getElementById('pad-spacious').classList.add('active');
            notesRoot.getElementById('pad-normal').classList.remove('active');
            selectedPadding = "16px";
        }
    }
    
    const padBtns = insertDropdown.querySelectorAll('.padding-option-btn');
    padBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            padBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPadding = btn.dataset.pad;
        });
    });
    
    const thicknessBtns = insertDropdown.querySelectorAll('button[data-border-size]');
    thicknessBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            thicknessBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedThickness = parseInt(btn.getAttribute('data-border-size'));
        });
    });
    
    const sideBtns = insertDropdown.querySelectorAll('button[data-side]');
    sideBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const side = btn.dataset.side;
            
            if (side === 'none') {
                selectedSides = ['none'];
            } else if (side === 'all') {
                selectedSides = ['all'];
            } else {
                selectedSides = selectedSides.filter(s => s !== 'none' && s !== 'all');
                if (selectedSides.includes(side)) {
                    selectedSides = selectedSides.filter(s => s !== side);
                } else {
                    selectedSides.push(side);
                }
                if (selectedSides.length === 0) {
                    selectedSides = ['none'];
                }
            }
            
            sideBtns.forEach(b => {
                if (selectedSides.includes(b.dataset.side)) {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });
        });
    });
    
    notesRoot.getElementById('table-action-submit').addEventListener('click', (e) => {
        e.stopPropagation();
        restoreSelection();
        
        const useBlack = notesRoot.getElementById('chk-dark-borders') ? notesRoot.getElementById('chk-dark-borders').checked : true;
        const borderColor = useBlack ? '#000000' : '#cbd5e1';
        const borderVal = `${selectedThickness}px solid ${borderColor}`;
        
        if (isEditing) {
            const table = cell.closest('table');
            if (table) {
                table.style.border = 'none';
                const cells = table.getElementsByTagName('td');
                for (let i = 0; i < cells.length; i++) {
                    const td = cells[i];
                    td.style.padding = selectedPadding;
                    
                    if (selectedSides.includes('none')) {
                        td.style.border = 'none';
                    } else if (selectedSides.includes('all')) {
                        td.style.border = borderVal;
                    } else {
                        td.style.borderTop = selectedSides.includes('top') ? borderVal : 'none';
                        td.style.borderBottom = selectedSides.includes('bottom') ? borderVal : 'none';
                        td.style.borderLeft = selectedSides.includes('left') ? borderVal : 'none';
                        td.style.borderRight = selectedSides.includes('right') ? borderVal : 'none';
                    }
                }
                triggerAutoSave();
            }
        } else {
            if (selectedRows === 0 || selectedCols === 0) {
                alert("Please click on the dimension grid to select table size first.");
                return;
            }
            
            let tableHtml = `<table style="border-collapse: collapse; width: 100%; border: none; margin: 12px 0;">`;
            for (let r = 0; r < selectedRows; r++) {
                tableHtml += `<tr>`;
                for (let c = 0; c < selectedCols; c++) {
                    let cellStyle = `padding: ${selectedPadding}; vertical-align: top;`;
                    if (selectedSides.includes('none')) {
                        cellStyle += ' border: none;';
                    } else if (selectedSides.includes('all')) {
                        cellStyle += ` border: ${borderVal};`;
                    } else {
                        cellStyle += ` border-top: ${selectedSides.includes('top') ? borderVal : 'none'};`;
                        cellStyle += ` border-bottom: ${selectedSides.includes('bottom') ? borderVal : 'none'};`;
                        cellStyle += ` border-left: ${selectedSides.includes('left') ? borderVal : 'none'};`;
                        cellStyle += ` border-right: ${selectedSides.includes('right') ? borderVal : 'none'};`;
                    }
                    tableHtml += `<td style="${cellStyle}"><br></td>`;
                }
                tableHtml += `</tr>`;
            }
            tableHtml += `</table>`;
            
            document.execCommand('insertHTML', false, tableHtml);
            notesRoot.getElementById('editor-page').focus();
            triggerAutoSave();
        }
        
        insertDropdown.style.display = 'none';
    });
    
    notesRoot.getElementById('menu-back').addEventListener('click', renderInsertMainMenu);
}

function renderImageSelector() {
    insertDropdown.innerHTML = `
        <div class="dropdown-panel-title">
            <span>🖼️ Insert Image</span>
            <button id="menu-back" style="background: none; border: none; cursor: pointer; color: #2563eb; font-weight: bold;"><- Back</button>
        </div>
        <button class="new-doc-btn" id="img-menu-upload" style="width: 100%; margin-bottom: 8px; font-size: 11px;">📂 Upload Local File</button>
        <div style="border-top: 1px solid #e2e8f0; margin: 8px 0; padding-top: 8px;">
            <div style="font-size: 11px; font-weight: bold; color: #64748b; margin-bottom: 4px;">Paste Web Image URL</div>
            <input type="text" id="img-menu-url" placeholder="https://example.com/image.png" style="width: 100%; font-size: 11px; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; margin-bottom: 6px;">
            <button class="new-doc-btn" id="img-menu-url-submit" style="width: 100%; font-size: 11px; background: #10b981;">Insert Link</button>
        </div>
    `;
    
    notesRoot.getElementById('img-menu-upload').addEventListener('click', () => {
        notesRoot.getElementById('image-insert-input').click();
        insertDropdown.style.display = 'none';
    });
    
    notesRoot.getElementById('img-menu-url-submit').addEventListener('click', () => {
        const url = notesRoot.getElementById('img-menu-url').value;
        if (url) {
            restoreSelection();
            const imgHtml = `<img src="${url}" style="max-width: 100%; border-radius: 8px; margin: 12px 0;">`;
            document.execCommand('insertHTML', false, imgHtml);
            notesRoot.getElementById('editor-page').focus();
            triggerAutoSave();
        }
        insertDropdown.style.display = 'none';
    });
    
    notesRoot.getElementById('menu-back').addEventListener('click', renderInsertMainMenu);
}

function renderLineSelector() {
    insertDropdown.innerHTML = `
        <div class="dropdown-panel-title">
            <span>➖ Divider Line</span>
            <button id="menu-back" style="background: none; border: pointer; color: #2563eb; font-weight: bold;"><- Back</button>
        </div>
        <div style="font-size: 11px; font-weight: bold; color: #64748b; margin-bottom: 4px;">1. Select Style</div>
        <div class="divider-option" data-style="solid">
            <span>Solid</span>
            <div style="width: 120px; border-top: 2px solid #64748b;"></div>
        </div>
        <div class="divider-option" data-style="dashed">
            <span>Dashed</span>
            <div style="width: 120px; border-top: 2px dashed #64748b;"></div>
        </div>
        <div class="divider-option" data-style="dotted">
            <span>Dotted</span>
            <div style="width: 120px; border-top: 2px dotted #64748b;"></div>
        </div>
        <div class="divider-option" data-style="double">
            <span>Double</span>
            <div style="width: 120px; border-top: 4px double #64748b;"></div>
        </div>
        
        <div style="font-size: 11px; font-weight: bold; color: #64748b; margin-top: 8px; margin-bottom: 4px;">2. Select Thickness</div>
        <div style="display: flex; gap: 4px;">
            <button class="border-toggle-btn active" data-thick="1">1px</button>
            <button class="border-toggle-btn" data-thick="2">2px</button>
            <button class="border-toggle-btn" data-thick="3">3px</button>
            <button class="border-toggle-btn" data-thick="4">4px</button>
            <button class="border-toggle-btn" data-thick="5">5px</button>
        </div>
    `;
    
    let selectedStyle = 'solid';
    let selectedThick = 2;
    
    const styleOptions = insertDropdown.getElementsByClassName('divider-option');
    for (let opt of styleOptions) {
        opt.addEventListener('click', () => {
            selectedStyle = opt.dataset.style;
            restoreSelection();
            const lineHtml = `<hr style="border: none; border-top: ${selectedThick}px ${selectedStyle} #cbd5e1; margin: 16px 0;">`;
            document.execCommand('insertHTML', false, lineHtml);
            notesRoot.getElementById('editor-page').focus();
            triggerAutoSave();
            insertDropdown.style.display = 'none';
        });
    }
    
    const thickBtns = insertDropdown.querySelectorAll('button[data-thick]');
    thickBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            thickBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedThick = parseInt(btn.dataset.thick);
        });
    });
    
    notesRoot.getElementById('menu-back').addEventListener('click', renderInsertMainMenu);
}

function renderLinkSelector() {
    const selText = notesRoot.getSelection() ? notesRoot.getSelection().toString() : "";
    insertDropdown.innerHTML = `
        <div class="dropdown-panel-title">
            <span>🔗 Insert Link</span>
            <button id="menu-back" style="background: none; border: none; cursor: pointer; color: #2563eb; font-weight: bold;"><- Back</button>
        </div>
        <div style="font-size: 11px; font-weight: bold; color: #64748b; margin-bottom: 4px;">Link Text</div>
        <input type="text" id="link-menu-text" placeholder="e.g. My Website" value="${selText}" style="width: 100%; font-size: 11px; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; margin-bottom: 8px;">
        <div style="font-size: 11px; font-weight: bold; color: #64748b; margin-bottom: 4px;">Hyperlink Web URL</div>
        <input type="text" id="link-menu-url" value="https://" style="width: 100%; font-size: 11px; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; margin-bottom: 8px;">
        <button class="new-doc-btn" id="link-menu-submit" style="width: 100%; font-size: 11px;">Insert Link</button>
    `;
    
    notesRoot.getElementById('link-menu-submit').addEventListener('click', () => {
        const url = notesRoot.getElementById('link-menu-url').value;
        const text = notesRoot.getElementById('link-menu-text').value || url;
        if (url) {
            restoreSelection();
            const linkHtml = `<a href="${url}" target="_blank" style="color: #2563eb; text-decoration: underline;">${text}</a>`;
            document.execCommand('insertHTML', false, linkHtml);
            notesRoot.getElementById('editor-page').focus();
            triggerAutoSave();
        }
        insertDropdown.style.display = 'none';
    });
    
    notesRoot.getElementById('menu-back').addEventListener('click', renderInsertMainMenu);
}

notesRoot.getElementById('image-insert-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        restoreSelection();
        const imgHtml = `<img src="${evt.target.result}" style="max-width: 100%; border-radius: 8px; margin: 12px 0;">`;
        document.execCommand('insertHTML', false, imgHtml);
        notesRoot.getElementById('editor-page').focus();
        triggerAutoSave();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
});

notesRoot.getElementById('file-import-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await convertLocalFileToNote(file.name, file);
});

notesRoot.getElementById('btn-local-folder-trigger').addEventListener('click', () => {
    notesRoot.getElementById('file-import-input').click();
});

let ctxNoteId = null;

notesRoot.getElementById('notes-list').addEventListener('contextmenu', (e) => {
    const item = e.target.closest('.note-item');
    if (!item) return;
    e.preventDefault();
    e.stopPropagation();
    
    ctxNoteId = item.dataset.id;
    const note = myNotesData.notes[ctxNoteId];
    if (!note) return;
    
    // Display full path on context menu header immediately
    const pathHeader = notesRoot.getElementById('ctx-file-path-header');
    if (pathHeader) {
        pathHeader.innerText = note.fullPath || `G:\\My Drive (owner@gmail.com)\\${note.title}.html`;
    }
    
    const menu = notesRoot.getElementById('notes-context-menu');
    menu.style.display = 'block';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;
});

// Close context menu on any document click
document.addEventListener('click', () => {
    const menu = notesRoot.getElementById('notes-context-menu');
    if (menu) menu.style.display = 'none';
});

// Context Menu Action Listeners
notesRoot.getElementById('ctx-opt-copy-path').addEventListener('click', (e) => {
    e.stopPropagation();
    if (!ctxNoteId || !myNotesData.notes[ctxNoteId]) return;
    const path = myNotesData.notes[ctxNoteId].fullPath || `G:\\My Drive (owner@gmail.com)\\${myNotesData.notes[ctxNoteId].title}.html`;
    navigator.clipboard.writeText(path).then(() => {
        const status = notesRoot.getElementById('save-status');
        if (status) status.innerText = 'Copied path to clipboard!';
    });
    notesRoot.getElementById('notes-context-menu').style.display = 'none';
});

notesRoot.getElementById('ctx-opt-save-as').addEventListener('click', (e) => {
    e.stopPropagation();
    notesRoot.getElementById('notes-context-menu').style.display = 'none';
    if (!ctxNoteId || !myNotesData.notes[ctxNoteId]) return;
    const format = prompt("Enter save format (html, docx, pdf, txt, rtf, mhtml, md):", "md");
    if (format) {
        // Temporarily load this note ID to invoke export, then restore
        const prevId = myNotesData.currentNoteId;
        myNotesData.currentNoteId = ctxNoteId;
        exportNoteAsFormat(format.toLowerCase().trim());
        myNotesData.currentNoteId = prevId;
    }
});

notesRoot.getElementById('ctx-opt-rename').addEventListener('click', (e) => {
    e.stopPropagation();
    notesRoot.getElementById('notes-context-menu').style.display = 'none';
    if (!ctxNoteId || !myNotesData.notes[ctxNoteId]) return;
    const note = myNotesData.notes[ctxNoteId];
    const newTitle = prompt("Enter new title:", note.title);
    if (newTitle) {
        note.title = newTitle;
        if (myNotesData.currentNoteId === ctxNoteId) {
            notesRoot.getElementById('doc-title-input').value = newTitle;
        }
        triggerAutoSave();
    }
});

notesRoot.getElementById('ctx-opt-duplicate').addEventListener('click', (e) => {
    e.stopPropagation();
    notesRoot.getElementById('notes-context-menu').style.display = 'none';
    if (!ctxNoteId || !myNotesData.notes[ctxNoteId]) return;
    const note = myNotesData.notes[ctxNoteId];
    const dupId = 'note-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
    myNotesData.notes[dupId] = {
        ...note,
        id: dupId,
        title: note.title + ' (Copy)',
        lastModified: Date.now()
    };
    
    if (note.googleDriveFileId) {
        myNotesData.notes[dupId].fullPath = `${note.gmail || 'owner@gmail.com'}:${note.folderPath || '\\My Drive'}\\${note.title} (Copy).html`;
    } else {
        myNotesData.notes[dupId].fullPath = `G:\\My Drive (owner@gmail.com)\\${note.title} (Copy).html`;
    }
    
    saveNotes();
    renderNotesList();
});

notesRoot.getElementById('ctx-opt-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    notesRoot.getElementById('notes-context-menu').style.display = 'none';
    if (!ctxNoteId || !myNotesData.notes[ctxNoteId]) return;
    if (confirm("Are you sure you want to delete this note?")) {
        delete myNotesData.notes[ctxNoteId];
        if (myNotesData.currentNoteId === ctxNoteId) {
            const keys = Object.keys(myNotesData.notes);
            if (keys.length > 0) {
                loadNote(keys[0]);
            } else {
                createBlankNote();
            }
        }
        saveNotes();
        renderNotesList();
    }
});

// Google Drive Sync Picker & Authenticators
let mockDriveFiles = [
    { id: 'drive-file-1', name: 'Project Roadmap.md', mimeType: 'text/markdown', path: '\\My Drive\\Project Roadmap.md', gmail: 'owner@gmail.com', content: `# Project Roadmap\n\nWelcome to your synced markdown roadmap!\n\n| Feature | Status |\n| --- | --- |\n| Google Drive Sync | Completed |\n| Markdown Parsing | Active |\n` },
    { id: 'drive-file-2', name: 'Meeting Minutes.txt', mimeType: 'text/plain', path: '\\My Drive\\Meeting Minutes.txt', gmail: 'owner@gmail.com', content: `Meeting Minutes\nDate: July 5, 2026\n\nDiscussed adding hand pointers and markdown exports.` },
    { id: 'drive-file-3', name: 'User Guide.html', mimeType: 'text/html', path: '\\My Drive\\User Guide.html', gmail: 'owner@gmail.com', content: `<h1>SideKick User Guide</h1><p>Learn how to connect Google Drive and export documents.</p>` },
    { id: 'drive-file-4', name: 'Status Report.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', path: '\\My Drive\\Status Report.docx', gmail: 'owner@gmail.com', content: `Simulated DOCX Content` }
];

notesRoot.getElementById('btn-google-drive-trigger').addEventListener('click', () => {
    if (!currentGoogleEmail) {
        notesRoot.getElementById('signin-modal-overlay').style.display = 'flex';
        return;
    }
    
    if (currentGoogleToken) {
        notesRoot.getElementById('drive-email-val').innerText = currentGoogleEmail;
        fetchRealGoogleDriveFiles(currentGoogleToken, currentGoogleEmail);
        return;
    }
    
    if (typeof chrome !== 'undefined' && chrome.identity) {
        chrome.identity.getAuthToken({ interactive: true }, function(token) {
            if (chrome.runtime.lastError || !token) {
                openSimulatedDriveModal();
            } else {
                notesRoot.getElementById('drive-email-val').innerText = currentGoogleEmail;
                fetchRealGoogleDriveFiles(token, currentGoogleEmail);
            }
        });
    } else {
        openSimulatedDriveModal();
    }
});

notesRoot.getElementById('btn-signin-submit').addEventListener('click', () => {
    const emailInput = notesRoot.getElementById('signin-email-input').value.trim();
    const tokenInput = notesRoot.getElementById('signin-token-input').value.trim() || null;
    if (!emailInput || !emailInput.includes('@')) {
        alert("Please enter a valid Google email address.");
        return;
    }
    setGoogleAccount(emailInput, tokenInput);
    notesRoot.getElementById('signin-modal-overlay').style.display = 'none';
    notesRoot.getElementById('btn-google-drive-trigger').click();
});

notesRoot.getElementById('btn-signin-cancel').addEventListener('click', () => {
    notesRoot.getElementById('signin-modal-overlay').style.display = 'none';
});

notesRoot.getElementById('btn-change-drive-email').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    notesRoot.getElementById('drive-modal-overlay').style.display = 'none';
    notesRoot.getElementById('signin-modal-overlay').style.display = 'flex';
});

function openSimulatedDriveModal() {
    const modal = notesRoot.getElementById('drive-modal-overlay');
    modal.style.display = 'flex';
    
    const activeEmail = currentGoogleEmail || 'owner@gmail.com';
    notesRoot.getElementById('drive-email-val').innerText = activeEmail;
    
    const listContainer = notesRoot.getElementById('drive-file-list');
    listContainer.innerHTML = '';
    
    mockDriveFiles.forEach(file => {
        const item = document.createElement('div');
        item.style.padding = '8px 12px';
        item.style.border = '1px solid #e2e8f0';
        item.style.borderRadius = '6px';
        item.style.cursor = 'pointer';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.justifyContent = 'space-between';
        item.style.background = '#f8fafc';
        item.style.transition = 'background 0.2s';
        
        item.addEventListener('mouseover', () => item.style.background = '#eff6ff');
        item.addEventListener('mouseout', () => item.style.background = '#f8fafc');
        
        let typeIcon = "📄";
        if (file.name.endsWith('.md')) typeIcon = "Ⓜ️";
        if (file.name.endsWith('.html')) typeIcon = "🌐";
        
        item.innerHTML = `
            <span style="font-size: 12px; font-weight: bold; color: #1e293b;">${typeIcon} ${file.name}</span>
            <span style="font-size: 10px; color: #64748b; font-family: monospace;">${activeEmail}:${file.path}</span>
        `;
        
        item.addEventListener('click', () => {
            const id = 'note-drive-' + file.id;
            let noteContent = file.content;
            if (file.name.endsWith('.md')) {
                noteContent = parseMarkdownToHTML(file.content);
            }
            
            myNotesData.notes[id] = {
                id,
                title: file.name.replace(/\.[^/.]+$/, ""),
                content: noteContent,
                theme: 'light',
                lastModified: Date.now(),
                googleDriveFileId: file.id,
                gmail: activeEmail,
                folderPath: '\\My Drive',
                fullPath: `${activeEmail}:${file.path}`
            };
            
            myNotesData.currentNoteId = id;
            saveNotes();
            loadNote(id);
            renderNotesList();
            modal.style.display = 'none';
        });
        
        listContainer.appendChild(item);
    });
}

function fetchRealGoogleDriveFiles(token, email) {
    const modal = notesRoot.getElementById('drive-modal-overlay');
    modal.style.display = 'flex';
    
    const listContainer = notesRoot.getElementById('drive-file-list');
    listContainer.innerHTML = '<div style="font-size: 11px; text-align: center; color: #64748b;">Loading files from Google Drive...</div>';
    
    fetch('https://www.googleapis.com/drive/v3/files?q=trashed%3Dfalse&fields=files(id%2Cname%2CmimeType)', {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(r => {
        if (r.status === 401) {
            throw new Error("UNAUTHORIZED");
        }
        return r.json();
    })
    .then(data => {
        if (data.error) {
            throw new Error(data.error.message || "Drive API Error");
        }
        listContainer.innerHTML = '';
        const files = data.files || [];
        if (files.length === 0) {
            listContainer.innerHTML = '<div style="font-size: 11px; text-align: center; color: #64748b;">No files found in Google Drive.</div>';
            return;
        }
        
        files.forEach(file => {
            const item = document.createElement('div');
            item.style.padding = '8px 12px';
            item.style.border = '1px solid #e2e8f0';
            item.style.borderRadius = '6px';
            item.style.cursor = 'pointer';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'space-between';
            item.style.background = '#f8fafc';
            item.style.transition = 'background 0.2s';
            
            item.addEventListener('mouseover', () => item.style.background = '#eff6ff');
            item.addEventListener('mouseout', () => item.style.background = '#f8fafc');
            
            let typeIcon = "📄";
            if (file.name.endsWith('.md')) typeIcon = "Ⓜ️";
            if (file.name.endsWith('.html')) typeIcon = "🌐";
            
            item.innerHTML = `
                <span style="font-size: 12px; font-weight: bold; color: #1e293b;">${typeIcon} ${file.name}</span>
                <span style="font-size: 9px; color: #94a3b8; font-family: monospace;">${email}:${file.name}</span>
            `;
            
            item.addEventListener('click', () => {
                fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                    headers: { 'Authorization': 'Bearer ' + token }
                })
                .then(res => {
                    if (res.status === 401) throw new Error("UNAUTHORIZED");
                    return res.text();
                })
                .then(text => {
                    const id = 'note-drive-' + file.id;
                    let noteContent = text;
                    if (file.name.endsWith('.md')) {
                        noteContent = parseMarkdownToHTML(text);
                    }
                    
                    myNotesData.notes[id] = {
                        id,
                        title: file.name.replace(/\.[^/.]+$/, ""),
                        content: noteContent,
                        theme: 'light',
                        lastModified: Date.now(),
                        googleDriveFileId: file.id,
                        gmail: email,
                        folderPath: '\\My Drive',
                        fullPath: `${email}:\\My Drive\\${file.name}`
                    };
                    
                    myNotesData.currentNoteId = id;
                    saveNotes();
                    loadNote(id);
                    renderNotesList();
                    modal.style.display = 'none';
                })
                .catch(err => {
                    if (err.message === "UNAUTHORIZED") {
                        handleAuthFailure();
                    } else {
                        alert("Error loading file content: " + err.message);
                    }
                });
            });
            
            listContainer.appendChild(item);
        });
    })
    .catch(err => {
        if (err.message === "UNAUTHORIZED") {
            handleAuthFailure();
        } else {
            listContainer.innerHTML = '<div style="font-size: 11px; text-align: center; color: #ef4444;">Failed to connect to Google Drive API. Using simulated fallback...</div>';
            setTimeout(openSimulatedDriveModal, 1500);
        }
    });
}

function handleAuthFailure() {
    alert("Google authentication token has expired or is invalid. Please sign in again or update your Access Token.");
    notesRoot.getElementById('drive-modal-overlay').style.display = 'none';
    notesRoot.getElementById('signin-modal-overlay').style.display = 'flex';
}

notesRoot.getElementById('close-drive-modal').addEventListener('click', () => {
    notesRoot.getElementById('drive-modal-overlay').style.display = 'none';
});

notesRoot.getElementById('doc-title-input').addEventListener('input', (e) => {
    // Instantly update title in active sidebar item to prevent focus loss
    const activeTitleEl = notesRoot.querySelector('.note-item.active .note-item-title');
    if (activeTitleEl) {
        activeTitleEl.innerText = e.target.value || 'Untitled Note';
    }
    triggerAutoSave();
});

let savedRange = null;

function saveSelection() {
    const sel = notesRoot.getSelection();
    if (sel && sel.rangeCount > 0) {
        let node = sel.getRangeAt(0).startContainer;
        let isInsideEditor = false;
        const editor = notesRoot.getElementById('editor-page');
        while (node) {
            if (node === editor) {
                isInsideEditor = true;
                break;
            }
            node = node.parentNode;
        }
        if (isInsideEditor) {
            savedRange = sel.getRangeAt(0).cloneRange();
        }
    }
}

function restoreSelection() {
    if (savedRange) {
        const sel = notesRoot.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange);
    }
}

notesRoot.getElementById('editor-page').addEventListener('mouseup', saveSelection);
notesRoot.getElementById('editor-page').addEventListener('keyup', saveSelection);
notesRoot.getElementById('editor-page').addEventListener('focus', saveSelection);

notesRoot.getElementById('editor-page').addEventListener('input', () => {
    saveSelection();
    updateWordAndCharCount();
    triggerAutoSave();
});

notesRoot.getElementById('editor-page').addEventListener('keydown', (e) => {
    if (e.ctrlKey && ['c', 'v', 'x', 'z', 'a', 'y'].includes(e.key.toLowerCase())) {
        e.stopPropagation();
    }
});

notesRoot.getElementById('editor-page').addEventListener('click', (e) => {
    let target = e.target;
    while (target && target !== e.currentTarget) {
        if (target.nodeName === 'A') {
            e.preventDefault();
            e.stopPropagation();
            const href = target.getAttribute('href');
            if (href) {
                window.open(href, '_blank');
            }
            break;
        }
        target = target.parentNode;
    }
});

notesRoot.getElementById('theme-select').addEventListener('change', (e) => {
    const theme = e.target.value;
    const container = notesRoot.getElementById('notes-container');
    container.className = `notes-container theme-${theme}`;
    triggerAutoSave();
});

// Format actions listeners
notesRoot.querySelectorAll('.toolbar-btn[data-cmd]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cmd = btn.dataset.cmd;
        document.execCommand(cmd, false, null);
        notesRoot.getElementById('editor-page').focus();
        triggerAutoSave();
    });
});

notesRoot.getElementById('font-family-select').addEventListener('change', (e) => {
    document.execCommand('fontName', false, e.target.value);
    notesRoot.getElementById('editor-page').focus();
    triggerAutoSave();
});

notesRoot.getElementById('font-size-select').addEventListener('change', (e) => {
    document.execCommand('fontSize', false, e.target.value);
    notesRoot.getElementById('editor-page').focus();
    triggerAutoSave();
});

function getActiveCell() {
    const sel = notesRoot.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    let node = sel.getRangeAt(0).startContainer;
    while (node && node !== notesRoot.getElementById('editor-page')) {
        if (node.nodeName === 'TD') {
            return node;
        }
        node = node.parentNode;
    }
    return null;
}



notesRoot.getElementById('note-fg-color').addEventListener('input', (e) => {
    const cell = getActiveCell();
    if (cell) {
        cell.style.color = e.target.value;
    } else {
        document.execCommand('foreColor', false, e.target.value);
    }
    triggerAutoSave();
});

notesRoot.getElementById('note-bg-color').addEventListener('input', (e) => {
    const cell = getActiveCell();
    if (cell) {
        cell.style.backgroundColor = e.target.value;
    } else {
        document.execCommand('hiliteColor', false, e.target.value);
    }
    triggerAutoSave();
});

function convertToRTF(html) {
    let rtf = "{\\rtf1\\ansi\\deff0\n";
    let text = html;
    text = text.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "\\b $1\\b0 ");
    text = text.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "\\i $1\\i0 ");
    text = text.replace(/<br[^>]*>/gi, "\\par\n");
    text = text.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, "$1\\par\n");
    text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\\par\n");
    text = text.replace(/<[^>]*>/g, "");
    rtf += text + "\n}";
    return rtf;
}

function exportNoteAsFormat(format) {
    const curId = myNotesData.currentNoteId;
    if (!curId || !myNotesData.notes[curId]) return;
    const note = myNotesData.notes[curId];
    const title = note.title || 'Note';
    
    if (format === 'pdf') {
        alert("To export as PDF, select 'Save as PDF' as the Destination in the Print window.");
        notesRoot.getElementById('btn-print-note').click();
        return;
    }
    
    let blobType = 'text/plain';
    let extension = 'txt';
    let fileContent = '';
    
    if (format === 'html') {
        blobType = 'text/html';
        extension = 'html';
        fileContent = note.content;
    } else if (format === 'txt') {
        blobType = 'text/plain';
        extension = 'txt';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = note.content;
        fileContent = tempDiv.innerText;
    } else if (format === 'rtf') {
        blobType = 'application/rtf';
        extension = 'rtf';
        fileContent = convertToRTF(note.content);
    } else if (format === 'docx') {
        blobType = 'application/msword';
        extension = 'docx';
        const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><title>${title}</title><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]--></head><body>`;
        const footer = `</body></html>`;
        fileContent = header + note.content + footer;
    } else if (format === 'mhtml') {
        blobType = 'message/rfc822';
        extension = 'mhtml';
        fileContent = "MIME-Version: 1.0\nContent-Type: multipart/related; boundary=\"next-part\"\n\n--next-part\nContent-Type: text/html; charset=\"utf-8\"\n\n" + note.content + "\n\n--next-part--";
    } else if (format === 'md') {
        blobType = 'text/markdown';
        extension = 'md';
        fileContent = convertHTMLToMarkdown(note.content);
    }
    
    const blob = new Blob([fileContent], { type: blobType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
}

notesRoot.getElementById('export-format-select').addEventListener('change', (e) => {
    const format = e.target.value;
    if (!format) return;
    exportNoteAsFormat(format);
    e.target.value = ""; // Reset dropdown
});

// Print document
notesRoot.getElementById('btn-print-note').addEventListener('click', () => {
    const curId = myNotesData.currentNoteId;
    if (!curId || !myNotesData.notes[curId]) return;
    const note = myNotesData.notes[curId];
    
    // Create a hidden iframe to isolate the printable document styles
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <html>
        <head>
            <title>${note.title || 'Document'}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 40px;
                    line-height: 1.6;
                    font-size: 14px;
                    color: #1e293b;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                @media print {
                    body {
                        padding: 0;
                    }
                }
            </style>
        </head>
        <body>
            ${note.content}
        </body>
        </html>
    `);
    doc.close();
    
    // Focus and print the iframe window
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 1000);
});

// Copy to clipboard
notesRoot.getElementById('btn-share-clipboard').addEventListener('click', () => {
    const page = notesRoot.getElementById('editor-page');
    if (!page) return;
    try {
        const text = page.innerText;
        const html = page.innerHTML;
        const blobHTML = new Blob([html], { type: 'text/html' });
        const blobText = new Blob([text], { type: 'text/plain' });
        const data = [new ClipboardItem({ 'text/html': blobHTML, 'text/plain': blobText })];
        navigator.clipboard.write(data).then(() => {
            alert('Rich text copied to clipboard!');
        });
    } catch (e) {
        navigator.clipboard.writeText(page.innerText).then(() => {
            alert('Plain text copied to clipboard!');
        });
    }
});

let isFullscreen = false;
const defaultStyles = {
    position: 'fixed', bottom: '90px', right: '20px', width: '768px', height: '576px',
    zIndex: '2147483647', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    borderRadius: '16px', overflow: 'hidden', backgroundColor: '#f1f5f9',
    top: 'auto', left: 'auto'
};
const fullscreenStyles = {
    position: 'fixed', top: '0px', left: '0px', right: '0px', bottom: '0px',
    width: '100vw', height: '100vh', zIndex: '2147483647', boxShadow: 'none',
    borderRadius: '0px', overflow: 'hidden', backgroundColor: '#f1f5f9'
};

notesRoot.getElementById('btn-fullscreen-toggle').addEventListener('click', () => {
    isFullscreen = !isFullscreen;
    const targetStyles = isFullscreen ? fullscreenStyles : defaultStyles;
    Object.assign(notesHost.style, targetStyles);
    
    const btn = notesRoot.getElementById('btn-fullscreen-toggle');
    if (btn) {
        btn.innerText = isFullscreen ? '🗗 Shrink' : '⛶ Full Screen';
        btn.title = isFullscreen ? 'Shrink Window' : 'Maximize Window';
    }
});

notesRoot.getElementById('link-close-notes').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFullscreen) {
        isFullscreen = false;
        Object.assign(notesHost.style, defaultStyles);
        const btn = notesRoot.getElementById('btn-fullscreen-toggle');
        if (btn) {
            btn.innerText = '⛶ Full Screen';
        }
    }
    notesHost.style.display = 'none';
    navPanel.style.display = 'flex';
});

// Load storage notes
chrome.storage.local.get(['myNotesData'], (result) => {
    initGoogleAccount();
    if (result.myNotesData && result.myNotesData.notes && Object.keys(result.myNotesData.notes).length > 0) {
        myNotesData = result.myNotesData;
        loadNote(myNotesData.currentNoteId || Object.keys(myNotesData.notes)[0]);
    } else {
        createBlankNote('Welcome to My Notes');
    }
    renderNotesList();
});

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
        const classes = [];
        if (isEditMode) {
            classes.push('edit-mode');
        } else if (isDragMode) {
            classes.push('drag-mode');
        } else {
            classes.push('display-mode');
        }
        if (isSmallBoxMode) {
            classes.push('small-box-mode');
        }
        table.className = classes.join(' ');

        // Determine which rows to render based on active data or mode
        const rowsToRender = [];
        for (let r = 0; r < 10; r++) {
            const hasData = !!((myUrlsData[quad][r * 2] && (myUrlsData[quad][r * 2].name || myUrlsData[quad][r * 2].url)) ||
                               (myUrlsData[quad][r * 2 + 1] && (myUrlsData[quad][r * 2 + 1].name || myUrlsData[quad][r * 2 + 1].url)));
            if (isEditMode || isDragMode || hasData) {
                rowsToRender.push(r);
            }
        }

        // Configure overflow-y on the quadrant container dynamically
        const quadEl = urlsRoot.querySelector('.q-' + quad.toLowerCase());
        if (quadEl) {
            const threshold = isSmallBoxMode ? 8 : 6;
            if (rowsToRender.length > threshold) {
                quadEl.style.overflowY = 'auto';
            } else {
                quadEl.style.overflowY = 'hidden';
            }
        }

        rowsToRender.forEach(r => {
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
                                
                                const isOccupied = (itm) => !!(itm.name || itm.url);
                                
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
        });
        listDiv.appendChild(table);
    });

    const modeToggle = urlsRoot.getElementById('mode-toggle');
    modeToggle.checked = isEditMode;
    const dragToggle = urlsRoot.getElementById('drag-toggle');
    dragToggle.checked = isDragMode;
    const smallBoxToggle = urlsRoot.getElementById('small-box-toggle');
    if (smallBoxToggle) {
        smallBoxToggle.checked = isSmallBoxMode;
    }
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
const smallBoxToggle = urlsRoot.getElementById('small-box-toggle');

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

smallBoxToggle.addEventListener('change', (e) => {
    isSmallBoxMode = e.target.checked;
    renderUrls();
});

document.body.appendChild(floatingButton);
document.body.appendChild(navPanel);
document.body.appendChild(calcHost);
document.body.appendChild(tetrisHost);
document.body.appendChild(urlsHost);
document.body.appendChild(notesHost);

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
            notesHost.style.display = 'none';
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
        } else if (notesHost.style.display === 'block') {
            // If notes panel is open, return to nav panel
            notesHost.style.display = 'none';
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