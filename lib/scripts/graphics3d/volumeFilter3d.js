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
 * 3D volume processing engine: blur, contrast filter
 * @module lib/scripts/graphics3d/volumeFilter3d
 */

import * as THREE from 'three';
import * as BABYLON from 'babylonjs';
import MaterialBlur from '../gfx/matblur';
//import MaterialAO from '../gfx/matAO';

/** Class Graphics3d is used for 3d render */
export default class VolumeFilter3d {

  constructor(bEngine, bScene, assetsManager) {
    // this.renderTexScene = new BABYLON.Scene(bEngine);
    // const assetsManager = new BABYLON.AssetsManager(this.renderTexScene);
    this.renderTexScene = bScene;

    this.blurMatLoader = new MaterialBlur(assetsManager);
    this.bBlurMat = this.blurMatLoader.create(this.renderTexScene);

    this.renderTexScene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
    this.transferFuncTex = null;
    this.selectedRoiTex = null;
    this.roiColorMapTex = null;
    this.quadGeom = BABYLON.MeshBuilder.CreatePlane('blurGeom',
      this.renderTexScene);
    this.quadGeom.material = this.bBlurMat;
    this.quadGeom.visibility = false;
    const c4 = 4;
    this.numRois = 256;
    this.selectedROIs = new Uint8Array(c4 * this.numRois);
    this.numTfPixels = 256;
    this.transferFuncRgba = new Uint8Array(c4 * this.numTfPixels);
    this.texRoiColor = null;
  }

  /**
   * Create 2D texture containing transfer func colors
   */
  createTransferFuncTexture() {
    let alpha = 0;
    const SCALE = 255;
    const SCALE1 = 12.0;
    const SCALE2 = 3.0;
    const A1 = 0.09;
    const A2 = 0.2;
    const A3 = 0.3;
    const A4 = 0.43;
    const A5 = 0.53;
    const a1 = A1 * SCALE;
    const a2 = A2 * SCALE;
    const a3 = A3 * SCALE;
    const a4 = A4 * SCALE;
    const a5 = A5 * SCALE;
    const COLOR_R = 255;
    const COLOR_G = 210;
    const COLOR_B = 180;
    const FOUR = 4;
    for (let pix = 0; pix < this.numTfPixels; pix++) {
      if (pix > a1 && pix < a2) {
        alpha = (pix - a1) / (a2 - a1);
      }
      if (pix > a2 && pix < a3) {
        alpha = (a3 - pix) / (a3 - a2);
      }
      if (pix > a4 && pix < a5) {
        alpha = (pix - a4) / (a5 - a4);
      }
      if (pix > a5) {
        alpha = 1;
      }
      // eslint-disable-next-line
      this.transferFuncRgba[pix * FOUR + 0] = SCALE;
      // eslint-disable-next-line
      this.transferFuncRgba[pix * FOUR + 1] = 0;
      // eslint-disable-next-line
      this.transferFuncRgba[pix * FOUR + 1 + 1] = 0;
      // eslint-disable-next-line
      this.transferFuncRgba[pix * FOUR + 1 + 1 + 1] = SCALE * alpha / SCALE1;
      if (pix > a4) {
        this.transferFuncRgba[pix * FOUR + 0] = COLOR_R;
        // eslint-disable-next-line
        this.transferFuncRgba[pix * FOUR + 1] = COLOR_G;
        // eslint-disable-next-line
        this.transferFuncRgba[pix * FOUR + 1 + 1] = COLOR_B;
        this.transferFuncRgba[pix * FOUR + 1 + 1 + 1] = SCALE * alpha / SCALE2;
      }
    }
    //textureOut = new THREE.DataTexture(this.transferFuncRgba, this.numTfPixels, 1, THREE.RGBAFormat);
    this.transferFuncTex = new BABYLON.RawTexture(this.transferFuncRgba,
      this.numTfPixels,
      1,
      BABYLON.Engine.TEXTUREFORMAT_RGBA,
      this.renderTexScene,
      false, //no mipmaps
      false, //no invertY
      BABYLON.Texture.NEAREST_SAMPLINGMODE,
      BABYLON.Engine.TEXTURETYPE_UNSIGNED_BYTE);
    //textureOut.wrapS = THREE.ClampToEdgeWrapping;
    //textureOut.wrapT = THREE.ClampToEdgeWrapping;
    //textureOut.magFilter = THREE.NearestFilter;
    //textureOut.minFilter = THREE.NearestFilter;
    //textureOut.needsUpdate = true;
    //this.transferFuncTexture = textureOut;
    return this.transferFuncTex;
  }

