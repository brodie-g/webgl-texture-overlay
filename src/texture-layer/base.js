/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let BaseLayer;
const exports = (BaseLayer = class BaseLayer {
    project(s, t) {
        const b = this.bounds;
        let x = b.left + ((b.right - b.left)*s);
        let y = b.top + ((b.bottom - b.top)*t);
        let [lng,lat] = Array.from(this.projection.forward([x,y]));
        lng += 360; // avoid wrapping issues
        ({x,y} = this.map.project({lat, lng}, 0).divideBy(256));
        return {x:x-1,y};
    }
    
    tessellate(data) {
        let asc, end, i;
        let s, t, x, y;
        let asc2, end2;
        const size = 50;

        const sScale = (data.width+1)/data.width;
        const sOffset = 0.5/data.width;
        const tScale = (data.height+1)/data.height;
        const tOffset = 0.5/data.height;
        
        const centroids = [];
        for (i = 0, t = i, end = size, asc = 0 <= end; asc ? i <= end : i >= end; asc ? i++ : i--, t = i) {
            var asc1, end1, j;
            t = t/size;
            for (j = 0, s = j, end1 = size, asc1 = 0 <= end1; asc1 ? j <= end1 : j >= end1; asc1 ? j++ : j--, s = j) {
                s = s/size;
                ({x,y} = this.project((s*sScale)-sOffset, (t*tScale)-tOffset));
                centroids.push({x, y, s, t});
            }
        }

        const v = new Float32Array(Math.pow(size, 2)*3*4*2);
        let o = 0;
        const d = size+1;

        for (y = 0, end2 = size, asc2 = 0 <= end2; asc2 ? y < end2 : y > end2; asc2 ? y++ : y--) {
            var asc3, end3;
            const y0 = y*d;
            const y1 = (y+1)*d;
            for (x = 0, end3 = size, asc3 = 0 <= end3; asc3 ? x < end3 : x > end3; asc3 ? x++ : x--) {
                const x0 = x;
                const x1 = x+1;

                const p0 = centroids[x0+y0];
                const p1 = centroids[x1+y0];
                const p2 = centroids[x0+y1];
                const p3 = centroids[x1+y1];

                v[o++] = p0.x; v[o++] = p0.y; v[o++]=p0.s; v[o++]=p0.t;
                v[o++] = p1.x; v[o++] = p1.y; v[o++]=p1.s; v[o++]=p1.t;
                v[o++] = p2.x; v[o++] = p2.y; v[o++]=p2.s; v[o++]=p2.t;
                
                v[o++] = p1.x; v[o++] = p1.y; v[o++]=p1.s; v[o++]=p1.t;
                v[o++] = p2.x; v[o++] = p2.y; v[o++]=p2.s; v[o++]=p2.t;
                v[o++] = p3.x; v[o++] = p3.y; v[o++]=p3.s; v[o++]=p3.t;
            }
        }

        return this.state.vertices(v);
    }
    
    setColormap(data) {
        if (data.length > 18) {
            throw new Error("Color map is too long, maximum of 18 entries allowed");
        }

        this.parent.dirty = true;
        this.colormap = new Float32Array(18 * 5);
        this.colorCount = data.length;

        for (let i = 0; i < data.length; i++) {
            const color = data[i];
            this.colormap[(i*5)+0] = (color.r != null ? color.r : 0)/255;
            this.colormap[(i*5)+1] = (color.g != null ? color.g : 0)/255;
            this.colormap[(i*5)+2] = (color.b != null ? color.b : 0)/255;
            this.colormap[(i*5)+3] = color.alpha != null ? color.alpha : 1;
            this.colormap[(i*5)+4] = color.center;
        }

        return this.haveColormap = true;
    }

    testMarkers() {
        let s = 0;
        let t = 0;
        const b = this.bounds;
        for (let i = 0, end = this.texture.width, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
            for (let j = 0, end1 = this.texture.height, asc1 = 0 <= end1; asc1 ? j < end1 : j > end1; asc1 ? j++ : j--) {
                s = i/(this.texture.width-1);
                t = j/(this.texture.height-1);
                const x = b.left + ((b.right - b.left)*s);
                const y = b.top + ((b.bottom - b.top)*t);
                const [lng,lat] = Array.from(this.projection.forward([x,y]));
                L.circleMarker({lat, lng}, {radius:1}).addTo(this.map);
            }
        }
        return `\
s = 0
t = 0
b = @bounds
for i in [0...@texture.width]
    for j in [0...@texture.height]
        if j % 2 == 0
            s = i/(@texture.width-0.5)
        else
            s = (i+0.5)/(@texture.width-0.5)
        t = j/(@texture.height-1)
        x = b.left + (b.right - b.left)*s
        y = b.top + (b.bottom - b.top)*t
        [lng,lat] = @projection.forward([x,y])
        L.circleMarker({lat:lat, lng:lng}, {radius:1}).addTo(@map)\
`;
    }
});
       

