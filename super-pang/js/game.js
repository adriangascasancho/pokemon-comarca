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

const GAME_W = 800;          // resolución lógica (fija; el CSS escala)
const GAME_H = 600;
const FLOOR_Y = 560;         // y del suelo (debajo es zona de suelo)
const CEIL_Y = 0;            // techo (tope del arpón)

const GRAVITY = 900;         // px/s² para bolas y jugador

// Bolas: 4 tamaños (0=grande … 3=diminuta).
const BALL = {
  radius:   [40, 26, 16, 9],
  // Velocidad vertical (px/s) que se aplica al rebotar en el suelo: las
  // grandes rebotan más alto. Calculado para alcanzar alturas decrecientes.
  bounceVy: [929, 805, 671, 537],
  hspeed:   [110, 125, 140, 158],   // velocidad horizontal por tamaño
  score:    [50, 100, 200, 400],    // puntos al reventar (× combo)
  splitUp:  520,                     // impulso vertical al dividirse
  colors: [                          // pares [interior, borde neón] por tamaño
    ['#ff8df0', '#ff2bd6'],
    ['#a98bff', '#9b5cff'],
    ['#8df6ff', '#14f0ff'],
    ['#f9ff9c', '#f7ff3c'],
  ],
};

const PLAYER = {
  w: 34, h: 46,
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
  dynamite: { glyph: '✸', color: '#ff2bd6', label: '¡DINAMITA!' },
  life:     { glyph: '♥', color: '#ff5b8a', label: 'VIDA EXTRA' },
  shield:   { glyph: '⛨', color: '#14f0ff', label: 'ESCUDO' },
};
const POWERUP_R = 16;
const POWERUP_DROP_CHANCE = 0.5;   // prob. de soltar un power-up pendiente al reventar
const FREEZE_TIME = 5.0;           // s que congela el reloj
const SHIELD_TIME = 6.0;           // s de escudo
const ADHESIVE_MODE_TIME = 8.0;    // s con disparos adhesivos activos

const COMBO_WINDOW = 1.5;          // s para encadenar combo

