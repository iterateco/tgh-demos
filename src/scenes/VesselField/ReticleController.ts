import Phaser from 'phaser';
import { SceneController } from './SceneController';
import { AppScene } from './types';

export interface ReticleTarget {
  id: string
  x: number
  y: number
  scale: number
}

export class ReticleController extends SceneController {
  sprites!: Phaser.GameObjects.Group;
  spawnedSprites = new Set();

  constructor(scene: AppScene) {
    super(scene);

    this.sprites = scene.add.group({
      classType: ReticleSprite
    });
  }

  updateTargets(targets: ReticleTarget[]) {
    const allSprites = this.sprites.getChildren() as ReticleSprite[];

    for (const sprite of allSprites) {
      const target = targets.find(t => t.id === sprite.target.id);
      if (!target) {
        sprite.setActive(false);
        sprite.setVisible(false);
      }
    }

    for (const target of targets) {
      let sprite = allSprites.find(s => s.target.id === target.id);
      if (!sprite?.active) {
        sprite = this.spawnSprite(target);
      }
      sprite.setPosition(target.x, target.y);
    }
  }

  spawnSprite(target: ReticleTarget) {
    this.spawnedSprites.add(target.id);
    const sprite = this.sprites.getFirstDead(true);
    sprite.reset(target);
    return sprite;
  }
}

class ReticleSprite extends Phaser.GameObjects.Graphics {
  target: ReticleTarget;
  tween: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene) {
    super(scene);

    this.setScrollFactor(0);
    this.setDepth(90000);
    this.draw();
  }

  reset(target: ReticleTarget) {
    this.target = target;
    this.setActive(true);
    this.setVisible(true);

    if (this.tween) {
      this.tween.stop();
      this.tween.destroy();
    }

    this.setAlpha(0);
    this.setScale(2);

    this.tween = this.scene.tweens.add({
      targets: this,
      alpha: { from: 0, to: 0.75 },
      scale: { from: 2, to: 1 },
      duration: 500,
      ease: 'Quad.In'
    });
  }

  draw() {
    const radius = 30;
    const thickness = 2;

    this.clear();
    this.lineStyle(thickness, 0xFFFFFF, 1);

    this.beginPath();
    this.arc(0, 0, radius, 0, Math.PI * 2, false);
    this.strokePath();
  }
}
