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
* Render 2d lines in scene
* @module app/scripts/graphics2d/line2d
*/

// import * as THREE from 'three';
import * as BABYLON from 'babylonjs';

// image z coord == 0.8
const LINE_2D_Z_COORDINATE = 0.2;

/** Class LineD is used for render lines in 2d mode */
export default class Line2D {
  /**
  * Constructor. Create line 2d mode and add to scene on render
  * @param (object) scene - Scene where object will be rendered
  * @param (float) lineWidth - Line width in scale [-1..+1]
  * @param (float) xs - Line start, x coordinate
  * @param (float) ys - Line start, y coordinate
  * @param (float) xe - Line end, x coordinate
  * @param (float) ye - Line end, y coordinate
  * @param (object) matColor2d - MaterialColor2d
  */
  constructor(scene, lineWidth, xs, ys, xe, ye, matColor2d) {
    this.createWithMaterial(scene, lineWidth, xs, ys, xe, ye, matColor2d);
    this.m_xS = xs;
    this.m_yS = ys;
    this.m_xE = xe;
    this.m_yE = ye;
  }

  createWithMaterial(scene,
    lineWidth,
    xs, ys, xe, ye,
    matColor2d) {
    this.m_scene = scene;
    this.m_lineWidth = lineWidth;
    this.m_matColor = matColor2d;

    const vLine = new BABYLON.Vector2(xe - xs, ye - ys);
    const vNorm = new BABYLON.Vector2(+vLine.y, -vLine.x);
    vNorm.normalize();
    vNorm.multiplyByFloats(lineWidth, lineWidth);

    //      0   start    1
    //      +-----+------+    ----> vNorm
    //      |\           |
    //      | \          |
    //      |  \         |
    //      |   \        |
    //      |    \       |
    //      |     \      |
    //      |      \     |
    //      |       \    |
    //      |        \   |
    //      |         \  |
    //      |          \ |
    //      |           \|
    //      +-----+------+
    //      2    end     3
    //

    const positions = [];
    positions.push(xs - vNorm.x, ys - vNorm.y, LINE_2D_Z_COORDINATE);
    positions.push(xs + vNorm.x, ys + vNorm.y, LINE_2D_Z_COORDINATE);
    positions.push(xe - vNorm.x, ye - vNorm.y, LINE_2D_Z_COORDINATE);
    positions.push(xe + vNorm.x, ye + vNorm.y, LINE_2D_Z_COORDINATE);

    const normals = [];
    normals.push(0.0, 0.0, 1.0);
    normals.push(0.0, 0.0, 1.0);
    normals.push(0.0, 0.0, 1.0);
    normals.push(0.0, 0.0, 1.0);

    const IND_A = 0;
    const IND_B = 1;
    const IND_C = 2;
    const IND_D = 3;

    const indices = [];
    indices.push(IND_A);
    indices.push(IND_B);
    indices.push(IND_D);
    indices.push(IND_D);
    indices.push(IND_C);
    indices.push(IND_A);

    const LINE_OBJ_NAME = 'Line2dMesh';
    this.m_bMesh = new BABYLON.Mesh(LINE_OBJ_NAME, scene);
    const vertexData = new BABYLON.VertexData();
    vertexData.positions = positions;
    vertexData.normals = normals;
    vertexData.indices = indices;
    vertexData.uvs = null;
    vertexData.colors = null;
    vertexData.applyToMesh(this.m_bMesh);

    // this.m_bScene.addMesh(this.m_mesh);
    // console.log(`Line added to scene: ${xs},${ys} -> ${xe},${ye} `);
  }

  /**
  * Get object for further scene addition. Need to remove old line from scene
  * @return (object) line object
  */
  getRenderObject() {
    return this.m_mesh;
  }

  /**
  * Return coordinate x of start point
  * @return (float) x
  */
  getxS() {
    return this.m_xS;
  }

  /**
  * Return coordinate y of start point
  * @return (float) y
  */
  getyS() {
    return this.m_yS;
  }

  /**
  * Return coordinate x of end point
  * @return (float) x
  */
  getxE() {
    return this.m_xE;
  }

  /**
  * Return coordinate y of end point
  * @return (float) y
  */
  getyE() {
    return this.m_yE;
  }
}
