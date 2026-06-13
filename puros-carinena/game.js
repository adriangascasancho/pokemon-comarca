/* =========================================================================
   PUROS DE LA COMARCA DE CARIÑENA
   Mini-juego estilo Pokémon Rojo Fuego ambientado en Encinacorba (Aragón).
   HTML5 + Canvas + JavaScript vanilla. Sin dependencias, sin build.
   ========================================================================= */

(() => {
'use strict';

/* ---------------------------------------------------------------------------
   CANVAS Y CONSTANTES
--------------------------------------------------------------------------- */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const TILE = 32;
const VIEW_W = canvas.width;   // 480
const VIEW_H = canvas.height;  // 320
const COLS = VIEW_W / TILE;    // 15
const ROWS = VIEW_H / TILE;    // 10

// Paleta cálida tipo GBA
const PAL = {
  cream:   '#f8e8c0',
  brown:   '#7a4a24',
  brownD:  '#4a2a12',
  grass:   '#8cc060',
  grassD:  '#6ba048',
  path:    '#d8b878',
  pathD:   '#c0a060',
  water:   '#5aa0d8',
  waterD:  '#3a78b0',
  tree:    '#3c7a34',
  treeD:   '#235018',
  wall:    '#c89868',
  roof:    '#b04838',
  roofD:   '#883022',
  stone:   '#c8c0b0',
  stoneD:  '#a09888',
  gymw:    '#9088a0',
  gymf:    '#d8d0c8',
  tgrass:  '#5a9838',
  tgrassD: '#3c7020',
  flower:  '#e85878',
  fence:   '#9a6a3a',
  textShadow: 'rgba(0,0,0,0.45)'
};

/* ---------------------------------------------------------------------------
   TIPOS Y EFECTIVIDAD
--------------------------------------------------------------------------- */
const TYPES = ['Uva', 'Planta', 'Piedra', 'Viento', 'Vino', 'Normal'];

// Multiplicador por defecto 1. Sólo se anotan las excepciones.
const EFFECT = {
  Planta: { Piedra: 2,   Viento: 0.5, Planta: 0.5 },
  Piedra: { Viento: 2,   Planta: 0.5, Piedra: 0.5 },
  Viento: { Planta: 2,   Piedra: 0.5, Viento: 0.5 },
  Vino:   { Uva: 2,      Vino: 0.5 },
  Uva:    { Vino: 0.5 },
  Normal: {}
};
function typeEffect(atkType, defType) {
  const row = EFFECT[atkType];
  if (row && row[defType] !== undefined) return row[defType];
  return 1;
}
const TYPE_COLOR = {
  Uva: '#9a4ec8', Planta: '#3c9a34', Piedra: '#9a8a6a',
  Viento: '#7ac8d8', Vino: '#a02838', Normal: '#a8a878'
};

/* ---------------------------------------------------------------------------
   MOVIMIENTOS
--------------------------------------------------------------------------- */
const MOVES = {
  placaje:  { name: 'Placaje',  type: 'Normal', power: 35, pp: 35 },
  racimazo: { name: 'Racimazo', type: 'Uva',    power: 40, pp: 25 },
  vendimia: { name: 'Vendimia', type: 'Uva',    power: 55, pp: 15 },
  hojazo:   { name: 'Hojazo',   type: 'Planta', power: 40, pp: 25 },
  raizazo:  { name: 'Raizazo',  type: 'Planta', power: 55, pp: 15 },
  pedrada:  { name: 'Pedrada',  type: 'Piedra', power: 40, pp: 25 },
  cantazo:  { name: 'Cantazo',  type: 'Piedra', power: 55, pp: 15 },
  rafaga:   { name: 'Ráfaga',   type: 'Viento', power: 40, pp: 25 },
  cierzo:   { name: 'Cierzo',   type: 'Viento', power: 55, pp: 15 },
  mostada:  { name: 'Mostada',  type: 'Vino',   power: 40, pp: 25 },
  taponazo: { name: 'Taponazo', type: 'Vino',   power: 55, pp: 15 }
};

/* ---------------------------------------------------------------------------
   ESPECIES ("LOS PUROS")
   shape -> dibujante procedural. base -> stats base. learnset -> por nivel.
--------------------------------------------------------------------------- */
const SPECIES = {
  Garnachin: {
    name: 'Garnachín', type: 'Uva', shape: 'grape', color: '#8a3eb8', color2: '#c060e0',
    base: { hp: 45, atk: 49, def: 45, spd: 55 },
    learnset: [ {level:1,move:'placaje'}, {level:1,move:'racimazo'}, {level:9,move:'vendimia'} ],
    evolvesTo: 'Garnachon', evolveLevel: 14
  },
  Garnachon: {
    name: 'Garnachón', type: 'Uva', shape: 'grape', color: '#6e2e9a', color2: '#a850d0',
    base: { hp: 60, atk: 75, def: 65, spd: 80 },
    learnset: [ {level:1,move:'placaje'}, {level:1,move:'racimazo'}, {level:14,move:'vendimia'} ],
    evolvesTo: null, evolveLevel: 0
  },
  Encinon: {
    name: 'Encinón', type: 'Planta', shape: 'oak', color: '#3c8a34', color2: '#2a6020',
    base: { hp: 55, atk: 48, def: 58, spd: 35 },
    learnset: [ {level:1,move:'placaje'}, {level:1,move:'hojazo'}, {level:9,move:'raizazo'} ],
    evolvesTo: 'Carrasco', evolveLevel: 14
  },
  Carrasco: {
    name: 'Carrasco', type: 'Planta', shape: 'oak', color: '#2e7026', color2: '#1c4a16',
    base: { hp: 75, atk: 70, def: 85, spd: 45 },
    learnset: [ {level:1,move:'placaje'}, {level:1,move:'hojazo'}, {level:14,move:'raizazo'} ],
    evolvesTo: null, evolveLevel: 0
  },
  Pedrusco: {
    name: 'Pedrusco', type: 'Piedra', shape: 'rock', color: '#9a8a6a', color2: '#6e5e44',
    base: { hp: 50, atk: 52, def: 68, spd: 30 },
    learnset: [ {level:1,move:'placaje'}, {level:1,move:'pedrada'}, {level:9,move:'cantazo'} ],
    evolvesTo: 'Pedrolo', evolveLevel: 14
  },
  Pedrolo: {
    name: 'Pedrolo', type: 'Piedra', shape: 'rock', color: '#86765a', color2: '#5a4c36',
    base: { hp: 70, atk: 80, def: 95, spd: 40 },
    learnset: [ {level:1,move:'placaje'}, {level:1,move:'pedrada'}, {level:14,move:'cantazo'} ],
    evolvesTo: null, evolveLevel: 0
  },
  Sarmiento: {
    name: 'Sarmiento', type: 'Uva', shape: 'grape', color: '#7a4ea8', color2: '#a878c8',
    base: { hp: 40, atk: 45, def: 40, spd: 50 },
    learnset: [ {level:1,move:'placaje'}, {level:1,move:'racimazo'} ],
    evolvesTo: null, evolveLevel: 0
  },
  Cierzal: {
    name: 'Cierzal', type: 'Viento', shape: 'wind', color: '#bfe6ee', color2: '#7ac8d8',
    base: { hp: 38, atk: 45, def: 35, spd: 65 },
    learnset: [ {level:1,move:'placaje'}, {level:1,move:'rafaga'} ],
    evolvesTo: null, evolveLevel: 0
  },
  Tozalico: {
    name: 'Tozalico', type: 'Piedra', shape: 'rock', color: '#a8966e', color2: '#76654a',
    base: { hp: 44, atk: 50, def: 60, spd: 28 },
    learnset: [ {level:1,move:'placaje'}, {level:1,move:'pedrada'} ],
    evolvesTo: null, evolveLevel: 0
  },
  Aceiton: {
    name: 'Aceitón', type: 'Planta', shape: 'olive', color: '#6a9a3a', color2: '#48701f',
    base: { hp: 46, atk: 48, def: 50, spd: 38 },
    learnset: [ {level:1,move:'placaje'}, {level:1,move:'hojazo'} ],
    evolvesTo: null, evolveLevel: 0
  },
  Mostillo: {
    name: 'Mostillo', type: 'Vino', shape: 'wine', color: '#b85040', color2: '#7a2818',
    base: { hp: 45, atk: 50, def: 48, spd: 45 },
    learnset: [ {level:1,move:'placaje'}, {level:1,move:'mostada'} ],
    evolvesTo: null, evolveLevel: 0
  },
  Botijon: {
    name: 'Botijón', type: 'Vino', shape: 'wine', color: '#a83828', color2: '#701a10',
    base: { hp: 60, atk: 62, def: 58, spd: 50 },
    learnset: [ {level:1,move:'placaje'}, {level:1,move:'mostada'}, {level:1,move:'taponazo'} ],
    evolvesTo: null, evolveLevel: 0
  }
};

/* ---------------------------------------------------------------------------
   CRIATURAS (instancias)
--------------------------------------------------------------------------- */
function expNeeded(level) { return level * 12; }

function recalcStats(c) {
  const b = c.species.base, L = c.level;
  c.maxHp = Math.floor(b.hp * L / 50) + L + 10;
  c.atk   = Math.floor(b.atk * L / 50) + 5;
  c.def   = Math.floor(b.def * L / 50) + 5;
  c.spd   = Math.floor(b.spd * L / 50) + 5;
}

function makeCreature(key, level) {
  const sp = SPECIES[key];
  const c = { species: sp, name: sp.name, level, exp: 0, moves: [] };
  recalcStats(c);
  c.hp = c.maxHp;
  // Aprende todos los movimientos cuyo nivel <= nivel actual (máximo 4 últimos)
  const learned = sp.learnset.filter(l => l.level <= level);
  for (const l of learned) {
    if (!c.moves.find(m => m.key === l.move)) {
      const mv = MOVES[l.move];
      c.moves.push({ key: l.move, move: mv, pp: mv.pp, maxpp: mv.pp });
    }
  }
  if (c.moves.length > 4) c.moves = c.moves.slice(-4);
  if (c.moves.length === 0) {
    const mv = MOVES.placaje;
    c.moves.push({ key: 'placaje', move: mv, pp: mv.pp, maxpp: mv.pp });
  }
  return c;
}

function learnMove(c, key, msgs) {
  if (c.moves.find(m => m.key === key)) return;
  const mv = MOVES[key];
  if (c.moves.length < 4) {
    c.moves.push({ key, move: mv, pp: mv.pp, maxpp: mv.pp });
    msgs.push(c.name + ' aprendió ' + mv.name + '!');
  } else {
    const old = c.moves.shift();
    c.moves.push({ key, move: mv, pp: mv.pp, maxpp: mv.pp });
    msgs.push(c.name + ' olvidó ' + old.move.name + ' y aprendió ' + mv.name + '!');
  }
}

function levelUp(c, msgs) {
  const oldMax = c.maxHp;
  c.level++;
  recalcStats(c);
  c.hp += (c.maxHp - oldMax); // cura el HP extra ganado
  msgs.push(c.name + ' subió al nivel ' + c.level + '!');
  for (const l of c.species.learnset) {
    if (l.level === c.level) learnMove(c, l.move, msgs);
  }
  // Evolución
  if (c.species.evolvesTo && c.species.evolveLevel && c.level >= c.species.evolveLevel) {
    const newSpec = SPECIES[c.species.evolvesTo];
    msgs.push('¿Qué? ¡' + c.name + ' está evolucionando!');
    const oldMax2 = c.maxHp;
    c.species = newSpec;
    c.name = newSpec.name;
    recalcStats(c);
    c.hp += (c.maxHp - oldMax2);
    msgs.push('¡Enhorabuena! ¡Tu puro evolucionó a ' + newSpec.name + '!');
  }
}

function gainExp(c, amount) {
  const msgs = [c.name + ' ganó ' + amount + ' de EXP.'];
  c.exp += amount;
  while (c.level < 100 && c.exp >= expNeeded(c.level)) {
    c.exp -= expNeeded(c.level);
    levelUp(c, msgs);
  }
  return msgs;
}

function calcDamage(attacker, defender, move) {
  const L = attacker.level;
  let base = Math.floor(Math.floor((2 * L / 5 + 2) * move.power * attacker.atk / defender.def) / 50) + 2;
  const eff = typeEffect(move.type, defender.species.type);
  const stab = (move.type === attacker.species.type) ? 1.5 : 1;
  const rand = 0.85 + Math.random() * 0.15;
  let dmg = Math.floor(base * eff * stab * rand);
  if (eff > 0) dmg = Math.max(1, dmg); else dmg = 0;
  return { dmg, eff };
}

/* ---------------------------------------------------------------------------
   MAPA: TILES
--------------------------------------------------------------------------- */
const T = {
  GRASS: 0, PATH: 1, TREE: 2, WATER: 3, WALL: 4, ROOF: 5, DOOR: 6,
  SIGN: 7, FOUNT: 8, FENCE: 9, GYMW: 10, GYMF: 11, TGRASS: 12,
  PLAZA: 13, FLOWER: 14
};
const WALKABLE = {
  [T.GRASS]: true, [T.PATH]: true, [T.GYMF]: true,
  [T.TGRASS]: true, [T.PLAZA]: true, [T.FLOWER]: true
};

const MAP_W = 24, MAP_H = 40;
let map = [];
const npcs = [];
const signs = {};            // "x,y" -> texto
let player = null;
let gymDefeated = false;
let hasStarter = false;

function setTile(x, y, t) {
  if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) map[y][x] = t;
}
function fillRectTile(x0, y0, x1, y1, t) {
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) setTile(x, y, t);
}
function building(x0, y0, w, roofRows, doorX) {
  // techo
  for (let r = 0; r < roofRows; r++)
    for (let x = x0; x < x0 + w; x++) setTile(x, y0 + r, T.ROOF);
  // pared
  const wy = y0 + roofRows;
  for (let x = x0; x < x0 + w; x++) setTile(x, wy, T.WALL);
  // puerta
  setTile(doorX, wy, T.DOOR);
}

