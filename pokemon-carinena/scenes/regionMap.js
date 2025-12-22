import { makeDialogBox } from "../entities/dialogBox.js";

const towns = [
  {
    name: "CARINENA",
    x: 256,
    y: 180,
    description: "Capital de la comarca. Famosa por sus vinos.",
    gym: "Lider Tempranillo",
    gymType: "Planta",
    unlocked: true,
    visited: false,
    connections: ["AGUARON", "LONGARES", "PANIZA"],
  },
  {
    name: "AGUARON",
    x: 150,
    y: 140,
    description: "Pueblo de tradicion vitivinicola.",
    gym: "Lider Macabeo",
    gymType: "Agua",
    unlocked: true,
    visited: false,
    connections: ["CARINENA", "COSUENDA"],
  },
  {
    name: "LONGARES",
    x: 380,
    y: 140,
    description: "Conocido por sus bodegas centenarias.",
    gym: "Lider Garnacha",
    gymType: "Fuego",
    unlocked: false,
    visited: false,
    connections: ["CARINENA", "ALFAMEN"],
  },
  {
    name: "PANIZA",
    x: 200,
    y: 250,
    description: "Rodeado de vinedos en las colinas.",
    gym: "Lider Vidadillo",
    gymType: "Tierra",
    unlocked: false,
    visited: false,
    connections: ["CARINENA", "ENCINACORBA"],
  },
  {
    name: "COSUENDA",
    x: 80,
    y: 200,
    description: "Pequeño pueblo entre montañas.",
    gym: "Lider Carinena",
    gymType: "Roca",
    unlocked: false,
    visited: false,
    connections: ["AGUARON", "VILLANUEVA"],
  },
  {
    name: "ALFAMEN",
    x: 450,
    y: 200,
    description: "Entrada este de la comarca.",
    gym: "Lider Moscatel",
    gymType: "Electrico",
    unlocked: false,
    visited: false,
    connections: ["LONGARES", "VILLANUEVA"],
  },
  {
    name: "ENCINACORBA",
    x: 120,
    y: 300,
    description: "El pueblo mas al sur de la comarca.",
    gym: "Lider Parraleta",
    gymType: "Siniestro",
    unlocked: false,
    visited: false,
    connections: ["PANIZA", "TOSOS"],
  },
  {
    name: "VILLANUEVA",
    x: 400,
    y: 300,
    description: "Villanueva de Huerva, cruce de caminos.",
    gym: "Lider Juan Ibanez",
    gymType: "Dragon",
    unlocked: false,
    visited: false,
    connections: ["COSUENDA", "ALFAMEN"],
  },
];

