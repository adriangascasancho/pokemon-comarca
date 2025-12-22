/* =========================
   ESCENA: MUNDO / EXPLORACIÓN
========================= */

const WorldScene = {
  player: null,
  camera: { x: 0, y: 0 },
  currentMap: null,
  dialog: null,
  menu: null,
  tileSize: 16,
  encounterCooldown: 0,

  // Paleta de colores GBA
  PAL: {
    grassLight: '#9BE070',
    grassMid: '#6EC44A',
    grassDark: '#3E9A32',
    tallGrass: '#5FCB44',
    pathLight: '#E6D08A',
    pathMid: '#CDAA63',
    pathDark: '#A68444',
    treeLight: '#4FC05A',
    treeMid: '#2F8E3A',
    treeDark: '#1F6A2B',
    trunk: '#B07A32',
    waterLight: '#7FC8FF',
    waterMid: '#3F8CF2',
    wallLight: '#FFF2D8',
    wallMid: '#E9D6B9',
    roofRed: '#E86860',
    roofBlue: '#5A90E8',
    roofGreen: '#5FBF6A'
  },

  init() {
    this.player = new Player(
      GAME.data.playerX || 12 * this.tileSize,
      GAME.data.playerY || 12 * this.tileSize
    );
    this.currentMap = MAPS[GAME.data.currentMap || 'encinacorba'];
    this.generateMapData();
    this.dialog = null;
    this.menu = null;
  },

  generateMapData() {
    // Generar datos de mapa si no existen
    for (const [id, map] of Object.entries(MAPS)) {
      if (!map.data) {
        if (map.type === 'town' || map.type === 'city') {
          map.data = this.generateTownMap(map);
        } else {
          map.data = this.generateRouteMap(map);
        }
      }
    }
  },

  generateTownMap(map) {
    const data = [];
    for (let y = 0; y < map.height; y++) {
      const row = [];
      for (let x = 0; x < map.width; x++) {
        // Bordes con árboles
        if (y < 2 || y >= map.height - 2 || x < 2 || x >= map.width - 2) {
          row.push('tree');
        }
        // Camino central
        else if (Math.abs(y - Math.floor(map.height / 2)) <= 1) {
          row.push('path');
        }
        // Hierba con variación
        else {
          row.push(hash(x, y, 101) < 0.3 ? 'grass2' : 'grass');
        }
      }
      data.push(row);
    }

    // Colocar edificios
    map.buildings?.forEach(b => {
      this.placeBuilding(data, b.x, b.y, b.type);
      // Camino al edificio
      const mid = Math.floor(map.height / 2);
      for (let py = b.y + 3; py <= mid; py++) {
        if (data[py]) {
          data[py][b.x + 1] = 'path';
          data[py][b.x + 2] = 'path';
        }
      }
    });

    // Salidas
    map.exits?.forEach(e => {
      if (data[e.y]) data[e.y][e.x] = 'path';
    });

    return data;
  },

  generateRouteMap(map) {
    const data = [];
    const pathY = Math.floor(map.height / 2);

    for (let y = 0; y < map.height; y++) {
      const row = [];
      for (let x = 0; x < map.width; x++) {
        // Bordes
        if (y < 2 || y >= map.height - 2) {
          row.push('tree');
        }
        // Camino
        else if (Math.abs(y - pathY) <= 1) {
          row.push('path');
        }
        // Hierba alta (encuentros)
        else if (hash(x, y, 203) < (map.grassDensity || 0.35)) {
          row.push('tallgrass');
        }
        // Árboles aleatorios
        else if (hash(x, y, 204) < 0.05 && x > 3 && x < map.width - 3) {
          row.push('tree');
        }
        // Hierba normal
        else {
          row.push(hash(x, y, 205) < 0.3 ? 'grass2' : 'grass');
        }
      }
      data.push(row);
    }

    return data;
  },

  placeBuilding(data, x, y, type) {
    // Techo (fila y)
    for (let i = 0; i < 4; i++) {
      if (data[y]) data[y][x + i] = `${type}_roof`;
    }
    // Pared (fila y+1)
    for (let i = 0; i < 4; i++) {
      if (data[y + 1]) data[y + 1][x + i] = `${type}_wall`;
    }
    // Puerta (fila y+2)
    if (data[y + 2]) {
      data[y + 2][x] = `${type}_wall`;
      data[y + 2][x + 1] = `${type}_door`;
      data[y + 2][x + 2] = `${type}_door`;
      data[y + 2][x + 3] = `${type}_wall`;
    }
  },

  update() {
    if (this.dialog || this.menu) return;

    const prevX = this.player.x;
    const prevY = this.player.y;

    this.player.update();

    // Colisiones
    if (this.checkCollision(this.player.x, this.player.y)) {
      this.player.x = prevX;
      this.player.y = prevY;
    }

    // Salidas del mapa
    this.checkExits();

    // Encuentros
    if (this.encounterCooldown > 0) this.encounterCooldown--;
    this.checkEncounters();

    // Actualizar cámara
    this.updateCamera();
  },

  checkCollision(x, y) {
    const tileX = Math.floor((x + 8) / this.tileSize);
    const tileY = Math.floor((y + 8) / this.tileSize);

    const tile = this.currentMap.data?.[tileY]?.[tileX];
    const solidTiles = ['tree', 'water', 'house_wall', 'house_roof',
      'pokecenter_wall', 'pokecenter_roof', 'mart_wall', 'mart_roof',
      'gym_wall', 'gym_roof'];

    if (solidTiles.some(s => tile?.includes(s) && !tile.includes('door'))) {
      return true;
    }

    // Colisión con NPCs
    for (const npc of (this.currentMap.npcs || [])) {
      if (Math.abs(x - npc.x) < 12 && Math.abs(y - npc.y) < 12) {
        return true;
      }
    }

    return false;
  },

  checkExits() {
    const tileX = Math.floor((this.player.x + 8) / this.tileSize);
    const tileY = Math.floor((this.player.y + 8) / this.tileSize);

    for (const exit of (this.currentMap.exits || [])) {
      if (exit.x === tileX && exit.y === tileY) {
        this.changeMap(exit.toMap, exit.toX, exit.toY);
        break;
      }
    }
  },

  changeMap(mapId, toX, toY) {
    this.currentMap = MAPS[mapId];
    GAME.data.currentMap = mapId;

    if (!this.currentMap.data) {
      this.generateMapData();
    }

    this.player.x = toX * this.tileSize;
    this.player.y = toY * this.tileSize;
    GAME.data.playerX = this.player.x;
    GAME.data.playerY = this.player.y;

    // Registrar mapa visitado
    if (!GAME.data.visitedMaps.includes(mapId)) {
      GAME.data.visitedMaps.push(mapId);
    }
  },

  checkEncounters() {
    if (this.encounterCooldown > 0) return;
    if (!this.player.isMoving) return;

    const tileX = Math.floor((this.player.x + 8) / this.tileSize);
    const tileY = Math.floor((this.player.y + 8) / this.tileSize);
    const tile = this.currentMap.data?.[tileY]?.[tileX];

    if (tile === 'tallgrass' && this.currentMap.encounters?.length) {
      if (random() < 0.10) {
        this.encounterCooldown = 60;
        GAME.startBattle(this.currentMap.encounters);
      }
    }
  },

  updateCamera() {
    const targetX = this.player.x - GAME.width / GAME.scale / 2 + 8;
    const targetY = this.player.y - GAME.height / GAME.scale / 2 + 8;

    const maxX = this.currentMap.width * this.tileSize - GAME.width / GAME.scale;
    const maxY = this.currentMap.height * this.tileSize - GAME.height / GAME.scale;

    this.camera.x = clamp(targetX, 0, Math.max(0, maxX));
    this.camera.y = clamp(targetY, 0, Math.max(0, maxY));
  },

  draw() {
    background(0);

    push();
    scale(GAME.scale);
    translate(-this.camera.x, -this.camera.y);

    this.drawMap();
    this.drawNPCs();
    this.player.draw(0, 0);

    pop();

    this.drawUI();

    if (this.dialog) this.drawDialog();
    if (this.menu) this.drawMenu();
  },

  drawMap() {
    const startX = Math.floor(this.camera.x / this.tileSize);
    const startY = Math.floor(this.camera.y / this.tileSize);
    const endX = startX + Math.ceil(GAME.width / GAME.scale / this.tileSize) + 2;
    const endY = startY + Math.ceil(GAME.height / GAME.scale / this.tileSize) + 2;

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = this.currentMap.data?.[y]?.[x];
        if (tile) {
          this.drawTile(tile, x * this.tileSize, y * this.tileSize);
        }
      }
    }
  },

  drawTile(tile, x, y) {
    const s = this.tileSize;
    noStroke();

    switch (tile) {
      case 'grass':
        fill(this.PAL.grassMid);
        rect(x, y, s, s);
        // Detalles
        fill(this.PAL.grassLight);
        rect(x + 2, y + 2, 2, 2);
        rect(x + 10, y + 8, 2, 2);
        break;

      case 'grass2':
        fill(this.PAL.grassMid);
        rect(x, y, s, s);
        fill(this.PAL.grassDark);
        rect(x + 4, y + 6, 2, 2);
        rect(x + 12, y + 3, 2, 2);
        break;

      case 'tallgrass':
        fill(this.PAL.grassMid);
        rect(x, y, s, s);
        fill(this.PAL.tallGrass);
        for (let i = 0; i < 4; i++) {
          rect(x + i * 4, y + 4, 2, 10);
        }
        break;

      case 'path':
        fill(this.PAL.pathMid);
        rect(x, y, s, s);
        fill(this.PAL.pathLight);
        rect(x + 2, y + 2, 3, 3);
        fill(this.PAL.pathDark);
        rect(x + 10, y + 10, 3, 3);
        break;

      case 'tree':
        // Copa
        fill(this.PAL.treeDark);
        rect(x, y, s, s);
        fill(this.PAL.treeMid);
        rect(x + 2, y + 2, 12, 10);
        fill(this.PAL.treeLight);
        rect(x + 4, y + 4, 8, 6);
        // Tronco
        fill(this.PAL.trunk);
        rect(x + 5, y + 12, 6, 4);
        break;

      case 'water':
        fill(this.PAL.waterMid);
        rect(x, y, s, s);
        fill(this.PAL.waterLight);
        rect(x + 2, y + 4, 4, 1);
        rect(x + 8, y + 10, 5, 1);
        break;

      default:
        // Edificios
        if (tile.includes('roof')) {
          const roofColor = tile.includes('pokecenter') ? this.PAL.roofRed :
            tile.includes('mart') ? this.PAL.roofBlue :
              tile.includes('gym') ? this.PAL.roofGreen :
                this.PAL.roofRed;
          fill(roofColor);
          rect(x, y, s, s);
          fill(255, 255, 255, 50);
          rect(x + 2, y + 2, s - 4, 4);
        } else if (tile.includes('wall')) {
          fill(this.PAL.wallMid);
          rect(x, y, s, s);
          fill(this.PAL.wallLight);
          rect(x, y, s, 2);
          // Ventana
          fill('#2A66A8');
          rect(x + 4, y + 4, 8, 8);
          fill('#BFE9FF');
          rect(x + 5, y + 5, 6, 6);
        } else if (tile.includes('door')) {
          fill(this.PAL.wallMid);
          rect(x, y, s, s);
          fill('#9A5A24');
          rect(x + 3, y + 2, 10, 14);
          fill('#3A2416');
          rect(x + 4, y + 3, 8, 12);
          // Picaporte
          fill('#F8D030');
          rect(x + 10, y + 9, 2, 2);
        }
        break;
    }
  },

  drawNPCs() {
    for (const npcData of (this.currentMap.npcs || [])) {
      if (!npcData.entity) {
        npcData.entity = new NPC(
          npcData.x * this.tileSize,
          npcData.y * this.tileSize,
          npcData.name,
          npcData.type,
          npcData.dialog,
          npcData.action
        );
      }
      npcData.entity.draw(0, 0);
    }
  },

  drawUI() {
    // Nombre del mapa
    fill(255);
    stroke(0);
    strokeWeight(2);
    textSize(10);
    textAlign(LEFT);
    text(this.currentMap.name, 10, 20);

    // Dinero
    textAlign(RIGHT);
    text(`₧${GAME.data.money}`, GAME.width - 10, 20);
    noStroke();
  },

  drawDialog() {
    // Caja de diálogo
    fill(248);
    stroke(31, 42, 68);
    strokeWeight(4);
    rect(10, GAME.height - 80, GAME.width - 20, 70, 6);

    // Borde interior
    stroke(152, 176, 200);
    strokeWeight(2);
    rect(14, GAME.height - 76, GAME.width - 28, 62, 4);
    noStroke();

    // Texto
    fill(0);
    textSize(10);
    textAlign(LEFT);
    text(this.dialog.text, 24, GAME.height - 55);

    // Indicador
    if (Math.floor(frameCount / 20) % 2 === 0) {
      fill(31, 42, 68);
      triangle(
        GAME.width - 30, GAME.height - 20,
        GAME.width - 24, GAME.height - 20,
        GAME.width - 27, GAME.height - 14
      );
    }
  },

  drawMenu() {
    // Overlay oscuro
    fill(0, 0, 0, 100);
    rect(0, 0, GAME.width, GAME.height);

    // Caja del menú
    const menuX = GAME.width - 160;
    const menuY = 20;
    fill(248);
    stroke(31, 42, 68);
    strokeWeight(4);
    rect(menuX, menuY, 140, 200, 6);
    noStroke();

    const items = ['POKÉMON', 'MOCHILA', 'MAPA', 'GUARDAR', 'SALIR'];
    textSize(10);
    textAlign(LEFT);

    items.forEach((label, i) => {
      const yy = menuY + 30 + i * 30;
      if (this.menu.index === i) {
        fill(214, 69, 69);
        text('▶', menuX + 10, yy);
      }
      fill(30);
      text(label, menuX + 30, yy);
    });
  },

  keyPressed() {
    if (this.dialog) {
      if (keyCode === ENTER || key === ' ') {
        if (this.dialog.callback) {
          this.dialog.callback();
        }
        this.dialog = null;
      }
      return;
    }

    if (this.menu) {
      if (keyCode === ESCAPE || key === 'x') {
        this.menu = null;
      } else if (keyCode === UP_ARROW) {
        this.menu.index = Math.max(0, this.menu.index - 1);
      } else if (keyCode === DOWN_ARROW) {
        this.menu.index = Math.min(4, this.menu.index + 1);
      } else if (keyCode === ENTER) {
        this.executeMenu();
      }
      return;
    }

    // Abrir menú
    if (keyCode === ESCAPE || key === 'x') {
      this.menu = { index: 0 };
      return;
    }

    // Interactuar
    if (keyCode === ENTER || key === ' ') {
      this.interact();
    }

    // Abrir mapa regional
    if (key === 'm' || key === 'M') {
      GAME.setScene('regionMap');
    }
  },

  interact() {
    const facing = this.player.getFacingTile(this.tileSize);

    // NPCs
    for (const npcData of (this.currentMap.npcs || [])) {
      if (npcData.x === facing.x && npcData.y === facing.y) {
        this.showDialog(npcData.dialog[0]);
        return;
      }
    }

    // Puertas de edificios
    const tile = this.currentMap.data?.[facing.y]?.[facing.x];
    if (tile?.includes('door')) {
      const building = this.currentMap.buildings?.find(b =>
        facing.y === b.y + 2 && (facing.x === b.x + 1 || facing.x === b.x + 2)
      );

      if (building?.action === 'heal') {
        GAME.data.pokemon.forEach(p => p.fullHeal());
        this.showDialog('¡Tus Pokémon han sido curados!');
      } else if (building?.action === 'shop') {
        this.showDialog('¡Bienvenido a la tienda!');
      } else {
        this.showDialog('La puerta está cerrada.');
      }
    }
  },

  showDialog(text, callback = null) {
    this.dialog = { text, callback };
  },

  executeMenu() {
    switch (this.menu.index) {
      case 0: // Pokémon
        let txt = 'Tu equipo:\n';
        GAME.data.pokemon.forEach(p => {
          txt += `\n${p.name} Nv.${p.level} PS:${p.hp}/${p.maxHp}`;
        });
        this.menu = null;
        this.showDialog(txt);
        break;

      case 1: // Mochila
        let bag = 'Mochila:\n';
        for (const [id, count] of Object.entries(GAME.data.items)) {
          if (count > 0) bag += `\n${id}: x${count}`;
        }
        this.menu = null;
        this.showDialog(bag || 'Mochila vacía');
        break;

      case 2: // Mapa
        this.menu = null;
        GAME.setScene('regionMap');
        break;

      case 3: // Guardar
        GAME.saveGame();
        this.menu = null;
        this.showDialog('¡Partida guardada!');
        break;

      case 4: // Salir
        this.menu = null;
        break;
    }
  }
};
