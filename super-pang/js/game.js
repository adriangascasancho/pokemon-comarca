/* =========================================================================
   SUPER PANG · SUPERPUNK EDITION — motor del juego
   -------------------------------------------------------------------------
   HTML5 Canvas + JavaScript vanilla, sin dependencias ni build.
   Mecánica fiel al Super Pang / Pang (Buster Bros) original de Mitchell/Capcom:
   personaje que se mueve en horizontal, dispara un arpón vertical, y las bolas
   se dividen en 4 tamaños al ser tocadas. Estética "superpunk" (neón/CRT/glitch).

   Estructura del archivo:
     1) Configuración y constantes
     2) Utilidades
     3) Audio sintetizado (WebAudio)
     4) Entrada (teclado + táctil)
     5) Entidades (Player, Harpoon, Ball, Powerup, Particle, FloatText)
     6) Estado del juego y carga de niveles
     7) Game loop (update + render con delta-time)
     8) Render: fondos neón, HUD, pantallas (título/transición/gameover/win)
     9) Bootstrap
   ========================================================================= */
(() => {
'use strict';

/* =========================================================================
   1) CONFIGURACIÓN Y CONSTANTES
   ========================================================================= */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// La lógica del juego usa un sistema de coordenadas "grande" (800×600) por
// comodidad, pero el render se hace en un búfer pequeño (RES_W×RES_H) para
// conseguir el look pixel-art de recreativa: todo se dibuja escalado por
// RES_SCALE y luego el CSS amplía el canvas con image-rendering: pixelated.
const GAME_W = 800;          // ancho lógico
const GAME_H = 600;          // alto lógico (4:3)
const RES_W = 320, RES_H = 240;       // resolución interna real (arcade)
const RES_SCALE = RES_W / GAME_W;     // = 0.4 (uniforme, mantiene 4:3)

// Marco decorativo + zona de juego (en coords lógicas).
const FRAME = 16;            // grosor del marco de tiles
const PLAY_L = FRAME;                  // pared izquierda jugable
const PLAY_R = GAME_W - FRAME;         // pared derecha jugable
const PLAY_T = FRAME;                  // techo jugable (tope del arpón)
const FLOOR_Y = 512;         // suelo (justo encima del HUD inferior)
const HUD_Y = FLOOR_Y;       // el HUD ocupa de FLOOR_Y a GAME_H
const CEIL_Y = PLAY_T;       // alias usado por el arpón/bolas

const GRAVITY = 900;         // px/s² para bolas y jugador

// Bolas: 4 tamaños (0=grande … 3=diminuta). Estilo arcade "glossy":
// color sólido brillante + contorno oscuro + brillo blanco. Cada tamaño un
// color distinto (como en los arcades clásicos de burbujas).
const BALL = {
  radius:   [38, 25, 15, 9],
  bounceVy: [905, 800, 668, 540],
  hspeed:   [105, 120, 138, 156],
  score:    [50, 100, 200, 400],
  splitUp:  520,
  // [color principal, brillo claro, sombra oscura/contorno]
  colors: [
    ['#ff3b4e', '#ff9aa6', '#8c0d22'],   // rojo
    ['#3b8bff', '#a6cdff', '#0d2f8c'],   // azul
    ['#ffd23b', '#fff0a6', '#8c6a0d'],   // amarillo
    ['#46d65a', '#b6f5bf', '#0d6a1f'],   // verde
  ],
};

const PLAYER = {
  w: 36, h: 48,
  speed: 230,        // px/s horizontal
  climbSpeed: 150,   // px/s en escalera
  respawnInvuln: 2.0 // s de invulnerabilidad tras reaparecer
};

const HARPOON = {
  speed: 950,        // px/s de subida del arpón normal
  halfW: 4,          // semianchura del cable (para colisiones)
  adhesiveTime: 3.0  // s que el cable adhesivo aguanta pegado al techo
};

// Power-ups: metadatos (letra/símbolo y color neón).
const POWERUPS = {
  double:   { glyph: '⇈', color: '#14f0ff', label: 'DOBLE ARPÓN' },
  adhesive: { glyph: '✚', color: '#9b5cff', label: 'CABLE ADHESIVO' },
  clock:    { glyph: '◷', color: '#f7ff3c', label: 'TIEMPO CONGELADO' },
  dynamite: { glyph: '✸', color: '#ff3b4e', label: '¡DINAMITA!' },
  life:     { glyph: '♥', color: '#ff5b8a', label: 'VIDA EXTRA' },
  shield:   { glyph: '⛨', color: '#14f0ff', label: 'ESCUDO' },
};
const POWERUP_R = 16;
const POWERUP_DROP_CHANCE = 0.5;   // prob. de soltar un power-up pendiente al reventar
const FREEZE_TIME = 5.0;           // s que congela el reloj
const SHIELD_TIME = 6.0;           // s de escudo
const ADHESIVE_MODE_TIME = 8.0;    // s con disparos adhesivos activos

const COMBO_WINDOW = 1.5;          // s para encadenar combo

// Personajes jugables: dos exploradores chibi propios (azul y naranja).
const CHARACTERS = [
  { name: 'AZUL',    body: '#2f7bff', dark: '#16357a', cap: '#1f5fd6' },
  { name: 'NARANJA', body: '#ff7a1f', dark: '#9c3d05', cap: '#e85c0c' },
];

/* Sprite pixel-art chibi (cabeza grande, cuerpo pequeño) inspirado en los
   exploradores de los arcades de burbujas 90s, pero de diseño propio. Rejilla
   12×16; cada celda es un "pixel" gordo. Códigos:
     . transparente   C gorra        c visera (sombra gorra)
     S piel           E ojo          B traje
     D traje sombra   O botas        W brillo blanco           */
const CHAR_PX = 3;                 // 12*3=36 ancho, 16*3=48 alto (≈20px en el búfer 320×240)
const CHAR_BITMAP = [
  '...CCCCCC...',
  '..CCCCCCCC..',
  '.CCCCCCCCCC.',
  '.cccccccccc.',
  '..SSSSSSSS..',
  '..SSESSESS..',
  '..SSSSSSSS..',
  '...SSSSSS...',
  '..BWBBBBWB..',
  '.BBBBBBBBBB.',
  '.BBDDDDDDBB.',
  '..BDDDDDDB..',
  '..BB....BB..',
  '..BB....BB..',
  '..OO....OO..',
  '............',
];
function charPalette(ch) {
  return { '.':null, 'C':ch.cap, 'c':ch.dark, 'S':'#ffcb94', 'E':'#221a10',
           'B':ch.body, 'D':ch.dark, 'O':'#3a2a14', 'W':'#ffffff' };
}

// Resolución a la que se "pixela" el fondo (look 16-bit). 4:3.
const BG_PX_W = 220, BG_PX_H = 165;
const BG_POSTERIZE = 6;            // niveles de color por canal

const STATE = { TITLE:'title', TRANSITION:'transition', PLAY:'play',
                PAUSE:'pause', GAMEOVER:'gameover', WIN:'win' };

const HISCORE_KEY = 'superpang_superpunk_hiscore';

/* =========================================================================
   2) UTILIDADES
   ========================================================================= */
const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
const rand  = (a, b) => a + Math.random() * (b - a);
const now   = () => performance.now();

function rgba(hex, a) {            // "#rrggbb" + alpha → "rgba(...)"
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
}

// Rectángulo redondeado (para plataformas, HUD, etc.)
function roundRect(c, x, y, w, h, r) {
  r = Math.min(r, w/2, h/2);
  c.beginPath();
  c.moveTo(x+r, y);
  c.arcTo(x+w, y, x+w, y+h, r);
  c.arcTo(x+w, y+h, x, y+h, r);
  c.arcTo(x, y+h, x, y, r);
  c.arcTo(x, y, x+w, y, r);
  c.closePath();
}

// Convierte una imagen en un canvas pixel-art de baja resolución + colores
// posterizados (look 16-bit arcade). Devuelve un <canvas> listo para escalar.
function pixelizeImage(img) {
  const pc = document.createElement('canvas');
  pc.width = BG_PX_W; pc.height = BG_PX_H;
  const p = pc.getContext('2d');
  // Recorte tipo "cover" para que la foto llene el 4:3 sin deformarse.
  const ir = img.width / img.height, tr = BG_PX_W / BG_PX_H;
  let sw = img.width, sh = img.height, sx = 0, sy = 0;
  if (ir > tr) { sw = img.height * tr; sx = (img.width - sw) / 2; }
  else         { sh = img.width / tr;  sy = (img.height - sh) / 2; }
  p.drawImage(img, sx, sy, sw, sh, 0, 0, BG_PX_W, BG_PX_H);
  // Posterizar para reducir la paleta (si el origen es cross-origin/file://
  // getImageData lanza; en ese caso nos quedamos sólo con la pixelación).
  try {
    const id = p.getImageData(0, 0, BG_PX_W, BG_PX_H), d = id.data, L = BG_POSTERIZE;
    for (let i = 0; i < d.length; i += 4) {
      d[i]   = Math.round(d[i]   / 255 * L) / L * 255;
      d[i+1] = Math.round(d[i+1] / 255 * L) / L * 255;
      d[i+2] = Math.round(d[i+2] / 255 * L) / L * 255;
    }
    p.putImageData(id, 0, 0);
  } catch (e) { /* canvas "tainted": dejamos sólo el pixelado */ }
  return pc;
}

/* =========================================================================
   3) AUDIO SINTETIZADO (WebAudio) — sin archivos externos
   ========================================================================= */
const Audio = {
  ctx: null,
  muted: false,
  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { this.ctx = null; }
  },
  // Genera un tono con envolvente rápida.
  tone(freq, dur, type = 'square', vol = 0.12, slideTo = null) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t); osc.stop(t + dur);
  },
  shoot()  { this.tone(880, 0.12, 'square',   0.10, 1760); },
  bounce() { this.tone(220, 0.06, 'sine',     0.06); },
  pop()    { this.tone(520, 0.10, 'sawtooth', 0.12, 180); },
  power()  { this.tone(440, 0.08, 'triangle', 0.12, 990);
             setTimeout(() => this.tone(990, 0.12, 'triangle', 0.12, 1480), 80); },
  death()  { this.tone(300, 0.5, 'sawtooth',  0.16, 60); },
  start()  { this.tone(523, 0.1, 'square', 0.12);
             setTimeout(() => this.tone(784, 0.18, 'square', 0.12), 110); },
  win()    { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>this.tone(f,0.18,'square',0.12),i*120)); },
};