function buildWorld() {
  map = [];
  for (let y = 0; y < MAP_H; y++) {
    map.push(new Array(MAP_W).fill(T.GRASS));
  }
  // Borde de árboles
  for (let x = 0; x < MAP_W; x++) { setTile(x, 0, T.TREE); setTile(x, MAP_H - 1, T.TREE); }
  for (let y = 0; y < MAP_H; y++) { setTile(0, y, T.TREE); setTile(MAP_W - 1, y, T.TREE); }

  // Camino central vertical (x = 11,12)
  for (let y = 1; y < MAP_H - 1; y++) { setTile(11, y, T.PATH); setTile(12, y, T.PATH); }

  // ---- PUEBLO DE ENCINACORBA (parte superior) ----
  // Plaza empedrada
  fillRectTile(8, 2, 15, 6, T.PLAZA);
  // Fuente que cura (2 tiles)
  setTile(11, 4, T.FOUNT); setTile(12, 4, T.FOUNT);
  // Algunas flores decorativas en la plaza
  setTile(9, 6, T.FLOWER); setTile(14, 2, T.FLOWER);

  // Laboratorio del Profesor (izquierda)
  building(3, 8, 4, 1, 4);   // techo y8, pared y9, puerta (4,9)
  signs['8,9'] = 'LABORATORIO DEL PROFESOR CARIÑENA\nEstudioso de los puros de la comarca.';
  setTile(8, 9, T.SIGN);

  // Casa 1 (derecha arriba)
  building(16, 8, 4, 1, 17);
  // Casa 2 (izquierda, más abajo)
  building(3, 14, 4, 1, 4);

  // Gimnasio de Encinacorba: arena amurallada con suelo propio y entrada
  // Rectángulo x 15..21, y 12..19
  for (let y = 12; y <= 19; y++)
    for (let x = 15; x <= 21; x++) {
      if (x === 15 || x === 21 || y === 12 || y === 19) setTile(x, y, T.GYMW);
      else setTile(x, y, T.GYMF);
    }
  setTile(18, 19, T.GYMF); // entrada (hueco en la muralla inferior)
  signs['14,18'] = 'GIMNASIO DE ENCINACORBA\nLíder: DON MOSTO. Tipo VINO.';
  setTile(14, 18, T.SIGN);

  // Cartel de bienvenida
  signs['10,7'] = 'ENCINACORBA\nCuna de los puros de la garnacha.\n¡El cierzo te da la bienvenida!';
  setTile(10, 7, T.SIGN);

  // ---- VALLA que separa pueblo y Ruta 1 (y = 23), con hueco en el camino ----
  for (let x = 1; x < MAP_W - 1; x++) setTile(x, 23, T.FENCE);
  setTile(11, 23, T.PATH); setTile(12, 23, T.PATH); // hueco

  // ---- RUTA 1 (parte inferior, y 24..38) ----
  signs['13,24'] = 'RUTA 1\nCuidado con la hierba alta: los puros\nsalvajes acechan entre las cepas.';
  setTile(13, 24, T.SIGN);

  // Parches de hierba alta
  fillRectTile(3, 26, 7, 30, T.TGRASS);
  fillRectTile(15, 30, 19, 34, T.TGRASS);
  fillRectTile(8, 33, 13, 36, T.TGRASS);

  // Charca (agua, bloquea)
  fillRectTile(16, 25, 19, 27, T.WATER);

  // Árboles dispersos
  const scatter = [[5,25],[6,32],[8,28],[14,29],[20,31],[3,35],[21,36],[9,25],[18,37],[4,38],[15,28]];
  for (const [x, y] of scatter) setTile(x, y, T.TREE);
  // Algunas flores en la ruta
  setTile(13, 31, T.FLOWER); setTile(7, 36, T.FLOWER);

  // ---- NPCs ----
  npcs.length = 0;
  npcs.push({
    x: 4, y: 10, dir: 'down', name: 'Prof. Cariñena', color: '#d8d8d8', kind: 'professor',
    lines: [
      'Prof. Cariñena: ¡Hola, chaval!',
      'Soy el profesor de esta comarca vinícola.',
      'Veo que ya has elegido tu primer puro.',
      '¡Cuídalo bien y captura más en la Ruta 1!',
      'Cuando estés listo, reta al gimnasio de DON MOSTO.'
    ]
  });
  npcs.push({
    x: 17, y: 11, dir: 'down', name: 'Bodeguero', color: '#9a6a3a', kind: 'talk',
    lines: [
      'Bodeguero: ¿Sabes de tipos, mozo?',
      'El VINO arrasa a los de tipo UVA...',
      'pero la PIEDRA aguanta el CIERZO (VIENTO),',
      'y la PLANTA agrieta hasta la mismísima PIEDRA.',
      '¡Estudia la tabla y vencerás a Don Mosto!'
    ]
  });
  npcs.push({
    x: 13, y: 7, dir: 'up', name: 'Vecina', color: '#c85878', kind: 'talk',
    lines: [
      'Vecina: La fuente de la plaza es milagrosa.',
      'Si tu equipo está cansado, acércate y habla',
      'con la fuente: ¡curará a todos tus puros!'
    ]
  });
  npcs.push({
    x: 18, y: 14, dir: 'down', name: 'Don Mosto', color: '#a02838', kind: 'gym', isGym: true, defeated: false,
    team: null,
    lines: [
      'Don Mosto: ¡Bienvenido a mi bodega-gimnasio!',
      'Soy el líder de Encinacorba, maestro del VINO.',
      '¡Demuestra que tus puros tienen solera!'
    ],
    winLines: ['Don Mosto: ¡Buen caldo el tuyo!', 'Te has ganado la MEDALLA GARNACHA.']
  });
  npcs.push({
    x: 6, y: 29, dir: 'down', name: 'Pastor Aniceto', color: '#5a7a3a', kind: 'trainer', defeated: false,
    team: null,
    lines: [
      'Pastor Aniceto: ¡Eh, tú, el de los puros!',
      'Mientras pastoreo no me aburro... ¡a luchar!'
    ],
    winLines: ['Pastor Aniceto: ¡Recórcholis, qué crack!']
  });

  // Equipos de entrenadores (se crean aquí para fijar niveles)
  npcs.find(n => n.name === 'Don Mosto').team = () => [ makeCreature('Mostillo', 9), makeCreature('Botijon', 12) ];
  npcs.find(n => n.name === 'Pastor Aniceto').team = () => [ makeCreature('Tozalico', 6) ];
}

