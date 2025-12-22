/* =========================
   POKÉMON COMARCA DE CARIÑENA
   Motor principal - p5.js
========================= */

// Configuración global del juego
const GAME = {
  width: 512,
  height: 384,
  scale: 2,
  currentScene: 'menu',
  debugMode: false,

  // Datos del jugador
  data: {
    pokemon: [],
    money: 3000,
    items: { pokeball: 5, potion: 3 },
    badges: [],
    defeatedTrainers: [],
    visitedMaps: ['encinacorba'],
    currentMap: 'encinacorba',
    playerX: 12 * 16,
    playerY: 12 * 16,
    starterChosen: false
  },

  // Cambiar escena
  setScene(sceneName) {
    const scenes = ['menu', 'world', 'battle', 'regionMap'];
    if (!scenes.includes(sceneName)) {
      console.error(`Escena "${sceneName}" no existe`);
      return;
    }
    this.currentScene = sceneName;

    // Inicializar escena
    switch (sceneName) {
      case 'menu': MenuScene.init(); break;
      case 'world': WorldScene.init(); break;
      case 'regionMap': RegionMapScene.init(); break;
    }
  },

  // Iniciar batalla
  startBattle(encounters, type = 'wild') {
    this.currentScene = 'battle';
    BattleScene.init(encounters, type);
  },

  // Guardar partida
  saveGame() {
    try {
      localStorage.setItem('pokemon_comarca_save', JSON.stringify(this.data));
      console.log('Partida guardada');
    } catch (e) {
      console.error('Error al guardar:', e);
    }
  },

  // Cargar partida
  loadGame() {
    try {
      const save = localStorage.getItem('pokemon_comarca_save');
      if (save) {
        const data = JSON.parse(save);
        Object.assign(this.data, data);

        // Reconstruir objetos Pokemon
        if (this.data.pokemon && this.data.pokemon.length > 0) {
          this.data.pokemon = this.data.pokemon.map(p => {
            const pokemon = new Pokemon(p.id, p.level);
            pokemon.hp = p.hp;
            pokemon.exp = p.exp;
            return pokemon;
          });
        }

        console.log('Partida cargada');
        return true;
      }
    } catch (e) {
      console.error('Error al cargar:', e);
    }
    return false;
  }
};

