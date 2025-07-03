import * as Phaser from 'phaser';
import { API_URL } from '../../config';
import { ToroidalPoissonDisc3D } from '../../utils/ToroidalPoissonDisc3D';
import { BaseScene } from '../BaseScene';
import app from './app';
import DataProvider from './DataProvider';
import { Orb, OrbController } from './OrbController';
import { ResonanceMeter, ResonanceMeterProps } from './ResonanceMeter';
import { Entity, FieldEntity, OrbEntity, Scrollable, VesselEntity } from './types';
import { VesselController } from './VesselController';

const SKY_SIZE = { width: 1024, height: 1024 };
const ATTUNEMENT_TTL = 20_000;

export class VesselField extends BaseScene {
  dataProvider!: DataProvider;

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
  sun!: Phaser.GameObjects.Image;
  moon!: Phaser.GameObjects.Image;
  clouds!: (Entity<Phaser.GameObjects.TileSprite> & Scrollable & { accel: number })[];
  background!: (Entity<Phaser.GameObjects.TileSprite> & Scrollable)[];

  vesselController: VesselController;
  orbController: OrbController;

  attunmentExpiresAt?: number;
  resonanceLevels: { [key: string]: number } = {};
  resonanceMeter: ResonanceMeter;

  collectedOrbs: OrbEntity[] = [];

  entityField!: ToroidalPoissonDisc3D<FieldEntity>;

  fpsText: Phaser.GameObjects.Text;

  constructor() {
    super('vessel-field');
  }

  preload() {
    super.preload();
    this.load.image('sky', 'textures/sky.png');
    this.load.image('stars_1', 'textures/stars_1.png');
    this.load.image('stars_2', 'textures/stars_2.png');
    this.load.image('sun', 'textures/sun.png');
    this.load.image('moon', 'textures/moon.png');
    this.load.image('clouds_1', 'textures/clouds_1.png');
    this.load.image('clouds_2', 'textures/clouds_2.png');
    this.load.image('vessel_blur', 'textures/heart_blur.png');
    this.load.image('vessel_base', 'textures/heart_base.png');
    this.load.image('vessel_highlight', 'textures/heart_highlight.png');
    this.load.image('vessel_glow', 'textures/heart_glow.png');
    this.load.image('lock', 'textures/lock.png');
    this.load.image('attunement_glow', 'textures/attunement_glow.png');

    this.load.audio('select_orb', 'audio/select_orb.mp3');
    this.load.audio('select_vessel', 'audio/select_vessel.mp3');
    this.load.audio('attune', 'audio/attune.mp3');

    this.load.json('emotional_archetypes', `${API_URL}/emotional-archetypes`, 'data');
    this.load.json('posts', `${API_URL}/posts`, 'data');
  }

