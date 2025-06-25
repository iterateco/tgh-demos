import Phaser from 'phaser';

export class SceneController {
  scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  update(_time: number, _delta: number) { }
}
