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
* Mesh with 2d text
* @module lib/scripts/graphics2d/meshtext2d
*/

// ******************************************************
// Imports
// ******************************************************

import * as BABYLON from 'babylonjs';

// used for render text into 2d canvas
const CANVAS_SIZE = 512;

export default class MeshText2D {
  // ******************************************************
  // Data
  // ******************************************************
  // static m_textCanvas: HTMLCanvasElement;
  // m_strText: string;

  // ******************************************************
  // Methods
  // ******************************************************

  constructor(strText, textCanvas, textContext) {
    // debug print
    // for (let comp in textCanvas) {
    //   console.log(`textCanvas[${comp}] = ${textCanvas[comp]}`);
    // }

    this.m_strText = strText;
    this.m_textCanvas = textCanvas;
    this.m_textContext = textContext;
    // textCanvas = document.createElement('canvas');
    // textCanvas.width = CANVAS_SIZE;
    // textCanvas.height = CANVAS_SIZE;
    // textContext = textCanvas.getContext('2d');
    this.m_textCanvas.width = CANVAS_SIZE;
    this.m_textCanvas.height = CANVAS_SIZE;
    // console.log('MeshText2D. text canvas is created');
  }

  static getXMin(xc, xAlign, psx) {
    if (xAlign === MeshText2D.ALIGN_LEFT) {
      return xc;
    } else if (xAlign === MeshText2D.ALIGN_RIGHT) {
      return xc - psx;
    } else if (xAlign === MeshText2D.ALIGN_CENTER) {
      return xc - psx * 0.5;
    }
    return 0.0;
  }

  static getXMax(xc, xAlign, psx) {
    if (xAlign === MeshText2D.ALIGN_LEFT) {
      return xc + psx;
    } else if (xAlign === MeshText2D.ALIGN_RIGHT) {
      return xc;
    } else if (xAlign === MeshText2D.ALIGN_CENTER) {
      return xc + psx * 0.5;
    }
    return 0.0;
  }

  static getYMin(yc, yAlign, psy) {
    if (yAlign === MeshText2D.ALIGN_TOP) {
      return yc - psy;
    } else if (yAlign === MeshText2D.ALIGN_BOTTOM) {
      return yc;
    } else if (yAlign === MeshText2D.ALIGN_CENTER) {
      return yc - psy * 0.5;
    }
    return 0.0;
  }

  static getYMax(yc, yAlign, psy) {
    if (yAlign === MeshText2D.ALIGN_TOP) {
      return yc;
    } else if (yAlign === MeshText2D.ALIGN_BOTTOM) {
      return yc + psy;
    } else if (yAlign === MeshText2D.ALIGN_CENTER) {
      return yc + psy * 0.5;
    }
    return 0.0;
  }
  getRenderedTextHeight() {
    return this.m_renderedTextHeight;
  }

