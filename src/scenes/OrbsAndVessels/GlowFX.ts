export class GlowFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({
      game,
      fragShader: `
        precision mediump float;

        uniform sampler2D uMainSampler;
        varying vec2 outTexCoord;

        void main() {
            vec4 baseColor = texture2D(uMainSampler, outTexCoord);
            vec2 center = vec2(0.5, 0.5);
            float dist = length(outTexCoord - center);
            float glow = 0.02 / (dist + 0.01);
            vec3 glowColor = vec3(1.0, 0.85, 0.2) * glow;
            vec3 finalColor = baseColor.rgb + glowColor;
            gl_FragColor = vec4(finalColor, baseColor.a);
        }
      `
    });
  }
}
