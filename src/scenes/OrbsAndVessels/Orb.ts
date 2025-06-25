import Phaser from 'phaser';
import { EntityTextureManager } from './EntityTextureManager';
import { EntityData } from './types';

export class Orb extends Phaser.GameObjects.Container {
  textureManager!: EntityTextureManager;
  entity!: EntityData;
  blur: Phaser.GameObjects.Image;
  primary: Phaser.GameObjects.Image;
  burst: Phaser.GameObjects.Image;

  init(textureManager: EntityTextureManager) {
    this.textureManager = textureManager;
    this.blur = this.scene.add.sprite(0, 0, textureManager.orbAtlas.key);
    this.primary = this.scene.add.sprite(0, 0, textureManager.orbAtlas.key);
    this.burst = this.scene.add.sprite(0, 0, 'orb_burst').setScale(1.15);

    this.add(this.blur);
    this.add(this.primary);
    this.add(this.burst);

    this.setSize(this.primary.width, this.primary.height);
    this.setScrollFactor(0);
    this.setInteractive();
  }

  reset(
    params: {
      entity: any
      x: number
      y: number
      scale: number
      alpha: number
      blur: number
      rotation: number
    },
    depth: number
  ) {
    const { entity, x, y, alpha, blur, rotation } = params;
    const { variant, transitionFactor } = entity;
    const scale = params.scale * transitionFactor;

    this.textureManager.prepareOrb(variant);

    const primaryAlpha = Math.pow(alpha, 2.5);

    this.blur
      .setFrame(this.textureManager.orbAtlas.getFrameName('blur', variant))
      .setAlpha(blur * Math.pow(alpha, .5));

    this.primary
      .setFrame(this.textureManager.orbAtlas.getFrameName('primary', variant))
      .setAlpha(primaryAlpha)
      .setRotation(rotation);

    this.burst.setAlpha(primaryAlpha);

    this
      .setPosition(x, y)
      .setDepth(depth)
      .setScale(scale)
      .setVisible(true)
      .setActive(true);

    if (alpha > 0.7) {
      const hitAreaW = this.primary.width * 0.75;
      const hitAreaOffset = (this.width - hitAreaW) / 2;
      this.setInteractive(new Phaser.Geom.Rectangle(hitAreaOffset, hitAreaOffset, hitAreaW, hitAreaW), Phaser.Geom.Rectangle.Contains);
    } else {
      this.disableInteractive();
    }

    this.entity = entity;
  }
}
