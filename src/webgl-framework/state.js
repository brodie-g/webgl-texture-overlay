let State;
import util from'./util';

import VertexBuffer from'./vertexbuffer';
import { ShaderObj } from'./shader';
import framebuffer from'./framebuffer';

const exports = (State = class State {
    constructor(gf, params) {
        this.blendAlpha = this.blendAlpha.bind(this);
        let location;
        this.gf = gf;
        this.gl = this.gf.gl;

        if (params.shader instanceof ShaderObj) {
            this.shader = params.shader;
            this.ownShader = false;
        } else {
            this.shader = this.gf.shader(params.shader);
            this.ownShader = true;
        }

        if (params.framebuffer != null) {
            if (params.framebuffer instanceof framebuffer.Framebuffer) {
                this.framebuffer = params.framebuffer;
                this.ownFramebuffer = false;
            } else {
                this.framebuffer = this.gf.framebuffer(params.framebuffer);
                this.ownFramebuffer = true;
            }
        } else {
            this.framebuffer = null;
            this.ownFramebuffer = false;
        }

        if (params.vertexbuffer != null) {
            if (params.vertexbuffer instanceof VertexBuffer) {
                this.vertexbuffer = params.vertexbuffer;
                this.ownVertexbuffer = false;
            } else {
                this.vertexbuffer = this.gf.vertexbuffer(params.vertexbuffer);
                this.ownVertexbuffer = true;
            }
        } else {
            this.vertexbuffer = this.gf.quadVertices;
            this.ownVertexBuffer = false;
        }

        this.pointers = (() => {
            let asc, end;
            const result = [];
            for (location = 0, end = this.gf.maxAttribs, asc = 0 <= end; asc ? location < end : location > end; asc ? location++ : location--) {
                result.push(null);
            }
            return result;
        })();

        for (let pointer of Array.from(this.vertexbuffer.pointers)) {
            location = this.shader.attributeLocation(pointer.name);
            if (location != null) {
                pointer = util.clone(pointer);
                pointer.location = location;
                this.pointers[location] = pointer;
            }
        }

        this.texturesByName = {};
        this.textures = [];

        this.depthTest = params.depthTest != null ? params.depthTest : false;
        this.depthWrite = params.depthWrite != null ? params.depthWrite : true;
        if (params.colorWrite != null) {
            if (params.colorWrite instanceof Array) {
                this.colorWrite = params.colorWrite;
            } else {
                this.colorWrite = [params.colorWrite, params.colorWrite, params.colorWrite, params.colorWrite];
            }
        } else {
            this.colorWrite = [true,true,true,true];
        }

        if (params.depthFunc != null) {
            let left;
            this.depthFunc = (left = this.gl[params.depthFunc.toUpperCase()]) != null ? left : this.gl.LESS;
        } else {
            this.depthFunc = this.gl.LESS;
        }

        if (params.cull != null) {
            let left1;
            this.cullFace = (left1 = this.gl[params.cull.toUpperCase()]) != null ? left1 : this.gl.BACK;
        } else {
            this.cullFace = false;
        }

        this.lineWidth = params.lineWidth != null ? params.lineWidth : 1;

        if (params.blend != null) {
            switch (params.blend) {
                case 'alpha':
                    this.blend = this.blendAlpha;
                    break;
                default:
                    throw new Error(`blend mode is not implemented: ${params.blend}`);
            }
        } else {
            this.blend = null;
        }

        if (params.uniforms != null) {
            for (let uniform of Array.from(params.uniforms)) {
                this[uniform.type](uniform.name, uniform.value);
            }
        }

        if (this.gf.vao != null) {
            this.vao = this.gf.vao.createVertexArrayOES();
            this.gf.vao.bindVertexArrayOES(this.vao);
            this.setPointers();
            this.gf.vao.bindVertexArrayOES(null);
        } else {
            this.vao = null;
        }
    }

    destroy() {
        if (this.ownShader) {
            this.shader.destroy();
        }
        if (this.ownBuffer) {
            this.vertexbuffer.destroy();
        }

        if (this.vao != null) {
            return this.gf.vao.deleteVertexArrayOES(this.vao);
        }
    }

    blendAlpha() {
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        return this.gl.enable(this.gl.BLEND);
    }

    clearColor(r, g, b, a) {
        if (r == null) { r = 0; }
        if (g == null) { g = 0; }
        if (b == null) { b = 0; }
        if (a == null) { a = 1; }
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

    setViewport(width, height) {
        if (width == null) { ({ width } = this.gl.canvas); }
        if (height == null) { ({ height } = this.gl.canvas); }

        return this.gl.viewport(0, 0, width, height);
    }

    setPointers() {
        this.vertexbuffer.bind();
        for (let location = 0; location < this.pointers.length; location++) {
            const pointer = this.pointers[location];
            if (pointer != null) {
                if (!this.gf.vertexUnits[location].enabled) {
                    this.gl.enableVertexAttribArray(pointer.location);
                }

                this.gl.vertexAttribPointer(
                    pointer.location,
                    pointer.size,
                    pointer.type,
                    false,
                    this.vertexbuffer.stride,
                    pointer.offset
                );
            } else {
                if (this.gf.vertexUnits[location].enabled) {
                    this.gl.disableVertexAttribArray(location);
                }
            }
        }
    }

    setupVertexBuffer() {
        if (this.vao != null) {
            return this.gf.vao.bindVertexArrayOES(this.vao);
        } else {
            return this.setPointers();
        }
    }

    setupState() {
        if (this.depthTest) {
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.depthFunc(this.depthFunc);
        } else {
            this.gl.disable(this.gl.DEPTH_TEST);
        }

        this.gl.depthMask(this.depthWrite);
        this.gl.colorMask(this.colorWrite[0], this.colorWrite[1], this.colorWrite[2], this.colorWrite[3]);

        if (this.cullFace) {
            this.gl.enable(this.gl.CULL_FACE);
            this.gl.cullFace(this.cullFace);
        } else {
            this.gl.disable(this.gl.CULL_FACE);
        }

        if (this.blend != null) {
            this.blend();
        } else {
            this.gl.disable(this.gl.BLEND);
        }

        if ((this.vertexbuffer.mode === this.gl.LINES) || (this.vertexbuffer.mode === this.gl.LINE_STRIP)) {
            if (this.gf.lineWidth !== this.lineWidth) {
                this.gf.lineWidth = this.lineWidth;
                this.gl.lineWidth(this.lineWidth);
            }
        }

        this.shader.use();

        this.setupVertexBuffer();

        return this.gf.currentState = this;
    }

    draw(first, count) {
        if (this.framebuffer != null) {
            this.framebuffer.viewport();
        } else {
            this.setViewport();
        }

        if (this.framebuffer != null) {
            this.framebuffer.use();
        } else {
            if (this.gf.currentFramebuffer != null) {
                this.gf.currentFramebuffer.unuse();
            }
        }

        for (let unit = 0; unit < this.textures.length; unit++) { //FIXME
            const texture = this.textures[unit];
            texture.texture.bind(unit);
            this.int(texture.name, unit);
        }

        if (this.gf.currentState !== this) {
            this.setupState();
        }

        this.vertexbuffer.draw(first, count);

        return this;
    }

    mat4(name, value) {
        this.shader.mat4(name, value);
        return this;
    }

    mat3(name, value) {
        this.shader.mat3(name, value);
        return this;
    }

    int(name, value) {
        this.shader.int(name, value);
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

    uniformSetter(obj) {
        this.shader.uniformSetter(obj);
        return this;
    }

    float(name, value) {
        this.shader.float(name, value);
        return this;
    }

    sampler(name, texture) {
        let stored = this.texturesByName[name];
        if ((stored == null)) {
            stored = {name, texture};
            this.texturesByName[name] = stored;
            this.textures.push(stored);
        }

        if (stored.texture !== texture) {
            stored.texture = texture;
        }

        return this;
    }

    bind(unit) {
        if (unit == null) { unit = 0; }
        if (this.framebuffer != null) {
            this.framebuffer.bind(unit);
        } else {
            throw new Error('State has no attached framebuffer');
        }

        return this;
    }

    generateMipmap() {
        if (this.framebuffer != null) {
            this.framebuffer.generateMipmap();
        } else {
            throw new Error('State has no attached framebuffer');
        }

        return this;
    }

    anisotropy() {
        if (this.framebuffer != null) {
            this.framebuffer.anisotropy();
        } else {
            throw new Error('State has no attached framebuffer');
        }

        return this;
    }

    vertices(data) {
        this.vertexbuffer.vertices(data);
        return this;
    }

    cubeSide(name) {
        if (this.framebuffer != null) {
            this.framebuffer.cubeSide(name);
        } else {
            throw new Error('State has no attached framebuffer');
        }
        return this;
    }
});

export default exports;
