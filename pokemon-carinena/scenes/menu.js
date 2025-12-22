export function makeMenu(p) {
  return {
    easing: 0.5,
    alpha: 255,
    blinkBack: false,
    titleY: -50,
    pokeballY: 450,
    pokeballVY: -8,
    grapeAngle: 0,

    load() {
      // No necesitamos cargar imágenes, dibujamos todo con código
    },

    update() {
      // Animación de parpadeo del texto "PULSA ENTER"
      if (this.alpha <= 0) this.blinkBack = true;
      if (this.alpha >= 255) this.blinkBack = false;

      if (this.blinkBack) {
        this.alpha += 0.7 * this.easing * p.deltaTime;
      } else {
        this.alpha -= 0.7 * this.easing * p.deltaTime;
      }

      // Animación del título bajando
      if (this.titleY < 60) {
        this.titleY += 0.15 * p.deltaTime;
      }

      // Animación de la pokeball rebotando
      this.pokeballY += this.pokeballVY;
      this.pokeballVY += 0.3;
      if (this.pokeballY > 280) {
        this.pokeballVY = -7;
      }

      // Animación de las uvas girando
      this.grapeAngle += 0.02;
    },

    draw() {
      p.clear();

      // Fondo degradado
      for (let y = 0; y < 384; y++) {
        const inter = p.map(y, 0, 384, 0, 1);
        const c = p.lerpColor(p.color(10, 10, 60), p.color(60, 20, 80), inter);
        p.stroke(c);
        p.line(0, y, 512, y);
      }

      // Decoración de viñedos en el fondo
      this.drawVineyardBackground();

      // Pokeball decorativa
      this.drawPokeball(256, this.pokeballY);

      // Título principal
      p.noStroke();

      // Sombra del título
      p.fill(0, 0, 0, 100);
      p.textSize(32);
      p.textAlign(p.CENTER);
      p.text("POKEMON", 258, this.titleY + 2);

      // Título POKEMON
      p.fill(248, 208, 48);
      p.text("POKEMON", 256, this.titleY);

      // Subtítulo "COMARCA DE"
      p.fill(248, 88, 136);
      p.textSize(14);
      p.text("COMARCA DE", 256, this.titleY + 50);

      // "CARIÑENA"
      p.fill(180, 50, 100);
      p.textSize(22);
      p.text("CARINENA", 256, this.titleY + 85);

      // Decoración de uvas a los lados
      this.drawGrapeDecoration(80, 200, this.grapeAngle);
      this.drawGrapeDecoration(432, 200, -this.grapeAngle);

      // "PULSA ENTER" parpadeando
      p.fill(255, 255, 255, this.alpha);
      p.textSize(12);
      p.text("PULSA ENTER", 256, 340);

      // Versión
      p.fill(100, 100, 100);
      p.textSize(8);
      p.text("v1.0 - Aragon Edition", 256, 370);
    },

    drawPokeball(x, y) {
      p.push();
      p.translate(x, y);

      // Sombra
      p.fill(0, 0, 0, 50);
      p.noStroke();
      p.ellipse(5, 5, 70, 70);

      // Mitad superior roja
      p.fill(232, 64, 64);
      p.arc(0, 0, 70, 70, p.PI, 0, p.CHORD);

      // Mitad inferior blanca
      p.fill(255);
      p.arc(0, 0, 70, 70, 0, p.PI, p.CHORD);

      // Línea central
      p.stroke(40);
      p.strokeWeight(4);
      p.line(-35, 0, 35, 0);

      // Círculo central exterior
      p.fill(255);
      p.stroke(40);
      p.strokeWeight(3);
      p.ellipse(0, 0, 22, 22);

      // Círculo central interior
      p.fill(255);
      p.noStroke();
      p.ellipse(0, 0, 12, 12);

      // Brillo
      p.fill(255, 255, 255, 150);
      p.ellipse(-12, -12, 15, 15);

      p.pop();
    },

    drawGrapeDecoration(x, y, angle) {
      p.push();
      p.translate(x, y);
      p.rotate(p.sin(angle) * 0.1);

      // Racimo de uvas
      p.noStroke();
      p.fill(100, 40, 120);

      // Uvas en forma de triángulo
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col <= row; col++) {
          const ux = (col - row / 2) * 12;
          const uy = row * 10;
          p.ellipse(ux, uy, 10, 10);
          // Brillo
          p.fill(150, 80, 170);
          p.ellipse(ux - 2, uy - 2, 4, 4);
          p.fill(100, 40, 120);
        }
      }

      // Tallo
      p.stroke(80, 60, 40);
      p.strokeWeight(2);
      p.line(0, -5, 0, -20);

      // Hoja
      p.noStroke();
      p.fill(60, 140, 60);
      p.ellipse(8, -15, 20, 10);

      p.pop();
    },

    drawVineyardBackground() {
      p.push();
      p.noStroke();

      // Colinas de viñedos
      p.fill(40, 80, 40, 50);
      p.ellipse(100, 380, 300, 100);
      p.ellipse(400, 380, 350, 120);

      // Líneas de viñedos
      p.stroke(50, 90, 50, 40);
      p.strokeWeight(2);
      for (let i = 0; i < 8; i++) {
        const startX = 50 + i * 60;
        p.line(startX, 350, startX - 20, 384);
      }

      p.pop();
    }
  };
}
