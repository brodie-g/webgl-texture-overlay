let Texture, Texture2D, TextureCube;
let defaultExport = {};
defaultExport.Texture = (Texture = class Texture {});

class ConcreteTexture extends defaultExport.Texture {
    constructor(gf, params) {
        {
          // Hack: trick Babel/TypeScript into allowing this before super.
          if (false) { super(); }
          let thisFn = (() => { return this; }).toString();
          let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
          eval(`${thisName} = this;`);
        }
        this.gf = gf;
        if (params == null) { params = {}; }
        this.gl = this.gf.gl;
        this.handle = this.gl.createTexture();
        this.channels = this.gl[(params.channels != null ? params.channels : 'rgba').toUpperCase()];
        this.bind();

        if (typeof params.type === 'string') {
            this.type = this.gl[(params.type != null ? params.type : 'unsigned_byte').toUpperCase()];
        } else {
            this.type = params.type != null ? params.type : this.gl.UNSIGNED_BYTE;
        }

        const filter = params.filter != null ? params.filter : 'nearest';
        if (typeof filter === 'string') {
            this[filter]();
        } else {
            let left, left1;
            this.minify = (left = this.gl[filter.minify.toUpperCase()]) != null ? left : this.gl.LINEAR;
            this.magnify = (left1 = this.gl[filter.magnify.toUpperCase()]) != null ? left1 : this.gl.LINEAR;
            this.gl.texParameteri(this.target, this.gl.TEXTURE_MAG_FILTER, this.magnify);
            this.gl.texParameteri(this.target, this.gl.TEXTURE_MIN_FILTER, this.minify);
        }

        const clamp = params.clamp != null ? params.clamp : 'edge';
        if (typeof clamp === 'string') {
            this[clamp]();
        } else {
            let sClamp, tClamp;
            if (clamp.s === 'edge') {
                sClamp = this.gl.CLAMP_TO_EDGE;
            } else if (clamp.s === 'repeat') {
                sClamp = this.gl.REPEAT;
            } else {
                throw new Error(`unknown S clamp mode: ${clamp.s}`);
            }

            if (clamp.t === 'edge') {
                tClamp = this.gl.CLAMP_TO_EDGE;
            } else if (clamp.t === 'repeat') {
                tClamp = this.gl.REPEAT;
            } else {
                throw new Error(`unknown T clamp mode: ${clamp.t}`);
            }

            this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_S, sClamp);
            this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_T, tClamp);
        }
    }

    destroy() {
        return this.gl.deleteTexture(this.handle);
    }

    generateMipmap() {
        this.mipmapped = true;
        this.bind();
        this.gl.generateMipmap(this.target);
        return this;
    }

    anisotropy() {
        this.anisotropic = true;
        const ext = this.gl.getExtension('EXT_texture_filter_anisotropic');
        if (ext) {
            const max = this.gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            return this.gl.texParameterf(this.target, ext.TEXTURE_MAX_ANISOTROPY_EXT, max);
        }
    }

    linear() {
        this.bind();

        this.gl.texParameteri(this.target, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.target, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        return this;
    }

    nearest() {
        this.bind();

        this.gl.texParameteri(this.target, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.target, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        return this;
    }

    repeat() {
        this.bind();

        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        return this;
    }

    edge() {
        this.bind();

        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        return this;
    }

    bind(unit) {
        if (unit == null) { unit = 0; }
        this.gl.activeTexture(this.gl.TEXTURE0+unit);
        this.gl.bindTexture(this.target, this.handle);
        return this;
    }
}

class CubeSide extends defaultExport.Texture {
    constructor(handle, target) {
        {
          // Hack: trick Babel/TypeScript into allowing this before super.
          if (false) { super(); }
          let thisFn = (() => { return this; }).toString();
          let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
          eval(`${thisName} = this;`);
        }
        this.handle = handle;
        this.target = target;
    }
}

defaultExport.TextureCube = (TextureCube = class TextureCube extends ConcreteTexture {
    constructor(gf, params) {
        {
          // Hack: trick Babel/TypeScript into allowing this before super.
          if (false) { super(); }
          let thisFn = (() => { return this; }).toString();
          let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
          eval(`${thisName} = this;`);
        }
        this.gf = gf;
        if (params == null) { params = {}; }
        this.target = this.gf.gl.TEXTURE_CUBE_MAP;
        super(this.gf, params);
        this.negativeX = new CubeSide(this.handle, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X);
        this.negativeY = new CubeSide(this.handle, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y);
        this.negativeZ = new CubeSide(this.handle, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z);
        this.positiveX = new CubeSide(this.handle, this.gl.TEXTURE_CUBE_MAP_POSITIVE_X);
        this.positiveY = new CubeSide(this.handle, this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y);
        this.positiveZ = new CubeSide(this.handle, this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z);

        this.size(params.size);

        if ([this.gl.NEAREST_MIPMAP_NEAREST, this.gl.LINEAR_MIPMAP_NEAREST, this.gl.NEAREST_MIPMAP_LINEAR, this.gl.LINEAR_MIPMAP_LINEAR].includes(this.minify)) {
            this.generateMipmap();
        }
    }

    size(size) {
        this.size = size;
        this.bind();
        this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, this.channels, this.size, this.size, 0, this.channels, this.type, null);
        this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, this.channels, this.size, this.size, 0, this.channels, this.type, null);
        this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, this.channels, this.size, this.size, 0, this.channels, this.type, null);
        this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, this.channels, this.size, this.size, 0, this.channels, this.type, null);
        this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, this.channels, this.size, this.size, 0, this.channels, this.type, null);
        this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, this.channels, this.size, this.size, 0, this.channels, this.type, null);

        return this;
    }

    dataSized(data, side, size) {
        this.size = size;
        this.bind();
        this.gl.texImage2D(this[side].target, 0, this.channels, this.size, this.size, 0, this.channels, this.type, data);
        return this;
    }
});

