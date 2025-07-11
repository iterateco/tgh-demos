import Phaser from 'phaser';

export class DragFinger extends Phaser.GameObjects.Container {
  private finger: Phaser.GameObjects.Image;
  private timeline?: Phaser.Time.Timeline;
  private loopCount: number = 0;
  private maxLoops: number = 2;

  constructor(scene: Phaser.Scene) {
    super(scene);

    // The finger image is always animated from a fixed local position
    this.finger = scene.add.image(0, 0, 'finger')
      .setAlpha(0)
      .setScale(0.75)
      .setOrigin(0.5, 0.5);
    this.add(this.finger);

    this.setScrollFactor(0);
    scene.add.existing(this);

    this.resize();
  }

  show() {
    this.loopCount = 0;
    this.playLoop();
  }

  hide() {
    this.scene.tweens.add({
      targets: this.finger,
      alpha: 0,
      duration: 500,
      ease: 'Quad.In'
    });
  }

  resize() {
    // Center the container in the scene
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    this.x = width / 2;
    this.y = height / 2;
  }

  private playLoop(
    {
      startX = -125,
      endX = 125,
      y = 0,
      duration = 1200,
      fadeDuration = 300,
      rotation = 0.25
    }: {
      startX?: number,
      endX?: number,
      y?: number,
      duration?: number,
      fadeDuration?: number,
      rotation?: number
    } = {}
  ) {
    this.stopLoop();

    this.finger.x = startX;
    this.finger.y = y;
    this.finger.setRotation(0);

    this.timeline = this.scene.add.timeline([
      {
        at: 0,
        tween: {
          targets: this.finger,
          alpha: 0.75,
          duration: fadeDuration,
          ease: 'Quad.Out'
        }
      },
      {
        at: fadeDuration,
        tween: {
          targets: this.finger,
          x: endX,
          rotation: rotation,
          duration: duration,
          ease: 'Cubic.InOut'
        }
      },
      {
        at: fadeDuration + duration,
        tween: {
          targets: this.finger,
          alpha: 0,
          duration: fadeDuration,
          ease: 'Quad.In'
        }
      },
      {
        at: fadeDuration * 2 + duration,
        run: () => {
          this.loopCount++;
          if (this.loopCount < this.maxLoops) {
            this.finger.x = startX;
            this.finger.y = y;
            this.finger.setRotation(0);
            this.playLoop({ startX, endX, y, duration, fadeDuration, rotation });
          }
        }
      }
    ]);
    this.timeline.play();
  }

  private stopLoop() {
    if (this.timeline) {
      this.timeline.stop();
      this.timeline = undefined;
    }
    this.finger.setAlpha(0);
  }
}
