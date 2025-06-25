import * as Phaser from 'phaser';
import { Entity, Scrollable } from '../../types';
import { BaseScene } from '../BaseScene';
import { EntityTextureManager } from './EntityTextureManager';
import { Orb } from './Orb';
import { ToroidalPoissonDisc3D } from './ToroidalPoissonDisc3D';
import { Vessel } from './Vessel';
import { EntityData, FEELING_NAMES, ORB_VARIANTS, VESSEL_VARIANTS, VesselData } from './types';

const BG_SIZE = { width: 1024, height: 768 };

export class OrbsAndVessels extends BaseScene {
  cameraProps = {
    fov: 500,
    far: 3000,
    z: 0,
    thrust: 20,
    velocity: new Phaser.Math.Vector3(0, 0, 0),
    damping: 0.95,
    dragAccel: 10
  };

  sky!: Phaser.GameObjects.Image;
  clouds!: (Entity<Phaser.GameObjects.TileSprite> & Scrollable & { accel: number })[];
  background!: (Entity<Phaser.GameObjects.TileSprite> & Scrollable)[];

  vessels: VesselData[] = [];
  orbs: EntityData[] = [];
  collectedOrbs: EntityData[] = [];

  vesselSprites!: Phaser.GameObjects.Group;
  vesselGlowSprites!: Phaser.GameObjects.Group;
  orbSprites!: Phaser.GameObjects.Group;
  entityField!: ToroidalPoissonDisc3D<EntityData>;

  attunementScale = 1;
  orbRotation = 0;

  entityTextureManager!: EntityTextureManager;

  fpsText!: Phaser.GameObjects.Text;

  constructor() {
    super('orbs-and-vessels');
  }

  preload() {
    super.preload();
    this.load.image('sky', 'sky.png');
    this.load.image('stars_1', 'stars_1.png');
    this.load.image('stars_2', 'stars_2.png');
    this.load.image('clouds_1', 'clouds_1.png');
    this.load.image('clouds_2', 'clouds_2.png');
    this.load.image('vessel', 'heart_1.png');
    this.load.image('vessel_blur', 'heart_1_blur.png');
    this.load.image('vessel_glow', 'heart_1_glow.png');
    this.load.image('vessel_overlay', 'heart_1_overlay.png');
    this.load.image('lock', 'lock_1.png');
    this.load.image('orb_cloud', 'orb_1_cloud.png');
    this.load.image('orb_burst', 'orb_1_burst.png');
    this.load.image('orb_blur', 'orb_1_blur.png');
  }

  create() {
    this.cameras.main.centerOn(0, 0);
    // this.cameras.main.setScroll(-9700, -9700);

    this.createBackground();
    this.createEntityField();
    this.createStats();

    this.entityTextureManager = new EntityTextureManager(this);

    this.vesselSprites = this.add.group({
      classType: Vessel,
      createCallback: (orb: Orb) => orb.init(this.entityTextureManager)
    });

    this.tweens.add({
      targets: this,
      attunementScale: { from: -0.125, to: 0.125 },
      ease: 'Sine.easeInOut',
      duration: 300,
      yoyo: true,
      repeat: -1,
      delay: 0,
      hold: 100
    });

    this.orbSprites = this.add.group({
      classType: Orb,
      createCallback: (orb: Orb) => orb.init(this.entityTextureManager)
    });

    this.scale.on('resize', this.resize, this);
    this.resize();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, objects: any) => {
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
      {
        sprite: this.add.tileSprite(0, 0, 0, 0, 'clouds_1')
          .setScrollFactor(0),
        accel: -0.01,
        scrollRatio: 0.16
      },
      {
        sprite: this.add.tileSprite(0, 0, 0, 0, 'clouds_2')
          .setScrollFactor(0),
        accel: 0.02,
        scrollRatio: 0.18
      }
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
    for (let i = 0; i < 1000; i++) {
      const attributes: { [name: string]: number } = {};
      for (const attrName of FEELING_NAMES) {
        attributes[attrName] = Phaser.Math.RND.frac();
      }

      this.vessels.push({
        type: 'vessel',
        variant: Phaser.Math.RND.integerInRange(0, VESSEL_VARIANTS.length - 1),
        // r: (Phaser.Math.RND.frac() * 0.6 + 0.4) * 150,
        r: 120,
        drift: new Phaser.Math.Vector2(),
        vel: new Phaser.Math.Vector2(),
        offset: new Phaser.Math.Vector2(),
        transitionFactor: 1,
        attunement: 0,
        updateTime: 0,
        locked: Phaser.Math.RND.frac() > 0.8,
        attributes,
      });
    }

    const worldWidth = 5000;
    const worldHeight = 5000;
    const worldDepth = 20000;

    this.entityField = new ToroidalPoissonDisc3D<EntityData>(worldWidth, worldHeight, worldDepth, 1000);
    this.entityField.minPointDist = 700;
  }

