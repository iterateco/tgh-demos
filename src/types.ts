import * as Phaser from 'phaser';

export interface Entity<T extends Phaser.GameObjects.GameObject = Phaser.GameObjects.GameObject> {
  sprite: T
}

export interface Scrollable {
  scrollRatio: number
}
