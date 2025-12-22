/* =========================
   UTILIDADES GENERALES
========================= */

// Colisión AABB entre dos objetos
function checkCollision(objA, objB) {
  return (
    objA.x < objB.x + objB.width &&
    objA.x + objA.width > objB.x &&
    objA.y < objB.y + objB.height &&
    objA.y + objA.height > objB.y
  );
}

// Evitar solapamiento entre objetos
function preventOverlap(objA, objB) {
  const overlapX = Math.min(
    objA.x + objA.width - objB.x,
    objB.x + objB.width - objA.x
  );
  const overlapY = Math.min(
    objA.y + objA.height - objB.y,
    objB.y + objB.height - objA.y
  );

  if (overlapX < overlapY) {
    if (objA.x < objB.x) {
      objB.x = objA.x + objA.width;
    } else {
      objB.x = objA.x - objB.width;
    }
  } else {
    if (objA.y < objB.y) {
      objB.y = objA.y + objA.height;
    } else {
      objB.y = objA.y - objB.height;
    }
  }
}

// Verificar si solo hay una tecla de dirección presionada
function isMaxOneKeyDown() {
  const keys = [RIGHT_ARROW, LEFT_ARROW, UP_ARROW, DOWN_ARROW];
  let count = 0;
  for (const k of keys) {
    if (keyIsDown(k)) count++;
    if (count > 1) return false;
  }
  return true;
}

// Generar posiciones de frames para spritesheets
function getFramesPos(cols, rows, tileW, tileH) {
  const frames = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      frames.push({ x: col * tileW, y: row * tileH });
    }
  }
  return frames;
}

// Dibujar un tile de un spritesheet
function drawTile(img, srcX, srcY, srcW, srcH, destX, destY, destW, destH) {
  image(img, destX, destY, destW, destH, srcX, srcY, srcW, srcH);
}

// Hash determinista para generación procedural
function hash(x, y, seed = 1) {
  let n = (x * 374761393 + y * 668265263 + seed * 2147483647) >>> 0;
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177) >>> 0;
  n = (n ^ (n >>> 16)) >>> 0;
  return n / 4294967295;
}

// Lerp (interpolación lineal)
function lerp(start, end, t) {
  return start + (end - start) * t;
}

// Clamp (limitar valor entre min y max)
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Distancia entre dos puntos
function dist2D(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Efectividad de tipos Pokémon
const TYPE_CHART = {
  'Normal': { 'Roca': 0.5, 'Fantasma': 0 },
  'Fuego': { 'Planta': 2, 'Agua': 0.5, 'Fuego': 0.5, 'Roca': 0.5 },
  'Agua': { 'Fuego': 2, 'Planta': 0.5, 'Agua': 0.5, 'Roca': 2 },
  'Planta': { 'Agua': 2, 'Fuego': 0.5, 'Planta': 0.5, 'Volador': 0.5 },
  'Eléctrico': { 'Agua': 2, 'Volador': 2, 'Planta': 0.5, 'Roca': 0 },
  'Volador': { 'Planta': 2, 'Eléctrico': 0.5, 'Roca': 0.5 },
  'Roca': { 'Fuego': 2, 'Volador': 2 },
  'Veneno': { 'Planta': 2, 'Roca': 0.5 },
  'Psíquico': { 'Veneno': 2, 'Psíquico': 0.5 },
  'Fantasma': { 'Normal': 0, 'Psíquico': 2, 'Fantasma': 2 },
  'Siniestro': { 'Psíquico': 2, 'Fantasma': 2 }
};

function getTypeEffectiveness(attackType, defenseType) {
  const chart = TYPE_CHART[attackType];
  if (chart && chart[defenseType] !== undefined) {
    return chart[defenseType];
  }
  return 1;
}

// Colores por tipo
const TYPE_COLORS = {
  'Normal': '#a8a878',
  'Fuego': '#f08030',
  'Agua': '#6890f0',
  'Planta': '#78c850',
  'Eléctrico': '#f8d030',
  'Volador': '#a890f0',
  'Veneno': '#a040a0',
  'Roca': '#b8a038',
  'Psíquico': '#f85888',
  'Fantasma': '#705898',
  'Siniestro': '#705848'
};
