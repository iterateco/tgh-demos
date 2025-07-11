import { AppScene } from './types';

export class SceneController {
  scene: AppScene;

  constructor(scene: AppScene) {
    this.scene = scene;
  }

  update(_time: number, _delta: number) { }
}
