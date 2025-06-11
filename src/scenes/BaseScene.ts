import * as Phaser from 'phaser';

export class BaseScene extends Phaser.Scene {
  preload() {
    this.load.setBaseURL(location.origin + '/' + location.pathname);
    this.load.setPath('assets');
  }
}
