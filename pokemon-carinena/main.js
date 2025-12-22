import { makeMenu } from "./scenes/menu.js";
import { makeStarterSelect } from "./scenes/starterSelect.js";
import { makeRegionMap } from "./scenes/regionMap.js";
import { makeTown } from "./scenes/town.js";
import { makeBattle } from "./scenes/battle.js";
import { debugMode } from "./entities/debugMode.js";

new p5((p) => {
  let font;
  const scenes = ["menu", "starterSelect", "regionMap", "town", "battle"];
  let currentScene = "menu";

  // Global game state - persists across scenes
  const gameState = {
    playerPokemon: null,
    starterPokemon: null,
    currentTown: "CARINENA",
    visitedTowns: [],
    badges: [],
    currentBattle: null,
  };

  function setScene(name) {
    if (scenes.includes(name)) {
      currentScene = name;
      // Call setup on the new scene
      switch (name) {
        case "starterSelect":
          starterSelect.setup();
          break;
        case "regionMap":
          regionMap.setup();
          break;
        case "town":
          town.setup();
          break;
        case "battle":
          battle.setup();
          break;
      }
    }
  }

  const menu = makeMenu(p);
  const starterSelect = makeStarterSelect(p, setScene, gameState);
  const regionMap = makeRegionMap(p, setScene, gameState);
  const town = makeTown(p, setScene, gameState);
  const battle = makeBattle(p, setScene, gameState);

  p.preload = () => {
    font = p.loadFont("./assets/power-clear.ttf");
    menu.load();
    starterSelect.load();
    regionMap.load();
    town.load();
    battle.load();
  };

  p.setup = () => {
    const canvasEl = p.createCanvas(512, 384, document.getElementById("game"));
    p.pixelDensity(3);
    canvasEl.canvas.style = "";

    p.textFont(font);
    p.noSmooth();
  };

  p.draw = () => {
    switch (currentScene) {
      case "menu":
        menu.update();
        menu.draw();
        break;
      case "starterSelect":
        starterSelect.update();
        starterSelect.draw();
        break;
      case "regionMap":
        regionMap.update();
        regionMap.draw();
        break;
      case "town":
        town.update();
        town.draw();
        break;
      case "battle":
        battle.update();
        battle.draw();
        break;
      default:
    }

    debugMode.drawFpsCounter(p);
  };

  p.keyPressed = (keyEvent) => {
    if (keyEvent.key === "Shift") {
      debugMode.toggle();
    }

    switch (currentScene) {
      case "menu":
        if (keyEvent.keyCode === p.ENTER) {
          setScene("starterSelect");
        }
        break;
      case "starterSelect":
        starterSelect.onKeyPressed(keyEvent);
        break;
      case "regionMap":
        regionMap.onKeyPressed(keyEvent);
        break;
      case "town":
        town.onKeyPressed(keyEvent);
        break;
      case "battle":
        battle.onKeyPressed(keyEvent);
        break;
    }
  };
});
