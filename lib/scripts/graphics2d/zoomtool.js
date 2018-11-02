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
 * 2d area tool
 * @module app/scripts/graphics2d/zoomtool
 */


export default class ZoomTool {

  /**
   * Initialize area tool
   * @param (object) scene - scene object
   * @param (object) lineWidth - width of all lines
   */
  constructor(zoom) {
    /** @property {float} m_zoom - size of zoom */
    this.m_zoom = zoom;
  }

  /**
   * Return running state
   * @return {boolean} True if last line has not been fixed yet
   */
  isRunning() {
    return this.m_runningState;
  }

  /**
   * Mouse down events handler
   * @param (float) wheelDeltaX - mouse wheel x coordinate
   * @param (float) wheelDeltaY - mouse wheel y coordinate
   * @param (float) wheelDeltaFactor - mouse wheel delta coordinate
   */
  onMouseWheel(wheelDeltaY) {
    // Actually zoom value is 1 / zoom, so for the maximum zoom we have 1 / MAX_ZOOM
    const SOME_MAX_ZOOM = 8.0;
    const MIN_ZOOM = 1.0 / SOME_MAX_ZOOM;
    const MAX_ZOOM = 1;
    const ZOOM_STEP = 100.0;
    const TRANSFORM = 1.0 / ZOOM_STEP;
    const zoomNew = this.m_zoom + wheelDeltaY * TRANSFORM;
    if ((zoomNew >= MIN_ZOOM) && (zoomNew <= MAX_ZOOM)) {
      this.m_zoom = zoomNew;
      // console.log(`Zoom new value = ${zoomNew}`);
    }
  }

  makeDefault() {
    this.m_zoom = 1;
  }
}
