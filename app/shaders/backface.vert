/**
* Vertex shader for render back face of BBOX

varying vec3 Pos;
attribute vec3 uvw;
void main() {
  Pos = uvw;
  gl_Position =  (projectionMatrix  * modelViewMatrix * vec4(position, 1.0));
}*/

precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;

//Uniforms
uniform mat4 worldViewProjection;
varying vec3 Pos;

void main(void) {
    gl_Position = worldViewProjection * vec4(position, 1.0);
    Pos = position;
}