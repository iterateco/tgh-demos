import Phaser from 'phaser';

export const FEELINGS = {
  gratitude: 0.2,
  peace: 0.4,
  wonder: 0.6,
  longing: 0.7,
  love: 0.8
};

export const FEELING_NAMES = Object.keys(FEELINGS);

export const VESSEL_VARIANTS = new Array(16).fill(0).map((_, i) => {
  const h = i / 16;
  const s = 0.6;
  const l = 0.65;
  return {
    color: Phaser.Display.Color.HSLToColor(h, s, l)
  };
});

export const ORB_VARIANTS = Object.entries(FEELINGS).map(([name, h]) => {
  const s = 0.7;
  const l = 0.5;
  return {
    name,
    color: Phaser.Display.Color.HSLToColor(h, s, l)
  };
});

export interface FieldEntity {
  type: 'vessel' | 'orb'
  variant: number
  r: number
  offset: Phaser.Math.Vector2
}

export interface OrbEntity extends FieldEntity {
  seed: number
  transitionFactor: number
}

export interface VesselEntity extends FieldEntity {
  attributes: { [name: string]: number },
  targetAttunement: number
  attunement: number
  locked: boolean
  drift: Phaser.Math.Vector2
  vel: Phaser.Math.Vector2
}
