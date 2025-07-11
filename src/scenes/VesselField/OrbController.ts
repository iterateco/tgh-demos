import Phaser from 'phaser';
import { OrbSprite } from './OrbSprite';
import { SceneController } from './SceneController';
import { AppScene, FieldEntity, OrbEntity } from './types';

const MOVE_CONFIG = {
  x: {
    freq: [0.4, 0.66, 0.78],
    amp: [0.8, 0.24, 0.18],
    phase: [0., 45., 55.],
  },
  y: {
    freq: [0.415, 0.61, 0.82],
    amp: [0.72, 0.28, 0.15],
    phase: [90, 120, 10],
  },
  midPoint: new Phaser.Math.Vector2(0.35, 0.15),
  scale: new Phaser.Math.Vector2(400, 400)
};

export class OrbController extends SceneController {
  entities: FieldEntity[] = [];
  orbRotation = 0;

  sprites!: Phaser.GameObjects.Group;

  constructor(scene: AppScene) {
    super(scene);

    const nebulaShader = scene.add.shader({
      name: 'nebula_tex',
      fragmentSource: NEBULA_SHADER,
      setupUniforms: (setUniform: any) => {
        setUniform('time', scene.game.loop.getDuration());
      }
    }, 0, 0, 512, 512);
    nebulaShader.setRenderToTexture('nebula');

    const burstShader = scene.add.shader({
      name: 'burst_tex',
      fragmentSource: BURST_SHADER,
      setupUniforms: (setUniform: any) => {
        setUniform('time', scene.game.loop.getDuration());
      }
    }, 0, 0, 512, 512);
    burstShader.setRenderToTexture('burst');

    this.sprites = scene.add.group({
      classType: OrbSprite,
    });
  }

  update(_time: number, _delta: number) {
    this.orbRotation += 0.005;
  }

  createEntity(_id: number) {
    const archetype = Phaser.Math.RND.pick(this.scene.dataProvider.emotionalArchetypes);
    const color = archetype.color;

    const orb: OrbEntity = {
      type: 'orb',
      archetype,
      color,
      // r: (Phaser.Math.RND.frac() * 0.6 + 0.4) * 150,
      r: 120,
      prevOffset: new Phaser.Math.Vector2(),
      offset: new Phaser.Math.Vector2(),
      seed: Phaser.Math.RND.frac(),
      transitionFactor: 1,
    };
    this.entities.push(orb);
    return orb;
  }

  updateEntity(entity: OrbEntity, time: number, _delta: number) {
    const t = (time + entity.seed * 9999) * 0.0006;
    const { x, y, midPoint, scale } = MOVE_CONFIG;
    const ppos = new Phaser.Math.Vector2(
      harms(x.freq, x.amp, x.phase, t),
      harms(y.freq, y.amp, y.phase, t)
    )
      .add(midPoint)
      .multiply(scale);

    entity.prevOffset = entity.offset;
    entity.offset = ppos;
  }

  drawSprite(
    params: {
      id: string
      entity: FieldEntity
      x: number
      y: number
      scale: number
      alpha: number
      depth: number
    }
  ) {
    const entity = params.entity as OrbEntity;
    const { color, offset } = entity;
    const x = params.x + offset.x * params.scale;
    const y = params.y + offset.y * params.scale;

    let sprite: OrbSprite;
    const matches = this.sprites.getMatching('entity', entity) as OrbSprite[];
    if (matches.length) {
      sprite = matches[0];
    } else {
      sprite = this.sprites.get();
    }

    sprite
      .update({
        ...params,
        color,
        transitionFactor: entity.transitionFactor
      })
      .setPosition(x, y);

    if (params.alpha > 0.5) {
      sprite.setInteractive();
    } else {
      sprite.disableInteractive();
    }

    sprite.id = params.id;
    sprite.entity = entity;
  }
}

