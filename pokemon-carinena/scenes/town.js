import { makeDialogBox } from "../entities/dialogBox.js";

const townData = {
  CARINENA: {
    gymLeader: "Lider Tempranillo",
    gymType: "Planta",
    pokemon: {
      name: "VENUSAUR",
      maxHp: 100,
      attacks: [
        { name: "PLACAJE", power: 10 },
        { name: "HOJA AFILADA", power: 55 },
        { name: "DERRIBO", power: 45 },
        { name: "LATIGO CEPA", power: 50 },
      ],
    },
    bgColor: [80, 120, 60],
    description: "La capital del vino!",
  },
  AGUARON: {
    gymLeader: "Lider Macabeo",
    gymType: "Agua",
    pokemon: {
      name: "BLASTOISE",
      maxHp: 95,
      attacks: [
        { name: "PLACAJE", power: 10 },
        { name: "PISTOLA AGUA", power: 40 },
        { name: "HIDROBOMBA", power: 55 },
        { name: "RAYO BURBUJA", power: 45 },
      ],
    },
    bgColor: [60, 100, 150],
    description: "Aguas cristalinas y buen vino.",
  },
  LONGARES: {
    gymLeader: "Lider Garnacha",
    gymType: "Fuego",
    pokemon: {
      name: "CHARIZARD",
      maxHp: 100,
      attacks: [
        { name: "ARANAZO", power: 10 },
        { name: "ASCUAS", power: 40 },
        { name: "LANZALLAMAS", power: 55 },
        { name: "GIRO FUEGO", power: 45 },
      ],
    },
    bgColor: [150, 80, 60],
    description: "Bodegas con siglos de historia.",
  },
  PANIZA: {
    gymLeader: "Lider Vidadillo",
    gymType: "Tierra",
    pokemon: {
      name: "SANDSLASH",
      maxHp: 90,
      attacks: [
        { name: "ARANAZO", power: 10 },
        { name: "EXCAVAR", power: 50 },
        { name: "TERREMOTO", power: 55 },
        { name: "GOLPE CUERPO", power: 45 },
      ],
    },
    bgColor: [140, 120, 80],
    description: "Vinedos en las colinas.",
  },
  COSUENDA: {
    gymLeader: "Lider Carinena",
    gymType: "Roca",
    pokemon: {
      name: "GOLEM",
      maxHp: 95,
      attacks: [
        { name: "PLACAJE", power: 10 },
        { name: "LANZARROCAS", power: 50 },
        { name: "AVALANCHA", power: 55 },
        { name: "TERREMOTO", power: 50 },
      ],
    },
    bgColor: [120, 100, 90],
    description: "Entre montanas de piedra.",
  },
  ALFAMEN: {
    gymLeader: "Lider Moscatel",
    gymType: "Electrico",
    pokemon: {
      name: "RAICHU",
      maxHp: 85,
      attacks: [
        { name: "PLACAJE", power: 10 },
        { name: "IMPACTRUENO", power: 40 },
        { name: "RAYO", power: 55 },
        { name: "TRUENO", power: 60 },
      ],
    },
    bgColor: [150, 140, 60],
    description: "Entrada electrizante a la comarca.",
  },
  ENCINACORBA: {
    gymLeader: "Lider Parraleta",
    gymType: "Siniestro",
    pokemon: {
      name: "UMBREON",
      maxHp: 95,
      attacks: [
        { name: "PLACAJE", power: 10 },
        { name: "MORDISCO", power: 45 },
        { name: "PULSO UMBRIO", power: 55 },
        { name: "REPRESALIA", power: 50 },
      ],
    },
    bgColor: [60, 50, 80],
    description: "Misterios del sur.",
  },
  VILLANUEVA: {
    gymLeader: "Lider Juan Ibanez",
    gymType: "Dragon",
    pokemon: {
      name: "DRAGONITE",
      maxHp: 110,
      attacks: [
        { name: "PLACAJE", power: 10 },
        { name: "GARRA DRAGON", power: 50 },
        { name: "ENFADO", power: 60 },
        { name: "HIPERRAYO", power: 65 },
      ],
    },
    bgColor: [100, 80, 140],
    description: "El cruce de caminos legendario.",
  },
};

