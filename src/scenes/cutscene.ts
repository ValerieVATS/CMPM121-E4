import Phaser from "phaser";
import { HEIGHT, WIDTH } from "../actors.ts";
import type { Hud } from "../hud.ts";
import { ROUTE } from "../route.ts";
import { play } from "../sounds.ts";
import { TINTS } from "../textures.ts";
import { Backdrop } from "./backdrop.ts";
import { fadeTo } from "./boot.ts";
import type { RunTotals } from "./play.ts";

/** Lines of the closing story and when (seconds) each appears. */
const SECTOR_COUNT_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];
const sectorCount = ROUTE.length - 1;
const STORY: [number, string][] = [
  [0.8, "The Warden's lights go dark, one ring at a time."],
  [
    4.2,
    `Behind you, ${
      SECTOR_COUNT_WORDS[sectorCount] ?? sectorCount
    } sectors of open sky.`,
  ],
  [7.6, "Ahead, the long way home."],
];
const WARP_AT = 9;
const CREDITS_AT = 11;
const RETURN_AT = 18;

export class CutsceneScene extends Phaser.Scene {
  private backdrop!: Backdrop;
  private run!: RunTotals;
  private fromDemo = false;

  constructor(private readonly hud: Hud) {
    super("cutscene");
  }

  init(data: { run: RunTotals; fromDemo: boolean }): void {
    this.run = data.run;
    this.fromDemo = data.fromDemo;
  }

  create(): void {
    this.backdrop = new Backdrop(this);
    const skip = () => this.endCutscene();
    this.input.keyboard?.on("keydown-SPACE", skip);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off("keydown-SPACE", skip);
    });
    const run = this.run;
    this.hud.setMode("cutscene");
    this.hud.setBoss(null);
    this.cameras.main.fadeIn(600, 4, 2, 12);

    const ship = this.add.image(WIDTH / 2, HEIGHT - 120, "player");
    ship.enableFilters();
    ship.filters?.internal.addGlow(TINTS.player, 5, 0, 1);
    this.add.particles(0, 0, "spark", {
      speedY: { min: 120, max: 260 },
      lifespan: 420,
      scale: { start: 1.2, end: 0 },
      tint: TINTS.player,
      blendMode: "ADD",
      frequency: 16,
    }).startFollow(ship, 0, 18);
    this.tweens.add({
      targets: ship,
      y: HEIGHT - 140,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    for (const [at, line] of STORY) {
      this.time.delayedCall(at * 1000, () => this.hud.say(line));
    }
    this.time.delayedCall(WARP_AT * 1000, () => {
      this.hud.say("");
      play(this, "pickup", 0.7);
      this.tweens.add({
        targets: this.backdrop,
        warp: 18,
        duration: 900,
        ease: "Quad.in",
      });
      this.tweens.killTweensOf(ship);
      this.tweens.add({
        targets: ship,
        y: -80,
        scale: 0.4,
        duration: 1100,
        ease: "Back.in",
      });
      this.time.delayedCall(
        1000,
        () => this.cameras.main.flash(500, 220, 250, 255),
      );
    });
    this.time.delayedCall(CREDITS_AT * 1000, () => {
      this.hud.announce("THANK YOU FOR PLAYING", `Final score ${run.score}`);
      if (this.fromDemo) {
        this.hud.say(
          `Self-play: ${run.kills} kills, ${run.hits} hits, ${run.continues} continues`,
        );
      }
    });
    this.time.delayedCall(RETURN_AT * 1000, () => this.endCutscene());
  }

  override update(_time: number, delta: number): void {
    this.backdrop.scroll(delta);
  }

  private endCutscene(): void {
    this.hud.say("");
    fadeTo(this, "title");
  }
}
