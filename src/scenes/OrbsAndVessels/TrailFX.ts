import Phaser from 'phaser';

export default class TrailFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({
      game,
      renderTarget: true,
      fragShader: `
        precision mediump float;

        uniform sampler2D uMainSampler;
        varying vec2 outTexCoord;

        void main() {
            vec2 uv = outTexCoord;
            vec2 center = vec2(0.5, 0.5);
            vec2 blurDir = vec2(0.0, 0.0) * 0.002;

            vec4 baseColor = texture2D(uMainSampler, uv);

            vec4 trail = vec4(0.0);
            float totalWeight = 0.0;

            const int TRAIL_STEPS = 8;
            const float shrinkAmount = 0.6;

            for (int i = 1; i <= TRAIL_STEPS; i++) {
                float f = float(i) / float(TRAIL_STEPS); // from 0.125 to 1.0
                float scale = 1.0 - f * shrinkAmount;

                // Step 1: move back along velocity
                vec2 offset = -blurDir * f;

                // Step 2: apply shrinking around center
                vec2 trailUV = uv + offset;
                vec2 scaledUV = center + (trailUV - center) * scale;

                // Sample and fade
                vec4 sample = texture2D(uMainSampler, scaledUV);
                float weight = 1.0 - f;
                trail += sample * weight;
                totalWeight += weight;
            }

            trail /= totalWeight;

            gl_FragColor = baseColor + trail;
        }
      `
    });
  }
}
