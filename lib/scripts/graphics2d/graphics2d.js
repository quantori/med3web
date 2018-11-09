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
* 2d simplest graphics engine
* @module app/scripts/graphics2d/graphics2d
*/

import * as BABYLON from 'babylonjs';

import MaterialTex2d from '../gfx/mattex2d';
import MaterialColor2d from '../gfx/matcolor2d';
import MeshText2D from './meshtext2d';
import Line2D from './line2d';
import Circle2D from './circle2d';
import PickTool from './picktool';
import ZoomTool from './zoomtool';
import MoveTool from './movetool';
import DistanceTool from './distancetool';
// TODO: restore 2d tools
/*
import AngleTool from './angletool';
import AreaTool from './areatool';
import RectTool from './recttool';
import DeleteTool from './deletetool';
import EditTool from './edittool';
import TextTool from './texttool';
import FilterTool from './filtertool';
import ContrastBrightnessTool from './contrastbrightnesstool';
*/
import VolumeTools from '../loaders/voltools';
import RoiPalette from '../loaders/roipalette';


// ******************************************************************
// Const
// ******************************************************************

const Z_PLANE = 0.0;
const CAM_Z_NEAR = 0.2;
const CAM_Z_FAR = 20.0;
const CAM_Z_POS = -3.0;


/**  @constant {number} SCENE_3D_BACKGROUND_COLOR - backgroudn color for 3d window */
// const SCENE_2D_BACKGROUND_COLOR = 0xbbbbff; // 0x00

/** Possible 2d tools */
const tools2d = {
  INTENSITY: 'intensity',
  DISTANCE: 'distance',
  ANGLE: 'angle',
  AREA: 'area',
  RECT: 'rect',
  TEXT: 'text',
  GRAD: 'grad',
  COBR: 'cobr',
  BIFI: 'bifi',
  ZOOM: 'zoom',
  DELETE: 'delete',
  EDIT: 'edit',
};

// ******************************************************************
// Class
// ******************************************************************


/** Class Graphics2d is used for simple debug style 2d render */
export default class Graphics2d {

  /**
  * Initialize render
  * @param (object) container - object container for 3d rendering
  * @param (int) width - 2d canvas width
  * @param (int) height - 2d canvas height
  * @return {Object} Intsance of this class (singleton)
  */
  constructor(container, width, height) {
    this.m_width = width;
    this.m_height = height;
    this.m_material = null;
    this.m_container = container;

    // create canvas for 2d texts
    this.m_textCanvas = document.createElement('canvas');
    // this.m_textCanvas = canvas;
    const CANVAS_SIZE = 512;
    this.m_textCanvas.width = CANVAS_SIZE;
    this.m_textCanvas.height = CANVAS_SIZE;
    this.m_textContext = this.m_textCanvas.getContext('2d');

    console.log(`Graphics2d create size = ${width} * ${height}`);

    this.m_canvas2d = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
    container.append(this.m_canvas2d);

    //! Volume data
    this.m_volumeHeader = null;
    this.m_volumeData = null;
    this.m_volumeBox = null;
    this.m_volumeInfo = null;
    //! slice level
    this.m_sliderPosition = 0.5;
    //! Slice axis
    this.m_sliceAxis = Graphics2d.SLICE_AXIS_Z;

    // create engine and scene
    const MODE_ANTIALIAS = true;
    this.m_bEngine = new BABYLON.Engine(this.m_canvas2d, MODE_ANTIALIAS);
    this.m_bEngine.setSize(width, height);
    this.m_bScene = new BABYLON.Scene(this.m_bEngine);

    // create assets
    // const assetsManager = new BABYLON.AssetsManager(this.m_bScene);

    // create camera
    const CAM_NAME = 'Camera';
    const TWO = 2;

    // const DIST = 3;
    // this.m_bCamera = new BABYLON.ArcRotateCamera(CAM_NAME,
    //   0, Math.PI / TWO, DIST, BABYLON.Vector3.Zero(), this.m_bScene);
    // this.m_bCamera.attachControl(this.m_canvas2d);

    const SCENE_RANGE = 0.5;
    this.m_xMinFrustum = -SCENE_RANGE;
    this.m_xMaxFrustum = +SCENE_RANGE;
    this.m_yTopFrustum = +SCENE_RANGE;
    this.m_yBotFrustum = -SCENE_RANGE;
    const camPosition = new BABYLON.Vector3(0, 0, CAM_Z_POS);
    this.m_bCamera = new BABYLON.FreeCamera(CAM_NAME, camPosition, this.m_bScene);
    this.m_bCamera.setTarget(BABYLON.Vector3.Zero());
    this.m_bCamera.setEnabled(true);
    this.m_bCamera.zNear = CAM_Z_NEAR;
    this.m_bCamera.zFar = CAM_Z_FAR;
    this.m_bCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    this.m_bCamera.orthoLeft = this.m_xMinFrustum;
    this.m_bCamera.orthoRight = this.m_xMaxFrustum;
    this.m_bCamera.orthoTop = this.m_yTopFrustum;
    this.m_bCamera.orthoBottom = this.m_yBotFrustum;

    this.m_bScene.enableDepthRenderer();

    const LIGHT_NAME = 'lgtObj';
    this.m_bLight = new BABYLON.HemisphericLight(LIGHT_NAME, new BABYLON.Vector3(0, 0, -CAM_Z_POS), this.m_bScene);
    const LGT_INTENS = 0.999;
    this.m_bLight.intensity = LGT_INTENS;

    this.m_matIndex = -1;
    this.m_tileIndex = -1;
    this.m_yTileIndex = -1;
    this.m_xTileIndex = -1;

    this.m_dataTextures = [];
    this.m_materialsTex2d = null;
    this.m_material = null;
    // this.m_materials = [];
    // this.m_pixBuffers = [];

    // BABYLON.RawTexture3D
    this.m_volTexture = null;
    this.m_isRoiVolume = false;

    //construct edit and move tools
    this.m_zoom = 1;
    this.m_savePosX = 0;
    this.m_savePosY = 0;
    this.m_posX = 0;
    this.m_posY = 0;
    this.m_move = false;

    this.m_showTileTexture = false;

    // render text
    // console.log('Graphics2D: before create text');
    // this.m_text = new MeshText2D('Hello, triangle');
    // this.m_text.updateText(-0.99, +0.99, 0.5, 'rgba(0, 150, 0, 255)', 'rgba(255, 0, 0, 255)');
    // this.m_scene.add(this.m_text);

    // prepare for render 2d lines on screen
    const xw = 1.0 / width;
    const yw = 1.0 / height;
    this.m_lineWidth = (xw > yw) ? xw : yw;

    this.m_linesMaterial = null;

    // 2d lines set
    this.m_linesHor = [];
    this.m_linesVer = [];

    this.m_textTime = -1000;
    this.m_text = null;

    this.m_toolType = tools2d.INTENSITY;

    this.m_pickTool = new PickTool(this.m_bScene, this.m_textCanvas, this.m_textContext);
    this.m_zoomTool = new ZoomTool(this.m_zoom);
    this.m_moveTool = new MoveTool(this.m_zoom, this.m_posX, this.m_posY);
    this.m_distanceTool = new DistanceTool(this.m_bScene, this.m_lineWidth, this.m_textCanvas, this.m_textContext);
    /*
    // TODO: restore 2d tools
    this.m_angleTool = new AngleTool(this.m_bScene, this.m_lineWidth);
    this.m_areaTool = new AreaTool(this.m_bScene, this.m_lineWidth);
    this.m_rectTool = new RectTool(this.m_bScene, this.m_lineWidth);
    this.m_textTool = new TextTool(this.m_bScene);
    this.m_deleteTool = new DeleteTool(this.m_bScene, this.m_lineWidth);
    this.m_editTool = new EditTool(this.m_bScene, this.m_lineWidth);
    //this.m_gradTool = new GradTool();
    this.m_contrastBrightTool = new ContrastBrightnessTool();
    this.m_filterTool = new FilterTool();
    */

    // old three js style render
    /*
    if (container.length === 1) {
      // console.log(`container size = ${root3dContainer.offsetWidth} * ${root3dContainer.offsetHeight}`);
      container.append(this.m_renderer.domElement);
    } else {
      console.log('containter with id=med3web-container-2d not found in scene');
    }
    */
    /** Ready counter */
    this.m_readyCounter = 0;
    this.volumeUpdater = null;

    this.m_levelSetMode = false;
    this.m_levelSetCenterPoint = null;
    // these circles are rectangles for now. TO DO: make them circles
    this.m_levelSetCircle = null;

    // m_wProjScreen and m_hProjScreen
    // are parameters, described working rectangle area of rendered texture.
    // Both parameters are in range [0..1]
    // They need to keep correct aspect ratio for 2d image despite n real browser window dimensions
    this.m_wProjScreen = 0.0;
    this.m_hProjScreen = 0.0;

    // create render object
    const OBJ_NAME = 'Obj2d';
    /*
    {
      const NUM_SEGMENTS = 16;
      const SPHERE_DIAMETER = 5;
      this.m_bMesh = BABYLON.Mesh.CreateSphere(OBJ_NAME, NUM_SEGMENTS, SPHERE_DIAMETER, this.m_bScene);
    }
    */

    // Vertices layout in mesh
    //
    //  3-----2
    //  |   / |
    //  |  /  |
    //  | /   |
    //  |/    |
    //  0-----1
    //
    // Texture coord layout
    //
    //  (0,0)------(1,0)
    //    |          |
    //    |          |
    //    |          |
    //    |          |
    //   (0,1)-----(1,1)
    //

    const SIZE_PLANE = 1.0;

    const positions = [];
    const HS = SIZE_PLANE / TWO;
    positions.push(-HS, -HS, Z_PLANE);
    positions.push(+HS, -HS, Z_PLANE);
    positions.push(+HS, +HS, Z_PLANE);
    positions.push(-HS, +HS, Z_PLANE);

    const uvCoords = [];
    uvCoords.push(0.0, 1.0);
    uvCoords.push(1.0, 1.0);
    uvCoords.push(1.0, 0.0);
    uvCoords.push(0.0, 0.0);

    const normals = [];
    const Z_NORMAL = 1.0;
    normals.push(0.0, 0.0, Z_NORMAL);
    normals.push(0.0, 0.0, Z_NORMAL);
    normals.push(0.0, 0.0, Z_NORMAL);
    normals.push(0.0, 0.0, Z_NORMAL);

    // CC clockwise direction for vertices in triangle
    const indices = [];
    const IND_0 = 0;
    const IND_1 = 1;
    const IND_2 = 2;
    const IND_3 = 3;
    indices.push(IND_0);
    indices.push(IND_1);
    indices.push(IND_2);
    indices.push(IND_2);
    indices.push(IND_3);
    indices.push(IND_0);

    this.m_bMesh = new BABYLON.Mesh(OBJ_NAME, this.m_bScene);

    this.m_bVertexData = new BABYLON.VertexData();
    this.m_bVertexData.positions = positions;
    this.m_bVertexData.normals = normals;
    this.m_bVertexData.indices = indices;
    this.m_bVertexData.uvs = uvCoords;
    this.m_bVertexData.colors = null;
    this.m_bVertexData.applyToMesh(this.m_bMesh);

    this.m_bMesh.position = new BABYLON.Vector3(0, 0, 0);
    const matTex = new MaterialTex2d(this.m_bScene);
    this.m_materialsTex2d = matTex.getBabylonMaterial();
    this.m_bMesh.material = this.m_materialsTex2d;


    // test 2d magenta line
    const NEED_TEST_2D_MAGENTA_LINE = false;
    if (NEED_TEST_2D_MAGENTA_LINE) {
      const TEST_COL_R = 0.9;
      const TEST_COL_G = 0.1;
      const TEST_COL_B = 0.7;
      const matCol = new MaterialColor2d(TEST_COL_R, TEST_COL_G, TEST_COL_B, this.m_bScene);
      const testMat = matCol.m_bMaterial;
      const LINE_SCL = 5.0;
      const LW = this.m_lineWidth * LINE_SCL;
      const SOME_W = 0.41;
      const XS = -SOME_W;
      const XE = +SOME_W;
      const YL = 0.0;
      this.m_testLine = new Line2D(this.m_bScene, LW, XS, YL, XE, YL, testMat);
    }

    // test mesh tex 2d
    const NEED_TEST_MESH_TEX2D = false;
    if (NEED_TEST_MESH_TEX2D) {
      // const STR_TEST = 'Hello, text';
      const STR_TEST_A = '0a7543... 78   Person: unga';

      const canvas = this.m_textCanvas;
      const context = this.m_textContext;
      const meshTestA = new MeshText2D(STR_TEST_A, canvas, context);
      const XC = -0.5;
      const YC = +0.5;
      const LET_H = 0.04;
      const STR_BACK_COLOR = 'rgba(2, 2, 2, 0)';
      const STR_TEXT_COLOR = 'rgba(240, 20, 20, 255)';
      meshTestA.updateText(XC, YC, LET_H,
        MeshText2D.ALIGN_LEFT, MeshText2D.ALIGN_TOP,
        STR_BACK_COLOR, STR_TEXT_COLOR, this.m_bScene);
      const STR_TEST_B = 'Some text on screen bottom';
      const meshTestB = new MeshText2D(STR_TEST_B, canvas, context);
      const YB = -0.5;
      meshTestB.updateText(XC, YB, LET_H,
        MeshText2D.ALIGN_LEFT, MeshText2D.ALIGN_BOTTOM,
        STR_BACK_COLOR, STR_TEXT_COLOR, this.m_bScene);
    }

    // test texture
    const NEED_TEST_TEXTURE_CREATE = true;
    if (NEED_TEST_TEXTURE_CREATE) {
      const SZ = 128;
      const bytesSrc = this.createTest3dTexture(SZ, SZ, SZ);
      const BPP = 1;
      this.create3dTexture(BPP, bytesSrc, SZ, SZ, SZ, false);
    } else {
      this.render();
    }
  } // end of constructor

