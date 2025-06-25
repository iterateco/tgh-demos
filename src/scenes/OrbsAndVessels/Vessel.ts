import Phaser from 'phaser';
import { EntityTextureManager } from './EntityTextureManager';
import { VesselData } from './types';

export class Vessel extends Phaser.GameObjects.Container {
  textureManager: EntityTextureManager;
  entity: VesselData;
  blur: Phaser.GameObjects.Image;
  base: Phaser.GameObjects.Image;
  primary: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  lock: Phaser.GameObjects.Image;

  init(textureManager: EntityTextureManager) {
    this.textureManager = textureManager;
    this.blur = this.scene.add.sprite(0, 0, textureManager.vesselAtlas.key);
    this.base = this.scene.add.sprite(0, 0, 'vessel_overlay');
    this.primary = this.scene.add.sprite(0, 0, textureManager.vesselAtlas.key);
    this.glow = this.scene.add.sprite(0, 0, 'vessel_glow');
    this.lock = this.scene.add.sprite(0, -3, 'lock');

    this.add(this.blur);
    this.add(this.base);
    this.add(this.primary);
    this.add(this.glow);
    this.add(this.lock);

    this.setSize(this.base.width, this.base.height);
    this.setScrollFactor(0);
    this.setInteractive();
  }

  reset(
    params: {
      entity: VesselData,
      x: number,
      y: number,
      scale: number,
      alpha: number,
      blur: number
    },
    depth: number
  ) {
    const { entity, x, y, alpha, blur } = params;
    const { variant, transitionFactor, attunement } = entity;
    const scale = params.scale * transitionFactor;
    // const { color } = VESSEL_VARIANTS[variant];

    this.textureManager.prepareVessel(variant);

    const primaryAlpha = Math.pow(alpha, 2.5);

    this.blur
      .setFrame(this.textureManager.vesselAtlas.getFrameName('blur', variant))
      .setAlpha(blur * Math.pow(alpha, .5));

    this.base
      //.setTint(Phaser.Display.Color.ValueToColor(color).desaturate(50).color)
      .setAlpha(primaryAlpha * 0.5);

    this.primary
      .setFrame(this.textureManager.vesselAtlas.getFrameName('primary', variant))
      .setAlpha(primaryAlpha * (0.35 + attunement * 0.65));

    this.glow.setAlpha(primaryAlpha * Math.pow(attunement, 2));

    this.lock.setAlpha(entity.locked ? primaryAlpha : 0);

    this
      .setPosition(x, y)
      .setDepth(depth)
      .setScale(scale)
      .setVisible(true)
      .setActive(true);

    this.entity = entity;
  }
}