/* =========================================================================
   4) ENTRADA (teclado + táctil unificados en "acciones")
   ========================================================================= */
const Input = {
  // Estado continuo (mantener pulsado) y "edge" (pulsación nueva este frame).
  active: {},       // action -> bool
  pressed: {},      // action -> bool (se consume con consume())
  map: {
    ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down',
    KeyA:'left', KeyD:'right', KeyW:'up', KeyS:'down',
    Space:'fire', Enter:'start', KeyP:'pause', KeyM:'mute', KeyF:'full',
  },
  set(action, on) {
    if (on && !this.active[action]) this.pressed[action] = true;
    this.active[action] = on;
  },
  consume(action) {            // true una sola vez por pulsación
    if (this.pressed[action]) { this.pressed[action] = false; return true; }
    return false;
  },
  init() {
    window.addEventListener('keydown', (e) => {
      const a = this.map[e.code];
      if (a) { e.preventDefault(); this.set(a, true); }
    });
    window.addEventListener('keyup', (e) => {
      const a = this.map[e.code];
      if (a) { e.preventDefault(); this.set(a, false); }
    });

    // Botones táctiles (y también clic con ratón).
    document.querySelectorAll('.tbtn').forEach(btn => {
      const a = this.map[btn.dataset.key] || btn.dataset.key;
      const on  = (e) => { e.preventDefault(); Audio.init(); this.set(a, true); };
      const off = (e) => { e.preventDefault(); this.set(a, false); };
      btn.addEventListener('touchstart', on, {passive:false});
      btn.addEventListener('touchend',   off,{passive:false});
      btn.addEventListener('touchcancel',off,{passive:false});
      btn.addEventListener('mousedown',  on);
      btn.addEventListener('mouseup',    off);
      btn.addEventListener('mouseleave', off);
    });

    // Marca de dispositivo táctil (el layout de los mandos lo gobierna el CSS
    // vía @media (pointer: coarse), pero dejamos la clase por si hace falta).
    if (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) {
      document.body.classList.add('has-touch');
    }
  }
};

/* =========================================================================
   5) ENTIDADES
   ========================================================================= */

// --- Bola rebotante con física parabólica ---
class Ball {
  constructor(x, y, size, dir) {
    this.x = x; this.y = y;
    this.size = size;
    this.r = BALL.radius[size];
    this.vx = BALL.hspeed[size] * (dir || 1);
    this.vy = -BALL.bounceVy[size] * 0.5;   // empieza subiendo un poco
    this.phase = Math.random() * Math.PI * 2; // para la animación de brillo
    this.dead = false;
  }
  update(dt, game) {
    if (game.freezeTimer > 0) return;        // power-up reloj: congeladas
    const prevY = this.y;
    this.vy += GRAVITY * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.phase += dt * 6;

    // Paredes laterales (dentro del marco).
    if (this.x - this.r < PLAY_L)   { this.x = PLAY_L + this.r; this.vx =  Math.abs(this.vx); Audio.bounce(); }
    if (this.x + this.r > PLAY_R)   { this.x = PLAY_R - this.r; this.vx = -Math.abs(this.vx); Audio.bounce(); }
    // Techo.
    if (this.y - this.r < PLAY_T)   { this.y = PLAY_T + this.r; this.vy = Math.abs(this.vy); }
    // Suelo (rebote a altura fija según tamaño).
    if (this.y + this.r > FLOOR_Y)  { this.y = FLOOR_Y - this.r; this.vy = -BALL.bounceVy[this.size]; Audio.bounce(); }

    // Plataformas: rebota sólo sobre su cara superior al caer.
    for (const p of game.platforms) {
      if (p.broken) continue;
      const overlapX = this.x + this.r > p.x && this.x - this.r < p.x + p.w;
      const crossTop = this.vy > 0 && prevY + this.r <= p.y && this.y + this.r >= p.y;
      if (overlapX && crossTop) {
        this.y = p.y - this.r;
        this.vy = -BALL.bounceVy[this.size];
        Audio.bounce();
      }
    }
  }
  draw(c) {
    // Burbuja "glossy" pixel-art: contorno oscuro, relleno con degradado
    // suave hacia la sombra inferior y un brillo blanco grande arriba-izq.
    const [main, light, shade] = BALL.colors[this.size];
    const x = this.x, y = this.y, r = this.r;
    c.save();
    // Contorno oscuro.
    c.fillStyle = shade;
    c.beginPath(); c.arc(x, y, r, 0, Math.PI*2); c.fill();
    // Cuerpo con volumen (claro arriba-izq → oscuro abajo-der).
    const g = c.createRadialGradient(x - r*0.35, y - r*0.4, r*0.1, x, y, r);
    g.addColorStop(0, light);
    g.addColorStop(0.45, main);
    g.addColorStop(1, shade);
    c.fillStyle = g;
    c.beginPath(); c.arc(x, y, r - Math.max(1.5, r*0.07), 0, Math.PI*2); c.fill();
    // Brillo especular grande.
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath(); c.arc(x - r*0.32, y - r*0.34, r*0.26, 0, Math.PI*2); c.fill();
    // Pequeño brillo secundario.
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.beginPath(); c.arc(x + r*0.25, y - r*0.05, r*0.1, 0, Math.PI*2); c.fill();
    c.restore();
  }
}

