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
* Simple 2d mode material wiithout texture and lighting, only ambient color used
* @module lib/scripts/gfx/matcolor2d
*/

// ******************************************************************
// imports
// ******************************************************************

// absoulte imports
import * as BABYLON from 'babylonjs';

/** Class @class MaterialColor2d for create 2d lines, etc */
export default class MaterialColor2d {

  /** Simple material constructor
  * @constructor
  * @param (float) r - color component(red) in [0..1]
  * @param (float) g - color component(green) in [0..1]
  * @param (float) b - color component(blue) in [0..1]
  */
  constructor(r, g, b, scene) {
    console.log('MaterialColor2d. create');
    // eslint-disable-next-line
    const strShaderFragment = 'precision highp float;\n\
uniform vec3 colAmb;\n\
void main() {\n\
  gl_FragColor = vec4(colAmb.xyz, 1.0);\n\
}';
    // eslint-disable-next-line
    const strShaderVertex = 'precision highp float;\n\
uniform mat4 worldViewProjection; \n\
// Attributes \n\
attribute vec3 position; \n\
\n\
void main() {\n\
  gl_Position = worldViewProjection * vec4(position, 1.0); \n\
}';
    const SHADER_NAME_VERT = 'matcolor2dVertexShader';
    const SHADER_NAME_FRAG = 'matcolor2dFragmentShader';
    BABYLON.Effect.ShadersStore[SHADER_NAME_VERT] = strShaderVertex;
    BABYLON.Effect.ShadersStore[SHADER_NAME_FRAG] = strShaderFragment;

    const MAT_NAME_COLOR_2D = 'matcolor2d';
    this.m_bMaterial = new BABYLON.ShaderMaterial(MAT_NAME_COLOR_2D, scene, {
      vertex: MAT_NAME_COLOR_2D,
      fragment: MAT_NAME_COLOR_2D
    }, {
      attributes: ['position'],
      uniforms: ['worldViewProjection', 'colAmb']
    });
    this.m_bMaterial.setVector3('colAmb', new BABYLON.Vector3(r, g, b));
  } // constructor
}
