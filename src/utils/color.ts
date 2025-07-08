import Phaser from 'phaser';

export function colorToHexString(color: Phaser.Display.Color) {
  return Phaser.Display.Color.RGBToString(color.red, color.green, color.blue, 0, '#');
}
