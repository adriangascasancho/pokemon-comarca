/* =========================
   ESCENA: MAPA REGIONAL
========================= */

const RegionMapScene = {
  selectedIndex: 0,
  animFrame: 0,
  playerMarkerAnim: 0,

  // Datos de la Comarca de Cariñena
  locations: [
    { id: 'encinacorba', name: 'Encinacorba', x: 80, y: 280, type: 'town',
      desc: 'Tu pueblo natal. Hogar del Prof. Garnacha.', icon: 'house' },
    { id: 'ruta_vino_1', name: 'Ruta Vino 1', x: 150, y: 260, type: 'route',
      desc: 'Camino entre viñedos ancestrales.' },
    { id: 'ruta_vino_2', name: 'Ruta Vino 2', x: 220, y: 220, type: 'route',
      desc: 'Sendero por las bodegas antiguas.' },
    { id: 'carinena', name: 'Cariñena', x: 300, y: 180, type: 'city',
      desc: 'Capital del vino. ¡Tiene Gimnasio!', icon: 'gym' },
    { id: 'ruta_vino_3', name: 'Ruta Vino 3', x: 380, y: 140, type: 'route',
      desc: 'Camino hacia las montañas.' },
    { id: 'aguaron', name: 'Aguarón', x: 450, y: 100, type: 'town', locked: true,
      desc: 'Pueblo de las fuentes. (Próximamente)', icon: 'house' },
    { id: 'paniza', name: 'Paniza', x: 300, y: 80, type: 'town', locked: true,
      desc: 'Pueblo en las alturas. (Próximamente)', icon: 'house' },
    { id: 'cosuenda', name: 'Cosuenda', x: 180, y: 120, type: 'town', locked: true,
      desc: 'Valle del azafrán. (Próximamente)', icon: 'house' },
    { id: 'alfamen', name: 'Alfamén', x: 400, y: 280, type: 'town', locked: true,
      desc: 'Tierra de olivos. (Próximamente)', icon: 'house' }
  ],

  connections: [
    ['encinacorba', 'ruta_vino_1'],
    ['ruta_vino_1', 'ruta_vino_2'],
    ['ruta_vino_2', 'carinena'],
    ['carinena', 'ruta_vino_3'],
    ['ruta_vino_3', 'aguaron'],
    ['carinena', 'paniza'],
    ['ruta_vino_1', 'cosuenda'],
    ['carinena', 'alfamen']
  ],

  init() {
    this.animFrame = 0;
    // Encontrar ubicación actual
    const currentMapId = GAME.data.currentMap || 'encinacorba';
    this.selectedIndex = this.locations.findIndex(l => l.id === currentMapId);
    if (this.selectedIndex === -1) this.selectedIndex = 0;
  },

  update() {
    this.animFrame++;
    this.playerMarkerAnim = Math.sin(this.animFrame * 0.1) * 3;
  },

  draw() {
    // Fondo pergamino/mapa antiguo
    this.drawBackground();

    // Título
    this.drawTitle();

    // Conexiones entre ubicaciones
    this.drawConnections();

    // Ubicaciones
    this.drawLocations();

    // Marcador del jugador
    this.drawPlayerMarker();

    // Panel de información
    this.drawInfoPanel();

    // Instrucciones
    this.drawInstructions();
  },

  drawBackground() {
    // Color base pergamino
    background(235, 220, 180);

    // Textura de papel viejo
    noStroke();
    for (let i = 0; i < 100; i++) {
      const x = hash(i, 1, 500) * GAME.width;
      const y = hash(i, 2, 501) * GAME.height;
      const size = hash(i, 3, 502) * 20 + 5;
      fill(220, 200, 160, 30);
      ellipse(x, y, size, size);
    }

    // Borde decorativo
    stroke(139, 90, 43);
    strokeWeight(4);
    noFill();
    rect(10, 10, GAME.width - 20, GAME.height - 20, 5);

    // Borde interior
    stroke(180, 140, 80);
    strokeWeight(2);
    rect(20, 20, GAME.width - 40, GAME.height - 40, 3);

    // Decoración de esquinas (uvas)
    this.drawCornerDecoration(30, 30);
    this.drawCornerDecoration(GAME.width - 50, 30);
    this.drawCornerDecoration(30, GAME.height - 50);
    this.drawCornerDecoration(GAME.width - 50, GAME.height - 50);
  },

  drawCornerDecoration(x, y) {
    push();
    noStroke();
    // Uvas
    fill(100, 50, 120);
    for (let i = 0; i < 3; i++) {
      ellipse(x + i * 5, y + i * 4, 6, 6);
      ellipse(x + 8 + i * 3, y + i * 5, 5, 5);
    }
    // Hoja
    fill(60, 120, 40);
    ellipse(x + 5, y - 3, 10, 5);
    pop();
  },

  drawTitle() {
    // Sombra
    fill(100, 70, 40, 100);
    textSize(18);
    textAlign(CENTER);
    text('COMARCA DE CARIÑENA', GAME.width / 2 + 2, 52);

    // Título
    fill(100, 60, 30);
    text('COMARCA DE CARIÑENA', GAME.width / 2, 50);

    // Subtítulo
    fill(139, 90, 43);
    textSize(10);
    text('Región Vinícola de Aragón', GAME.width / 2, 68);
  },

  drawConnections() {
    stroke(139, 90, 43, 150);
    strokeWeight(2);

    for (const [fromId, toId] of this.connections) {
      const from = this.locations.find(l => l.id === fromId);
      const to = this.locations.find(l => l.id === toId);

      if (from && to) {
        // Línea punteada para rutas no visitadas
        const fromVisited = GAME.data.visitedMaps?.includes(fromId);
        const toVisited = GAME.data.visitedMaps?.includes(toId);

        if (fromVisited && toVisited) {
          stroke(139, 90, 43);
          strokeWeight(2);
          line(from.x, from.y, to.x, to.y);
        } else {
          // Línea punteada
          stroke(139, 90, 43, 100);
          strokeWeight(1);
          this.drawDashedLine(from.x, from.y, to.x, to.y);
        }
      }
    }
  },

  drawDashedLine(x1, y1, x2, y2) {
    const d = dist(x1, y1, x2, y2);
    const dashLen = 5;
    const dashCount = Math.floor(d / (dashLen * 2));

    for (let i = 0; i < dashCount; i++) {
      const t1 = (i * 2 * dashLen) / d;
      const t2 = ((i * 2 + 1) * dashLen) / d;

      const sx = lerp(x1, x2, t1);
      const sy = lerp(y1, y2, t1);
      const ex = lerp(x1, x2, Math.min(1, t2));
      const ey = lerp(y1, y2, Math.min(1, t2));

      line(sx, sy, ex, ey);
    }
  },

  drawLocations() {
    for (let i = 0; i < this.locations.length; i++) {
      const loc = this.locations[i];
      const visited = GAME.data.visitedMaps?.includes(loc.id);
      const selected = i === this.selectedIndex;
      const current = loc.id === GAME.data.currentMap;

      this.drawLocationMarker(loc, visited, selected, current);
    }
  },

  drawLocationMarker(loc, visited, selected, current) {
    const x = loc.x;
    const y = loc.y;

    push();

    // Efecto de selección
    if (selected) {
      noFill();
      stroke(214, 69, 69);
      strokeWeight(2);
      const pulse = Math.sin(this.animFrame * 0.15) * 5 + 25;
      ellipse(x, y, pulse, pulse);
    }

    noStroke();

    // Determinar color según estado
    let markerColor;
    if (loc.locked) {
      markerColor = color(150, 150, 150); // Gris para bloqueado
    } else if (loc.type === 'city') {
      markerColor = color(200, 50, 50); // Rojo para ciudad
    } else if (loc.type === 'town') {
      markerColor = color(70, 130, 180); // Azul para pueblo
    } else {
      markerColor = color(100, 150, 80); // Verde para ruta
    }

    // Sombra
    fill(0, 0, 0, 50);
    ellipse(x + 2, y + 2, 18, 18);

    // Marcador principal
    fill(markerColor);
    ellipse(x, y, 16, 16);

    // Borde
    stroke(loc.locked ? 100 : 50);
    strokeWeight(2);
    noFill();
    ellipse(x, y, 16, 16);

    // Icono interior
    noStroke();
    fill(255);
    if (loc.type === 'city' || loc.icon === 'gym') {
      // Estrella para gimnasio/ciudad
      this.drawStar(x, y, 4, 7, 5);
    } else if (loc.type === 'town') {
      // Casa para pueblo
      rect(x - 3, y - 1, 6, 5);
      triangle(x - 4, y - 1, x + 4, y - 1, x, y - 5);
    } else {
      // Punto para ruta
      ellipse(x, y, 4, 4);
    }

    // Nombre (solo si está seleccionado o visitado)
    if (selected || visited) {
      fill(loc.locked ? 100 : 60, 40, 20);
      textSize(8);
      textAlign(CENTER);
      text(loc.name, x, y + 22);
    }

    // Candado para bloqueados
    if (loc.locked) {
      fill(80);
      rect(x + 6, y - 10, 8, 6);
      noFill();
      stroke(80);
      strokeWeight(1);
      arc(x + 10, y - 10, 6, 6, PI, 0);
    }

    pop();
  },

  drawStar(cx, cy, innerR, outerR, points) {
    beginShape();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * PI / points) - HALF_PI;
      const r = i % 2 === 0 ? outerR : innerR;
      vertex(cx + cos(angle) * r, cy + sin(angle) * r);
    }
    endShape(CLOSE);
  },

  drawPlayerMarker() {
    const currentLoc = this.locations.find(l => l.id === GAME.data.currentMap);
    if (!currentLoc) return;

    const x = currentLoc.x;
    const y = currentLoc.y - 25 + this.playerMarkerAnim;

    push();
    // Sombra
    fill(0, 0, 0, 50);
    ellipse(currentLoc.x, currentLoc.y - 20, 10, 5);

    // Marcador triangular
    fill(248, 88, 136);
    stroke(150, 50, 80);
    strokeWeight(2);
    triangle(x - 8, y - 10, x + 8, y - 10, x, y + 5);

    // Texto "TÚ"
    noStroke();
    fill(255);
    textSize(6);
    textAlign(CENTER);
    text('TÚ', x, y - 4);
    pop();
  },

  drawInfoPanel() {
    const loc = this.locations[this.selectedIndex];

    // Panel
    fill(255, 250, 240, 230);
    stroke(139, 90, 43);
    strokeWeight(2);
    rect(GAME.width - 180, GAME.height - 100, 170, 90, 5);

    // Título de ubicación
    fill(80, 50, 30);
    textSize(11);
    textAlign(LEFT);
    text(loc.name, GAME.width - 170, GAME.height - 80);

    // Tipo
    fill(TYPE_COLORS[loc.type === 'city' ? 'Fuego' : loc.type === 'town' ? 'Agua' : 'Planta']);
    textSize(8);
    const typeText = loc.type === 'city' ? 'CIUDAD' : loc.type === 'town' ? 'PUEBLO' : 'RUTA';
    text(typeText, GAME.width - 170, GAME.height - 65);

    // Descripción
    fill(100, 80, 60);
    textSize(8);
    // Word wrap simple
    const words = loc.desc.split(' ');
    let line = '';
    let lineY = GAME.height - 50;
    for (const word of words) {
      const testLine = line + word + ' ';
      if (textWidth(testLine) > 155) {
        text(line, GAME.width - 170, lineY);
        line = word + ' ';
        lineY += 12;
      } else {
        line = testLine;
      }
    }
    text(line, GAME.width - 170, lineY);

    // Estado de visita
    noStroke();
    const visited = GAME.data.visitedMaps?.includes(loc.id);
    if (loc.locked) {
      fill(150, 100, 100);
      text('🔒 Bloqueado', GAME.width - 170, GAME.height - 18);
    } else if (visited) {
      fill(80, 150, 80);
      text('✓ Visitado', GAME.width - 170, GAME.height - 18);
    } else {
      fill(180, 150, 80);
      text('? Sin explorar', GAME.width - 170, GAME.height - 18);
    }
  },

  drawInstructions() {
    fill(100, 80, 60);
    textSize(8);
    textAlign(CENTER);
    text('← → Navegar    ESC/M Cerrar', GAME.width / 2, GAME.height - 15);
  },

  keyPressed() {
    if (keyCode === LEFT_ARROW) {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
    } else if (keyCode === RIGHT_ARROW) {
      this.selectedIndex = Math.min(this.locations.length - 1, this.selectedIndex + 1);
    } else if (keyCode === UP_ARROW) {
      // Buscar ubicación más cercana arriba
      this.findNearestLocation(-1, 0);
    } else if (keyCode === DOWN_ARROW) {
      // Buscar ubicación más cercana abajo
      this.findNearestLocation(1, 0);
    } else if (keyCode === ESCAPE || key === 'm' || key === 'M') {
      GAME.setScene('world');
    }
  },

  findNearestLocation(dy, dx) {
    const current = this.locations[this.selectedIndex];
    let nearest = -1;
    let nearestDist = Infinity;

    for (let i = 0; i < this.locations.length; i++) {
      if (i === this.selectedIndex) continue;

      const loc = this.locations[i];
      const diffY = loc.y - current.y;
      const diffX = loc.x - current.x;

      // Solo considerar en la dirección correcta
      if (dy < 0 && diffY >= 0) continue;
      if (dy > 0 && diffY <= 0) continue;

      const d = dist(current.x, current.y, loc.x, loc.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    }

    if (nearest !== -1) {
      this.selectedIndex = nearest;
    }
  }
};
