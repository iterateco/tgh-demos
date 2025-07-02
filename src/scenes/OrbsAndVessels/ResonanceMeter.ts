import Phaser from 'phaser';

export interface WedgeData {
  color: number;
  level: number; // 0 to 3
}

export interface ResonanceMeterProps {
  attunementLife: number; // 0 to 1
  wedges: WedgeData[];
}

export class ResonanceMeter extends Phaser.GameObjects.Container {
  private props: ResonanceMeterProps;

  private readonly centerHoleRadius = 20;
  private readonly segmentCount = 3;
  private readonly outerRadius = 60;
  private readonly segmentGap = 2;
  private readonly wedgeGapAngle = Phaser.Math.DegToRad(2);

  private segmentSprites: Phaser.GameObjects.Sprite[][] = [];
  private wedgeRTKey: string = 'resonance-wedge-white';

  private attunementCircle!: Phaser.GameObjects.Graphics;
  private attunementTween?: Phaser.Tweens.Tween;
  private attunementDisplayed: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, props: ResonanceMeterProps) {
    super(scene, x, y);
    this.scene = scene;
    this.props = props;

    this.createWhiteWedgeTexture();
    this.createSprites();
    this.createAttunementCircle();

    scene.add.existing(this);
  }

  private createWhiteWedgeTexture() {
    const wedgeCount = this.props.wedges.length || 1;

    // Increase render texture resolution for smoother edges
    const rtScale = 2;
    const rtSize = (this.outerRadius * 2 + 20) * rtScale;

    // Remove previous textures/frames
    for (let w = 0; w < wedgeCount; w++) {
      for (let level = 0; level < this.segmentCount; level++) {
        const frameKey = `${this.wedgeRTKey}-w${w}-seg${level}`;
        if (this.scene.textures.exists(frameKey)) {
          this.scene.textures.remove(frameKey);
        }
      }
    }

    // Render each wedge/segment as a separate frame
    for (let w = 0; w < wedgeCount; w++) {
      const segmentThickness = (this.outerRadius - this.centerHoleRadius) / this.segmentCount;
      const wedgeAngle = (Math.PI * 2 - this.wedgeGapAngle * wedgeCount) / wedgeCount;
      const startAngle = w * (wedgeAngle + this.wedgeGapAngle);

      for (let level = 0; level < this.segmentCount; level++) {
        const gfx = this.scene.add.graphics();
        gfx.x = rtSize / 2;
        gfx.y = rtSize / 2;
        gfx.clear();
        gfx.fillStyle(0xffffff, 1);

        // Scale radii for high-res drawing
        const innerRadius = (this.centerHoleRadius + segmentThickness * level + this.segmentGap / 2) * rtScale;
        const outerRadius = (this.centerHoleRadius + segmentThickness * (level + 1) - this.segmentGap / 2) * rtScale;
        this.drawDonutSliceOnGraphics(
          gfx,
          innerRadius,
          outerRadius,
          startAngle - wedgeAngle / 2,
          startAngle + wedgeAngle / 2
        );

        const rt = this.scene.add.renderTexture(0, 0, rtSize, rtSize);
        rt.draw(gfx, 0, 0);
        rt.render();
        gfx.destroy();

        const frameKey = `${this.wedgeRTKey}-w${w}-seg${level}`;
        rt.saveTexture(frameKey);
        rt.destroy();
      }
    }
  }

  private createSprites() {
    this.segmentSprites.flat().forEach(sprite => sprite.destroy());
    this.segmentSprites = [];

    const { wedges } = this.props;
    const wedgeCount = wedges.length;

    const rtScale = 2;
    const rtSize = (this.outerRadius * 2 + 20) * rtScale;
    const displaySize = this.outerRadius * 2 + 20;

    for (let w = 0; w < wedgeCount; w++) {
      const wedge = wedges[w];
      const wedgeSprites: Phaser.GameObjects.Sprite[] = [];

      for (let level = 0; level < this.segmentCount; level++) {
        const frameKey = `${this.wedgeRTKey}-w${w}-seg${level}`;

        const isActive = level < wedge.level;
        const tint = isActive
          ? wedge.color
          : 0x888888;

        const sprite = this.scene.add.sprite(0, 0, frameKey);
        sprite.setTint(tint);
        sprite.setAlpha(isActive ? 1 : 0.5);

        // Scale down the high-res texture to normal display size
        sprite.setScale(displaySize / rtSize);

        // No rotation needed, as the wedge is already drawn at the correct angle
        sprite.x = 0;
        sprite.y = 0;

        this.add(sprite);
        wedgeSprites.push(sprite);
      }
      this.segmentSprites.push(wedgeSprites);
    }
  }

  private createAttunementCircle() {
    if (this.attunementCircle) {
      this.attunementCircle.destroy();
    }
    this.attunementCircle = this.scene.add.graphics();
    this.add(this.attunementCircle);
    this.attunementDisplayed = this.props.attunementLife;
    this.drawAttunementCircle(this.attunementDisplayed);
  }

  private drawAttunementCircle(fraction: number) {
    const radius = this.outerRadius + 6;
    const thickness = 4;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 2 * fraction;

    this.attunementCircle.clear();
    this.attunementCircle.lineStyle(thickness, 0xffffff, 1);

    if (fraction > 0) {
      this.attunementCircle.beginPath();
      this.attunementCircle.arc(0, 0, radius, startAngle, endAngle, false);
      this.attunementCircle.strokePath();
    }
  }

  public setAttunementLife(newValue: number) {
    this.drawAttunementCircle(newValue);
    this.props.attunementLife = newValue;
  }

  /**
   * Tween the attunementLife value and animate the attunement circle.
   * @param newValue New attunementLife value (0-1)
   * @param duration Tween duration in ms (default 300)
   */
  // public tweenAttunementLife(newValue: number, duration: number = 300) {
  //   if (this.attunementTween) {
  //     this.attunementTween.stop();
  //   }
  //   const prev = this.attunementDisplayed;
  //   this.attunementTween = this.scene.tweens.addCounter({
  //     from: prev,
  //     to: newValue,
  //     duration,
  //     onUpdate: tween => {
  //       this.attunementDisplayed = tween.getValue();
  //       this.drawAttunementCircle(this.attunementDisplayed);
  //     },
  //     onComplete: () => {
  //       this.attunementDisplayed = newValue;
  //       this.drawAttunementCircle(this.attunementDisplayed);
  //     }
  //   });
  //   this.props.attunementLife = newValue;
  // }

  public updateData(newData: ResonanceMeterProps): void {
    this.props = newData;
    this.createWhiteWedgeTexture();
    this.createSprites();
    this.createAttunementCircle();
    // Optionally update attunement meter (not shown here)
  }

  /**
   * Draws a donut-shaped pie slice (ring segment) on a Phaser.Graphics object.
   * The gap between wedges is a constant angle, so the separation is a 3px arc at both the inner and outer radius.
   */
  private drawDonutSliceOnGraphics(
    gfx: Phaser.GameObjects.Graphics,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number
  ): void {
    const steps = 40;

    const arcStart = startAngle;
    const arcEnd = endAngle;

    gfx.beginPath();

    // Outer arc (from arcStart to arcEnd)
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = arcStart + t * (arcEnd - arcStart);
      const x = Math.cos(angle) * outerRadius;
      const y = Math.sin(angle) * outerRadius;
      if (i === 0) gfx.moveTo(x, y);
      else gfx.lineTo(x, y);
    }

    // Inner arc (from arcEnd to arcStart, reversed)
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const angle = arcStart + t * (arcEnd - arcStart);
      const x = Math.cos(angle) * innerRadius;
      const y = Math.sin(angle) * innerRadius;
      gfx.lineTo(x, y);
    }

    gfx.closePath();
    gfx.fillPath();
  }


  /**
   * Tween all wedge levels to new values, animating color/alpha for changed segments.
   * @param newLevels Array of new levels for each wedge (length must match wedges)
   */
  public tweenWedgeLevels(newLevels: number[]) {
    if (newLevels.length !== this.props.wedges.length) return;

    for (let w = 0; w < this.props.wedges.length; w++) {
      const wedge = this.props.wedges[w];
      const prevLevel = wedge.level;
      const newLevel = newLevels[w];

      if (prevLevel === newLevel) continue;

      wedge.level = newLevel;

      for (let level = 0; level < this.segmentCount; level++) {
        const sprite = this.segmentSprites[w][level];
        const isActive = level < newLevel;
        const wasActive = level < prevLevel;
        const activeTint = wedge.color;
        const inactiveTint = Phaser.Display.Color.IntegerToColor(0x888888);

        if (isActive && !wasActive) {
          // Fade in to active color and alpha
          this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: 180,
            onUpdate: tween => {
              const v = tween.getValue();
              const tint = Phaser.Display.Color.Interpolate.ColorWithColor(
                inactiveTint,
                Phaser.Display.Color.IntegerToColor(activeTint),
                1,
                v
              );
              sprite.setTint(Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b));
              sprite.setAlpha(0.5 + (v * 0.5));
            }
          });

          // Pulse effect
          // sprite.setDepth(999999);
          // const rtScale = 2;
          // const rtSize = (this.outerRadius * 2 + 20) * rtScale;
          // const displaySize = this.outerRadius * 2 + 20;
          // const scale = displaySize / rtSize;
          // this.scene.tweens.add({
          //   targets: sprite,
          //   scale: { from: scale, to: scale * 1.05 },
          //   duration: 120,
          //   yoyo: true,
          //   repeat: 1,
          //   ease: 'Sine.easeInOut',
          //   onComplete: () => sprite.setDepth(0)
          // });
        } else if (!isActive && wasActive) {
          // Fade out to inactive color and alpha
          this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: 180,
            onUpdate: tween => {
              const v = tween.getValue();
              const tint = Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.IntegerToColor(activeTint),
                inactiveTint,
                1,
                v
              );
              sprite.setTint(Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b));
              sprite.setAlpha(1 - (v * 0.5));
            }
          });
        } else {
          // Set color/alpha immediately
          sprite.setTint(isActive ? activeTint : inactiveTint.color);
          sprite.setAlpha(isActive ? 1 : 0.5);
        }
      }
    }
  }
}