const NEBULA_SHADER = `
// Based on https://www.shadertoy.com/view/lsf3RH

precision mediump float;

uniform float time;
uniform vec3 uColor;

varying vec2 outTexCoord;

#define iTime time

float snoise(vec3 uv, float res)
{
	const vec3 s = vec3(1e0, 1e2, 1e3);

	uv *= res;

	vec3 uv0 = floor(mod(uv, res))*s;
	vec3 uv1 = floor(mod(uv+vec3(1.), res))*s;

	vec3 f = fract(uv); f = f*f*(3.0-2.0*f);

	vec4 v = vec4(uv0.x+uv0.y+uv0.z, uv1.x+uv0.y+uv0.z,
		      	  uv0.x+uv1.y+uv0.z, uv1.x+uv1.y+uv0.z);

	vec4 r = fract(sin(v*1e-1)*1e3);
	float r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);

	r = fract(sin((v + uv1.z - uv0.z)*1e-1)*1e3);
	float r1 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);

	return mix(r0, r1, f.z)*2.-1.;
}

void main(void)
{
    vec2 uv = outTexCoord;

    // Centered and aspect-correct coordinates in range [-0.75, 0.75]
    vec2 p = (uv - 0.5) * 1.5;

    float aspect = 1.0; // square output assumed (512x512)
    p.x *= aspect;

    float color = 3.0 - (3.0 * length(2.0 * p));

    vec3 coord = vec3(atan(p.x, p.y) / 6.2832 + 0.5, length(p) * 0.4, 0.5);

    float detail = 8.0;
    float otherThing = 2.0;

    for (int i = 1; i <= 3; i++) {
        float power = pow(2.0, float(i));
        color += (otherThing / power) * snoise(coord + vec3(0.0, -iTime * 0.1, iTime * 0.01), power * detail);
    }

    vec3 finalColor = vec3(0.25) * pow(max(color, 0.0), 1.2);

    float dist = length(uv - 0.5);
    float alpha = smoothstep(0.5, 0.0, dist);

    gl_FragColor = vec4(finalColor * alpha, 0.0);
}
`;

const BURST_SHADER = `
precision mediump float;

uniform float time;
uniform sampler2D uMainSampler;

varying vec2 outTexCoord;

#define iTime time;

// Particle intensity constants
const float part_int_div = 40000.;                            // Divisor of the particle intensity. Tweak this value to make the particles more or less bright
const float part_int_factor_min = 0.1;                        // Minimum initial intensity of a particle
const float part_int_factor_max = 3.2;                        // Maximum initial intensity of a particle
const float mp_int = 16.;                                     // Initial intensity of the main particle
const float dist_factor = 2.;                                 // Distance factor applied before calculating the intensity
const float ppow = 2.3;                                      // Exponent of the intensity in function of the distance

// Particle star constants
const vec2 part_starhv_dfac = vec2(9., 0.32);                 // x-y transformation vector of the distance to get the horizontal and vertical star branches
const float part_starhv_ifac = 0.25;                          // Intensity factor of the horizontal and vertical star branches
const vec2 part_stardiag_dfac = vec2(13., 0.61);              // x-y transformation vector of the distance to get the diagonal star branches
const float part_stardiag_ifac = 0.19;                        // Intensity factor of the diagonal star branches
const float pulse_speed = 4.0;

// Main function to draw particles, outputs the rgb color.
vec3 drawParticles(vec2 uv, float timedelta)
{
    vec3 pcol = vec3(0.);
    vec2 ppos = vec2(0.5, 0.5);
    float dist = distance(uv, ppos);

    // Draws the eight-branched star
    // Horizontal and vertical branches
    vec2 uvppos = uv - ppos;
    float distv = distance(uvppos*part_starhv_dfac + ppos, ppos);
    float disth = distance(uvppos*part_starhv_dfac.yx + ppos, ppos);
    // Diagonal branches
    vec2 uvpposd = 0.7071*vec2(dot(uvppos, vec2(1., 1.)), dot(uvppos, vec2(1., -1.)));
    float distd1 = distance(uvpposd*part_stardiag_dfac + ppos, ppos);
    float distd2 = distance(uvpposd*part_stardiag_dfac.yx + ppos, ppos);
    // Middle point intensity star inensity
    float pint1 = 1./(dist*dist_factor + 0.015) + part_starhv_ifac/(disth*dist_factor + 0.01) + part_starhv_ifac/(distv*dist_factor + 0.01) + part_stardiag_ifac/(distd1*dist_factor + 0.01) + part_stardiag_ifac/(distd2*dist_factor + 0.01);

    if (part_int_factor_max*pint1>6.)
    {
        float pulse = 0.75 + 0.25 * sin(time * pulse_speed);
        float pint = pulse * part_int_factor_max*(pow(pint1, ppow)/part_int_div)*mp_int;
        pcol+= vec3(pint, pint, pint);
    }

    return pcol;
}

void main(void)
{
    vec2 uv = outTexCoord.xy;
    vec3 pcolor = vec3(0.0);

    pcolor += drawParticles(uv, 0.);
    gl_FragColor = vec4(pcolor, 0.);
}
`;

function harms(freq: number[], amp: number[], phase: number[], time: number) {
  const twopi = 6.28319;
  let val = 0;
  for (let h = 0; h < 3; h++) {
    val += amp[h] * Math.cos(time * freq[h] * twopi + phase[h] / 360 * twopi);
  }
  return (1 + val) / 2;
}
