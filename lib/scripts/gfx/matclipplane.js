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
* Clipping plane material, used for rendering of near camera plane as a part ray-casting pipeline
* @module lib/scripts/gfx/matcliplane
*/

// ******************************************************************
// imports
// ******************************************************************

// absoulte imports
import * as BABYLON from 'babylonjs';

const CLIP_VERTEX_SHADER = './shaders/clipplane.vert';
const CLIP_FRAGMENT_SHADER = './shaders/clipplane.frag';

/** Class @class MaterialClipPlane for volume clip plane rendering */
export default class MaterialClipPlane {

  /** Backface material constructor
  * @constructor
  */
  constructor(assetsManager) {
    this.assetsManager = assetsManager;
  }

  /** Backface material constructor
  * @return {object} Babylon.js material with this shader
  */
  create(scene) {
    // eslint-disable-next-line
    const vsTask = this.assetsManager.addTextFileTask('cutPlane vshader', CLIP_VERTEX_SHADER);
    vsTask.onSuccess = function(task) {
      // eslint-disable-next-line
      BABYLON.Effect.ShadersStore['cutPlaneVertexShader'] = task.text;
      // console.log(task.text);
    };
    // eslint-disable-next-line
    const psTask = this.assetsManager.addTextFileTask('cutPlane pshader', CLIP_FRAGMENT_SHADER);
    psTask.onSuccess = function(task) {
      // eslint-disable-next-line
      BABYLON.Effect.ShadersStore['cutPlaneFragmentShader'] = task.text;
      // console.log(task.text);
    };
    // eslint-disable-next-line
    const shaderMaterial = new BABYLON.ShaderMaterial('cutPlaneShader', scene, {
      vertex: 'cutPlane',
      fragment: 'cutPlane',
    },
    {
      attributes: ['position', 'normal'],
      //uniforms: ['worldViewProjection']
    });
    // shaderMaterial.backFaceCulling = true;
    shaderMaterial.disableDepthWrite = true;
    return shaderMaterial;
  }
}
