import Phaser from 'phaser';

export class Toast extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private icon: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container;
  private text: Phaser.GameObjects.Text;
  private margin: number = 20;
  private maxWidth: number;
  private fixedHeight: number;
  private iconSize: number;
  private options?: { maxWidth?: number; height?: number; iconSize?: number };

  constructor(
    scene: Phaser.Scene,
    icon: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container,
    message: string,
    options?: { maxWidth?: number; height?: number; iconSize?: number }
  ) {
    super(scene);

    this.options = options;
    this.maxWidth = Math.min(options?.maxWidth ?? 500, scene.scale.width - this.margin * 2);
    this.fixedHeight = options?.height ?? 80;
    this.iconSize = options?.iconSize ?? 48;

    // Background
    this.bg = scene.add.graphics();
    this.add(this.bg);

    // Text (created before icon for sizing)
    const textX = this.margin * 2 + this.iconSize;
    const textWidth = this.maxWidth - textX - this.margin;
    this.text = scene.add.text(0, 0, message, {
      color: '#fff',
      fontSize: '20px',
      fontFamily: 'Helvetica Neue',
      lineSpacing: 3,
      wordWrap: { width: textWidth },
      align: 'left'
    }).setOrigin(0, 0.5);
    this.add(this.text);

    // Icon (sprite/image passed in)
    // Assume icon's origin is already at center
    this.icon = icon;
    this.add(this.icon);

    // Initial sizing and positioning
    this.resize();

    this.setAlpha(0);
    this.setScale(0.9);
    this.setDepth(100000);
    this.setScrollFactor(0);

    scene.add.existing(this);
  }

  show(duration: number = 500) {
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      scale: 1,
      duration,
      ease: 'Back.Out'
    });
  }

  hide(duration: number = 500) {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.9,
      duration,
      ease: 'Back.In',
      onComplete: () => {
        this.destroy();
      }
    });
  }

  resize() {
    // Recalculate maxWidth and text width
    this.maxWidth = Math.min(this.options?.maxWidth ?? 500, this.scene.scale.width - this.margin * 2);
    this.fixedHeight = this.options?.height ?? 80;
    this.iconSize = this.options?.iconSize ?? 48;

    // Text position and wrapping
    const textX = this.margin * 2 + this.iconSize;
    const textWidth = this.maxWidth - textX - this.margin;
    this.text.setWordWrapWidth(textWidth, true);

    // Calculate background width: fill scene width unless it exceeds maxWidth
    let bgWidth = this.scene.scale.width - this.margin * 2;
    if (bgWidth > this.maxWidth) bgWidth = this.maxWidth;

    // Set container size
    this.setSize(bgWidth, this.fixedHeight);

    // Center container at bottom of screen
    this.x = this.scene.scale.width / 2;
    this.y = this.scene.scale.height - this.fixedHeight / 2 - this.margin;

    // Position icon and text relative to center origin
    const left = -bgWidth / 2;
    this.icon.setPosition(left + this.margin + this.iconSize / 2, 0);
    this.text.setX(left + this.margin * 2 + this.iconSize);
    this.text.setY(0);

    // Redraw background
    this.bg.clear();
    this.bg.fillStyle(0x000000, 0.8);
    this.bg.fillRoundedRect(-bgWidth / 2, -this.fixedHeight / 2, bgWidth, this.fixedHeight, 16);
  }
}
