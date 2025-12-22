/* =========================
   ENTIDAD JUGADOR
========================= */

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 16;
    this.speed = 2;
    this.direction = 0; // 0=down, 1=up, 2=left, 3=right
    this.isMoving = false;
    this.animFrame = 0;
    this.animTimer = 0;

    // Sprite colors
    this.colors = {
      skin: '#F8C8A0',
      skinDark: '#D8A078',
      hair: '#402820',
      shirt: '#E03030',
      shirtDark: '#B02020',
      pants: '#3058A8',
      pantsDark: '#204080',
      shoe: '#282828'
    };
  }

  update() {
    this.isMoving = false;
    const prevX = this.x;
    const prevY = this.y;

    if (keyIsDown(RIGHT_ARROW)) {
      this.x += this.speed;
      this.direction = 3;
      this.isMoving = true;
    } else if (keyIsDown(LEFT_ARROW)) {
      this.x -= this.speed;
      this.direction = 2;
      this.isMoving = true;
    } else if (keyIsDown(UP_ARROW)) {
      this.y -= this.speed;
      this.direction = 1;
      this.isMoving = true;
    } else if (keyIsDown(DOWN_ARROW)) {
      this.y += this.speed;
      this.direction = 0;
      this.isMoving = true;
    }

    // Animación
    if (this.isMoving) {
      this.animTimer++;
      if (this.animTimer >= 8) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 2;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
    }
  }

  draw(offsetX = 0, offsetY = 0) {
    const px = this.x - offsetX;
    const py = this.y - offsetY;
    const s = GAME.scale;

    push();
    noStroke();

    // Sombra
    fill(0, 0, 0, 50);
    rect(px * s + 3 * s, (py + 14) * s, 10 * s, 2 * s);

    const legOffset = this.animFrame === 1 ? 1 : 0;

    // Piernas
    fill(this.colors.pants);
    rect((px + 5) * s, (py + 10 - legOffset) * s, 3 * s, (4 + legOffset) * s);
    rect((px + 8) * s, (py + 10 + legOffset) * s, 3 * s, (4 - legOffset) * s);

    fill(this.colors.pantsDark);
    rect((px + 5) * s, (py + 10 - legOffset) * s, 1 * s, (4 + legOffset) * s);
    rect((px + 8) * s, (py + 10 + legOffset) * s, 1 * s, (4 - legOffset) * s);

    // Zapatos
    fill(this.colors.shoe);
    rect((px + 5) * s, (py + 13) * s, 3 * s, 2 * s);
    rect((px + 8) * s, (py + 13) * s, 3 * s, 2 * s);

    // Cuerpo
    fill(this.colors.shirt);
    rect((px + 4) * s, (py + 6) * s, 8 * s, 5 * s);

    fill(this.colors.shirtDark);
    rect((px + 4) * s, (py + 6) * s, 2 * s, 5 * s);
    rect((px + 10) * s, (py + 6) * s, 2 * s, 5 * s);

    // Brazos
    fill(this.colors.shirt);
    rect((px + 2) * s, (py + 6) * s, 2 * s, 4 * s);
    rect((px + 12) * s, (py + 6) * s, 2 * s, 4 * s);

    fill(this.colors.skin);
    rect((px + 2) * s, (py + 10) * s, 2 * s, 1 * s);
    rect((px + 12) * s, (py + 10) * s, 2 * s, 1 * s);

    // Cabeza
    fill(this.colors.skin);
    rect((px + 5) * s, (py + 2) * s, 6 * s, 5 * s);

    // Pelo
    fill(this.colors.hair);
    rect((px + 4) * s, py * s, 8 * s, 3 * s);

    // Gorra (roja como la camisa)
    fill(this.colors.shirt);
    rect((px + 3) * s, (py + 1) * s, 10 * s, 2 * s);

    // Visera blanca
    fill(255);
    rect((px + 5) * s, (py + 2) * s, 2 * s, 1 * s);

    // Ojos según dirección
    fill(0);
    if (this.direction === 0) { // Abajo
      rect((px + 6) * s, (py + 4) * s, 1 * s, 2 * s);
      rect((px + 9) * s, (py + 4) * s, 1 * s, 2 * s);
    } else if (this.direction === 1) { // Arriba - no se ven ojos
      // Solo pelo
    } else if (this.direction === 2) { // Izquierda
      rect((px + 6) * s, (py + 4) * s, 1 * s, 2 * s);
    } else if (this.direction === 3) { // Derecha
      rect((px + 9) * s, (py + 4) * s, 1 * s, 2 * s);
    }

    pop();
  }

  // Obtener tile frente al jugador
  getFacingTile(tileSize) {
    const dirs = [
      { dx: 0, dy: 1 },  // down
      { dx: 0, dy: -1 }, // up
      { dx: -1, dy: 0 }, // left
      { dx: 1, dy: 0 }   // right
    ];
    const d = dirs[this.direction];
    return {
      x: Math.floor((this.x + 8) / tileSize) + d.dx,
      y: Math.floor((this.y + 8) / tileSize) + d.dy
    };
  }

  // Posición en tiles
  getTilePos(tileSize) {
    return {
      x: Math.floor((this.x + 8) / tileSize),
      y: Math.floor((this.y + 8) / tileSize)
    };
  }
}
