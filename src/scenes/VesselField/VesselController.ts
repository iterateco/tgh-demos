import Phaser from 'phaser';
import DataProvider from './DataProvider';
import { SceneController } from './SceneController';
import { FieldEntity, VesselEntity } from './types';
import { VesselSprite } from './VesselSprite';

export class VesselController extends SceneController {
  entities: VesselEntity[] = [];
  sprites!: Phaser.GameObjects.Group;

  resonanceScale = 1;

  constructor(scene: Phaser.Scene, dataProvider: DataProvider) {
    super(scene, dataProvider);

    this.createVesselEntities();

    scene.tweens.add({
      targets: this,
      resonanceScale: { from: -0.1, to: 0.1 },
      ease: 'Sine.easeInOut',
      duration: 300,
      yoyo: true,
      repeat: -1,
      delay: 0,
      hold: 100
    });

    this.sprites = scene.add.group({
      classType: VesselSprite
    });
  }

  private createVesselEntities() {
    for (const post of this.dataProvider.posts) {
      const archetype = post.emotional_archetypes[0];
      if (!archetype) continue;
      const color = archetype.color;

      this.entities.push({
        type: 'vessel',
        post,
        r: 120,
        drift: new Phaser.Math.Vector2(),
        vel: new Phaser.Math.Vector2(),
        offset: new Phaser.Math.Vector2(),
        targetResonance: 0,
        resonance: 0,
        color
      });
    }
  }

  // update(time: number, delta: number) {

  // }

  updateEntity(entity: VesselEntity, _time: number, delta: number) {
    const { drift, vel, offset } = entity;
    const intensity = 0;

    // Slowly change drift vector (fake Perlin noise)
    drift.x += (Math.random() - 0.5) * (0.002 + intensity * 0.05);
    drift.y += (Math.random() - 0.5) * (0.002 + intensity * 0.05);
    drift.x *= 0.98;
    drift.y *= 0.98;

    // Apply drift to velocity
    vel.x += drift.x;
    vel.y += drift.y;

    // Apply restoring force (like a spring to the origin)
    const restoringStrength = 0.0008 + (0.1 * intensity);
    vel.x += -offset.x * restoringStrength;
    vel.y += -offset.y * restoringStrength;

    // Apply friction
    vel.x *= 0.99;
    vel.y *= 0.99;

    // Update position
    offset.x += vel.x;
    offset.y += vel.y;

    const resonanceDiff = entity.targetResonance - entity.resonance;
    const resonanceInc = 0.0004 * delta;

    if (resonanceDiff !== 0) {
      if (Math.abs(resonanceDiff) < resonanceInc) {
        entity.resonance = entity.targetResonance;
      } else {
        const resonanceDir = resonanceDiff > 0 ? 1 : -1;
        entity.resonance += resonanceInc * resonanceDir;
      }
    }
  }

  drawSprite(
    params: {
      entity: FieldEntity,
      x: number,
      y: number,
      scale: number,
      alpha: number,
      depth: number
    }
  ) {
    const { alpha, scale, depth } = params;
    const entity = params.entity as VesselEntity;
    const { post, color, resonance, offset } = entity;
    const sprite = (this.sprites.get() as VesselSprite);

    const x = params.x + offset.x * params.scale;
    const y = params.y + offset.y * params.scale;

    const interactionThreshold = 0.75;
    let interactionFactor = 0;

    if (resonance <= interactionThreshold) {
      interactionFactor = 0;
    } else {
      interactionFactor = (resonance - interactionThreshold) * 1 / (1 - interactionThreshold);
    }

    sprite.update({
      color,
      resonance,
      resonanceScale: this.resonanceScale,
      interactionFactor,
      locked: post.has_response,
      scale,
      alpha,
      depth
    });

    sprite.setPosition(x, y);

    if (alpha > 0.5 && interactionFactor > 0) {
      sprite.setInteractive();
    } else {
      sprite.disableInteractive();
    }

    sprite.entity = entity;
  }
}
