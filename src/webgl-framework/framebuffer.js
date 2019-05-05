// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Framebuffer, FramebufferCube;
import texture from 'texture';

let defaultExport = {};
defaultExport.Framebuffer = (Framebuffer = class Framebuffer {
    constructor(gf, params) {
        this.gf = gf;
        if (params == null) { params = {}; }
        this.gl = this.gf.gl;
        this.buffer = this.gl.createFramebuffer();
    }

    generateMipmap() {
        return this.colorTexture.generateMipmap();
    }

    anisotropy() {
        return this.colorTexture.anisotropy();
    }
    
    bind(unit) {
        if (unit == null) { unit = 0; }
        return this.colorTexture.bind(unit);
    }
    
    check() {
        const result = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
        switch (result) {
            case this.gl.FRAMEBUFFER_UNSUPPORTED:
                throw 'Framebuffer is unsupported';
                break;
            case this.gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                throw 'Framebuffer incomplete attachment';
                break;
            case this.gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                throw 'Framebuffer incomplete dimensions';
                break;
            case this.gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                throw 'Framebuffer incomplete missing attachment';
                break;
        }
        return this;
    }
    
    unuse() {
        if (this.gf.currentFramebuffer != null) {
            this.gf.currentFramebuffer = null;
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        }
        return this;
    }
});
    
defaultExport.Framebuffer2D = (Framebuffer = class Framebuffer extends defaultExport.Framebuffer {
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
        super(this.gf, params);
        if (params.color != null) {
            if (params.color instanceof texture.Texture) {
                this.color(params.color);
                this.ownColor = false;
            } else {
                this.color(this.gf.texture2D(params.color));
                this.ownColor = true;
            }
        } else {
            this.ownColor = false;
        }
    }

    color(colorTexture) {
        this.colorTexture = colorTexture;
        this.use();
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.colorTexture.target, this.colorTexture.handle, 0);
        this.check();
        this.unuse();
        return this;
    }
    
    use() {
        if (this.gf.currentFramebuffer !== this) {
            this.gf.currentFramebuffer = this;
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.buffer);
        }
        return this;
    }

    viewport(width, height) {
        if (width == null) { ({ width } = this.colorTexture); }
        if (height == null) { ({ height } = this.colorTexture); }
        return this.gl.viewport(0, 0, width, height);
    }
    
    destroy() {
        this.gl.deleteFramebuffer(this.buffer);
        if (this.ownColor) {
            this.color.destroy();
        }

        return this;
    }
});

defaultExport.FramebufferCube = (FramebufferCube = class FramebufferCube extends defaultExport.Framebuffer {
    constructor(gf, params) {
        {
          // Hack: trick Babel/TypeScript into allowing this before super.
          if (false) { super(); }
          let thisFn = (() => { return this; }).toString();
          let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
          eval(`${thisName} = this;`);
        }
        this.gf = gf;
        super(this.gf, params);

        this.negativeX = new defaultExport.Framebuffer2D(this.gf);
        this.negativeY = new defaultExport.Framebuffer2D(this.gf);
        this.negativeZ = new defaultExport.Framebuffer2D(this.gf);
        this.positiveX = new defaultExport.Framebuffer2D(this.gf);
        this.positiveY = new defaultExport.Framebuffer2D(this.gf);
        this.positiveZ = new defaultExport.Framebuffer2D(this.gf);

        this.currentSide = this.negativeX;
        
        const { color } = params;
        if (color != null) {
            if (params.color instanceof texture.Texture) {
                this.color(params.color);
            } else {
                this.color(this.gf.textureCube(params.color));
            }
        }
    }

    color(colorTexture) {
        this.colorTexture = colorTexture;
        this.negativeX.color(this.colorTexture.negativeX);
        this.negativeY.color(this.colorTexture.negativeY);
        this.negativeZ.color(this.colorTexture.negativeZ);
        this.positiveX.color(this.colorTexture.positiveX);
        this.positiveY.color(this.colorTexture.positiveY);
        return this.positiveZ.color(this.colorTexture.positiveZ);
    }

    destroy() {
        this.negativeX.destroy();
        this.negativeY.destroy();
        this.negativeZ.destroy();
        this.positiveX.destroy();
        this.positiveY.destroy();
        return this.positiveZ.destroy();
    }

    cubeSide(name) {
        return this.currentSide = this[name];
    }

    use() {
        return this.currentSide.use();
    }
    
    viewport(width, height) {
        if (width == null) { width = this.colorTexture.size; }
        if (height == null) { height = this.colorTexture.size; }
        return this.gl.viewport(0, 0, width, height);
    }
});
export default defaultExport;
    