  createTest3dTexture(xDim, yDim, zDim) {
    const TEST_BOX_WORLD_SIZE = 120.0;
    this.m_volumeBox = {
      x: TEST_BOX_WORLD_SIZE,
      y: TEST_BOX_WORLD_SIZE
    };
    const NUM_COLOR_COMPS = 3;
    const MAX_COLOR = 255.0;
    const SCALE13 = MAX_COLOR / NUM_COLOR_COMPS;
    const arrBytes = new Uint8Array(xDim * yDim * zDim);
    let j = 0;
    for (let z = 0; z < zDim; z++) {
      const zv = z / zDim;
      for (let y = 0; y < yDim; y++) {
        const yv = y / yDim;
        for (let x = 0; x < xDim; x++) {
          const xv = x / xDim;
          arrBytes[j++] = Math.floor((xv + yv + zv) * SCALE13);
        } // for (x)
      } // for (y)
    } // for (z)
    return arrBytes;
  }

  setVolumeBox(box) {
    this.m_volumeBox = box;
  }

  create3dTexture(bpp, bytesSrc, xDim, yDim, zDim, isRoiVolume = false) {
    this.m_readyCounter = 0;
    // input is just byte array, not
    // BABYLON.RawTexture3D

    // create own texture
    const MAX_TEX_DIM = 2048;
    if ((xDim <= 0) || (xDim > MAX_TEX_DIM)) {
      console.log(`create3dTexture. strange xDim = ${xDim}`);
    }
    const lenData = bytesSrc.length;
    const numPixels = xDim * yDim * zDim;
    if (lenData !== numPixels * bpp) {
      console.log(`create3dTexture. wrong data format. expected 1 or 4 bpp, but len = ${lenData}`);
    }

    // bytesSrc = this.createTest3dTexture(xDim, yDim, zDim);

    const FOUR = 4;
    const TOO_MUCH = 55555;
    let valMin = TOO_MUCH;
    let valMax = 0;
    const numBytesInTex = numPixels * bpp;
    const arrBytes = new Uint8Array(numBytesInTex);
    for (let i = 0; i < numBytesInTex; i++) {
      const val = bytesSrc[i];
      valMin = (val < valMin) ? val : valMin;
      valMax = (val > valMax) ? val : valMax;
      arrBytes[i] = Math.floor(val);
      // arrBytes[i] = Math.floor(255 * i / numPixels);
    }
    // console.log(`create3dTexture. src data in range [${valMin} ..${valMax}]`);
    const GEN_MIPMAPS = false;
    const INVERT_Y = false;
    const SAMPLING_MODE = BABYLON.Texture.TRILINEAR_SAMPLINGMODE;
    const TEX_TYPE = BABYLON.Engine.TEXTURETYPE_UNSIGNED_BYTE;
    // store arr bytes for MPR mode: texture pixels source
    this.m_arrBytes = arrBytes;
    this.m_bpp = bpp;
    let texFormat = BABYLON.Engine.TEXTUREFORMAT_R;
    if (bpp === FOUR) {
      texFormat = BABYLON.Engine.TEXTUREFORMAT_RGBA;
    }
    this.m_volTexture = new BABYLON.RawTexture3D(arrBytes,
      xDim, yDim, zDim,
      texFormat, this.m_bScene,
      GEN_MIPMAPS, INVERT_Y, SAMPLING_MODE, TEX_TYPE);
    this.m_isRoiVolume = isRoiVolume;
    this.m_materialsTex2d.setTexture('texture3D', this.m_volTexture);
    const IS_TEXTURE_READY = 1;
    this.m_materialsTex2d.setInt('textureReady', IS_TEXTURE_READY);
    if (isRoiVolume) {
      this.m_materialsTex2d.setInt('isRoiVolume', 1);
    } else {
      this.m_materialsTex2d.setInt('isRoiVolume', 0);
    }
    this.m_bMesh.material = this.m_materialsTex2d;
    this.setupRatio();
    // console.log('create3dTexture. render now...');
    this.render();
  }

