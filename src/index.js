// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// import tessellate from '../lib/tessellate';
import WebGLFramework from'./webgl-framework';
import { Video } from'./texture-layer';
console.log(Video);
import ClipRegion from'./clip';


class WebGLTextureOverlay {
    constructor() {
        this.draw = this.draw.bind(this);
        this.canvas = L.DomUtil.create('canvas', 'leaflet-webgl-texture-overlay');
        this.gf = new WebGLFramework({
            canvas: this.canvas,
            premultipliedAlpha: false
        });

        this.dirty = false;
        this.running = false;

        this.layers = [];
        this.interpolations = [
            'nearest', 'lerp', 'smoothstep', 'euclidian', 'classicBicubic', 'hex-nearest', 'hex-linear', 'hex-smoothstep',
            'bicubicLinear', 'polynom6th', 'bicubicSmoothstep', 'bspline', 'bell', 'catmull-rom'
        ];
        this.fades = ['crossfade', 'dissolve', 'noise', 'fbm'];
        requestAnimationFrame(this.draw);
    }

    onAdd(map) {
        this.map = map;
        this.dirty = true;

        if (this.clipRegion != null) {
            this.clipRegion.dirty = true;
        }

        this.running = true;

        const size = this.map.getSize();
        this.canvas.width = size.x;
        this.canvas.height = size.y;
        L.DomUtil.addClass(this.canvas, 'leaflet-zoom-animated');

        this.map.getPanes().overlayPane.appendChild(this.canvas);
        this.map.on('movestart', this.move, this);
        this.map.on('move', this.move, this);
        this.map.on('moveend', this.move, this);
        this.map.on('resize', this.resize, this);
        return this.map.on('zoomanim', this.zoomanim, this);
    }

    addTo(map) {
        map.addLayer(this);
        return this;
    }

    onRemove(map) {
        this.running = false;

        map.getPanes().overlayPane.removeChild(this.canvas);
        this.map.off('movestart', this.move, this);
        this.map.off('move', this.move, this);
        this.map.off('moveend', this.move, this);
        this.map.off('resize', this.resize, this);
        this.map.off('zoomanim', this.zoomanim, this);

        return this.map = null;
    }

    move(event) {
        this.dirty = true;
        const topleft = this.map.containerPointToLayerPoint([0,0]);
        return L.DomUtil.setPosition(this.canvas, topleft);
    }

    resize(event) {
        this.dirty = true;
        this.canvas.width = event.newSize.x;
        return this.canvas.height = event.newSize.y;
    }

    zoomanim(event) {
        const scale = this.map.getZoomScale(event.zoom);
        const offset = this.map._getCenterOffset(event.center)._multiplyBy(-scale).subtract(this.map._getMapPanePos());

        return this.canvas.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(offset) + ` scale(${scale})`;
    }

    draw() {
        let dirty;
        if (this.clipRegion != null) {
            dirty = this.clipRegion.check() || this.dirty;
        } else {
            ({ dirty } = this);
        }

        if (dirty && this.running) {
            this.dirty = false;
            const size     = this.map.getSize();
            const bounds   = this.map.getBounds();
            const zoom = this.map.getZoom();

            const sw = bounds.getSouthWest();
            const ne = bounds.getNorthEast();

            const screenNorth = this.map.latLngToContainerPoint(ne).y/size.y;
            const screenSouth = this.map.latLngToContainerPoint(sw).y/size.y;

            const southWest = this.map.project(sw, 0).divideBy(256);
            const northEast = this.map.project(ne, 0).divideBy(256);

            const verticalSize = screenSouth - screenNorth;
            const verticalOffset = 1.0 - (screenSouth + screenNorth);

            for (const layer of Array.from(this.layers)) {
                layer.draw(southWest, northEast, verticalSize, verticalOffset);
            }

            if (this.clipRegion != null) {
                this.clipRegion.draw(southWest, northEast, verticalSize, verticalOffset);
            }
        }

        return requestAnimationFrame(this.draw);
    }

    setClip(region) {
        if ((this.clipRegion == null)) {
            this.clipRegion = new ClipRegion(this.gf, this);
        }

        return this.clipRegion.set(region);
    }

