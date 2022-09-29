/* eslint-disable */

const VerticalBlurShader = {

  uniforms: {

    tDiffuse: { type: 't', value: null },
    v: { type: 'f', value: 3.0 / 512.0 },

  },

  vertexShader: [

    'varying vec2 vUv;',

    'void main() {',

    'vUv = uv;',
    'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',

    '}',

  ].join('\n'),

  fragmentShader: [

    'uniform sampler2D tDiffuse;',
    'uniform float v;',

    'varying vec2 vUv;',

    'void main() {',

    'vec4 sum = vec4( 0.0 );',
    'float top4 = vUv.y - 4.0 * v;',
    'float top3 = vUv.y - 3.0 * v;',
    'float top2 = vUv.y - 2.0 * v;',
    'float top1 = vUv.y - 1.0 * v;',
    'float bot1 = vUv.y + 1.0 * v;',
    'float bot2 = vUv.y + 2.0 * v;',
    'float bot3 = vUv.y + 3.0 * v;',
    'float bot4 = vUv.y + 4.0 * v;',

    'top4 = top4 >= 0.0 ? top4 : (1.0 + top4);',
    'top4 = top4 < 1.0  ? top4 : (top4 - 1.0 );',
    'top3 = top3 >= 0.0 ? top3 : (1.0 + top3);',
    'top3 = top3 < 1.0  ? top3 : (top3 - 1.0 );',
    'top2 = top2 >= 0.0 ? top2 : (1.0 + top2);',
    'top2 = top2 < 1.0  ? top2 : (top2 - 1.0 );',
    'top1 = top1 >= 0.0 ? top1 : (1.0 + top1);',
    'top1 = top1 < 1.0  ? top1 : (top1 - 1.0 );',
    'bot1 = bot1 >= 0.0 ? bot1 : (1.0 + bot1);',
    'bot1 = bot1 < 1.0  ? bot1 : (bot1 - 1.0 );',
    'bot2 = bot2 >= 0.0 ? bot2 : (1.0 + bot2);',
    'bot2 = bot2 < 1.0  ? bot2 : (bot2 - 1.0 );',
    'bot3 = bot3 >= 0.0 ? bot3 : (1.0 + bot3);',
    'bot3 = bot3 < 1.0  ? bot3 : (bot3 - 1.0 );',
    'bot4 = bot4 >= 0.0 ? bot4 : (1.0 + bot4);',
    'bot4 = bot4 < 1.0  ? bot4 : (bot4 - 1.0 );',

    'sum += texture2D( tDiffuse, vec2( vUv.x, top4 ) ) * 0.051;',
    'sum += texture2D( tDiffuse, vec2( vUv.x, top3 ) ) * 0.0918;',
    'sum += texture2D( tDiffuse, vec2( vUv.x, top2 ) ) * 0.12245;',
    'sum += texture2D( tDiffuse, vec2( vUv.x, top1 ) ) * 0.1531;',
    'sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;',
    'sum += texture2D( tDiffuse, vec2( vUv.x, bot1 ) ) * 0.1531;',
    'sum += texture2D( tDiffuse, vec2( vUv.x, bot2 ) ) * 0.12245;',
    'sum += texture2D( tDiffuse, vec2( vUv.x, bot3 ) ) * 0.0918;',
    'sum += texture2D( tDiffuse, vec2( vUv.x, bot4 ) ) * 0.051;',
    'if (v > 0.0){',
    '	vec4 srcValue = texture2D( tDiffuse, vec2( vUv.x, vUv.y ) );',
    '	sum = srcValue + srcValue - sum;',
    '}',
    'gl_FragColor = sum;',

    '}',

  ].join('\n'),

};

export default VerticalBlurShader;