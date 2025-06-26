import * as Phaser from 'phaser';
import { Entity, Scrollable } from '../types';
import { randomPastel } from '../utils/color';
import { ToroidalPoissonDisc } from '../utils/ToroidalPoissonDisc';
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

export class VesselField2D extends BaseScene {
  cameraProps = {
    velocity: new Phaser.Math.Vector2(0, 0),
    speedFactor: 0.1,
    damping: 0.95,
  };

  sky!: Phaser.GameObjects.Image;
  clouds!: (Entity<Phaser.GameObjects.TileSprite> & Scrollable & { speedFactor: number })[];
  background!: (Entity<Phaser.GameObjects.TileSprite> & Scrollable)[];
  vesselContainer!: Phaser.GameObjects.Container;
  // vessels!: (Entity<Phaser.GameObjects.Container>)[];
  vesselField!: ToroidalPoissonDisc<VesselData>;

  constructor() {
    super('vessel-field-2d');
  }

  preload() {
    super.preload();
    this.load.image('sky', 'textures/sky.png');
    this.load.image('stars_1', 'textures/stars_1.png');
    this.load.image('stars_2', 'textures/stars_2.png');
    this.load.image('clouds_1', 'textures/clouds_1.png');
    this.load.image('clouds_2', 'textures/clouds_2.png');
    this.load.image('vessels_2', 'textures/vessels_2.png');
    this.load.image('vessels_3', 'textures/vessels_3.png');
    this.load.image('vessel', 'textures/heart.png');
  }

  create() {
    const { cameraProps } = this;

    this.createBackground();
    this.createVesselField();

    // this.cursors = this.input.keyboard?.createCursorKeys()

    this.scale.on('resize', this.resize, this);
    this.resize();

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        cameraProps.velocity.x -= (pointer.position.x - pointer.prevPosition.x) * cameraProps.speedFactor;
        cameraProps.velocity.y -= (pointer.position.y - pointer.prevPosition.y) * cameraProps.speedFactor;
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
      {
        sprite: this.add.tileSprite(0, 0, 0, 0, 'vessels_2')
          .setScale(0.5)
          .setScrollFactor(0)
          .setAlpha(0.5),
        scrollRatio: 0.3
      },
      {
        sprite: this.add.tileSprite(0, 0, 0, 0, 'vessels_3')
          .setScale(0.5)
          .setScrollFactor(0)
          .setAlpha(0.5),
        scrollRatio: 0.4
      },
      ...this.clouds
    ];
  }

  createVesselField() {
    const items: VesselData[] = [];

    for (let i = 0; i < 1000; i++) {
      items.push({
        color: randomPastel(),
        r: (Phaser.Math.RND.frac() * 0.6 + 0.4) * 100,
        drift: new Phaser.Math.Vector2(),
        vel: new Phaser.Math.Vector2(),
        offset: new Phaser.Math.Vector2(),
        updateTime: 0
      });
    }

    this.vesselField = new ToroidalPoissonDisc<VesselData>(5000, 5000, 100);
    this.vesselField.minPointDist = 100;
    this.vesselField.entities = items;

    this.vesselContainer = this.add.container(0, 0);
  }

  createVesselSprite(x: number, y: number, scale: number, tint: number) {
    return this.add.container(x, y, [
      this.add.image(0, 0, 'vessel'),
      this.add.image(0, 0, 'vessel')
        .setTintFill(tint)
        .setBlendMode(Phaser.BlendModes.SCREEN)
    ])
      .setAlpha(0.8)
      .setScale(scale);
  }

  update(time: number, _delta: number) {
    const { cameraProps } = this;
    const camera = this.cameras.main;

    camera.scrollX += cameraProps.velocity.x;
    camera.scrollY += cameraProps.velocity.y;
    cameraProps.velocity.x *= cameraProps.damping;
    cameraProps.velocity.y *= cameraProps.damping;

    for (const ent of this.background) {
      ent.sprite.setTilePosition(camera.scrollX * ent.scrollRatio, camera.scrollY * ent.scrollRatio);
    }

    for (const cloud of this.clouds) {
      cloud.sprite.setTilePosition(cloud.sprite.tilePositionX + time * cloud.speedFactor, cloud.sprite.tilePositionY);
    }

    const { width, height } = this.scale;
    const { worldWidth, worldHeight } = this.vesselField;

    const wrapX = camera.scrollX % worldWidth;
    const wrapY = camera.scrollY % worldHeight;

    const circles = this.vesselField.generate(width, height, wrapX, wrapY);

    this.vesselContainer.removeAll(true);

    for (const c of circles) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const wx = c.x + dx * worldWidth;
          const wy = c.y + dy * worldHeight;

          const screenX = (wx - wrapX);
          const screenY = (wy - wrapY);
          const { entity } = c;
          const { r } = entity;

          if (
            screenX + r >= 0 && screenX - r <= width &&
            screenY + r >= 0 && screenY - r <= height
          ) {

            if (entity.updateTime !== time) {
              this.updateVesselPhysics(entity);
              entity.updateTime = time;
            }

            const { offset } = entity;

            this.vesselContainer.add(
              this.createVesselSprite(screenX + offset.x, screenY + offset.y, r * .006, entity.color.color)
            ).setScrollFactor(0);

          }
        }
      }
    }
  }

  updateVesselPhysics(entity: VesselData) {
    const { drift, vel, offset } = entity;

    // Slowly change drift vector (fake Perlin noise)
    drift.x += (Math.random() - 0.5) * 0.001;
    drift.y += (Math.random() - 0.5) * 0.001;
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

    this.cameras.main.centerOn(0, 0);
  }
}
