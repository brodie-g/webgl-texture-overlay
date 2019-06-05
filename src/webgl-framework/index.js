let getExtension, getSupportedExtensions;
if (window.WebGLRenderingContext != null) {
    const vendors = ['WEBKIT', 'MOZ', 'MS', 'O'];
    const vendorRe = /^WEBKIT_(.*)|MOZ_(.*)|MS_(.*)|O_(.*)/;

    ({ getExtension } = WebGLRenderingContext.prototype);
    WebGLRenderingContext.prototype.getExtension = function(name) {
        const match = name.match(vendorRe);
        if (match !== null) {
            name = match[1];
        }

        let extobj = getExtension.call(this, name);
        if (extobj === null) {
            for (let vendor of Array.from(vendors)) {
                extobj = getExtension.call(this, vendor + '_' + name);
                if (extobj !== null) {
                    return extobj;
                }
            }
            return null;
        } else {
            return extobj;
        }
    };

    ({ getSupportedExtensions } = WebGLRenderingContext.prototype);
    WebGLRenderingContext.prototype.getSupportedExtensions = function() {
        const supported = getSupportedExtensions.call(this);
        const result = [];

        for (let extension of Array.from(supported)) {
            const match = extension.match(vendorRe);
            if (match !== null) {
                extension = match[1];
            }

            if (!Array.from(result).includes(extension)) {
                result.push(extension);
            }
        }

        return result;
    };
}

import shims from './shims';
import textureFloat from './texture-float';
import texture from './texture';
import matrix from './matrix';
import vector from './vector';

import State from './state';
import VertexBuffer from './vertexbuffer';
import {Shader, ShaderProxy} from './shader';
import framebuffer from './framebuffer';

export default class WebGLFramework {
    constructor(params) {
        if (params == null) { params = {}; }
        const debug = params.debug != null ? params.debug : false;
        delete params.debug;

        const perf = params.perf != null ? params.perf : false;
        delete params.perf;

        if (!params.gl) {
            this.canvas = params.canvas != null ? params.canvas : document.createElement('canvas');
            delete params.canvas;
        }

        if (params.gl) {
            this.gl = params.gl;
            delete params.gl;
        } else {
            this.gl = this.getContext('webgl', params);

            if ((this.gl == null)) {
                this.gl = this.getContext('experimental-webgl');
            }
        }

        if ((this.gl == null)) {
            throw new Error('WebGL is not supported');
        }

        this.textureFloat = textureFloat(this.gl);

        // might be slower than manual pointer handling
        //if @haveExtension('OES_vertex_array_object')
        //    @vao = @gl.getExtension('OES_vertex_array_object')
        //else
        //    @vao = null
        this.vao = null;

        if ((window.WebGLPerfContext != null) && perf) {
            console.log('webgl perf context enabled');
            this.gl = new WebGLPerfContext.create(this.gl);
        } else if ((window.WebGLDebugUtils != null) && debug) {
            console.log('webgl debug enabled');
            this.gl = WebGLDebugUtils.makeDebugContext(this.gl, function(err, funcName, args) {
                throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to: " + funcName;
            });
        }

        this.currentVertexBuffer = null;
        this.currentShader = null;
        this.currentFramebuffer = null;
        this.currentState = null;

        this.maxAttribs = this.gl.getParameter(this.gl.MAX_VERTEX_ATTRIBS);
        this.vertexUnits = __range__(0, this.maxAttribs, false).map((i) => (
            {enabled:false, pointer:null, location:i}));

        this.lineWidth = 1;

        this.quadVertices = this.vertexbuffer({
            pointers: [
                {name:'position', size:2}
            ],
            vertices: [
                -1, -1,  1, -1,  1,  1,
                -1,  1, -1, -1,  1,  1,
            ]});

        this.blit = this.state({
            shader: require('./blit.shader').default});
    }

    haveExtension(search) {
        for (let name of Array.from(this.gl.getSupportedExtensions())) {
            if (name.indexOf(search) >= 0) {
                return true;
            }
        }
        return false;
    }

    getContext(name, params) {
        try {
            return this.canvas.getContext(name, params);
        } catch (error) {
            return null;
        }
    }

    state(params) { return new State(this, params); }
    vertexbuffer(params) { return new VertexBuffer(this, params); }
    framebuffer(params) {
        if (params.type != null) {
            if (params.type === '2d') {
                return new framebuffer.Framebuffer2D(this, params);
            } else if (params.type === 'cube') {
                return new framebuffer.FramebufferCube(this, params);
            } else {
                throw new Error(`unknown framebuffer type: ${params.type}`);
            }

        } else {
            return new framebuffer.Framebuffer2D(this, params);
        }
    }

    shader(params) { return new Shader(this, params); }
    shaderProxy(shader) { return new ShaderProxy(shader); }

    mat4(view) { return new matrix.Mat4(view); }
    mat3(view) { return new matrix.Mat3(view); }
    vec3(x, y, z) { return new vector.Vec3(x,y,z); }

    clearColor(r, g, b, a) {
        this.gl.clearColor(r, g, b, a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        return this;
    }

    clearDepth(value) {
        if (value == null) { value = 1; }
        this.gl.clearDepth(value);
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
        return this;
    }

    frameStart() {
        let factor;
        if (fullscreen.element() != null) {
            factor = 1;
        } else {
            factor = 2;
        }

        if ((this.canvas.offsetWidth*factor) !== this.canvas.width) {
            this.canvas.width = this.canvas.offsetWidth*factor;
        }

        if ((this.canvas.offsetHeight*factor) !== this.canvas.height) {
            this.canvas.height = this.canvas.offsetHeight*factor;
        }

        if (this.gl.performance != null) {
            this.gl.performance.start();
        }
        return this;
    }

    frameEnd() {
        if (this.gl.performance != null) {
            this.gl.performance.stop();
        }
        return this;
    }

    texture2D(params) {
        return new texture.Texture2D(this, params);
    }

    textureCube(params) {
        return new texture.TextureCube(this, params);
    }

    getExtension(name) {
        return this.gl.getExtension(name);
    }

    htmlColor2Vec(value) {
        const r = parseInt(value.slice(0, 2), 16)/255;
        const g = parseInt(value.slice(2, 4), 16)/255;
        const b = parseInt(value.slice(4), 16)/255;
        return {r, g, b};
    }
}

function __range__(left, right, inclusive) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}
