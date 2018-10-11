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
* Final isosurface rendering material for CT dataset
* @module lib/scripts/gfx/matvolumerender
*/

// ******************************************************************
// imports
// ******************************************************************

import * as BABYLON from 'babylonjs';

const VOL_RENDER_VERTEX_SHADER = './shaders/volumerender2.0.vert';
const VOL_RENDER_FRAGMENT_SHADER = './shaders/volumerender2.0.frag';

/** Class @class MaterialVolumeRender for create skull volume render shader material based on WebGL 2.0 */
export default class MaterialVolumeRender {

  constructor(assetsManager) {
    this.assetsManager = assetsManager;
  }

  /** Simple material constructor
  * @return {object} Three.js material with this shader
  */
  create(scene) {
    const vsTask = this.assetsManager.addTextFileTask('volume2.0 vshader', VOL_RENDER_VERTEX_SHADER);
    vsTask.onSuccess = function(task) {
      BABYLON.Effect.ShadersStore['volume2.0VertexShader'] = task.text;
    };
    const psTask = this.assetsManager.addTextFileTask('volume2.0 pshader', VOL_RENDER_FRAGMENT_SHADER);
    psTask.onSuccess = function(task) {
      BABYLON.Effect.ShadersStore['volume2.0FragmentShader'] = task.text;
    };
    const shaderMaterial = new BABYLON.ShaderMaterial('volume2.0', scene, {
      vertex: 'volume2.0',
      fragment: 'volume2.0',
    },
    {
      attributes: ['position'],
      uniforms: ['worldViewProjection', 
        'stepSize',
        't_function1min',
        't_function1max',
        't_function2min',
        't_function2max',
        'isoThreshold',
        'opacityBarrier',
        'brightness3D',
        'contrast3D',
        'texSize',
        'isoSurfTexel',
        'lightDir',
        'stepSize'],
    });
    shaderMaterial.backFaceCulling = true;
    shaderMaterial.setVector4('stepSize', new BABYLON.Vector4(0.0, 0.0, 0.0, 0.0));
    return shaderMaterial;
  }
}
