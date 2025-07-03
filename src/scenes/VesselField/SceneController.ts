import Phaser from 'phaser';
import DataProvider from './DataProvider';

export class SceneController {
  scene: Phaser.Scene;
  dataProvider: DataProvider;

  constructor(scene: Phaser.Scene, dataProvider: DataProvider) {
    this.scene = scene;
    this.dataProvider = dataProvider;
  }

  update(_time: number, _delta: number) { }
}
