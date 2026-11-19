import Phaser from "phaser";
import { loadSounds } from "../sounds.ts";
import { makeTextures } from "../textures.ts";

/** Create shared assets once before entering the title scene. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create(): void {
    makeTextures(this);
    loadSounds(this);
    this.scene.start("title");
  }
}

const fading = new WeakSet<Phaser.Scene>();

/** Leave a scene using the same fade and color for every transition. */
export function fadeTo(scene: Phaser.Scene, key: string, data?: object): void {
  if (fading.has(scene)) return;
  fading.add(scene);
  scene.cameras.main.fadeOut(450, 4, 2, 12);
  scene.cameras.main.once("camerafadeoutcomplete", () => {
    fading.delete(scene);
    scene.scene.start(key, data);
  });
}
