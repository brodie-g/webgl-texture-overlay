vertex:
    attribute vec2 position;
    uniform float verticalSize, verticalOffset;

    struct SlippyBounds{
        vec2 southWest, northEast;
    };
    uniform SlippyBounds slippyBounds;
    uniform mat4 u_matrix;

    void main(){
        vec2 pos = position;

        gl_Position = u_matrix * vec4(pos, 0, 1);
    }

fragment:
    void main(){
        gl_FragColor = vec4(1, 0, 1, 0);
    }
