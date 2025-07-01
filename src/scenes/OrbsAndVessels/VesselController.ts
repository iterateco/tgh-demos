import Phaser from 'phaser';
import { SceneController } from './SceneController';
import { FEELING_NAMES, FieldEntity, VESSEL_VARIANTS, VesselEntity } from './types';

export class VesselController extends SceneController {
  entities: VesselEntity[] = [];
  sprites!: Phaser.GameObjects.Group;

  attunementScale = 1;

  constructor(scene: Phaser.Scene) {
    super(scene);

    this.createVesselEntities();

    this.scene.tweens.add({
      targets: this,
      attunementScale: { from: -0.1, to: 0.1 },
      ease: 'Sine.easeInOut',
      duration: 300,
      yoyo: true,
      repeat: -1,
      delay: 0,
      hold: 100
    });

    this.sprites = this.scene.add.group({
      classType: Vessel,
      createCallback: (sprite: Vessel) => this.initSprite(sprite)
    });
  }

  private createVesselEntities() {
    for (let i = 0; i < 300; i++) {
      const attributes: { [name: string]: number } = {};
      for (const name of FEELING_NAMES) {
        attributes[name] = Phaser.Math.RND.frac();
      }

      // const feelingNames = Phaser.Math.RND.shuffle(FEELING_NAMES.slice()).slice(0, 3);
      // const values = feelingNames.map(() => Phaser.Math.RND.frac());
      // const normalized = values.map(v => v / values.reduce((sum, val) => sum + val, 0));

      // feelingNames.forEach((name, i) => {
      //   attributes[name] = normalized[i];
      // });

      this.entities.push({
        id: i,
        type: 'vessel',
        variant: Phaser.Math.RND.integerInRange(0, VESSEL_VARIANTS.length - 1),
        // r: (Phaser.Math.RND.frac() * 0.6 + 0.4) * 150,
        r: 120,
        drift: new Phaser.Math.Vector2(),
        vel: new Phaser.Math.Vector2(),
        offset: new Phaser.Math.Vector2(),
        targetAttunement: 0,
        attunement: 0,
        locked: Phaser.Math.RND.frac() > 0.8,
        attributes,
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

    const attunementDiff = entity.targetAttunement - entity.attunement;
    const attunementInc = 0.0004 * delta;

    if (attunementDiff !== 0) {
      if (Math.abs(attunementDiff) < attunementInc) {
        entity.attunement = entity.targetAttunement;
      } else {
        const attunementDir = attunementDiff > 0 ? 1 : -1;
        entity.attunement += attunementInc * attunementDir;
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
    const { variant, attunement, offset } = entity;
    const { color } = VESSEL_VARIANTS[variant];
    const sprite = (this.sprites.get() as Vessel);

    const x = params.x + offset.x * params.scale;
    const y = params.y + offset.y * params.scale;

    const interactionThreshold = 0.75;
    let interactionFactor = 0;

    if (attunement <= interactionThreshold) {
      interactionFactor = 0;
    } else {
      interactionFactor = (attunement - interactionThreshold) * 1 / (1 - interactionThreshold);
    }

    const attunementScaleFactor = 1 + this.attunementScale * attunement;
    const scale = params.scale * attunementScaleFactor;

    const baseAlpha = Math.pow(alpha, 2.5);

    sprite.blur
      .setTint(color.clone().lighten((1 - attunement) * 100).color)
      .setAlpha((1 - alpha) * Math.pow(alpha, .5));

    sprite.base
      .setTint(color.clone().saturate(interactionFactor * 25).color)
      .setAlpha(baseAlpha * (0.1 + attunement * 0.9));

    sprite.highlight
      .setAlpha(baseAlpha * (0.5 + attunement * 0.5));

    sprite.glow
      .setTint(color.clone().lighten(50).color)
      .setAlpha(baseAlpha * interactionFactor);

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