// --- Arpón / cable vertical ---
class Harpoon {
  constructor(x, baseY, adhesive) {
    this.x = x;
    this.baseY = baseY;       // parte inferior (pies del jugador)
    this.tipY = baseY;        // punta que sube
    this.adhesive = !!adhesive;
    this.stuckTimer = 0;      // sólo para adhesivo al llegar al techo
    this.stuck = false;
    this.dead = false;
  }
  update(dt) {
    if (this.stuck) {                 // adhesivo pegado al techo
      this.stuckTimer -= dt;
      if (this.stuckTimer <= 0) this.dead = true;
      return;
    }
    this.tipY -= HARPOON.speed * dt;
    if (this.tipY <= CEIL_Y) {
      this.tipY = CEIL_Y;
      if (this.adhesive) { this.stuck = true; this.stuckTimer = HARPOON.adhesiveTime; }
      else this.dead = true;          // arpón normal: desaparece al techo
    }
  }
  // ¿Colisiona con una bola? (segmento vertical vs círculo)
  hits(ball) {
    const cy = clamp(ball.y, this.tipY, this.baseY);
    const dx = ball.x - this.x;
    const dy = ball.y - cy;
    return (dx*dx + dy*dy) <= (ball.r + HARPOON.halfW) ** 2;
  }
  draw(c) {
    // Arpón mecánico: cuerda/cadena vertical clara con eslabones + punta metálica.
    // Adhesivo = tono gris-azulado; normal = blanco-azul.
    const wire = this.adhesive ? '#aeb6c2' : '#e6f0ff';
    const dark = this.adhesive ? '#5b6472' : '#5b78a8';
    const x = Math.round(this.x);
    c.save();
    // Cuerda (2 px): núcleo claro + borde oscuro a la izquierda.
    c.fillStyle = dark; c.fillRect(x - 2, this.tipY, 4, this.baseY - this.tipY);
    c.fillStyle = wire; c.fillRect(x - 1, this.tipY, 2, this.baseY - this.tipY);
    // Eslabones/ticks cada 8 px para sensación de cadena.
    c.fillStyle = dark;
    for (let yy = this.tipY + 6; yy < this.baseY; yy += 8) c.fillRect(x - 3, yy, 6, 1);
    // Punta de arpón (flecha gris metálica).
    c.fillStyle = '#dfe6ef';
    c.beginPath();
    c.moveTo(x, this.tipY - 8);
    c.lineTo(x - 5, this.tipY + 3);
    c.lineTo(x + 5, this.tipY + 3);
    c.closePath(); c.fill();
    c.fillStyle = dark; c.fillRect(x - 1, this.tipY - 8, 2, 4);  // brillo central
    c.restore();
  }
}

// --- Power-up que cae y se posa ---
class Powerup {
  constructor(x, y, type) {
    this.x = x; this.y = y; this.type = type;
    this.vy = 0; this.phase = rand(0, 6.28); this.dead = false;
  }
  update(dt, game) {
    const prevY = this.y;
    this.vy += GRAVITY * 0.6 * dt;
    this.y += this.vy * dt;
    this.phase += dt * 4;
    // Posarse en suelo o plataformas.
    if (this.y + POWERUP_R > FLOOR_Y) { this.y = FLOOR_Y - POWERUP_R; this.vy = 0; }
    for (const p of game.platforms) {
      if (p.broken) continue;
      const overlapX = this.x + POWERUP_R > p.x && this.x - POWERUP_R < p.x + p.w;
      const crossTop = this.vy > 0 && prevY + POWERUP_R <= p.y && this.y + POWERUP_R >= p.y;
      if (overlapX && crossTop) { this.y = p.y - POWERUP_R; this.vy = 0; }
    }
  }
  draw(c) {
    const meta = POWERUPS[this.type];
    const pulse = 0.5 + 0.5 * Math.sin(this.phase);
    c.save();
    c.shadowColor = meta.color; c.shadowBlur = 16 + pulse*8;
    c.fillStyle = rgba(meta.color, 0.25);
    roundRect(c, this.x - POWERUP_R, this.y - POWERUP_R, POWERUP_R*2, POWERUP_R*2, 6); c.fill();
    c.strokeStyle = meta.color; c.lineWidth = 2; c.stroke();
    c.shadowBlur = 6;
    c.fillStyle = '#fff';
    c.font = '20px "Press Start 2P", monospace';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(meta.glyph, this.x, this.y + 1);
    c.restore();
  }
}

// --- Partícula de explosión ---
class Particle {
  constructor(x, y, color) {
    this.x = x; this.y = y; this.color = color;
    const a = rand(0, 6.28), s = rand(60, 280);
    this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s;
    this.life = rand(0.3, 0.7); this.max = this.life; this.dead = false;
  }
  update(dt) {
    this.x += this.vx*dt; this.y += this.vy*dt;
    this.vy += GRAVITY * 0.4 * dt;
    this.life -= dt; if (this.life <= 0) this.dead = true;
  }
  draw(c) {
    const a = this.life / this.max;
    c.save(); c.globalAlpha = a;
    c.shadowColor = this.color; c.shadowBlur = 8;
    c.fillStyle = this.color;
    c.fillRect(this.x-2, this.y-2, 4, 4);
    c.restore();
  }
}

// --- Texto flotante (puntos, combos) ---
class FloatText {
  constructor(x, y, text, color) {
    this.x = x; this.y = y; this.text = text; this.color = color;
    this.life = 0.9; this.dead = false;
  }
  update(dt) { this.y -= 40*dt; this.life -= dt; if (this.life<=0) this.dead = true; }
  draw(c) {
    c.save(); c.globalAlpha = clamp(this.life, 0, 1);
    c.shadowColor = this.color; c.shadowBlur = 8;
    c.fillStyle = this.color; c.font = '12px "Press Start 2P", monospace';
    c.textAlign = 'center';
    c.fillText(this.text, this.x, this.y);
    c.restore();
  }
}