/* ---------------------------------------------------------------------------
   JUGADOR
--------------------------------------------------------------------------- */
function makePlayer() {
  return {
    tx: 11, ty: 21, // tile
    px: 11 * TILE, py: 21 * TILE, // pixel
    dir: 'up', moving: false, anim: 0, walkFrame: 0,
    team: []
  };
}

function tileWalkable(x, y) {
  if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return false;
  if (!WALKABLE[map[y][x]]) return false;
  for (const n of npcs) if (n.x === x && n.y === y) return false;
  return true;
}

function frontTile() {
  const d = DIRV[player.dir];
  return { x: player.tx + d.x, y: player.ty + d.y };
}

const DIRV = {
  up:    { x: 0, y: -1 }, down:  { x: 0, y: 1 },
  left:  { x: -1, y: 0 }, right: { x: 1, y: 0 }
};

/* ---------------------------------------------------------------------------
   ESTADO DEL JUEGO
--------------------------------------------------------------------------- */
let gameState = 'title'; // title | starterPick | overworld | dialog | battle | win
let starterCursor = 0;
const STARTERS = ['Garnachin', 'Encinon', 'Pedrusco'];

// Diálogo del mundo
const dialog = { lines: [], index: 0, onEnd: null };
function startDialog(lines, onEnd) {
  dialog.lines = lines.slice();
  dialog.index = 0;
  dialog.onEnd = onEnd || null;
  gameState = 'dialog';
}
function advanceDialog() {
  dialog.index++;
  if (dialog.index >= dialog.lines.length) {
    const cb = dialog.onEnd;
    dialog.onEnd = null;
    gameState = 'overworld';
    if (cb) cb();
  }
}

/* ---------------------------------------------------------------------------
   COMBATE: cola de eventos
--------------------------------------------------------------------------- */
let battle = null;

function activeCreature() { return player.team[battle.active]; }

function nameOf(c, isPlayerSide) { return isPlayerSide ? c.name : c.name + ' rival'; }

function beginBattle(opts) {
  // opts: { wild?:creature, trainer?:npc }
  battle = {
    isWild: !!opts.wild,
    trainer: opts.trainer || null,
    team: opts.trainer ? opts.trainer.team() : [opts.wild],
    eIndex: 0,
    active: player.team.findIndex(c => c.hp > 0),
    queue: [],
    phase: 'busy',
    msg: '',
    cursor: 0,
    over: false,
    result: '',
    needSwitch: false,
    forced: false
  };
  if (battle.active < 0) battle.active = 0;
  battle.enemy = battle.team[0];
  gameState = 'battle';

  const intro = [];
  if (battle.isWild) {
    intro.push('¡Un ' + battle.enemy.name + ' salvaje apareció!');
  } else {
    intro.push(battle.trainer.name + ' quiere luchar!');
    intro.push(battle.trainer.name + ' envía a ' + battle.enemy.name + '!');
  }
  intro.push('¡Adelante, ' + activeCreature().name + '!');
  battle.queue = intro.map(t => ({ type: 'msg', text: t }));
  processQueue();
}

function msg(text) { return { type: 'msg', text }; }
function act(fn) { return { type: 'action', fn }; }

function processQueue() {
  while (battle.queue.length) {
    const ev = battle.queue[0];
    if (ev.type === 'action') { battle.queue.shift(); ev.fn(); continue; }
    if (ev.type === 'msg') { battle.phase = 'message'; battle.msg = ev.text; return; }
  }
  onQueueEmpty();
}

