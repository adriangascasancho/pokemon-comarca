import { makeDialogBox } from "../entities/dialogBox.js";

const starters = [
  {
    name: "CHARMANDER",
    type: "Fuego",
    description: "Un Pokemon de fuego. Ideal para las noches frias de la comarca.",
    color: [255, 100, 50],
    attacks: [
      { name: "ARANAZO", power: 10 },
      { name: "ASCUAS", power: 40 },
      { name: "LANZALLAMAS", power: 50 },
      { name: "GARRA DRAGON", power: 45 },
    ],
  },
  {
    name: "SQUIRTLE",
    type: "Agua",
    description: "Un Pokemon de agua. Perfecto para regar los vinedos.",
    color: [100, 150, 255],
    attacks: [
      { name: "PLACAJE", power: 10 },
      { name: "PISTOLA AGUA", power: 40 },
      { name: "HIDROBOMBA", power: 50 },
      { name: "RAYO BURBUJA", power: 45 },
    ],
  },
  {
    name: "BULBASAUR",
    type: "Planta",
    description: "Un Pokemon planta. Conectado con la tierra de los vinedos.",
    color: [100, 200, 100],
    attacks: [
      { name: "PLACAJE", power: 10 },
      { name: "LATIGO CEPA", power: 40 },
      { name: "HOJA AFILADA", power: 50 },
      { name: "RAYO SOLAR", power: 55 },
    ],
  },
];

