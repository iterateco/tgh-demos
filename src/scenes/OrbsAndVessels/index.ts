import * as Phaser from 'phaser';
import { Entity, Scrollable } from '../../types';
import { ToroidalPoissonDisc3D } from '../../utils/ToroidalPoissonDisc3D';
import { BaseScene } from '../BaseScene';

const BG_SIZE = { width: 1024, height: 768 };
const VESSEL_FRAME_WIDTH = 250;
const VESSEL_FRAME_COUNT = 16;
const VESSEL_DENSITY = 0.65;

interface VesselData {
  variation: number
  r: number
  drift: Phaser.Math.Vector2
  vel: Phaser.Math.Vector2
  offset: Phaser.Math.Vector2
  updateTime: number
}

export class OrbsAndVessels extends BaseScene {
  cameraProps = {
    fov: 500,
    far: 3000,
    z: 0,
    thrust: 15,
    velocity: new Phaser.Math.Vector3(0, 0, 10),
    damping: 0.95,
    maxDragRadius: 2000,
    center: new Phaser.Math.Vector2(0, 0),
    dragAccel: 10,
    prevPointerPos: new Phaser.Math.Vector2(0, 0)
  };

  sky!: Phaser.GameObjects.Image;
  clouds!: (Entity<Phaser.GameObjects.TileSprite> & Scrollable & { accel: number })[];
  background!: (Entity<Phaser.GameObjects.TileSprite> & Scrollable)[];

