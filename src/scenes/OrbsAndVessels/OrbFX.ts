import Phaser from 'phaser';

export default class OrbFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  motionBlurShader: any;

  constructor(game: Phaser.Game) {
    super({
      game,
      renderTarget: true,
      fragShader: `
        precision mediump float;

        uniform sampler2D uMainSampler;
        uniform vec2 uTargetCoord;
        uniform float uScale;
        uniform float uAlpha;

        varying vec2 outTexCoord;

        // Particle intensity constants
        const float part_int_div = 40000.;                            // Divisor of the particle intensity. Tweak this value to make the particles more or less bright
        const float part_int_factor_min = 0.1;                        // Minimum initial intensity of a particle
        const float part_int_factor_max = 3.2;                        // Maximum initial intensity of a particle
        const float mp_int = 12.;                                     // Initial intensity of the main particle
        const float dist_factor = 3.;                                 // Distance factor applied before calculating the intensity
        const float ppow = 2.3;                                      // Exponent of the intensity in function of the distance

        // Particle star constants
        const vec2 part_starhv_dfac = vec2(9., 0.32);                 // x-y transformation vector of the distance to get the horizontal and vertical star branches
        const float part_starhv_ifac = 0.25;                          // Intensity factor of the horizontal and vertical star branches
        const vec2 part_stardiag_dfac = vec2(13., 0.61);              // x-y transformation vector of the distance to get the diagonal star branches
        const float part_stardiag_ifac = 0.19;                        // Intensity factor of the diagonal star branches

        // Main function to draw particles, outputs the rgb color.
        vec3 drawParticles(vec2 uv, float timedelta)
        {
            vec3 pcol = vec3(0.);

            // Screen-space offset from sprite center
            vec2 delta = (uv - uTargetCoord) / 1000.0;
            delta /= uScale;
            float dist = length(delta);

            // 8-branch star
            float distv = length(delta * part_starhv_dfac);
            float disth = length(delta * part_starhv_dfac.yx);

            vec2 deltaDiag = 0.7071 * vec2(dot(delta, vec2(1., 1.)), dot(delta, vec2(1., -1.)));
            float distd1 = length(deltaDiag * part_stardiag_dfac);
            float distd2 = length(deltaDiag * part_stardiag_dfac.yx);

            float pint1 =
                1.0 / (dist * dist_factor + 0.015) +
                part_starhv_ifac / (disth * dist_factor + 0.01) +
                part_starhv_ifac / (distv * dist_factor + 0.01) +
                part_stardiag_ifac / (distd1 * dist_factor + 0.01) +
                part_stardiag_ifac / (distd2 * dist_factor + 0.01);

            if (part_int_factor_max * pint1 > 6.0) {
                float pint = part_int_factor_max * (pow(pint1, ppow) / part_int_div) * mp_int;
                pcol += vec3(pint, pint, pint);
            }

            return pcol;
        }

        void main(void)
        {
            vec2 fragCoord = gl_FragCoord.xy;
            vec2 uv = outTexCoord;
            vec3 pcolor = texture2D(uMainSampler, uv).rgb;

            pcolor += drawParticles(fragCoord, 0.) * uAlpha;
            gl_FragColor = vec4(pcolor, 0.);
        }
      `
    });
  }

  onPreRender() {
    const sprite = this.gameObject as Phaser.GameObjects.Sprite;
    const scale = sprite.scene.scale;

    const screenX = sprite.x;
    const screenY = scale.height - sprite.y;

    this.set2f('uTargetCoord', screenX, screenY);
    this.set1f('uScale', sprite.scale * 2);
    this.set1f('uAlpha', sprite.alpha);
  }
}
