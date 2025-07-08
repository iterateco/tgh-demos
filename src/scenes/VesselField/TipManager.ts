import Phaser from 'phaser';
import { Tip } from './Tip';

export class TipManager {
  private scene: Phaser.Scene;
  private currentTip?: Tip;
  private shownKeys: Set<string> = new Set();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(key: string, message: string, icon: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container) {
    if (this.currentTip) {
      this.currentTip.hide();
      this.currentTip = undefined;
    }
    const tip = new Tip(this.scene, icon, message);
    tip.show();
    this.currentTip = tip;
    this.shownKeys.add(key);
  }

  wasShown(key: string): boolean {
    return this.shownKeys.has(key);
  }

  close() {
    if (this.currentTip) {
      this.currentTip.hide();
      this.currentTip = undefined;
    }
  }

  resize() {
    if (this.currentTip) {
      this.currentTip.resize();
    }
  }
}
