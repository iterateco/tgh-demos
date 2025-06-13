import * as Phaser from 'phaser';
import { Main } from './scenes/Main';
import { VesselField2D } from './scenes/VesselField2D';
import { VesselField3D } from './scenes/VesselField3D';

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    Main,
    VesselField2D,
    VesselField3D
  ],
  seed: ['23423434348347'],
  input: { keyboard: true }
};

export default new Phaser.Game(config);
