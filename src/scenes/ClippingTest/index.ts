import * as Phaser from 'phaser';
import { Entity, Scrollable } from '../../types';
import { BaseScene } from '../BaseScene';
import { Orb, OrbController } from './OrbController';
import { ToroidalPoissonDisc3D } from './ToroidalPoissonDisc3D';
import TrailFX from './TrailFX';
import { FieldEntity, ORB_VARIANTS, OrbEntity, VesselEntity } from './types';
import { VesselController } from './VesselController';

const BG_SIZE = { width: 1024, height: 768 };

export class ClippingTest extends BaseScene {
  cameraProps = {
    fov: 500,
    far: 3000,
    z: 0,
    thrust: 20,
    velocity: new Phaser.Math.Vector3(0, 0, 0),
    damping: 0.95,
    dragAccel: 10
  };

  prevPointerPos?: Phaser.Math.Vector2;

  sky!: Phaser.GameObjects.Image;
  clouds!: (Entity<Phaser.GameObjects.TileSprite> & Scrollable & { accel: number })[];
  background!: (Entity<Phaser.GameObjects.TileSprite> & Scrollable)[];

  vesselController: VesselController;
  orbController: OrbController;

  collectedOrbs: FieldEntity[] = [];

  entityField!: ToroidalPoissonDisc3D<FieldEntity>;

  fpsText!: Phaser.GameObjects.Text;

  constructor() {
    super('clipping-test');
  }

  preload() {
    super.preload();
    this.load.image('sky', 'textures/sky.png');
    this.load.image('stars_1', 'textures/stars_1.png');
    this.load.image('stars_2', 'textures/stars_2.png');
    this.load.image('clouds_1', 'textures/clouds_1.png');
    this.load.image('clouds_2', 'textures/clouds_2.png');
    this.load.image('vessel_blur', 'textures/heart_1_glass_blur.png');
    this.load.image('vessel_base', 'textures/heart_1_base.png');
    this.load.image('vessel_highlight', 'textures/heart_1_glass.png');
    this.load.image('vessel_glow', 'textures/heart_1_glow.png');
    this.load.image('lock', 'textures/lock_1.png');
    this.load.image('orb_cloud', 'textures/orb_1_cloud.png');
    this.load.image('orb_burst', 'textures/orb_1_burst.png');
    this.load.image('orb_blur', 'textures/orb_1_blur.png');
  }