export function makeTown(p, setScene, gameState) {
  return {
    dialogBox: makeDialogBox(p, 0, 310),
    currentTown: null,
    selectedOption: 0,
    options: ["GIMNASIO", "CENTRO POKEMON", "MAPA"],
    phase: "menu", // menu, healing, pre-battle

    load() {
      this.dialogBox.load();
    },

    setup() {
      this.currentTown = townData[gameState.currentTown] || townData.CARINENA;
      this.currentTown.name = gameState.currentTown || "CARINENA";
      this.selectedOption = 0;
      this.phase = "menu";
      this.dialogBox.setVisibility(true);
      this.dialogBox.displayTextImmediately(
        `Bienvenido a ${this.currentTown.name}!\n${this.currentTown.description}`
      );
    },

    update() {
      this.dialogBox.update();
    },

    draw() {
      p.clear();

      // Town background
      const bg = this.currentTown.bgColor;
      for (let y = 0; y < 310; y++) {
        const inter = p.map(y, 0, 310, 0, 1);
        const c = p.lerpColor(
          p.color(bg[0] + 40, bg[1] + 40, bg[2] + 40),
          p.color(bg[0], bg[1], bg[2]),
          inter
        );
        p.stroke(c);
        p.line(0, y, 512, y);
      }

      // Draw town elements
      this.drawTownScene();

      // Draw title
      p.fill(255);
      p.stroke(0);
      p.strokeWeight(3);
      p.textSize(24);
      p.textAlign(p.CENTER);
      p.text(this.currentTown.name, 256, 40);
      p.noStroke();

      // Draw menu
      if (this.phase === "menu") {
        this.drawMenu();
      }

      // Draw healing animation
      if (this.phase === "healing") {
        this.drawHealingEffect();
      }

      // Dialog box
      p.fill(40, 30, 50);
      p.rect(0, 300, 512, 84);
      this.dialogBox.draw();

      // Controls
      p.fill(200);
      p.textSize(10);
      p.textAlign(p.RIGHT);
      p.text("Flechas: Elegir | ENTER: Confirmar", 502, 380);
    },

    drawTownScene() {
      // Ground
      p.fill(100, 80, 60);
      p.noStroke();
      p.rect(0, 250, 512, 60);

      // Path
      p.fill(180, 160, 120);
      p.rect(200, 250, 112, 60);

      // Gym building
      p.fill(180, 60, 60);
      p.rect(50, 150, 120, 100);
      p.fill(120, 40, 40);
      p.triangle(50, 150, 110, 100, 170, 150);
      // Door
      p.fill(80, 50, 30);
      p.rect(90, 200, 40, 50);
      // Sign
      p.fill(255);
      p.textSize(8);
      p.textAlign(p.CENTER);
      p.text("GIMNASIO", 110, 145);
      p.text(this.currentTown.gymType.toUpperCase(), 110, 155);

      // Pokemon Center
      p.fill(255, 100, 100);
      p.rect(342, 150, 120, 100);
      p.fill(200, 60, 60);
      p.rect(342, 140, 120, 15);
      // P symbol
      p.fill(255);
      p.textSize(40);
      p.text("P", 402, 210);
      // Door
      p.fill(200, 220, 255);
      p.rect(382, 200, 40, 50);

      // Trees
      this.drawTree(20, 200);
      this.drawTree(200, 180);
      this.drawTree(300, 190);
      this.drawTree(480, 200);

      // Grape decoration
      this.drawGrapes(256, 130);
    },

    drawTree(x, y) {
      p.fill(100, 70, 40);
      p.rect(x - 5, y, 10, 30);
      p.fill(60, 140, 60);
      p.ellipse(x, y - 10, 40, 50);
      p.fill(80, 160, 80);
      p.ellipse(x - 10, y, 25, 30);
      p.ellipse(x + 10, y, 25, 30);
    },

    drawGrapes(x, y) {
      p.fill(100, 40, 120);
      p.noStroke();
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col <= row; col++) {
          const gx = x + (col - row / 2) * 10;
          const gy = y + row * 8;
          p.ellipse(gx, gy, 8, 8);
        }
      }
      p.stroke(80, 60, 40);
      p.strokeWeight(2);
      p.line(x, y - 5, x, y - 15);
      p.noStroke();
    },

    drawMenu() {
      const menuX = 180;
      const menuY = 200;
      const menuWidth = 150;
      const menuHeight = 90;

      // Menu background
      p.fill(255, 250, 240);
      p.stroke(80, 60, 40);
      p.strokeWeight(3);
      p.rect(menuX, menuY, menuWidth, menuHeight, 5);
      p.noStroke();

      // Options
      p.textSize(14);
      p.textAlign(p.LEFT);

      for (let i = 0; i < this.options.length; i++) {
        const optY = menuY + 25 + i * 25;

        if (i === this.selectedOption) {
          p.fill(255, 220, 100);
          p.rect(menuX + 5, optY - 15, menuWidth - 10, 22, 3);
          p.fill(80, 40, 20);
          p.text("> " + this.options[i], menuX + 15, optY);
        } else {
          p.fill(80, 60, 40);
          p.text("  " + this.options[i], menuX + 15, optY);
        }
      }
    },

    drawHealingEffect() {
      // Sparkle effect
      const time = p.millis() * 0.01;
      for (let i = 0; i < 8; i++) {
        const angle = (p.TWO_PI / 8) * i + time;
        const sparkleX = 402 + p.cos(angle) * 50;
        const sparkleY = 180 + p.sin(angle) * 30;
        p.fill(255, 255, 200, 200);
        p.noStroke();
        p.ellipse(sparkleX, sparkleY, 8, 8);
      }
    },

    onKeyPressed(keyEvent) {
      if (this.phase === "menu") {
        if (keyEvent.keyCode === p.UP_ARROW) {
          this.selectedOption = (this.selectedOption - 1 + this.options.length) % this.options.length;
        }
        if (keyEvent.keyCode === p.DOWN_ARROW) {
          this.selectedOption = (this.selectedOption + 1) % this.options.length;
        }
        if (keyEvent.keyCode === p.ENTER) {
          this.selectOption();
        }
      }
    },

    selectOption() {
      switch (this.options[this.selectedOption]) {
        case "GIMNASIO":
          // Check if already have badge
          if (gameState.badges && gameState.badges.includes(this.currentTown.name)) {
            this.dialogBox.clearText();
            this.dialogBox.displayText("Ya tienes la medalla de este gimnasio!");
            return;
          }

          // Set up battle with gym leader
          gameState.currentBattle = {
            leaderName: this.currentTown.gymLeader,
            pokemon: { ...this.currentTown.pokemon, hp: this.currentTown.pokemon.maxHp },
            townName: this.currentTown.name,
          };

          this.dialogBox.clearText();
          this.dialogBox.displayText(
            `${this.currentTown.gymLeader} te desafia!`,
            () => {
              setScene("battle");
            }
          );
          break;

        case "CENTRO POKEMON":
          this.phase = "healing";
          // Heal player's Pokemon
          if (gameState.playerPokemon) {
            gameState.playerPokemon.hp = gameState.playerPokemon.maxHp;
          }
          this.dialogBox.clearText();
          this.dialogBox.displayText(
            "Tus Pokemon han sido curados!\nGracias por visitarnos!",
            () => {
              this.phase = "menu";
            }
          );
          break;

        case "MAPA":
          setScene("regionMap");
          break;
      }
    },
  };
}