  /**
   * Creates transfer function color map
   * @param ctrlPts Array of control points of type HEX  = color value
   */
  setTransferFuncColors(ctrlPtsColorsHex) {
    this.transferFuncCtrlPtsRgb = [];
    for (let i = 0; i < ctrlPtsColorsHex.length; i++) {
      const color = new THREE.Color(ctrlPtsColorsHex[i]);
      this.transferFuncCtrlPtsRgb.push(new BABYLON.Vector3(color.r, color.g, color.b));
    }
  }

  /**
   * Creates transfer function color map
   * @param ctrlPts Array of Vector2 where (x,y) = x coordinate in [0, 1], alpha value in [0, 1]
   * //intensity [0,255] opacity [0,1]
   */
  updateTransferFuncTexture(intensities, opacities) {
    for (let curPt = 0; curPt < intensities.length - 1; curPt++) {
      const pixStart = Math.floor(intensities[curPt]);
      const pixEnd = Math.floor(intensities[curPt + 1]);
      for (let pix = pixStart; pix < pixEnd; pix++) {
        const lerpVal = (pix - pixStart) / (pixEnd - pixStart);
        //const color = new THREE.Vector3();
        //color.lerpVectors(this.transferFuncCtrlPtsRgb[curPt],
        //  this.transferFuncCtrlPtsRgb[curPt + 1], lerpVal);
        let color = new BABYLON.Vector3();
        color = BABYLON.Vector3.Lerp(this.transferFuncCtrlPtsRgb[curPt],
          this.transferFuncCtrlPtsRgb[curPt + 1], lerpVal);
        // eslint-disable-next-line
        this.transferFuncRgba[pix * 4 + 0] = color.x * 255;
        // eslint-disable-next-line
        this.transferFuncRgba[pix * 4 + 1] = color.y * 255;
        // eslint-disable-next-line
        this.transferFuncRgba[pix * 4 + 2] = color.z * 255;
        // eslint-disable-next-line
        this.transferFuncRgba[pix * 4 + 3] = (opacities[curPt + 1] * lerpVal + (1.0 - lerpVal) * opacities[curPt]) * 255;
      }
    }
    //this.transferFuncTexture.needsUpdate = true;
    this.transferFuncTex.update(this.transferFuncRgba);
    return this.transferFuncRgba;
  }

  switchToRoiMapRender() {
    this.blurMatLoader.setRenderRoiMap(1);
  }

  switchToVolumeRender() {
    this.blurMatLoader.setRenderRoiMap(0);
  }
  /**
   * Filtering the source data and building the normals on the GPU
   * @param blurSigma Gauss sigma parameter
   */
  /*eslint-disable no-unused-vars*/
  updateVolumeTexture(blurSigma, contrast, brightness, saveFlag) {
    this.bBlurMat.setFloat('blurSigma', blurSigma);
    this.bBlurMat.setFloat('contrast', blurSigma);
    this.bBlurMat.setFloat('brightness', blurSigma);
    this.bBlurMat.setFloat('saveFlag', blurSigma);
    updateTextureBuffer();
    //this.material.uniforms.blurSigma.value = blurSigma;
    //this.material.uniforms.contrast.value = contrast;
    //this.material.uniforms.brightness.value = brightness;
    //this.material.uniforms.blurSigma.needsUpdate = true;
    //this.material.uniforms.save_flag.value = saveFlag;
    //this.rendererBlur.render(this.sceneBlur, this.cameraOrtho, this.bufferTexture);
    //this.copyFrameToTexture();
  }

