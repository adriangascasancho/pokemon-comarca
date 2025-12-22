/* =========================
   ENTIDAD POKÉMON
========================= */

// Base de datos de Pokémon
const POKEMON_DB = {
  1: { name: 'Bulbasaur', type: 'Planta', hp: 45, atk: 49, def: 49, spd: 45, moves: ['Placaje', 'Látigo Cepa'] },
  4: { name: 'Charmander', type: 'Fuego', hp: 39, atk: 52, def: 43, spd: 65, moves: ['Placaje', 'Ascuas'] },
  7: { name: 'Squirtle', type: 'Agua', hp: 44, atk: 48, def: 65, spd: 43, moves: ['Placaje', 'Burbuja'] },
  16: { name: 'Pidgey', type: 'Volador', hp: 40, atk: 45, def: 40, spd: 56, moves: ['Placaje', 'Tornado'] },
  19: { name: 'Rattata', type: 'Normal', hp: 30, atk: 56, def: 35, spd: 72, moves: ['Placaje', 'Ataque Rápido'] },
  25: { name: 'Pikachu', type: 'Eléctrico', hp: 35, atk: 55, def: 40, spd: 90, moves: ['Placaje', 'Impactrueno'] },
  41: { name: 'Zubat', type: 'Veneno', hp: 40, atk: 45, def: 35, spd: 55, moves: ['Absorber', 'Supersónico'] },
  74: { name: 'Geodude', type: 'Roca', hp: 40, atk: 80, def: 100, spd: 20, moves: ['Placaje', 'Lanzarrocas'] },
  92: { name: 'Gastly', type: 'Fantasma', hp: 30, atk: 35, def: 30, spd: 80, moves: ['Lengüetazo', 'Hipnosis'] },
  129: { name: 'Magikarp', type: 'Agua', hp: 20, atk: 10, def: 55, spd: 80, moves: ['Salpicadura'] },
  133: { name: 'Eevee', type: 'Normal', hp: 55, atk: 55, def: 50, spd: 55, moves: ['Placaje', 'Ataque Arena'] }
};

// Base de datos de movimientos
const MOVES_DB = {
  'Placaje': { power: 40, type: 'Normal', acc: 100 },
  'Ascuas': { power: 40, type: 'Fuego', acc: 100 },
  'Burbuja': { power: 40, type: 'Agua', acc: 100 },
  'Látigo Cepa': { power: 45, type: 'Planta', acc: 100 },
  'Impactrueno': { power: 40, type: 'Eléctrico', acc: 100 },
  'Tornado': { power: 40, type: 'Volador', acc: 100 },
  'Ataque Rápido': { power: 40, type: 'Normal', acc: 100, priority: 1 },
  'Absorber': { power: 20, type: 'Planta', acc: 100, drain: true },
  'Supersónico': { power: 0, type: 'Normal', acc: 55, confuse: true },
  'Lanzarrocas': { power: 50, type: 'Roca', acc: 90 },
  'Lengüetazo': { power: 30, type: 'Fantasma', acc: 100 },
  'Hipnosis': { power: 0, type: 'Psíquico', acc: 60, sleep: true },
  'Salpicadura': { power: 0, type: 'Normal', acc: 100 },
  'Ataque Arena': { power: 0, type: 'Normal', acc: 100, lowerAcc: true }
};

class Pokemon {
  constructor(id, level) {
    const data = POKEMON_DB[id];
    if (!data) {
      console.error(`Pokemon ID ${id} no encontrado`);
      return;
    }

    this.id = id;
    this.name = data.name;
    this.type = data.type;
    this.level = level;

    // Calcular stats basados en nivel
    this.maxHp = Math.floor((data.hp * 2 * level / 100) + level + 10);
    this.hp = this.maxHp;
    this.atk = Math.floor((data.atk * 2 * level / 100) + 5);
    this.def = Math.floor((data.def * 2 * level / 100) + 5);
    this.spd = Math.floor((data.spd * 2 * level / 100) + 5);

    this.moves = data.moves.slice(0, 4);
    this.exp = 0;
    this.expNext = level * level * 4;

    // Para sprites cargados de internet
    this.spriteFront = null;
    this.spriteBack = null;
    this.spriteLoaded = false;

    this.loadSprites();
  }