// Personajes jugables (guiño a los hermanos del original).
const CHARACTERS = [
  { name: 'CYAN',    body: '#14f0ff', glow: '#14f0ff', dark: '#0a6f7a' },
  { name: 'MAGENTA', body: '#ff2bd6', glow: '#ff2bd6', dark: '#7a0a63' },
];

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

    // Mostrar mando táctil en dispositivos con puntero grueso.
    if (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) {
      document.getElementById('touch-controls').classList.add('show');
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

    // Paredes laterales.
    if (this.x - this.r < 0)        { this.x = this.r;          this.vx =  Math.abs(this.vx); Audio.bounce(); }
    if (this.x + this.r > GAME_W)   { this.x = GAME_W - this.r; this.vx = -Math.abs(this.vx); Audio.bounce(); }
    // Techo.
    if (this.y - this.r < CEIL_Y)   { this.y = CEIL_Y + this.r; this.vy = Math.abs(this.vy); }
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
    const [fill, edge] = BALL.colors[this.size];
    const pulse = 0.5 + 0.5 * Math.sin(this.phase);
    // Estela/halo.
    c.save();
    c.shadowColor = edge;
    c.shadowBlur = 18 + pulse * 10;
    const g = c.createRadialGradient(this.x - this.r*0.3, this.y - this.r*0.3, this.r*0.1,
                                     this.x, this.y, this.r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.4, fill);
    g.addColorStop(1, edge);
    c.fillStyle = g;
    c.beginPath(); c.arc(this.x, this.y, this.r, 0, Math.PI*2); c.fill();
    // Anillo de energía exterior.
    c.shadowBlur = 0;
    c.strokeStyle = rgba(edge, 0.8);
    c.lineWidth = 2;
    c.beginPath(); c.arc(this.x, this.y, this.r + 2 + pulse*2, 0, Math.PI*2); c.stroke();
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
    c.save();
    const col = this.adhesive ? '#9b5cff' : '#14f0ff';
    c.shadowColor = col; c.shadowBlur = 14;
    c.strokeStyle = col; c.lineWidth = HARPOON.halfW * 2;
    c.beginPath(); c.moveTo(this.x, this.baseY); c.lineTo(this.x, this.tipY); c.stroke();
    // Punta brillante.
    c.fillStyle = '#ffffff';
    c.beginPath(); c.arc(this.x, this.tipY, HARPOON.halfW + 2, 0, Math.PI*2); c.fill();
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
    this.x = clamp(this.x, 0, GAME_W - PLAYER.w);

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
    const cx = this.cx, baseY = this.y;
    if (this.dying > 0) c.translate(cx, baseY + PLAYER.h/2),
                        c.rotate((1.2 - this.dying) * 6), c.translate(-cx, -(baseY+PLAYER.h/2));

    // Cuerpo redondeado tipo "criatura" con gradiente neón.
    c.shadowColor = ch.glow; c.shadowBlur = 16;
    const g = c.createLinearGradient(0, baseY, 0, baseY + PLAYER.h);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.4, ch.body);
    g.addColorStop(1, ch.dark);
    c.fillStyle = g;
    roundRect(c, this.x, baseY, PLAYER.w, PLAYER.h, 12); c.fill();
    // Borde neón
    c.shadowBlur = 6; c.strokeStyle = ch.glow; c.lineWidth = 2; c.stroke();

    // Ojos (miran en la dirección de avance).
    c.shadowBlur = 0; c.fillStyle = '#04121a';
    const eo = this.dir * 4;
    c.beginPath(); c.arc(cx - 7 + eo, baseY + 16, 4, 0, 6.28); c.fill();
    c.beginPath(); c.arc(cx + 7 + eo, baseY + 16, 4, 0, 6.28); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(cx - 7 + eo + this.dir, baseY + 15, 1.5, 0, 6.28); c.fill();
    c.beginPath(); c.arc(cx + 7 + eo + this.dir, baseY + 15, 1.5, 0, 6.28); c.fill();

    // Patitas animadas al andar.
    c.fillStyle = ch.dark;
    const lp = Math.sin(this.walkPhase) * 4;
    c.fillRect(this.x + 6, baseY + PLAYER.h - 4, 8, 6 + (this.onGround? lp : 0));
    c.fillRect(this.x + PLAYER.w - 14, baseY + PLAYER.h - 4, 8, 6 - (this.onGround? lp : 0));

    // Brazos arriba si está disparando.
    if (this.shootPose > 0) {
      c.strokeStyle = ch.glow; c.lineWidth = 3; c.shadowColor = ch.glow; c.shadowBlur = 8;
      c.beginPath(); c.moveTo(this.x+4, baseY+22); c.lineTo(this.x-2, baseY+6); c.stroke();
      c.beginPath(); c.moveTo(this.x+PLAYER.w-4, baseY+22); c.lineTo(this.x+PLAYER.w+2, baseY+6); c.stroke();
    }
    c.restore();
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
  flash: 0,            // efecto glitch al cambiar de pantalla
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

  // ---- Carga perezosa del fondo (con respaldo si no existe) ----
  preloadBackground(src, backup) {
    if (this.backgrounds[src] !== undefined) return;
    const img = new Image();
    img.onload  = () => { this.backgrounds[src] = img; };
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
    // Partículas.
    const col = BALL.colors[ball.size][1];
    for (let i = 0; i < 12; i++) this.particles.push(new Particle(ball.x, ball.y, col));
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
    for (let i=0;i<20;i++) this.particles.push(new Particle(this.player.cx, this.player.y+20, this.player.char.glow));
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
            for (let i=0;i<10;i++) Game.particles.push(new Particle(p.x+p.w/2, p.y, '#9b5cff')); }
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
  ctx.clearRect(0, 0, GAME_W, GAME_H);
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
  // Glitch flash global en transiciones / dinamita.
  if (Game.flash > 0) {
    ctx.save();
    ctx.globalAlpha = clamp(Game.flash, 0, 0.6);
    ctx.fillStyle = Math.floor(Game.blink*30)%2 ? '#14f0ff' : '#ff2bd6';
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    ctx.restore();
  }
}

