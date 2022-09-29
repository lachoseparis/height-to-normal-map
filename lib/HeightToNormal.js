/* eslint-disable */

import * as THREE from 'three';
import NormalMapShader from './shaders/NormalMapShader';
import VerticalBlurShader from './shaders/VerticalBlurShader';
import HorizontalBlurShader from './shaders/HorizontalBlurShader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

export const NORMA_MAP_TYPES = {
  SOBEL: 'sobel',
  SCHARR: 'scharr',
}

const defaultOptions = {
  invertedRed: false,
  invertedGreen: false,
  invertedSource: false,
  blurSharp: 0,
  strength: 1,
  level: 8.5,
  type: NORMA_MAP_TYPES.SOBEL,
}



export class HeightToNormal {
  #renderer;
  #effectComposer;
  #normalMapUniforms;
  #material;
  #options
  canvas;


  constructor(options) {
    this.canvas = document.createElement('canvas');
    this.#options = { ...defaultOptions, ...options };
    this.#init();
  }

  apply(image, options = {}) {
    const { width, height } = image;
    const texture = this.#getTexture(image);
    this.#normalMapUniforms.tHeightMap.value = texture;
    this.#normalMapUniforms.dimensions.value = [width, height, 0];
    this.#renderer.setSize(width, height);
    this.#effectComposer.setSize(width, height);
    this.#effectComposer.reset(this.#getRenderTarget(width, height));

    const {
      invertedRed,
      invertedGreen,
      invertedSource,
      blurSharp,
      strength,
      level,
      type,
    } = { ...this.#options, ...options };

    this.#invertRed(invertedRed);
    this.#invertGreen(invertedGreen);
    this.#invertSource(invertedSource);
    this.#setBlurSharp(blurSharp, width, height);
    this.#setStrengthAndLevel(strength, level);
    this.#setType(type);

    this.#effectComposer.render(1 / 60);
  }

  #init() {
    const camera = new THREE.OrthographicCamera(1 / -2, 1 / 2, 1 / 2, 1 / -2, 0, 1);
    const scene = new THREE.Scene();
    const normalRenderScene = new RenderPass(scene, camera);

    this.#renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, canvas: this.canvas });
    this.#renderer.setClearColor(0x000000, 0); // the default

    this.#normalMapUniforms = THREE.UniformsUtils.clone(NormalMapShader.uniforms);

    this.#material = new THREE.ShaderMaterial({
      fragmentShader: NormalMapShader.fragmentShader,
      vertexShader: NormalMapShader.vertexShader,
      uniforms: this.#normalMapUniforms,
    });
    this.#material.transparent = true;

    const meshGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    const renderMesh = new THREE.Mesh(meshGeometry, this.#material);
    scene.add(renderMesh);

    this.gaussianShaderY = new ShaderPass(VerticalBlurShader);
    this.gaussianShaderX = new ShaderPass(HorizontalBlurShader);
    this.gaussianShaderX.renderToScreen = true;

    this.#effectComposer = new EffectComposer(this.#renderer, this.#getRenderTarget());
    this.#effectComposer.addPass(normalRenderScene);
    this.#effectComposer.addPass(this.gaussianShaderY);
    this.#effectComposer.addPass(this.gaussianShaderX);

  }
  #getRenderTarget(width, height) {
    return new THREE.WebGLRenderTarget(
      width,
      height,
      {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        stencilBufer: false,
      },
    );
  };
  #getTexture(image) {
    const texture = new THREE.Texture(image);
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping; // eslint-disable-line
    texture.minFilter = texture.magFilter = THREE.NearestFilter; // eslint-disable-line
    texture.anisotropy = 2;
    texture.needsUpdate = true;
    return texture;
  }

  #invertRed(bool) {
    if (bool) {
      this.#normalMapUniforms.invertR.value = -1;
    } else {
      this.#normalMapUniforms.invertR.value = 1;
    }
  }

  #invertGreen(bool) {
    if (bool) {
      this.#normalMapUniforms.invertG.value = -1;
    } else {
      this.#normalMapUniforms.invertG.value = 1;
    }
  }

  #invertSource(bool) {
    if (bool) {
      this.#normalMapUniforms.invertH.value = -1;
    } else {
      this.#normalMapUniforms.invertH.value = 1;
    }
  }

  #setBlurSharp(value, width, height) {
    this.gaussianShaderY.uniforms.v.value = value / width / 5;
    this.gaussianShaderX.uniforms.h.value = value / height / 5;
  }

  #setStrengthAndLevel(strength, level) {
    this.#normalMapUniforms.dz.value = 1.0 / strength * (1.0 + Math.pow(2.0, level)); //  eslint-disable-line
  }

  #setType(type) {
    this.#normalMapUniforms.type.value = (type === 'sobel') ? 0 : 1;
  }

}

export default HeightToNormal;