defaultExport.Texture2D = (Texture2D = class Texture2D extends ConcreteTexture {
    constructor(gf, params) {
        {
          // Hack: trick Babel/TypeScript into allowing this before super.
          if (false) { super(); }
          let thisFn = (() => { return this; }).toString();
          let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
          eval(`${thisName} = this;`);
        }
        this.gf = gf;
        if (params == null) { params = {}; }
        this.target = this.gf.gl.TEXTURE_2D;
        super(this.gf, params);

        if (params.data instanceof Image) {
            this.dataImage(params.data);
        } else if ((params.width != null) && (params.height != null)) {
            if (params.data != null) {
                this.dataSized(params.data, params.width, params.height);
            } else {
                this.size(params.width, params.height);
            }
        }

        if ([this.gl.NEAREST_MIPMAP_NEAREST, this.gl.LINEAR_MIPMAP_NEAREST, this.gl.NEAREST_MIPMAP_LINEAR, this.gl.LINEAR_MIPMAP_LINEAR].includes(this.minify)) {
            this.generateMipmap();
        }
    }

    loadImage(url) {
        const image = new Image();
        image.onload = () => {
            return this.dataImage(image);
        };
        return image.src = url;
    }

    dataImage(data) {
        this.bind();

        this.width = data.width;
        this.height = data.height;
        this.gl.texImage2D(this.target, 0, this.channels, this.channels, this.type, data);
        return this;
    }

    dataSized(data, width, height, unpackAlignment) {
        if (unpackAlignment == null) { unpackAlignment = 1; }
        this.bind();

        this.width = width;
        this.height = height;

        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, unpackAlignment);
        this.gl.texImage2D(this.target, 0, this.channels, this.width, this.height, 0, this.channels, this.type, data);
        return this;
    }

    size(width, height) {
        this.width = width;
        this.height = height;
        this.bind();
        this.gl.texImage2D(this.target, 0, this.channels, this.width, this.height, 0, this.channels, this.type, null);
        return this;
    }

    draw(scale) {
        if (scale == null) { scale = 1; }
        return this.gf.blit
            .float('scale', scale)
            .sampler('source', this)
            .draw();
    }
});
export default defaultExport;