// --- Texto neón con glow ---
function neonText(text, x, y, size, color, align='center') {
  ctx.save();
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.shadowColor = color; ctx.shadowBlur = 16;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// --- Título con aberración cromática (glitch) ---
function glitchTitle(text, x, y, size) {
  const off = 2 + Math.sin(Game.blink*8) * 2;
  ctx.save();
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = '#ff2bd6'; ctx.fillText(text, x - off, y);
  ctx.fillStyle = '#14f0ff'; ctx.fillText(text, x + off, y);
  ctx.fillStyle = '#ffffff'; ctx.fillText(text, x, y);
  ctx.restore();
}

// --- Fondo del nivel (foto tintada o degradado de respaldo) ---
function drawBackground(lv) {
  const img = Game.backgrounds[lv.background];
  if (img && img !== 'loading' && img !== null) {
    // Foto del pueblo, oscurecida.
    ctx.drawImage(img, 0, 0, GAME_W, GAME_H);
    ctx.fillStyle = 'rgba(2,0,12,0.55)';            // oscurecer
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    ctx.fillStyle = lv.tint;                         // tinte neón
    ctx.fillRect(0, 0, GAME_W, GAME_H);
  } else {
    // Respaldo: degradado neón vertical.
    const g = ctx.createLinearGradient(0, 0, 0, GAME_H);
    g.addColorStop(0, lv.backupGradient[0]);
    g.addColorStop(1, lv.backupGradient[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, GAME_W, GAME_H);
  }
  // Rejilla neón cyberpunk sobre el fondo.
  ctx.save();
  ctx.strokeStyle = 'rgba(155,92,255,0.12)'; ctx.lineWidth = 1;
  for (let x=0; x<=GAME_W; x+=40){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,GAME_H); ctx.stroke(); }
  for (let y=0; y<=GAME_H; y+=40){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(GAME_W,y); ctx.stroke(); }
  ctx.restore();
}

// --- Suelo, plataformas y escaleras ---
function drawTerrain() {
  // Suelo neón.
  ctx.save();
  ctx.fillStyle = 'rgba(10,0,20,0.85)';
  ctx.fillRect(0, FLOOR_Y, GAME_W, GAME_H - FLOOR_Y);
  ctx.shadowColor = '#ff2bd6'; ctx.shadowBlur = 12;
  ctx.strokeStyle = '#ff2bd6'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, FLOOR_Y); ctx.lineTo(GAME_W, FLOOR_Y); ctx.stroke();
  ctx.restore();

  // Escaleras.
  for (const l of Game.ladders) {
    ctx.save();
    ctx.shadowColor = '#14f0ff'; ctx.shadowBlur = 8;
    ctx.strokeStyle = '#14f0ff'; ctx.lineWidth = 3;
    const bottom = FLOOR_Y;
    ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.x, bottom); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(l.x+l.w, l.y); ctx.lineTo(l.x+l.w, bottom); ctx.stroke();
    ctx.lineWidth = 2;
    for (let yy=l.y+8; yy<bottom; yy+=16) {
      ctx.beginPath(); ctx.moveTo(l.x, yy); ctx.lineTo(l.x+l.w, yy); ctx.stroke();
    }
    ctx.restore();
  }

  // Plataformas.
  for (const p of Game.platforms) {
    if (p.broken) continue;
    const col = p.type === 'destructible' ? '#9b5cff' : '#14f0ff';
    ctx.save();
    ctx.shadowColor = col; ctx.shadowBlur = 12;
    ctx.fillStyle = rgba(col, 0.18);
    roundRect(ctx, p.x, p.y, p.w, p.h, 5); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
    if (p.type === 'destructible') {     // parpadeo si está dañada
      ctx.globalAlpha = 0.4 + 0.4*Math.sin(Game.blink*10);
      ctx.fillStyle = col; ctx.fillRect(p.x, p.y-2, p.w * clamp(p.hits/1.2,0,1), 2);
    }
    ctx.restore();
  }
}