function onQueueEmpty() {
  if (battle.over) { finishBattle(); return; }
  if (battle.needSwitch) { battle.phase = 'team'; battle.forced = true; battle.cursor = 0; return; }
  battle.phase = 'menu'; battle.cursor = 0;
}

function advanceMessage() {
  battle.queue.shift();
  processQueue();
}

// Ataque protegido: si el atacante está debilitado, no hace nada.
function guardedAttack(attacker, defender, move, attackerIsPlayer) {
  return act(() => {
    if (attacker.hp <= 0) return;
    const evs = [
      msg(nameOf(attacker, attackerIsPlayer) + ' usó ' + move.name + '!'),
      act(() => {
        const slot = attacker.moves.find(m => m.move === move);
        if (slot && slot.pp > 0) slot.pp--;
        const r = calcDamage(attacker, defender, move);
        defender.hp = Math.max(0, defender.hp - r.dmg);
        const post = [];
        if (r.eff > 1) post.push(msg('¡Es supereficaz!'));
        else if (r.eff > 0 && r.eff < 1) post.push(msg('No es muy eficaz...'));
        if (defender.hp <= 0) post.push(...faintEvents(defender, attackerIsPlayer));
        if (post.length) battle.queue.unshift(...post);
      })
    ];
    battle.queue.unshift(...evs);
  });
}

// defenderIsEnemy: true si el que cae es el rival
function faintEvents(c, defenderIsEnemy) {
  const evs = [ msg(nameOf(c, !defenderIsEnemy) + ' se debilitó!') ];
  if (defenderIsEnemy) {
    evs.push(act(() => {
      const pc = activeCreature();
      const extra = [];
      if (pc.hp > 0) {
        const amount = battle.enemy.level * 6 + 4;
        extra.push(...gainExp(pc, amount).map(t => msg(t)));
      }
      // ¿Quedan rivales (entrenador)?
      let next = -1;
      for (let i = battle.eIndex + 1; i < battle.team.length; i++) {
        if (battle.team[i].hp > 0) { next = i; break; }
      }
      if (battle.trainer && next >= 0) {
        battle.eIndex = next;
        battle.enemy = battle.team[next];
        extra.push(msg(battle.trainer.name + ' envía a ' + battle.enemy.name + '!'));
      } else {
        battle.over = true;
        battle.result = 'win';
      }
      if (extra.length) battle.queue.unshift(...extra);
    }));
  } else {
    evs.push(act(() => {
      const alive = player.team.some(t => t.hp > 0);
      if (alive) {
        battle.needSwitch = true;
      } else {
        battle.over = true;
        battle.result = 'lose';
        battle.queue.unshift(
          msg('No te quedan puros en condiciones...'),
          msg('Te retiras a la plaza para curarte.')
        );
      }
    }));
  }
  return evs;
}

function enemyChooseMove() {
  const e = battle.enemy;
  const usable = e.moves.filter(m => m.pp > 0);
  const pool = usable.length ? usable : e.moves;
  return pool[Math.floor(Math.random() * pool.length)].move;
}

function playerUseMove(slot) {
  if (slot.pp <= 0) return;
  const pc = activeCreature();
  const ec = battle.enemy;
  const pm = slot.move;
  const em = enemyChooseMove();
  // Orden por velocidad
  let order;
  if (pc.spd > ec.spd) order = ['p', 'e'];
  else if (pc.spd < ec.spd) order = ['e', 'p'];
  else order = Math.random() < 0.5 ? ['p', 'e'] : ['e', 'p'];

  battle.queue = order.map(s =>
    s === 'p' ? guardedAttack(pc, ec, pm, true) : guardedAttack(ec, pc, em, false)
  );
  battle.phase = 'busy';
  processQueue();
}

function playerSwitch(index, isForced) {
  battle.active = index;
  const c = activeCreature();
  if (isForced) {
    battle.needSwitch = false;
    battle.forced = false;
    battle.queue = [ msg('¡Adelante, ' + c.name + '!') ];
    processQueue();
  } else {
    // Cambiar gasta turno -> el rival ataca
    const em = enemyChooseMove();
    battle.queue = [
      msg('¡Vuelve! ¡Adelante, ' + c.name + '!'),
      guardedAttack(battle.enemy, c, em, false)
    ];
    battle.phase = 'busy';
    processQueue();
  }
}

function tryCapture() {
  const e = battle.enemy;
  let prob = (1 - e.hp / e.maxHp) * 0.65 + 0.3 - e.level * 0.01;
  prob = Math.max(0.05, Math.min(0.95, prob));
  const success = Math.random() < prob;
  battle.queue = [ msg('¡Lanzas un cántaro a ' + e.name + '!') ];
  battle.queue.push(act(() => {
    const tail = [];
    if (success) {
      if (player.team.length < 6) {
        player.team.push(e);
        battle.over = true;
        battle.result = 'caught';
        tail.push(msg('¡Toma! ¡' + e.name + ' fue capturado!'));
      } else {
        tail.push(msg('Tu equipo está lleno (6 puros).'));
        tail.push(...enemyTurnEvents());
      }
    } else {
      tail.push(msg('¡Oh, no! ¡' + e.name + ' se ha soltado!'));
      tail.push(...enemyTurnEvents());
    }
    battle.queue.unshift(...tail);
  }));
  battle.phase = 'busy';
  processQueue();
}

function enemyTurnEvents() {
  const em = enemyChooseMove();
  return [ guardedAttack(battle.enemy, activeCreature(), em, false) ];
}

function tryFlee() {
  battle.queue = [ msg('Escapaste sin problemas...') ];
  battle.queue.push(act(() => { battle.over = true; battle.result = 'flee'; }));
  battle.phase = 'busy';
  processQueue();
}

function healTeam() {
  for (const c of player.team) {
    c.hp = c.maxHp;
    for (const m of c.moves) m.pp = m.maxpp;
  }
}

function finishBattle() {
  const result = battle.result;
  const trainer = battle.trainer;
  if (result === 'lose') {
    healTeam();
    player.tx = 11; player.ty = 8;
    player.px = player.tx * TILE; player.py = player.ty * TILE;
    player.moving = false; player.dir = 'down';
    gameState = 'overworld';
  } else if (result === 'win' && trainer) {
    trainer.defeated = true;
    if (trainer.isGym) {
      gymDefeated = true;
      startDialog(trainer.winLines.slice(), () => { gameState = 'win'; });
      return;
    } else {
      startDialog(trainer.winLines.slice());
      return;
    }
  } else {
    gameState = 'overworld';
  }
  battle = null;
}

/* ---------------------------------------------------------------------------
   ENTRADA
--------------------------------------------------------------------------- */
const keys = {};
window.addEventListener('keydown', e => {
  const a = mapKey(e.key);
  if (!a) return;
  e.preventDefault();
  if (!keys[a] && !e.repeat) onPress(a);
  keys[a] = true;
});
window.addEventListener('keyup', e => {
  const a = mapKey(e.key);
  if (a) keys[a] = false;
});
function mapKey(k) {
  switch (k) {
    case 'ArrowUp': case 'w': case 'W': return 'up';
    case 'ArrowDown': case 's': case 'S': return 'down';
    case 'ArrowLeft': case 'a': case 'A': return 'left';
    case 'ArrowRight': case 'd': case 'D': return 'right';
    case 'z': case 'Z': case 'Enter': return 'a';
    case 'x': case 'X': case 'Escape': return 'b';
  }
  return null;
}

function onPress(a) {
  switch (gameState) {
    case 'title':       onPressTitle(a); break;
    case 'starterPick': onPressStarter(a); break;
    case 'overworld':   onPressOverworld(a); break;
    case 'dialog':      if (a === 'a' || a === 'b') advanceDialog(); break;
    case 'battle':      onPressBattle(a); break;
    case 'win':         if (a === 'a' || a === 'b') { gameState = 'overworld'; } break;
  }
}

