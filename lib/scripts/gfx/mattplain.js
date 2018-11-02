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
* 2d texture simplest render
* @module lib/scripts/gfx/mattplain
*/

// ******************************************************************
// imports
// ******************************************************************

// absoulte imports
// import * as THREE from 'three';
import * as BABYLON from 'babylonjs';


/** Class @class MaterialTexturePlain2d for create artifical volume */
export default class MaterialTexturePlain2d {

  /** Simple material constructor
  * @constructor
  */
  constructor() {
    // eslint-disable-next-line
    const strShaderVertex = 'precision highp float;\n\
uniform mat4 worldViewProjection; \n\
attribute vec3 position; \n\
attribute vec3 normal; \n\
attribute vec2 uv; \n\
\n\
varying vec3 vecNormal;\n\
varying vec3 vecPos;\n\
varying vec2 vecUV;\n\
\n\
void main() {\n\
  vecPos = position;\n\
  vecNormal = normal;\n\
  vecUV = uv;\n\
  gl_Position = worldViewProjection * vec4(position, 1.0); \n\
}';
    // eslint-disable-next-line
    const strShaderFragment = 'precision highp float;\n\
varying vec3 vecNormal;\n\
varying vec3 vecPos;\n\
varying vec2 vecUV;\n\
\n\
uniform sampler2D texture1;\n\
\n\
void main() {\n\
  vec2 texCoord = vecUV;\n\
  vec4 vColTex = texture2D(texture1, texCoord, 0.0);\n\
  float sum = (vColTex.x + vColTex.y + vColTex.z) / 3.0;\n\
  // if (sum < 20.0 / 256.0)\n\
  //   discard;\n\
  gl_FragColor = vec4(vColTex.x, vColTex.y, vColTex.z, sum);\n\
}';
    this.m_strShaderVertex = strShaderVertex;
    this.m_strShaderFragment = strShaderFragment;
  }

  /** Simple material constructor
  * @return {object} Three.js material with this shader
  */
  create(tex, scene) {
    // console.log('MaterialTexturePlain2d. create');
    const SHADER_NAME_VERT = 'matplaneVertexShader';
    const SHADER_NAME_FRAG = 'matplaneFragmentShader';
    BABYLON.Effect.ShadersStore[SHADER_NAME_VERT] = this.m_strShaderVertex;
    BABYLON.Effect.ShadersStore[SHADER_NAME_FRAG] = this.m_strShaderFragment;

    const MAT_NAME_TEX_PLAIN = 'matplane';
    this.m_bMaterial = new BABYLON.ShaderMaterial(MAT_NAME_TEX_PLAIN, scene, {
      vertex: MAT_NAME_TEX_PLAIN,
      fragment: MAT_NAME_TEX_PLAIN
    }, {
      attributes: ['position', 'normal', 'uv'],
      uniforms: ['worldViewProjection', 'texture1']
    });
    this.m_bMaterial.setTexture('texture1', tex);
    this.m_bMaterial.alphaMode = BABYLON.Engine.ALPHA_ADD;

    /*
    this.m_material = new THREE.ShaderMaterial({
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      uniforms: this.m_uniforms,
      vertexShader: this.m_strShaderVertex,
      fragmentShader: this.m_strShaderFragment
    });
    this.m_material.needsUpdate = true;
    */
  }
}
