/**
* Vertex shader for render clip plane to FF texture
*/

// Attributes
attribute vec3 position;
attribute vec3 normal;

//Uniforms
// uniform mat4 worldViewProjection;
varying vec3 Pos;

void main(void) {
    gl_Position = vec4(position.xy * 2.0, 1.0, 1.0);
    Pos = normal;
}
