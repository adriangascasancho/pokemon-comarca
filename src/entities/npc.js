/* =========================
   ENTIDAD NPC
========================= */

class NPC {
  constructor(x, y, name, type, dialog, action = null) {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 16;
    this.name = name;
    this.type = type; // professor, trainer, oldman, mom, gymleader, champion, shopkeeper
    this.dialog = Array.isArray(dialog) ? dialog : [dialog];
    this.action = action; // 'starter', 'heal', 'shop', 'battle', etc.
    this.direction = 0; // 0=down, 1=up, 2=left, 3=right

    // Colores según tipo
    this.colors = this.getColorsByType(type);
  }

  getColorsByType(type) {
    const types = {
      professor: { shirt: '#F0F0F0', pants: '#484848', hair: '#808080', skin: '#F8C8A0' },
      trainer: { shirt: '#4169E1', pants: '#2F2F2F', hair: '#483818', skin: '#F8C8A0' },
      oldman: { shirt: '#8B4513', pants: '#483818', hair: '#C0C0C0', skin: '#E8B888' },
      mom: { shirt: '#FF69B4', pants: '#4A4A4A', hair: '#8B4513', skin: '#F8C8A0' },
      gymleader: { shirt: '#228B22', pants: '#2F2F2F', hair: '#000000', skin: '#F8C8A0' },
      champion: { shirt: '#8B0000', pants: '#1A1A1A', hair: '#FFD700', skin: '#F8C8A0' },
      shopkeeper: { shirt: '#2196F3', pants: '#333333', hair: '#5D4037', skin: '#F8C8A0' },
      nurse: { shirt: '#E91E63', pants: '#FFFFFF', hair: '#FF9800', skin: '#F8C8A0' }
    };
    return types[type] || types.trainer;
  }

  draw(offsetX = 0, offsetY = 0) {
    const px = this.x - offsetX;
    const py = this.y - offsetY;
    const s = GAME.scale;

    push();
    noStroke();

    // Sombra
    fill(0, 0, 0, 40);
    rect(px * s + 3 * s, (py + 14) * s, 10 * s, 2 * s);

    // Piernas
    fill(this.colors.pants);
    rect((px + 5) * s, (py + 11) * s, 3 * s, 4 * s);
    rect((px + 8) * s, (py + 11) * s, 3 * s, 4 * s);

    // Cuerpo
    fill(this.colors.shirt);
    rect((px + 4) * s, (py + 6) * s, 8 * s, 6 * s);

    // Cabeza
    fill(this.colors.skin);
    rect((px + 5) * s, (py + 2) * s, 6 * s, 5 * s);

    // Pelo
    fill(this.colors.hair);
    rect((px + 4) * s, (py + 1) * s, 8 * s, 3 * s);

    // Ojos
    fill(0);
    rect((px + 6) * s, (py + 4) * s, 1 * s, 1 * s);
    rect((px + 9) * s, (py + 4) * s, 1 * s, 1 * s);

    // Detalles especiales según tipo
    if (this.type === 'professor') {
      // Bata blanca más larga
      fill('#F0F0F0');
      rect((px + 3) * s, (py + 6) * s, 10 * s, 8 * s);
      // Gafas
      fill('#FFD700');
      rect((px + 5) * s, (py + 4) * s, 3 * s, 1 * s);
      rect((px + 9) * s, (py + 4) * s, 2 * s, 1 * s);
    } else if (this.type === 'nurse') {
      // Cofia
      fill('#FFFFFF');
      rect((px + 4) * s, py * s, 8 * s, 2 * s);
      fill('#E91E63');
      rect((px + 7) * s, py * s, 2 * s, 2 * s);
    } else if (this.type === 'gymleader') {
      // Cinta en la cabeza
      fill('#FF0000');
      rect((px + 4) * s, (py + 1) * s, 8 * s, 1 * s);
    }

    pop();
  }

  // Comprobar si el jugador está mirando a este NPC
  isFacingPlayer(player, tileSize) {
    const facing = player.getFacingTile(tileSize);
    const myTile = {
      x: Math.floor((this.x + 8) / tileSize),
      y: Math.floor((this.y + 8) / tileSize)
    };
    return facing.x === myTile.x && facing.y === myTile.y;
  }

  // Mirar hacia el jugador
  lookAtPlayer(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? 3 : 2;
    } else {
      this.direction = dy > 0 ? 0 : 1;
    }
  }
}

// Clase para entrenadores que tienen combates
class Trainer extends NPC {
  constructor(x, y, name, pokemon, dialog, defeatedDialog) {
    super(x, y, name, 'trainer', dialog, 'battle');
    this.pokemon = pokemon; // Array de {id, level}
    this.defeatedDialog = defeatedDialog || ['¡Has ganado!'];
    this.defeated = false;
    this.sightRange = 4; // Tiles de visión
    this.reward = 100 * pokemon.length;
  }

  // Comprobar si ve al jugador
  canSeePlayer(player, tileSize) {
    if (this.defeated) return false;

    const myTileX = Math.floor((this.x + 8) / tileSize);
    const myTileY = Math.floor((this.y + 8) / tileSize);
    const playerTileX = Math.floor((player.x + 8) / tileSize);
    const playerTileY = Math.floor((player.y + 8) / tileSize);

    // Verificar según dirección
    switch (this.direction) {
      case 0: // Abajo
        return playerTileX === myTileX &&
          playerTileY > myTileY &&
          playerTileY <= myTileY + this.sightRange;
      case 1: // Arriba
        return playerTileX === myTileX &&
          playerTileY < myTileY &&
          playerTileY >= myTileY - this.sightRange;
      case 2: // Izquierda
        return playerTileY === myTileY &&
          playerTileX < myTileX &&
          playerTileX >= myTileX - this.sightRange;
      case 3: // Derecha
        return playerTileY === myTileY &&
          playerTileX > myTileX &&
          playerTileX <= myTileX + this.sightRange;
    }
    return false;
  }

  // Obtener equipo Pokémon
  getTeam() {
    return this.pokemon.map(p => new Pokemon(p.id, p.level));
  }
}