    addLayer(params) {
        this.dirty = true;
        const layer = new Video(this, params);
        this.layers.push(layer);
        return layer;
    }
}

class MapboxGLTextureOverlay {
    constructor(id) {
        this.id = id;
        this.type = 'custom';

        this.layers = [];

        this.dirty = false;
        this.running = false;

        this.interpolations = [
            'nearest', 'lerp', 'smoothstep', 'euclidian', 'classicBicubic', 'hex-nearest', 'hex-linear', 'hex-smoothstep',
            'bicubicLinear', 'polynom6th', 'bicubicSmoothstep', 'bspline', 'bell', 'catmull-rom'
        ];
        this.fades = ['crossfade', 'dissolve', 'noise', 'fbm'];
    }

    init(gl) {
        this.draw = this.draw.bind(this);
        this.gf = new WebGLFramework({
            gl: gl,
            premultipliedAlpha: false
        });

        // requestAnimationFrame(this.draw);
    }

    onAdd(map, gl) {
        this.init(gl);
        this.map = map;
        this.dirty = true;

        // if (this.clipRegion != null) {
        //     this.clipRegion.dirty = true;
        // }

        this.running = true;


        // var vertexSource = "" +
        //     "uniform mat4 u_matrix;" +
        //     "attribute vec2 a_pos;" +
        //     "void main() {" +
        //     "    gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);" +
        //     "}";
        //
        // var fragmentSource = "" +
        //     "void main() {" +
        //     "    gl_FragColor = vec4(0.0, 1.0, 0.0, 0.5);" +
        //     "}";
        //
        // var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        // gl.shaderSource(vertexShader, vertexSource);
        // gl.compileShader(vertexShader);
        // var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        // gl.shaderSource(fragmentShader, fragmentSource);
        // gl.compileShader(fragmentShader);
        //
        // this.program = gl.createProgram();
        // gl.attachShader(this.program, vertexShader);
        // gl.attachShader(this.program, fragmentShader);
        // gl.linkProgram(this.program);
        //
        // this.aPos = gl.getAttribLocation(this.program, "a_pos");
        //
        // var helsinki = mapboxgl.MercatorCoordinate.fromLngLat({ lng: 25.004, lat: 60.239 });
        // var berlin = mapboxgl.MercatorCoordinate.fromLngLat({ lng: 13.403, lat: 52.562 });
        // var kyiv = mapboxgl.MercatorCoordinate.fromLngLat({ lng: 30.498, lat: 50.541 });
        //
        // this.buffer = gl.createBuffer();
        // gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        //     helsinki.x, helsinki.y,
        //     berlin.x, berlin.y,
        //     kyiv.x, kyiv.y,
        // ]), gl.STATIC_DRAW);
    }

    render(gl, matrix) {
        console.log('custom layer render');
        this.draw(matrix);


        // gl.useProgram(this.program);
        // gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "u_matrix"), false, matrix);
        // gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        // gl.enableVertexAttribArray(this.aPos);
        // gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);
        // gl.enable(gl.BLEND);
        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        // gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
    }

    draw(matrix) {
        let dirty;
        if (this.clipRegion != null) {
            dirty = this.clipRegion.check() || this.dirty;
        } else {
            ({ dirty } = this);
        }

        if (true || this.running) {
            this.dirty = false;

            for (const layer of Array.from(this.layers)) {
                this.gf.gl.useProgram(layer.shader.program);
                layer.draw(matrix);
            }

            if (this.clipRegion != null) {
                // this.clipRegion.draw();
            }
        }

        // return requestAnimationFrame(this.draw);
    }

    setClip(region) {
        if ((this.clipRegion == null)) {
            this.clipRegion = new ClipRegion(this.gf, this);
        }

        return this.clipRegion.set(region);
    }

    addLayer(params) {
        this.dirty = true;
        const layer = new Video(this, params);
        this.layers.push(layer);
        return layer;
    }
}

window.MapboxGLTextureOverlay = MapboxGLTextureOverlay;

if (typeof L !== 'undefined') {
    L.webglTextureOverlay = function() {
        return new WebGLTextureOverlay();
    };
}