  loadSprites() {
    const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

    this.spriteFront = loadImage(
      `${baseUrl}/${this.id}.png`,
      () => { this.spriteLoaded = true; },
      () => { console.log(`Error cargando sprite de ${this.name}`); }
    );

    this.spriteBack = loadImage(
      `${baseUrl}/back/${this.id}.png`,
      () => {},
      () => { console.log(`Error cargando sprite trasero de ${this.name}`); }
    );
  }

  // Calcular daño de un ataque
  calculateDamage(move, defender) {
    const moveData = MOVES_DB[move];
    if (!moveData || moveData.power === 0) return 0;

    const effectiveness = getTypeEffectiveness(moveData.type, defender.type);
    let damage = Math.floor(
      ((2 * this.level / 5 + 2) * moveData.power * this.atk / defender.def / 50) + 2
    );
    damage = Math.max(1, Math.floor(damage * effectiveness));

    // Random factor (85-100%)
    damage = Math.floor(damage * (random(85, 100) / 100));

    return { damage, effectiveness };
  }

  // Recibir daño
  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    return this.hp <= 0;
  }

  // Curar
  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  // Curar completamente
  fullHeal() {
    this.hp = this.maxHp;
  }

  // Ganar experiencia
  gainExp(amount) {
    this.exp += amount;
    while (this.exp >= this.expNext) {
      this.levelUp();
    }
  }

  // Subir de nivel
  levelUp() {
    this.exp -= this.expNext;
    this.level++;
    this.expNext = this.level * this.level * 4;

    const data = POKEMON_DB[this.id];
    const oldMaxHp = this.maxHp;

    this.maxHp = Math.floor((data.hp * 2 * this.level / 100) + this.level + 10);
    this.atk = Math.floor((data.atk * 2 * this.level / 100) + 5);
    this.def = Math.floor((data.def * 2 * this.level / 100) + 5);
    this.spd = Math.floor((data.spd * 2 * this.level / 100) + 5);

    // Recuperar HP proporcional
    this.hp += this.maxHp - oldMaxHp;

    return true;
  }

  // Dibujar sprite
  draw(x, y, size, isBack = false) {
    const sprite = isBack ? this.spriteBack : this.spriteFront;
    if (sprite && this.spriteLoaded) {
      image(sprite, x, y, size, size);
    } else {
      // Placeholder
      fill(TYPE_COLORS[this.type] || '#888');
      rect(x, y, size, size);
      fill(255);
      textSize(8);
      textAlign(CENTER, CENTER);
      text(this.name.substring(0, 3), x + size / 2, y + size / 2);
    }
  }

  // Dibujar barra de HP
  drawHPBar(x, y, w, h, showNumbers = false) {
    const pct = this.hp / this.maxHp;
    let barColor;
    if (pct > 0.5) barColor = color(88, 176, 88);
    else if (pct > 0.2) barColor = color(242, 193, 78);
    else barColor = color(224, 84, 84);

    // Fondo
    fill(40);
    rect(x, y, w, h);

    // Barra interior
    fill(20);
    rect(x + 2, y + 2, w - 4, h - 4);

    // HP actual
    fill(barColor);
    rect(x + 2, y + 2, (w - 4) * pct, h - 4);

    // Números
    if (showNumbers) {
      fill(0);
      textSize(8);
      textAlign(RIGHT, CENTER);
      text(`${this.hp}/${this.maxHp}`, x + w, y + h + 10);
    }
  }
}

// Crear Pokémon salvaje aleatorio de una lista de encuentros
function createWildPokemon(encounters) {
  const total = encounters.reduce((s, e) => s + e.rate, 0);
  let r = random(total);
  let enc = encounters[0];

  for (const e of encounters) {
    r -= e.rate;
    if (r <= 0) {
      enc = e;
      break;
    }
  }

  const level = Math.floor(random(enc.minLv, enc.maxLv + 1));
  return new Pokemon(enc.id, level);
}
