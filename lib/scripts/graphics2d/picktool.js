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
 * 2d mode pick tool
 * @module app/scripts/graphics2d/picktool
 */

import MeshText2D from './meshtext2d';
import Graphics2d from './graphics2d';

export default class PickTool {
  constructor(scene, textCanvas, textContext) {
    this.m_scene = scene;
    this.m_text = null;
    this.m_wProjScreen = 0.0;
    this.m_hProjScreen = 0.0;
    this.m_volHeader = null;
    this.m_volData = null;
    this.m_textCanvas = textCanvas;
    this.m_textContext = textContext;
  } // end of constructor

  clear() {
    // remove message from srceen
    if (this.m_text !== null) {
      this.m_text.m_bMesh.dispose();
    }
  }
  setProjScreen(wProjScreen, hProjScreen) {
    this.m_wProjScreen = wProjScreen;
    this.m_hProjScreen = hProjScreen;
  }
  setHeader(header) {
    this.m_volHeader = header;
  }
  setData(vdata) {
    this.m_volData = vdata;
  }

  /**
  * Mouse events handler
  * xr, yr in [0..1] is normalized mouse coordinate in slice
  * xScr, yScr is in screen
  */
  onMouseDown(xr, yr, sliceAxis, sliderPosition, zoom, xScr, yScr) {
    // remove old message from screen
    this.clear();

    const xDim = this.m_volHeader.m_pixelWidth;
    const yDim = this.m_volHeader.m_pixelHeight;
    const zDim = this.m_volHeader.m_pixelDepth;

    let w = 0;
    let h = 0;

    let x = 0;
    let y = 0;
    let z = 0;

    if (sliceAxis === Graphics2d.SLICE_AXIS_Z) {
      w = xDim;
      h = yDim;
      x = Math.floor(xr * w);
      y = Math.floor(yr * h);
      z = Math.floor(sliderPosition * zDim);
      z = (z <= zDim - 1) ? z : (zDim - 1);
    } else if (sliceAxis === Graphics2d.SLICE_AXIS_Y) {
      w = xDim;
      h = zDim;
      x = Math.floor(xr * w);
      z = Math.floor(yr * h);
      y = Math.floor(sliderPosition * yDim);
      y = (y <= yDim - 1) ? y : (yDim - 1);
    } else if (sliceAxis === Graphics2d.SLICE_AXIS_X) {
      w = yDim;
      h = zDim;
      y = Math.floor(xr * w);
      z = Math.floor(yr * h);
      x = Math.floor(sliderPosition * xDim);
      x = (x <= xDim - 1) ? x : (xDim - 1);
    }

    const offDst = x + (y * xDim) + (z * xDim * yDim);
    const val = this.m_volData[offDst];
    const TWICE = 2;
    // const BORDER = 512;
    // const ACCURACY = 2;

    const strMsg = `x,y,z = ${x},${y},${z}, Value = ${val}`;
    // const strMsg = `x,y,z = ${(x * zoom + (posX) / TWICE * BORDER).toFixed(ACCURACY)},
    // ${(y * zoom - ((posY) / TWICE) * BORDER).toFixed(ACCURACY)},${z}, Value = ${val}`;
    // console.log(strMsg);

    const textCanvas = this.m_textCanvas;
    const textContext = this.m_textContext;
    this.m_text = new MeshText2D(strMsg, textCanvas, textContext);

    const xAlign = (xr < 0.5) ? MeshText2D.ALIGN_LEFT : MeshText2D.ALIGN_RIGHT;
    const yAlign = (yr < 0.5) ? MeshText2D.ALIGN_TOP : MeshText2D.ALIGN_BOTTOM;
    // in [0..2]
    const TEXT_STRING_HEIGHT_SCR = 0.02;
    const TEXT_BACK_COLOR_MESSAGE = 'rgba(0, 0, 0, 255)';
    const TEXT_COLOR_MESSAGE = 'rgba(255, 255, 255, 255)';
    //
    //  Source coord system (mouse in screen)
    //
    //     (0,0) ------------ (1,0)
    //       |                  |
    //       |                  |
    //       |                  |
    //       |                  |
    //       |                  |
    //     (0,1) ------------ (1,1)
    //
    //  Text messages coord system
    //
    //  (-0.5,+0.5) -----  (+0.5,+0.5)
    //       |                  |
    //       |                  |
    //       |                  |
    //       |                  |
    //       |                  |
    //  (-0.5,-0.5) -----  (+0.5,-0.5)
    //

    const xc = xScr - 1.0 / TWICE;
    const yc = (1.0 - yScr) - 1.0 / TWICE;
    this.m_text.updateText(xc, yc, TEXT_STRING_HEIGHT_SCR, xAlign, yAlign,
      TEXT_BACK_COLOR_MESSAGE, TEXT_COLOR_MESSAGE, this.m_scene);
    const d = new Date();
    this.m_textTime = d.getTime();
  }

  update() {
    const d = new Date();
    const curTime = d.getTime();
    const delta = curTime - this.m_textTime;
    const TIME_TO_REMOVE_STRING = 2000;
    if ((this.m_text !== null) && (delta > TIME_TO_REMOVE_STRING)) {
      this.m_text.m_bMesh.dispose();
      this.m_text = null;
      this.m_textTime = -10000;
    }
  }
} // end of class
