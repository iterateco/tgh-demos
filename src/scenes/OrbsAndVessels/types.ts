import Phaser from 'phaser';

export const EMOTIONS = {
  joy: 0xE23B3B,
  gratitude: 0xD1B757,
  peace: 0x57D157,
  wonder: 0x57CDD1,
  hope: 0x5782D1,
  longing: 0x7057D1,
  love: 0xD157B3,
};

export const EMOTION_KEYS = Object.keys(EMOTIONS);

export interface FieldEntity {
  id: number
  type: 'vessel' | 'orb'
  r: number
  offset: Phaser.Math.Vector2
}

export interface OrbEntity extends FieldEntity {
  emotion: string
  seed: number
  transitionFactor: number
  prevOffset: Phaser.Math.Vector2
}

export interface VesselEntity extends FieldEntity {
  emotion: string
  targetResonance: number
  resonance: number
  locked: boolean
  drift: Phaser.Math.Vector2
  vel: Phaser.Math.Vector2
}
