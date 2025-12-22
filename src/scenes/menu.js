/* =========================
   ESCENA: MENÚ PRINCIPAL
========================= */

const MenuScene = {
  titleY: 0,
  starterIndex: 0,
  phase: 'title', // 'title', 'starter'
  animFrame: 0,
  pokeball: { x: 0, y: 0, vy: 0 },

  init() {
    this.titleY = -100;
    this.phase = GAME.data.starterChosen ? 'title' : 'title';
    this.animFrame = 0;
    this.pokeball = { x: GAME.width / 2, y: GAME.height + 50, vy: -8 };
  },

  update() {
    this.animFrame++;

    // Animación del título
    if (this.titleY < 60) {
      this.titleY += 3;
    }

    // Animación pokeball
    this.pokeball.y += this.pokeball.vy;
    this.pokeball.vy += 0.3;
    if (this.pokeball.y > GAME.height - 100) {
      this.pokeball.vy = -6;
    }
  },

  draw() {
    // Fondo degradado
    for (let y = 0; y < GAME.height; y++) {
      const inter = map(y, 0, GAME.height, 0, 1);
      const c = lerpColor(color(10, 10, 46), color(42, 26, 62), inter);
      stroke(c);
      line(0, y, GAME.width, y);
    }

    if (this.phase === 'title') {
      this.drawTitle();
    } else if (this.phase === 'starter') {
      this.drawStarterSelect();
    }
  },

  drawTitle() {
    // Pokeball decorativa
    push();
    translate(this.pokeball.x, this.pokeball.y);

    // Mitad superior roja
    fill(232, 64, 64);
    arc(0, 0, 60, 60, PI, 0, CHORD);

    // Mitad inferior blanca
    fill(255);
    arc(0, 0, 60, 60, 0, PI, CHORD);

    // Línea central
    stroke(30);
    strokeWeight(3);
    line(-30, 0, 30, 0);

    // Círculo central
    fill(255);
    stroke(30);
    strokeWeight(2);
    ellipse(0, 0, 18, 18);
    fill(255);
    noStroke();
    ellipse(0, 0, 10, 10);
    pop();

    // Título
    noStroke();
    textAlign(CENTER);

    // Sombra
    fill(0, 0, 0, 100);
    textSize(28);
    text('POKÉMON', GAME.width / 2 + 2, this.titleY + 2);

    // Texto principal
    fill(248, 208, 48);
    textSize(28);
    text('POKÉMON', GAME.width / 2, this.titleY);

    // Subtítulo
    fill(248, 88, 136);
    textSize(14);
    text('COMARCA DE', GAME.width / 2, this.titleY + 40);

    fill(168, 56, 96);
    textSize(18);
    text('CARIÑENA', GAME.width / 2, this.titleY + 70);

    // Decoración de uvas/vino
    this.drawGrapeDecoration(80, 200);
    this.drawGrapeDecoration(GAME.width - 80, 200);

    // Pulsa para empezar
    if (Math.floor(this.animFrame / 30) % 2 === 0) {
      fill(255);
      textSize(10);
      text('PULSA ENTER', GAME.width / 2, GAME.height - 40);
    }

    // Versión
    fill(100);
    textSize(8);
    text('v1.0 - p5.js', GAME.width / 2, GAME.height - 15);
  },

  drawGrapeDecoration(x, y) {
    push();
    // Uvas
    fill(128, 0, 128);
    noStroke();
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j <= i; j++) {
        ellipse(x - i * 4 + j * 8, y + i * 7, 8, 8);
      }
    }
    // Hoja
    fill(34, 139, 34);
    ellipse(x, y - 10, 12, 6);
    pop();
  },

  drawStarterSelect() {
    // Fondo
    fill(232, 224, 208);
    rect(0, 0, GAME.width, GAME.height);

    // Título
    fill(72, 48, 24);
    textSize(12);
    textAlign(CENTER);
    text('¡Elige tu primer Pokémon!', GAME.width / 2, 30);

    const starters = [
      { id: 1, name: 'Bulbasaur', type: 'Planta' },
      { id: 4, name: 'Charmander', type: 'Fuego' },
      { id: 7, name: 'Squirtle', type: 'Agua' }
    ];

    const boxW = 100;
    const boxH = 150;
    const startX = (GAME.width - boxW * 3 - 40) / 2;

    starters.forEach((s, i) => {
      const x = startX + i * (boxW + 20);
      const y = 50;
      const selected = this.starterIndex === i;

      // Caja
      fill(selected ? (TYPE_COLORS[s.type] || '#fff') : '#fff');
      stroke(72, 48, 24);
      strokeWeight(selected ? 3 : 1);
      rect(x, y, boxW, boxH, 5);

      // Sprite (placeholder)
      noStroke();
      fill(TYPE_COLORS[s.type] || '#888');
      ellipse(x + boxW / 2, y + 50, 60, 60);

      // Nombre
      fill(selected ? 255 : color(72, 48, 24));
      textSize(9);
      text(s.name, x + boxW / 2, y + 100);

      // Tipo
      fill(selected ? 255 : (TYPE_COLORS[s.type] || '#888'));
      textSize(8);
      text(s.type, x + boxW / 2, y + 120);

      // Indicador de selección
      if (selected) {
        fill(248, 88, 136);
        noStroke();
        triangle(
          x + boxW / 2 - 8, y - 15,
          x + boxW / 2 + 8, y - 15,
          x + boxW / 2, y - 5
        );
      }
    });

    // Instrucciones
    fill(72, 48, 24);
    textSize(8);
    text('← → elegir    ENTER confirmar', GAME.width / 2, GAME.height - 20);
  },

  keyPressed() {
    if (this.phase === 'title') {
      if (keyCode === ENTER) {
        if (GAME.data.starterChosen) {
          GAME.setScene('world');
        } else {
          this.phase = 'starter';
        }
      }
    } else if (this.phase === 'starter') {
      if (keyCode === LEFT_ARROW) {
        this.starterIndex = Math.max(0, this.starterIndex - 1);
      } else if (keyCode === RIGHT_ARROW) {
        this.starterIndex = Math.min(2, this.starterIndex + 1);
      } else if (keyCode === ENTER) {
        this.selectStarter();
      }
    }
  },

  selectStarter() {
    const ids = [1, 4, 7];
    const starter = new Pokemon(ids[this.starterIndex], 5);
    GAME.data.pokemon = [starter];
    GAME.data.starterChosen = true;
    GAME.setScene('world');
  }
};
