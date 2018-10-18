/**
* Pixel shader for filtering 3d texture and calculation of the normals
*/
precision highp float;
precision highp int;
precision mediump sampler3D;

uniform sampler3D texVolume;
uniform sampler2D texSegInUse;
uniform sampler2D texRoiColor;
uniform vec3 texelSize;
uniform float zOffset;
uniform float blurSigma;
uniform float brightness;

varying vec2 texCoord;

/**
* Reading from 3D texture
*/
float tex3D(vec3 tc)
{
#if renderRoiMap == 1
  return texture(texVolume, tc).r;
#else
  return texture(texVolume, tc).a;
#endif
}

float tex3DRoi(vec3 tc)
{
  return texture(texVolume, tc).a;
}

vec4 filterROI(vec3 base)
{
  float sigma = blurSigma;//0.965;
  float sigma2 = sigma*sigma;
  float norm_factor = 0.0;
  vec4 acc = vec4(0.0, 0.0, 0.0, 0.0);
  vec3 BackGroundColor = vec3(0.0, 0.0, 0.0);
  vec3 sumColor = vec3(0.0, 0.0, 0.0);
  // intencity
  for (float i = -2.0; i < 2.5; i += 1.0)
    for (float j = -2.0; j < 2.5; j += 1.0)
      for (float k = -2.0; k < 2.5; k += 1.0)
      {
        float curVal = tex3D(base + vec3(texelSize.x * i, texelSize.y * j, texelSize.z * k));
        float curRoi = tex3DRoi(base + vec3(texelSize.x * i, texelSize.y * j, texelSize.z * k));
        float gaussB = exp( -(i*i + j*j + k*k) / (2.0 * sigma2));
        //pick selected roi from 1d texture
        float segInUse = texture2D(texSegInUse, vec2(curRoi, 0.0)).r;
        float val = max(0.5 * curVal, segInUse);
        acc.a += val * gaussB;
        norm_factor += gaussB;
      }
  acc.a = acc.a / norm_factor;
  // color
  norm_factor = 0.0;
  for (float i = -1.0; i < 1.5; i += 1.0)
    for (float j = -1.0; j < 1.5; j += 1.0)
      for (float k = -1.0; k < 1.5; k += 1.0)
      {
        float curVal = tex3D(base + vec3(texelSize.x * i, texelSize.y * j, texelSize.z * k));
        float curRoi = tex3DRoi(base + vec3(texelSize.x * i, texelSize.y * j, texelSize.z * k));
        float gaussB = exp( -(i*i + j*j + k*k) / (2.0 * sigma2));
        //pick selected roi from 1d texture
        float segInUse = texture2D(texSegInUse, vec2(curRoi, 0.0)).r;
        vec3 segColor = texture2D(texRoiColor, vec2(curRoi, 0.0)).rgb;
        sumColor += mix(BackGroundColor, segColor, segInUse) * gaussB;
        norm_factor += segInUse * gaussB;
      }
  if (norm_factor > 0.01)
    acc.rgb = sumColor / norm_factor;
  return acc;
}


float filterBlur(vec3 base)
{
  float acc = 0.0;
  float sigma = blurSigma;//0.965;
  float sigma2 = sigma*sigma;
  float sigmaD = blurSigma;//0.965;
  float sigmaD2 = sigmaD*sigmaD;
  float sigmaB = blurSigma;//0.9515;
  float sigmaB2 = sigmaB*sigmaB;
  float val = tex3D(base);
  float norm_factor = 0.0;
  float norm_factorB = 0.0;

  bool skip = false;
  //Bilateral Filtering
  if(skip == false)
  {
    for (float i = -2.0; i < 2.5; i += 1.0)
      for (float j = -2.0; j < 2.5; j += 1.0)
        for (float k = -2.0; k < 2.5; k += 1.0)
        {
          float curVal = tex3D(base + vec3(texelSize.x * i, texelSize.y * j, texelSize.z * k));
          float gaussW = exp( -(i*i + j*j + k*k) / (2.0 * sigmaD2) );
          acc += curVal * gaussW;
          norm_factorB += gaussW;
        }
   }
  // intenûity
  acc = acc / norm_factorB;
  return acc;
}

void main() {
  vec3 base = vec3(texCoord, zOffset);
  vec4 acc = vec4(0.0, 0.0, 0.0, 1.0);
  #if renderRoiMap == 1
    acc = filterROI(base);
  #else
    float val = filterBlur(base);
    acc = vec4(val, val, val, 1);
  #endif
  //Apply contrast/brightness adjustments
  //acc = contrast * (acc - 0.5) + 0.5 + brightness;
  
  gl_FragColor = acc;
}