export function makeRegionMap(p, setScene, gameState) {
  return {
    dialogBox: makeDialogBox(p, 0, 310),
    selectedIndex: 0,
    towns: JSON.parse(JSON.stringify(towns)), // Deep copy
    cursorBlink: 0,
    showingInfo: false,

    load() {
      this.dialogBox.load();
    },

    setup() {
      // Mark Cariñena as the starting point
      this.towns[0].unlocked = true;

      // Restore visited status from gameState if available
      if (gameState.visitedTowns) {
        for (const town of this.towns) {
          if (gameState.visitedTowns.includes(town.name)) {
            town.visited = true;
          }
        }
      }

      // Unlock connected towns from visited ones
      for (const town of this.towns) {
        if (town.visited) {
          for (const connName of town.connections) {
            const connTown = this.towns.find(t => t.name === connName);
            if (connTown) connTown.unlocked = true;
          }
        }
      }

      this.dialogBox.setVisibility(true);
      this.updateDialog();
    },

    updateDialog() {
      const town = this.towns[this.selectedIndex];
      this.dialogBox.clearText();
      this.dialogBox.displayTextImmediately(
        `${town.name}\n${town.description}`
      );
    },

    update() {
      this.cursorBlink += p.deltaTime;
      this.dialogBox.update();
    },

    draw() {
      p.clear();

      // Draw map background
      this.drawMapBackground();

      // Draw connections between towns
      this.drawConnections();

      // Draw towns
      for (let i = 0; i < this.towns.length; i++) {
        this.drawTown(this.towns[i], i === this.selectedIndex);
      }

      // Draw player icon on current town
      this.drawPlayerIcon();

      // Draw title
      p.fill(80, 40, 60);
      p.noStroke();
      p.textSize(18);
      p.textAlign(p.CENTER);
      p.text("COMARCA DE CARINENA", 256, 30);

      // Draw legend
      this.drawLegend();

      // Draw info panel
      p.fill(60, 30, 40);
      p.rect(0, 300, 512, 84);
      this.dialogBox.draw();

      // Draw gym info for selected town
      const town = this.towns[this.selectedIndex];
      p.fill(255, 200, 100);
      p.textSize(10);
      p.textAlign(p.LEFT);
      p.text(`Gimnasio: ${town.gym} (${town.gymType})`, 10, 380);

      // Draw controls hint
      p.fill(200);
      p.textAlign(p.RIGHT);
      p.text("Flechas: Mover | ENTER: Entrar | ESC: Info", 502, 380);
    },

    drawMapBackground() {
      // Parchment-like background
      for (let y = 0; y < 300; y++) {
        const inter = p.map(y, 0, 300, 0, 1);
        const c = p.lerpColor(
          p.color(245, 235, 210),
          p.color(225, 210, 180),
          inter
        );
        p.stroke(c);
        p.line(0, y, 512, y);
      }

      // Draw vineyard decorations
      p.noStroke();
      for (let i = 0; i < 15; i++) {
        const vx = 30 + (i % 5) * 120;
        const vy = 60 + Math.floor(i / 5) * 100;
        this.drawVineyard(vx, vy);
      }

      // Draw mountains in background
      p.fill(180, 160, 140, 100);
      p.beginShape();
      p.vertex(0, 100);
      p.vertex(50, 60);
      p.vertex(100, 90);
      p.vertex(150, 50);
      p.vertex(200, 80);
      p.vertex(250, 40);
      p.vertex(300, 70);
      p.vertex(350, 45);
      p.vertex(400, 75);
      p.vertex(450, 55);
      p.vertex(512, 85);
      p.vertex(512, 100);
      p.endShape(p.CLOSE);
    },

    drawVineyard(x, y) {
      // Small vineyard icon
      p.fill(100, 150, 80, 60);
      for (let row = 0; row < 3; row++) {
        p.ellipse(x + row * 8, y, 15, 8);
      }
    },

    drawConnections() {
      p.stroke(120, 80, 60);
      p.strokeWeight(2);

      for (const town of this.towns) {
        for (const connName of town.connections) {
          const connTown = this.towns.find((t) => t.name === connName);
          if (connTown) {
            // Only draw each connection once
            if (this.towns.indexOf(town) < this.towns.indexOf(connTown)) {
              // Dashed line for locked paths
              if (!town.unlocked || !connTown.unlocked) {
                this.drawDashedLine(town.x, town.y, connTown.x, connTown.y);
              } else {
                p.line(town.x, town.y, connTown.x, connTown.y);
              }
            }
          }
        }
      }
      p.strokeWeight(1);
    },

    drawDashedLine(x1, y1, x2, y2) {
      const segments = 10;
      for (let i = 0; i < segments; i += 2) {
        const startX = p.lerp(x1, x2, i / segments);
        const startY = p.lerp(y1, y2, i / segments);
        const endX = p.lerp(x1, x2, (i + 1) / segments);
        const endY = p.lerp(y1, y2, (i + 1) / segments);
        p.stroke(150, 120, 100);
        p.line(startX, startY, endX, endY);
      }
    },

    drawTown(town, isSelected) {
      p.push();
      p.translate(town.x, town.y);

      const pulse = isSelected ? p.sin(this.cursorBlink * 0.005) * 3 : 0;
      const size = 20 + pulse;

      // Town circle
      if (!town.unlocked) {
        p.fill(150, 150, 150);
      } else if (town.visited) {
        p.fill(100, 180, 100);
      } else {
        p.fill(200, 100, 80);
      }

      p.stroke(80, 50, 40);
      p.strokeWeight(isSelected ? 3 : 2);
      p.ellipse(0, 0, size, size);

      // Town name
      p.noStroke();
      p.fill(60, 30, 20);
      p.textSize(8);
      p.textAlign(p.CENTER);
      p.text(town.name, 0, size / 2 + 12);

      // Selection ring
      if (isSelected) {
        p.noFill();
        p.stroke(255, 200, 0);
        p.strokeWeight(2);
        p.ellipse(0, 0, size + 10, size + 10);
      }

      // Lock icon for locked towns
      if (!town.unlocked) {
        p.fill(100);
        p.noStroke();
        p.rect(-4, -6, 8, 8);
        p.rect(-3, -10, 6, 5);
      }

      // Badge icon for visited towns with defeated gym
      if (town.visited && gameState.badges && gameState.badges.includes(town.name)) {
        p.fill(255, 215, 0);
        p.noStroke();
        this.drawStar(0, 0, 5, 8);
      }

      p.pop();
    },

    drawStar(x, y, innerRadius, outerRadius) {
      p.beginShape();
      for (let i = 0; i < 10; i++) {
        const angle = (p.TWO_PI / 10) * i - p.HALF_PI;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        p.vertex(x + p.cos(angle) * radius, y + p.sin(angle) * radius);
      }
      p.endShape(p.CLOSE);
    },

    drawPlayerIcon() {
      const town = this.towns[this.selectedIndex];
      if (!town.unlocked) return;

      const bounce = p.sin(this.cursorBlink * 0.008) * 3;

      p.push();
      p.translate(town.x, town.y - 25 + bounce);

      // Simple player icon (trainer)
      // Head
      p.fill(255, 220, 180);
      p.noStroke();
      p.ellipse(0, -8, 12, 14);

      // Hair
      p.fill(80, 50, 30);
      p.arc(0, -12, 12, 10, p.PI, 0, p.CHORD);

      // Cap
      p.fill(200, 50, 50);
      p.arc(0, -14, 14, 8, p.PI, 0, p.CHORD);
      p.rect(-8, -14, 16, 3);

      // Body
      p.fill(50, 100, 200);
      p.rect(-5, -2, 10, 12);

      p.pop();
    },

    drawLegend() {
      p.fill(0, 0, 0, 100);
      p.noStroke();
      p.rect(400, 45, 105, 60, 5);

      p.textSize(7);
      p.textAlign(p.LEFT);

      // Unlocked
      p.fill(200, 100, 80);
      p.ellipse(415, 58, 10, 10);
      p.fill(255);
      p.text("Disponible", 425, 61);

      // Visited
      p.fill(100, 180, 100);
      p.ellipse(415, 73, 10, 10);
      p.fill(255);
      p.text("Visitado", 425, 76);

      // Locked
      p.fill(150, 150, 150);
      p.ellipse(415, 88, 10, 10);
      p.fill(255);
      p.text("Bloqueado", 425, 91);
    },

    findNearestTown(direction) {
      const current = this.towns[this.selectedIndex];
      let nearest = null;
      let nearestDist = Infinity;

      for (let i = 0; i < this.towns.length; i++) {
        if (i === this.selectedIndex) continue;
        const town = this.towns[i];

        const dx = town.x - current.x;
        const dy = town.y - current.y;

        let valid = false;
        switch (direction) {
          case "left":
            valid = dx < -20;
            break;
          case "right":
            valid = dx > 20;
            break;
          case "up":
            valid = dy < -20;
            break;
          case "down":
            valid = dy > 20;
            break;
        }

        if (valid) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = i;
          }
        }
      }

      return nearest;
    },

    onKeyPressed(keyEvent) {
      let newIndex = null;

      switch (keyEvent.keyCode) {
        case p.LEFT_ARROW:
          newIndex = this.findNearestTown("left");
          break;
        case p.RIGHT_ARROW:
          newIndex = this.findNearestTown("right");
          break;
        case p.UP_ARROW:
          newIndex = this.findNearestTown("up");
          break;
        case p.DOWN_ARROW:
          newIndex = this.findNearestTown("down");
          break;
        case p.ENTER:
          this.enterTown();
          break;
      }

      if (newIndex !== null) {
        this.selectedIndex = newIndex;
        this.updateDialog();
      }
    },

    enterTown() {
      const town = this.towns[this.selectedIndex];

      if (!town.unlocked) {
        this.dialogBox.clearText();
        this.dialogBox.displayText("Este camino esta bloqueado.\nDerrota gimnasios para desbloquear!");
        return;
      }

      // Save current town to game state
      gameState.currentTown = town.name;

      // Mark as visited
      town.visited = true;
      if (!gameState.visitedTowns) gameState.visitedTowns = [];
      if (!gameState.visitedTowns.includes(town.name)) {
        gameState.visitedTowns.push(town.name);
      }

      // Unlock connected towns
      for (const connName of town.connections) {
        const connTown = this.towns.find(t => t.name === connName);
        if (connTown) connTown.unlocked = true;
      }

      // Go to town scene (which leads to gym battle)
      setScene("town");
    },
  };
}
