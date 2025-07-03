import Phaser from 'phaser';
import { EmotionalArchetype, Post } from '../../models';

export interface Entity<T extends Phaser.GameObjects.GameObject = Phaser.GameObjects.GameObject> {
  sprite: T
}

export interface Scrollable {
  scrollRatio: number
}

export interface FieldEntity {
  type: 'vessel' | 'orb'
  r: number
  offset: Phaser.Math.Vector2
  color: number
}

export interface OrbEntity extends FieldEntity {
  archetype: EmotionalArchetype
  seed: number
  transitionFactor: number
  prevOffset: Phaser.Math.Vector2
}

export interface VesselEntity extends FieldEntity {
  post: Post
  targetResonance: number
  resonance: number
  drift: Phaser.Math.Vector2
  vel: Phaser.Math.Vector2
}
