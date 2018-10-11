/**
* Shader for rendering to a low res texture
*/
/*
varying vec4 screenpos;
varying mat4 local2ScreenMatrix;
void main() {
  local2ScreenMatrix = projectionMatrix  * modelViewMatrix;
  screenpos = (local2ScreenMatrix * vec4(position, 1.0));
  gl_Position =  screenpos;
} */
/**
* Main pass vertex shader
*/

attribute vec3 position;
uniform mat4 worldViewProjection;
varying mat4 local2ScreenMatrix;
varying vec4 screenpos;

void main(void) {
  screenpos = worldViewProjection * vec4(position, 1.0);
  local2ScreenMatrix = worldViewProjection;
  gl_Position = screenpos;
}

