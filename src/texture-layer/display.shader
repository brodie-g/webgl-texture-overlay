varying vec2 vTexcoord;

vertex:
    attribute vec2 position, texcoord;

    struct SlippyBounds{
        vec2 southWest, northEast;
    };
    uniform SlippyBounds slippyBounds;
    uniform mat4 u_matrix;

    void main(){
        vTexcoord = texcoord;
        vec2 pos = position;

        gl_Position = u_matrix * vec4(pos, 0, 1);
    }

fragment:
    uniform vec2 sourceSize;

    uniform float colormap[18*5];
    uniform float minIntensity;
    uniform float maxIntensity;
    uniform int colorCount;

    float fade(vec3 range, float value){
        return clamp(
            linstep(range.x, range.y, value) - linstep(range.y, range.z, value),
        0.0, 1.0);
    }

    vec4 colorFun(float intensity){
        vec4 result = vec4(0.0);
        for(int i=1; i<17; i++){
            if(i >= colorCount-1){
                break;
            }
            float r = colormap[i*5+0];
            float g = colormap[i*5+1];
            float b = colormap[i*5+2];
            float a = colormap[i*5+3];
            vec3 color = degammasRGB(vec3(r,g,b));

            float left = colormap[(i-1)*5+4];
            float center = colormap[i*5+4];
            float right = colormap[(i+1)*5+4];

            result += fade(vec3(left, center, right), intensity) * vec4(color, a);
        }
        return result;
    }

    void main(){
        float intensityScalar = texture2DInterp(vTexcoord, sourceSize).r;
        float intensity = mix(minIntensity, maxIntensity, intensityScalar);
        vec4 color = colorFun(intensity);
        //gl_FragColor = vec4(gammasRGB(color.rgb)*color.a, color.a);
        gl_FragColor = vec4(gammasRGB(color.rgb), color.a);
    }
