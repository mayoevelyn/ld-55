import Game from "../core/Game.ts";
import { GamePreloader } from "./GamePreloader.tsx";
import PlayerCameraController from "./entities/PlayerCameraController.ts";
import HallwayLevel from "./environment/HallwayLevel.ts";

// Do this so we can access the game from the console
declare global {
  interface Window {
    DEBUG: { game?: Game };
  }
}

async function main() {
  const game = new Game();
  await game.init();
  // Make the game accessible from the console
  window.DEBUG = { game };

  const preloader = game.addEntity(GamePreloader);
  await preloader.waitTillLoaded();
  preloader.destroy();

  HallwayLevel.addLevelEntities(game);
  game.addEntity(new PlayerCameraController(game.camera));

  // ExampleLevel.addLevelEntities(game);
}

window.addEventListener("load", main);