// --- HUD estilo arcade ---
function drawHUD() {
  const lv = LEVELS[Game.levelIndex];
  ctx.save();
  // Barra superior semitransparente.
  ctx.fillStyle = 'rgba(5,0,15,0.55)';
  ctx.fillRect(0, 0, GAME_W, 40);

  neonText('1P', 16, 14, 10, '#14f0ff', 'left');
  neonText(String(Game.score).padStart(6,'0'), 16, 28, 12, '#fff', 'left');

  neonText('HI-SCORE', GAME_W/2, 14, 10, '#f7ff3c');
  neonText(String(Game.hiscore).padStart(6,'0'), GAME_W/2, 28, 12, '#f7ff3c');

  neonText(`WORLD ${lv.id}`, GAME_W-16, 14, 10, '#ff2bd6', 'right');
  // TIME (rojo si queda poco).
  const tcol = Game.time <= 10 ? '#ff4d4d' : '#fff';
  neonText('TIME ' + String(Math.ceil(Game.time)).padStart(3,'0'), GAME_W-16, 28, 12, tcol, 'right');

  // Vidas (iconos del personaje) abajo-izquierda.
  for (let i=0;i<Game.lives;i++) {
    ctx.save();
    ctx.shadowColor = Game.player.char.glow; ctx.shadowBlur = 8;
    ctx.fillStyle = Game.player.char.body;
    roundRect(ctx, 14 + i*22, GAME_H-26, 14, 18, 4); ctx.fill();
    ctx.restore();
  }

  // Indicadores de power-up activo.
  let ix = GAME_W - 24;
  if (Game.maxHarpoons > 1) { neonText('⇈', ix, GAME_H-16, 16, '#14f0ff'); ix -= 28; }
  if (Game.adhesiveTimer>0) { neonText('✚', ix, GAME_H-16, 16, '#9b5cff'); ix -= 28; }
  if (Game.freezeTimer>0)   { neonText('◷', ix, GAME_H-16, 16, '#f7ff3c'); ix -= 28; }
  if (Game.player && Game.player.invuln > PLAYER.respawnInvuln) neonText('⛨', ix, GAME_H-16, 16, '#14f0ff');
  ctx.restore();
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
  drawHUD();
}

// --- Pantalla de título ---
function drawTitle() {
  // Fondo degradado animado.
  const g = ctx.createLinearGradient(0,0,0,GAME_H);
  g.addColorStop(0,'#1a0033'); g.addColorStop(1,'#05000c');
  ctx.fillStyle = g; ctx.fillRect(0,0,GAME_W,GAME_H);

  // Rejilla en perspectiva (suelo synthwave).
  ctx.save();
  ctx.strokeStyle = 'rgba(255,43,214,0.25)'; ctx.lineWidth = 1;
  for (let i=0;i<14;i++){ const y=GAME_H/2 + i*i*1.6; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(GAME_W,y); ctx.stroke(); }
  for (let x=-10;x<=10;x++){ ctx.beginPath(); ctx.moveTo(GAME_W/2,GAME_H/2); ctx.lineTo(GAME_W/2 + x*120, GAME_H); ctx.stroke(); }
  ctx.restore();

  glitchTitle('SUPER PANG', GAME_W/2, 150, 44);
  glitchTitle('SUPERPUNK', GAME_W/2, 210, 30);
  neonText('· SUPERPUNK EDITION ·', GAME_W/2, 250, 11, '#9b5cff');

  // Selector de personaje.
  neonText('ELIGE PERSONAJE  (← →)', GAME_W/2, 320, 11, '#f7ff3c');
  for (let i=0;i<CHARACTERS.length;i++) {
    const cx = GAME_W/2 + (i-0.5)*120;
    const sel = i === Game.charIndex;
    ctx.save();
    ctx.shadowColor = CHARACTERS[i].glow; ctx.shadowBlur = sel? 24:8;
    ctx.globalAlpha = sel? 1 : 0.5;
    const g2 = ctx.createLinearGradient(0,350,0,410);
    g2.addColorStop(0,'#fff'); g2.addColorStop(0.4,CHARACTERS[i].body); g2.addColorStop(1,CHARACTERS[i].dark);
    ctx.fillStyle = g2; roundRect(ctx, cx-22, 350, 44, 56, 14); ctx.fill();
    if (sel){ ctx.strokeStyle=CHARACTERS[i].glow; ctx.lineWidth=3; ctx.stroke(); }
    ctx.restore();
  }

  if (Math.floor(Game.blink*1.6)%2)
    neonText('PRESS START / INSERT COIN', GAME_W/2, 470, 14, '#fff');
  neonText('ENTER · ESPACIO', GAME_W/2, 505, 9, '#14f0ff');
  neonText('Inspirado en SUPER PANG / PANG (Buster Bros) © Mitchell/Capcom 1989-90', GAME_W/2, 560, 7, 'rgba(155,92,255,0.7)');
  neonText('Homenaje fan · estética superpunk', GAME_W/2, 578, 7, 'rgba(155,92,255,0.6)');
}

