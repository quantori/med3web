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
* Low resolution isosurface rendering material for CT dataset.
* Designed for babylon js and webgl2.0
* @module lib/scripts/gfx/matrendertotexture2.0
*/

// ******************************************************************
// imports
// ******************************************************************

// absolute imports
import * as BABYLON from 'babylonjs';

const RENDER_TEXTURE_VERTEX_SHADER = './shaders/rendertotexture.vert';
const RENDER_TEXTURE_FRAGMENT_SHADER = './shaders/rendertotexture.frag';

export default class MaterialLowRes {

  constructor(assetsManager) {
    this.assetsManager = assetsManager;
    this.attributes = ['position'];
    this.uniforms = ['worldViewProjection',
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
      'stepSize'];
    this.isoRenderFlag = 0;
    this.maskFlag = 0;
  }

  /** Simple material constructor
  * @return {object} Three.js material with this shader
  */
  create(scene) {
    const vsTask = this.assetsManager.addTextFileTask('lowres2.0 vshader', RENDER_TEXTURE_VERTEX_SHADER);
    vsTask.onSuccess = function(task) {
      BABYLON.Effect.ShadersStore['lowres2.0VertexShader'] = task.text;
    };
    const psTask = this.assetsManager.addTextFileTask('lowres2.0 pshader', RENDER_TEXTURE_FRAGMENT_SHADER);
    psTask.onSuccess = function(task) {
      BABYLON.Effect.ShadersStore['lowres2.0FragmentShader'] = task.text;
    };
    // eslint-disable-next-line
    let definesCode = '#define isoRenderFlag ' + this.isoRenderFlag;
    // eslint-disable-next-line
    definesCode = definesCode + '\n#define MaskFlag ' + this.maskFlag;
    const shaderMaterial = new BABYLON.ShaderMaterial('lowres', scene, {
      vertex: 'lowres2.0',
      fragment: 'lowres2.0'
    },
    {
      attributes: this.attributes,
      uniforms: this.uniforms,
      defines: [definesCode]
    });
    shaderMaterial.backFaceCulling = true;
    shaderMaterial.setVector4('stepSize', new BABYLON.Vector4(0.0, 0.0, 0.0, 0.0));
    this.shaderMaterial = shaderMaterial;
    return shaderMaterial;
  }
  setIsosurfaceRenderMode(isoRenderFlag) {
    this.isoRenderFlag = isoRenderFlag;
    // eslint-disable-next-line
    let defines = '#define isoRenderFlag ' + this.isoRenderFlag;
    // eslint-disable-next-line
    defines = defines + '\n#define MaskFlag ' + this.maskFlag;
    this.shaderMaterial._options.defines =  [defines];
  }
  setMaskMode(maskFlag) {
    this.maskFlag = maskFlag;
    // eslint-disable-next-line
    let defines = '#define isoRenderFlag ' + this.isoRenderFlag;
    // eslint-disable-next-line
    defines = defines + '\n#define MaskFlag ' + this.maskFlag;
    this.shaderMaterial._options.defines =  [defines];
  }
}
/** Class @class MaterialRenderToTexture for
* rough isosurface computation: a ray-casting optimization
*/
/* export default class MaterialRenderToTexture {
  constructor() {
    this.m_strShaderVertex = '';
    this.m_strShaderFragment = '';
    this.m_uniforms = {
      texTF: { type: 't', value: null },
      texVolume: { type: 't', value: null },
      texRoiId: { type: 't', value: null },
      texRoiColor: { type: 't', value: null },
      RoiVolumeTex: { type: 't', value: null },
      texVolumeMask: { type: 't', value: null },
      texVolumeAO: { type: 't', value: null },
      lightDir: { type: 'v3', value: THREE.Vector3(0.0, 0.0, 0.0) },
      texBF: { type: 't', value: null },
      texFF: { type: 't', value: null },
      t_function1min: { type: 'v4', value: THREE.Vector4(0.0, 0.0, 0.0, 0.0) },
      t_function1max: { type: 'v4', value: THREE.Vector4(0.0, 0.0, 0.0, 0.0) },
      t_function2min: { type: 'v4', value: THREE.Vector4(0.0, 0.0, 0.0, 0.0) },
      t_function2max: { type: 'v4', value: THREE.Vector4(0.0, 0.0, 0.0, 0.0) },
      stepSize: { type: 'v4', value: THREE.Vector4(0.0, 0.0, 0.0, 0.0) },
      texSize: { type: 'f', value: 0.0 },
      isoThreshold: { type: 'f', value: 0.0 },
      brightness3D: { type: 'f', value: 0.0 },
      contrast3D: { type: 'f', value: 0.0 },
      colorMap1D: { type: 't', value: null },
      heatMap1D: { type: 't', value: null },
      opacityBarrier: { type: 'f', value: 0.0 },
      tileCountX: { type: 'f', value: 0.0 },
      volumeSizeZ: { type: 'f', value: 0.0 },
      xDim: { type: 'f', value: 0.0 },
      yDim: { type: 'f', value: 0.0 },
      zDim: { type: 'f', value: 0.0 },
      ssaoOffsets: { type: 'v3v' },
    };
    this.m_defines = {
      isoRenderFlag: 0,
      MaskFlag: 0,
    };
  }
  create(texTF, texVol2d, texVolMask, texVolAO, texBackface, texFrontface, offsets, callbackMat) {
    // Init uniforms
    this.m_uniforms.texTF.value = texTF;
    this.m_uniforms.texVolume.value = texVol2d;
    this.m_uniforms.texVolumeMask.value = texVolMask;
    this.m_uniforms.texVolumeAO.value = texVolAO;
    this.m_uniforms.texBF.value = texBackface;
    this.m_uniforms.texFF.value = texFrontface;
    this.m_uniforms.ssaoOffsets.value = offsets;
    // create shader loaders
    const vertexLoader = new THREE.FileLoader(THREE.DefaultLoadingManager);
    vertexLoader.setResponseType('text');
    const fragmentLoader = new THREE.FileLoader(THREE.DefaultLoadingManager);
    fragmentLoader.setResponseType('text');

    vertexLoader.load(RENDER_TEXTURE_VERTEX_SHADER, (strVertexSh) => {
      this.m_strShaderVertex = strVertexSh;
      // console.log(`Load callback success. text = : ${strVertexSh} ...`);
      fragmentLoader.load(RENDER_TEXTURE_FRAGMENT_SHADER, (strFragmentSh) => {
        this.m_strShaderFragment = strFragmentSh;

        // log
        // {
        //   const strLoaded = JSON.stringify(this.m_strShaderVertex);
        //   console.log(`Readed vertex shader is: ${strLoaded} ...`);
        // }

        const material = new THREE.ShaderMaterial({
          uniforms: this.m_uniforms,
          defines: this.m_defines,
          vertexShader: this.m_strShaderVertex,
          fragmentShader: this.m_strShaderFragment,
          side: THREE.BackSide
        });
        if (callbackMat) {
          callbackMat(material);
        }
      });
    });
  }
}*/
