import Phaser from 'phaser';
import { EmotionalArchetype, Post } from '../../models';
import DataProvider from './DataProvider';
import { OrbController } from './OrbController';
import { ToastManager } from './ToastManager';
import { VesselController } from './VesselController';

export const RESONANCE_LIMIT = 3;

export interface AppScene extends Phaser.Scene {
  toastManager: ToastManager
  dataProvider: DataProvider
  orbController: OrbController
  vesselController: VesselController
}

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
  collected?: boolean
}

export interface VesselEntity extends FieldEntity {
  post: Post
  targetResonance: number
  resonance: number
  drift: Phaser.Math.Vector2
  vel: Phaser.Math.Vector2
}
