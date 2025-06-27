precision mediump float;

uniform sampler2D uMainSampler;
uniform float uFade;
varying vec2 outTexCoord;

void main() {
    vec4 texColor = texture2D(uMainSampler, outTexCoord);
    texColor.rgb *= uFade;
    gl_FragColor = texColor;
}
