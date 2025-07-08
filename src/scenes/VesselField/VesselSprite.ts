import Phaser from 'phaser';
import { VesselEntity } from './types';

export class VesselSprite extends Phaser.GameObjects.Container {
  entity: VesselEntity;
  blur: Phaser.GameObjects.Image;
  base: Phaser.GameObjects.Image;
  highlight: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  icon: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    super(scene);

    this.blur = scene.add.image(0, 0, 'vessel_blur');
    this.base = scene.add.image(0, 0, 'vessel_base');
    this.highlight = scene.add.image(0, 0, 'vessel_highlight');
    this.glow = scene.add.image(0, 0, 'vessel_glow');
    this.icon = scene.add.image(0, -3, 'lock');

    this.add(this.blur);
    this.add(this.base);
    this.add(this.highlight);
    this.add(this.glow);
    this.add(this.icon);

    this.setSize(this.base.width, this.base.height);
    this.setScrollFactor(0);
  }

  update(
    params: {
      color: number
      resonance: number
      resonanceScale: number
      interactionFactor: number
      locked?: boolean
      scale: number
      alpha?: number
      depth?: number
    }
  ) {
    const { color, resonance, resonanceScale, interactionFactor, locked, alpha = 1, depth = 1 } = params;

    const resonanceScaleFactor = 1 + resonanceScale * resonance;
    const scale = params.scale * resonanceScaleFactor;

    const baseAlpha = Math.pow(alpha, 2.5);

    const c = Phaser.Display.Color.ValueToColor(color);

    this.blur
      .setTint(c.clone().lighten((1 - resonance) * 100).color)
      .setAlpha((1 - alpha) * Math.pow(alpha, .5));

    this.base
      .setTint(c.clone().saturate(interactionFactor * 25).color)
      .setAlpha(baseAlpha * (0.1 + resonance * 0.9));

    this.highlight
      .setAlpha(baseAlpha * (0.5 + resonance * 0.5));

    this.glow
      //.setTint(c.clone().lighten(50).color)
      .setAlpha(baseAlpha * interactionFactor * 0.6);

    this.icon.setAlpha(locked ? baseAlpha : 0);

    this
      .setDepth(depth)
      .setScale(scale)
      .setVisible(true)
      .setActive(true);
  }
}
