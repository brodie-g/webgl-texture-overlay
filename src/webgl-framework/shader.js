// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Shader, ShaderObj, ShaderProxy;
import matrix from 'matrix';

let defaultExport = {};
defaultExport.ShaderObj = (ShaderObj = class ShaderObj {});

const boilerplate = `\
precision highp int;
precision highp float;
#define PI 3.141592653589793
#define TAU 6.283185307179586
#define PIH 1.5707963267948966
#define E 2.7182818284590451
float angleBetween(vec3 a, vec3 b){return acos(dot(a,b));}

vec3 gamma(vec3 color){
    return pow(color, vec3(1.0/2.4)); 
}

vec3 degamma(vec3 color){
    return pow(color, vec3(2.4));
}

vec3 gammasRGB(vec3 color){
    return mix(
        color*12.92,
        pow(color, vec3(1.0/2.4))*1.055-0.055,
        step((0.04045/12.92), color)
    );
}

vec3 degammasRGB(vec3 color){
    return mix(
        color/12.92,
        pow((color+0.055)/1.055, vec3(2.4)),
        step(0.04045, color)
    );
}

float linstep(float edge0, float edge1, float value){
    return clamp((value-edge0)/(edge1-edge0), 0.0, 1.0);
}

float linstepOpen(float edge0, float edge1, float value){
    return (value-edge0)/(edge1-edge0);
}

vec2 linstep(vec2 edge0, vec2 edge1, vec2 value){
    return clamp((value-edge0)/(edge1-edge0), vec2(0.0), vec2(1.0));
}

vec2 linstepOpen(vec2 edge0, vec2 edge1, vec2 value){
    return (value-edge0)/(edge1-edge0);
}\
`;