// --- Jugador ---
class Player {
  constructor(charIndex) {
    this.char = CHARACTERS[charIndex];
    this.reset();
  }
  reset() {
    this.x = GAME_W/2 - PLAYER.w/2;
    this.y = FLOOR_Y - PLAYER.h;
    this.vy = 0;
    this.dir = 1;            // mirando: -1 izq, +1 der
    this.onLadder = false;
    this.walkPhase = 0;
    this.shootPose = 0;      // > 0 durante la animación de disparo
    this.dying = 0;          // > 0 durante la animación de muerte
    this.invuln = 0;         // s de invulnerabilidad
  }
  get cx() { return this.x + PLAYER.w/2; }
  get feet() { return this.y + PLAYER.h; }

  update(dt, game) {
    if (this.dying > 0) { this.dying -= dt; return; }
    if (this.invuln > 0) this.invuln -= dt;
    if (this.shootPose > 0) this.shootPose -= dt;

    const left = Input.active.left, right = Input.active.right;
    const up = Input.active.up, down = Input.active.down;

    // --- Escaleras ---
    const ladder = this.ladderUnder(game);
    if (ladder && (up || down)) {
      this.onLadder = true;
      this.x = ladder.x + ladder.w/2 - PLAYER.w/2;   // centrar en la escalera
      this.vy = 0;
      if (up)   this.y -= PLAYER.climbSpeed * dt;
      if (down) this.y += PLAYER.climbSpeed * dt;
      // Límites de la escalera.
      this.y = clamp(this.y, ladder.y - PLAYER.h, FLOOR_Y - PLAYER.h);
    } else if (this.onLadder && !this.standingOnLadderEnds(game)) {
      // Sigue en la escalera aunque suelte, hasta llegar a un extremo.
      this.onLadder = !!ladder;
    } else {
      this.onLadder = false;
    }

    // --- Movimiento horizontal (no mientras trepa verticalmente) ---
    if (!this.onLadder || left || right) {
      if (left)  { this.x -= PLAYER.speed * dt; this.dir = -1; this.walkPhase += dt*12; }
      if (right) { this.x += PLAYER.speed * dt; this.dir =  1; this.walkPhase += dt*12; }
      if (left || right) this.onLadder = false;
    }
    this.x = clamp(this.x, PLAY_L, PLAY_R - PLAYER.w);

    // --- Gravedad y aterrizaje (cuando no está en escalera) ---
    if (!this.onLadder) {
      const prevFeet = this.feet;
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      let landed = false;
      // Suelo
      if (this.feet > FLOOR_Y) { this.y = FLOOR_Y - PLAYER.h; this.vy = 0; landed = true; }
      // Plataformas (cara superior)
      for (const p of game.platforms) {
        if (p.broken) continue;
        const overlapX = this.x + PLAYER.w > p.x && this.x < p.x + p.w;
        const crossTop = this.vy >= 0 && prevFeet <= p.y && this.feet >= p.y;
        if (overlapX && crossTop) { this.y = p.y - PLAYER.h; this.vy = 0; landed = true; }
      }
      this.onGround = landed;
    }
  }

  // Escalera bajo el centro del jugador (si la hay).
  ladderUnder(game) {
    for (const l of game.ladders) {
      if (this.cx > l.x && this.cx < l.x + l.w &&
          this.feet >= l.y - 4 && this.y <= l.y + l.h) return l;
    }
    return null;
  }
  standingOnLadderEnds() { return false; }

  hitBy(ball) {
    if (this.dying > 0 || this.invuln > 0) return false;
    // Colisión círculo-rectángulo simple.
    const nx = clamp(ball.x, this.x, this.x + PLAYER.w);
    const ny = clamp(ball.y, this.y, this.y + PLAYER.h);
    return (ball.x-nx)**2 + (ball.y-ny)**2 < ball.r*ball.r;
  }

  draw(c) {
    const ch = this.char;
    const dyingA = this.dying > 0 ? clamp(this.dying/1.2, 0, 1) : 1;
    c.save();
    c.globalAlpha = (this.invuln > 0 && Math.floor(this.invuln*12)%2) ? 0.35 : dyingA;
    const cx = this.cx;
    // Bamboleo de caminar (sólo en el suelo y moviéndose).
    const moving = (Input.active.left || Input.active.right) && this.onGround;
    const bob = moving ? Math.round(Math.abs(Math.sin(this.walkPhase * 0.5))) : 0;
    const baseY = this.y - bob;

    // Animación de muerte: girar.
    if (this.dying > 0) {
      c.translate(cx, baseY + PLAYER.h/2);
      c.rotate((1.2 - this.dying) * 6);
      c.translate(-cx, -(baseY + PLAYER.h/2));
    }
    // Mirar a la izquierda = espejar el sprite.
    if (this.dir < 0) {
      c.translate(cx, 0); c.scale(-1, 1); c.translate(-cx, 0);
    }

    // Sombra ovalada en el suelo (sutil, no neón).
    if (this.dying <= 0) {
      c.fillStyle = 'rgba(0,0,0,0.25)';
      c.beginPath();
      c.ellipse(cx, this.y + PLAYER.h - 2, PLAYER.w*0.42, 4, 0, 0, Math.PI*2);
      c.fill();
    }

    // Sprite pixel-art chibi.
    drawPixelSprite(c, CHAR_BITMAP, charPalette(ch), this.x, baseY, CHAR_PX);

    // Brazos levantados con el arpón al disparar.
    if (this.shootPose > 0) {
      c.fillStyle = ch.body;
      c.fillRect(this.x + CHAR_PX, baseY + 24, CHAR_PX, -14);
      c.fillRect(this.x + PLAYER.w - 2*CHAR_PX, baseY + 24, CHAR_PX, -14);
    }
    c.restore();
  }
}

// Pinta un sprite definido como rejilla de caracteres (cada celda = un pixel
// gordo de tamaño px). Sin sombra por celda (rápido); el glow se hace aparte.
function drawPixelSprite(c, bitmap, palette, ox, oy, px) {
  for (let r = 0; r < bitmap.length; r++) {
    const row = bitmap[r];
    for (let col = 0; col < row.length; col++) {
      const fill = palette[row[col]];
      if (!fill) continue;
      c.fillStyle = fill;
      c.fillRect(ox + col * px, oy + r * px, px, px);
    }
  }
}

/* =========================================================================
   6) ESTADO DEL JUEGO
   ========================================================================= */