  /**
   * Filtering the source data and building the normals on the GPU
   * @param blurSigma Gauss sigma parameter
   */
  updateTextureBuffer(reset3dTexture = true) {
    //this.material.uniforms.blurSigma.value = blurSigma;
    //this.material.uniforms.blurSigma.needsUpdate = true;
    //this.bufferTexture.texture = this.updatableTexture;
    //this.rendererBlur.render(this.sceneBlur, this.cameraOrtho, this.bufferTexture);
    //this.copyFrameToTexture();
    // Reset 3dtexture
    if (reset3dTexture) {
      this.updatableTexture.update(this.orig3dVolumeData);
    }
    let texData = null;
    const RgbaBpp = 4;
    if (this.texFormat === BABYLON.Engine.TEXTUREFORMAT_RGBA) {
      texData = new Uint8Array(RgbaBpp * this.xDim * this.yDim * this.zDim);
    }
    if (this.texFormat === BABYLON.Engine.TEXTUREFORMAT_RED) {
      texData = new Uint8Array(this.xDim * this.yDim * this.zDim);
    }
    this.quadGeom.visibility = true;
    for (let z = 0; z < this.zDim; z++) {
      // Compute z-offset in tex3d space
      this.bBlurMat.setFloat('zOffset', z / (this.zDim - 1));
      // Perform render of z slice
      this.renderTarget.render();
      // Get data from the colorBuffer
      const colorBuf = this.renderTarget.readPixels();
      // Copy slice data to rgba buffer
      const zArrayOffs = z * this.xDim * this.yDim;
      for (let pix = 0; pix < this.xDim * this.yDim; pix++) {
        if (this.texFormat === BABYLON.Engine.TEXTUREFORMAT_RGBA) {
          //texData[RgbaBpp * (pix + zArrayOffs)] = colorBuf[RgbaBpp * pix];
          //texData[RgbaBpp * (pix + zArrayOffs) + 1] = colorBuf[RgbaBpp * pix + 1];
          //texData[RgbaBpp * (pix + zArrayOffs) + 2] = colorBuf[RgbaBpp * pix + 2];
          //texData[RgbaBpp * (pix + zArrayOffs) + 3] = colorBuf[RgbaBpp * pix + 3];
          for (let i = 0; i < RgbaBpp; i++) {
            texData[RgbaBpp * (pix + zArrayOffs) + i] = colorBuf[RgbaBpp * pix + i];
          }
        } else {
          texData[pix + zArrayOffs] = colorBuf[RgbaBpp * pix];
        }
      }
    }
    this.quadGeom.visibility = false;
    this.updatableTexture.update(texData);
  }
  /*eslint-enable no-unused-vars*/
  /**
   * Copies the source data into the buffer (bufferRgba) from which the 3� texture is created
   */
  //setBufferRgbaFrom1Byte() {
  //  const OFF0 = 0;
  //  // Fill initial rgba array
  //  for (let yTile = 0; yTile < this.zDimSqrt; yTile++) {
  //    const yTileOff = (yTile * this.yDim) * this.xTex;
  //    for (let xTile = 0; xTile < this.zDimSqrt; xTile++) {
  //      const xTileOff = xTile * this.xDim;
  //      const zVol = xTile + (yTile * this.zDimSqrt);
  //      if (zVol >= this.zDim) {
  //        break;
  //      }
  //      const zVolOff = zVol * this.xDim * this.yDim;
  //      for (let y = 0; y < this.yDim; y++) {
  //        const yVol = y;
  //        const yVolOff = yVol * this.xDim;
  //        for (let x = 0; x < this.xDim; x++) {
  //          const xVol = x;

  //          const offSrc = (xVol + yVolOff + zVolOff);
  //          const valInt = this.arrPixels[offSrc + 0];
  //          const offDst = yTileOff + xTileOff + (y * this.xTex) + x;
  //          this.bufferR[offDst + OFF0] = valInt;
  //          this.bufferTextureCPU[offDst + OFF0] = valInt;
  //        }
  //      }
  //    }
  //  }
  //}

  /**
   * Copies the source data into the buffer (bufferRgba) from which the 3� texture is created
   */
  //setBufferRgbaFrom4Bytes() {
  //  const OFF0 = 0;
  //  // const OFF1 = 1;
  //  // const OFF2 = 2;
  //  const OFF3 = 3;
  //  const BID = 4;
  //  // Fill initial rgba array
  //  for (let yTile = 0; yTile < this.zDimSqrt; yTile++) {
  //    const yTileOff = (yTile * this.yDim) * this.xTex;
  //    for (let xTile = 0; xTile < this.zDimSqrt; xTile++) {
  //      const xTileOff = xTile * this.xDim;
  //      const zVol = xTile + (yTile * this.zDimSqrt);
  //      if (zVol >= this.zDim) {
  //        break;
  //      }
  //      const zVolOff = zVol * this.xDim * this.yDim;
  //      for (let y = 0; y < this.yDim; y++) {
  //        const yVol = y;
  //        const yVolOff = yVol * this.xDim;
  //        for (let x = 0; x < this.xDim; x++) {
  //          const xVol = x;

