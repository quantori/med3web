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
* Backface material, used for cube backface rendering
* @module lib/scripts/gfx/matbackface
*/

// ******************************************************************
// imports
// ******************************************************************

// absoulte imports
import * as BABYLON from 'babylonjs';

const BACK_FACE_VERTEX_SHADER = './shaders/backface.vert';
const BACK_FACE_FRAGMENT_SHADER = './shaders/backface.frag';

/** Class @class MaterialBF for volume backface rendering */
export default class MaterialBF {

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
    const vsTask = this.assetsManager.addTextFileTask('backface vshader', BACK_FACE_VERTEX_SHADER);
    vsTask.onSuccess = function(task) {
      // eslint-disable-next-line
      BABYLON.Effect.ShadersStore['backfaceVertexShader'] = task.text;
      // console.log(task.text);
    };
    // eslint-disable-next-line
    const psTask = this.assetsManager.addTextFileTask('backface pshader', BACK_FACE_FRAGMENT_SHADER);
    psTask.onSuccess = function(task) {
      // eslint-disable-next-line
      BABYLON.Effect.ShadersStore['backfaceFragmentShader'] = task.text;
      // console.log(task.text);
    };
    // eslint-disable-next-line
    const shaderMaterial = new BABYLON.ShaderMaterial('backfaceShader', scene, {
      vertex: 'backface',
      fragment: 'backface',
    },
    {
      attributes: ['position', 'normal'],
      uniforms: ['worldViewProjection']
    });
    shaderMaterial.backFaceCulling = true;
    return shaderMaterial;
  }
}