const Game = {
  state: STATE.TITLE,
  charIndex: 0,
  // Datos de partida
  score: 0,
  hiscore: parseInt(localStorage.getItem(HISCORE_KEY) || '0', 10),
  lives: 3,
  levelIndex: 0,
  // Entidades vivas
  player: null,
  balls: [],
  harpoons: [],
  powerups: [],
  particles: [],
  texts: [],
  platforms: [],
  ladders: [],
  pendingPowerups: [],
  // Temporizadores / power-ups activos
  time: 0,
  freezeTimer: 0,
  adhesiveTimer: 0,
  maxHarpoons: 1,
  punishTimer: 0,      // tras agotar el tiempo, genera bolas extra
  // Combos
  combo: 0,
  comboTimer: 0,
  // Transiciones
  transTimer: 0,
  flash: 0,            // destello blanco breve
  shake: 0,            // sacudida de pantalla (s)
  blink: 0,            // parpadeo de textos de menú
  // Fondos
  backgrounds: {},     // ruta -> Image (o null si falla)

  // ---- Arranque de una partida nueva ----
  startGame() {
    this.score = 0;
    this.lives = 3;
    this.levelIndex = 0;
    this.player = new Player(this.charIndex);
    this.enterTransition();
    Audio.start();
  },

  // ---- Pantalla "WORLD x-y" antes de jugar ----
  enterTransition() {
    this.state = STATE.TRANSITION;
    this.transTimer = 2.2;
    this.flash = 0.4;
  },

  // ---- Cargar el nivel actual ----
  loadLevel() {
    const lv = LEVELS[this.levelIndex];
    this.platforms = lv.platforms.map(p => ({ ...p, broken: false, hits: 0 }));
    this.ladders   = lv.ladders.map(l => ({ ...l }));
    this.balls     = lv.balls.map(b => new Ball(b.x, b.y, b.size, b.dir));
    this.powerups  = [];
    this.harpoons  = [];
    this.particles = [];
    this.texts     = [];
    this.pendingPowerups = lv.powerups.map(p => ({ ...p }));
    this.time = lv.timeLimit;
    this.freezeTimer = 0;
    this.adhesiveTimer = 0;
    this.maxHarpoons = 1;
    this.punishTimer = 0;
    this.combo = 0; this.comboTimer = 0;
    this.player.reset();
    this.preloadBackground(lv.background, lv.backupGradient);
    this.state = STATE.PLAY;
  },

  // ---- Carga perezosa del fondo: lo convierte a un escenario "pixel-art" ----
  // Guardamos un canvas a baja resolución (BG_PX_W×BG_PX_H) con los colores
  // posterizados; al dibujarlo escalado y sin suavizado se ve como un fondo de
  // arcade de 16 bits (estilo Super Pang), no como una foto.
  preloadBackground(src, backup) {
    if (this.backgrounds[src] !== undefined) return;
    const img = new Image();
    img.onload  = () => { this.backgrounds[src] = pixelizeImage(img); };
    img.onerror = () => { this.backgrounds[src] = null; };  // usaremos degradado
    img.src = src;
    this.backgrounds[src] = 'loading';
  },

  // ---- Disparar arpón ----
  fire() {
    if (this.harpoons.length >= this.maxHarpoons) return;
    // El arpón nace en el centro/pies del jugador.
    const x = this.player.cx;
    const base = this.player.feet;
    this.harpoons.push(new Harpoon(x, base, this.adhesiveTimer > 0));
    this.player.shootPose = 0.25;
    Audio.shoot();
  },

  // ---- Reventar una bola (división en 2 o desaparición) ----
  popBall(ball) {
    if (ball.dead) return;
    ball.dead = true;
    // Combo + puntuación.
    this.comboTimer = COMBO_WINDOW;
    this.combo++;
    const pts = BALL.score[ball.size] * Math.max(1, this.combo);
    this.score += pts;
    this.texts.push(new FloatText(ball.x, ball.y - ball.r,
      this.combo > 1 ? `COMBO x${this.combo}` : `${pts}`,
      this.combo > 1 ? '#f7ff3c' : '#fff'));
    // Partículas (cuadradas, color de la bola).
    const col = BALL.colors[ball.size][0];
    for (let i = 0; i < 12; i++) this.particles.push(new Particle(ball.x, ball.y, col));
    // Sacudida + destello al reventar las grandes.
    if (ball.size <= 1) { this.shake = ball.size === 0 ? 0.22 : 0.12; this.flash = 0.18; }
    Audio.pop();

    // División.
    if (ball.size < 3) {
      const ns = ball.size + 1;
      const a = new Ball(ball.x, ball.y, ns, -1);
      const b = new Ball(ball.x, ball.y, ns,  1);
      a.vy = b.vy = -BALL.splitUp;
      this.balls.push(a, b);
    }

    // Soltar power-up pendiente (probabilístico).
    if (this.pendingPowerups.length &&
        (Math.random() < POWERUP_DROP_CHANCE || this.aliveBalls() <= 1)) {
      const pu = this.pendingPowerups.shift();
      this.powerups.push(new Powerup(ball.x, ball.y, pu.type));
    }
  },

  aliveBalls() { return this.balls.filter(b => !b.dead).length; },

  // ---- Aplicar efecto de power-up ----
  applyPowerup(type) {
    Audio.power();
    const meta = POWERUPS[type];
    this.texts.push(new FloatText(this.player.cx, this.player.y - 10, meta.label, meta.color));
    switch (type) {
      case 'double':   this.maxHarpoons = 2; break;
      case 'adhesive': this.adhesiveTimer = ADHESIVE_MODE_TIME; break;
      case 'clock':    this.freezeTimer = FREEZE_TIME; break;
      case 'life':     this.lives++; break;
      case 'shield':   this.player.invuln = SHIELD_TIME; break;
      case 'dynamite':                       // revienta todas un nivel
        this.balls.filter(b => !b.dead).forEach(b => this.popBall(b));
        this.flash = 0.5;
        break;
    }
  },

  // ---- Muerte del jugador ----
  killPlayer() {
    if (this.player.dying > 0 || this.player.invuln > 0) return;
    this.player.dying = 1.2;
    this.lives--;
    Audio.death();
    for (let i=0;i<20;i++) this.particles.push(new Particle(this.player.cx, this.player.y+20, this.player.char.body));
  },

  saveHiscore() {
    if (this.score > this.hiscore) {
      this.hiscore = this.score;
      localStorage.setItem(HISCORE_KEY, String(this.hiscore));
    }
  },
};

/* =========================================================================
   7) GAME LOOP (update + render con delta-time)
   ========================================================================= */
function update(dt) {
  Game.blink += dt;
  if (Game.flash > 0) Game.flash -= dt;
  if (Game.shake > 0) Game.shake -= dt;

  // ----- Atajos globales (pausa/mute/fullscreen) -----
  if (Input.consume('mute'))  toggleMute();
  if (Input.consume('full'))  toggleFullscreen();

  switch (Game.state) {
    case STATE.TITLE:      updateTitle(dt);      break;
    case STATE.TRANSITION: updateTransition(dt); break;
    case STATE.PLAY:       updatePlay(dt);       break;
    case STATE.PAUSE:      if (Input.consume('pause')) Game.state = STATE.PLAY; break;
    case STATE.GAMEOVER:
    case STATE.WIN:        if (Input.consume('start')) { Game.state = STATE.TITLE; } break;
  }
}

function updateTitle(dt) {
  if (Input.consume('left'))  Game.charIndex = (Game.charIndex + CHARACTERS.length - 1) % CHARACTERS.length;
  if (Input.consume('right')) Game.charIndex = (Game.charIndex + 1) % CHARACTERS.length;
  if (Input.consume('start') || Input.consume('fire')) { Audio.init(); Game.startGame(); }
}

function updateTransition(dt) {
  Game.transTimer -= dt;
  if (Game.transTimer <= 0) Game.loadLevel();
}

