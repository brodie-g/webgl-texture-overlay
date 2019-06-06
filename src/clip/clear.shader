vertex:
    attribute vec2 position;
    uniform mat4 u_matrix;

    void main(){
        gl_Position = u_matrix * vec4(position, 0, 1);
    }

fragment:
    void main(){
        gl_FragColor = vec4(0, 0, 0, 0);
    }