  //
  // (xc, yc) should be in [-0.5 .. +0.5]
  //
  updateText(xc, yc, letterHeight, xAlign, yAlign, strTextBackColor, strTextColor, scene) {
    this.m_renderedTextHeight = letterHeight;
    const LETTER_RATIO = 0.75;
    const letterW = letterHeight * LETTER_RATIO;
    let allTextW = letterW * this.m_strText.length;
    if (allTextW < letterHeight) {
      allTextW = letterHeight;
    }
    const ratioWperH = allTextW / letterHeight;

    /*
    const TEX_DIM_W = 512;
    const TEX_DIM_H = Math.floor(TEX_DIM_W / ratioWperH);
    const TEX_NAME = 'TexDynFont';
    const textureLetter = new BABYLON.DynamicTexture(TEX_NAME, { width: TEX_DIM_W, height: TEX_DIM_H }, scene);
    textureLetter.clear();
    const texContext = textureLetter.getContext();
    texContext.clearRect(0, 0, TEX_DIM_W, TEX_DIM_H);
    const FONT = 'bold 36px monospace';
    const X_DS = 20;
    const Y_DS = 40;
    textureLetter.drawText(this.m_strText, X_DS, Y_DS, FONT, strTextColor, strTextBackColor, true, true);
    textureLetter.update();
    */

    // create texture from 2d canvas
    const TEX_NAME = 'TextureFromCanvas2d';
    const textureLetter = new BABYLON.DynamicTexture(TEX_NAME, this.m_textCanvas, scene, true);

    // create material and assign texture on it
    const MAT_NAME = 'MatStdTex';
    const matLet = new BABYLON.StandardMaterial(MAT_NAME, scene);
    matLet.diffuseTexture = textureLetter;
    matLet.diffuseTexture.hasAlpha = true;
    // matLet.opacityTexture = textureLetter;
    matLet.alpha = 1.0;
    matLet.specularColor = BABYLON.Color3.Black();
    this.m_bMaterial = matLet;

    // render pixels itself
    const TEX_DIM_W = CANVAS_SIZE;
    const TEX_DIM_H = CANVAS_SIZE;
    this.m_textContext.fillStyle = strTextBackColor;
    this.m_textContext.fillRect(0, 0, this.m_textCanvas.width, this.m_textCanvas.height);
    this.m_textContext.fillStyle = strTextColor;
    // const FONT = 'bold 30px monospace';
    const FONT = '26px Arial';
    this.m_textContext.font = FONT;
    const Y_LOW = 32;
    this.m_textContext.fillText(this.m_strText, 0, Y_LOW);
    matLet.diffuseTexture.update();

    // check texture (with rendered letters) pixels
    const FOUR = 4;
    const arrBuf = textureLetter.readPixels();
    const arrBufLen = arrBuf.length;
    const numPixelsBuf = TEX_DIM_W * TEX_DIM_H;
    let bpp = 0;
    if (arrBufLen === numPixelsBuf) {
      bpp = 1;
    }
    if (arrBufLen === numPixelsBuf * FOUR) {
      bpp = FOUR;
    }
    if (bpp !== FOUR) {
      console.log(`MeshText2d. Bad pixels from dyn text. bpp = ${bpp}`);
    }
    // console.log(`MeshText2d. bpp = ${bpp}`);
    const MAX_BYTE = 300;
    let rMin = MAX_BYTE, gMin = MAX_BYTE, bMin = MAX_BYTE, aMin = MAX_BYTE;
    let rMax = 0, gMax = 0, bMax = 0, aMax = 0;
    let j = 0;
    for (let i = 0; i < numPixelsBuf; i++) {
      const b = arrBuf[j++];
      const g = arrBuf[j++];
      const r = arrBuf[j++];
      const a = arrBuf[j++];
      rMin = (r < rMin) ? r : rMin;
      gMin = (g < gMin) ? g : gMin;
      bMin = (b < bMin) ? b : bMin;
      aMin = (a < aMin) ? a : aMin;
      rMax = (r > rMax) ? r : rMax;
      gMax = (g > gMax) ? g : gMax;
      bMax = (b > bMax) ? b : bMax;
      aMax = (a > aMax) ? a : aMax;
    }
    // console.log(`MeshText2d. col min = ${rMin}, ${gMin}, ${bMin}, ${aMin}`);
    // console.log(`MeshText2d. col max = ${rMax}, ${gMax}, ${bMax}, ${aMax}`);
    // get texture dim
    let xMin = TEX_DIM_W, yMin = TEX_DIM_W;
    let xMax = 0, yMax = 0;
    const MIN_COLOR = 20;
    j = 0;
    for (let y = 0; y < TEX_DIM_H; y++) {
      for (let x = 0; x < TEX_DIM_W; x++) {
        const b = arrBuf[j++];
        const g = arrBuf[j++];
        const r = arrBuf[j++];
        j++; // const a = arrBuf[j++];
        if ((r > MIN_COLOR) || (g > MIN_COLOR) || (b > MIN_COLOR)) {
          xMin = (x < xMin) ? x : xMin;
          xMax = (x > xMax) ? x : xMax;
          yMin = (y < yMin) ? y : yMin;
          yMax = (y > yMax) ? y : yMax;
        }
      }
    }
    // console.log(`MeshText2d. tex scan min = ${xMin}, ${yMin}`);
    // console.log(`MeshText2d. tex scan max = ${xMax}, ${yMax}`);
    // console.log(`MeshText2d. tex dim = ${TEX_DIM_W} * ${TEX_DIM_H}`);
    const uMin = (xMin - 1) / TEX_DIM_W;
    const uMax = (xMax + 1) / TEX_DIM_W;
    const vMin = (yMin - 1) / TEX_DIM_H;
    const vMax = (yMax + 1) / TEX_DIM_H;

    const psy = letterHeight;
    const psx = psy * ratioWperH;
    this.m_xMin = MeshText2D.getXMin(xc, xAlign, psx);
    this.m_xMax = MeshText2D.getXMax(xc, xAlign, psx);
    this.m_yMin = MeshText2D.getYMin(yc, yAlign, psy);
    this.m_yMax = MeshText2D.getYMax(yc, yAlign, psy);
    // console.log(`MesрText2d. render: ${this.m_xMin}, ${this.m_yMin} -> ${this.m_xMax},${this.m_yMax}`);

    const Z_COORD_TEXT = -0.15;

    const positions = [];
    positions.push(this.m_xMin, this.m_yMin, Z_COORD_TEXT);
    positions.push(this.m_xMax, this.m_yMin, Z_COORD_TEXT);
    positions.push(this.m_xMin, this.m_yMax, Z_COORD_TEXT);
    positions.push(this.m_xMax, this.m_yMax, Z_COORD_TEXT);

    const normals = [];
    normals.push(0.0, 0.0, 1.0);
    normals.push(0.0, 0.0, 1.0);
    normals.push(0.0, 0.0, 1.0);
    normals.push(0.0, 0.0, 1.0);

    const uvCoords = [];
    uvCoords.push(uMin, vMin);
    uvCoords.push(uMax, vMin);
    uvCoords.push(uMin, vMax);
    uvCoords.push(uMax, vMax);

    const indices = [];
    const IND_0 = 0;
    const IND_1 = 1;
    const IND_2 = 2;
    const IND_3 = 3;
    // CC counter clock wise direction
    indices.push(IND_0);
    indices.push(IND_1);
    indices.push(IND_2);
    indices.push(IND_3);
    indices.push(IND_2);
    indices.push(IND_1);
    const OBJ_NAME = 'MeshText2d';
    this.m_bMesh = new BABYLON.Mesh(OBJ_NAME, scene);
    const vertexData = new BABYLON.VertexData();
    vertexData.positions = positions;
    vertexData.normals = normals;
    vertexData.indices = indices;
    vertexData.uvs = uvCoords;
    vertexData.colors = null;
    vertexData.applyToMesh(this.m_bMesh);
    this.m_bMesh.material = this.m_bMaterial;

  } // updateText
}

// MeshText2D.initialize();


MeshText2D.ALIGN_LEFT = 0;
MeshText2D.ALIGN_RIGHT = 1;
MeshText2D.ALIGN_TOP = 2;
MeshText2D.ALIGN_BOTTOM = 3;
MeshText2D.ALIGN_CENTER = 4;

