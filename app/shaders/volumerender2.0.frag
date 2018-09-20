/**
* Main pass pixel shader
*/

precision highp float;
precision highp int;
precision mediump sampler3D;

uniform sampler2D texBF;
uniform sampler2D texFF;
uniform sampler3D texVolume;
uniform vec4 stepSize;
varying mat4 local2ScreenMatrix;
varying vec4 screenpos;

float tex3D(vec3 tc)
{
  return texture(texVolume, tc).r;
}

/*******************************************************************/

/**
* Full direct volume render
*/
vec4 FullVolumeRender(vec3 start, vec3 dir, vec3 back) {
    const int MAX_I = 1000;
    vec3 iterator = start;
    vec4 acc = vec4(0.0, 0.0, 0.0, 1.0);
    float vol;
    float StepSize = stepSize.r;
    vec3 step = StepSize*dir; 

    //////////////////////////////////////////////////////

    float sumAlpha = 0.0;
    int count = int(floor(length(iterator - back) / StepSize));

    // Calc volume integral
    for (int i = 0; i < MAX_I; i++)
    {
      if (count <= 0 || sumAlpha > 0.97)
        break;
      iterator = iterator + step;
      vol = tex3D(iterator);
      if (vol > 0.4) {
        sumAlpha = vol;
        break;
      }
      count--;
    } // for i

    acc.rgb = vec3(sumAlpha);
    return acc;
}

void main() {
  vec4 acc = vec4(0.0, 0.0, 0.0, 0.0);
  // To increase the points of the beginning and end of the ray and its direction
  vec2 tc = screenpos.xy / screenpos.w * 0.5 + 0.5;
  vec4 backTexel = texture(texBF, tc, 0.0);
  vec3 back = backTexel.xyz;
  vec4 start = texture(texFF, tc, 0.0);
  if (backTexel.a < 0.5)
  {
    gl_FragColor = acc;
    return;
  }
  vec3 dir = normalize(back - start.xyz);
  ///////////////////////////////////////////////////////
  // extra code for preliminary BABYLON impl BEGIN
  acc = FullVolumeRender(start.xyz, dir, back);
  //acc.rgb = vec3(length(back - start.xyz));
  gl_FragColor = acc;
}
