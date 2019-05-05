/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let VertexBuffer;
import util from 'util';

const exports = (VertexBuffer = class VertexBuffer {
    constructor(gf, {pointers, vertices, mode, stride}) {
        this.gf = gf;
        this.gl = this.gf.gl;
        this.buffer = this.gl.createBuffer();
        
        if (mode != null) {
            this.mode = this.gl[mode.toUpperCase()];
        } else {
            this.mode = this.gl.TRIANGLES;
        }

        let offset = 0;
        
        this.pointers = (() => {
            const result = [];
            for (let pointer of Array.from(pointers)) {
                pointer = util.clone(pointer);

                if (pointer.size == null) { pointer.size = 4; }

                pointer.type = this.gl.FLOAT;
                pointer.typeSize = 4;
                pointer.byteSize = pointer.typeSize * pointer.size;
                pointer.offset = offset;
                offset += pointer.byteSize;
                result.push(pointer);
            }
            return result;
        })();

        this.stride = offset;
        if (vertices != null) {
            this.vertices(vertices);
        }
    }

    destroy() {
        this.gl.deleteBuffer(this.buffer);
        return this;
    }

    vertices(data) {
        if (data instanceof Array) {
            data = new Float32Array(data);
        }

        this.count = data.buffer.byteLength/this.stride;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        return this;
    }
    
    bind() {
        // does not seem to work correctly
        //if @gf.currentVertexbuffer isnt @
        //    @gf.currentVertexbuffer = @
        //    @gl.bindBuffer @gl.ARRAY_BUFFER, @buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        return this;
    }

    unbind() {
        if (this.gf.currentVertexbuffer != null) {
            this.gf.currentVertexbuffer = null;
            return this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        }
    }
    
    draw(first, count) {
        if (first == null) { first = 0; }
        if (count == null) { ({ count } = this); }
        this.gl.drawArrays(this.mode, first, count);
        return this;
    }
});