function onPressTitle(a) {
  if (a === 'a') { gameState = 'starterPick'; starterCursor = 0; }
}

function onPressStarter(a) {
  if (a === 'left')  starterCursor = (starterCursor + 2) % 3;
  else if (a === 'right') starterCursor = (starterCursor + 1) % 3;
  else if (a === 'a') {
    const key = STARTERS[starterCursor];
    player.team = [ makeCreature(key, 5) ];
    hasStarter = true;
    const sp = SPECIES[key];
    startDialog([
      'Prof. Cariñena: ¡Excelente elección!',
      'Te llevas a ' + sp.name + ' (tipo ' + sp.type + ').',
      '¡Que el cierzo sople a tu favor!'
    ]);
  }
}

function onPressOverworld(a) {
  if (a === 'a') interact();
  // movimiento se gestiona con teclas mantenidas en update()
}

function interact() {
  const f = frontTile();
  // NPC
  const npc = npcs.find(n => n.x === f.x && n.y === f.y);
  if (npc) { interactNPC(npc); return; }
  // Tiles especiales
  const t = (f.x >= 0 && f.x < MAP_W && f.y >= 0 && f.y < MAP_H) ? map[f.y][f.x] : -1;
  if (t === T.FOUNT) {
    healTeam();
    startDialog(['Bebes de la fuente de la plaza...', '¡Tu equipo recuperó toda su energía!']);
    return;
  }
  if (t === T.SIGN) {
    const txt = signs[f.x + ',' + f.y];
    if (txt) startDialog(txt.split('\n'));
    return;
  }
}

function interactNPC(npc) {
  // mira hacia el jugador
  const dx = player.tx - npc.x, dy = player.ty - npc.y;
  if (Math.abs(dx) > Math.abs(dy)) npc.dir = dx > 0 ? 'right' : 'left';
  else npc.dir = dy > 0 ? 'down' : 'up';

  if (npc.kind === 'trainer' || npc.kind === 'gym') {
    if (npc.defeated) {
      startDialog([npc.name + ': ¡Vuelve cuando quieras revancha!']);
    } else {
      startDialog(npc.lines.slice(), () => beginBattle({ trainer: npc }));
    }
  } else {
    startDialog(npc.lines.slice());
  }
}

function onPressBattle(a) {
  if (battle.phase === 'message') {
    if (a === 'a' || a === 'b') advanceMessage();
    return;
  }
  if (battle.phase === 'menu') {
    // 2x2: 0 LUCHAR 1 CÁNTARO / 2 EQUIPO 3 HUIR
    if (a === 'up')    battle.cursor = (battle.cursor + 2) % 4;
    else if (a === 'down')  battle.cursor = (battle.cursor + 2) % 4;
    else if (a === 'left')  battle.cursor ^= 1;
    else if (a === 'right') battle.cursor ^= 1;
    else if (a === 'a') chooseMenu(battle.cursor);
    return;
  }
  if (battle.phase === 'move') {
    const moves = activeCreature().moves;
    if (a === 'up')   battle.cursor = (battle.cursor + moves.length - 1) % moves.length;
    else if (a === 'down') battle.cursor = (battle.cursor + 1) % moves.length;
    else if (a === 'a') {
      const slot = moves[battle.cursor];
      if (slot.pp > 0) playerUseMove(slot);
      else flashMsg('¡No quedan PP para ese movimiento!');
    } else if (a === 'b') { battle.phase = 'menu'; battle.cursor = 0; }
    return;
  }
  if (battle.phase === 'team') {
    const team = player.team;
    if (a === 'up')   battle.cursor = (battle.cursor + team.length - 1) % team.length;
    else if (a === 'down') battle.cursor = (battle.cursor + 1) % team.length;
    else if (a === 'a') {
      const c = team[battle.cursor];
      if (c.hp <= 0) { flashMsg(c.name + ' no puede luchar.'); return; }
      if (battle.cursor === battle.active && !battle.forced) { flashMsg('¡' + c.name + ' ya está en combate!'); return; }
      playerSwitch(battle.cursor, battle.forced);
    } else if (a === 'b') {
      if (!battle.forced) { battle.phase = 'menu'; battle.cursor = 0; }
    }
    return;
  }
}

let flash = { text: '', t: 0 };
function flashMsg(text) { flash.text = text; flash.t = 1.4; }

function chooseMenu(i) {
  if (i === 0) { battle.phase = 'move'; battle.cursor = 0; }      // LUCHAR
  else if (i === 1) {                                             // CÁNTARO
    if (battle.isWild) tryCapture();
    else flashMsg('¡No puedes capturar el puro de otro!');
  } else if (i === 2) { battle.phase = 'team'; battle.cursor = 0; } // EQUIPO
  else if (i === 3) {                                            // HUIR
    if (battle.isWild) tryFlee();
    else flashMsg('¡No puedes huir de un combate de entrenador!');
  }
}

/* ---------------------------------------------------------------------------
   ACTUALIZACIÓN
--------------------------------------------------------------------------- */
const WALK_SPEED = TILE / 0.14; // px por segundo

function update(dt) {
  if (flash.t > 0) flash.t -= dt;
  if (gameState === 'overworld') updatePlayer(dt);
}

function updatePlayer(dt) {
  if (player.moving) {
    const targetX = player.tx * TILE, targetY = player.ty * TILE;
    const step = WALK_SPEED * dt;
    if (player.px < targetX) player.px = Math.min(targetX, player.px + step);
    else if (player.px > targetX) player.px = Math.max(targetX, player.px - step);
    if (player.py < targetY) player.py = Math.min(targetY, player.py + step);
    else if (player.py > targetY) player.py = Math.max(targetY, player.py - step);
    player.anim += dt * 10;
    if (player.px === targetX && player.py === targetY) {
      player.moving = false;
      player.anim = 0;
      onArrive();
    }
  } else {
    let d = null;
    if (keys.up) d = 'up';
    else if (keys.down) d = 'down';
    else if (keys.left) d = 'left';
    else if (keys.right) d = 'right';
    if (d) {
      player.dir = d;
      const v = DIRV[d];
      const nx = player.tx + v.x, ny = player.ty + v.y;
      if (tileWalkable(nx, ny)) {
        player.tx = nx; player.ty = ny; player.moving = true;
        player.walkFrame ^= 1;
      }
    }
  }
}

function onArrive() {
  // Encuentro en hierba alta
  if (map[player.ty][player.tx] === T.TGRASS) {
    if (Math.random() < 0.18) {
      const pool = ['Sarmiento', 'Cierzal', 'Tozalico', 'Aceiton'];
      const key = pool[Math.floor(Math.random() * pool.length)];
      const lvl = 2 + Math.floor(Math.random() * 4); // 2-5
      beginBattle({ wild: makeCreature(key, lvl) });
    }
  }
}

