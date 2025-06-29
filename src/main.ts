import * as Phaser from 'phaser';
import { ClippingTest } from './scenes/ClippingTest';
import { Main } from './scenes/Main';
import { OrbsAndVessels } from './scenes/OrbsAndVessels';
import { VesselField2D } from './scenes/VesselField2D';
import { VesselField3D } from './scenes/VesselField3D';
import { VesselStream } from './scenes/VesselStream';

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
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
  input: { keyboard: true },
  scene: [
    Main,
    VesselField2D,
    VesselField3D,
    VesselStream,
    OrbsAndVessels,
    ClippingTest
  ]
};

export default new Phaser.Game(config);
