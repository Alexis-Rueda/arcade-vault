const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const ROW_COLORS = ['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green'];

const game = { score: 0, lives: 3, state: 'playing', screen: 'title', level: 0, levelsUnlocked: LEVELS.length, transitionTimer: 0, paused: false };

const paddle = { x: 350, y: 570, w: 120, h: 16 };

const ball = { x: 400, y: 560, r: 8, vx: 0, vy: 0, active: false };

const blocks = [];
const explosions = [];

function initBlocks(cols, rows, grid) {
  blocks.length = 0;
  const BW = 52, BH = 20, GAP = 2;
  const totalW = cols * BW + (cols - 1) * GAP;
  const offsetX = (800 - totalW) / 2;
  const offsetY = 60;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = grid[r][c];
      if (val === 0) continue;
      blocks.push({
        x: offsetX + c * (BW + GAP),
        y: offsetY + r * (BH + GAP),
        w: BW, h: BH,
        color: ROW_COLORS[val - 1],
        alive: true
      });
    }
  }
}
function loadLevel(index) {
  const lvl = LEVELS[index];
  game.level = index;
  game.screen = 'playing';
  game.state = 'playing';
  initBlocks(lvl.cols, lvl.rows, lvl.grid);
  paddle.x = 350;
  ball.x = 400;
  ball.y = 560;
  ball.vx = 0;
  ball.vy = 0;
  ball.active = false;
  explosions.length = 0;
}

function launchBall() {
  if ((game.state === 'playing' || game.state === 'lifelost') && !ball.active) {
    ball.vx = BALL_SPEEDS[game.level];
    ball.vy = -BALL_SPEEDS[game.level];
    ball.active = true;
    game.state = 'playing';
  }
}

const keys = {};

document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && game.screen === 'playing') {
    game.paused = !game.paused;
  }
  if (e.key === ' ') {
    launchBall();
  }
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  paddle.x = (e.clientX - rect.left) * scaleX - paddle.w / 2;
});

canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  if (game.screen === 'playing') {
    game.paused = !game.paused;
  }
});

canvas.addEventListener('click', e => {
  if (game.state === 'gameover' || game.state === 'victory') {
    game.score = 0;
    game.lives = 3;
    game.screen = 'title';
    blocks.length = 0;
    explosions.length = 0;
    return;
  }
  launchBall();
  if (game.screen !== 'title' && !game.paused) return;
  const rect = canvas.getBoundingClientRect();
  const scaleY = canvas.height / rect.height;
  const my = (e.clientY - rect.top) * scaleY;
  const startY = game.screen === 'title' ? 170 : 120;
  const itemH = game.screen === 'title' ? 44 : 40;
  const gap = game.screen === 'title' ? 6 : 4;
  for (let i = 0; i < LEVELS.length; i++) {
    if (i >= game.levelsUnlocked) continue;
    const y = startY + i * (itemH + gap);
    if (my >= y && my < y + itemH) {
      game.paused = false;
      if (game.screen === 'title') {
        game.score = 0;
        game.lives = 3;
        game.levelsUnlocked = LEVELS.length;
      }
      loadLevel(i);
      break;
    }
  }
});

