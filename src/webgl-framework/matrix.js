/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Mat3, Mat4;
const tau = Math.PI*2;
const deg = 360/tau;
const arc = tau/360;

let defaultExport = {};
defaultExport.Mat3 = (Mat3 = class Mat3 {
    constructor(view) {
        this.view = view;
        if (this.data == null) { this.data = new Float32Array(9); }
        this.identity();
    }
    
    identity() {
        const d = this.data;
        d[0]  = 1; d[1]  =0; d[2] = 0;
        d[3]  = 0; d[4]  =1; d[5] = 0;
        d[6]  = 0; d[7]  =0; d[8] = 1;
        return this;
    }

    rotatex(angle) {
        const s = Math.sin(angle*arc);
        const c = Math.cos(angle*arc);
        return this.amul(
             1,  0,  0,
             0,  c,  s,
             0, -s,  c
        );
    }
    
    rotatey(angle) {
        const s = Math.sin(angle*arc);
        const c = Math.cos(angle*arc);
        return this.amul(
             c,  0, -s,
             0,  1,  0,
             s,  0,  c
        );
    }
    
    rotatez(angle) {
        const s = Math.sin(angle*arc);
        const c = Math.cos(angle*arc);
        return this.amul(
             c,  s,  0,
            -s,  c,  0,
             0,  0,  1
        );
    }

    amul(
        b00, b10, b20,
        b01, b11, b21,
        b02, b12, b22,
        b03, b13, b23
    ) {
        const a = this.data;

        const a00 = a[0];
        const a10 = a[1];
        const a20 = a[2];
        
        const a01 = a[3];
        const a11 = a[4];
        const a21 = a[5];
        
        const a02 = a[6];
        const a12 = a[7];
        const a22 = a[8];
        
        a[0]  = (a00*b00) + (a01*b10) + (a02*b20);
        a[1]  = (a10*b00) + (a11*b10) + (a12*b20);
        a[2]  = (a20*b00) + (a21*b10) + (a22*b20);
        
        a[3]  = (a00*b01) + (a01*b11) + (a02*b21);
        a[4]  = (a10*b01) + (a11*b11) + (a12*b21);
        a[5]  = (a20*b01) + (a21*b11) + (a22*b21);
        
        a[6]  = (a00*b02) + (a01*b12) + (a02*b22);
        a[7]  = (a10*b02) + (a11*b12) + (a12*b22);
        a[8]  = (a20*b02) + (a21*b12) + (a22*b22);

        return this;
    }
});

