import Phaser from 'phaser';
import { FieldEntity } from './types';

export class Orb extends Phaser.GameObjects.Container {
  entity: FieldEntity;
  blur: Phaser.GameObjects.Image;
  primary: Phaser.GameObjects.Image;
  burst: Phaser.GameObjects.Image;
}