  vessels!: Phaser.GameObjects.Group;
  vesselField!: ToroidalPoissonDisc3D<VesselData>;

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
    this.load.spritesheet('vessel_atlas', 'heart_atlas.png', { frameWidth: VESSEL_FRAME_WIDTH });
    this.load.spritesheet('vessel_blur_atlas', 'heart_blur_atlas.png', { frameWidth: VESSEL_FRAME_WIDTH });
  }

  create() {
    const { cameraProps } = this;
    const camera = this.cameras.main;

    camera.centerOn(0, 0);

    this.createBackground();
    this.createVesselField();
    this.createStats();

    this.vessels = this.add.group();

    cameraProps.center = new Phaser.Math.Vector2(camera.scrollX, camera.scrollY);

    // this.cursors = this.input.keyboard?.createCursorKeys()

    this.scale.on('resize', this.resize, this);
    this.resize();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      cameraProps.prevPointerPos = new Phaser.Math.Vector2(pointer.x, pointer.y);
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

  createVesselField() {
    const items: VesselData[] = [];

    for (let i = 0; i < 1000; i++) {
      items.push({
        variation: Phaser.Math.RND.integerInRange(0, VESSEL_FRAME_COUNT),
        // r: (Phaser.Math.RND.frac() * 0.6 + 0.4) * 150,
        r: 120,
        drift: new Phaser.Math.Vector2(),
        vel: new Phaser.Math.Vector2(),
        offset: new Phaser.Math.Vector2(),
        updateTime: 0
      });
    }

    const worldWidth = 5000;
    const worldHeight = 5000;
    const worldDepth = 5000;

    const densityCoef = 1 / VESSEL_DENSITY;
    this.vesselField = new ToroidalPoissonDisc3D<VesselData>(worldWidth, worldHeight, worldDepth, densityCoef * 500);
    this.vesselField.minPointDist = densityCoef * 400;
    this.vesselField.entities = items;

    this.cameras.main.setScroll(worldWidth / 2, worldHeight / 2);
  }

  drawVessel(x: number, y: number, scale: number, variation: number, alpha: number, blur: number) {
    const frame = variation % VESSEL_FRAME_COUNT;

    (this.vessels.get(x, y, 'vessel_blur_atlas') as Phaser.GameObjects.Sprite)
      .setOrigin(0)
      .setFrame(frame)
      .setScale(scale)
      .setAlpha(blur * Math.pow(alpha, .5))
      .setScrollFactor(0)
      .setVisible(true)
      .setActive(true);


    (this.vessels.get(x, y, 'vessel_atlas') as Phaser.GameObjects.Sprite)
      .setOrigin(0)
      .setFrame(frame)
      .setScale(scale)
      .setAlpha(Math.pow(alpha, 2.5))
      .setScrollFactor(0)
      .setVisible(true)
      .setActive(true);

    // if (blur > 0.3) {
    //   let blurController = (sprite as any).blurController;
    //   if (!blurController) {
    //     blurController = sprite.postFX.addBokeh(scale * 3, blur, 0.1);
    //     (sprite as any).blurController = blurController;
    //   }
    // }

    // return this.add.container(x, y, [
    //   this.add.image(0, 0, 'vessel'),
    //   this.add.image(0, 0, 'vessel_overlay')
    //     .setTint(tint)
    //     .setBlendMode(Phaser.BlendModes.SCREEN)
    // ])
    //   .setScale(scale);
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
    const { worldWidth, worldHeight, worldDepth } = this.vesselField;

    if (pointer.isDown) {
      const delta = cameraProps.prevPointerPos.clone().subtract(pointer.position);
      cameraProps.velocity.add(delta.scale(cameraProps.dragAccel));
      cameraProps.prevPointerPos = pointer.position.clone();
    } else {
      cameraProps.velocity.x *= 0.9;
      cameraProps.velocity.y *= 0.9;

      const scroll = new Phaser.Math.Vector2(camera.scrollX, camera.scrollY);
      const toCenter = cameraProps.center.clone().subtract(scroll);
      const dist = toCenter.length();

      if (dist > 0.1) {
        const normalized = Phaser.Math.Clamp(dist / cameraProps.maxDragRadius, 0, 1);
        const ease = Phaser.Math.Easing.Quadratic.Out(normalized);
        const move = toCenter.normalize().scale(ease * 1000 * dt);
        camera.scrollX += move.x;
        camera.scrollY += move.y;
      } else {
        camera.scrollX = cameraProps.center.x;
        camera.scrollY = cameraProps.center.y;
      }
    }

    cameraProps.velocity.z += cameraProps.thrust;
    cameraProps.velocity.scale(cameraProps.damping);

    camera.scrollX += cameraProps.velocity.x * dt;
    camera.scrollY += cameraProps.velocity.y * dt;

    const cameraOffset = new Phaser.Math.Vector2(camera.scrollX, camera.scrollY).subtract(cameraProps.center);
    if (cameraOffset.length() > cameraProps.maxDragRadius) {
      cameraOffset.setLength(cameraProps.maxDragRadius);
      const scroll = cameraProps.center.clone().add(cameraOffset);
      camera.scrollX = scroll.x;
      camera.scrollY = scroll.y;
    }

    // if (!pointer.isDown) {
    //   cameraOffset.lerp(new Phaser.Math.Vector2(0, 0), 0.05);
    //   const scroll = cameraProps.center.clone().add(cameraOffset);
    //   camera.scrollX = scroll.x;
    //   camera.scrollY = scroll.y;
    // }

    const cameraX = camera.scrollX;
    const cameraY = camera.scrollY;
    const cameraZ = (cameraProps.z + (cameraProps.velocity.z * dt) + worldDepth) % worldDepth;
    cameraProps.z = cameraZ;

    for (const ent of this.background) {
      ent.sprite.setTilePosition(camera.scrollX * ent.scrollRatio, camera.scrollY * ent.scrollRatio);
    }

    for (const cloud of this.clouds) {
      cloud.sprite.setTilePosition(cloud.sprite.tilePositionX + time * cloud.accel, cloud.sprite.tilePositionY);
    }

    const circles = this.vesselField.generate(
      width,
      height,
      cameraX,
      cameraY,
      cameraZ,
      0,
      cameraProps.far,
      cameraProps.fov
    );

    const nearFadeStart = 0;
    const nearFadeEnd = 200;
    const farFadeStart = 1000;
    const farFadeEnd = cameraProps.far;

    const renderItems = [];

    for (const c of circles) {
      const dx = 0;
      const dy = 0;

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

          const scale = r * .0075;

          if (entity.updateTime !== time) {
            this.updateVesselPhysics(entity);
            entity.updateTime = time;
          }

          const { offset } = entity;
          renderItems.push({
            x: x + offset.x * scale,
            y: y + offset.y * scale,
            wz,
            scale,
            variation: entity.variation,
            alpha,
            blur
          });
        }
      }
    }

    // Sort by z-depth, farthest to nearest
    renderItems.sort((a, b) => (b.wz - cameraZ) - (a.wz - cameraZ));

    for (const sprite of (this.vessels.getChildren() as Phaser.GameObjects.Image[])) {
      sprite.setActive(false);
      sprite.setVisible(false);
    }

    for (const item of renderItems) {
      this.drawVessel(item.x, item.y, item.scale, item.variation, item.alpha, item.blur);
    }

    this.fpsText.setText(`FPS: ${this.game.loop.actualFps}`);
  }

  updateVesselPhysics(entity: VesselData) {
    const { drift, vel, offset } = entity;

    // Slowly change drift vector (fake Perlin noise)
    drift.x += (Phaser.Math.RND.frac() - 0.5) * 0.002;
    drift.y += (Phaser.Math.RND.frac() - 0.5) * 0.002;
    drift.x *= 0.98;
    drift.y *= 0.98;

    // Apply drift to velocity
    vel.x += drift.x;
    vel.y += drift.y;

    // Apply restoring force (like a spring to the origin)
    const restoringStrength = 0.0008;
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
