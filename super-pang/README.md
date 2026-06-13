# SUPER PANG · SUPERPUNK EDITION

Minijuego web autocontenido inspirado **directamente** en el arcade *Super Pang /
Pang (Buster Bros)* de Mitchell/Capcom (1989-90), con ambientación **superpunk**
(cyberpunk retro-neón) y fondos con fotos reales del pueblo tintadas en neón.

> Homenaje fan con fines educativos. *Super Pang / Pang* es © Mitchell/Capcom.

## Cómo jugar

- **Doble clic en `index.html`** (no necesita servidor ni instalación).
- O bien: `python -m http.server` dentro de esta carpeta y abrir `http://localhost:8000`.

### Controles

| Acción      | Escritorio            | Móvil                 |
|-------------|-----------------------|-----------------------|
| Mover       | ← → (o A / D)         | botones ◀ ▶          |
| Disparar    | ESPACIO               | botón ⌁ FIRE         |
| Escaleras   | ↑ ↓ (o W / S)         | botones ▲ ▼          |
| Pausa       | P / botón ❚❚          | botón ❚❚             |
| Mute        | M / botón ♪           | botón ♪              |
| Pantalla completa | F / botón ⛶     | botón ⛶             |
| Start       | ENTER / ESPACIO       | tocar / FIRE          |

## Mecánica (fiel al original)

- El personaje se mueve sólo en horizontal y dispara un **arpón** vertical (1 a la vez,
  2 con el power-up de doble arpón).
- Las **bolas** rebotan con física parabólica y se **dividen en 4 tamaños**
  (grande → mediana → pequeña → diminuta); la diminuta desaparece al tocarla.
- **Plataformas** (fijas y destructibles) y **escaleras** para subir/bajar.
- **Power-ups:** doble arpón, cable adhesivo, reloj (congela), dinamita, vida extra, escudo.
- **HUD** arcade: SCORE / HI-SCORE / TIME / vidas / `WORLD x-y`. Si el TIME llega a 0
  aparecen bolas rápidas de castigo.
- **Combos** con multiplicador, HI-SCORE persistente en `localStorage`.

## Estructura

```
super-pang/
├── index.html      # marco arcade + canvas + controles
├── css/style.css   # estética superpunk: neón, scanlines CRT, glow, glitch
├── js/levels.js    # NIVELES COMO DATOS (añadir mundos = añadir entradas)
├── js/game.js      # motor: estados, game loop, física, render, audio
└── img/            # fondos (fotos del pueblo)
```

## Fondos del pueblo

Coloca/repón estas fotos en `img/` (si falta alguna, el juego usa un degradado neón):

- `img/nivel1-iglesia.jpeg` — La Iglesia Mudéjar ✅
- `img/nivel2-ruinas.jpeg`  — Las Ruinas del Castillo ✅
- `img/nivel3-portico.jpeg` — El Pórtico de Piedra ⛔ (pendiente: arrastra aquí tu foto)

## Añadir nuevos niveles

Edita `js/levels.js` y añade un objeto al array `LEVELS` con su `background`,
`platforms`, `ladders`, `balls`, `powerups` y `timeLimit`. El motor lo carga solo.
