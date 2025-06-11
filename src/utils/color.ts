import * as Phaser from 'phaser';

export function randomPastel() {
  const h = Math.random();         // Hue: 0–1 (full color spectrum)
  const s = 0.6;                   // Low saturation for pastel
  const l = 0.8;                   // High lightness for pastel

  return Phaser.Display.Color.HSLToColor(h, s, l);
}
