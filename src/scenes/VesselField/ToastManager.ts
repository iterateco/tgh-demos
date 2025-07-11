import Phaser from 'phaser';
import { Toast } from './Toast';

export class ToastManager {
  private scene: Phaser.Scene;
  private currentToast?: Toast;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(options: {
    message: string,
    icon: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container
  }) {
    if (this.currentToast) {
      this.currentToast.hide();
      this.currentToast = undefined;
    }
    const toast = new Toast(this.scene, options.icon, options.message);
    toast.show();
    this.currentToast = toast;
  }

  close() {
    if (this.currentToast) {
      this.currentToast.hide();
      this.currentToast = undefined;
    }
  }

  resize() {
    if (this.currentToast) {
      this.currentToast.resize();
    }
  }
}
