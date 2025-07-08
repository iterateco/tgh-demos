import Phaser from 'phaser';
import { OrbEntity } from './types';

export class OrbSprite extends Phaser.GameObjects.Container {
  entity: OrbEntity;
  blur: Phaser.GameObjects.Image;
  nebula: Phaser.GameObjects.Image;
  burst: Phaser.GameObjects.Image;
  trail: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene) {
    super(scene);

    this.nebula = scene.add.image(0, 0, 'nebula');
    this.add(this.nebula);

    this.burst = scene.add.image(0, 0, 'burst');
    this.add(this.burst);

    this.setSize(this.burst.width, this.burst.height);
    this.setScrollFactor(0);

    this.trail = scene.add.particles(0, 0, 'nebula', {
      speed: 2,
      lifespan: 500,
      scale: { start: 0.25, end: 0 },
      alpha: { start: 0.25, end: 0 },
      // rotate: { start: 0, end: 120 },
      frequency: 50,
      maxAliveParticles: 10,
      follow: this
    });
    this.trail.setScrollFactor(0);
  }

  update(
    params: {
      color: number
      transitionFactor?: number
      scale: number
      alpha?: number
      depth?: number
    }
  ) {
    const { color, alpha = 1, depth = 1, transitionFactor = 1 } = params;
    const scale = params.scale * transitionFactor;

    this.nebula
      .setTint(color)
      .setAlpha(alpha * 0.75);

    this.burst
      .setAlpha(Math.pow(alpha, 2.5));

    this
      .setDepth(depth)
      .setScale(scale)
      .setVisible(true)
      .setActive(true);

    this.trail
      .setDepth(depth - 1)
      .setParticleTint(color)
      .setAlpha(0.75 * alpha * transitionFactor)
      .setVisible(true)
      .setActive(true);

    return this;
  }
}