  //          const offSrc = (xVol + yVolOff + zVolOff) * BID;
  //          const valInt = this.arrPixels[offSrc + 0];
  //          const valRoi = this.arrPixels[offSrc + OFF3];
  //          const offDst = yTileOff + xTileOff + (y * this.xTex) + x;
  //          this.bufferR[offDst + OFF0] = valInt;
  //          this.bufferRoi[offDst + OFF0] = valRoi;
  //        }
  //      }
  //    }
  //  }
  //}

  getOffDstValueByXYZ(mainX, mainY, mainZ) {
    const yTile = Math.floor(mainZ / this.zDimSqrt);
    const xTile = mainZ - this.zDimSqrt * yTile;
    const yTileOff = (yTile * this.yDim) * this.xTex;
    const xTileOff = xTile * this.xDim;

    return yTileOff + (mainY * this.xTex) + xTileOff + mainX;
  }

  erasePixels(x_, y_, z_, size, depth, vDir, isothreshold, startflag, mouseup, normalmode, length) {
    if (mouseup === true) {
      this.resetflag = false;
      this.prevDistance = null;
      return;
    }
    const targetX = Math.floor(x_ * this.xDim);
    const targetY = Math.floor(y_ * this.yDim);
    const targetZ = Math.floor(z_ * this.zDim);

    //console.log(`${Math.abs(this.prevPos - targetX - targetY - targetZ)}`);
    //if ( Math.abs(this.prevPos - (targetX + targetY + targetZ)) <= radius) {
    console.log(`Target: ${targetX}, ${targetY}, ${targetZ}`);
    const normal = new THREE.Vector3();
    const normalGauss = new THREE.Vector3();
    const GAUSS_R = 2;
    const SIGMA = 1.4;
    const SIGMA2 = SIGMA * SIGMA;
    let nX = 0;
    let nY = 0;
    let nZ = 0;
    let normFactor = 0;
    const VAL_2 = 2; // getting normal of surface
    for (let k = -Math.min(GAUSS_R, targetZ); k <= Math.min(GAUSS_R, this.zDim - 1 - targetZ); k++) {
      for (let j = -Math.min(GAUSS_R, targetY); j <= Math.min(GAUSS_R, this.yDim - 1 - targetY); j++) {
        for (let i = -Math.min(GAUSS_R, targetX); i <= Math.min(GAUSS_R, this.xDim - 1 - targetX); i++) {
          // handling voxel:
          // (targetX + i; ,targetY+ j; targetZ + k);
          const gX = targetX + i;
          const gY = targetY + j;
          const gZ = targetZ + k;

          const yTile = Math.floor(gZ / this.zDimSqrt);
          const xTile = gZ - this.zDimSqrt * yTile;
          const yTileOff = (yTile * this.yDim) * this.xTex;
          const xTileOff = xTile * this.xDim;

          const offDst = yTileOff + (gY * this.xTex) + xTileOff + gX;

          const gauss = 1 - Math.exp(-(i * i + j * j + k * k) / (VAL_2 * SIGMA2));
          normFactor += gauss;

          const curVal = this.bufferTextureCPU[offDst];
          nX += curVal * gauss * (-i / SIGMA2);
          nY += curVal * gauss * (-j / SIGMA2);
          nZ += curVal * gauss * (-k / SIGMA2);

        }
      }
    }// end gauss summation
    normalGauss.set(nX / normFactor, nY / normFactor, nZ / normFactor);
    normal.copy(normalGauss);
    if (normalmode === false) { //if tangetial mode - getting direction of view as normal of cylinder
      normal.copy(vDir);
      normal.multiplyScalar(-1.0);
    }

    normal.normalize();
    console.log(`Normal: X: ${normal.x} Y: ${normal.y} Z: ${normal.z}`);

    //const pidivide2 = 90; //pi/2 (just for console output)
    const pi = 180;// pi (just for console output)
    //const radius = 20; //distance between current position and prevPos in which we are allowed to delete

    // Erase data in original texture

    /*console.log(`${Math.abs(new THREE.Vector3(targetX, targetY, targetZ).normalize().x)}
    ${Math.abs(new THREE.Vector3(targetX, targetY, targetZ).normalize().y)}
    ${Math.abs(new THREE.Vector3(targetX, targetY, targetZ).normalize().z)}
    ${Math.abs(pidivide2 - vDir.normalize().angleTo(normalGauss.normalize()) * pi / Math.PI)}`);*/
    const radiusRatio = this.xDim / this.zDim;
    const geometry = new THREE.CylinderGeometry(size, size, depth, pi, depth);
    const mesh = new THREE.Mesh(geometry, null);
    const axis = new THREE.Vector3(0, 0, 1);
    mesh.quaternion.setFromUnitVectors(axis, normal.clone().normalize().multiplyScalar(-1));
    mesh.position.copy(new THREE.Vector3(targetX, targetY, targetZ));

    if (startflag === true) {
      this.prevDistance = length;
      this.resetflag = false;
    }
    this.radius = 0.05;
    //console.log(`${Math.abs(this.prevDistance - length) * 1000}`);
    //console.log(`${this.radius * 1000}`);
    if (this.resetflag === false) {
      if (Math.abs(this.prevDistance - length) < this.radius) {
        this.prevDistance = length;
        this.point = new THREE.Vector3(0, 0, 0);
        this.queue = [];
        this.queue.push(this.point);
        const normalBack = -5;
        let backZ = 0;
        if (normalmode === false) { //some manipulatian with cylinder for tangential mode
          backZ = 0 - Math.round(Math.abs(Math.tan(vDir.normalize().angleTo(normalGauss.normalize()))) * (size));
        } else {
          backZ = normalBack;
        }
        let deleteflag = false;
        while (this.queue.length > 0) {
          this.point = this.queue.pop();
          const RotPoint = this.point.clone();
          RotPoint.applyAxisAngle(new THREE.Vector3(1, 0, 0), -mesh.rotation.x);
          RotPoint.applyAxisAngle(new THREE.Vector3(0, 1, 0), -mesh.rotation.y);
          RotPoint.applyAxisAngle(new THREE.Vector3(0, 0, 1), mesh.rotation.z);
          if (Math.sqrt(RotPoint.x * RotPoint.x + RotPoint.y * RotPoint.y) > size ||
            Math.abs(RotPoint.z) > depth || RotPoint.z < backZ) {
            continue;
          }
          for (let x = this.point.x - 1; x <= this.point.x + 1; x++) {
            for (let y = this.point.y - 1; y <= this.point.y + 1; y++) {
              for (let z = this.point.z - 1; z <= this.point.z + 1; z++) {
                const mainX = targetX + Math.round(x);
                const mainY = targetY + Math.round(y);
                const mainZ = targetZ + Math.round(z / radiusRatio);

                const yTile = Math.floor(mainZ / this.zDimSqrt);
                const xTile = mainZ - this.zDimSqrt * yTile;
                const yTileOff = (yTile * this.yDim) * this.xTex;
                const xTileOff = xTile * this.xDim;

                const offDst = yTileOff + (mainY * this.xTex) + xTileOff + mainX;
                if (this.bufferMask[offDst] === 0) {
                  continue;
                }

                const bitconst = 255.0;
                const borderinclude = 0.01;
                const isoSurfaceBorder = isothreshold * bitconst - borderinclude * bitconst;

                if (this.bufferTextureCPU[offDst] >= isoSurfaceBorder) {
                  deleteflag = true;
                  this.bufferMask[offDst] = 0;
                  this.queue.push(new THREE.Vector3(x, y, z));
                }
              }
            }
          }
        }
        if (deleteflag === true) {
          this.lastSize.push(size);
          this.lastDepth.push(depth);
          this.lastRotationVector.push(new THREE.Vector3(-mesh.rotation.x, -mesh.rotation.y, mesh.rotation.z));
          this.lastTarget.push(new THREE.Vector3(targetX, targetY, targetZ));
          this.lastBackDistance.push(-Math.round(Math.abs(Math.tan(vDir.normalize().angleTo(normalGauss.normalize())))
            * (size)));
        }
        this.updatableTextureMask.needsUpdate = true;
      } else {
        this.resetflag = true;
      }
    }
  }

