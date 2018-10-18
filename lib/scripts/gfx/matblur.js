/*
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

/**
* Blur material, used for rendering of blurred volume slices
* @module lib/scripts/gfx/matblur
*/

// ******************************************************************
// imports
// ******************************************************************

// absoulte imports
import * as BABYLON from 'babylonjs';

const BLUR_VERTEX_SHADER = './shaders/blur2.0.vert';
const BLUR_FRAGMENT_SHADER = './shaders/blur2.0.frag';

/** Class @class MaterialBlur for volume slice blurring */
export default class MaterialBlur {

  /** Backface material constructor
  * @constructor
  */
  constructor(assetsManager) {
    this.assetsManager = assetsManager;
    this.attributes = ['position'];
    this.uniforms = ['worldViewProjection',
      'brightness',
      'texelSize',
      'zOffset',
      'blurSigma'];
  }

  /** Simple material constructor
  * @return {object} Three.js material with this shader
  */
  create(scene) {
    const TEX_SIZE = 256.0;
    const TEXEL_SIZE_1_256 = 1.0 / TEX_SIZE;
    const BLUR_SIGMA = 0.8;
    // const CONTRAST = 1.0;
    const BRIGHTNESS = 0.0;
    const ZOFFSET = 0.0;
    const vsTask = this.assetsManager.addTextFileTask('blur vshader', BLUR_VERTEX_SHADER);
    vsTask.onSuccess = function(task) {
      BABYLON.Effect.ShadersStore['blur2.0VertexShader'] = task.text;
    };
    const psTask = this.assetsManager.addTextFileTask('blur pshader', BLUR_FRAGMENT_SHADER);
    psTask.onSuccess = function(task) {
      BABYLON.Effect.ShadersStore['blur2.0FragmentShader'] = task.text;
    };
    const defines = '#define renderRoiMap 0';
    const shaderMaterial = new BABYLON.ShaderMaterial('blur', scene, {
      vertex: 'blur2.0',
      fragment: 'blur2.0'
    },
    {
      attributes: this.attributes,
      uniforms: this.uniforms,
      defines: [defines]
    });
    shaderMaterial.backFaceCulling = true;
    shaderMaterial.setVector3('texelSize', new BABYLON.Vector3(TEXEL_SIZE_1_256, TEXEL_SIZE_1_256, TEXEL_SIZE_1_256));
    shaderMaterial.setFloat('blurSigma', BLUR_SIGMA);
    shaderMaterial.setFloat('brightness', BRIGHTNESS);
    shaderMaterial.setFloat('zOffset', ZOFFSET);

    this.shaderMaterial = shaderMaterial;

    return shaderMaterial;
  }
  setRenderRoiMap(renderRoiMap) {
    // eslint-disable-next-line
    const defines = '#define renderRoiMap ' + renderRoiMap;
    this.shaderMaterial._options.defines =  [defines];
  }
}
