// Attributes
attribute vec3 position;
attribute vec3 normal;

// Uniforms
uniform mat4 worldViewProjection;
varying vec3 Pos;
varying vec4 screenpos;

void main(void) {
  screenpos = worldViewProjection * vec4(position, 1.0);
  Pos = normal;
  gl_Position =  screenpos;
}