import Phaser from 'phaser';
import { SceneController } from './SceneController';
import { EMOTION_KEYS, EMOTIONS, FieldEntity, VesselEntity } from './types';

export class VesselController extends SceneController {
  entities: VesselEntity[] = [];
  sprites!: Phaser.GameObjects.Group;

  resonanceScale = 1;

  constructor(scene: Phaser.Scene) {
    super(scene);

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
      classType: Vessel,
      createCallback: (sprite: Vessel) => this.initSprite(sprite)
    });
  }

  private createVesselEntities() {
    for (let i = 0; i < 300; i++) {
      this.entities.push({
        id: i,
        type: 'vessel',
        // r: (Phaser.Math.RND.frac() * 0.6 + 0.4) * 150,
        r: 120,
        drift: new Phaser.Math.Vector2(),
        vel: new Phaser.Math.Vector2(),
        offset: new Phaser.Math.Vector2(),
        targetResonance: 0,
        resonance: 0,
        locked: Phaser.Math.RND.frac() > 0.8,
        emotion: Phaser.Math.RND.pick(EMOTION_KEYS)
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

  private initSprite(sprite: Vessel) {
    const { scene } = this;

    sprite.blur = scene.add.image(0, 0, 'vessel_blur');
    sprite.base = scene.add.image(0, 0, 'vessel_base');
    sprite.highlight = scene.add.image(0, 0, 'vessel_highlight');
    sprite.glow = scene.add.image(0, 0, 'vessel_glow');
    sprite.icon = scene.add.image(0, -3, 'lock');

    sprite.add(sprite.blur);
    sprite.add(sprite.base);
    sprite.add(sprite.highlight);
    sprite.add(sprite.glow);
    sprite.add(sprite.icon);

    sprite.setSize(sprite.base.width, sprite.base.height);
    sprite.setScrollFactor(0);
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
    const { alpha, depth } = params;
    const entity = params.entity as VesselEntity;
    const { emotion, resonance, offset } = entity;
    const color = EMOTIONS[emotion];
    const sprite = (this.sprites.get() as Vessel);

    const x = params.x + offset.x * params.scale;
    const y = params.y + offset.y * params.scale;

    const interactionThreshold = 0.75;
    let interactionFactor = 0;

    if (resonance <= interactionThreshold) {
      interactionFactor = 0;
    } else {
      interactionFactor = (resonance - interactionThreshold) * 1 / (1 - interactionThreshold);
    }

    const resonanceScaleFactor = 1 + this.resonanceScale * resonance;
    const scale = params.scale * resonanceScaleFactor;

    const baseAlpha = Math.pow(alpha, 2.5);

    const c = Phaser.Display.Color.ValueToColor(color);

    sprite.blur
      .setTint(c.clone().lighten((1 - resonance) * 100).color)
      .setAlpha((1 - alpha) * Math.pow(alpha, .5));

    sprite.base
      .setTint(c.clone().saturate(interactionFactor * 25).color)
      .setAlpha(baseAlpha * (0.1 + resonance * 0.9));

    sprite.highlight
      .setAlpha(baseAlpha * (0.5 + resonance * 0.5));

    sprite.glow
      //.setTint(c.clone().lighten(50).color)
      .setAlpha(baseAlpha * interactionFactor * 0.6);

    sprite.icon.setAlpha(entity.locked ? baseAlpha : 0);

    sprite
      .setPosition(x, y)
      .setDepth(depth)
      .setScale(scale)
      .setVisible(true)
      .setActive(true);

    if (alpha > 0.5 && interactionFactor > 0) {
      sprite.setInteractive();
    } else {
      sprite.disableInteractive();
    }

    sprite.entity = entity;
  }
}

class Vessel extends Phaser.GameObjects.Container {
  entity: VesselEntity;
  blur: Phaser.GameObjects.Image;
  base: Phaser.GameObjects.Image;
  highlight: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  icon: Phaser.GameObjects.Image;
}