  create() {
    this.dataProvider = new DataProvider(this.cache.json);
    this.vesselController = new VesselController(this, this.dataProvider);
    this.orbController = new OrbController(this, this.dataProvider);

    // this.collectedOrbs = [
    //   { variant: 3 },
    //   { variant: 2 },
    //   { variant: 4 }
    // ] as any
    // this.updateVesselResonances();

    const camera = this.cameras.main;
    camera.centerOn(0, 0);

    this.createBackground();
    this.createEntityField();
    this.createResonanceMeter();
    // this.createStats();

    this.scale.on('resize', this.resize, this);
    this.resize();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, _objects: any) => {
      this.prevPointerPos = pointer.position.clone();
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer, _objects: any) => {
      const { cameraProps } = this;
      const { position } = pointer;

      if (pointer.isDown && this.prevPointerPos) {
        const prevPosition = this.prevPointerPos;
        cameraProps.velocity.x -= (position.x - prevPosition.x) * cameraProps.dragAccel;
        cameraProps.velocity.y -= (position.y - prevPosition.y) * cameraProps.dragAccel;
        this.prevPointerPos = position.clone();
      }
    });

    this.input.on('pointerup', (_pointer: Phaser.Input.Pointer, objects: any) => {
      const object = objects[0];
      if (!object) return;

      const entity = object.entity;
      if (!entity) return;

      if (entity.type === 'orb') {
        this.handleSelectOrb(entity);
      } else {
        this.handleSelectVessel(entity);
      }
    });

    app.loadModal('/components/intro');
  }

  createBackground() {
    this.sky = this.add.image(0, 0, 'sky');

    const stars = [
      {
        sprite: this.add.tileSprite(0, 0, 0, 0, 'stars_1')
          .setScale(0.5)
          .setScrollFactor(0),
        scrollRatio: 0.05
      },
      {
        sprite: this.add.tileSprite(0, 0, 0, 0, 'stars_2')
          .setScale(0.5)
          .setScrollFactor(0),
        scrollRatio: 0.07
      }
    ];

    this.sun = this.add.image(0, 0, 'sun');

    this.moon = this.add.image(0, 0, 'moon')
      .setScale(0.5)
      .setAlpha(0.8)
      .setScrollFactor(0.08);

    this.clouds = [
      {
        sprite: this.add.tileSprite(0, 0, 0, 0, 'clouds_1')
          .setAlpha(0.25)
          .setScrollFactor(0),
        accel: -0.01,
        scrollRatio: 0.16
      },
      {
        sprite: this.add.tileSprite(0, 0, 0, 0, 'clouds_2')
          .setAlpha(0.5)
          .setScrollFactor(0),
        accel: 0.02,
        scrollRatio: 0.18
      }
    ];

    this.background = [
      ...stars,
      ...this.clouds
    ];
  }

  createEntityField() {
    const worldWidth = 6000;
    const worldHeight = 6000;
    const worldDepth = 20000;

    this.entityField = new ToroidalPoissonDisc3D<FieldEntity>(worldWidth, worldHeight, worldDepth, 1000);
    this.entityField.minPointDist = 700;
  }

  createResonanceMeter() {
    const { emotionalArchetypes } = this.dataProvider;
    for (const archetype of emotionalArchetypes) {
      this.resonanceLevels[archetype.name] = 0;
    }

    const props: ResonanceMeterProps = {
      attunementLife: 0,
      wedges: emotionalArchetypes.map(archetype => {
        return { color: archetype.color, level: 0 };
      })
    };
    // const props: ResonanceMeterProps = {
    //   attunementLife: 0.5,
    //   wedges: Object.values(EMOTIONS).map(color => ({
    //     color,
    //     level: Math.round(Math.random() * 3)
    //   }))
    // };

    this.resonanceMeter = new ResonanceMeter(this, 80, 80, props);
    this.resonanceMeter
      .setDepth(100000)
      .setScrollFactor(0);
  }

  createStats() {
    this.fpsText = this.add.text(10, 10, 'FPS: 0', {
      fontSize: 12,
      color: '#ffffff',
    })
      .setAlpha(0)
      .setScrollFactor(0);
  }

  update(time: number, delta: number) {
    this.vesselController.update(time, delta);
    this.orbController.update(time, delta);

    const dt = delta / 1000;
    const { width, height } = this.scale;
    const camera = this.cameras.main;
    const { cameraProps } = this;
    const { worldWidth, worldHeight, worldDepth } = this.entityField;

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
        if (seed % 10 === 0) {
          return this.orbController.createEntity(seed);
        }
        return this.vesselController.entities[seed % this.vesselController.entities.length];
      }
    });

    const nearFadeStart = 0;
    const nearFadeEnd = 200;
    const farFadeStart = 1000;
    const farFadeEnd = cameraProps.far;

    const renderItems = [];
    const renderedEntities: Set<FieldEntity> = new Set();
    const dy = 0, dx = 0;
    const margin = 100;

    for (const c of circles) {
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
        this.vesselController.drawSprite(item);
      } else {
        this.orbController.drawSprite(item);
      }
    }

    if (this.attunmentExpiresAt && time >= this.attunmentExpiresAt) {
      this.attunmentExpiresAt = undefined;

      for (const entity of this.collectedOrbs) {
        this.tweens.add({
          targets: entity,
          transitionFactor: 1,
          ease: 'Power2',
          duration: 300
        });
      }

      this.collectedOrbs.length = 0;

      for (const key of Object.keys(this.resonanceLevels)) {
        this.resonanceLevels[key] = 0;
      }

      this.updateResonances();
    }

    const expiresAt = this.attunmentExpiresAt ?? time;
    const attunementLife = (expiresAt - time) / ATTUNEMENT_TTL;
    this.resonanceMeter.setAttunementLife(attunementLife);

    if (this.fpsText) {
      const text = `FPS: ${this.game.loop.actualFps}`;
      this.fpsText.setText(text);
    }
  }

  updateResonances() {
    for (const vessel of this.vesselController.entities) {
      if (vessel.post.has_response) {
        vessel.resonance = 0;
        continue;
      }

      let sum = 0;
      for (const orb of this.collectedOrbs) {
        if (vessel.color === orb.color) {
          sum += 1;
        }
      }
      vessel.targetResonance = Math.pow(sum / 3, 2);
    };

    const wedgeLevels = Object.values(this.resonanceLevels);
    this.resonanceMeter.tweenWedgeLevels(wedgeLevels);

    const expiresAt = this.attunmentExpiresAt ?? this.game.getTime();
    const attunementLife = (expiresAt - this.game.getTime()) / ATTUNEMENT_TTL;
    this.resonanceMeter.setAttunementLife(attunementLife);
  }

  handleSelectOrb(entity: OrbEntity) {
    if (this.collectedOrbs.find(o => o === entity)) return;
    const { archetype } = entity;

    app.track('orb_clicked');

    this.tweens.add({
      targets: entity,
      transitionFactor: 0,
      ease: 'Power2',
      duration: 300
    });

    this.collectedOrbs.push(entity);

    if (this.resonanceLevels[archetype.name] === 3) {
      for (let i = 0; i < this.collectedOrbs.length; i++) {
        const orb = this.collectedOrbs[i];
        if (orb.archetype.name === archetype.name) {
          this.collectedOrbs.splice(i, 1);
          this.tweens.add({
            targets: orb,
            transitionFactor: 1,
            ease: 'Power2',
            duration: 300
          });
          break;
        }
      }
    } else {
      this.resonanceLevels[archetype.name]++;
    }

    if (this.resonanceLevels[archetype.name] === 3) {
      this.attunmentExpiresAt = this.game.getTime() + ATTUNEMENT_TTL;
      this.sound.play('attune', { volume: 0.25 });
    }
    this.sound.play('select_orb', { volume: 0.25 });
    this.updateResonances();
  }

  handleSelectVessel(entity: VesselEntity) {
    this.sound.play('select_vessel', { volume: 0.25 });

    app.track('post_clicked');
    app.loadModal(`/components/posts/${entity.post.id}`);
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
    const camera = this.cameras.main;
    const { worldWidth, worldHeight } = this.entityField;

    const camBounds = {
      x: -(worldWidth / 2 - width),
      y: -(worldHeight / 2 - height),
      w: (worldWidth - width),
      h: (worldHeight - height),
    };

    camera.setBounds(camBounds.x, camBounds.y, camBounds.w, camBounds.h);

    const skyH = Math.max(SKY_SIZE.height, height * 1.25);
    const skyScrollFactorY = (skyH - height) / camBounds.h;
    this.sky
      .setDisplaySize(Math.max(width, SKY_SIZE.width), skyH)
      .setPosition(width / 2, height / 2)
      .setScrollFactor(0, skyScrollFactorY);

    this.sun
      .setPosition(width / 2, (height / 2) + (skyH / 2) - 85)
      .setScrollFactor(0.05, skyScrollFactorY);

    this.moon.setPosition(width - 120, -70);

    for (const ent of this.background) {
      ent.sprite.setSize(width * 2, height * 2);
      ent.sprite.setOrigin(0, 0);
    }
  }
}