/* ---------------------------------------------------------------------------
   RENDER: utilidades de texto y paneles
--------------------------------------------------------------------------- */
function drawText(text, x, y, color, size, align) {
  ctx.font = size + 'px monospace';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = PAL.textShadow;
  ctx.fillText(text, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawPanel(x, y, w, h) {
  ctx.fillStyle = PAL.brownD;
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = PAL.brown;
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = PAL.cream;
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
}

/* ---------------------------------------------------------------------------
   RENDER: tiles
--------------------------------------------------------------------------- */
function drawTile(t, sx, sy) {
  switch (t) {
    case T.GRASS:
      ctx.fillStyle = PAL.grass; ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = PAL.grassD;
      ctx.fillRect(sx + 6, sy + 8, 3, 3); ctx.fillRect(sx + 20, sy + 18, 3, 3);
      break;
    case T.PATH:
      ctx.fillStyle = PAL.path; ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = PAL.pathD; ctx.fillRect(sx + 4, sy + 22, 5, 4); ctx.fillRect(sx + 20, sy + 6, 5, 4);
      break;
    case T.PLAZA:
      ctx.fillStyle = PAL.stone; ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = PAL.stoneD;
      ctx.strokeStyle = PAL.stoneD; ctx.lineWidth = 1;
      ctx.strokeRect(sx + 0.5, sy + 0.5, TILE / 2, TILE / 2);
      ctx.strokeRect(sx + TILE / 2 + 0.5, sy + TILE / 2 + 0.5, TILE / 2 - 1, TILE / 2 - 1);
      break;
    case T.GYMF:
      ctx.fillStyle = PAL.gymf; ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = '#c0b8b0';
      ctx.fillRect(sx, sy, TILE, 2); ctx.fillRect(sx, sy, 2, TILE);
      break;
    case T.FLOWER:
      ctx.fillStyle = PAL.grass; ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = PAL.flower;
      circle(sx + 16, sy + 14, 4);
      ctx.fillStyle = '#ffd84a'; circle(sx + 16, sy + 14, 2);
      break;
    case T.TGRASS:
      ctx.fillStyle = PAL.tgrass; ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = PAL.tgrassD;
      for (let i = 0; i < 4; i++) {
        const bx = sx + 4 + i * 7;
        ctx.beginPath();
        ctx.moveTo(bx, sy + TILE);
        ctx.lineTo(bx - 3, sy + 16);
        ctx.lineTo(bx + 3, sy + 16);
        ctx.closePath(); ctx.fill();
      }
      break;
    case T.TREE:
      ctx.fillStyle = PAL.grass; ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = PAL.treeD; ctx.fillRect(sx + 14, sy + 20, 4, 10);
      ctx.fillStyle = PAL.tree; circle(sx + 16, sy + 14, 12);
      ctx.fillStyle = '#4f9040'; circle(sx + 12, sy + 11, 5); circle(sx + 21, sy + 15, 5);
      break;
    case T.WATER:
      ctx.fillStyle = PAL.water; ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = PAL.waterD;
      ctx.fillRect(sx + 4, sy + 8, 10, 2); ctx.fillRect(sx + 18, sy + 18, 10, 2);
      break;
    case T.WALL:
      ctx.fillStyle = PAL.wall; ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = '#a87848';
      ctx.fillRect(sx, sy + 10, TILE, 2); ctx.fillRect(sx + 15, sy, 2, TILE);
      break;
    case T.ROOF:
      ctx.fillStyle = PAL.roof; ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = PAL.roofD; ctx.fillRect(sx, sy + TILE - 6, TILE, 6);
      ctx.fillStyle = '#c85848'; ctx.fillRect(sx, sy, TILE, 4);
      break;
    case T.DOOR:
      ctx.fillStyle = PAL.wall; ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = PAL.brownD; ctx.fillRect(sx + 9, sy + 6, 14, TILE - 6);
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(sx + 19, sy + 18, 2, 3);
      break;
    case T.SIGN:
      ctx.fillStyle = PAL.grass; ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = PAL.brownD; ctx.fillRect(sx + 14, sy + 16, 4, 14);
      ctx.fillStyle = PAL.brown; ctx.fillRect(sx + 6, sy + 6, 20, 14);
      ctx.fillStyle = PAL.cream; ctx.fillRect(sx + 8, sy + 8, 16, 4); ctx.fillRect(sx + 8, sy + 14, 16, 3);
      break;
    case T.FOUNT:
      ctx.fillStyle = PAL.stone; ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = PAL.stoneD; ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
      ctx.fillStyle = PAL.water; ctx.fillRect(sx + 6, sy + 6, TILE - 12, TILE - 12);
      ctx.fillStyle = '#bfe6ff'; circle(sx + 16, sy + 14, 3);
      break;
    case T.FENCE:
      ctx.fillStyle = PAL.grass; ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = PAL.fence;
      ctx.fillRect(sx, sy + 12, TILE, 4); ctx.fillRect(sx, sy + 22, TILE, 4);
      ctx.fillRect(sx + 6, sy + 8, 4, 20); ctx.fillRect(sx + 22, sy + 8, 4, 20);
      break;
    case T.GYMW:
      ctx.fillStyle = PAL.gymw; ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = '#7a7088'; ctx.fillRect(sx, sy + 14, TILE, 2);
      ctx.fillStyle = '#a89ab8'; ctx.fillRect(sx + 4, sy + 4, 6, 6);
      break;
    default:
      ctx.fillStyle = PAL.grass; ctx.fillRect(sx, sy, TILE, TILE);
  }
}

function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }

/* ---------------------------------------------------------------------------
   RENDER: jugador y NPCs
--------------------------------------------------------------------------- */
function drawTrainer(sx, sy, color, dir, bob) {
  const cx = sx + 16;
  // cuerpo
  ctx.fillStyle = color;
  ctx.fillRect(cx - 7, sy + 14 - bob, 14, 12);
  // cabeza
  ctx.fillStyle = '#f0c890';
  circle(cx, sy + 10 - bob, 7);
  // gorra
  ctx.fillStyle = '#c83838';
  ctx.fillRect(cx - 7, sy + 4 - bob, 14, 5);
  ctx.fillRect(cx - 9, sy + 8 - bob, 6, 2);
  // ojos según dirección
  ctx.fillStyle = '#222';
  if (dir === 'down') { ctx.fillRect(cx - 4, sy + 9 - bob, 2, 2); ctx.fillRect(cx + 2, sy + 9 - bob, 2, 2); }
  else if (dir === 'up') { /* de espaldas */ }
  else if (dir === 'left') { ctx.fillRect(cx - 5, sy + 9 - bob, 2, 2); }
  else { ctx.fillRect(cx + 3, sy + 9 - bob, 2, 2); }
  // piernas
  ctx.fillStyle = '#3a3a5a';
  const step = bob ? 2 : 0;
  ctx.fillRect(cx - 6, sy + 26 - bob, 5, 5 - step);
  ctx.fillRect(cx + 1, sy + 26 - bob, 5, 5 - (2 - step));
}

function drawPlayerSprite(sx, sy) {
  const bob = (player.moving && player.walkFrame) ? 1 : 0;
  drawTrainer(sx, sy, '#3858a8', player.dir, bob);
}

function drawNPC(n, sx, sy) {
  drawTrainer(sx, sy, n.color, n.dir, 0);
}

/* ---------------------------------------------------------------------------
   RENDER: criaturas (sprites procedurales)
--------------------------------------------------------------------------- */
function drawCreature(c, cx, cy, s) {
  const sp = c.species;
  ctx.save();
  switch (sp.shape) {
    case 'grape':  drawGrape(cx, cy, s, sp.color, sp.color2); break;
    case 'oak':    drawOak(cx, cy, s, sp.color, sp.color2); break;
    case 'olive':  drawOlive(cx, cy, s, sp.color, sp.color2); break;
    case 'rock':   drawRock(cx, cy, s, sp.color, sp.color2); break;
    case 'wind':   drawWind(cx, cy, s, sp.color, sp.color2); break;
    case 'wine':   drawWine(cx, cy, s, sp.color, sp.color2); break;
  }
  ctx.restore();
}

function eyes(cx, cy, r, sp) {
  ctx.fillStyle = '#fff';
  circle(cx - sp, cy, r); circle(cx + sp, cy, r);
  ctx.fillStyle = '#222';
  circle(cx - sp, cy + 1, r * 0.55); circle(cx + sp, cy + 1, r * 0.55);
}

function drawGrape(cx, cy, s, col, col2) {
  // hoja y tallo
  ctx.fillStyle = '#3c9a34';
  ctx.fillRect(cx - 2, cy - s * 0.9, 4, s * 0.25);
  ctx.beginPath();
  ctx.ellipse(cx + s * 0.25, cy - s * 0.75, s * 0.22, s * 0.12, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // racimo (triángulo de uvas)
  const r = s * 0.17;
  const rows = [ [0], [-1, 1], [-2, 0, 2], [-1, 1], [0] ];
  let yy = cy - s * 0.55;
  for (const row of rows) {
    for (const ox of row) {
      ctx.fillStyle = col;
      circle(cx + ox * r * 0.95, yy, r);
      ctx.fillStyle = col2;
      circle(cx + ox * r * 0.95 - r * 0.3, yy - r * 0.3, r * 0.35);
    }
    yy += r * 1.5;
  }
  eyes(cx, cy - s * 0.05, s * 0.1, s * 0.22);
}

function drawOak(cx, cy, s, col, col2) {
  // tronco
  ctx.fillStyle = '#6e4a2a';
  ctx.fillRect(cx - s * 0.12, cy + s * 0.2, s * 0.24, s * 0.55);
  // copa
  ctx.fillStyle = col2;
  circle(cx, cy, s * 0.5);
  ctx.fillStyle = col;
  circle(cx - s * 0.3, cy - s * 0.05, s * 0.3);
  circle(cx + s * 0.3, cy - s * 0.05, s * 0.3);
  circle(cx, cy - s * 0.35, s * 0.32);
  circle(cx, cy + s * 0.1, s * 0.35);
  // bellota
  ctx.fillStyle = '#8a5a2a';
  circle(cx + s * 0.4, cy + s * 0.3, s * 0.09);
  eyes(cx, cy + s * 0.05, s * 0.1, s * 0.2);
}

function drawOlive(cx, cy, s, col, col2) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(cx, cy, s * 0.42, s * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = col2;
  ctx.beginPath();
  ctx.ellipse(cx + s * 0.12, cy + s * 0.1, s * 0.18, s * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  // hojita
  ctx.fillStyle = '#3c9a34';
  ctx.beginPath();
  ctx.ellipse(cx + s * 0.15, cy - s * 0.5, s * 0.18, s * 0.08, -0.6, 0, Math.PI * 2);
  ctx.fill();
  eyes(cx, cy - s * 0.05, s * 0.1, s * 0.18);
}

function drawRock(cx, cy, s, col, col2) {
  const r = s * 0.5;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy + r * 0.5);
  ctx.lineTo(cx - r * 0.7, cy - r * 0.5);
  ctx.lineTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.8, cy - r * 0.4);
  ctx.lineTo(cx + r, cy + r * 0.6);
  ctx.lineTo(cx + r * 0.3, cy + r);
  ctx.lineTo(cx - r * 0.6, cy + r);
  ctx.closePath();
  ctx.fill();
  // facetas
  ctx.fillStyle = col2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * 0.8, cy - r * 0.4);
  ctx.lineTo(cx + r, cy + r * 0.6); ctx.lineTo(cx + r * 0.3, cy + r * 0.2);
  ctx.closePath(); ctx.fill();
  eyes(cx - s * 0.05, cy, s * 0.1, s * 0.18);
}

