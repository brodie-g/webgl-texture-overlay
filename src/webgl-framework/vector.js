let Vec3;
const tau = Math.PI*2;

let defaultExport = {};
defaultExport.Vec3 = (Vec3 = class Vec3 {
    constructor(x, y, z) { if (x == null) { x = 0; } this.x = x; if (y == null) { y = 0; } this.y = y; if (z == null) { z = 0; } this.z = z; null; }

    set(x, y, z) { if (x == null) { x = 0; } this.x = x; if (y == null) { y = 0; } this.y = y; if (z == null) { z = 0; } this.z = z; return this; }

    rotatey(angle) {
        const rad = tau*(angle/360);
        const s = Math.sin(rad);
        const c = Math.cos(rad);

        const x = (this.z*s) + (this.x*c);
        const z = (this.z*c) - (this.x*s);

        this.x = x;
        this.z = z;

        return this;
    }
});
export default defaultExport;
