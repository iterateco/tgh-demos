import * as Phaser from 'phaser';
import { ORB_VARIANTS, VESSEL_VARIANTS } from './types';

export class EntityTextureManager {
  scene: Phaser.Scene;
  vesselAtlas: TextureAtlas;
  orbAtlas: TextureAtlas;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.vesselAtlas = new TextureAtlas(scene, 'vessel_atlas', 250, {
      primary: VESSEL_VARIANTS.length,
      blur: VESSEL_VARIANTS.length
    });
    this.orbAtlas = new TextureAtlas(scene, 'orb_atlas', 250, {
      primary: ORB_VARIANTS.length,
      blur: ORB_VARIANTS.length
    });
  }

  prepareVessel(variant: number) {
    if (this.vesselAtlas.hasFrame('primary', variant)) return;

    const { color } = VESSEL_VARIANTS[variant];
    // this.drawColorizedFrame(this.vesselAtlas, 'primary', variant, 'vessel', color);
    this.drawColorizedFrame(this.vesselAtlas, 'primary', variant, 'vessel', color);
    this.drawColorizedFrame(this.vesselAtlas, 'blur', variant, 'vessel_blur', color);
  }

  prepareOrb(variant: number) {
    if (this.orbAtlas.hasFrame('primary', variant)) return;

    const { color } = ORB_VARIANTS[variant];
    this.drawColorizedFrame(this.orbAtlas, 'primary', variant, 'orb_cloud', color);
    this.drawColorizedFrame(this.orbAtlas, 'blur', variant, 'orb_blur', color);
  }

  private drawColorizedFrame(atlas: TextureAtlas, sliceKey: string, sliceIdx: number, sourceKey: string, color: number) {
    const layers = [
      this.scene.make.image({ key: sourceKey }, false)
        .setOrigin(0),
      this.scene.make.image({ key: sourceKey }, false)
        .setOrigin(0)
        .setTintFill(color)
        .setBlendMode(Phaser.BlendModes.SCREEN)
    ];

    atlas.drawFrame(layers, sliceKey, sliceIdx);
    layers.forEach(layer => layer.destroy());
  }
}

const MAX_ATLAS_WIDTH = 4096;

class TextureAtlas {
  key: string;
  frameSize: number;
  frameCount: number;
  rows: number;
  cols: number;
  slices: { [key: string]: number } = {};
  texture: Phaser.Textures.DynamicTexture;

  constructor(scene: Phaser.Scene, key: string, frameSize: number, slicesConfig: { [key: string]: number }) {
    let sliceIdx = 0;

    for (const [key, length] of Object.entries(slicesConfig)) {
      this.slices[key] = sliceIdx;
      sliceIdx += length;
    }

    this.key = key;
    this.frameCount = sliceIdx;
    this.frameSize = frameSize;

    this.rows = Math.ceil((this.frameCount * frameSize) / MAX_ATLAS_WIDTH);
    this.cols = Math.min(this.frameCount, Math.floor(MAX_ATLAS_WIDTH / frameSize));

    this.texture = scene.textures.addDynamicTexture(key, this.cols * frameSize, this.rows * frameSize);
  }

  getFramePosition(sliceKey: string, sliceIdx: number) {
    const index = this.slices[sliceKey] + sliceIdx;
    const row = Math.floor(index / this.cols);
    const col = index % this.cols;
    return new Phaser.Math.Vector2(col * this.frameSize, row * this.frameSize);
  }

  getFrameName(sliceKey: string, sliceIdx: number) {
    return `${sliceKey}.${sliceIdx}`;
  }

  hasFrame(sliceKey: string, sliceIdx: number) {
    return this.texture.has(this.getFrameName(sliceKey, sliceIdx));
  }

  drawFrame(entries: any, sliceKey: string, sliceIdx: number) {
    const { x, y } = this.getFramePosition(sliceKey, sliceIdx);
    const name = this.getFrameName(sliceKey, sliceIdx);
    this.texture.draw(entries, x, y);
    this.texture.add(name, 0, x, y, this.frameSize, this.frameSize);
  }
}
