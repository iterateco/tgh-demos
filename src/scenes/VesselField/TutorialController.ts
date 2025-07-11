import { DragFinger } from './DragFinger';
import { OrbSprite } from './OrbSprite';
import { ReticleController } from './ReticleController';
import { SceneController } from './SceneController';
import { AppScene, OrbEntity, RESONANCE_LIMIT } from './types';
import { VesselSprite } from './VesselSprite';

export class TutorialController extends SceneController {
  state: { key: string, params?: { [key: string]: any } } = { key: 'intro' };
  reticleController: ReticleController;
  dragged = false;
  dragTip: DragFinger;

  constructor(scene: AppScene) {
    super(scene);

    this.reticleController = new ReticleController(scene);
    this.dragTip = new DragFinger(scene).setDepth(90000);

    scene.time.delayedCall(500, () => {
      this.showOrbToast(0x49C6B7, `Tap ${RESONANCE_LIMIT} spirits of the same color to become attuned.`);
    });
  }

  update(_time: number, _delta: number) {
    let reticleTargets: OrbSprite[] = [];

    if (this.state.key === 'intro') {
      reticleTargets = (this.scene.orbController.sprites.getChildren() as OrbSprite[]);
    } else if (this.state.key === 'attune') {
      reticleTargets = (this.scene.orbController.sprites.getChildren() as OrbSprite[])
        .filter(sprite => {
          return sprite.entity.color === this.state.params!.color;
        });
    }

    reticleTargets = reticleTargets.filter(sprite => {
      return sprite.active && sprite.input?.enabled;
    });

    this.reticleController.updateTargets(reticleTargets);
  }

  resize() {
    this.dragTip.resize();
  }

  sceneDragged() {
    if (!this.dragged) {
      this.dragged = true;
      this.dragTip.hide();
    }
  }

  orbSelected(params: { entity: OrbEntity, resonanceLevel: number }) {
    const { entity, resonanceLevel } = params;

    if (this.state.key === 'attuned') return;

    if (resonanceLevel < RESONANCE_LIMIT) {
      const remaining = RESONANCE_LIMIT - resonanceLevel;
      const message = remaining > 1
        ? `Collect ${remaining} more spirits of this color to become attuned.`
        : `Almost there! Collect one more spirit of this color.`;

      this.showOrbToast(entity.color, message);
      this.setState('attune', { color: entity.color });

      this.scene.time.delayedCall(3000, () => {
        if (!this.dragged) {
          this.dragTip.show();
        }
      });
    } else {
      this.setState('attuned', { color: entity.color });
      this.showVesselToast(entity.color, "Tap a glowing heart to reveal its message.");
    }
  }

  vesselSelected() {
    this.scene.toastManager.close();
  }

  private setState(key: string, params?: { [key: string]: any }) {
    this.state = { key, params };
  }

  private showOrbToast(color: number, message: string) {
    const icon = new OrbSprite(this.scene);
    icon.update({ color, scale: 0.25 });
    icon.trail.destroy();
    this.scene.toastManager.show({ message, icon });
  }

  private showVesselToast(color: number, message: string) {
    const icon = new VesselSprite(this.scene);
    icon.update({
      color,
      resonance: 1,
      resonanceScale: 1,
      interactionFactor: 1,
      scale: 0.15
    });
    this.scene.toastManager.show({ message, icon });
  }
}
