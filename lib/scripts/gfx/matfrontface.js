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
* Frontface material, used for cube frontface rendering
* @module lib/scripts/gfx/matfrontface
*/

// ******************************************************************
// imports
// ******************************************************************

// absoulte imports
import * as BABYLON from 'babylonjs';

const FRONT_FACE_VERTEX_SHADER = './shaders/frontface.vert';
const FRONT_FACE_FRAGMENT_SHADER = './shaders/frontface.frag';

/** Class @class MaterialFF for volume frontface rendering */
export default class MaterialFF {

  /** Frontface material constructor
  * @constructor
  */
  //constructor() {
  //  this.m_strShaderVertex = '';
  //  this.m_strShaderFragment = '';
  //  this.m_uniforms = {
  //    texBF: { type: 't', value: null },
  //    PlaneX: { type: 'v4', value: THREE.Vector4(-1.0, 0.0, 0.0, 0.5) },
  //    PlaneY: { type: 'v4', value: THREE.Vector4(0.0, -1.0, 0.0, 0.5) },
  //    PlaneZ: { type: 'v4', value: THREE.Vector4(0.0, 0.0, -1.0, 0.5) },
  //  };
  //}
  constructor(assetsManager) {
    this.assetsManager = assetsManager;
  }

  /** Frontface material constructor
  * @return {object} Three.js material with this shader
  */
  create(scene) {
    const vsTask = this.assetsManager.addTextFileTask('frontface vshader', FRONT_FACE_VERTEX_SHADER);
    vsTask.onSuccess = function(task) {
      // eslint-disable-next-line
      BABYLON.Effect.ShadersStore['frontfaceVertexShader'] = task.text;
    };
    const psTask = this.assetsManager.addTextFileTask('frontface pshader', FRONT_FACE_FRAGMENT_SHADER);
    psTask.onSuccess = function(task) {
      // eslint-disable-next-line
      BABYLON.Effect.ShadersStore['frontfaceFragmentShader'] = task.text;
    };
    const shaderMaterial = new BABYLON.ShaderMaterial('frontfaceShader', scene, {
      vertex: 'frontface',
      fragment: 'frontface',
    },
    {
      attributes: ['position', 'normal'],
      uniforms: ['worldViewProjection', 'PlaneX', 'PlaneY', 'PlaneZ']
    });
    shaderMaterial.backFaceCulling = true;
    shaderMaterial.setVector4('PlaneX', new BABYLON.Vector4(-1.0, 0.0, 0.0, 0.0));
    shaderMaterial.setVector4('PlaneY', new BABYLON.Vector4(0.0, -1.0, 0.0, 0.0));
    shaderMaterial.setVector4('PlaneZ', new BABYLON.Vector4(0.0, 0.0, -1.0, -1.0));
    return shaderMaterial;
  }
}
