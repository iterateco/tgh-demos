import * as Phaser from 'phaser';
import { Entity, Scrollable } from '../types';
import { randomPastel } from '../utils/color';
import { ToroidalPoissonDisc3D } from '../utils/ToroidalPoissonDisc3D';
import { BaseScene } from './BaseScene';

const BG_SIZE = { width: 1024, height: 768 };

interface VesselData {
  color: Phaser.Display.Color
  r: number
  drift: Phaser.Math.Vector2
  vel: Phaser.Math.Vector2
  offset: Phaser.Math.Vector2
  updateTime: number
}

export class VesselStream extends BaseScene {
  cameraProps = {
    fov: 400,
    far: 3000,
    z: 0,
    thrust: 0.25,
    velocity: new Phaser.Math.Vector3(0, 0, 10),
    speedFactor: 0.2,
    damping: 0.95,
  };

  sky!: Phaser.GameObjects.Image;
  clouds!: (Entity<Phaser.GameObjects.TileSprite> & Scrollable & { speedFactor: number })[];
  background!: (Entity<Phaser.GameObjects.TileSprite> & Scrollable)[];

  vessels!: Phaser.GameObjects.Group;
  vesselField!: ToroidalPoissonDisc3D<VesselData>;

  fpsText!: Phaser.GameObjects.Text;

  constructor() {
    super('vessel-stream');
  }

  preload() {
    super.preload();
    this.load.image('sky', 'sky.png');
    this.load.image('stars_1', 'stars_1.png');
    this.load.image('stars_2', 'stars_2.png');
    this.load.image('clouds_1', 'clouds_1.png');
    this.load.image('clouds_2', 'clouds_2.png');
    this.load.image('vessel', 'heart.png');
    this.load.image('vessel_overlay', 'heart_overlay.png');
  }

  create() {
    const { cameraProps } = this;
    const camera = this.cameras.main;

    camera.centerOn(0, 0);
    camera.setScroll(0, 0);

    this.createBackground();
    this.createVesselField();
    this.createStats();

    this.vessels = this.add.group();

    // this.cursors = this.input.keyboard?.createCursorKeys()

    this.scale.on('resize', this.resize, this);
    this.resize();

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        const { velocity, speedFactor } = cameraProps;
        const { position, prevPosition } = pointer;
        velocity.x -= (position.x - prevPosition.x) * speedFactor;
        velocity.y -= (position.y - prevPosition.y) * speedFactor;

        // if (Math.abs(position.y - downY) > 50) {
        //   let { thrust } = cameraProps;
        //   thrust -= (position.y - prevPosition.y) * speedFactor;
        //   thrust = Phaser.Math.Clamp(thrust, 0, 1);
        //   cameraProps.thrust = thrust;
        // }
      }
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
        speedFactor: -0.01,
        scrollRatio: 0.2
      },
      {
        sprite: this.add.tileSprite(0, 0, 0, 0, 'clouds_2')
          .setScrollFactor(0),
        speedFactor: 0.02,
        scrollRatio: 0.3
      }
    ];

    this.background = [
      {
        sprite: this.add.tileSprite(0, 0, 0, 0, 'stars_1')
          .setScale(0.5)
          .setScrollFactor(0),
        scrollRatio: 0.14
      },
      {
        sprite: this.add.tileSprite(0, 0, 0, 0, 'stars_2')
          .setScale(0.5)
          .setScrollFactor(0),
        scrollRatio: 0.17
      },
      ...this.clouds
    ];
  }

  createVesselField() {
    const items: VesselData[] = [];

    for (let i = 0; i < 1000; i++) {
      items.push({
        color: randomPastel(),
        // r: (Phaser.Math.RND.frac() * 0.6 + 0.4) * 150,
        r: 120,
        drift: new Phaser.Math.Vector2(),
        vel: new Phaser.Math.Vector2(),
        offset: new Phaser.Math.Vector2(),
        updateTime: 0
      });
    }

    this.vesselField = new ToroidalPoissonDisc3D<VesselData>(2000, 300, 5000, 200);
    this.vesselField.minPointDist = 100;
    this.vesselField.entities = items;
  }

  createStats() {
    this.fpsText = this.add.text(10, 10, 'FPS: 0', {
      fontSize: 12,
      color: '#ffffff',
    })
      .setAlpha(0.75)
      .setScrollFactor(0);
  }

  getVesselSprite(x: number, y: number, scale: number, tint: number, alpha: number, blur: number) {
    const sprite: Phaser.GameObjects.Sprite = this.vessels.get(x, y, 'vessel_overlay')
      .setTint(tint)
      .setScale(scale)
      .setAlpha(alpha)
      .setScrollFactor(0);

    if (blur > 0.3) {
      let blurController = (sprite as any).blurController;
      if (!blurController) {
        blurController = sprite.postFX.addBlur(0, blur * 3, blur * 3, 1, 0xFFFFFF, 1);
        (sprite as any).blurController = blurController;
      }
    }

    sprite.setVisible(true);
    sprite.setActive(true);

    return sprite;

    // return this.add.container(x, y, [
    //   this.add.image(0, 0, 'vessel'),
    //   this.add.image(0, 0, 'vessel_overlay')
    //     .setTint(tint)
    //     .setBlendMode(Phaser.BlendModes.SCREEN)
    // ])
    //   .setScale(scale);
  }

  update(time: number, _delta: number) {
    const { width, height } = this.scale;
    const camera = this.cameras.main;
    const { cameraProps } = this;
    const { worldWidth, worldHeight, worldDepth } = this.vesselField;

    cameraProps.velocity.x *= cameraProps.damping;
    cameraProps.velocity.y *= cameraProps.damping;
    cameraProps.velocity.z += cameraProps.thrust;
    cameraProps.velocity.z *= cameraProps.damping;

    camera.scrollX = (camera.scrollX + cameraProps.velocity.x);
    camera.scrollY = (camera.scrollY + cameraProps.velocity.y);

    const cameraX = camera.scrollX;
    const cameraY = camera.scrollY;
    const cameraZ = (cameraProps.z + cameraProps.velocity.z + worldDepth) % worldDepth;
    cameraProps.z = cameraZ;

    for (const ent of this.background) {
      ent.sprite.setTilePosition(camera.scrollX * ent.scrollRatio, camera.scrollY * ent.scrollRatio);
    }

    for (const cloud of this.clouds) {
      cloud.sprite.setTilePosition(cloud.sprite.tilePositionX + time * cloud.speedFactor, cloud.sprite.tilePositionY);
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
    const nearFadeEnd = 50;
    const farFadeStart = 1000;
    const farFadeEnd = cameraProps.far;

    const renderItems = [];

    for (const c of circles) {
      const dx = -0.5;
      const dy = 0.5;
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
            alpha = Math.pow(1 - t, 2); // ease-out
            blur = 1 - Math.pow(1 - t, 3); // ease-out
          } else {
            // Fully visible between nearFadeEnd and farFadeStart
            alpha = 1;
            blur = 0;
          }

          const scale = r * .005;

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
            color: entity.color.color,
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
      this.getVesselSprite(item.x, item.y, item.scale, item.color, item.alpha, item.blur);
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