defaultExport.Mat4 = (Mat4 = class Mat4 {
    constructor(view) {
        this.view = view;
        if (this.data == null) { this.data = new Float32Array(16); }
        this.identity();
    }
    
    identity() {
        const d = this.data;
        d[0]  = 1; d[1]  =0; d[2]  = 0; d[3]  = 0;
        d[4]  = 0; d[5]  =1; d[6]  = 0; d[7]  = 0;
        d[8]  = 0; d[9]  =0; d[10] = 1; d[11] = 0;
        d[12] = 0; d[13] =0; d[14] = 0; d[15] = 1;
        return this;
    }
    
    zero() {
        const d = this.data;
        d[0]  = 0; d[1]  =0; d[2]  = 0; d[3]  = 0;
        d[4]  = 0; d[5]  =0; d[6]  = 0; d[7]  = 0;
        d[8]  = 0; d[9]  =0; d[10] = 0; d[11] = 0;
        d[12] = 0; d[13] =0; d[14] = 0; d[15] = 0;
        return this;
    }
    
    copy(dest) {
        if (dest == null) { dest = new Mat4(); }

        const src = this.data;
        const dst = dest.data;
        dst[0] = src[0];
        dst[1] = src[1];
        dst[2] = src[2];
        dst[3] = src[3];
        dst[4] = src[4];
        dst[5] = src[5];
        dst[6] = src[6];
        dst[7] = src[7];
        dst[8] = src[8];
        dst[9] = src[9];
        dst[10] = src[10];
        dst[11] = src[11];
        dst[12] = src[12];
        dst[13] = src[13];
        dst[14] = src[14];
        dst[15] = src[15];
        return dest;
    }
    
    perspective(fov, aspect, near, far) {
        if (fov == null) { fov = 60; }
        if (aspect == null) { aspect = 1; }
        if (near == null) { near = 0.01; }
        if (far == null) { far = 100; }

        // diagonal fov
        const hyp = Math.sqrt(1 + (aspect*aspect));
        const rel = 1/hyp;
        const vfov = fov*rel;

        this.zero();
        const d = this.data;
        const top = near * Math.tan((vfov*Math.PI)/360);
        const right = top*aspect;
        const left = -right;
        const bottom = -top;

        d[0] = (2*near)/(right-left);
        d[5] = (2*near)/(top-bottom);
        d[8] = (right+left)/(right-left);
        d[9] = (top+bottom)/(top-bottom);
        d[10] = -(far+near)/(far-near);
        d[11] = -1;
        d[14] = -(2*far*near)/(far-near);

        return this;
    }
    
    translate(x, y, z) {
        const d = this.data;
        const a00 = d[0]; const a01 = d[1]; const a02 = d[2]; const a03 = d[3];
        const a10 = d[4]; const a11 = d[5]; const a12 = d[6]; const a13 = d[7];
        const a20 = d[8]; const a21 = d[9]; const a22 = d[10]; const a23 = d[11];

        d[12] = (a00 * x) + (a10 * y) + (a20 * z) + d[12];
        d[13] = (a01 * x) + (a11 * y) + (a21 * z) + d[13];
        d[14] = (a02 * x) + (a12 * y) + (a22 * z) + d[14];
        d[15] = (a03 * x) + (a13 * y) + (a23 * z) + d[15];

        return this;
    }
    
    rotatex(angle) {
        const d = this.data;
        const rad = tau*(angle/360);
        const s = Math.sin(rad);
        const c = Math.cos(rad);

        const a10 = d[4];
        const a11 = d[5];
        const a12 = d[6];
        const a13 = d[7];
        const a20 = d[8];
        const a21 = d[9];
        const a22 = d[10];
        const a23 = d[11];

        d[4] = (a10 * c) + (a20 * s);
        d[5] = (a11 * c) + (a21 * s);
        d[6] = (a12 * c) + (a22 * s);
        d[7] = (a13 * c) + (a23 * s);
        d[8] = (a10 * -s) + (a20 * c);
        d[9] = (a11 * -s) + (a21 * c);
        d[10] = (a12 * -s) + (a22 * c);
        d[11] = (a13 * -s) + (a23 * c);

        return this;
    }

    rotatey(angle) {
        const d = this.data;
        const rad = tau*(angle/360);
        const s = Math.sin(rad);
        const c = Math.cos(rad);

        const a00 = d[0];
        const a01 = d[1];
        const a02 = d[2];
        const a03 = d[3];
        const a20 = d[8];
        const a21 = d[9];
        const a22 = d[10];
        const a23 = d[11];

        d[0] = (a00 * c) + (a20 * -s);
        d[1] = (a01 * c) + (a21 * -s);
        d[2] = (a02 * c) + (a22 * -s);
        d[3] = (a03 * c) + (a23 * -s);
        d[8] = (a00 * s) + (a20 * c);
        d[9] = (a01 * s) + (a21 * c);
        d[10] = (a02 * s) + (a22 * c);
        d[11] = (a03 * s) + (a23 * c);

        return this;
    }

    rotatez(angle) {
        const d = this.data;
        const rad = tau*(angle/360);
        const s = Math.sin(rad);
        const c = Math.cos(rad);

        const a00 = d[0];
        const a01 = d[1];
        const a02 = d[2];
        const a03 = d[3];
        const a10 = d[4];
        const a11 = d[5];
        const a12 = d[6];
        const a13 = d[7];

        d[0] = (a00 * c) + (a10 * s);
        d[1] = (a01 * c) + (a11 * s);
        d[2] = (a02 * c) + (a12 * s);
        d[3] = (a03 * c) + (a13 * s);
        d[4] = (a10 * c) - (a00 * s);
        d[5] = (a11 * c) - (a01 * s);
        d[6] = (a12 * c) - (a02 * s);
        d[7] = (a13 * c) - (a03 * s);

        return this;
    }
    
    invert(destination) {
        if (destination == null) { destination = this; }
        const src = this.data;
        const dst = destination.data;

        const a00 = src[0]; const a01 = src[1]; const a02 = src[2]; const a03 = src[3];
        const a10 = src[4]; const a11 = src[5]; const a12 = src[6]; const a13 = src[7];
        const a20 = src[8]; const a21 = src[9]; const a22 = src[10]; const a23 = src[11];
        const a30 = src[12]; const a31 = src[13]; const a32 = src[14]; const a33 = src[15];

        const b00 = (a00 * a11) - (a01 * a10);
        const b01 = (a00 * a12) - (a02 * a10);
        const b02 = (a00 * a13) - (a03 * a10);
        const b03 = (a01 * a12) - (a02 * a11);
        const b04 = (a01 * a13) - (a03 * a11);
        const b05 = (a02 * a13) - (a03 * a12);
        const b06 = (a20 * a31) - (a21 * a30);
        const b07 = (a20 * a32) - (a22 * a30);
        const b08 = (a20 * a33) - (a23 * a30);
        const b09 = (a21 * a32) - (a22 * a31);
        const b10 = (a21 * a33) - (a23 * a31);
        const b11 = (a22 * a33) - (a23 * a32);

        const d = (((((b00 * b11) - (b01 * b10)) + (b02 * b09) + (b03 * b08)) - (b04 * b07)) + (b05 * b06));
            
        if (d===0) { return; }
        const invDet = 1 / d;

        dst[0] = (((a11 * b11) - (a12 * b10)) + (a13 * b09)) * invDet;
        dst[1] = (((-a01 * b11) + (a02 * b10)) - (a03 * b09)) * invDet;
        dst[2] = (((a31 * b05) - (a32 * b04)) + (a33 * b03)) * invDet;
        dst[3] = (((-a21 * b05) + (a22 * b04)) - (a23 * b03)) * invDet;
        dst[4] = (((-a10 * b11) + (a12 * b08)) - (a13 * b07)) * invDet;
        dst[5] = (((a00 * b11) - (a02 * b08)) + (a03 * b07)) * invDet;
        dst[6] = (((-a30 * b05) + (a32 * b02)) - (a33 * b01)) * invDet;
        dst[7] = (((a20 * b05) - (a22 * b02)) + (a23 * b01)) * invDet;
        dst[8] = (((a10 * b10) - (a11 * b08)) + (a13 * b06)) * invDet;
        dst[9] = (((-a00 * b10) + (a01 * b08)) - (a03 * b06)) * invDet;
        dst[10] = (((a30 * b04) - (a31 * b02)) + (a33 * b00)) * invDet;
        dst[11] = (((-a20 * b04) + (a21 * b02)) - (a23 * b00)) * invDet;
        dst[12] = (((-a10 * b09) + (a11 * b07)) - (a12 * b06)) * invDet;
        dst[13] = (((a00 * b09) - (a01 * b07)) + (a02 * b06)) * invDet;
        dst[14] = (((-a30 * b03) + (a31 * b01)) - (a32 * b00)) * invDet;
        dst[15] = (((a20 * b03) - (a21 * b01)) + (a22 * b00)) * invDet;

        return destination;
    }
    
    toMat3Rot(dest) {
        const dst = dest.data;
        const src = this.data;
        const a00 = src[0]; const a01 = src[1]; const a02 = src[2];
        const a10 = src[4]; const a11 = src[5]; const a12 = src[6];
        const a20 = src[8]; const a21 = src[9]; const a22 = src[10];

        const b01 = (a22 * a11) - (a12 * a21);
        const b11 = (-a22 * a10) + (a12 * a20);
        const b21 = (a21 * a10) - (a11 * a20);

        const d = (a00 * b01) + (a01 * b11) + (a02 * b21);
        const id = 1 / d;

        dst[0] = b01 * id;
        dst[3] = ((-a22 * a01) + (a02 * a21)) * id;
        dst[6] = ((a12 * a01) - (a02 * a11)) * id;
        dst[1] = b11 * id;
        dst[4] = ((a22 * a00) - (a02 * a20)) * id;
        dst[7] = ((-a12 * a00) + (a02 * a10)) * id;
        dst[2] = b21 * id;
        dst[5] = ((-a21 * a00) + (a01 * a20)) * id;
        dst[8] = ((a11 * a00) - (a01 * a10)) * id;

        return dest;
    }
});
export default defaultExport;
