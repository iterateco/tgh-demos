import * as Phaser from 'phaser';
import { VesselField } from './scenes/VesselField';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  seed: ['23423434348347'],
  input: { keyboard: false },
  scene: [
    VesselField
  ]
};

const game = new Phaser.Game(config);
(window as any).game = game;
