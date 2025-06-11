
import * as Phaser from 'phaser';
import { Entity, Scrollable } from '../types';
import { randomPastel } from '../utils/color';
import { ToroidalPoissonDisc } from '../utils/ToroidalPoissonDisc';

const BG_SIZE = { width: 1024, height: 768 };
const VESSEL_SIZE = 200;

interface VesselData {
  color: Phaser.Display.Color,
  r: number
}

export class Main extends Phaser.Scene {
  cameraProps = {
    velocity: new Phaser.Math.Vector2(0, 0),
    speedFactor: 0.1,
    damping: 0.95,
  };

  sky!: Phaser.GameObjects.Image;
  background!: (Entity<Phaser.GameObjects.TileSprite> & Scrollable)[];
  vesselContainer!: Phaser.GameObjects.Container;
  // vessels!: (Entity<Phaser.GameObjects.Container>)[];
  vesselField!: ToroidalPoissonDisc<VesselData>;

  constructor() {
    super('Main');
  }

  preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('stars_1', 'assets/stars_1.png');
    this.load.image('stars_2', 'assets/stars_2.png');
    this.load.image('vessels_2', 'assets/vessels_2.png');
    this.load.image('vessels_3', 'assets/vessels_3.png');
    this.load.image('vessel', 'assets/heart.png');
  }

  create() {
    const { cameraProps } = this;

    this.createBackground();
    this.createVesselField();
    this.createVessels();

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

    this.background = [
      {
        sprite: this.add.tileSprite(0, 0, 0, 0, 'stars_1')
          .setScale(0.5)
          .setScrollFactor(0),
        scrollRatio: 0.16
      },
      {
        sprite: this.add.tileSprite(0, 0, 0, 0, 'stars_2')
          .setScale(0.5)
          .setScrollFactor(0),
        scrollRatio: 0.2
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
      }
    ];
  }

  createVesselField() {
    const items: VesselData[] = [];

    for (let i = 0; i < 1000; i++) {
      items.push({
        color: randomPastel(),
        r: (Phaser.Math.RND.frac() * 0.6 + 0.4) * 100
      });
    }

    this.vesselField = new ToroidalPoissonDisc<VesselData>(5000, 5000, 100);
    this.vesselField.minPointDist = 100;
    this.vesselField.entities = items;

    this.vesselContainer = this.add.container(0, 0);
  }

  createVessels() {
    // this.vessels = [
    //   this.createVesselSprite(0, 0, 0.4, 0xEF588D),
    //   this.createVesselSprite(100, 120, 0.3, 0x58B3EF)
    // ];
  }

  createVesselSprite(x: number, y: number, scale: number, tint: number) {
    // return this.add.image(x, y, 'vessel')
    //   .setTintFill(tint)
    //   .setAlpha(0.8)
    //   .setScale(scale);
    return this.add.container(x, y, [
      this.add.image(0, 0, 'vessel'),
      this.add.image(0, 0, 'vessel')
        .setTintFill(tint)
        .setBlendMode(Phaser.BlendModes.SCREEN)
    ])
      .setAlpha(0.8)
      .setScale(scale);
  }

  update(_time: number, _delta: number) {
    const { cameraProps } = this;
    const camera = this.cameras.main;

    camera.scrollX += cameraProps.velocity.x;
    camera.scrollY += cameraProps.velocity.y;
    cameraProps.velocity.x *= cameraProps.damping;
    cameraProps.velocity.y *= cameraProps.damping;

    for (const ent of this.background) {
      ent.sprite.setTilePosition(camera.scrollX * ent.scrollRatio, camera.scrollY * ent.scrollRatio);
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
          const { r } = c.entity;

          if (
            screenX + r >= 0 && screenX - r <= width &&
            screenY + r >= 0 && screenY - r <= height
          ) {
            this.vesselContainer.add(
              this.createVesselSprite(screenX, screenY, c.entity.r * .006, c.entity.color.color)
            ).setScrollFactor(0);
          }
        }
      }
    }
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