/* =========================
   DATOS DE MAPAS
========================= */
const MAPS = {
  encinacorba: {
    name: 'Encinacorba',
    type: 'town',
    width: 25,
    height: 20,
    encounters: [],
    data: null,
    npcs: [
      {
        x: 8, y: 10,
        name: 'Prof. Garnacha',
        type: 'professor',
        dialog: ['¡Bienvenido al mundo Pokémon!', 'Soy el Profesor Garnacha.', 'Especialista en Pokémon de la vid.'],
        action: 'starter'
      }
    ],
    buildings: [
      { x: 4, y: 6, type: 'house', name: 'Tu Casa' },
      { x: 10, y: 6, type: 'pokecenter', action: 'heal' },
      { x: 16, y: 6, type: 'mart', action: 'shop', items: ['pokeball', 'potion'] }
    ],
    exits: [
      { x: 24, y: 10, toMap: 'ruta_vino_1', toX: 1, toY: 12 },
      { x: 24, y: 11, toMap: 'ruta_vino_1', toX: 1, toY: 13 }
    ]
  },

  ruta_vino_1: {
    name: 'Ruta del Vino 1',
    type: 'route',
    width: 30,
    height: 25,
    grassDensity: 0.35,
    encounters: [
      { id: 16, rate: 60, minLv: 2, maxLv: 4 },  // Pidgey
      { id: 19, rate: 40, minLv: 2, maxLv: 4 }   // Rattata
    ],
    data: null,
    npcs: [],
    buildings: [],
    exits: [
      { x: 0, y: 12, toMap: 'encinacorba', toX: 23, toY: 10 },
      { x: 0, y: 13, toMap: 'encinacorba', toX: 23, toY: 11 },
      { x: 29, y: 12, toMap: 'ruta_vino_2', toX: 1, toY: 12 },
      { x: 29, y: 13, toMap: 'ruta_vino_2', toX: 1, toY: 13 }
    ]
  },

  ruta_vino_2: {
    name: 'Ruta del Vino 2',
    type: 'route',
    width: 30,
    height: 25,
    grassDensity: 0.40,
    encounters: [
      { id: 16, rate: 50, minLv: 3, maxLv: 5 },  // Pidgey
      { id: 19, rate: 30, minLv: 3, maxLv: 5 },  // Rattata
      { id: 1, rate: 20, minLv: 3, maxLv: 5 }    // Bulbasaur raro!
    ],
    data: null,
    npcs: [],
    buildings: [],
    exits: [
      { x: 0, y: 12, toMap: 'ruta_vino_1', toX: 28, toY: 12 },
      { x: 0, y: 13, toMap: 'ruta_vino_1', toX: 28, toY: 13 },
      { x: 29, y: 12, toMap: 'carinena', toX: 1, toY: 12 },
      { x: 29, y: 13, toMap: 'carinena', toX: 1, toY: 13 }
    ]
  },

  carinena: {
    name: 'Cariñena',
    type: 'city',
    width: 35,
    height: 30,
    encounters: [],
    data: null,
    npcs: [
      {
        x: 17, y: 15,
        name: 'Alcalde',
        type: 'oldman',
        dialog: ['¡Bienvenido a Cariñena!', 'La capital del vino de Aragón.', 'Nuestro Gimnasio es muy famoso.']
      },
      {
        x: 22, y: 10,
        name: 'Líder Tempranillo',
        type: 'gymleader',
        dialog: ['Soy el Líder del Gimnasio.', '¡Acepto tu desafío!'],
        action: 'battle'
      }
    ],
    buildings: [
      { x: 6, y: 8, type: 'pokecenter', action: 'heal' },
      { x: 14, y: 8, type: 'mart', action: 'shop', items: ['pokeball', 'potion'] },
      { x: 22, y: 8, type: 'gym', name: 'Gimnasio Cariñena' }
    ],
    exits: [
      { x: 0, y: 12, toMap: 'ruta_vino_2', toX: 28, toY: 12 },
      { x: 0, y: 13, toMap: 'ruta_vino_2', toX: 28, toY: 13 },
      { x: 34, y: 15, toMap: 'ruta_vino_3', toX: 1, toY: 12 }
    ]
  },

  ruta_vino_3: {
    name: 'Ruta del Vino 3',
    type: 'route',
    width: 30,
    height: 25,
    grassDensity: 0.45,
    encounters: [
      { id: 16, rate: 30, minLv: 5, maxLv: 8 },  // Pidgey
      { id: 4, rate: 25, minLv: 5, maxLv: 7 },   // Charmander raro!
      { id: 7, rate: 25, minLv: 5, maxLv: 7 },   // Squirtle raro!
      { id: 25, rate: 20, minLv: 4, maxLv: 6 }   // Pikachu!
    ],
    data: null,
    npcs: [],
    buildings: [],
    exits: [
      { x: 0, y: 12, toMap: 'carinena', toX: 33, toY: 15 }
    ]
  }
};

/* =========================
   FUNCIONES P5.JS
========================= */
function setup() {
  const canvas = createCanvas(GAME.width, GAME.height);
  canvas.parent('game-wrapper');
  canvas.id('game');

  pixelDensity(1);
  noSmooth();
  textFont('Press Start 2P');

  // Cargar partida si existe
  GAME.loadGame();

  // Inicializar escena inicial
  GAME.setScene('menu');

  console.log('🍇 Pokémon Comarca de Cariñena - Iniciado');
}

function draw() {
  // Actualizar escena actual
  switch (GAME.currentScene) {
    case 'menu':
      MenuScene.update();
      MenuScene.draw();
      break;
    case 'world':
      WorldScene.update();
      WorldScene.draw();
      break;
    case 'battle':
      BattleScene.update();
      BattleScene.draw();
      break;
    case 'regionMap':
      RegionMapScene.update();
      RegionMapScene.draw();
      break;
  }

  // Debug info
  if (GAME.debugMode) {
    fill(255, 0, 0);
    textSize(8);
    textAlign(LEFT);
    text(`FPS: ${Math.round(frameRate())}`, 5, GAME.height - 5);
    text(`Scene: ${GAME.currentScene}`, 80, GAME.height - 5);
  }
}

function keyPressed() {
  // Toggle debug
  if (keyCode === SHIFT) {
    GAME.debugMode = !GAME.debugMode;
    return;
  }

  // Pasar input a escena actual
  switch (GAME.currentScene) {
    case 'menu':
      MenuScene.keyPressed();
      break;
    case 'world':
      WorldScene.keyPressed();
      break;
    case 'battle':
      BattleScene.keyPressed();
      break;
    case 'regionMap':
      RegionMapScene.keyPressed();
      break;
  }
}

/* =========================
   INICIALIZACIÓN
========================= */
console.log('🍷 Cargando Pokémon Comarca de Cariñena...');