loadSpritesheet(() => {
  requestAnimationFrame(gameLoop);
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function update() {
  if (game.screen === 'title' || game.paused || game.state === 'gameover' || game.state === 'victory') return;

  if (game.screen === 'transition') {
    game.transitionTimer -= 16;
    if (game.transitionTimer <= 0) {
      loadLevel(game.level);
    }
    return;
  }

  if (keys['ArrowLeft']) paddle.x -= 6;
  if (keys['ArrowRight']) paddle.x += 6;
  paddle.x = Math.max(0, Math.min(800 - paddle.w, paddle.x));

  if (!ball.active) {
    ball.x = paddle.x + paddle.w / 2;
    ball.y = paddle.y - ball.r;
    return;
  }

  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.x - ball.r <= 0) { ball.x = ball.r; ball.vx = -ball.vx; new Audio('assets/sounds/ball-bounce.mp3').play(); }
  if (ball.x + ball.r >= 800) { ball.x = 800 - ball.r; ball.vx = -ball.vx; new Audio('assets/sounds/ball-bounce.mp3').play(); }
  if (ball.y - ball.r <= 0) { ball.y = ball.r; ball.vy = -ball.vy; new Audio('assets/sounds/ball-bounce.mp3').play(); }

  if (ball.vy > 0 &&
      ball.y + ball.r >= paddle.y &&
      ball.y + ball.r <= paddle.y + paddle.h + ball.vy &&
      ball.x >= paddle.x - ball.r &&
      ball.x <= paddle.x + paddle.w + ball.r) {
    ball.vy = -ball.vy;
    ball.y = paddle.y - ball.r;
    new Audio('assets/sounds/ball-bounce.mp3').play();
  }

  for (const b of blocks) {
    if (!b.alive) continue;
    if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
        ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
      b.alive = false;
      new Audio('assets/sounds/break-sound.mp3').play();
      explosions.push({
        x: b.x, y: b.y, w: 52, h: 20,
        frames: EXPLOSION_FRAMES[b.color],
        frameIndex: 0, timer: 0
      });
      game.score += 10;
      const overlapX = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r));
      const overlapY = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.r));
      if (overlapX < overlapY) {
        ball.vx = -ball.vx;
      } else {
        ball.vy = -ball.vy;
      }
      break;
    }
  }

  for (let i = explosions.length - 1; i >= 0; i--) {
    const e = explosions[i];
    e.timer += 16;
    if (e.timer >= EXPLOSION_DURATION) {
      explosions.splice(i, 1);
    } else {
      e.frameIndex = Math.floor(e.timer / (EXPLOSION_DURATION / e.frames.length));
    }
  }

  if (blocks.every(b => !b.alive) && explosions.length === 0) {
    if (game.level >= LEVELS.length - 1) {
      game.state = 'victory';
    } else {
      game.screen = 'transition';
      game.level++;
      game.transitionTimer = 2000;
    }
  }

  if (ball.y - ball.r > 600) {
    game.lives--;
    ball.active = false;
    game.state = game.lives > 0 ? 'lifelost' : 'gameover';
  }
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 800, 600);

  if (game.screen === 'title') {
    ctx.fillStyle = '#fff';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ARKANOID', 400, 80);
    ctx.font = '20px monospace';
    ctx.fillText('Selecciona un nivel:', 400, 130);
    const startY = 170, itemH = 44, gap = 6;
    for (let i = 0; i < LEVELS.length; i++) {
      const y = startY + i * (itemH + gap);
      const unlocked = i < game.levelsUnlocked;
      ctx.fillStyle = unlocked ? '#3498db' : '#555';
      ctx.fillRect(300, y, 200, itemH);
      ctx.fillStyle = unlocked ? '#fff' : '#999';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${unlocked ? `Nivel ${i + 1} - ${LEVELS[i].name}` : '🔒 Bloqueado'}`, 400, y + 28);
    }
    ctx.font = '14px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('Haz clic en un nivel para comenzar', 400, 560);
    return;
  }

  drawSprite(ctx, 'paddle', paddle.x, paddle.y, paddle.w, paddle.h);

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();

  for (const b of blocks) {
    if (!b.alive) continue;
    drawSprite(ctx, 'block_' + b.color, b.x, b.y, b.w, b.h);
  }

  for (const e of explosions) {
    drawFrame(ctx, e.frames[e.frameIndex], e.x, e.y, e.w, e.h);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, 800, 32);
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`PUNTOS: ${game.score}`, 10, 22);
  ctx.textAlign = 'right';
  ctx.fillText(`VIDAS: ${'♥'.repeat(game.lives)}`, 790, 22);

  if (game.screen === 'transition') {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#ff0';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`¡NIVEL ${game.level + 1}!`, 400, 300);
    ctx.fillStyle = '#fff';
    ctx.font = '18px monospace';
    ctx.fillText(`Nivel ${game.level + 1} - ${LEVELS[game.level].name}`, 400, 340);
    return;
  }

  if (game.paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#fff';
    ctx.font = '36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSA', 400, 60);
    ctx.font = '16px monospace';
    ctx.fillText('Selecciona un nivel:', 400, 100);
    const startY = 120, itemH = 40, gap = 4;
    for (let i = 0; i < LEVELS.length; i++) {
      const y = startY + i * (itemH + gap);
      const unlocked = i < game.levelsUnlocked;
      ctx.fillStyle = unlocked ? '#3498db' : '#555';
      ctx.fillRect(300, y, 200, itemH);
      ctx.fillStyle = unlocked ? '#fff' : '#999';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${unlocked ? `Nivel ${i + 1} - ${LEVELS[i].name}` : '🔒 Bloqueado'}`, 400, y + 25);
    }
    ctx.font = '14px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('P/Esc: reanudar — clic: seleccionar nivel', 400, 550);
    return;
  }

  if (game.state === 'lifelost') {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#fff';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`VIDAS RESTANTES: ${game.lives} — PRESIONA ESPACIO`, 400, 300);
  }

  if (game.state === 'gameover') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#f44';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', 400, 280);
    ctx.fillStyle = '#fff';
    ctx.font = '18px monospace';
    ctx.fillText('Haz clic para reiniciar', 400, 330);
  }

  if (game.state === 'victory') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#4f4';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('¡GANASTE!', 400, 280);
    ctx.fillStyle = '#fff';
    ctx.font = '18px monospace';
    ctx.fillText('Haz clic para reiniciar', 400, 330);
  }
}
