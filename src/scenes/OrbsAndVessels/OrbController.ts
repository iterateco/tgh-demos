import Phaser from 'phaser';
import { SceneController } from './SceneController';
import { TextureAtlas } from './TextureAtlas';
import { FieldEntity, ORB_VARIANTS, OrbEntity } from './types';

const MOVE_CONFIG = {
  x: {
    freq: [0.4, 0.66, 0.78],
    amp: [0.8, 0.24, 0.18],
    phase: [0., 45., 55.],
  },
  y: {
    freq: [0.415, 0.61, 0.82],
    amp: [0.72, 0.28, 0.15],
    phase: [90, 120, 10],
  },
  midPoint: new Phaser.Math.Vector2(0.35, 0.15),
  scale: new Phaser.Math.Vector2(400, 400)
};

export class OrbController extends SceneController {
  entities: FieldEntity[] = [];
  orbRotation = 0;

  sprites!: Phaser.GameObjects.Group;

  textureAtlas = new TextureAtlas(this.scene, 'orb_atlas', 250, {
    primary: ORB_VARIANTS.length,
    blur: ORB_VARIANTS.length
  });

  constructor(scene: Phaser.Scene) {
    super(scene);

    this.sprites = scene.add.group({
      classType: Orb,
      createCallback: (sprite: Orb) => this.initSprite(sprite)
    });
  }

  update(_time: number, _delta: number) {
    this.orbRotation += 0.005;
  }

  createEntity() {
    const orb: OrbEntity = {
      type: 'orb',
      variant: Phaser.Math.RND.integerInRange(0, ORB_VARIANTS.length - 1),
      // r: (Phaser.Math.RND.frac() * 0.6 + 0.4) * 150,
      r: 120,
      offset: new Phaser.Math.Vector2(),
      seed: Phaser.Math.RND.frac(),
      transitionFactor: 1,
    };
    this.entities.push(orb);
    return orb;
  }

  updateEntity(entity: OrbEntity, time: number, _delta: number) {
    const t = (time + entity.seed * 9999) * 0.0005;
    const { x, y, midPoint, scale } = MOVE_CONFIG;
    const ppos = new Phaser.Math.Vector2(
      harms(x.freq, x.amp, x.phase, t),
      harms(y.freq, y.amp, y.phase, t)
    )
      .add(midPoint)
      .multiply(scale);

    entity.offset = ppos;
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
    const { alpha, blur, depth } = params;
    const entity = params.entity as OrbEntity;
    const { variant, offset } = entity;
    const x = params.x + offset.x * params.scale;
    const y = params.y + offset.y * params.scale;
    const scale = params.scale * entity.transitionFactor;
    const sprite = (this.sprites.get() as Orb);

    this.prepareTextureAtlas(variant);

    const primaryAlpha = Math.pow(alpha, 2.5);

    sprite.blur
      .setFrame(this.textureAtlas.getFrameName('blur', variant))
      .setAlpha(blur * Math.pow(alpha, .5));

    sprite.primary
      .setFrame(this.textureAtlas.getFrameName('primary', variant))
      .setAlpha(primaryAlpha)
      .setRotation(this.orbRotation);

    sprite.burst.setAlpha(primaryAlpha);

    sprite
      .setPosition(x, y)
      .setDepth(depth)
      .setScale(scale)
      .setVisible(true)
      .setActive(true);

    sprite.entity = entity;
  }

  private initSprite(sprite: Orb) {
    const { scene } = this;

    sprite.blur = scene.add.sprite(0, 0, this.textureAtlas.key);
    sprite.primary = scene.add.sprite(0, 0, this.textureAtlas.key);
    sprite.burst = scene.add.sprite(0, 0, 'orb_burst').setScale(1.15);

    sprite.add(sprite.blur);
    sprite.add(sprite.primary);
    sprite.add(sprite.burst);

    sprite.setSize(sprite.primary.width, sprite.primary.height);
    sprite.setScrollFactor(0);
    sprite.setInteractive();

    sprite.postFX.addBloom(0xffffff, 4, 2, 1, 3);
  }

  private prepareTextureAtlas(variant: number) {
    if (this.textureAtlas.hasFrame('primary', variant)) return;

    const { color } = ORB_VARIANTS[variant];
    this.textureAtlas.drawColorizedFrame('primary', variant, 'orb_cloud', color);
    this.textureAtlas.drawColorizedFrame('blur', variant, 'orb_blur', color);
  }
}

class Orb extends Phaser.GameObjects.Container {
  entity: FieldEntity;
  blur: Phaser.GameObjects.Image;
  primary: Phaser.GameObjects.Image;
  burst: Phaser.GameObjects.Image;
}

function harms(freq: number[], amp: number[], phase: number[], time: number) {
  const twopi = 6.28319;
  let val = 0;
  for (let h = 0; h < 3; h++) {
    val += amp[h] * Math.cos(time * freq[h] * twopi + phase[h] / 360 * twopi);
  }
  return (1 + val) / 2;
}
