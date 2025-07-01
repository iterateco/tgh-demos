import Phaser from 'phaser';

export interface WedgeData {
  color: number;
  level: number; // 0 to 3
}

export interface ResonanceMeterProps {
  attunementLife: number; // 0 to 1
  wedges: WedgeData[];
}

export class ResonanceMeter extends Phaser.GameObjects.Graphics {
  private props: ResonanceMeterProps;

  private readonly centerHoleRadius = 20;
  private readonly segmentCount = 3;

  private readonly outerRadius = 100; // Total radius of the pie (adjust as needed)
  private readonly segmentGap = 2; // Gap between concentric segments (pixels)
  private readonly wedgeGapAngle = Phaser.Math.DegToRad(2); // Angular gap between wedges (radians)

  constructor(scene: Phaser.Scene, x: number, y: number, props: ResonanceMeterProps) {
    super(scene, { x, y });
    this.scene = scene;
    this.props = props;

    scene.add.existing(this);
    this.drawPie();
  }

  private drawPie(): void {
    this.clear();

    const { wedges, attunementLife } = this.props;
    const wedgeCount = wedges.length;

    // Calculate thickness of each concentric segment to fit inside outerRadius after center hole
    const segmentThickness = (this.outerRadius - this.centerHoleRadius) / this.segmentCount;

    const fullAngle = Math.PI * 2;
    const totalGapAngle = this.wedgeGapAngle * wedgeCount;
    const usableAngle = fullAngle - totalGapAngle;
    const wedgeAngle = usableAngle / wedgeCount;

    wedges.forEach((wedge, index) => {
      const startAngle = index * (wedgeAngle + this.wedgeGapAngle);
      const endAngle = startAngle + wedgeAngle;

      for (let level = 0; level < this.segmentCount; level++) {
        const innerRadius = this.centerHoleRadius + segmentThickness * level + this.segmentGap / 2;
        const outerRadius = this.centerHoleRadius + segmentThickness * (level + 1) - this.segmentGap / 2;

        const isActive = level < wedge.level;
        const baseColor = Phaser.Display.Color.IntegerToColor(wedge.color);
        const color = isActive
          ? wedge.color
          : Phaser.Display.Color.GetColor(
            baseColor.red * 0.3,
            baseColor.green * 0.3,
            baseColor.blue * 0.3
          );

        this.fillStyle(color, 1);
        this.drawDonutSlice(innerRadius, outerRadius, startAngle, endAngle);
      }

      // Outline glow for fully attuned wedges (level 3)
      // if (wedge.level === 3) {
      //   const outlineRadius = this.outerRadius + 2;
      //   const startAlpha = 0.3;
      //   const steps = 5;

      //   for (let i = steps; i > 0; i--) {
      //     this.lineStyle(3 + i * 2, wedge.color, startAlpha / i);
      //     this.beginPath();
      //     this.arc(0, 0, outlineRadius, startAngle, endAngle, false);
      //     this.strokePath();
      //   }
      // }
    });

    // Draw the white circular attunement meter surrounding the pie
    const meterRadius = this.outerRadius + 10;
    this.lineStyle(6, 0xffffff, 1);
    this.beginPath();
    this.arc(
      0,
      0,
      meterRadius,
      -Phaser.Math.PI_OVER_2,
      fullAngle * attunementLife - Phaser.Math.PI_OVER_2
    );
    this.strokePath();
  }

  public updateData(newData: ResonanceMeterProps): void {
    this.props = newData;
    this.drawPie();
  }

  /**
   * Draws a donut-shaped pie slice (ring segment) with gaps between wedges and segments.
   * @param innerRadius inner radius of the donut slice
   * @param outerRadius outer radius of the donut slice
   * @param startAngle starting angle in radians
   * @param endAngle ending angle in radians
   */
  private drawDonutSlice(
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number
  ): void {
    const steps = 40;
    const angleStep = (endAngle - startAngle) / steps;

    this.beginPath();

    // Outer arc from startAngle to endAngle
    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + i * angleStep;
      const x = Math.cos(angle) * outerRadius;
      const y = Math.sin(angle) * outerRadius;
      if (i === 0) this.moveTo(x, y);
      else this.lineTo(x, y);
    }

    // Inner arc from endAngle back to startAngle (reverse direction)
    for (let i = steps; i >= 0; i--) {
      const angle = startAngle + i * angleStep;
      const x = Math.cos(angle) * innerRadius;
      const y = Math.sin(angle) * innerRadius;
      this.lineTo(x, y);
    }

    this.closePath();
    this.fillPath();
  }
}
