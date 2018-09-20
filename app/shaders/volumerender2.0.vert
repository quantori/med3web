/**
* Main pass vertex shader
*/

attribute vec3 position;

// Uniforms
uniform mat4 worldViewProjection;
varying mat4 local2ScreenMatrix;
varying vec4 screenpos;

void main(void) {
  screenpos = worldViewProjection * vec4(position, 1.0);
  local2ScreenMatrix = worldViewProjection;
  gl_Position = screenpos;
}