function drawWind(cx, cy, s, col, col2) {
  ctx.strokeStyle = col2;
  ctx.lineWidth = s * 0.12;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    const rr = s * (0.22 + i * 0.13);
    ctx.arc(cx, cy, rr, Math.PI * 0.2, Math.PI * 1.7);
    ctx.stroke();
  }
  ctx.fillStyle = col;
  circle(cx, cy, s * 0.2);
  eyes(cx, cy - s * 0.02, s * 0.08, s * 0.13);
}

function drawWine(cx, cy, s, col, col2) {
  // bota / botijo
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.35, cy - s * 0.2);
  ctx.lineTo(cx + s * 0.35, cy - s * 0.2);
  ctx.lineTo(cx + s * 0.45, cy + s * 0.5);
  ctx.lineTo(cx - s * 0.45, cy + s * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = col2;
  ctx.fillRect(cx - s * 0.45, cy + s * 0.35, s * 0.9, s * 0.15);
  // cuello + tapón
  ctx.fillStyle = col;
  ctx.fillRect(cx - s * 0.1, cy - s * 0.45, s * 0.2, s * 0.28);
  ctx.fillStyle = '#caa050';
  ctx.fillRect(cx - s * 0.12, cy - s * 0.55, s * 0.24, s * 0.12);
  eyes(cx, cy + s * 0.05, s * 0.1, s * 0.18);
}

/* ---------------------------------------------------------------------------
   RENDER PRINCIPAL
--------------------------------------------------------------------------- */
function render() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  switch (gameState) {
    case 'title':       renderTitle(); break;
    case 'starterPick': renderStarter(); break;
    case 'overworld':
    case 'dialog':      renderWorld(); if (gameState === 'dialog') renderDialog(); break;
    case 'battle':      renderBattle(); break;
    case 'win':         renderWin(); break;
  }
}

function renderWorld() {
  // cámara centrada en el jugador con clamp
  let camX = player.px + 16 - VIEW_W / 2;
  let camY = player.py + 16 - VIEW_H / 2;
  camX = Math.max(0, Math.min(MAP_W * TILE - VIEW_W, camX));
  camY = Math.max(0, Math.min(MAP_H * TILE - VIEW_H, camY));

  const startX = Math.floor(camX / TILE), startY = Math.floor(camY / TILE);
  for (let y = startY; y <= startY + ROWS; y++) {
    for (let x = startX; x <= startX + COLS; x++) {
      if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) {
        ctx.fillStyle = '#235018';
        ctx.fillRect(x * TILE - camX, y * TILE - camY, TILE, TILE);
        continue;
      }
      drawTile(map[y][x], Math.round(x * TILE - camX), Math.round(y * TILE - camY));
    }
  }
  // NPCs
  for (const n of npcs) {
    drawNPC(n, Math.round(n.x * TILE - camX), Math.round(n.y * TILE - camY));
  }
  // Jugador
  drawPlayerSprite(Math.round(player.px - camX), Math.round(player.py - camY));

  // HUD mínimo
  if (gymDefeated) {
    drawText('★ Medalla Garnacha', 6, 6, '#ffe080', 11);
  }
}

function renderDialog() {
  const h = 70;
  drawPanel(12, VIEW_H - h - 8, VIEW_W - 24, h);
  const line = dialog.lines[dialog.index] || '';
  wrapText(line, 24, VIEW_H - h + 4, VIEW_W - 48, 16, PAL.brownD, 13);
  drawText('▼ (Z)', VIEW_W - 70, VIEW_H - 22, PAL.brown, 11);
}

function wrapText(text, x, y, maxW, lineH, color, size) {
  ctx.font = size + 'px monospace';
  const words = text.split(' ');
  let line = '', yy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      drawText(line, x, yy, color, size);
      line = w; yy += lineH;
    } else line = test;
  }
  if (line) drawText(line, x, yy, color, size);
}

/* --- TÍTULO --- */
function renderTitle() {
  // fondo cálido
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#b85040'); g.addColorStop(1, '#7a2818');
  ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  drawText('PUROS DE LA COMARCA', VIEW_W / 2, 28, '#ffe8b0', 22, 'center');
  drawText('de CARIÑENA', VIEW_W / 2, 56, '#ffd070', 18, 'center');

  // tres iniciales
  const names = STARTERS.map(k => SPECIES[k]);
  for (let i = 0; i < 3; i++) {
    const x = 90 + i * 150;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x - 42, 110, 84, 96);
    drawCreature({ species: names[i] }, x, 150, 56);
    drawText(names[i].name, x, 188, '#fff', 12, 'center');
    drawText(names[i].type, x, 202, TYPE_COLOR[names[i].type] === '#a8a878' ? '#fff' : '#ffe8b0', 10, 'center');
  }
  drawText('Garnacha, encina y piedra de Algairén', VIEW_W / 2, 238, '#ffe8b0', 11, 'center');
  if (Math.floor(Date.now() / 500) % 2 === 0)
    drawText('Pulsa Z / A para empezar', VIEW_W / 2, 286, '#fff', 14, 'center');
}

