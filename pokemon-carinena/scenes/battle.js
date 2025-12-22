import { makeDialogBox } from "../entities/dialogBox.js";

const states = {
  default: "default",
  introNpc: "intro-npc",
  introNpcPokemon: "intro-npc-pokemon",
  introPlayerPokemon: "intro-player-pokemon",
  playerTurn: "player-turn",
  playerAttack: "player-attack",
  npcTurn: "npc-turn",
  battleEnd: "battle-end",
  winnerDeclared: "winner-declared",
};

function makePokemon(name, x, finalX, y, maxHp, hp, attacks, dataBox) {
  return {
    name,
    finalX,
    x,
    y,
    spriteRef: null,
    maxHp,
    hp: hp || maxHp,
    attacks,
    selectedAttack: null,
    isFainted: false,
    dataBox,
  };
}

function makeDataBox(x, y, nameX, nameY, healthBarX, healthBarY) {
  return {
    x,
    y,
    nameOffset: {
      x: nameX,
      y: nameY,
    },
    healthBarOffset: {
      x: healthBarX,
      y: healthBarY,
    },
    spriteRef: null,
    maxHealthBarLength: 96,
    healthBarLength: 96,
  };
}

export function makeBattle(p, setScene, gameState) {
  return {
    dialogBox: makeDialogBox(p, 0, 288),
    currentState: "default",
    leaderName: "Lider Tempranillo",
    battleResult: null,
    npc: {
      x: 350,
      y: 20,
      spriteRef: null,
    },
    npcPokemon: null,
    playerPokemon: null,

    initializeBattle() {
      // Get battle data from game state
      const battleData = gameState.currentBattle || {
        leaderName: "Lider Tempranillo",
        pokemon: {
          name: "VENUSAUR",
          maxHp: 100,
          hp: 100,
          attacks: [
            { name: "PLACAJE", power: 10 },
            { name: "HOJA AFILADA", power: 55 },
            { name: "DERRIBO", power: 45 },
            { name: "LATIGO CEPA", power: 50 },
          ],
        },
        townName: "CARINENA",
      };

      this.leaderName = battleData.leaderName;
      this.townName = battleData.townName;

      // Initialize NPC Pokemon from battle data
      this.npcPokemon = makePokemon(
        battleData.pokemon.name,
        600,
        310,
        20,
        battleData.pokemon.maxHp,
        battleData.pokemon.hp || battleData.pokemon.maxHp,
        battleData.pokemon.attacks,
        makeDataBox(-300, 40, 15, 30, 118, 40)
      );

      // Initialize player Pokemon from game state
      const playerData = gameState.playerPokemon || {
        name: "CHARMANDER",
        maxHp: 100,
        hp: 100,
        attacks: [
          { name: "ARANAZO", power: 10 },
          { name: "ASCUAS", power: 40 },
          { name: "LANZALLAMAS", power: 50 },
          { name: "GARRA DRAGON", power: 45 },
        ],
      };

      this.playerPokemon = makePokemon(
        playerData.name,
        -170,
        20,
        128,
        playerData.maxHp,
        playerData.hp,
        playerData.attacks,
        makeDataBox(510, 220, 38, 30, 136, 40)
      );

      // Reset state
      this.currentState = "default";
      this.battleResult = null;
      this.npc.x = 350;

      // Update health bar based on current HP
      this.playerPokemon.dataBox.healthBarLength =
        (this.playerPokemon.hp * this.playerPokemon.dataBox.maxHealthBarLength) /
        this.playerPokemon.maxHp;
    },

    drawDataBox(pokemon) {
      if (!pokemon || !pokemon.dataBox.spriteRef) return;

      p.image(pokemon.dataBox.spriteRef, pokemon.dataBox.x, pokemon.dataBox.y);
      p.fill(255);
      p.textSize(12);
      p.text(
        pokemon.name,
        pokemon.dataBox.x + pokemon.dataBox.nameOffset.x,
        pokemon.dataBox.y + pokemon.dataBox.nameOffset.y
      );

      p.push();
      p.noStroke();
      const healthPercent = pokemon.dataBox.healthBarLength / pokemon.dataBox.maxHealthBarLength * 100;
      if (healthPercent > 50) {
        p.fill(0, 200, 0);
      } else if (healthPercent > 20) {
        p.fill(255, 165, 0);
      } else {
        p.fill(200, 0, 0);
      }
      p.rect(
        pokemon.dataBox.x + pokemon.dataBox.healthBarOffset.x,
        pokemon.dataBox.y + pokemon.dataBox.healthBarOffset.y,
        pokemon.dataBox.healthBarLength,
        6
      );
      p.pop();
    },

    async dealDamage(targetPokemon, attackingPokemon) {
      targetPokemon.hp -= attackingPokemon.selectedAttack.power;
      if (targetPokemon.hp > 0) {
        targetPokemon.dataBox.healthBarLength =
          (targetPokemon.hp * targetPokemon.dataBox.maxHealthBarLength) /
          targetPokemon.maxHp;
        return;
      }
      targetPokemon.hp = 0;
      targetPokemon.dataBox.healthBarLength = 0;
      targetPokemon.isFainted = true;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.currentState = states.battleEnd;
    },

    load() {
      this.battleBackgroundImage = p.loadImage("assets/battle-background.png");
      this.npc.spriteRef = p.loadImage("assets/GENTLEMAN.png");
      this.dataBoxPlayer = p.loadImage("assets/databox_thin.png");
      this.dataBoxFoe = p.loadImage("assets/databox_thin_foe.png");
      this.dialogBox.load();

      // Load Pokemon sprites (we'll use colored rectangles as placeholders)
      this.defaultPokemonSprite = p.loadImage("assets/VENUSAUR.png");
    },

    setup() {
      this.initializeBattle();

      // Assign sprites
      if (this.playerPokemon) {
        this.playerPokemon.dataBox.spriteRef = this.dataBoxPlayer;
        this.playerPokemon.spriteRef = this.defaultPokemonSprite;
      }
      if (this.npcPokemon) {
        this.npcPokemon.dataBox.spriteRef = this.dataBoxFoe;
        this.npcPokemon.spriteRef = this.defaultPokemonSprite;
      }

      this.dialogBox.displayText(
        `${this.leaderName} te desafia!`,
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          this.currentState = states.introNpc;
          this.dialogBox.clearText();
          this.dialogBox.displayText(
            `Envia a ${this.npcPokemon.name}!`,
            async () => {
              this.currentState = states.introNpcPokemon;
              await new Promise((resolve) => setTimeout(resolve, 1000));
              this.dialogBox.clearText();
              this.dialogBox.displayText(
                `Adelante, ${this.playerPokemon.name}!`,
                async () => {
                  this.currentState = states.introPlayerPokemon;
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                  this.dialogBox.clearText();
                  this.dialogBox.displayText(
                    `Que hara ${this.playerPokemon.name}?`,
                    async () => {
                      await new Promise((resolve) => setTimeout(resolve, 1000));
                      this.currentState = states.playerTurn;
                    }
                  );
                }
              );
            }
          );
        }
      );
      this.dialogBox.setVisibility(true);
    },

    update() {
      if (!this.npcPokemon || !this.playerPokemon) return;

      if (this.currentState === states.introNpc) {
        this.npc.x += 0.5 * p.deltaTime;
      }

      if (
        this.currentState === states.introNpcPokemon &&
        this.npcPokemon.x >= this.npcPokemon.finalX
      ) {
        this.npcPokemon.x -= 0.5 * p.deltaTime;
        if (this.npcPokemon.dataBox.x <= 0)
          this.npcPokemon.dataBox.x += 0.5 * p.deltaTime;
      }

      if (
        this.currentState === states.introPlayerPokemon &&
        this.playerPokemon.x <= this.playerPokemon.finalX
      ) {
        this.playerPokemon.x += 0.5 * p.deltaTime;
        this.playerPokemon.dataBox.x -= 0.65 * p.deltaTime;
      }

      if (this.playerPokemon.isFainted) {
        this.playerPokemon.y += 0.8 * p.deltaTime;
      }

      if (this.npcPokemon.isFainted) {
        this.npcPokemon.y += 0.8 * p.deltaTime;
      }

      this.dialogBox.update();
    },

    draw() {
      p.clear();
      p.background(0);

      if (this.battleBackgroundImage) {
        p.image(this.battleBackgroundImage, 0, 0);
      }

      if (!this.npcPokemon || !this.playerPokemon) {
        p.fill(255);
        p.textSize(16);
        p.textAlign(p.CENTER);
        p.text("Cargando batalla...", 256, 192);
        return;
      }

      // Draw Pokemon as colored shapes if no sprite
      this.drawPokemonSprite(this.npcPokemon, true);
      this.drawDataBox(this.npcPokemon);

      this.drawPokemonSprite(this.playerPokemon, false);
      this.drawDataBox(this.playerPokemon);

      if (
        this.currentState === states.default ||
        this.currentState === states.introNpc
      )
        p.image(this.npc.spriteRef, this.npc.x, this.npc.y);

      if (
        this.currentState === states.playerTurn &&
        !this.playerPokemon.selectedAttack
      ) {
        this.dialogBox.displayTextImmediately(
          `1) ${this.playerPokemon.attacks[0].name}    3) ${this.playerPokemon.attacks[2].name}\n2) ${this.playerPokemon.attacks[1].name}   4) ${this.playerPokemon.attacks[3].name}`
        );
      }

      if (
        this.currentState === states.playerTurn &&
        this.playerPokemon.selectedAttack &&
        !this.playerPokemon.isAttacking &&
        !this.playerPokemon.isFainted
      ) {
        this.dialogBox.clearText();
        this.dialogBox.displayText(
          `${this.playerPokemon.name} uso ${this.playerPokemon.selectedAttack.name}!`,
          async () => {
            await this.dealDamage(this.npcPokemon, this.playerPokemon);
            if (this.currentState !== states.battleEnd) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              this.dialogBox.clearText();
              this.currentState = states.npcTurn;
            }
          }
        );
        this.playerPokemon.isAttacking = true;
      }

      if (this.currentState === states.npcTurn && !this.npcPokemon.isFainted) {
        this.npcPokemon.selectedAttack =
          this.npcPokemon.attacks[
            Math.floor(Math.random() * this.npcPokemon.attacks.length)
          ];
        this.dialogBox.clearText();
        this.dialogBox.displayText(
          `El ${this.npcPokemon.name} enemigo uso ${this.npcPokemon.selectedAttack.name}!`,
          async () => {
            await this.dealDamage(this.playerPokemon, this.npcPokemon);
            if (this.currentState !== states.battleEnd) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              this.playerPokemon.selectedAttack = null;
              this.playerPokemon.isAttacking = false;
            }
          }
        );
        this.currentState = states.playerTurn;
      }

      if (this.currentState === states.battleEnd) {
        if (this.npcPokemon.isFainted) {
          this.battleResult = "win";
          this.dialogBox.clearText();
          this.dialogBox.displayText(
            `${this.npcPokemon.name} se debilito!\nHas ganado la medalla!`,
            () => {
              // Award badge
              if (!gameState.badges) gameState.badges = [];
              if (!gameState.badges.includes(this.townName)) {
                gameState.badges.push(this.townName);
              }
              // Update player HP in game state
              gameState.playerPokemon.hp = this.playerPokemon.hp;

              this.dialogBox.clearText();
              this.dialogBox.displayText(
                `Medallas: ${gameState.badges.length}/8\nPulsa ENTER para continuar.`,
                () => {}
              );
              this.currentState = states.winnerDeclared;
            }
          );
          this.currentState = "awarding";
          return;
        }

        if (this.playerPokemon.isFainted) {
          this.battleResult = "lose";
          this.dialogBox.clearText();
          this.dialogBox.displayText(
            `${this.playerPokemon.name} se debilito!\nHas perdido...`,
            () => {
              this.dialogBox.clearText();
              this.dialogBox.displayText(
                "Pulsa ENTER para volver al pueblo.",
                () => {}
              );
              this.currentState = states.winnerDeclared;
            }
          );
          this.currentState = "losing";
        }
      }

      p.fill(40, 30, 50);
      p.rect(0, 288, 512, 200);
      this.dialogBox.draw();
    },

    drawPokemonSprite(pokemon, isEnemy) {
      // Draw a placeholder Pokemon shape with type color
      const size = isEnemy ? 80 : 100;

      p.push();
      p.translate(pokemon.x + size / 2, pokemon.y + size / 2);

      // Body color based on Pokemon name
      const colors = {
        CHARMANDER: [255, 120, 50],
        CHARMELEON: [255, 100, 40],
        CHARIZARD: [255, 80, 30],
        SQUIRTLE: [100, 180, 255],
        WARTORTLE: [80, 150, 230],
        BLASTOISE: [60, 120, 200],
        BULBASAUR: [100, 200, 100],
        IVYSAUR: [80, 180, 80],
        VENUSAUR: [60, 150, 60],
        SANDSLASH: [200, 180, 100],
        GOLEM: [150, 130, 110],
        RAICHU: [255, 200, 80],
        UMBREON: [60, 50, 80],
        DRAGONITE: [255, 180, 100],
      };

      const color = colors[pokemon.name] || [150, 150, 150];
      p.fill(color);
      p.noStroke();

      // Draw simple Pokemon shape
      p.ellipse(0, 0, size * 0.8, size * 0.7);
      p.ellipse(0, -size * 0.3, size * 0.5, size * 0.5);

      // Eyes
      p.fill(255);
      p.ellipse(-size * 0.1, -size * 0.35, size * 0.12, size * 0.12);
      p.ellipse(size * 0.1, -size * 0.35, size * 0.12, size * 0.12);
      p.fill(0);
      p.ellipse(-size * 0.1, -size * 0.35, size * 0.06, size * 0.06);
      p.ellipse(size * 0.1, -size * 0.35, size * 0.06, size * 0.06);

      // Name label
      p.fill(255);
      p.textSize(10);
      p.textAlign(p.CENTER);
      p.text(pokemon.name, 0, size * 0.5);

      p.pop();
    },

    onKeyPressed(keyEvent) {
      if (this.currentState === states.playerTurn && this.playerPokemon) {
        switch (keyEvent.key) {
          case "1":
            this.playerPokemon.selectedAttack = this.playerPokemon.attacks[0];
            break;
          case "2":
            this.playerPokemon.selectedAttack = this.playerPokemon.attacks[1];
            break;
          case "3":
            this.playerPokemon.selectedAttack = this.playerPokemon.attacks[2];
            break;
          case "4":
            this.playerPokemon.selectedAttack = this.playerPokemon.attacks[3];
            break;
          default:
        }
      }

      if (this.currentState === states.winnerDeclared && keyEvent.keyCode === p.ENTER) {
        // Return to town after battle
        setScene("town");
      }
    },
  };
}