  drawEntity(
    params: {
      entity: EntityData,
      x: number,
      y: number,
      scale: number,
      alpha: number,
      blur: number
    },
    depth: number
  ) {
    if (params.entity.type === 'vessel') {
      const entity = params.entity as VesselData;
      const vessel = (this.vesselSprites.get() as Vessel);
      const { scale } = params;
      const scaleFactor = 1 + this.attunementScale * entity.attunement;
      vessel.reset({ ...params, entity, scale: scale * scaleFactor }, depth);
    } else {
      const orb = (this.orbSprites.get() as Orb);
      orb.reset({ ...params, rotation: this.orbRotation }, depth);
    }
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
    const dt = delta / 1000;
    const { width, height } = this.scale;
    const camera = this.cameras.main;
    const { cameraProps } = this;
    const pointer = this.input.activePointer;
    const { worldWidth, worldHeight, worldDepth } = this.entityField;

    if (pointer.isDown) {
      const { position, prevPosition } = pointer;
      cameraProps.velocity.x -= (position.x - prevPosition.x) * cameraProps.dragAccel;
      cameraProps.velocity.y -= (position.y - prevPosition.y) * cameraProps.dragAccel;
    }

    cameraProps.velocity.z += cameraProps.thrust;
    cameraProps.velocity.scale(cameraProps.damping);

    camera.scrollX += cameraProps.velocity.x * dt;
    camera.scrollY += cameraProps.velocity.y * dt;

    const cameraX = camera.scrollX % worldWidth;
    const cameraY = camera.scrollY % worldHeight;
    const cameraZ = (cameraProps.z + (cameraProps.velocity.z * dt)) % worldDepth;
    cameraProps.z = cameraZ;

    for (const ent of this.background) {
      ent.sprite.setTilePosition(camera.scrollX * ent.scrollRatio, camera.scrollY * ent.scrollRatio);
    }

    for (const cloud of this.clouds) {
      cloud.sprite.setTilePosition(cloud.sprite.tilePositionX + time * cloud.accel, cloud.sprite.tilePositionY);
    }

    this.orbRotation += 0.005;

    const circles = this.entityField.generate({
      width,
      height,
      cameraX,
      cameraY,
      cameraZ,
      far: cameraProps.far,
      fov: cameraProps.fov,
      getEntity: (seed) => {
        if (seed % 10 === 0) {
          const orb: EntityData = {
            type: 'orb',
            variant: Phaser.Math.RND.integerInRange(0, ORB_VARIANTS.length - 1),
            // r: (Phaser.Math.RND.frac() * 0.6 + 0.4) * 150,
            r: 120,
            drift: new Phaser.Math.Vector2(),
            vel: new Phaser.Math.Vector2(),
            offset: new Phaser.Math.Vector2(),
            transitionFactor: 1,
            updateTime: 0
          };
          this.orbs.push(orb);
          return orb;
        }
        return this.vessels[seed % this.vessels.length];
      }
    });

    const nearFadeStart = 0;
    const nearFadeEnd = 200;
    const farFadeStart = 1000;
    const farFadeEnd = cameraProps.far;

    const renderItems = [];

    for (const c of circles) {
      for (let dx = -2; dx <= 1; dx++) {
        for (let dy = -2; dy <= 1; dy++) {
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
              x + r >= 0 && x - r <= width &&
              y + r >= 0 && y - r <= height
            ) {
              let alpha = 1;
              let blur = 0;

              if (dzFromCamera < nearFadeStart || dzFromCamera > farFadeEnd) {
                alpha = 0;
                blur = 1;
              } else if (dzFromCamera < nearFadeEnd) {
                // Near
                const t = (dzFromCamera - nearFadeStart) / (nearFadeEnd - nearFadeStart);
                alpha = Math.pow(t, 2); // ease-in
                blur = 0;
              } else if (dzFromCamera > farFadeStart) {
                // Far
                const t = (dzFromCamera - farFadeStart) / (farFadeEnd - farFadeStart);
                alpha = Math.pow(1 - t, 1.5); // ease-out
                blur = 1 - Math.pow(1 - t, 3); // ease-out
              } else {
                // Fully visible between nearFadeEnd and farFadeStart
                alpha = 1;
                blur = 0;
              }

              const itemScale = r * .0075;

              if (entity.updateTime !== time) {
                this.updateVesselPhysics(entity);
                entity.updateTime = time;
              }

              const { offset } = entity;
              renderItems.push({
                entity,
                x: x + offset.x * itemScale,
                y: y + offset.y * itemScale,
                wz,
                scale: itemScale,
                alpha,
                blur
              });
            }
          }
        }
      }
    }

    // Sort by z-depth, farthest to nearest
    renderItems.sort((a, b) => (b.wz - cameraZ) - (a.wz - cameraZ));

    for (const sprite of (this.vesselSprites.getChildren() as Phaser.GameObjects.Image[])) {
      sprite.setActive(false);
      sprite.setVisible(false);
    }
    for (const sprite of (this.orbSprites.getChildren() as Phaser.GameObjects.Image[])) {
      sprite.setActive(false);
      sprite.setVisible(false);
    }

    renderItems.forEach((item, depth) => {
      this.drawEntity(item, depth);
    });

    let text = `FPS: ${this.game.loop.actualFps}`;
    // text += `\nEntities: ${renderItems.length}`;
    text += '\nOrbs:';
    this.collectedOrbs.forEach(orb => {
      const variantProps = ORB_VARIANTS[orb.variant];
      text += `\n ${variantProps.name}`;
    });
    this.fpsText.setText(text);
  }

  updateVesselAttunements() {
    for (const vessel of this.vessels) {
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
      vessel.attunement = Math.pow(attunement / 3, 2);
    };
  }

  updateVesselPhysics(entity: EntityData) {
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

    this.sky.setScale(scale);
    this.sky.setPosition(width / 2, height / 2);

    for (const ent of this.background) {
      ent.sprite.setSize(width * 2, height * 2);
      ent.sprite.setOrigin(0, 0);
    }
  }
}