function updatePlay(dt) {
  if (Input.consume('pause')) { Game.state = STATE.PAUSE; return; }
  if (Input.consume('fire'))  Game.fire();

  // Temporizador del nivel.
  if (Game.freezeTimer > 0) Game.freezeTimer -= dt;
  if (Game.adhesiveTimer > 0) Game.adhesiveTimer -= dt;
  if (Game.comboTimer > 0) { Game.comboTimer -= dt; if (Game.comboTimer <= 0) Game.combo = 0; }

  Game.time -= dt;
  if (Game.time <= 0) {
    Game.time = 0;
    // Castigo: aparecen bolas pequeñas rápidas cada pocos segundos.
    Game.punishTimer -= dt;
    if (Game.punishTimer <= 0) {
      Game.punishTimer = 3;
      const x = rand(60, GAME_W-60);
      const fast = new Ball(x, 60, 2, Math.random()<0.5?-1:1);
      fast.vx *= 1.8;
      Game.balls.push(fast);
    }
  }

  // Jugador.
  Game.player.update(dt, Game);

  // Si terminó la animación de muerte → reaparecer o game over.
  if (Game.player.dying < 0) {
    Game.player.dying = 0;
    if (Game.lives <= 0) {
      Game.saveHiscore();
      Game.state = STATE.GAMEOVER;
      return;
    }
    Game.player.reset();
    Game.player.invuln = PLAYER.respawnInvuln;
    Game.harpoons = [];
  }

  // Arpones.
  for (const h of Game.harpoons) {
    h.update(dt);
    for (const b of Game.balls) {
      if (!b.dead && h.hits(b)) {
        Game.popBall(b);
        // Plataformas destructibles: si el cable está sobre una, la daña.
        if (!h.adhesive) h.dead = true;   // arpón normal se consume al tocar
        break;
      }
    }
  }
  Game.harpoons = Game.harpoons.filter(h => !h.dead);

  // Plataformas destructibles: se rompen si un arpón adhesivo las cruza.
  for (const p of Game.platforms) {
    if (p.type === 'destructible' && !p.broken) {
      for (const h of Game.harpoons) {
        if (h.x > p.x && h.x < p.x + p.w && h.tipY < p.y) {
          p.hits += dt;
          if (p.hits > 1.2) { p.broken = true;
            for (let i=0;i<10;i++) Game.particles.push(new Particle(p.x+p.w/2, p.y, '#ff7a1f')); }
        }
      }
    }
  }

  // Bolas.
  for (const b of Game.balls) b.update(dt, Game);
  // Colisión bola-jugador.
  for (const b of Game.balls) {
    if (!b.dead && Game.player.hitBy(b)) { Game.killPlayer(); break; }
  }
  Game.balls = Game.balls.filter(b => !b.dead);

  // Power-ups.
  for (const pu of Game.powerups) {
    pu.update(dt, Game);
    const px = clamp(pu.x, Game.player.x, Game.player.x+PLAYER.w);
    const py = clamp(pu.y, Game.player.y, Game.player.y+PLAYER.h);
    if ((pu.x-px)**2 + (pu.y-py)**2 < POWERUP_R*POWERUP_R) {
      Game.applyPowerup(pu.type); pu.dead = true;
    }
  }
  Game.powerups = Game.powerups.filter(p => !p.dead);

  // Partículas y textos.
  for (const p of Game.particles) p.update(dt);
  Game.particles = Game.particles.filter(p => !p.dead);
  for (const t of Game.texts) t.update(dt);
  Game.texts = Game.texts.filter(t => !t.dead);

  // ¿Nivel completado? (sólo si el tiempo no se agotó dejando bolas castigo
  //  infinitas: el nivel se completa cuando NO quedan bolas y el jugador vive)
  if (Game.aliveBalls() === 0 && Game.player.dying === 0 && Game.time > 0) {
    Game.levelIndex++;
    if (Game.levelIndex >= LEVELS.length) {
      Game.saveHiscore();
      Game.state = STATE.WIN;
      Audio.win();
    } else {
      Game.enterTransition();
    }
  } else if (Game.aliveBalls() === 0 && Game.time <= 0 && Game.player.dying === 0) {
    // Si el tiempo se agotó pero limpia las bolas castigo, también pasa.
    Game.levelIndex++;
    if (Game.levelIndex >= LEVELS.length) { Game.saveHiscore(); Game.state = STATE.WIN; Audio.win(); }
    else Game.enterTransition();
  }
}

/* =========================================================================
   8) RENDER
   ========================================================================= */
