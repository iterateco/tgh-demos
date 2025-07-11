import { OrbSprite } from './OrbSprite';
import { ReticleController } from './ReticleController';
import { SceneController } from './SceneController';
import { AppScene, OrbEntity } from './types';
import { VesselSprite } from './VesselSprite';

export class TutorialController extends SceneController {
  progressEvents = new Set<string>();
  reticleController: ReticleController;

  constructor(scene: AppScene) {
    super(scene);

    this.reticleController = new ReticleController(scene);

    setTimeout(() => {
      const toastIcon = new OrbSprite(scene);
      toastIcon.update({ color: 0x49C6B7, scale: 0.25 });
      toastIcon.trail.destroy();
      this.scene.toastManager.show({
        message: 'Collect 3 spirits of the same color to become attuned.',
        icon: toastIcon
      });
    }, 500);
  }

  update(_time: number, _delta: number) {
    const reticleTargets = (this.scene.orbController.sprites.getChildren() as OrbSprite[])
      .filter(sprite => {
        return sprite.active && sprite.input?.enabled;
      });

    this.reticleController.updateTargets(reticleTargets);

  }

  orbSelected() {
    this.scene.toastManager.close();
  }

  attunementReached(entity: OrbEntity) {
    if (this.registerProgress('attunement')) return;

    const toastIcon = new VesselSprite(this.scene);
    toastIcon.update({
      color: entity.color,
      resonance: 1,
      resonanceScale: 1,
      interactionFactor: 1,
      scale: 0.15
    });
    this.scene.toastManager.show({
      message: 'Tap a glowing heart to reveal its message.',
      icon: toastIcon
    });
  }

  vesselSelected() {
    this.scene.toastManager.close();
  }

  private registerProgress(event: string) {
    if (this.progressEvents.has(event)) {
      return true;
    }
    this.progressEvents.add(event);
  }
}