  undoLastErasing() {
    if (!this.lastSize) {
      return;
    }
    const undoiterations = 10;
    const radiusRatio = this.xDim / this.zDim;
    for (let a = 0; a < undoiterations; a++) {
      if (this.lastTarget.length === 0) {
        this.resetBufferTextureCPU();
        break;
      }
      const targetLast = this.lastTarget.pop();
      const lastRotation = this.lastRotationVector.pop();
      const rxy = Math.round(this.lastSize.pop());
      const lastDepth = this.lastDepth.pop();
      const lastback = this.lastBackDistance.pop();
      this.point = new THREE.Vector3(0, 0, 0);
      this.queue = [];
      this.queue.push(this.point);
      while (this.queue.length > 0) {
        this.point = this.queue.pop();
        const RotPoint = this.point.clone();
        RotPoint.applyAxisAngle(new THREE.Vector3(1, 0, 0), lastRotation.x);
        RotPoint.applyAxisAngle(new THREE.Vector3(0, 1, 0), lastRotation.y);
        RotPoint.applyAxisAngle(new THREE.Vector3(0, 0, 1), lastRotation.z);
        const two = 1;
        const four = 2;
        let coeff = rxy * two;
        if (this.lastTarget.length === 0) {
          coeff = rxy * four;
        }
        if (Math.sqrt(RotPoint.x * RotPoint.x + RotPoint.y * RotPoint.y) > coeff ||
          RotPoint.z > lastDepth || RotPoint.z < lastback) {
          continue;
        }
        for (let x = this.point.x - 1; x <= this.point.x + 1; x++) {
          for (let y = this.point.y - 1; y <= this.point.y + 1; y++) {
            for (let z = this.point.z - 1; z <= this.point.z + 1; z++) {
              const mainX = targetLast.x + Math.round(x);
              const mainY = targetLast.y + Math.round(y);
              const mainZ = targetLast.z + Math.round((z / radiusRatio));

              const yTile = Math.floor(mainZ / this.zDimSqrt);
              const xTile = mainZ - this.zDimSqrt * yTile;
              const yTileOff = (yTile * this.yDim) * this.xTex;
              const xTileOff = xTile * this.xDim;

              const offDst = yTileOff + (mainY * this.xTex) + xTileOff + mainX;
              if (this.bufferMask[offDst] === 0) {
                this.bufferMask[offDst] = 255.0;
                this.queue.push(new THREE.Vector3(x, y, z));
              }
            }
          }
        }
      }
    }
    //this.updatableTextureMask.needsUpdate = true;
  }

