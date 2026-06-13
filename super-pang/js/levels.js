/* =========================================================================
   SUPER PANG · SUPERPUNK EDITION — definición de niveles (DATOS)
   -------------------------------------------------------------------------
   Todo el diseño de pantallas vive aquí como datos puros. Para añadir un
   mundo nuevo basta con añadir otra entrada al array LEVELS: el motor
   (game.js) sabe interpretarla. NO hay lógica de juego en este archivo.

   Sistema de coordenadas lógico (independiente de la pantalla real):
     ancho  = 800   (GAME_W en game.js)
     alto   = 600   (GAME_H en game.js)
     suelo  : la franja inferior; FLOOR_Y = 560 (los 40px de abajo son suelo)
     origen : (0,0) arriba-izquierda. Y crece hacia abajo.

   Esquemas de cada objeto:
     platform : { x, y, w, h, type }   type: "fixed" | "destructible"
     ladder   : { x, y, w, h }         x = borde izq.; el jugador sube/baja
     ball     : { x, y, size, dir }    size: 0=grande 1=mediana 2=pequeña 3=diminuta
                                        dir : -1 izq / +1 der (velocidad horizontal inicial)
     powerup  : { x, y, type }         aparece flotando o cae; ver TYPES en game.js
                 type: "double" | "adhesive" | "clock" | "dynamite" | "life" | "shield"

   Cada nivel: background (ruta a la foto), backup de color, timeLimit (seg),
   y los arrays anteriores.
   ========================================================================= */

const LEVELS = [
  /* ----------------------------------------------------------------------
     WORLD 1-1 · "La Iglesia Mudéjar"
     Intro/tutorial. 2 bolas grandes, una sola plataforma central.
  ---------------------------------------------------------------------- */
  {
    id: "1-1",
    name: "La Iglesia Mudéjar",
    background: "img/nivel1-iglesia.jpeg",
    // Tinte neón de respaldo si la foto no carga (degradado magenta→violeta).
    backupGradient: ["#2a0033", "#120022"],
    tint: "rgba(255, 43, 214, 0.18)",   // overlay neón sobre la foto
    timeLimit: 60,
    platforms: [
      { x: 300, y: 360, w: 200, h: 18, type: "fixed" },
    ],
    ladders: [],
    balls: [
      { x: 180, y: 180, size: 0, dir:  1 },
      { x: 620, y: 200, size: 0, dir: -1 },
    ],
    powerups: [],
  },

  /* ----------------------------------------------------------------------
     WORLD 1-2 · "Las Ruinas del Castillo"
     2 plataformas laterales + 1 escalera. 3 bolas medianas + reloj.
  ---------------------------------------------------------------------- */
  {
    id: "1-2",
    name: "Las Ruinas del Castillo",
    background: "img/nivel2-ruinas.jpeg",
    backupGradient: ["#001a33", "#04001a"],
    tint: "rgba(20, 240, 255, 0.16)",
    timeLimit: 70,
    platforms: [
      { x: 60,  y: 380, w: 200, h: 18, type: "fixed" },
      { x: 540, y: 380, w: 200, h: 18, type: "fixed" },
    ],
    ladders: [
      // Escalera que conecta el suelo con la plataforma izquierda.
      { x: 150, y: 380, w: 36, h: 180 },
    ],
    balls: [
      { x: 200, y: 160, size: 1, dir:  1 },
      { x: 400, y: 120, size: 1, dir: -1 },
      { x: 600, y: 160, size: 1, dir:  1 },
    ],
    powerups: [
      { x: 400, y: 300, type: "clock" },
    ],
  },

  /* ----------------------------------------------------------------------
     WORLD 1-3 · "El Pórtico de Piedra"
     2 niveles de plataformas + escaleras + 1 plataforma destructible.
     4 bolas mezcladas + dinamita.
  ---------------------------------------------------------------------- */
  {
    id: "1-3",
    name: "El Pórtico de Piedra",
    background: "img/nivel3-portico.jpeg",
    backupGradient: ["#1a0a33", "#02010f"],
    tint: "rgba(155, 92, 255, 0.18)",
    timeLimit: 90,
    platforms: [
      // Nivel inferior
      { x: 120, y: 430, w: 180, h: 18, type: "fixed" },
      { x: 500, y: 430, w: 180, h: 18, type: "fixed" },
      // Nivel superior (central) — destructible: desaparece tras varios golpes
      { x: 320, y: 280, w: 160, h: 18, type: "destructible" },
    ],
    ladders: [
      { x: 180, y: 430, w: 36, h: 130 },   // suelo → plataforma inf. izq.
      { x: 584, y: 430, w: 36, h: 130 },   // suelo → plataforma inf. der.
      { x: 382, y: 280, w: 36, h: 150 },   // plataforma inf. → central
    ],
    balls: [
      { x: 150, y: 150, size: 0, dir:  1 },
      { x: 400, y: 100, size: 1, dir: -1 },
      { x: 640, y: 150, size: 2, dir:  1 },
      { x: 400, y: 200, size: 2, dir:  1 },
    ],
    powerups: [
      { x: 400, y: 360, type: "dynamite" },
    ],
  },
];

// Exponer global para game.js (sin módulos, todo vanilla).
window.LEVELS = LEVELS;