function render() {
  // Render a baja resolución: limpiamos el búfer y escalamos el contexto para
  // que el resto del código siga dibujando en coords lógicas (800×600). El
  // backing store es 320×240 → al ampliar el canvas por CSS sale pixel-art.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, RES_W, RES_H);
  // Sacudida de pantalla (en píxeles del búfer) durante el shake.
  let sx = 0, sy = 0;
  if (Game.shake > 0) { const a = Game.shake * 8; sx = rand(-a, a); sy = rand(-a, a); }
  ctx.setTransform(RES_SCALE, 0, 0, RES_SCALE, sx, sy);

  switch (Game.state) {
    case STATE.TITLE:      drawTitle();      break;
    case STATE.TRANSITION: drawTransition(); break;
    case STATE.PLAY:
    case STATE.PAUSE:      drawWorld();
                           if (Game.state === STATE.PAUSE) drawPause();
                           break;
    case STATE.GAMEOVER:   drawWorld(); drawGameOver(); break;
    case STATE.WIN:        drawWin(); break;
  }
  // Destello blanco breve al impacto/transición (arcade, sin neón).
  if (Game.flash > 0) {
    ctx.save();
    ctx.globalAlpha = clamp(Game.flash, 0, 0.5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    ctx.restore();
  }
}

// --- Texto arcade: relleno + sombra negra pixelada (1-2px), sin glow ---
function arcadeText(text, x, y, size, color, align='center', shadow=true) {
  ctx.save();
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (shadow) {
    const o = Math.max(2, size * 0.12);
    ctx.fillStyle = '#000';
    ctx.fillText(text, x + o, y + o);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}
const neonText = arcadeText;   // alias (mantener llamadas existentes)

// --- Título arcade grande: contorno negro grueso + relleno con borde claro ---
function arcadeTitle(text, x, y, size, color='#ffd23b') {
  ctx.save();
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // Contorno negro (varias pasadas alrededor para simular outline pixel).
  ctx.fillStyle = '#000';
  const o = Math.max(3, size * 0.08);
  for (let dx = -o; dx <= o; dx += o) for (let dy = -o; dy <= o; dy += o) {
    if (dx || dy) ctx.fillText(text, x + dx, y + dy);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}
const glitchTitle = arcadeTitle;   // alias

// --- Fondo del nivel: escenario pixel-art colorido tipo postal arcade ---
function drawBackground(lv) {
  const bg = Game.backgrounds[lv.background];
  if (bg && bg !== 'loading' && bg !== null) {
    // Escenario pixelado (foto posterizada) escalado SIN suavizado.
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bg, 0, 0, GAME_W, GAME_H);
    ctx.imageSmoothingEnabled = true;
    // Tinte muy tenue para unificar la paleta (no oscurece).
    ctx.globalAlpha = 0.12; ctx.fillStyle = lv.tint;
    ctx.fillRect(0, 0, GAME_W, FLOOR_Y); ctx.globalAlpha = 1;
  } else {
    // Respaldo: cielo arcade brillante (azul cyan → blanco) sobre suelo.
    const g = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
    g.addColorStop(0, '#2bb6ff'); g.addColorStop(0.7, '#9be3ff'); g.addColorStop(1, '#e7f7ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, GAME_W, FLOOR_Y);
    // Colinas lejanas para dar profundidad.
    ctx.fillStyle = '#7fc08a';
    ctx.beginPath(); ctx.moveTo(0, FLOOR_Y);
    for (let x=0; x<=GAME_W; x+=80) ctx.lineTo(x, FLOOR_Y - 60 - 30*Math.sin(x*0.01));
    ctx.lineTo(GAME_W, FLOOR_Y); ctx.closePath(); ctx.fill();
  }
}

// --- Suelo, plataformas y escaleras (estilo arcade pixel-art) ---
function drawTerrain() {
  // Suelo de tierra con borde superior de hierba.
  ctx.fillStyle = '#6b4a2b';
  ctx.fillRect(PLAY_L, FLOOR_Y, PLAY_R - PLAY_L, GAME_H - FLOOR_Y);
  ctx.fillStyle = '#8a6438';
  ctx.fillRect(PLAY_L, FLOOR_Y, PLAY_R - PLAY_L, 6);
  ctx.fillStyle = '#5aa84a';                       // franja de hierba
  ctx.fillRect(PLAY_L, FLOOR_Y - 4, PLAY_R - PLAY_L, 4);

  // Escaleras: travesaños amarillos con postes marrones.
  for (const l of Game.ladders) {
    const bottom = FLOOR_Y;
    ctx.fillStyle = '#7a4a1c';
    ctx.fillRect(l.x, l.y, 3, bottom - l.y);
    ctx.fillRect(l.x + l.w - 3, l.y, 3, bottom - l.y);
    ctx.fillStyle = '#ffcf4d';
    for (let yy = l.y + 4; yy < bottom; yy += 14) ctx.fillRect(l.x, yy, l.w, 4);
  }

  // Plataformas: interior blanco/gris, borde azul, sombra inferior.
  for (const p of Game.platforms) {
    if (p.broken) continue;
    const destr = p.type === 'destructible';
    // Sombra inferior azul oscuro.
    ctx.fillStyle = '#16357a';
    ctx.fillRect(p.x, p.y + p.h, p.w, 4);
    // Borde azul.
    ctx.fillStyle = destr ? '#c8771f' : '#2f6bd6';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    // Relleno claro.
    ctx.fillStyle = destr ? '#ffd89a' : '#eaf2ff';
    ctx.fillRect(p.x + 2, p.y + 2, p.w - 4, p.h - 4);
    // Grietas (parpadeo) si la destructible está dañada.
    if (destr && p.hits > 0) {
      ctx.fillStyle = '#9c3d05';
      const n = Math.floor(clamp(p.hits/1.2,0,1) * 4);
      for (let i=0;i<n;i++) ctx.fillRect(p.x + 8 + i*(p.w-16)/4, p.y+3, 2, p.h-6);
    }
  }
}

// --- Marco decorativo de tiles alrededor del área jugable ---
function drawFrame() {
  // Color del marco según el mundo (azul por defecto, dorado en algunos).
  const gold = (Game.levelIndex % 3) === 2;
  const c1 = gold ? '#ffcf4d' : '#2f6bd6';   // claro
  const c2 = gold ? '#a9791a' : '#16357a';   // oscuro
  const t = FRAME;
  // Bandas del marco (arriba, izquierda, derecha). Abajo lo cubre el HUD.
  ctx.fillStyle = c2;
  ctx.fillRect(0, 0, GAME_W, t);             // arriba
  ctx.fillRect(0, 0, t, FLOOR_Y);            // izquierda
  ctx.fillRect(GAME_W - t, 0, t, FLOOR_Y);   // derecha
  // Azulejos cuadrados claros para textura.
  ctx.fillStyle = c1;
  for (let x = 0; x < GAME_W; x += t*2) ctx.fillRect(x + 3, 3, t - 6, t - 6);
  for (let y = t; y < FLOOR_Y; y += t*2) {
    ctx.fillRect(3, y + 3, t - 6, t - 6);
    ctx.fillRect(GAME_W - t + 3, y + 3, t - 6, t - 6);
  }
}

// --- HUD inferior estilo arcade clásico (dentro del canvas) ---
function drawHUD() {
  const lv = LEVELS[Game.levelIndex];
  const top = HUD_Y;                          // el HUD ocupa de HUD_Y a GAME_H
  // Panel azul oscuro con borde superior.
  ctx.fillStyle = '#04102e';
  ctx.fillRect(0, top, GAME_W, GAME_H - top);
  ctx.fillStyle = '#2f6bd6';
  ctx.fillRect(0, top, GAME_W, 3);

  // Fila superior del HUD: marcadores.
  const y1 = top + 22, y2 = top + 46;
  arcadeText('1P', 18, y1, 16, '#3bd0ff', 'left');
  arcadeText(String(Game.score).padStart(7,'0'), 18, y2, 18, '#ffffff', 'left');

  arcadeText('HI-SCORE', GAME_W/2, y1, 16, '#ffd23b');
  arcadeText(String(Game.hiscore).padStart(7,'0'), GAME_W/2, y2, 18, '#ffd23b');

  arcadeText('WORLD ' + lv.id, GAME_W - 18, y1, 16, '#ff9a3b', 'right');
  const tcol = Game.time <= 10 ? '#ff4d4d' : '#ffffff';
  arcadeText('TIME ' + String(Math.ceil(Game.time)).padStart(3,'0'), GAME_W - 18, y2, 18, tcol, 'right');

  // Fila inferior: vidas (cabecitas del personaje) y power-ups activos.
  const y3 = top + 72;
  for (let i = 0; i < Game.lives; i++) {
    const lx = 22 + i*34;
    ctx.fillStyle = Game.player.char.cap;     // gorra
    ctx.fillRect(lx, y3 - 8, 18, 8);
    ctx.fillStyle = '#ffcb94';                // cara
    ctx.fillRect(lx + 2, y3, 14, 10);
    ctx.fillStyle = '#221a10';                // ojos
    ctx.fillRect(lx + 5, y3 + 3, 2, 2); ctx.fillRect(lx + 11, y3 + 3, 2, 2);
  }

  // Barra de progreso del nivel (bolas eliminadas) abajo-derecha.
  const total = LEVELS[Game.levelIndex].balls.length;
  const frac = total ? clamp(1 - Game.aliveBalls() / (total*2), 0, 1) : 0;
  const bw = 220, bx = GAME_W - bw - 18, by = y3 - 6;
  ctx.fillStyle = '#0a1f4a'; ctx.fillRect(bx, by, bw, 14);
  const fg = ctx.createLinearGradient(bx, 0, bx+bw, 0);
  fg.addColorStop(0,'#3bd0ff'); fg.addColorStop(0.5,'#46d65a'); fg.addColorStop(1,'#ffd23b');
  ctx.fillStyle = fg; ctx.fillRect(bx+1, by+1, (bw-2)*frac, 12);
  ctx.fillStyle = '#2f6bd6'; ctx.fillRect(bx, by, bw, 1); ctx.fillRect(bx, by+13, bw, 1);

  // Iconos de power-up activos (pequeños, sin neón).
  let ix = bx - 26;
  const pu = (g,col) => { arcadeText(g, ix, y3+2, 16, col); ix -= 26; };
  if (Game.maxHarpoons > 1) pu('⇈', '#3bd0ff');
  if (Game.adhesiveTimer>0) pu('✚', '#c0a6ff');
  if (Game.freezeTimer>0)   pu('◷', '#ffd23b');
  if (Game.player && Game.player.invuln > PLAYER.respawnInvuln) pu('⛨', '#3bd0ff');
}

// --- Mundo en juego ---
function drawWorld() {
  const lv = LEVELS[Game.levelIndex];
  drawBackground(lv);
  drawTerrain();
  for (const b of Game.balls) b.draw(ctx);
  for (const h of Game.harpoons) h.draw(ctx);
  for (const pu of Game.powerups) pu.draw(ctx);
  for (const p of Game.particles) p.draw(ctx);
  if (Game.player) Game.player.draw(ctx);
  for (const t of Game.texts) t.draw(ctx);
  drawFrame();      // marco encima del escenario
  drawHUD();        // HUD inferior encima de todo
}

// Cielo arcade reutilizable para menús.
function arcadeSky() {
  const g = ctx.createLinearGradient(0,0,0,GAME_H);
  g.addColorStop(0,'#1a6bd6'); g.addColorStop(0.6,'#3bb6ff'); g.addColorStop(1,'#bdeeff');
  ctx.fillStyle = g; ctx.fillRect(0,0,GAME_W,GAME_H);
}

// --- Pantalla de título ---
function drawTitle() {
  arcadeSky();
  drawFrame();
  // Logo arcade.
  arcadeTitle('SUPER PANG', GAME_W/2, 130, 64, '#ffd23b');
  arcadeTitle('DE LA COMARCA', GAME_W/2, 200, 34, '#ffffff');

  // Selector de personaje (sprites reales).
  arcadeText('ELIGE PERSONAJE   ← →', GAME_W/2, 290, 18, '#ffffff');
  for (let i=0;i<CHARACTERS.length;i++) {
    const cx = GAME_W/2 + (i-0.5)*150;
    const sel = i === Game.charIndex;
    const sc = sel ? 3.6 : 2.6;               // sprite más grande si seleccionado
    const sw = 12*sc, sh = 16*sc;
    if (sel) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      roundRect(ctx, cx - sw/2 - 8, 330, sw + 16, sh + 16, 8); ctx.fill();
      ctx.fillStyle = '#ffd23b'; ctx.fillRect(cx - sw/2 - 8, 330, sw+16, 4);
    }
    drawPixelSprite(ctx, CHAR_BITMAP, charPalette(CHARACTERS[i]), cx - sw/2, 338, sc);
    arcadeText(CHARACTERS[i].name, cx, 338 + sh + 22, 12, sel ? '#04102e' : '#04102e');
  }

  if (Math.floor(Game.blink*1.6)%2)
    arcadeTitle('PRESS START', GAME_W/2, 470, 26, '#ff3b4e');
  arcadeText('ENTER · ESPACIO · FIRE', GAME_W/2, 510, 12, '#04102e', 'center', false);
  arcadeText('Homenaje arcade a SUPER PANG · diseño y assets propios', GAME_W/2, 560, 9, '#04102e', 'center', false);
}

// --- Transición "WORLD x-y · READY" ---
function drawTransition() {
  const lv = LEVELS[Game.levelIndex];
  drawBackground(lv);
  drawFrame();
  ctx.fillStyle = 'rgba(4,16,46,0.6)'; ctx.fillRect(FRAME, FRAME, GAME_W-2*FRAME, FLOOR_Y-FRAME);
  arcadeTitle('WORLD ' + lv.id, GAME_W/2, GAME_H/2 - 50, 56, '#ffd23b');
  arcadeText(lv.name.toUpperCase(), GAME_W/2, GAME_H/2 + 16, 18, '#ffffff');
  if (Math.floor(Game.blink*2)%2) arcadeTitle('READY?', GAME_W/2, GAME_H/2 + 80, 28, '#3bd0ff');
  drawHUD();
}

function drawPause() {
  ctx.fillStyle = 'rgba(4,16,46,0.7)'; ctx.fillRect(0,0,GAME_W,GAME_H);
  arcadeTitle('PAUSA', GAME_W/2, GAME_H/2 - 10, 56, '#ffd23b');
  if (Math.floor(Game.blink*1.6)%2) arcadeText('PULSA P PARA CONTINUAR', GAME_W/2, GAME_H/2+60, 14, '#ffffff');
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(20,4,8,0.8)'; ctx.fillRect(0,0,GAME_W,GAME_H);
  arcadeTitle('GAME OVER', GAME_W/2, GAME_H/2 - 50, 56, '#ff3b4e');
  arcadeText('SCORE  ' + String(Game.score).padStart(7,'0'), GAME_W/2, GAME_H/2 + 24, 16, '#ffffff');
  arcadeText('HI-SCORE  ' + String(Game.hiscore).padStart(7,'0'), GAME_W/2, GAME_H/2 + 54, 16, '#ffd23b');
  if (Math.floor(Game.blink*1.6)%2) arcadeText('PRESS ENTER', GAME_W/2, GAME_H/2 + 120, 14, '#3bd0ff');
}

function drawWin() {
  arcadeSky();
  drawFrame();
  // Confeti pixel.
  for (let i=0;i<40;i++){
    ctx.fillStyle = ['#ff3b4e','#3bd0ff','#ffd23b','#46d65a'][i%4];
    const x = (i*73 + Game.blink*60*((i%3)+1)) % GAME_W;
    const y = (i*97 + Game.blink*80) % GAME_H;
    ctx.fillRect(x, y, 5, 5);
  }
  arcadeTitle('¡VICTORIA!', GAME_W/2, 170, 60, '#ffd23b');
  arcadeText('HAS LIBERADO LA COMARCA', GAME_W/2, 250, 16, '#04102e');
  arcadeText('SCORE FINAL  ' + String(Game.score).padStart(7,'0'), GAME_W/2, 320, 16, '#04102e');
  arcadeText('HI-SCORE  ' + String(Game.hiscore).padStart(7,'0'), GAME_W/2, 355, 14, '#04102e');
  if (Math.floor(Game.blink*1.6)%2) arcadeTitle('PRESS ENTER', GAME_W/2, 450, 24, '#ff3b4e');
}

/* =========================================================================
   9) UTILIDADES UI / BOOTSTRAP
   ========================================================================= */
function toggleMute() {
  Audio.muted = !Audio.muted;
  document.getElementById('btn-mute').textContent = Audio.muted ? '✕' : '♪';
}
function toggleFullscreen() {
  const el = document.getElementById('cabinet');
  if (!document.fullscreenElement) (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
  else document.exitFullscreen();
}

function bindUtilButtons() {
  document.getElementById('btn-pause').addEventListener('click', () => {
    if (Game.state === STATE.PLAY) Game.state = STATE.PAUSE;
    else if (Game.state === STATE.PAUSE) Game.state = STATE.PLAY;
  });
  document.getElementById('btn-mute').addEventListener('click', () => { Audio.init(); toggleMute(); });
  document.getElementById('btn-full').addEventListener('click', toggleFullscreen);
}

// Bucle principal con delta-time (independiente del refresco/PC).
let last = now();
function loop() {
  const t = now();
  let dt = (t - last) / 1000;
  last = t;
  dt = Math.min(dt, 0.05);     // evita saltos enormes (pestaña en 2º plano)
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function boot() {
  Input.init();
  bindUtilButtons();
  // Precarga los fondos de todos los niveles para que la transición sea fluida.
  LEVELS.forEach(lv => Game.preloadBackground(lv.background, lv.backupGradient));
  requestAnimationFrame(loop);
}

// Arrancar cuando el DOM esté listo.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();