  setupRatio() {
    if (this.m_volumeBox === null) {
      console.log('Graphics2d.setupRatio() this.m_volumeBox is NULL');
      return;
    }
    console.log(`G2d. setupRatio. volBox = ${this.m_volumeBox.x}, ${this.m_volumeBox.y}`);
    let wPhys = 0.0;
    let hPhys = 0.0;
    if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_Z) {
      // Transverse (Z)
      // w = xDim;
      // h = yDim;
      // const xyDim = xDim * yDim;
      wPhys = this.m_volumeBox.x;
      hPhys = this.m_volumeBox.y;
    } else if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_Y) {
      // Coronal (Y)
      // w = xDim;
      // h = zDim;
      // const xyDim = xDim * yDim;
      wPhys = this.m_volumeBox.x;
      hPhys = this.m_volumeBox.z;
    } else if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_X) {
      // Sagital (X)
      // w = yDim;
      // h = zDim;
      // const xyDim = xDim * yDim;
      wPhys = this.m_volumeBox.y;
      hPhys = this.m_volumeBox.z;
    }
    //
    // fix screen coordinates
    //
    // vD ----- vC
    // |        |
    // |        |
    // vA ----- vB
    const wScreen = this.m_width;
    const hScreen = this.m_height;

    // m_wProjScreen and m_hProjScreen
    // are parameters, described working rectangle area of rendered texture.
    // Both parameters are in range [0..1]
    // They need to keep correct aspect ratio for 2d image despite n real browser window dimensions
    this.m_wProjScreen = wScreen;
    this.m_hProjScreen = this.m_wProjScreen * hPhys / wPhys;
    if (this.m_hProjScreen > hScreen) {
      this.m_hProjScreen = hScreen;
      this.m_wProjScreen = this.m_hProjScreen * wPhys / hPhys;
      if (this.m_wProjScreen > wScreen) {
        console.log('Too bad logic');
      }
    }
    // normalize to [0..1]
    this.m_wProjScreen /= wScreen;
    this.m_hProjScreen /= hScreen;

    console.log(`G2d.setupRatio. wProjScreen = ${this.m_wProjScreen} hProjScreen = ${this.m_hProjScreen}`);

    const wPrjS = this.m_wProjScreen;
    const hPrjS = this.m_hProjScreen;
    const TWO = 2;
    const WH = wPrjS / TWO;
    const HH = hPrjS / TWO;

    const positions = [];
    positions.push(-WH, -HH, Z_PLANE);
    positions.push(+WH, -HH, Z_PLANE);
    positions.push(+WH, +HH, Z_PLANE);
    positions.push(-WH, +HH, Z_PLANE);

    this.m_bVertexData.positions = positions;
    this.m_bVertexData.applyToMesh(this.m_bMesh);
    this.m_bMesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);

    this.createMarkLinesAndText();
  }

  /** Is scene loaded */
  isLoaded() {
    if ((this.m_volumeData === null) || (this.m_volumeHeader === null)) {
      return false;
    }
    const NUM_READY_COUNTERS = 1;
    const isLoaded = (this.m_readyCounter >= NUM_READY_COUNTERS);
    return isLoaded;
  }

  set2dToolType(toolType) {
    // console.log(`G2d.set2dToolType = ${toolType}`);
    this.m_toolType = toolType;
  }

  /**
   * Callback on file loaded
   */
  onFileLoaded() {
    this.m_pickTool.clear();
    this.m_distanceTool.clearLines();
    /*
    // TODO: restore 2d tools
    this.m_angleTool.clearLines();
    this.m_areaTool.clearLines();
    this.m_rectTool.clearLines();
    this.m_textTool.clear();
    this.m_deleteTool.clearLines();
    this.m_editTool.clearLines();
    //this.m_gradTool.clear();
    //this.m_materialsTex2d.m_uniforms.currentGradient.value = this.m_gradTool.m_gradient;
    this.m_contrastBrightTool.clear();
    */

    // old three js render
    /*
    this.m_materialsTex2d.m_uniforms.contrast.value = this.m_contrastBrightTool.m_contrast;
    this.m_materialsTex2d.m_uniforms.brightness.value = this.m_contrastBrightTool.m_brightness;
    this.m_materialsTex2d.m_uniforms.flag.value = false;
    this.m_filterTool.clear();
    this.m_materialsTex2d.m_uniforms.sigma.value = this.m_filterTool.m_sigma;
    //this.m_materialsTex2d.m_uniforms.sigmaB.value = this.m_filterTool.m_sigmaB;
    */
    // invoke render
    this.render();
  }

  clear2DTools() {
    this.m_pickTool.clear();
    this.m_distanceTool.clearLines();
    /*
    // TODO: restore 2d tools
    this.m_angleTool.clearLines();
    this.m_areaTool.clearLines();
    this.m_rectTool.clearLines();
    this.m_textTool.clear();
    this.m_deleteTool.clearLines();
    this.m_editTool.clearLines();
    this.m_contrastBrightTool.clear();
    this.m_filterTool.clear();
    */
    // this.m_gradTool.clear();
    // this.m_materialsTex2d.m_uniforms.currentGradient.value = this.m_gradTool.m_gradient;
    // this.m_materialsTex2d.m_uniforms.contrast.value = this.m_contrastBrightTool.m_contrast;
    // this.m_materialsTex2d.m_uniforms.brightness.value = this.m_contrastBrightTool.m_brightness;
    // this.m_materialsTex2d.m_uniforms.flag.value = false;
    // this.m_materialsTex2d.m_uniforms.sigma.value = this.m_filterTool.m_sigma;
    //this.m_materialsTex2d.m_uniforms.sigmaB.value = this.m_filterTool.m_sigmaB;
  }

  default2DTools() {
    this.m_zoom = 1;
    this.m_posX = 0;
    this.m_posY = 0;
    this.m_savePosX = 0;
    this.m_savePosY = 0;
    this.m_materialsTex2d.setFloat('posX', this.m_posX);
    this.m_materialsTex2d.setFloat('posY', this.m_posY);
    this.m_materialsTex2d.setFloat('zoom', this.m_zoom);
    this.m_zoomTool.makeDefault();
    this.updateLines();
    this.createMarkLinesAndText();
  }


  debugShowSliceFrom3d() {
    const pixelsSrcByte = this.m_volumeData;
    const xDim = this.m_volumeHeader.m_pixelWidth;
    const yDim = this.m_volumeHeader.m_pixelHeight;
    const zDim = this.m_volumeHeader.m_pixelDepth;
    const BYTES_IN_DWORD = 4;
    const lenSrc = pixelsSrcByte.length;
    let bpp = -1;
    if (lenSrc === xDim * yDim * zDim) {
      bpp = 1;
    } else if (lenSrc === xDim * yDim * zDim * BYTES_IN_DWORD) {
      bpp = BYTES_IN_DWORD;
    } else {
      console.log(`DebugShowSlice: Bad 3d texture array size =  ${lenSrc}`);
    }

    const numPixels = xDim * yDim * zDim;

    const OFF_0 = 0; const OFF_1 = 1;
    const OFF_2 = 2; const OFF_3 = 3;
    this.volTexture = new Uint8Array(numPixels * BYTES_IN_DWORD);
    // copy 1 byte volume texture to 4 byte
    let i, j;
    if (bpp === BYTES_IN_DWORD) {
      if (this.m_isRoiVolume) {
        const paletteObj = new RoiPalette();
        const palArray = paletteObj.getPalette256();
        const MAG7 = 7; const MAG4 = 4;
        console.log(`Process debug as palette volume =  ${palArray[MAG7 * MAG4 + 0]}`);
        for (i = 0, j = 0; i < numPixels; i++, j += BYTES_IN_DWORD) {
          const ind = pixelsSrcByte[j + OFF_3];
          const off4 = ind * BYTES_IN_DWORD;
          this.volTexture[j + OFF_0] = palArray[off4 + OFF_0];
          this.volTexture[j + OFF_1] = palArray[off4 + OFF_1];
          this.volTexture[j + OFF_2] = palArray[off4 + OFF_2];
          this.volTexture[j + OFF_3] = palArray[off4 + OFF_3];
        }
      } else {
        for (i = 0, j = 0; i < numPixels; i++, j += BYTES_IN_DWORD) {
          this.volTexture[j + OFF_0] = pixelsSrcByte[j + OFF_0];
          this.volTexture[j + OFF_1] = pixelsSrcByte[j + OFF_1];
          this.volTexture[j + OFF_2] = pixelsSrcByte[j + OFF_2];
          this.volTexture[j + OFF_3] = pixelsSrcByte[j + OFF_3];
        }
      }
    } else {
      // eslint-disable-next-line
      if (this.m_isRoiVolume) {
        const paletteObj = new RoiPalette();
        const palArray = paletteObj.getPalette256();
        const MAG7 = 7; const MAG4 = 4;
        console.log(`Process debug as palette volume =  ${palArray[MAG7 * MAG4 + 0]}`);
        for (i = 0, j = 0; i < numPixels; i++, j += BYTES_IN_DWORD) {
          const ind = pixelsSrcByte[i];
          const off4 = ind * BYTES_IN_DWORD;
          this.volTexture[j + OFF_0] = palArray[off4 + OFF_0];
          this.volTexture[j + OFF_1] = palArray[off4 + OFF_1];
          this.volTexture[j + OFF_2] = palArray[off4 + OFF_2];
          this.volTexture[j + OFF_3] = palArray[off4 + OFF_3];
        }
      } else {
        for (i = 0, j = 0; i < numPixels; i++, j += BYTES_IN_DWORD) {
          this.volTexture[j + OFF_0] = pixelsSrcByte[i];
          this.volTexture[j + OFF_1] = pixelsSrcByte[i];
          this.volTexture[j + OFF_2] = pixelsSrcByte[i];
          this.volTexture[j + OFF_3] = 255;
        }
      } // if not roi volume
    } // if 1 bpp
    // which plane to show: 0 - x plane, 1 - y plane, 2 - z plane
    const PLANE_TO_SHOW = 0;
    // create temporary plane
    const X_SLICE = 0;
    const Y_SLICE = 1;
    const Z_SLICE = 2;
    const TWO = 2;

    if (PLANE_TO_SHOW === X_SLICE) {
      let bufPixels2d = new Uint8Array(yDim * zDim * BYTES_IN_DWORD);
      VolumeTools.extract2dSliceFrom3dTexture(xDim, yDim, zDim, this.volTexture,
        X_SLICE, Math.floor(xDim / TWO), bufPixels2d);
      VolumeTools.showTexture2d(yDim, zDim, bufPixels2d);
      bufPixels2d = null;
    }
    if (PLANE_TO_SHOW === Y_SLICE) {
      let bufPixels2d = new Uint8Array(xDim * zDim * BYTES_IN_DWORD);
      VolumeTools.extract2dSliceFrom3dTexture(xDim, yDim, zDim, this.volTexture,
        Y_SLICE, Math.floor(yDim / TWO), bufPixels2d);
      VolumeTools.showTexture2d(xDim, zDim, bufPixels2d);
      bufPixels2d = null;
    }
    if (PLANE_TO_SHOW === Z_SLICE) {
      let bufPixels2d = new Uint8Array(xDim * yDim * BYTES_IN_DWORD);
      VolumeTools.extract2dSliceFrom3dTexture(xDim, yDim, zDim, this.volTexture,
        Z_SLICE, Math.floor(zDim / TWO), bufPixels2d);
      VolumeTools.showTexture2d(xDim, yDim, bufPixels2d);
      bufPixels2d = null;
    }
    // free memory
    this.volTexture = null;
  }

  debugShowSliceFrom2dTiles() {
    // console.log('debugShowSliceFrom2dTiles START...');
    if (this.volumeUpdater === null) {
      console.log('this.volumeUpdater is NULL!');
    }
    // this.m_volTexture: object of type THREE.DataTexture
    const pixelsSrcTiled = this.volumeUpdater.bufferRgba;

    const xDim = this.m_volumeHeader.m_pixelWidth;
    const yDim = this.m_volumeHeader.m_pixelHeight;
    const zDim = this.m_volumeHeader.m_pixelDepth;
    const BYTES_IN_DWORD = 4;
    const lenSrc = pixelsSrcTiled.length;
    // const zDimSqrt = Math.ceil(Math.sqrt(zDim));
    const TWO = 2;
    const ONE = 1;
    const zDimSqrt = TWO ** (ONE + Math.floor(Math.log(Math.sqrt(zDim)) / Math.log(TWO)));
    const xSize = xDim * zDimSqrt;
    const ySize = yDim * zDimSqrt;
    if (lenSrc !== xSize * ySize * BYTES_IN_DWORD) {
      console.log(`Wrong vol size for debug. Size = ${lenSrc}`);
    }
    // console.log(`zDim = ${zDim}, zDimSqrt = ${zDimSqrt}, arr[0] = ${pixelsSrcTiled[0]}`);
    if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_X) {
      let bufPixels2d = new Uint8Array(yDim * zDim * BYTES_IN_DWORD);
      VolumeTools.extract2dSliceFromTiled3dTexture(xDim, yDim, zDim, pixelsSrcTiled,
        Graphics2d.SLICE_AXIS_X, Math.floor(xDim / TWO), bufPixels2d, this.m_isRoiVolume);
      VolumeTools.showTexture2d(yDim, zDim, bufPixels2d);
      bufPixels2d = null;
    }
    if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_Y) {
      let bufPixels2d = new Uint8Array(xDim * zDim * BYTES_IN_DWORD);
      VolumeTools.extract2dSliceFromTiled3dTexture(xDim, yDim, zDim, pixelsSrcTiled,
        Graphics2d.SLICE_AXIS_Y, Math.floor(yDim / TWO), bufPixels2d, this.m_isRoiVolume);
      VolumeTools.showTexture2d(xDim, zDim, bufPixels2d);
      bufPixels2d = null;
    }
    if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_Z) {
      let bufPixels2d = new Uint8Array(xDim * yDim * BYTES_IN_DWORD);
      VolumeTools.extract2dSliceFromTiled3dTexture(xDim, yDim, zDim, pixelsSrcTiled,
        Graphics2d.SLICE_AXIS_Z, Math.floor(zDim / TWO), bufPixels2d, this.m_isRoiVolume);
      VolumeTools.showTexture2d(xDim, yDim, bufPixels2d);
      bufPixels2d = null;
    }
  }


  fov2Tan(fov) {
    const HALF = 0.5;
    // return Math.tan(THREE.Math.degToRad(HALF * fov));
    const MPI = 3.1415926;
    const ANGLE_180 = 180.0;
    const radFov = HALF * fov * MPI / ANGLE_180;
    return Math.tan(radFov);
  }

  tan2Fov(tan) {
    const TWICE = 2.0;
    const angRad = Math.atan(tan);
    const MPI = 3.1415926;
    const ANGLE_180 = 180.0;
    const angDeg = angRad * ANGLE_180 / MPI;
    return angDeg * TWICE;
  }

  /**
   * Get screen copy image from current render
   *
   * @param {number} width Desired image width
   * @param {number} height Desired image height
   * @return {Object} Image with 3d renderer output (as URI string)
   */
  screenshot(width, height) {
    if (this.m_renderer === null) {
      return null;
    }
    let screenshotImage = null;
    if (typeof width === 'undefined') {
      screenshotImage = this.m_renderer.domElement.toDataURL('image/png');
    } else {
      // width and height are specified
      const originalAspect = this.m_camera.aspect;
      const originalFov = this.m_camera.fov;
      const originalTanFov2 = this.fov2Tan(this.m_camera.fov);

      // screen shot should contain the principal area of interest (a centered square touching screen sides)
      const areaOfInterestSize = Math.min(this.m_width, this.m_height);
      const areaOfInterestTanFov2 = originalTanFov2 * areaOfInterestSize / this.m_height;

      // set appropriate camera aspect & FOV
      const shotAspect = width / height;
      this.m_camera.aspect = shotAspect;
      this.m_camera.fov = this.tan2Fov(areaOfInterestTanFov2 / Math.min(shotAspect, 1.0));
      this.m_camera.updateProjectionMatrix();

      // resize canvas to the required size of screen shot
      this.m_renderer.setSize(width, height);

      // make screen shot
      this.render();
      screenshotImage = this.m_renderer.domElement.toDataURL('image/png');

      // restore original camera & canvas proportions
      this.m_camera.aspect = originalAspect;
      this.m_camera.fov = originalFov;
      this.m_camera.updateProjectionMatrix();
      this.m_renderer.setSize(this.m_width, this.m_height);
      this.render();
    }
    return screenshotImage;
  }

  /**
  * Rescale source volume
  * @param {number} xDim Source volume dimension on x
  * @param {number} yDim Source volume dimension on y
  * @param {number} zDim Source volume dimension on z
  * @param {array} volTexSrc Source volume
  * @param {number} xNew Dest volume dimension on x
  * @param {number} yNew Dest volume dimension on y
  * @param {number} zNew Dest volume dimension on z
  * @return {array} rescaled volumetrioc texture array
  */
  static rescale(xDim, yDim, zDim, volTexSrc, xNew, yNew, zNew) {
    // check old volume size
    const srcLen = volTexSrc.length;
    const numPixSrc = xDim * yDim * zDim;
    if (srcLen !== numPixSrc) {
      console.log(`rescale vol: non 1-byte tex: actsize=${srcLen}, shoulbe=${numPixSrc}`);
    }

    console.log(`Rescale texture ${xDim}*${yDim}*${zDim} -> ${xNew}*${yNew}*${zNew}`);
    const xyDim = xDim * yDim;
    const numPixNew = xNew * yNew * zNew;
    const pixelsNew = new Uint8Array(numPixNew);
    let offDst = 0;
    let xDst, yDst, zDst;
    for (zDst = 0; zDst < zNew; zDst++) {
      const zSrc = Math.floor(zDim * zDst / zNew);
      const zOffSrc = zSrc * xyDim;
      for (yDst = 0; yDst < yNew; yDst++) {
        const ySrc = Math.floor(yDim * yDst / yNew);
        const yOffSrc = ySrc * xDim;
        for (xDst = 0; xDst < xNew; xDst++) {
          const xSrc = Math.floor(xDim * xDst / xNew);
          const offSrc = xSrc + yOffSrc + zOffSrc;
          const val = volTexSrc[offSrc];
          pixelsNew[offDst++] = val;
        }   // for (xDst)
      }     // for (yDst)
    }       // for (zDst)
    return pixelsNew;
  }

  /**
   * Enable level set mode of scene
   */
  enableLevelSetMode() {
    this.m_levelSetMode = true;
  }
  /**
   * Disable level set mode of scene
   */
  disableLevelSetMode() {
    this.clearLevelSetCenter();
    this.clearLevelSetCircle();
    this.m_levelSetMode = false;
  }

  /**
   * Transform level set central point coordinate from [-1, 1] to voxel coordinates of data
   * @return {Object} transformed voxel coordinates
   */
  getLevelSetCenterVoxelCoordinates() {
    const xRatioImage = (this.m_levelSetCenterPoint.x + 1.0) * 0.5 / this.m_wProjScreen;
    const yRatioImage = (1.0 - (this.m_levelSetCenterPoint.y + 1.0) * 0.5) / this.m_hProjScreen;

    const xDim = this.m_volumeHeader.m_pixelWidth;
    const yDim = this.m_volumeHeader.m_pixelHeight;
    const zDim = this.m_volumeHeader.m_pixelDepth;

    let w = 0;
    let h = 0;

    let x = 0;
    let y = 0;
    let z = 0;

    switch (this.m_sliceAxis) {
      case Graphics2d.SLICE_AXIS_X:
        w = yDim;
        h = zDim;
        y = Math.floor(xRatioImage * w);
        z = Math.floor(yRatioImage * h);
        x = Math.floor(this.m_sliderPosition * xDim);
        x = (x <= xDim - 1) ? x : (xDim - 1);
        break;
      case Graphics2d.SLICE_AXIS_Y:
        w = xDim;
        h = zDim;
        x = Math.floor(xRatioImage * w);
        z = Math.floor(yRatioImage * h);
        y = Math.floor(this.m_sliderPosition * yDim);
        y = (y <= yDim - 1) ? y : (yDim - 1);
        break;
      case Graphics2d.SLICE_AXIS_Z:
        w = xDim;
        h = yDim;
        x = Math.floor(xRatioImage * w);
        y = Math.floor(yRatioImage * h);
        z = Math.floor(this.m_sliderPosition * zDim);
        z = (z <= zDim - 1) ? z : (zDim - 1);
        break;
      default:
        console.log('Unexpected slice axis');
    }
    return { 'x': x, 'y': y, 'z': z };
  }

  /**
   * Draw level set central point as a small circle
   * @param {number} x Coordinate in [-1, 1]
   * @param {number} y Coordinate in [-1, 1]
   */
  drawLevelSetCenter(x, y) {
    const w2d = Math.floor(this.m_width);
    const h2d = Math.floor(this.m_height);
    const TWICE = 2.0;
    const RADIUS_3 = 3.0;
    const xRadius = RADIUS_3 / w2d * TWICE;
    const yRadius = RADIUS_3 / h2d * TWICE;

    const xCenter = (x - this.m_posX) / this.m_zoom - (1 - 1 / this.m_zoom);
    const yCenter = (y - this.m_posY) / this.m_zoom + (1 - 1 / this.m_zoom);

    const LW = this.m_lineWidth;
    const circle = new Circle2D(this.m_bScene, LW, xCenter, yCenter, xRadius, yRadius, this.m_linesMaterial);
    this.m_levelSetCircle = circle;
    this.m_levelSetCenterPoint = { 'x': xCenter, 'y': yCenter };
    // console.log(`drawLevelSetCenter. xC = ${xCenter}, yC = ${yCenter}`);
    // console.log(`drawLevelSetCenter. xR = ${xRadius}, yR = ${yRadius}`);
  }

  /**
   * Draw level set circle with center in this.m_levelSetCenterPoint and given radius
   * @param {number} radius Circle radius in volxels
   */
  drawLevelSetCircle(radius) {
    const xCenter = this.m_levelSetCenterPoint.x;
    const yCenter = this.m_levelSetCenterPoint.y;
    const w2d = Math.floor(this.m_width);
    const h2d = Math.floor(this.m_height);
    const TWICE = 2.0;
    let xRatio = 1.0;
    let yRatio = 1.0;
    switch (this.m_sliceAxis) {
      case Graphics2d.SLICE_AXIS_X:
        xRatio = w2d / this.m_volumeHeader.m_pixelHeight;
        yRatio = h2d / this.m_volumeHeader.m_pixelDepth;
        break;
      case Graphics2d.SLICE_AXIS_Y:
        xRatio = w2d / this.m_volumeHeader.m_pixelWidth;
        yRatio = h2d / this.m_volumeHeader.m_pixelDepth;
        break;
      case Graphics2d.SLICE_AXIS_Z:
        xRatio = w2d / this.m_volumeHeader.m_pixelWidth;
        yRatio = h2d / this.m_volumeHeader.m_pixelHeight;
        break;
      default:
        console.log('Unexpected slice axis');
    }
    xRatio *= this.m_wProjScreen;
    yRatio *= this.m_hProjScreen;
    const xRadius = radius * xRatio / w2d * TWICE;
    const yRadius = radius * yRatio / h2d * TWICE;
    // const LW = 0.03;
    const LW = this.m_lineWidth;
    const circle = new Circle2D(this.m_bScene, LW, xCenter, yCenter, xRadius, yRadius, this.m_linesMaterial);
    this.m_levelSetCircle = circle;
  }

  /**
   * Clear level set center
   */
  clearLevelSetCenter() {
    if (this.m_levelSetCircle !== null) {
      this.m_bScene.removeMesh(this.m_levelSetCircle.getRenderObject());
      this.m_levelSetCircle = null;
      this.m_levelSetCenterPoint = null;
    }
  }

  /**
   * Clear level set circle
   */
  clearLevelSetCircle() {
    if (this.m_levelSetCircle !== null) {
      this.m_bScene.removeMesh(this.m_levelSetCircle.getRenderObject());
      this.m_levelSetCircle = null;
    }
  }


  /**
  * Keyboard event handler
  * @param (number) keyCode - keyboard code
  * @param (Boolean) debug - true if debug false otherwise
  */
  onKeyDown(keyCode, debug) {
    // console.log(`onKeyDown: ${keyCode}`);
    // const KEY_CODE_C = 67;
    // const KEY_CODE_F = 70;
    const KEY_CODE_G = 71;
    if (debug) {
      if (keyCode === KEY_CODE_G) {
        // this.debugShowSliceFrom3d();
        this.debugShowSliceFrom2dTiles();
      }
      /*
      if (keyCode === KEY_CODE_F) {
        // show 3d texture full
        // console.log(`Show flat texture in 2d ${keyCode}`);
        this.m_showTileTexture = !this.m_showTileTexture;
        const maxTex2d = this.m_materialsTex2d;
        if (maxTex2d !== null) {
          maxTex2d.m_uniforms.showAll.value = this.m_showTileTexture;
        } // if have material/shader
      } // if pressed 'F' key
      */
    }
  }

  //  Mouse normalized screen coordinates:
  //
  //  0,0 ---------- 1,0
  //   |              |
  //   |              |
  //   |              |
  //   |              |
  //  0,1 ---------- 0,1
  //
  //
  //  Mouse physically corrected
  //
  //    m_wProjScreen
  //       +--+--+
  //       |     |
  //       |     | m_hProjScreen
  //       |     |
  //       +--+--+
  //
  //

  /**
  * Mouse events handler
  * xScr, yScr in [0..1] is normalized mouse coordinate in screen (not in image)
  */
  onMouseDown(xScr, yScr) {
    if ((this.m_volumeData === null) || (this.m_volumeHeader === null)) {
      console.log('onMouseDown. no vol data or header');
      return;
    }
    // check is mouse click inside filled area
    const TWICE = 2.0;
    const xScrMin = (1.0 / TWICE) - this.m_wProjScreen / TWICE;
    const xScrMax = (1.0 / TWICE) + this.m_wProjScreen / TWICE;
    const yScrMin = (1.0 / TWICE) - this.m_hProjScreen / TWICE;
    const yScrMax = (1.0 / TWICE) + this.m_hProjScreen / TWICE;

    if ((xScr < xScrMin) || (xScr > xScrMax) || (yScr < yScrMin) || (yScr > yScrMax)) {
      // out of image
      // console.log('onMouseDown. click out of projection');
      return;
    }
    if (this.m_levelSetMode) {
      console.log('onMouseDown. we are in level set mode');
      return;
    }

    // get (xt, yt) normalized coordinates in 2d image [0..1]
    const xt = (xScr - xScrMin) / this.m_wProjScreen;
    const yt = (yScr - yScrMin) / this.m_hProjScreen;
    // console.log(`click in 2d render: ${xt}, ${yt}`);

    switch (this.m_toolType) {
      case tools2d.INTENSITY:
        // console.log(`Pick tool: ${xScr}, ${yScr}, ${this.m_posX}, ${this.m_posY}`);
        this.m_pickTool.onMouseDown(xt, yt, this.m_sliceAxis, this.m_sliderPosition,
          this.m_zoom, xScr, yScr);
        break;
      case tools2d.DISTANCE:
        this.m_distanceTool.onMouseDown(xt, yt, this.m_zoom, this.m_posX * (this.m_wProjScreen),
          this.m_posY * (this.m_hProjScreen));
        break;
      case tools2d.ANGLE:
        this.m_angleTool.onMouseDown(xt, yt, this.m_zoom, this.m_posX * (this.m_wProjScreen),
          this.m_posY * (this.m_hProjScreen));
        break;
      case tools2d.TEXT:
        this.m_textTool.onMouseDown(xt, yt, this.m_zoom, this.m_posX * (this.m_wProjScreen),
          this.m_posY * (this.m_hProjScreen));
        break;
      case tools2d.AREA:
        this.m_areaTool.onMouseDown(xt, yt, this.m_zoom, this.m_posX * (this.m_wProjScreen),
          this.m_posY * (this.m_hProjScreen));
        break;
      case tools2d.RECT:
        this.m_rectTool.onMouseDown(xt, yt, this.m_zoom, this.m_posX * (this.m_wProjScreen),
          this.m_posY * (this.m_hProjScreen));
        break;
      case tools2d.GRAD:
        break;
      case tools2d.COBR:
        /*this.m_contrastBrightTool.onMouseDown(xt, yt);
        this.m_materialsTex2d.m_uniforms.contrast.value = this.m_contrastBrightTool.m_contrast;
        this.m_materialsTex2d.m_uniforms.brightness.value = this.m_contrastBrightTool.m_brightness;
        this.m_materialsTex2d.m_uniforms.COBRflag.value = this.m_contrastBrightTool.m_COBRflag;*/
        break;
      case tools2d.BIFI:
        /*this.m_filterTool.onMouseDown(xt, yt);
        this.m_materialsTex2d.m_uniforms.sigma.value = this.m_filterTool.m_sigma;
        this.m_materialsTex2d.m_uniforms.sigmaB.value = this.m_filterTool.m_sigmaB;
        this.m_materialsTex2d.m_uniforms.BIFIflag.value = this.m_filterTool.m_BIFIflag;*/
        break;
      case tools2d.ZOOM:
        this.m_move = true;
        this.m_moveTool.onMouseDown(xt, yt);
        break;
      case tools2d.DELETE:
        this.m_deleteTool.onMouseDown(xt, yt, this.m_distanceTool.m_distances, this.m_angleTool.m_angles,
          this.m_rectTool.m_areas, this.m_areaTool.m_distances, this.m_textTool.m_textArr,
          this.m_distanceTool.m_vertexes, this.m_angleTool.m_vertexes, this.m_rectTool.m_vertexes,
          this.m_areaTool.m_vertexes2, this.m_areaTool.m_last_lengths, this.m_areaTool.m_vertexes, this.m_areaTool,
          this.m_textTool.m_vertexes);
        console.log(`${this.m_areaTool.last_length}`);
        break;
      case tools2d.EDIT:
        this.m_editTool.onMouseDown();
        break;
      default:
        console.log('Unexpected 2d tool');
        break;
    }
  }


  /**
   * Mouse events handler
   * xScr, yScr in [0..1] is normalized mouse coordinate in screen
   */
  onMouseUp(xScr, yScr) {
    if ((this.m_volumeData === null) || (this.m_volumeHeader === null)) {
      return;
    }
    // check is mouse click inside filled area
    const TWICE = 2.0;
    const xScrMin = (1.0 / TWICE) - this.m_wProjScreen / TWICE;
    const xScrMax = (1.0 / TWICE) + this.m_wProjScreen / TWICE;
    const yScrMin = (1.0 / TWICE) - this.m_hProjScreen / TWICE;
    const yScrMax = (1.0 / TWICE) + this.m_hProjScreen / TWICE;
    if ((xScr < xScrMin) || (xScr > xScrMax) || (yScr < yScrMin) || (yScr > yScrMax)) {
      // out of image
      // console.log('onMouseDown. click out of projection');
      return;
    }
    // get (xt, yt) normalized coordinates in 2d image [0..1]
    const xt = (xScr - xScrMin) / this.m_wProjScreen;
    const yt = (yScr - yScrMin) / this.m_hProjScreen;

    if (this.m_levelSetMode) {
      // only for first step of level set
      if (this.m_levelSetCircle !== null) {
        this.clearLevelSetCenter();
      }
      this.drawLevelSetCenter(xt, yt);
      return;
    }

    switch (this.m_toolType) {
      case tools2d.INTENSITY:
        break;
      case tools2d.DISTANCE:
        break;
      case tools2d.ANGLE:
        break;
      case tools2d.AREA:
        break;
      case tools2d.RECT:
        break;
      case tools2d.TEXT:
        break;
      case tools2d.COBR:
        break;
      case tools2d.BIFI:
        break;
      case tools2d.ZOOM:
        this.m_move = false;
        this.m_moveTool.onMouseUp();
        this.m_savePosX = this.m_posX;
        this.m_savePosY = this.m_posY;
        break;
      case tools2d.DELETE:
        break;
      case tools2d.EDIT:
        this.m_editTool.onMouseUp();
        break;
      default:
        console.log('Unexpected 2d tool');
        break;
    }
  }


  /**
   * Mouse move event handler
   * @param (float) xScr - normalized mouse x coordinate in screen
   * @param (float) yScr - normalized mouse y coordinate in screen
   */
  onMouseMove(xScr, yScr) {
    if ((this.m_volumeData === null) || (this.m_volumeHeader === null)) {
      return;
    }
    // check is mouse click inside filled area
    const TWICE = 2.0;
    const xScrMin = (1.0 / TWICE) - this.m_wProjScreen / TWICE;
    const xScrMax = (1.0 / TWICE) + this.m_wProjScreen / TWICE;
    const yScrMin = (1.0 / TWICE) - this.m_hProjScreen / TWICE;
    const yScrMax = (1.0 / TWICE) + this.m_hProjScreen / TWICE;
    if ((xScr < xScrMin) || (xScr > xScrMax) || (yScr < yScrMin) || (yScr > yScrMax)) {
      // out of image
      // console.log('onMouseDown. click out of projection');
      return;
    }
    // get (xt, yt) normalized coordinates in 2d image [0..1]
    const xt = (xScr - xScrMin) / this.m_wProjScreen;
    const yt = (yScr - yScrMin) / this.m_hProjScreen;

    switch (this.m_toolType) {
      case tools2d.INTENSITY:
        break;
      case tools2d.DISTANCE:
        this.m_distanceTool.onMouseMove(xt, yt, this.m_zoom);
        break;
      case tools2d.ANGLE:
        this.m_angleTool.onMouseMove(xt, yt);
        break;
      case tools2d.AREA:
        this.m_areaTool.onMouseMove(xt, yt);
        break;
      case tools2d.RECT:
        this.m_rectTool.onMouseMove(xt, yt, this.m_zoom);
        break;
      case tools2d.TEXT:
        break;
      case tools2d.GRAD:
        break;
      case tools2d.COBR:
        /*this.m_contrastBrightTool.onMouseMove(xt, yt);
        this.m_materialsTex2d.m_uniforms.contrast.value = this.m_contrastBrightTool.m_contrast;
        this.m_materialsTex2d.m_uniforms.brightness.value = this.m_contrastBrightTool.m_brightness;
        this.m_materialsTex2d.m_uniforms.COBRflag.value = this.m_contrastBrightTool.m_COBRflag;*/
        break;
      case tools2d.BIFI:
        /*this.m_filterTool.onMouseMove(xt, yt);
        this.m_materialsTex2d.m_uniforms.sigma.value = this.m_filterTool.m_sigma;
        this.m_materialsTex2d.m_uniforms.sigmaB.value = this.m_filterTool.m_sigmaB;
        this.m_materialsTex2d.m_uniforms.BIFIflag.value = this.m_filterTool.m_BIFIflag;*/
        break;
      case tools2d.ZOOM:
        if (this.m_move) {
          this.updateMove(xt, yt);
        }
        break;
      case tools2d.DELETE:
        this.m_deleteTool.onMouseMove(xt, yt, this.m_zoom, this.m_distanceTool.m_distances, this.m_angleTool.m_angles,
          this.m_rectTool.m_areas, this.m_areaTool.m_distances, this.m_textTool.m_textArr);
        break;
      case tools2d.EDIT: // TO DO: add text tool
        this.m_editTool.onMouseMove(xt, yt, this.m_zoom, this.m_distanceTool.m_distances, this.m_angleTool.m_angles,
          this.m_rectTool.m_areas, this.m_areaTool.m_distances, this.m_areaTool, this.m_textTool,
          this.m_posX * (this.m_wProjScreen), this.m_posY * (this.m_hProjScreen));
        //this.m_areaTool.updateVertexes(this.m_zoom, this.m_posX * (this.m_wProjScreen), this.m_posY *
        // (this.m_hProjScreen));
        this.m_distanceTool.updateVertexes(this.m_zoom, this.m_posX * (this.m_wProjScreen),
          this.m_posY * (this.m_hProjScreen));
        this.m_angleTool.updateVertexes(this.m_zoom, this.m_posX * (this.m_wProjScreen),
          this.m_posY * (this.m_hProjScreen));
        break;
      default:
        console.log('Unexpected 2d tool');
        break;
    }
  }

  /**
   * Mouse events handler
   * xScr, yScr in [0..1] is normalized mouse coordinate in screen
   */
  onMouseWheel(wheelDeltaY) {
    switch (this.m_toolType) {
      case tools2d.INTENSITY:
        break;
      case tools2d.DISTANCE:
        break;
      case tools2d.ANGLE:
        break;
      case tools2d.AREA:
        break;
      case tools2d.RECT:
        break;
      case tools2d.TEXT:
        break;
      case tools2d.COBR:
        break;
      case tools2d.BIFI:
        break;
      case tools2d.ZOOM:
        this.m_zoomTool.onMouseWheel(wheelDeltaY);
        this.updateZoom();
        this.createMarkLinesAndText();
        break;
      case tools2d.DELETE:
        break;
      case tools2d.EDIT:
        break;
      default:
        console.log('Unexpected 2d tool');
        break;
    }
  }


  updateLines() {
    this.m_distanceTool.updateLines(this.m_zoom, this.m_posX * this.m_wProjScreen, this.m_posY * this.m_hProjScreen);
    /*
    // TODO: restore 2d tools
    this.m_angleTool.updateLines(this.m_zoom, this.m_posX * this.m_wProjScreen, this.m_posY * this.m_hProjScreen);
    this.m_rectTool.updateLines(this.m_zoom, this.m_posX * this.m_wProjScreen, this.m_posY * this.m_hProjScreen);
    this.m_textTool.updateAll(this.m_zoom, this.m_posX * this.m_wProjScreen, this.m_posY * this.m_hProjScreen);
    this.m_areaTool.updateLines(this.m_zoom, this.m_posX * this.m_wProjScreen, this.m_posY * this.m_hProjScreen);
    this.m_deleteTool.updateLines(this.m_zoom, this.m_posX * this.m_wProjScreen, this.m_posY * this.m_hProjScreen);
    this.m_editTool.updateLines(this.m_zoom, this.m_posX * this.m_wProjScreen, this.m_posY * this.m_hProjScreen);
    */
  }

  updateMove(xt, yt) {
    // const TWICE = 2;
    // const delta = (TWICE - TWICE * this.m_zoom);
    const MAX_POSSIBLE = 1.0 - this.m_zoom;
    const vDif = this.m_moveTool.onMouseMove(xt, yt);
    const xPosNew = this.m_savePosX + vDif.x;
    const yPosNew = this.m_savePosY + vDif.y;
    if ((xPosNew <= Math.abs(MAX_POSSIBLE)) && (xPosNew > 0)) {
      this.m_posX = xPosNew;
      this.m_materialsTex2d.setFloat('posX', this.m_posX);
    } else if (xPosNew > Math.abs(MAX_POSSIBLE)) {
      this.m_posX = Math.abs(MAX_POSSIBLE);
      this.m_materialsTex2d.setFloat('posX', this.m_posX);
    } else {
      this.m_posX = 0;
      this.m_materialsTex2d.setFloat('posX', this.m_posX);
    }

    if ((yPosNew <= Math.abs(MAX_POSSIBLE)) && (yPosNew > 0)) {
      this.m_posY = yPosNew;
      this.m_materialsTex2d.setFloat('posY', this.m_posY);
    } else if (yPosNew > Math.abs(MAX_POSSIBLE)) {
      this.m_posY = Math.abs(MAX_POSSIBLE);
      this.m_materialsTex2d.setFloat('posY', this.m_posY);
    } else {
      this.m_posY = 0;
      this.m_materialsTex2d.setFloat('posY', this.m_posY);
    }
    // console.log(`updateMove zoom.  XY = ${this.m_posX}, ${this.m_posY}`);
    this.updateLines();
  }

  updateZoom() {
    this.m_materialsTex2d.setFloat('zoom', this.m_zoomTool.m_zoom);
    this.m_zoom = this.m_zoomTool.m_zoom;
    // const TWICE = 2;
    // const delta = (TWICE - TWICE * this.m_zoom);
    const MAX_POSSIBLE = 1.0 - this.m_zoom;
    if (this.m_posX > MAX_POSSIBLE) {
      this.m_posX = MAX_POSSIBLE;
      this.m_materialsTex2d.setFloat('posX', this.m_posX);
    }
    if (this.m_posY > MAX_POSSIBLE) {
      this.m_posY = MAX_POSSIBLE;
      this.m_materialsTex2d.setFloat('posY', this.m_posY);
    }
    this.updateLines();
  }

  updateContrastFromSliders(value) {
    this.m_materialsTex2d.m_uniforms.contrast.value = parseFloat(value[0]);
    this.m_materialsTex2d.m_uniforms.flag.value = true;
  }
  updateBrightnessFromSliders(value) {
    this.m_materialsTex2d.m_uniforms.brightness.value = parseFloat(value[0]);
    this.m_materialsTex2d.m_uniforms.flag.value = true;
  }
  updateFilterFromSliders(value) {
    const NON_ZERO_FILTER = 0.01;
    this.m_materialsTex2d.m_uniforms.sigma.value = (parseFloat(value[0])) + NON_ZERO_FILTER;
    this.m_materialsTex2d.m_uniforms.flag.value = true;
    if (this.m_isRoiVolume) {
      this.volumeUpdater.updateVolumeTexture((parseFloat(value[0])) + NON_ZERO_FILTER, 1.0, 1.0, true);
    }
  }
  saveFiltersChanges(saveFlag) {
    if (saveFlag) {
      const prevTool = this.m_toolType;
      const sigmaValue = this.m_materialsTex2d.m_uniforms.sigma.value;
      const contrastValue = this.m_materialsTex2d.m_uniforms.contrast.value;
      const brightnessValue = this.m_materialsTex2d.m_uniforms.brightness.value;
      this.volumeUpdater.updateVolumeTexture(sigmaValue, contrastValue, brightnessValue, saveFlag);
      this.m_toolType = prevTool;
    }
    /*this.m_contrastBrightTool.clear();
    this.m_materialsTex2d.m_uniforms.contrast.value = this.m_contrastBrightTool.m_contrast;
    this.m_materialsTex2d.m_uniforms.brightness.value = this.m_contrastBrightTool.m_brightness;
    this.m_materialsTex2d.m_uniforms.flag.value = false;
    this.m_filterTool.clear();
    this.m_materialsTex2d.m_uniforms.sigma.value = this.m_filterTool.m_sigma;*/
    //this.m_materialsTex2d.m_uniforms.sigmaB.value = this.m_filterTool.m_sigmaB;
  }
  /**
   * Mouse move event handler
   * @param (float) xScr - normalized mouse x coordinate in screen
   * @param (float) yScr - normalized mouse y coordinate in screen
   */
  /*onMouseWheel(wheelDeltaX, wheelDeltaY) {
    switch (this.m_toolType) {
      case tools2d.INTENSITY:
        break;
      case tools2d.DISTANCE:
        break;
      case tools2d.ANGLE:
        break;
      case tools2d.AREA:
        break;
      case tools2d.RECT:
        break;
      case tools2d.GRAD:
        //this.m_gradTool.onMouseWheel(wheelDeltaX, wheelDeltaY);
        //this.m_materialsTex2d.m_uniforms.currentGradient.value = this.m_gradTool.m_gradient;
        break;
      case tools2d.COBR:
        break;
      case tools2d.BIFI:
        this.m_filterTool.onMouseWheel(wheelDeltaX, wheelDeltaY);
        this.m_materialsTex2d.m_uniforms.sigma.value = this.m_filterTool.m_sigma;
        this.m_materialsTex2d.m_uniforms.sigmaB.value = this.m_filterTool.m_sigmaB;
        this.m_materialsTex2d.m_uniforms.BIFIflag.value = this.m_filterTool.m_BIFIflag;
        break;
      case tools2d.SAVE:
        break;
      default:
        console.log('Unexpected 2d tool');
        break;
    }
  }*/

  updateText() {
    this.m_pickTool.update();
  }
  static shortenString(str) {
    const MAX_ITEM_LEN = 20;
    const SHORT_ITEM_PART = 5;
    let strRet = str;
    const pnl = str.length;
    if (pnl > MAX_ITEM_LEN) {
      const strBegin = str.substring(0, SHORT_ITEM_PART + 1);
      const strEnd = str.substring(pnl - SHORT_ITEM_PART, pnl);
      strRet = `${strBegin}...${strEnd}`;
    }
    return strRet;
  }

  /**
  * Create specual lines and text about volume features, like:
  * orientation, 10 cm scale, patient name, patient gender, etc
  */
  createMarkLinesAndText() {
    let xPixPerMeter;
    let yPixPerMeter;
    // eslint-disable-next-line
    let strMarkTextXMin = '';
    // eslint-disable-next-line
    let strMarkTextXMax = '';
    // eslint-disable-next-line
    let strMarkTextYMin = '';
    // eslint-disable-next-line
    let strMarkTextYMax = '';

    // console.log('G2d. createMarkLinesAndText ...');
    // const maxVolSize = (this.m_volumeBox.x > this.m_volumeBox.y) ?
    //   this.m_volumeBox.x : this.m_volumeBox.y;
    // const VIS_KOEF = 0.8;
    // const visVolSize = (maxVolSize * VIS_KOEF);
    if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_Z) {
      xPixPerMeter = this.m_wProjScreen / this.m_volumeBox.x;
      yPixPerMeter = this.m_hProjScreen / this.m_volumeBox.y;
      // console.log(`2d lines. Volume box = ${this.m_volumeBox.x} * ${this.m_volumeBox.y} * ${this.m_volumeBox.z}`);
      // console.log(`2d lines. Proj screen = ${this.m_wProjScreen} * ${this.m_hProjScreen}`);
      strMarkTextXMin = 'R';
      strMarkTextXMax = 'L';
      strMarkTextYMin = 'A';
      strMarkTextYMax = 'P';
    } else if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_Y) {
      xPixPerMeter = this.m_wProjScreen / this.m_volumeBox.x;
      yPixPerMeter = this.m_hProjScreen / this.m_volumeBox.z;
      strMarkTextXMin = 'R';
      strMarkTextXMax = 'L';
      strMarkTextYMin = 'H';
      strMarkTextYMax = 'F';
    } else if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_X) {
      xPixPerMeter = this.m_wProjScreen / this.m_volumeBox.y;
      yPixPerMeter = this.m_hProjScreen / this.m_volumeBox.z;
      strMarkTextXMin = 'A';
      strMarkTextXMax = 'P';
      strMarkTextYMin = 'H';
      strMarkTextYMax = 'F';
    }
    // const wLineLen = visVolSize * xPixPerMeter;
    // const hLineLen = visVolSize * yPixPerMeter;
    const LINE_LEN = 100.0;
    const wLineLen = LINE_LEN * xPixPerMeter;
    const hLineLen = LINE_LEN * yPixPerMeter;
    // console.log(`Marks 2d size. wLineLen = ${wLineLen}, hLineLen = ${hLineLen}`);

    // Remove old lines from scene (if present)
    const numHLines = this.m_linesHor.length;
    // console.log(`Remove ${numHLines} 2d lines`);
    for (let i = 0; i < numHLines; i++) {
      this.m_linesHor[i].m_bMesh.dispose();
    }
    const numVLines = this.m_linesVer.length;
    for (let i = 0; i < numVLines; i++) {
      this.m_linesVer[i].m_bMesh.dispose();
    }

    // Create lines material (shared between all 2d lines)
    if (this.m_linesMaterial === null) {
      const R_MARK = 0.9;
      const G_MARK = 0.4;
      const B_MARK = 0.4;
      const matCol = new MaterialColor2d(R_MARK, G_MARK, B_MARK, this.m_bScene);
      this.m_linesMaterial = matCol.m_bMaterial;
    }

    const HALF = 0.5;
    const TWICE = 2.0;

    const xPrjCenter = 0.0;
    const yPrjCenter = 0.0;

    const GAP_SCREEN_BORDER = 0.04;
    const yLineLow = -(this.m_hProjScreen / TWICE) + GAP_SCREEN_BORDER;
    const xs = xPrjCenter - wLineLen * HALF;
    const xe = xPrjCenter + wLineLen * HALF;
    const wLine = new Line2D(this.m_bScene,
      this.m_lineWidth,
      xs, yLineLow, xe, yLineLow,
      this.m_linesMaterial);
    this.m_linesHor.push(wLine);

    const MARK_SHORT = 0.02;
    const MARK_LONG = 0.03;
    const MARKS_COUNT = 10;
    for (let i = 0; i <= MARKS_COUNT; i++) {
      const xMark = xs + (xe - xs) * i / MARKS_COUNT;
      // eslint-disable-next-line
      const yAdd = ((i === 0) || (i === 5) || (i === 10)) ? MARK_LONG : MARK_SHORT;
      const horMarkLine = new Line2D(this.m_bScene,
        this.m_lineWidth,
        xMark, yLineLow + yAdd, xMark, yLineLow,
        this.m_linesMaterial);
      this.m_linesHor.push(horMarkLine);
    }

    const xLineLeft = -(this.m_wProjScreen / TWICE) + GAP_SCREEN_BORDER;
    const ys = yPrjCenter - hLineLen * HALF;
    const ye = yPrjCenter + hLineLen * HALF;
    const hLine = new Line2D(this.m_bScene,
      this.m_lineWidth,
      xLineLeft, ys, xLineLeft, ye,
      this.m_linesMaterial);
    this.m_linesVer.push(hLine);

    for (let i = 0; i <= MARKS_COUNT; i++) {
      const yMark = ys + (ye - ys) * i / MARKS_COUNT;
      // eslint-disable-next-line
      const xAdd = ((i === 0) || (i === 5) || (i === 10)) ? MARK_LONG : MARK_SHORT;
      const verMarkLine = new Line2D(this.m_bScene,
        this.m_lineWidth,
        xLineLeft, yMark, xLineLeft + xAdd, yMark,
        this.m_linesMaterial);
      this.m_linesVer.push(verMarkLine);
    }

    // Remove mark text
    if (this.m_markTextXMin !== undefined) {
      this.m_markTextXMin.m_bMesh.dispose();
      this.m_markTextXMax.m_bMesh.dispose();
      this.m_markTextYMin.m_bMesh.dispose();
      this.m_markTextYMax.m_bMesh.dispose();
    }

    const canvas = this.m_textCanvas;
    const ctx = this.m_textContext;
    this.m_markTextXMin = new MeshText2D(strMarkTextXMin, canvas, ctx);
    this.m_markTextXMax = new MeshText2D(strMarkTextXMax, canvas, ctx);
    this.m_markTextYMin = new MeshText2D(strMarkTextYMin, canvas, ctx);
    this.m_markTextYMax = new MeshText2D(strMarkTextYMax, canvas, ctx);

    const xPrjRight = (this.m_wProjScreen / TWICE) - GAP_SCREEN_BORDER;
    const TEXT_MARK_HEIGHT = 0.03;
    const TEXT_MARK_BACKGROUND_COLOR = 'rgba(0, 0, 0, 0)';
    const TEXT_MARK_COLOR = 'rgba(240, 20, 20, 255)';
    this.m_markTextXMin.updateText(xLineLeft + MARK_LONG, yPrjCenter, TEXT_MARK_HEIGHT,
      MeshText2D.ALIGN_LEFT, MeshText2D.ALIGN_CENTER,
      TEXT_MARK_BACKGROUND_COLOR, TEXT_MARK_COLOR, this.m_bScene);
    this.m_markTextXMax.updateText(xPrjRight - MARK_LONG, yPrjCenter, TEXT_MARK_HEIGHT,
      MeshText2D.ALIGN_RIGHT, MeshText2D.ALIGN_CENTER,
      TEXT_MARK_BACKGROUND_COLOR, TEXT_MARK_COLOR, this.m_bScene);
    this.m_markTextYMin.updateText(xPrjCenter, 1.0 - MARK_LONG, TEXT_MARK_HEIGHT,
      MeshText2D.ALIGN_CENTER, MeshText2D.ALIGN_TOP,
      TEXT_MARK_BACKGROUND_COLOR, TEXT_MARK_COLOR, this.m_bScene);
    this.m_markTextYMax.updateText(xPrjCenter, yLineLow + MARK_LONG, TEXT_MARK_HEIGHT,
      MeshText2D.ALIGN_CENTER, MeshText2D.ALIGN_BOTTOM,
      TEXT_MARK_BACKGROUND_COLOR, TEXT_MARK_COLOR, this.m_bScene);

    // Remove centimeters text
    if (this.m_cmTextHor !== undefined) {
      this.m_cmTextHor.m_bMesh.dispose();
      this.m_cmTextVer.m_bMesh.dispose();
    }
    const SIZE = 10;
    const STR_TEXT_SIZE = `${(SIZE * this.m_zoom).toFixed(1)} cm`;
    this.m_cmTextHor = new MeshText2D(STR_TEXT_SIZE, canvas, ctx);
    this.m_cmTextVer = new MeshText2D(STR_TEXT_SIZE, canvas, ctx);
    const MARK_CM_TEXT_HEIGHT = 0.02;
    this.m_cmTextHor.updateText(xe + MARK_LONG, yLineLow, MARK_CM_TEXT_HEIGHT,
      MeshText2D.ALIGN_LEFT, MeshText2D.ALIGN_BOTTOM,
      TEXT_MARK_BACKGROUND_COLOR, TEXT_MARK_COLOR, this.m_bScene);
    this.m_cmTextVer.updateText(xLineLeft, ys - MARK_LONG, MARK_CM_TEXT_HEIGHT,
      MeshText2D.ALIGN_LEFT, MeshText2D.ALIGN_TOP,
      TEXT_MARK_BACKGROUND_COLOR, TEXT_MARK_COLOR, this.m_bScene);

    // remove old info
    if (this.m_infoText11 !== undefined) {
      this.m_infoText11.m_bMesh.dispose();
      this.m_infoText12.m_bMesh.dispose();
      this.m_infoText13.m_bMesh.dispose();
      this.m_infoText21.m_bMesh.dispose();
      this.m_infoText22.m_bMesh.dispose();
      this.m_infoText23.m_bMesh.dispose();
    }
    // add volume info
    if (this.m_volumeInfo !== null) {
      const INFO_TEXT_HEIGHT = 0.03;
      // completely transparent background for text
      const INFO_TEXT_BACKGROUND_COLOR = 'rgba(0, 0, 0, 0)';
      const INFO_TEXT_COLOR = 'rgba(255, 255, 64, 255)';

      let pn = this.m_volumeInfo.m_patientName;
      const pg = this.m_volumeInfo.m_patientGender;
      const pdb = this.m_volumeInfo.m_patientDateOfBirth;
      const sd = this.m_volumeInfo.m_studyDate;
      const at = this.m_volumeInfo.m_acquisionTime;

      // shorten pn (patient name)
      pn = Graphics2d.shortenString(pn);

      // 1st row info text
      let strNameGenderDatebirth = pn;
      if (pg.length > 1) {
        if (strNameGenderDatebirth.length > 1) {
          strNameGenderDatebirth = `${strNameGenderDatebirth}, ${pg}`;
        } else {
          strNameGenderDatebirth = pg;
        }
      }
      if (pdb.length > 1) {
        if (strNameGenderDatebirth.length > 1) {
          strNameGenderDatebirth = `${strNameGenderDatebirth}, ${pdb}`;
        } else {
          strNameGenderDatebirth = pdb;
        }
      }
      strNameGenderDatebirth = (strNameGenderDatebirth.length < 1) ? ' ' : strNameGenderDatebirth;
      // 2nd row info text
      let strDateTimeAcq = sd;
      if (at.length > 1) {
        if (strDateTimeAcq.length > 1) {
          strDateTimeAcq = `${strDateTimeAcq}, ${at}`;
        } else {
          strDateTimeAcq = at;
        }
      }
      strDateTimeAcq = (strDateTimeAcq.length < 1) ? ' ' : strDateTimeAcq;
      // 3rd row info text
      let strPid = this.m_volumeInfo.m_patientId;
      strPid = (strPid.length < 1) ? ' ' : strPid;

      // shorten pid if too large
      strPid = Graphics2d.shortenString(strPid);

      // let yLine = 1.0 - MARK_LONG;
      let yLine = (this.m_hProjScreen / TWICE) - MARK_LONG;
      this.m_infoText11 = new MeshText2D(strNameGenderDatebirth, canvas, ctx);
      this.m_infoText11.updateText(xLineLeft, yLine, INFO_TEXT_HEIGHT,
        MeshText2D.ALIGN_LEFT, MeshText2D.ALIGN_TOP,
        INFO_TEXT_BACKGROUND_COLOR, INFO_TEXT_COLOR, this.m_bScene);

      const yTextHeight = this.m_infoText11.getRenderedTextHeight();
      yLine -= yTextHeight;

      this.m_infoText12 = new MeshText2D(strDateTimeAcq, canvas, ctx);
      this.m_infoText12.updateText(xLineLeft, yLine, INFO_TEXT_HEIGHT,
        MeshText2D.ALIGN_LEFT, MeshText2D.ALIGN_TOP,
        INFO_TEXT_BACKGROUND_COLOR, INFO_TEXT_COLOR, this.m_bScene);
      yLine -= yTextHeight;

      this.m_infoText13 = new MeshText2D(strPid, canvas, ctx);
      this.m_infoText13.updateText(xLineLeft, yLine, INFO_TEXT_HEIGHT,
        MeshText2D.ALIGN_LEFT, MeshText2D.ALIGN_TOP,
        INFO_TEXT_BACKGROUND_COLOR, INFO_TEXT_COLOR, this.m_bScene);
      yLine -= yTextHeight;

      let pin = this.m_volumeInfo.m_institutionName;
      let phn = this.m_volumeInfo.m_physicansName;
      let pmn = this.m_volumeInfo.m_manufacturerName;
      pin = (pin.length < 1) ? ' ' : pin;
      phn = (phn.length < 1) ? ' ' : phn;
      pmn = (pmn.length < 1) ? ' ' : pmn;

      // yLine = 1.0 - MARK_LONG;
      yLine = (this.m_hProjScreen / TWICE) - MARK_LONG;
      this.m_infoText21 = new MeshText2D(pin, canvas, ctx);
      this.m_infoText21.updateText(xPrjRight - MARK_LONG, yLine, INFO_TEXT_HEIGHT,
        MeshText2D.ALIGN_RIGHT, MeshText2D.ALIGN_TOP,
        INFO_TEXT_BACKGROUND_COLOR, INFO_TEXT_COLOR, this.m_bScene);
      yLine -= yTextHeight;

      this.m_infoText22 = new MeshText2D(phn, canvas, ctx);
      this.m_infoText22.updateText(xPrjRight - MARK_LONG, yLine, INFO_TEXT_HEIGHT,
        MeshText2D.ALIGN_RIGHT, MeshText2D.ALIGN_TOP,
        INFO_TEXT_BACKGROUND_COLOR, INFO_TEXT_COLOR, this.m_bScene);
      yLine -= yTextHeight;

      this.m_infoText23 = new MeshText2D(pmn, canvas, ctx);
      this.m_infoText23.updateText(xPrjRight - MARK_LONG, yLine, INFO_TEXT_HEIGHT,
        MeshText2D.ALIGN_RIGHT, MeshText2D.ALIGN_TOP,
        INFO_TEXT_BACKGROUND_COLOR, INFO_TEXT_COLOR, this.m_bScene);
      yLine -= yTextHeight;

      // setup info text transparency
      const TEXT_TRANSPA = 0.4;
      this.m_infoText11.m_bMesh.material.alpha = TEXT_TRANSPA;
      this.m_infoText12.m_bMesh.material.alpha = TEXT_TRANSPA;
      this.m_infoText13.m_bMesh.material.alpha = TEXT_TRANSPA;
      this.m_infoText21.m_bMesh.material.alpha = TEXT_TRANSPA;
      this.m_infoText22.m_bMesh.material.alpha = TEXT_TRANSPA;
      this.m_infoText23.m_bMesh.material.alpha = TEXT_TRANSPA;

    } // if volume info found

    // tools update
    this.m_pickTool.setProjScreen(this.m_wProjScreen, this.m_hProjScreen);
    this.m_pickTool.setHeader(this.m_volumeHeader);
    this.m_pickTool.setData(this.m_volumeData);
    const SCREEN_MULT = 2.0;
    // update 2d tools with new volume data
    if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_Z) {
      this.m_distanceTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.y / (SCREEN_MULT * this.m_hProjScreen));
    } else if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_Y) {
      this.m_distanceTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
    } else if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_X) {
      this.m_distanceTool.setPixelSize(this.m_volumeBox.y / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
    }

  /*
    const SCREEN_MULT = 2.0;
    // update 2d tools with new volume data
    if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_Z) {
      this.m_distanceTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.y / (SCREEN_MULT * this.m_hProjScreen));
      this.m_areaTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.y / (SCREEN_MULT * this.m_hProjScreen));
      this.m_rectTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.y / (SCREEN_MULT * this.m_hProjScreen));
      this.m_textTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.y / (SCREEN_MULT * this.m_hProjScreen));
      this.m_deleteTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.y / (SCREEN_MULT * this.m_hProjScreen));
      this.m_editTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.y / (SCREEN_MULT * this.m_hProjScreen));
      this.m_contrastBrightTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.y / (SCREEN_MULT * this.m_hProjScreen));
    } else if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_Y) {
      this.m_distanceTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
      this.m_areaTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
      this.m_rectTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
      this.m_textTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
      this.m_deleteTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
      this.m_editTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
      this.m_contrastBrightTool.setPixelSize(this.m_volumeBox.x / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
    } else if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_X) {
      this.m_distanceTool.setPixelSize(this.m_volumeBox.y / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
      this.m_areaTool.setPixelSize(this.m_volumeBox.y / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
      this.m_rectTool.setPixelSize(this.m_volumeBox.y / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
      this.m_textTool.setPixelSize(this.m_volumeBox.y / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
      this.m_deleteTool.setPixelSize(this.m_volumeBox.y / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
      this.m_editTool.setPixelSize(this.m_volumeBox.y / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
      this.m_contrastBrightTool.setPixelSize(this.m_volumeBox.y / (SCREEN_MULT * this.m_wProjScreen),
        this.m_volumeBox.z / (SCREEN_MULT * this.m_hProjScreen));
    }
    this.m_materialsTex2d.m_uniforms.xPixelSize.value = 1 / this.m_volumeHeader.m_pixelWidth;
    this.m_materialsTex2d.m_uniforms.yPixelSize.value = 1 / this.m_volumeHeader.m_pixelHeight;

    this.m_readyCounter++;
    // console.log('Graphics2d.createTileMaps() is finished');
  } // create via volume texture
  */

  } // createMarkLines

  createTileMapsDummy() {
    this.m_matIndex = -1;
  }

  updateTexMapWithNewSliderPos() {
    if (this.m_material === null) {
      return;
    }
    const maxTex2d = this.m_materialsTex2d;
    if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_Z) {
      const zDim = this.m_volumeHeader.m_pixelDepth;
      let z = Math.floor(this.m_sliderPosition * zDim);
      z = (z <= zDim - 1) ? z : (zDim - 1);
      maxTex2d.m_uniforms.sliceIndex.value = z;
      maxTex2d.m_uniforms.numSlices.value = zDim;
      maxTex2d.m_uniforms.plane.value = Graphics2d.SLICE_AXIS_Z;
    } else if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_Y) {
      // calc slice index
      const yDim = this.m_volumeHeader.m_pixelHeight;
      let y = Math.floor(this.m_sliderPosition * yDim);
      y = (y <= yDim - 1) ? y : (yDim - 1);
      maxTex2d.m_uniforms.sliceIndex.value = y;
      maxTex2d.m_uniforms.numSlices.value = yDim;
      maxTex2d.m_uniforms.plane.value = Graphics2d.SLICE_AXIS_Y;
    } else if (this.m_sliceAxis === Graphics2d.SLICE_AXIS_X) {
      // calc slice index
      const xDim = this.m_volumeHeader.m_pixelWidth;
      let x = Math.floor(this.m_sliderPosition * xDim);
      x = (x <= xDim - 1) ? x : (xDim - 1);
      maxTex2d.m_uniforms.sliceIndex.value = x;
      maxTex2d.m_uniforms.numSlices.value = xDim;
      maxTex2d.m_uniforms.plane.value = Graphics2d.SLICE_AXIS_X;
    }
  } // updateTexMapWithNewSliderPos

  setSliderPosition(posNew) {
    // new babylon code
    this.m_materialsTex2d.setFloat('sliceValue', posNew);
    // console.log(`setSliderPosition. posNew = ${posNew}`);

    this.m_sliderPosition = posNew;
    if (this.m_volumeData !== null) {
      // console.log('Slider is changed and data ready to display');
      // this.updateTexMapWithNewSliderPos();
    }

    if (this.m_text !== null) {
      this.m_text.clear();
    }

    this.m_pickTool.clear();
    this.m_distanceTool.clearLines();
    /*
    // TODO: restore 2d tools
    this.m_angleTool.clearLines();
    this.m_areaTool.clearLines();
    this.m_rectTool.clearLines();
    this.m_deleteTool.clearLines();
    this.m_editTool.clearLines();
    //this.m_gradTool.clear();
    //this.m_materialsTex2d.m_uniforms.currentGradient.value = this.m_gradTool.m_gradient;
    this.m_contrastBrightTool.clear();
    this.m_filterTool.clear();
    */
    // old THREE js
    /*
    this.m_materialsTex2d.m_uniforms.contrast.value = this.m_contrastBrightTool.m_contrast;
    this.m_materialsTex2d.m_uniforms.brightness.value = this.m_contrastBrightTool.m_brightness;
    this.m_materialsTex2d.m_uniforms.flag.value = false;
    this.m_materialsTex2d.m_uniforms.sigma.value = this.m_filterTool.m_sigma;
    //this.m_materialsTex2d.m_uniforms.sigmaB.value = this.m_filterTool.m_sigmaB;
    */
    // invoke render to see changes
    this.render();
  }

  getSliceAxis() {
    return this.m_sliceAxis;
  }
  setSliceAxis(axisNumber) {
    if ((axisNumber < Graphics2d.SLICE_AXIS_X) || (axisNumber > Graphics2d.SLICE_AXIS_Z)) {
      console.log('Wrong axis index');
      return false;
    }
    this.m_sliceAxis = axisNumber;
    this.setupRatio();
    this.m_materialsTex2d.setInt('plane', axisNumber);

    this.m_pickTool.clear();
    this.m_distanceTool.clearLines();
    /*
    // TODO: restore 2d tools
    this.m_angleTool.clearLines();
    this.m_areaTool.clearLines();
    this.m_rectTool.clearLines();
    this.m_textTool.clear();
    this.m_deleteTool.clearLines();
    this.m_editTool.clearLines();
    this.m_contrastBrightTool.clear();
    this.m_filterTool.clear();
    //this.m_gradTool.clear();
    */
    //this.m_materialsTex2d.m_uniforms.currentGradient.value = this.m_gradTool.m_gradient;
    // this.m_materialsTex2d.m_uniforms.contrast.value = this.m_contrastBrightTool.m_contrast;
    // this.m_materialsTex2d.m_uniforms.brightness.value = this.m_contrastBrightTool.m_brightness;
    // this.m_materialsTex2d.m_uniforms.flag.value = false;
    // this.m_materialsTex2d.m_uniforms.sigma.value = this.m_filterTool.m_sigma;
    // this.m_materialsTex2d.m_uniforms.sigmaB.value = this.m_filterTool.m_sigmaB;
    return true;
  }


  /**
  * Render something on screen
  */
  render() {
    // console.log('G2d. render start');
    // babylon scene render
    this.m_bScene.render();
    // console.log('G2d. render end');
    // update text
    this.updateText();
  }  // render
} // class Graphics2d

/** Slice axis */
Graphics2d.SLICE_AXIS_X = 0;
Graphics2d.SLICE_AXIS_Y = 1;
Graphics2d.SLICE_AXIS_Z = 2;