  resetBufferTextureCPU() {
    //this.rendererBlur.render(this.sceneBlur, this.cameraOrtho, this.bufferTexture);
    //const gl = this.rendererBlur.getContext();
    //gl.readPixels(0, 0, this.xTex, this.yTex, gl.RGBA, gl.UNSIGNED_BYTE, this.bufferTextureCPU);
    //this.updatableTexture.needsUpdate = true; this.lastSize.push(size);
    for (let y = 0; y < this.yTex; y++) {
      for (let x = 0; x < this.xTex; x++) {
        this.bufferMask[x + y * this.xTex] = 255.0;
      }
    }
    //this.updatableTextureMask.needsUpdate = true;
  }

  /**
   * Create 2D texture containing roi color map
   * @param colorArray 256 RGBA roi colors
   */
  createRoiColorMap(colorArray) {
    if (colorArray !== null) {
      //textureOut = new THREE.DataTexture(colorArray, this.numRois, 1, THREE.RGBAFormat);
      this.roiColorMapTex = new BABYLON.RawTexture(colorArray,
        this.numRois,
        1,
        BABYLON.Engine.TEXTUREFORMAT_RGBA,
        this.renderTexScene,
        false, //no mipmaps
        false, //no invertY
        BABYLON.Texture.NEAREST_SAMPLINGMODE,
        BABYLON.Engine.TEXTURETYPE_UNSIGNED_BYTE);
    } else {
      console.log('No colors found for ROI');
      // eslint-disable-next-line
      const colorROIs = new Uint8Array(4 * this.numRois);
      for (let pix = 0; pix < this.numRois; pix++) {
        // eslint-disable-next-line
        colorROIs[pix * 4 + 0] = 255;
        // eslint-disable-next-line
        colorROIs[pix * 4 + 1] = 0;
        // eslint-disable-next-line
        colorROIs[pix * 4 + 2] = 0;
        // eslint-disable-next-line
        colorROIs[pix * 4 + 3] = 255;
      }
      this.roiColorMapTex = new BABYLON.RawTexture(colorROIs,
        this.numRois,
        1,
        BABYLON.Engine.TEXTUREFORMAT_RGBA,
        this.renderTexScene,
        false, //no mipmaps
        false, //no invertY
        BABYLON.Texture.NEAREST_SAMPLINGMODE,
        BABYLON.Engine.TEXTURETYPE_UNSIGNED_BYTE);
      //textureOut = new THREE.DataTexture(colorROIs, this.numRois, 1, THREE.RGBAFormat);
    }
    //textureOut.wrapS = THREE.ClampToEdgeWrapping;
    //textureOut.wrapT = THREE.ClampToEdgeWrapping;
    //textureOut.magFilter = THREE.NearestFilter;
    //textureOut.minFilter = THREE.NearestFilter;
    //textureOut.needsUpdate = true;
    return this.roiColorMapTex;
  }

