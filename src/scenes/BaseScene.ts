import * as Phaser from 'phaser';

export class BaseScene extends Phaser.Scene {
  preload() {
    this.load.setPath(location.pathname + '/assets');
  }
}
