import * as Phaser from 'phaser';
import { ASSETS_URL } from '../config';

export class BaseScene extends Phaser.Scene {
  preload() {
    this.load.setPath(ASSETS_URL);
  }
}
