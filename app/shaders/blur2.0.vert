/**
* Vertex shader for filtering source 3d texture layer-by-layer
*/
attribute vec3 position;
varying vec2 texCoord;
void main() {
  texCoord = position.xy + vec2(0.5, 0.5);
  gl_Position = vec4(position * 2.0 , 1.0);
}
