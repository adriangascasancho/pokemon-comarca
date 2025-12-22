/* =========================
   ESCENA: COMBATE
========================= */

const BattleScene = {
  playerPokemon: null,
  enemyPokemon: null,
  phase: 'intro', // intro, action, moves, enemy, message, end
  message: '',
  messageCallback: null,
  selectedMove: 0,
  battleType: 'wild', // wild, trainer
  animFrame: 0,

  init(encounters, battleType = 'wild') {
    this.battleType = battleType;
    this.playerPokemon = GAME.data.pokemon[0];
    this.enemyPokemon = createWildPokemon(encounters);
    this.phase = 'intro';
    this.message = `¡Un ${this.enemyPokemon.name} salvaje apareció!`;
    this.messageCallback = () => { this.phase = 'action'; };
    this.selectedMove = 0;
    this.animFrame = 0;
  },

  update() {
    this.animFrame++;
  },

  draw() {
    // Fondo de batalla
    this.drawBackground();

    // Plataformas
    this.drawPlatforms();

    // Pokémon
    this.drawPokemon();

    // UI
    this.drawBattleUI();

    // Mensaje o acciones
    if (this.phase === 'intro' || this.phase === 'message' || this.phase === 'end') {
      this.drawMessageBox();
    } else if (this.phase === 'action') {
      this.drawActionMenu();
    } else if (this.phase === 'moves') {
      this.drawMovesMenu();
    }
  },

  drawBackground() {
    // Cielo
    fill(136, 200, 255);
    rect(0, 0, GAME.width, GAME.height * 0.45);

    // Pradera
    fill(107, 179, 71);
    rect(0, GAME.height * 0.45, GAME.width, GAME.height * 0.25);

    // Zona inferior (UI)
    fill(248);
    rect(0, GAME.height * 0.70, GAME.width, GAME.height * 0.30);
  },

  drawPlatforms() {
    // Plataforma enemigo
    fill(90, 161, 59);
    ellipse(GAME.width * 0.70, GAME.height * 0.42, 160, 40);
    fill(63, 125, 43);
    ellipse(GAME.width * 0.70, GAME.height * 0.44, 160, 20);

    // Plataforma jugador
    fill(90, 161, 59);
    ellipse(GAME.width * 0.25, GAME.height * 0.68, 180, 50);
    fill(63, 125, 43);
    ellipse(GAME.width * 0.25, GAME.height * 0.71, 180, 25);
  },

  drawPokemon() {
    // Enemigo (sprite frontal)
    if (this.enemyPokemon) {
      this.enemyPokemon.draw(
        GAME.width * 0.60,
        GAME.height * 0.08,
        100,
        false
      );
    }

    // Jugador (sprite trasero)
    if (this.playerPokemon) {
      this.playerPokemon.draw(
        GAME.width * 0.08,
        GAME.height * 0.35,
        120,
        true
      );
    }
  },

  drawBattleUI() {
    // Caja HP enemigo (arriba izquierda)
    this.drawHPBox(10, 20, 180, this.enemyPokemon, false);

    // Caja HP jugador (abajo derecha)
    this.drawHPBox(GAME.width - 210, GAME.height * 0.50, 200, this.playerPokemon, true);
  },

  drawHPBox(x, y, w, pokemon, showHP) {
    // Fondo
    fill(248);
    stroke(31, 42, 68);
    strokeWeight(3);
    rect(x, y, w, showHP ? 60 : 50, 5);

    // Borde interior
    stroke(152, 176, 200);
    strokeWeight(2);
    rect(x + 4, y + 4, w - 8, showHP ? 52 : 42, 3);
    noStroke();

    // Nombre y nivel
    fill(0);
    textSize(11);
    textAlign(LEFT);
    text(pokemon.name, x + 12, y + 20);

    textAlign(RIGHT);
    textSize(9);
    text(`Nv${pokemon.level}`, x + w - 12, y + 20);

    // Etiqueta HP
    fill(0);
    textSize(8);
    textAlign(LEFT);
    text('HP', x + 10, y + 38);

    // Barra HP
    const barX = x + 30;
    const barY = y + 30;
    const barW = w - 50;
    const barH = 10;

    const pct = pokemon.hp / pokemon.maxHp;
    let barColor;
    if (pct > 0.5) barColor = color(88, 176, 88);
    else if (pct > 0.2) barColor = color(242, 193, 78);
    else barColor = color(224, 84, 84);

    fill(40);
    rect(barX, barY, barW, barH, 2);
    fill(20);
    rect(barX + 2, barY + 2, barW - 4, barH - 4);
    fill(barColor);
    rect(barX + 2, barY + 2, (barW - 4) * pct, barH - 4);

    // Números HP
    if (showHP) {
      fill(0);
      textSize(9);
      textAlign(RIGHT);
      text(`${pokemon.hp}/${pokemon.maxHp}`, x + w - 12, y + 55);
    }
  },

  drawMessageBox() {
    fill(248);
    stroke(31, 42, 68);
    strokeWeight(4);
    rect(10, GAME.height * 0.72, GAME.width - 20, GAME.height * 0.25, 6);
    noStroke();

    fill(0);
    textSize(11);
    textAlign(LEFT);
    text(this.message, 30, GAME.height * 0.82);

    // Indicador de continuar
    if (Math.floor(this.animFrame / 20) % 2 === 0) {
      fill(31, 42, 68);
      triangle(
        GAME.width - 40, GAME.height * 0.92,
        GAME.width - 30, GAME.height * 0.92,
        GAME.width - 35, GAME.height * 0.95
      );
    }
  },

  drawActionMenu() {
    // Caja de texto izquierda
    fill(248);
    stroke(31, 42, 68);
    strokeWeight(4);
    rect(10, GAME.height * 0.72, GAME.width * 0.45, GAME.height * 0.25, 6);

    fill(0);
    textSize(11);
    textAlign(LEFT);
    text(`¿Qué hará ${this.playerPokemon.name}?`, 25, GAME.height * 0.82);

    // Caja de acciones derecha
    fill(248);
    rect(GAME.width * 0.48, GAME.height * 0.72, GAME.width * 0.50, GAME.height * 0.25, 6);
    noStroke();

    const actions = ['LUCHAR', 'MOCHILA', 'POKÉMON', 'HUIR'];
    const cols = 2;

    actions.forEach((action, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ax = GAME.width * 0.52 + col * 100;
      const ay = GAME.height * 0.78 + row * 25;

      if (this.selectedMove === i) {
        fill(214, 69, 69);
        text('▶', ax, ay);
      }
      fill(0);
      textSize(10);
      text(action, ax + 15, ay);
    });
  },

  drawMovesMenu() {
    fill(248);
    stroke(31, 42, 68);
    strokeWeight(4);
    rect(10, GAME.height * 0.72, GAME.width - 20, GAME.height * 0.25, 6);
    noStroke();

    const moves = this.playerPokemon.moves;

    moves.forEach((move, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const mx = 30 + col * (GAME.width / 2 - 30);
      const my = GAME.height * 0.78 + row * 25;

      const moveData = MOVES_DB[move];
      const typeColor = TYPE_COLORS[moveData?.type] || '#888';

      if (this.selectedMove === i) {
        fill(214, 69, 69);
        text('▶', mx - 15, my);
      }

      // Fondo del tipo
      fill(typeColor);
      rect(mx, my - 12, 100, 18, 3);

      fill(255);
      textSize(9);
      textAlign(LEFT);
      text(move, mx + 5, my);
    });

    // Botón volver
    fill(100);
    textSize(8);
    textAlign(RIGHT);
    text('B: Volver', GAME.width - 20, GAME.height * 0.95);
  },

  keyPressed() {
    if (this.phase === 'intro' || this.phase === 'message') {
      if (keyCode === ENTER || key === ' ') {
        if (this.messageCallback) {
          this.messageCallback();
          this.messageCallback = null;
        }
        if (this.phase !== 'end') {
          this.message = '';
        }
      }
      return;
    }

    if (this.phase === 'end') {
      if (keyCode === ENTER || key === ' ') {
        this.endBattle();
      }
      return;
    }

    if (this.phase === 'action') {
      if (keyCode === UP_ARROW) this.selectedMove = Math.max(0, this.selectedMove - 2);
      else if (keyCode === DOWN_ARROW) this.selectedMove = Math.min(3, this.selectedMove + 2);
      else if (keyCode === LEFT_ARROW) this.selectedMove = Math.max(0, this.selectedMove - 1);
      else if (keyCode === RIGHT_ARROW) this.selectedMove = Math.min(3, this.selectedMove + 1);
      else if (keyCode === ENTER) {
        this.selectAction(this.selectedMove);
      }
      return;
    }

    if (this.phase === 'moves') {
      const maxMoves = this.playerPokemon.moves.length - 1;
      if (keyCode === UP_ARROW) this.selectedMove = Math.max(0, this.selectedMove - 2);
      else if (keyCode === DOWN_ARROW) this.selectedMove = Math.min(maxMoves, this.selectedMove + 2);
      else if (keyCode === LEFT_ARROW) this.selectedMove = Math.max(0, this.selectedMove - 1);
      else if (keyCode === RIGHT_ARROW) this.selectedMove = Math.min(maxMoves, this.selectedMove + 1);
      else if (keyCode === ENTER) {
        this.useMove(this.selectedMove);
      } else if (key === 'b' || key === 'B' || keyCode === ESCAPE) {
        this.phase = 'action';
        this.selectedMove = 0;
      }
    }
  },

  selectAction(index) {
    switch (index) {
      case 0: // Luchar
        this.phase = 'moves';
        this.selectedMove = 0;
        break;
      case 1: // Mochila
        this.showMessage('¡No hay objetos disponibles!');
        break;
      case 2: // Pokémon
        this.showMessage('¡No puedes cambiar ahora!');
        break;
      case 3: // Huir
        this.tryRun();
        break;
    }
  },

  useMove(index) {
    const move = this.playerPokemon.moves[index];
    const result = this.playerPokemon.calculateDamage(move, this.enemyPokemon);

    let msg = `¡${this.playerPokemon.name} usó ${move}!`;

    if (result.damage > 0) {
      this.enemyPokemon.takeDamage(result.damage);

      if (result.effectiveness > 1) msg += '\n¡Es súper efectivo!';
      else if (result.effectiveness < 1 && result.effectiveness > 0) msg += '\nNo es muy efectivo...';
      else if (result.effectiveness === 0) msg += '\nNo afecta al enemigo...';
    }

    this.showMessage(msg, () => {
      if (this.enemyPokemon.hp <= 0) {
        this.victory();
      } else {
        this.enemyTurn();
      }
    });
  },

  enemyTurn() {
    const moves = this.enemyPokemon.moves;
    const move = moves[Math.floor(random(moves.length))];
    const result = this.enemyPokemon.calculateDamage(move, this.playerPokemon);

    let msg = `¡${this.enemyPokemon.name} usó ${move}!`;

    if (result.damage > 0) {
      this.playerPokemon.takeDamage(result.damage);

      if (result.effectiveness > 1) msg += '\n¡Es súper efectivo!';
      else if (result.effectiveness < 1 && result.effectiveness > 0) msg += '\nNo es muy efectivo...';
    }

    this.showMessage(msg, () => {
      if (this.playerPokemon.hp <= 0) {
        this.defeat();
      } else {
        this.phase = 'action';
        this.selectedMove = 0;
      }
    });
  },

  tryRun() {
    if (this.battleType === 'trainer') {
      this.showMessage('¡No puedes huir de un combate de entrenador!');
      return;
    }

    if (random() < 0.75) {
      this.showMessage('¡Has escapado!', () => {
        this.endBattle();
      });
    } else {
      this.showMessage('¡No puedes escapar!', () => {
        this.enemyTurn();
      });
    }
  },

  victory() {
    const exp = Math.floor(this.enemyPokemon.level * 20);
    this.playerPokemon.gainExp(exp);

    this.phase = 'end';
    this.message = `¡${this.enemyPokemon.name} derrotado!\n${this.playerPokemon.name} ganó ${exp} EXP.`;
    this.messageCallback = () => { this.endBattle(); };
  },

  defeat() {
    this.playerPokemon.hp = 1; // Sobrevive con 1 HP
    this.phase = 'end';
    this.message = `¡${this.playerPokemon.name} se ha debilitado!`;
    this.messageCallback = () => { this.endBattle(); };
  },

  showMessage(msg, callback = null) {
    this.phase = 'message';
    this.message = msg;
    this.messageCallback = callback || (() => { this.phase = 'action'; this.selectedMove = 0; });
  },

  endBattle() {
    // Sincronizar HP
    GAME.data.pokemon[0].hp = this.playerPokemon.hp;
    GAME.setScene('world');
  }
};