// --- Transición "WORLD x-y" ---
function drawTransition() {
  const lv = LEVELS[Game.levelIndex];
  drawBackground(lv);
  ctx.fillStyle = 'rgba(5,0,15,0.6)'; ctx.fillRect(0,0,GAME_W,GAME_H);
  glitchTitle(`WORLD ${lv.id}`, GAME_W/2, GAME_H/2 - 20, 40);
  neonText(lv.name.toUpperCase(), GAME_W/2, GAME_H/2 + 30, 16, '#f7ff3c');
  neonText('READY?', GAME_W/2, GAME_H/2 + 80, 12, '#14f0ff');
}

function drawPause() {
  ctx.fillStyle = 'rgba(5,0,15,0.7)'; ctx.fillRect(0,0,GAME_W,GAME_H);
  glitchTitle('PAUSA', GAME_W/2, GAME_H/2 - 10, 40);
  if (Math.floor(Game.blink*1.6)%2) neonText('PULSA P PARA CONTINUAR', GAME_W/2, GAME_H/2+50, 11, '#fff');
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(20,0,5,0.78)'; ctx.fillRect(0,0,GAME_W,GAME_H);
  glitchTitle('GAME OVER', GAME_W/2, GAME_H/2 - 40, 44);
  neonText('SCORE  ' + String(Game.score).padStart(6,'0'), GAME_W/2, GAME_H/2 + 20, 14, '#fff');
  neonText('HI-SCORE  ' + String(Game.hiscore).padStart(6,'0'), GAME_W/2, GAME_H/2 + 50, 14, '#f7ff3c');
  if (Math.floor(Game.blink*1.6)%2) neonText('PRESS ENTER', GAME_W/2, GAME_H/2 + 110, 12, '#14f0ff');
}

function drawWin() {
  const g = ctx.createLinearGradient(0,0,0,GAME_H);
  g.addColorStop(0,'#05203a'); g.addColorStop(1,'#05000c');
  ctx.fillStyle = g; ctx.fillRect(0,0,GAME_W,GAME_H);
  // Confeti de partículas neón.
  for (let i=0;i<40;i++){
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = ['#14f0ff','#ff2bd6','#f7ff3c','#9b5cff'][i%4];
    const x = (i*73 + Game.blink*60*((i%3)+1)) % GAME_W;
    const y = (i*97 + Game.blink*80) % GAME_H;
    ctx.fillRect(x, y, 4, 4);
    ctx.restore();
  }
  glitchTitle('¡VICTORIA!', GAME_W/2, 180, 46);
  neonText('HAS LIBERADO LA COMARCA', GAME_W/2, 250, 14, '#f7ff3c');
  neonText('SCORE FINAL  ' + String(Game.score).padStart(6,'0'), GAME_W/2, 320, 14, '#fff');
  neonText('HI-SCORE  ' + String(Game.hiscore).padStart(6,'0'), GAME_W/2, 355, 12, '#f7ff3c');
  if (Math.floor(Game.blink*1.6)%2) neonText('PRESS ENTER', GAME_W/2, 460, 12, '#14f0ff');
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