  /**
   * Create 2D texture containing selected ROIs
   * @param colorArray 256 RGBA roi colors
   */
  createSelectedRoiMap() {
    const a1 = 100;
    const a2 = 240;
    const c1 = 1;
    const c2 = 2;
    const c3 = 3;
    const BYTES_IN_COLOR = 4;
    for (let pix = 0; pix < this.numRois; pix++) {
      if (pix < a1 || pix > a2) {
        // eslint-disable-next-line
        this.selectedROIs[pix * BYTES_IN_COLOR + 0] = 0;
      } else {
        // eslint-disable-next-line
        this.selectedROIs[pix * BYTES_IN_COLOR + 0] = 255;
      }
      this.selectedROIs[pix * BYTES_IN_COLOR + c1] = 0;
      this.selectedROIs[pix * BYTES_IN_COLOR + c2] = 0;
      this.selectedROIs[pix * BYTES_IN_COLOR + c3] = 0;
    }
    //const textureOut = new THREE.DataTexture(this.selectedROIs, this.numRois, 1, THREE.RGBAFormat);
    //textureOut.wrapS = THREE.ClampToEdgeWrapping;
    //textureOut.wrapT = THREE.ClampToEdgeWrapping;
    //textureOut.magFilter = THREE.NearestFilter;
    //textureOut.minFilter = THREE.NearestFilter;
    //textureOut.needsUpdate = true;
    this.selectedRoiTex = new BABYLON.RawTexture(this.selectedROIs,
      this.numRois,
      1,
      BABYLON.Engine.TEXTUREFORMAT_RGBA,
      this.renderTexScene,
      false, //no mipmaps
      false, //no invertY
      BABYLON.Texture.NEAREST_SAMPLINGMODE,
      BABYLON.Engine.TEXTURETYPE_UNSIGNED_BYTE);
    return this.selectedRoiTex;
  }

  /**
   * Create 2D texture containing selected ROIs
   * @param selectedROIs 256 byte roi values
   */
  updateSelectedRoiMap(selectedROIs) {
    const roiTexelBpp = 4;
    const roiSelectedTrue = 255;
    const roiSelectedFalse = 0;
    for (let pix = 0; pix < this.numRois; pix++) {
      if (selectedROIs[pix]) {
        this.selectedROIs[pix * roiTexelBpp] = roiSelectedTrue;
      } else {
        this.selectedROIs[pix * roiTexelBpp] = roiSelectedFalse;
      }
    }
    // this.material.uniforms.texSegInUse.needsUpdate = true;
    //this.texRoiId.needsUpdate = true;
    //this.rendererBlur.render(this.sceneBlur, this.cameraOrtho, this.bufferTexture);
    //this.copyFrameToTexture();
    this.selectedRoiTex.update(this.selectedROIs);
    this.updateTextureBuffer();
  }

