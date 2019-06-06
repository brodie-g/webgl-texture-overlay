// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
export default class ClipRegion {
    constructor(gf, overlay) {
        this.gf = gf;
        this.overlay = overlay;
        this.fill = this.gf.state({
            shader: require('./fill.shader').default,
            colorWrite: [false, false, false, true],
            vertexbuffer: {
                pointers: [
                    {name:'position', size:2}
                ]
            }});

        this.holes = this.gf.state({
            shader: require('./holes.shader').default,
            colorWrite: [false, false, false, true],
            vertexbuffer: {
                pointers: [
                    {name:'position', size:2}
                ]
            }});

        this.clear = this.gf.state({
            shader: require('./clear.shader').default,
            colorWrite: [false, false, false, true]});

        this.dirty = false;
    }

    check() {
        if (this.dirty && (this.overlay.map != null) && (this.data != null)) {
            this.tessellate();
            return true;
        } else {
            return false;
        }
    }

    draw(southWest, northEast, verticalSize, verticalOffset) {
        this.clear.draw();

        this.fill
            .float('verticalSize', verticalSize)
            .float('verticalOffset', verticalOffset)
            .vec2('slippyBounds.southWest', southWest.x, southWest.y)
            .vec2('slippyBounds.northEast', northEast.x, northEast.y)
            .draw();

        return this.holes
            .float('verticalSize', verticalSize)
            .float('verticalOffset', verticalOffset)
            .vec2('slippyBounds.southWest', southWest.x, southWest.y)
            .vec2('slippyBounds.northEast', northEast.x, northEast.y)
            .draw();
    }

    set(data) {
        this.data = data;
        return this.dirty = true;
    }

    project(coords) {
        const result = new Float32Array(coords.length*2);
        for (let i = 0; i < coords.length; i++) {
            const item = coords[i];
            const {x,y} = this.overlay.map.project({lat:item[1], lng:item[0]}, 0).divideBy(256);
            result[(i*2)+0] = x;
            result[(i*2)+1] = y;
        }
        return result;
    }

    tessellateCoords(coords) {
        const mesh = tessellate.tessellate([this.project(coords)]);
        const vertices = new Float32Array(mesh.triangles.length*2);
        for (let i = 0; i < mesh.triangles.length; i++) {
            const idx = mesh.triangles[i];
            vertices[(i*2)+0] = mesh.vertices[(idx*2)+0];
            vertices[(i*2)+1] = mesh.vertices[(idx*2)+1];
        }
        return vertices;
    }

    collate(arrays) {
        let array;
        let length = 0;
        for (array of Array.from(arrays)) {
            length += array.length;
        }
        const result = new Float32Array(length);
        let offset = 0;
        for (array of Array.from(arrays)) {
            result.set(array, offset);
            offset += array.length;
        }
        return result;
    }

    tessellate() {
        let regions;
        this.dirty = false;
        const startTime = performance.now();
        const fills = [];
        const holes = [];
        if (typeof this.data[0][0][0] === 'number') {
            regions = [this.data];
        } else {
            regions = this.data;
        }
        for (let j = 0, i = j; j < regions.length; j++, i = j) {
            var asc, end;
            const region = regions[i];
            fills.push(this.tessellateCoords(region[0]));

            for (i = 1, end = region.length, asc = 1 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
                holes.push(this.tessellateCoords(region[i]));
            }
        }

        this.fill.vertices(this.collate(fills));
        return this.holes.vertices(this.collate(holes));
    }
};
