import Phaser from 'phaser';
import { SceneController } from './SceneController';
import { TextureAtlas } from './TextureAtlas';
import { FEELING_NAMES, FieldEntity, VESSEL_VARIANTS, VesselEntity } from './types';

export class VesselController extends SceneController {
  entities: VesselEntity[] = [];
  sprites!: Phaser.GameObjects.Group;

  textureAtlas = new TextureAtlas(this.scene, 'vessel_atlas', 250, {
    primary: VESSEL_VARIANTS.length,
    blur: VESSEL_VARIANTS.length
  });

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

  // update(time: number, delta: number) {

  // }

  updateEntity(entity: VesselEntity, _time: number, _delta: number) {
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
  }

  drawSprite(
    params: {
      entity: FieldEntity,
      x: number,
      y: number,
      scale: number,
      alpha: number,
      blur: number,
      depth: number
    }
  ) {
    const entity = params.entity as VesselEntity;
    const { variant, attunement, offset } = entity;
    const sprite = (this.sprites.get() as Vessel);
    const { alpha, blur, depth } = params;
    const x = params.x + offset.x * params.scale;
    const y = params.y + offset.y * params.scale;

    const attunementScaleFactor = 1 + this.attunementScale * attunement;
    const scale = params.scale * attunementScaleFactor;

    this.prepareTextureAtlas(variant);

    const primaryAlpha = Math.pow(alpha, 2.5);
    const blurAlpha = blur * Math.pow(alpha, .5);

    sprite.glass
      .setAlpha(primaryAlpha * (1 - attunement));

    sprite.glassBlur
      .setAlpha(blurAlpha);

    sprite.blur
      .setFrame(this.textureAtlas.getFrameName('blur', variant))
      .setAlpha(blurAlpha * attunement);

    sprite.primary
      .setFrame(this.textureAtlas.getFrameName('primary', variant))
      .setAlpha(primaryAlpha * attunement);

    sprite.glow.setAlpha(primaryAlpha * Math.pow(attunement, 2));

    sprite.lock.setAlpha(entity.locked ? primaryAlpha : 0);

    sprite
      .setPosition(x, y)
      .setDepth(depth)
      .setScale(scale)
      .setVisible(true)
      .setActive(true);

    sprite.entity = entity;
  }

  private createVesselEntities() {
    for (let i = 0; i < 1000; i++) {
      const attributes: { [name: string]: number } = {};
      for (const attrName of FEELING_NAMES) {
        attributes[attrName] = Phaser.Math.RND.frac();
      }

      this.entities.push({
        type: 'vessel',
        variant: Phaser.Math.RND.integerInRange(0, VESSEL_VARIANTS.length - 1),
        // r: (Phaser.Math.RND.frac() * 0.6 + 0.4) * 150,
        r: 120,
        drift: new Phaser.Math.Vector2(),
        vel: new Phaser.Math.Vector2(),
        offset: new Phaser.Math.Vector2(),
        attunement: 0,
        locked: Phaser.Math.RND.frac() > 0.8,
        attributes,
      });
    }
  }

  private initSprite(sprite: Vessel) {
    const { scene } = this;

    sprite.glassBlur = scene.add.sprite(0, 0, 'vessel_glass_blur');
    sprite.glass = scene.add.sprite(0, 0, 'vessel_glass');
    sprite.blur = scene.add.sprite(0, 0, this.textureAtlas.key);
    sprite.primary = scene.add.sprite(0, 0, this.textureAtlas.key);
    sprite.glow = scene.add.sprite(0, 0, 'vessel_glow');
    sprite.lock = scene.add.sprite(0, -3, 'lock');

    sprite.add(sprite.glassBlur);
    sprite.add(sprite.glass);
    sprite.add(sprite.blur);
    sprite.add(sprite.primary);
    sprite.add(sprite.glow);
    sprite.add(sprite.lock);

    sprite.setSize(sprite.primary.width, sprite.primary.height);
    sprite.setScrollFactor(0);
    sprite.setInteractive();
  }

  private prepareTextureAtlas(variant: number) {
    if (this.textureAtlas.hasFrame('primary', variant)) return;

    const { color } = VESSEL_VARIANTS[variant];
    this.textureAtlas.drawColorizedFrame('primary', variant, 'vessel', color);
    this.textureAtlas.drawColorizedFrame('blur', variant, 'vessel_blur', color);
  }
}

class Vessel extends Phaser.GameObjects.Container {
  entity: VesselEntity;
  glassBlur: Phaser.GameObjects.Image;
  glass: Phaser.GameObjects.Image;
  blur: Phaser.GameObjects.Image;
  primary: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  lock: Phaser.GameObjects.Image;
}