  /**
   * Update roi selection map
   * @param roiId ROI id from 0..255
   * @param selectedState True if roi must be visible
   */
  updateSelectedRoi(roiId, selectedState) {
    const roiTexelBpp = 4;
    const roiChecked = 255;
    const roiUnchecked = 0;
    if (selectedState) {
      this.selectedROIs[roiTexelBpp * roiId] = roiChecked;
    } else {
      this.selectedROIs[roiTexelBpp * roiId] = roiUnchecked;
    }
    //this.material.uniforms.texSegInUse.needsUpdate = true;
    //this.texRoiId.needsUpdate = true;
    //this.rendererBlur.render(this.sceneBlur, this.cameraOrtho, this.bufferTexture);
    //this.copyFrameToTexture();
    this.selectedRoiTex.update(this.selectedROIs);
    this.updateTextureBuffer();
  }

  /**
   * Create 3D texture containing filtered source data and calculated normal values
   * @param engine2d An object that contains all volume-related info
   * @param

   * @param roiColors Array of roi colors in RGBA format
   * @return (object) Created texture
   */
  createUpdatableVolumeTex(engine2d, isRoiVolume, roiColors, bScene) {
    const header = engine2d.m_volumeHeader;
    this.xDim = header.m_pixelWidth;
    this.yDim = header.m_pixelHeight;
    this.zDim = header.m_pixelDepth;
    this.orig3dVolumeData = engine2d.m_volumeData;
    this.renderTarget = new BABYLON.RenderTargetTexture('blur',
      { width: this.xDim, height: this.yDim },
      this.renderTexScene);
    this.renderTarget.renderList.push(this.quadGeom);
    let volume3dTexFormat = BABYLON.Engine.TEXTUREFORMAT_RED;
    //if (engine2d.m_volumeHeader.m_glFormat === KTX_GL_RGBA) {
    if (isRoiVolume) {
      volume3dTexFormat = BABYLON.Engine.TEXTUREFORMAT_RGBA;
      console.log('>> RGBA 3D Texture');
      this.texRoiId = this.createSelectedRoiMap();
      this.texRoiColor = this.createRoiColorMap(roiColors);
      console.log('roi volume textures done');
      this.bBlurMat.setTexture('texSegInUse', this.texRoiId);
      this.bBlurMat.setTexture('texRoiColor', this.texRoiColor);
    }
    this.texFormat = volume3dTexFormat;
    this.updatableTexture = new BABYLON.RawTexture3D(engine2d.m_volumeData,
      this.xDim,
      this.yDim,
      this.zDim,
      volume3dTexFormat,
      bScene,
      false, //no mipmaps
      false, //no invertY
      BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
      BABYLON.Engine.TEXTURETYPE_UNSIGNED_BYTE);
    this.bBlurMat.setTexture('texVolume', this.updatableTexture);
    this.updateTextureBuffer(false);

    return this.updatableTexture;
  }

  /**
   * Create 3D texture containing mask of data which were erase
   * @param engine2d An object that contains all volume-related info
   * @return (object) Created texture
   */
  createUpdatableVolumeMask(engine2d) {
    const header = engine2d.m_volumeHeader;
    const xDim = header.m_pixelWidth;
    const yDim = header.m_pixelHeight;
    const xTex = xDim * this.zDimSqrt;
    const yTex = yDim * this.zDimSqrt;
    const numPixelsBuffer = xTex * yTex;
    this.bufferMask = new Uint8Array(numPixelsBuffer);
    for (let y = 0; y < yTex; y++) {
      for (let x = 0; x < xTex; x++) {
        this.bufferMask[x + y * xTex] = 255.0;
      }
    }
    //this.updatableTextureMask = new THREE.DataTexture(this.bufferMask, this.xTex, this.yTex, THREE.AlphaFormat);
    //this.updatableTextureMask.wrapS = THREE.ClampToEdgeWrapping;
    //this.updatableTextureMask.wrapT = THREE.ClampToEdgeWrapping;
    //this.updatableTextureMask.magFilter = THREE.LinearFilter;
    //this.updatableTextureMask.minFilter = THREE.LinearFilter;
    //this.updatableTextureMask.needsUpdate = true;

    const maskGaussingBufferSize = 131072;
    this.maskGaussingBufferSize = maskGaussingBufferSize;
    this.maskGaussingTempBuf = new Uint8Array(maskGaussingBufferSize);
    return this.updatableTextureMask;
    //this.initRenderer(isRoiVolume, roiColors);
    //return this.bufferTexture.texture;
  }
} // class VolumeFilter3d