  create() {
    const renderer = this.sys.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    renderer.pipelines.addPostPipeline('trail', TrailFX);

    this.vesselController = new VesselController(this);
    this.orbController = new OrbController(this);

    // this.collectedOrbs = [
    //   { variant: 1 },
    //   { variant: 1 },
    //   { variant: 1 }
    // ] as any
    // this.updateVesselAttunements();

    const camera = this.cameras.main;
    camera.centerOn(0, 0);

    this.createBackground();
    this.createEntityField();
    this.createStats();

    this.scale.on('resize', this.resize, this);
    this.resize();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, objects: any) => {
      this.prevPointerPos = pointer.position.clone();

      const object = objects[0];
      if (!object) return;

      const entity = object.entity;
      if (!entity) return;
      if (entity.type !== 'orb') return;
      if (this.collectedOrbs.find(o => o === entity)) return;

      this.collectedOrbs.push(entity);

      this.tweens.add({
        targets: object.entity,
        transitionFactor: 0,
        ease: 'Power2',
        duration: 300
      });

      if (this.collectedOrbs.length > 3) {
        const toRestore = this.collectedOrbs[0];
        this.tweens.add({
          targets: toRestore,
          transitionFactor: 1,
          ease: 'Power2',
          duration: 300
        });
        this.collectedOrbs = this.collectedOrbs.slice(1);
      }

      this.updateVesselAttunements();
    });
  }

  createBackground() {
    this.sky = this.add.image(0, 0, 'sky')
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.clouds = [

    ];

    this.background = [
      {
        sprite: this.add.tileSprite(0, 0, 0, 0, 'stars_1')
          .setScale(0.5)
          .setScrollFactor(0),
        scrollRatio: 0.13
      },
      {
        sprite: this.add.tileSprite(0, 0, 0, 0, 'stars_2')
          .setScale(0.5)
          .setScrollFactor(0),
        scrollRatio: 0.14
      },
      ...this.clouds
    ];
  }

  createEntityField() {
    const worldWidth = 5000;
    const worldHeight = 5000;
    const worldDepth = 20000;

    this.entityField = new ToroidalPoissonDisc3D<FieldEntity>(worldWidth, worldHeight, worldDepth, 1000);
    this.entityField.minPointDist = 700;
  }

  createStats() {
    this.fpsText = this.add.text(10, 10, 'FPS: 0', {
      fontSize: 12,
      color: '#ffffff',
    })
      .setAlpha(0.75)
      .setScrollFactor(0);
  }

  update(time: number, delta: number) {
    this.vesselController.update(time, delta);
    this.orbController.update(time, delta);

    const dt = delta / 1000;
    const { width, height } = this.scale;
    const camera = this.cameras.main;
    const { cameraProps } = this;
    const pointer = this.input.activePointer;
    const { worldWidth, worldHeight, worldDepth } = this.entityField;
    const { position } = pointer;

    if (pointer.isDown) {
      const prevPosition = this.prevPointerPos;
      cameraProps.velocity.x -= (position.x - prevPosition.x) * cameraProps.dragAccel;
      cameraProps.velocity.y -= (position.y - prevPosition.y) * cameraProps.dragAccel;
      this.prevPointerPos = position.clone();
    }

    cameraProps.velocity.z += cameraProps.thrust;
    cameraProps.velocity.scale(cameraProps.damping);

    camera.scrollX += cameraProps.velocity.x * dt;
    camera.scrollY += cameraProps.velocity.y * dt;
    cameraProps.z = (cameraProps.z + cameraProps.velocity.z * dt) % worldDepth;

    const cameraX = Phaser.Math.Wrap(camera.scrollX + worldWidth / 2, 0, worldWidth);
    const cameraY = Phaser.Math.Wrap(camera.scrollY + worldHeight / 2, 0, worldHeight);
    const cameraZ = Phaser.Math.Wrap(cameraProps.z + worldDepth / 2, 0, worldDepth);

    for (const ent of this.background) {
      ent.sprite.setTilePosition(camera.scrollX * ent.scrollRatio, camera.scrollY * ent.scrollRatio);
    }

    for (const cloud of this.clouds) {
      cloud.sprite.setTilePosition(cloud.sprite.tilePositionX + time * cloud.accel, cloud.sprite.tilePositionY);
    }

    const circles = this.entityField.generate({
      width,
      height,
      cameraX,
      cameraY,
      cameraZ,
      far: cameraProps.far,
      fov: cameraProps.fov,
      getEntity: (seed) => {
        return this.orbController.createEntity(seed);
      }
    });

    const nearFadeStart = 0;
    const nearFadeEnd = 200;
    const farFadeStart = 1000;
    const farFadeEnd = cameraProps.far;

    const renderItems = [];
    const renderedEntities: Set<FieldEntity> = new Set();
    const dy = 0;
    const margin = 100;

    for (const c of circles) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          const wx = c.x + dx * worldWidth;
          const wy = c.y + dy * worldHeight;
          const wz = c.z + dz * worldDepth;

          const dzFromCamera = wz - cameraZ;
          if (dzFromCamera < 0 || dzFromCamera > cameraProps.far) continue;

          const { entity } = c;
          const { x, y, scale } = this.project3DTo2D(wx, wy, wz, cameraX, cameraY, cameraZ);
          const r = entity.r * scale;

          if (
            x + r >= -margin && x - r <= width + margin &&
            y + r >= -margin && y - r <= height + margin
          ) {
            let alpha = 1;

            if (dzFromCamera < nearFadeStart || dzFromCamera > farFadeEnd) {
              alpha = 0;
            } else if (dzFromCamera < nearFadeEnd) {
              // Near
              const t = (dzFromCamera - nearFadeStart) / (nearFadeEnd - nearFadeStart);
              alpha = Math.pow(t, 2); // ease-in
            } else if (dzFromCamera > farFadeStart) {
              // Far
              const t = (dzFromCamera - farFadeStart) / (farFadeEnd - farFadeStart);
              alpha = Math.pow(1 - t, 1.5); // ease-out
            } else {
              // Fully visible between nearFadeEnd and farFadeStart
              alpha = 1;
            }

            renderedEntities.add(entity);

            renderItems.push({
              entity,
              x,
              y,
              scale: r * .0075,
              alpha,
              depth: 100000 - wz
            });
          }
        }
      }
    }

    for (const entity of renderedEntities) {
      if (entity.type === 'vessel') {
        this.vesselController.updateEntity(entity as VesselEntity, time, delta);
      } else {
        this.orbController.updateEntity(entity as OrbEntity, time, delta);
      }
    }

    for (const sprite of (this.vesselController.sprites.getChildren() as Phaser.GameObjects.Image[])) {
      sprite.setActive(false);
      sprite.setVisible(false);
    }

    for (const sprite of (this.orbController.sprites.getChildren() as Orb[])) {
      sprite.setActive(false);
      sprite.setVisible(false);
      sprite.trail.setActive(false);
      sprite.trail.setVisible(false);
    }

    for (const item of renderItems) {
      if (item.entity.type === 'vessel') {
        //this.vesselController.drawSprite(item);
      } else {
        this.orbController.drawSprite(item);
      }
    }

    let text = `FPS: ${this.game.loop.actualFps}`;
    // text += `\nEntities: ${renderItems.length}`;
    text += `\nActive Orbs: ${this.orbController.sprites.countActive(true)}`;
    text += '\nCollected Orbs:';
    this.collectedOrbs.forEach(orb => {
      const variantProps = ORB_VARIANTS[orb.variant];
      text += `\n ${variantProps.name}`;
    });
    this.fpsText.setText(text);
  }

  updateVesselAttunements() {
    for (const vessel of this.vesselController.entities) {
      if (vessel.locked) {
        vessel.attunement = 0;
        continue;
      }

      const attrs = vessel.attributes;
      let attunement = 0;
      for (const orb of this.collectedOrbs) {
        const variantProps = ORB_VARIANTS[orb.variant];
        if (attrs[variantProps.name]) {
          attunement += attrs[variantProps.name];
        }
      }
      vessel.targetAttunement = Math.pow(attunement / 3, 2);
    };
  }

  project3DTo2D(x: number, y: number, z: number, cameraX: number, cameraY: number, cameraZ: number) {
    const { fov } = this.cameraProps;
    const scale = fov / (z - cameraZ + fov);
    return {
      x: (x - cameraX) * scale + this.scale.width / 2,
      y: (y - cameraY) * scale + this.scale.height / 2,
      scale
    };
  }

  resize() {
    const { width, height } = this.scale;
    const scaleX = width / BG_SIZE.width;
    const scaleY = height / BG_SIZE.height;
    const scale = Math.max(scaleX, scaleY);
    const camera = this.cameras.main;
    const { worldHeight } = this.entityField;

    this.sky.setScale(scale);
    this.sky.setPosition(width / 2, height / 2);

    for (const ent of this.background) {
      ent.sprite.setSize(width * 2, height * 2);
      ent.sprite.setOrigin(0, 0);
    }

    camera.setBounds(
      -Infinity,
      -(worldHeight / 2 - height),
      Infinity,
      (worldHeight - height),
    );
  }
}