export function makeStarterSelect(p, setScene, gameState) {
  return {
    dialogBox: makeDialogBox(p, 0, 288),
    selectedIndex: 0,
    phase: "intro", // intro, selecting, confirming, done
    confirmed: false,
    professorY: -100,
    pokeballsY: [400, 400, 400],
    animTimer: 0,

    load() {
      this.dialogBox.load();
    },

    setup() {
      this.phase = "intro";
      this.selectedIndex = 0;
      this.confirmed = false;
      this.professorY = -100;
      this.pokeballsY = [400, 400, 400];
      this.animTimer = 0;
      this.dialogBox.setVisibility(true);
      this.dialogBox.displayText(
        "Bienvenido a la Comarca de Carinena!\nSoy el Profesor Garnacha.",
        () => {
          this.dialogBox.clearText();
          this.dialogBox.displayText(
            "Esta tierra es famosa por sus vinos\ny sus Pokemon unicos!",
            () => {
              this.dialogBox.clearText();
              this.dialogBox.displayText(
                "Elige tu Pokemon inicial\npara comenzar tu aventura!",
                () => {
                  this.phase = "selecting";
                }
              );
            }
          );
        }
      );
    },

    update() {
      this.animTimer += p.deltaTime;

      // Animate professor entering
      if (this.professorY < 50) {
        this.professorY += 0.2 * p.deltaTime;
      }

      // Animate pokeballs appearing
      for (let i = 0; i < 3; i++) {
        if (this.pokeballsY[i] > 200 && this.animTimer > 500 + i * 300) {
          this.pokeballsY[i] -= 0.3 * p.deltaTime;
        }
      }

      this.dialogBox.update();
    },

    draw() {
      p.clear();

      // Background gradient (lab colors)
      for (let y = 0; y < 384; y++) {
        const inter = p.map(y, 0, 384, 0, 1);
        const c = p.lerpColor(p.color(240, 240, 250), p.color(200, 210, 230), inter);
        p.stroke(c);
        p.line(0, y, 512, y);
      }

      // Draw lab elements
      this.drawLab();

      // Draw professor
      this.drawProfessor(256, this.professorY);

      // Draw pokeballs with starters
      for (let i = 0; i < 3; i++) {
        const x = 130 + i * 126;
        const y = this.pokeballsY[i];
        const isSelected = this.selectedIndex === i && this.phase === "selecting";
        this.drawStarterPokeball(x, y, starters[i], isSelected);
      }

      // Draw selection indicator
      if (this.phase === "selecting") {
        const selectedX = 130 + this.selectedIndex * 126;
        p.noFill();
        p.stroke(255, 200, 0);
        p.strokeWeight(3);
        p.ellipse(selectedX, 200, 90, 90);
        p.strokeWeight(1);

        // Draw starter info
        this.drawStarterInfo(starters[this.selectedIndex]);
      }

      // Draw confirmation dialog
      if (this.phase === "confirming") {
        this.drawConfirmDialog();
      }

      // Dialog box
      p.fill(0);
      p.noStroke();
      p.rect(0, 288, 512, 100);
      this.dialogBox.draw();

      // Instructions
      if (this.phase === "selecting") {
        p.fill(255);
        p.textSize(10);
        p.textAlign(p.CENTER);
        p.text("< > para elegir    ENTER para confirmar", 256, 375);
      }
    },

    drawLab() {
      // Lab table
      p.fill(139, 90, 43);
      p.noStroke();
      p.rect(50, 230, 412, 60);

      // Table top
      p.fill(160, 110, 60);
      p.rect(50, 225, 412, 10);

      // Windows
      p.fill(180, 220, 255);
      p.rect(30, 20, 80, 60);
      p.rect(402, 20, 80, 60);

      // Window frames
      p.stroke(100);
      p.strokeWeight(2);
      p.line(70, 20, 70, 80);
      p.line(30, 50, 110, 50);
      p.line(442, 20, 442, 80);
      p.line(402, 50, 482, 50);
      p.noStroke();

      // Bookshelf
      p.fill(120, 80, 40);
      p.rect(0, 90, 40, 100);
      p.rect(472, 90, 40, 100);

      // Books
      const bookColors = [[200, 50, 50], [50, 50, 200], [50, 150, 50], [200, 200, 50]];
      for (let i = 0; i < 4; i++) {
        p.fill(bookColors[i]);
        p.rect(5, 95 + i * 22, 30, 18);
        p.rect(477, 95 + i * 22, 30, 18);
      }
    },

    drawProfessor(x, y) {
      p.push();
      p.translate(x, y);

      // Lab coat
      p.fill(255);
      p.noStroke();
      p.rect(-25, 20, 50, 60);

      // Head
      p.fill(255, 220, 180);
      p.ellipse(0, 10, 40, 45);

      // Hair (gray, wine-colored highlights)
      p.fill(100, 60, 80);
      p.arc(0, 0, 40, 30, p.PI, 0, p.CHORD);

      // Eyes
      p.fill(60, 40, 40);
      p.ellipse(-8, 10, 6, 6);
      p.ellipse(8, 10, 6, 6);

      // Smile
      p.noFill();
      p.stroke(60, 40, 40);
      p.strokeWeight(2);
      p.arc(0, 18, 15, 10, 0, p.PI);

      // Glasses
      p.noFill();
      p.stroke(80);
      p.strokeWeight(1);
      p.ellipse(-8, 10, 14, 12);
      p.ellipse(8, 10, 14, 12);
      p.line(-1, 10, 1, 10);

      p.pop();
    },

    drawStarterPokeball(x, y, starter, isSelected) {
      p.push();
      p.translate(x, y);

      const scale = isSelected ? 1.2 : 1;
      const bounce = isSelected ? p.sin(this.animTimer * 0.01) * 5 : 0;
      p.translate(0, bounce);

      // Shadow
      p.fill(0, 0, 0, 50);
      p.noStroke();
      p.ellipse(3, 3, 60 * scale, 60 * scale);

      // Pokeball top (starter type color)
      p.fill(starter.color);
      p.arc(0, 0, 60 * scale, 60 * scale, p.PI, 0, p.CHORD);

      // Pokeball bottom
      p.fill(255);
      p.arc(0, 0, 60 * scale, 60 * scale, 0, p.PI, p.CHORD);

      // Center line
      p.stroke(40);
      p.strokeWeight(3);
      p.line(-30 * scale, 0, 30 * scale, 0);

      // Center button
      p.fill(255);
      p.stroke(40);
      p.strokeWeight(2);
      p.ellipse(0, 0, 18 * scale, 18 * scale);
      p.fill(240);
      p.noStroke();
      p.ellipse(0, 0, 10 * scale, 10 * scale);

      // Shine
      p.fill(255, 255, 255, 150);
      p.ellipse(-10 * scale, -10 * scale, 12 * scale, 12 * scale);

      p.pop();
    },

    drawStarterInfo(starter) {
      // Info box
      p.fill(0, 0, 0, 180);
      p.noStroke();
      p.rect(156, 120, 200, 60, 5);

      p.fill(255);
      p.textSize(14);
      p.textAlign(p.CENTER);
      p.text(starter.name, 256, 140);

      p.fill(starter.color);
      p.textSize(10);
      p.text("Tipo: " + starter.type, 256, 155);

      p.fill(200);
      p.textSize(8);
      p.text(starter.description, 256, 170);
    },

    drawConfirmDialog() {
      // Overlay
      p.fill(0, 0, 0, 150);
      p.rect(0, 0, 512, 288);

      // Dialog box
      p.fill(255);
      p.stroke(100);
      p.strokeWeight(3);
      p.rect(106, 100, 300, 100, 10);

      p.fill(0);
      p.noStroke();
      p.textSize(12);
      p.textAlign(p.CENTER);
      p.text("Elegir a " + starters[this.selectedIndex].name + "?", 256, 130);

      // Yes/No buttons
      const yesSelected = this.confirmed;
      const noSelected = !this.confirmed;

      p.fill(yesSelected ? [100, 200, 100] : [200, 200, 200]);
      p.rect(140, 150, 80, 30, 5);
      p.fill(noSelected ? [200, 100, 100] : [200, 200, 200]);
      p.rect(292, 150, 80, 30, 5);

      p.fill(0);
      p.textSize(12);
      p.text("SI", 180, 170);
      p.text("NO", 332, 170);
    },

    onKeyPressed(keyEvent) {
      if (this.phase === "selecting") {
        if (keyEvent.keyCode === p.LEFT_ARROW) {
          this.selectedIndex = (this.selectedIndex - 1 + 3) % 3;
        }
        if (keyEvent.keyCode === p.RIGHT_ARROW) {
          this.selectedIndex = (this.selectedIndex + 1) % 3;
        }
        if (keyEvent.keyCode === p.ENTER) {
          this.phase = "confirming";
          this.confirmed = true;
        }
      } else if (this.phase === "confirming") {
        if (keyEvent.keyCode === p.LEFT_ARROW || keyEvent.keyCode === p.RIGHT_ARROW) {
          this.confirmed = !this.confirmed;
        }
        if (keyEvent.keyCode === p.ENTER) {
          if (this.confirmed) {
            // Save selected Pokemon to game state
            gameState.starterPokemon = { ...starters[this.selectedIndex] };
            gameState.playerPokemon = {
              name: starters[this.selectedIndex].name,
              maxHp: 100,
              hp: 100,
              attacks: starters[this.selectedIndex].attacks,
            };
            this.phase = "done";
            this.dialogBox.clearText();
            this.dialogBox.displayText(
              "Excelente eleccion! " + starters[this.selectedIndex].name + " sera tu companero!",
              () => {
                this.dialogBox.clearText();
                this.dialogBox.displayText(
                  "Ahora ve a explorar la comarca!\nTu aventura comienza en Carinena!",
                  () => {
                    setScene("regionMap");
                  }
                );
              }
            );
          } else {
            this.phase = "selecting";
          }
        }
      }
    },
  };
}