/* --- ELEGIR INICIAL --- */
function renderStarter() {
  ctx.fillStyle = '#2a6020'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#3c7a28'; ctx.fillRect(0, 0, VIEW_W, 70);
  drawText('El Profesor Cariñena te ofrece un puro:', VIEW_W / 2, 24, '#fff', 13, 'center');

  for (let i = 0; i < 3; i++) {
    const x = 90 + i * 150;
    const sel = i === starterCursor;
    drawPanel(x - 56, 96, 112, 150);
    if (sel) { ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 3; ctx.strokeRect(x - 56, 96, 112, 150); }
    const sp = SPECIES[STARTERS[i]];
    drawCreature({ species: sp }, x, 150, 56);
    drawText(sp.name, x, 196, PAL.brownD, 13, 'center');
    drawText('Tipo ' + sp.type, x, 214, PAL.brown, 11, 'center');
    drawText('→ ' + SPECIES[sp.evolvesTo].name + ' (Nv14)', x, 228, PAL.brown, 9, 'center');
  }
  drawText('◄ ►  elegir     Z aceptar', VIEW_W / 2, 286, '#fff', 13, 'center');
}

/* --- VICTORIA --- */
function renderWin() {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#caa050'); g.addColorStop(1, '#8a5a20');
  ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawText('¡VICTORIA!', VIEW_W / 2, 40, '#fff', 28, 'center');
  // medalla
  ctx.fillStyle = '#ffd84a'; circle(VIEW_W / 2, 130, 34);
  ctx.fillStyle = '#b85040'; circle(VIEW_W / 2, 130, 22);
  ctx.fillStyle = '#fff'; drawText('★', VIEW_W / 2, 120, '#fff', 26, 'center');
  drawText('Has ganado la MEDALLA GARNACHA', VIEW_W / 2, 184, '#fff', 14, 'center');
  drawText('Don Mosto reconoce tu solera.', VIEW_W / 2, 210, '#ffe8b0', 12, 'center');
  if (Math.floor(Date.now() / 500) % 2 === 0)
    drawText('Pulsa Z para seguir explorando', VIEW_W / 2, 268, '#fff', 13, 'center');
}

/* --- COMBATE --- */
function renderBattle() {
  // fondo
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#bfe0ff'); g.addColorStop(0.6, '#e8d8a8'); g.addColorStop(1, '#c0a060');
  ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // plataformas
  ctx.fillStyle = 'rgba(110,90,40,0.35)';
  ctx.beginPath(); ctx.ellipse(360, 150, 70, 18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(120, 240, 80, 20, 0, 0, Math.PI * 2); ctx.fill();

  const enemy = battle.enemy;
  const pc = activeCreature();

  // sprites
  drawCreature(enemy, 360, 130, 64);
  drawCreature(pc, 120, 220, 76);

  // cuadros de info
  drawInfoBox(enemy, 16, 20, false);
  drawInfoBox(pc, VIEW_W - 196, 150, true);

  // panel inferior
  drawPanel(8, VIEW_H - 86, VIEW_W - 16, 78);

  if (battle.phase === 'message') {
    wrapText(battle.msg, 22, VIEW_H - 74, VIEW_W - 44, 16, PAL.brownD, 13);
    drawText('▼', VIEW_W - 30, VIEW_H - 24, PAL.brown, 13);
  } else if (battle.phase === 'menu') {
    renderBattleMenu();
  } else if (battle.phase === 'move') {
    renderMoveMenu();
  } else if (battle.phase === 'team') {
    renderTeamMenu();
  }

  if (flash.t > 0) {
    drawPanel(60, 120, VIEW_W - 120, 40);
    drawText(flash.text, VIEW_W / 2, 132, PAL.brownD, 12, 'center');
  }
}

function drawInfoBox(c, x, y, isPlayer) {
  drawPanel(x, y, 180, isPlayer ? 56 : 44);
  drawText(c.name, x + 8, y + 6, PAL.brownD, 13);
  drawText('Nv' + c.level, x + 142, y + 6, PAL.brownD, 12);
  // tipo
  ctx.fillStyle = TYPE_COLOR[c.species.type];
  ctx.fillRect(x + 8, y + 22, 34, 11);
  drawText(c.species.type, x + 10, y + 23, '#fff', 9);
  // barra HP
  const bx = x + 50, by = y + 24, bw = 120, bh = 8;
  ctx.fillStyle = PAL.brownD; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
  ctx.fillStyle = '#555'; ctx.fillRect(bx, by, bw, bh);
  const ratio = Math.max(0, c.hp / c.maxHp);
  ctx.fillStyle = ratio > 0.5 ? '#48c050' : ratio > 0.2 ? '#e8c040' : '#e04040';
  ctx.fillRect(bx, by, Math.round(bw * ratio), bh);
  if (isPlayer) drawText(c.hp + ' / ' + c.maxHp, x + 142, y + 38, PAL.brownD, 11, 'right');
}

function renderBattleMenu() {
  drawText('¿Qué hará ' + activeCreature().name + '?', 22, VIEW_H - 74, PAL.brownD, 12);
  const opts = ['LUCHAR', 'CÁNTARO', 'EQUIPO', 'HUIR'];
  const ox = 230, oy = VIEW_H - 70;
  for (let i = 0; i < 4; i++) {
    const cx = ox + (i % 2) * 110;
    const cy = oy + Math.floor(i / 2) * 26;
    if (i === battle.cursor) drawText('▶', cx - 14, cy, PAL.roof, 13);
    drawText(opts[i], cx, cy, PAL.brownD, 13);
  }
}

function renderMoveMenu() {
  const moves = activeCreature().moves;
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    const cy = VIEW_H - 76 + i * 17;
    if (i === battle.cursor) drawText('▶', 18, cy, PAL.roof, 13);
    drawText(m.move.name, 32, cy, m.pp > 0 ? PAL.brownD : '#a04040', 12);
    drawText(m.move.type, 170, cy, TYPE_COLOR[m.move.type] === '#a8a878' ? PAL.brownD : TYPE_COLOR[m.move.type], 11);
  }
  const sel = moves[battle.cursor];
  drawText('PP ' + sel.pp + '/' + sel.maxpp, 300, VIEW_H - 76, PAL.brownD, 12);
  drawText('Pot ' + sel.move.power, 300, VIEW_H - 58, PAL.brownD, 12);
  drawText('X: atrás', 300, VIEW_H - 28, PAL.brown, 11);
}

function renderTeamMenu() {
  drawText(battle.forced ? '¡Elige tu próximo puro!' : 'Cambiar a:', 22, VIEW_H - 78, PAL.brownD, 12);
  for (let i = 0; i < player.team.length; i++) {
    const c = player.team[i];
    const cy = VIEW_H - 62 + (i % 3) * 16;
    const cx = 22 + Math.floor(i / 3) * 230;
    if (i === battle.cursor) drawText('▶', cx - 12, cy, PAL.roof, 12);
    const col = c.hp <= 0 ? '#a04040' : (i === battle.active ? '#2a7a2a' : PAL.brownD);
    drawText(c.name + ' Nv' + c.level + '  ' + c.hp + '/' + c.maxHp, cx, cy, col, 11);
  }
}

/* ---------------------------------------------------------------------------
   CONTROLES TÁCTILES
--------------------------------------------------------------------------- */
function bindTouch() {
  const bind = (id, action) => {
    const el = document.getElementById(id);
    if (!el) return;
    const down = e => { e.preventDefault(); if (!keys[action]) onPress(action); keys[action] = true; };
    const up = e => { e.preventDefault(); keys[action] = false; };
    el.addEventListener('touchstart', down, { passive: false });
    el.addEventListener('touchend', up, { passive: false });
    el.addEventListener('touchcancel', up, { passive: false });
    el.addEventListener('mousedown', down);
    el.addEventListener('mouseup', up);
    el.addEventListener('mouseleave', up);
  };
  bind('btn-up', 'up'); bind('btn-down', 'down');
  bind('btn-left', 'left'); bind('btn-right', 'right');
  bind('btn-a', 'a'); bind('btn-b', 'b');
}

/* ---------------------------------------------------------------------------
   BUCLE PRINCIPAL
--------------------------------------------------------------------------- */
let last = performance.now();
function loop(t) {
  let dt = (t - last) / 1000;
  last = t;
  if (dt > 0.1) dt = 0.1;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function init() {
  buildWorld();
  player = makePlayer();
  bindTouch();
  requestAnimationFrame(loop);
}

init();

})();