defaultExport.Shader = (Shader = class Shader extends ShaderObj {
    constructor(gf, params) {
        {
          // Hack: trick Babel/TypeScript into allowing this before super.
          if (false) { super(); }
          let thisFn = (() => { return this; }).toString();
          let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
          eval(`${thisName} = this;`);
        }
        this.gf = gf;
        this.gl = this.gf.gl;

        this.program    = this.gl.createProgram();
        this.vs         = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.fs         = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.gl.attachShader(this.program, this.vs);
        this.gl.attachShader(this.program, this.fs);

        this.source(params);
    }

    source(params) {
        let common, fragment, vertex;
        if (typeof params === 'string') {
            [common, vertex, fragment] = Array.from(this.splitSource(params));
        } else if (params instanceof sys.File) {
            [common, vertex, fragment] = Array.from(this.splitSource(params.read()));
        } else if (params instanceof Array) {
            common = [];
            vertex = [];
            fragment = [];
            for (let file of Array.from(params)) {
                const [c, v, f] = Array.from(this.splitSource(file.read()));
                if (c.length > 0) { common.push(c); }
                if (v.length > 0) { vertex.push(v); }
                if (f.length > 0) { fragment.push(f); }
            }

            common = common.join('\n');
            vertex = vertex.join('\n');
            fragment = fragment.join('\n');
        }

        return this.setSource({common, vertex, fragment});
    }
    
    destroy() {
        this.gl.deleteShader(this.vs);
        this.gl.deleteShader(this.fs);
        return this.gl.deleteProgram(this.program);
    }

    splitSource(source) {
        const common = [];
        const vertex = [];
        const fragment = [];
        let current = common;

        const lines = source.trim().split('\n');
        const filename = lines.shift().split(' ')[1];

        for (let linenum = 0; linenum < lines.length; linenum++) {
            const line = lines[linenum];
            if (line.match(/vertex:$/)) {
                current = vertex;
            } else if (line.match(/fragment:$/)) {
                current = fragment;
            } else {
                current.push(`#line ${linenum} ${filename}`);
                current.push(line);
            }
        }

        return [common.join('\n').trim(), vertex.join('\n').trim(), fragment.join('\n').trim()];
    }

    preprocess(source) {
        const lines = [];
        const result = [];
        let filename = 'no file';
        let lineno = 1;
        for (let line of Array.from(source.trim().split('\n'))) {
            const match = line.match(/#line (\d+) (.*)/);
            if (match) {
                lineno = parseInt(match[1], 10)+1;
                filename = match[2];
            } else {
                lines.push({
                    source: line,
                    lineno,
                    filename
                });
                result.push(line);
                lineno += 1;
            }
        }
        return [result.join('\n'), lines];
    }
    
    setSource({common, vertex, fragment}) {
        this.uniformCache = {};
        this.attributeCache = {};

        if (common == null) { common = ''; }
        this.compileShader(this.vs, [common, vertex].join('\n'));
        this.compileShader(this.fs, [common, fragment].join('\n'));
        return this.link();
    }
    
    compileShader(shader, source) {
        let lines;
        source = [boilerplate, source].join('\n');
        [source, lines] = Array.from(this.preprocess(source));

        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(shader);
            throw this.translateError(error, lines);
        }
    }
    
    link() {
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            throw new Error(`Shader Link Error: ${this.gl.getProgramInfoLog(this.program)}`);
        }
    }
    
    translateError(error, lines) {
        const result = ['Shader Compile Error'];
        const iterable = error.split('\n');
        for (let i = 0; i < iterable.length; i++) {
            const line = iterable[i];
            const match = line.match(/ERROR: \d+:(\d+): (.*)/);
            if (match) {
                const lineno = parseFloat(match[1])-1;
                const message = match[2];
                const sourceline = lines[lineno];
                result.push(`File \"${sourceline.filename}\", Line ${sourceline.lineno}, ${message}`);
                result.push(`   ${sourceline.source}`);
            } else {
                result.push(line);
            }
        }

        return result.join('\n');
    }
    
    attributeLocation(name) {
        let location = this.attributeCache[name];
        if (location === undefined) {
            location = this.gl.getAttribLocation(this.program, name);
            if (location >= 0) {
                this.attributeCache[name] = location;
                return location;
            } else {
                this.attributeCache[name] = null;
                return null;
            }
        } else {
            return location;
        }
    }
    
    uniformLocation(name) {
        let location = this.uniformCache[name];
        if (location === undefined) {
            location = this.gl.getUniformLocation(this.program, name);
            if (location != null) {
                this.uniformCache[name] = location;
                return location;
            } else {
                this.uniformCache[name] = null;
                return null;
            }
        } else {
            return location;
        }
    }
    
    use() {
        if (this.gf.currentShader !== this) {
            this.gf.currentShader = this;
            return this.gl.useProgram(this.program);
        }
    }

    mat4(name, value) {
        if (value instanceof matrix.Mat4) {
            value = value.data;
        }

        const location = this.uniformLocation(name);
        if (location != null) {
            this.use();
            this.gl.uniformMatrix4fv(location, false, value);
        }
        
        return this;
    }
    
    mat3(name, value) {
        if (value instanceof matrix.Mat3) {
            value = value.data;
        }

        const location = this.uniformLocation(name);
        if (location != null) {
            this.use();
            this.gl.uniformMatrix3fv(location, false, value);
        }
        
        return this;
    }
    
    vec2(name, a, b) {
        const location = this.uniformLocation(name);

        if (location != null) {
            this.use();
            if (a instanceof Array || a instanceof Float32Array) {
                this.gl.uniform2fv(location, a);
            } else {
                this.gl.uniform2f(location, a, b);
            }
        }
        return this;
    }

    vec3(name, a, b, c) {
        const location = this.uniformLocation(name);

        if (location != null) {
            this.use();
            if (a instanceof Array || a instanceof Float32Array) {
                this.gl.uniform3fv(location, a);
            } else {
                this.gl.uniform3f(location, a, b, c);
            }
        }
        return this;
    }
    
    vec4(name, a, b, c, d) {
        const location = this.uniformLocation(name);

        if (location != null) {
            this.use();
            if (a instanceof Array || a instanceof Float32Array) {
                this.gl.uniform4fv(location, a);
            } else {
                this.gl.uniform4f(location, a, b, c, d);
            }
        }
        return this;
    }

    int(name, value) {
        const location = this.uniformLocation(name);
        if (location != null) {
            this.use();
            this.gl.uniform1i(location, value);
        }
        return this;
    }

    uniformSetter(obj) {
        obj.setUniformsOn(this);
        return this;
    }

    float(name, value) {
        const location = this.uniformLocation(name);
        if (location != null) {
            this.use();
            if (value instanceof Array || value instanceof Float32Array) {
                this.gl.uniform1fv(location, value);
            } else {
                this.gl.uniform1f(location, value);
            }
        }
        return this;
    }
});

defaultExport.ShaderProxy = (ShaderProxy = class ShaderProxy extends ShaderObj {
    constructor(shader=null) {
        {
          // Hack: trick Babel/TypeScript into allowing this before super.
          if (false) { super(); }
          let thisFn = (() => { return this; }).toString();
          let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
          eval(`${thisName} = this;`);
        }
        this.shader = shader;
    }
    
    attributeLocation(name) {
        return this.shader.attributeLocation(name);
    }

    uniformLocation(name) {
        return this.shader.uniformLocation(name);
    }

    use() {
        this.shader.use();
        return this;
    }

    mat4(name, value) {
        this.shader.mat4(name, value);
        return this;
    }

    vec2(name, a, b) {
        this.shader.vec2(name, a, b);
        return this;
    }

    vec3(name, a, b, c) {
        this.shader.vec3(name, a, b, c);
        return this;
    }
    
    vec4(name, a, b, c, d) {
        this.shader.vec4(name, a, b, c, d);
        return this;
    }

    int(name, value) {
        this.shader.int(name, value);
        return this;
    }

    uniformSetter(obj) {
        this.shader.uniformSetter(obj);
        return this;
    }

    float(name, value) {
        this.shader.float(name, value);
        return this;
    }
});
export default defaultExport;
