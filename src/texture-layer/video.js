import BaseLayer from'./base';

class TextureVideoLayer extends BaseLayer {
    constructor(parent, params) {
        {
          // Hack: trick Babel/TypeScript into allowing this before super.
          if (false) { super(); }
          let thisFn = (() => { return this; }).toString();
          let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
          eval(`${thisName} = this;`);
        }
        this.parent = parent;
        if (params == null) { params = {}; }
        this.gf = this.parent.gf;
        this.map = this.parent.map;
        this.haveData = false;
        this.haveColormap = false;
        this.mixFactor = 0;
        this.time = 0;

        this.shaders = {
            'crossfade': this.getShadersFadeFun('crossfade'),
            'dissolve': this.getShadersFadeFun('dissolve'),
            'noise': this.getShadersFadeFun('noise'),
            'fbm': this.getShadersFadeFun('fbm')
        };
        this.fadeFun = 'crossfade';
        this.interpolationName = 'bell';
        this.shader = this.gf.shader(this.shaders[this.fadeFun][this.interpolationName]);

        this.state = this.gf.state({
            shader: this.shader,
            vertexbuffer: {
                pointers: [
                    {name:'position', size:2},
                    {name:'texcoord', size:2}
                ]
            }});
            //depthTest: true
            //depthWrite: false
            //depthFunc: 'less'

        this.texture0 = this.gf.texture2D({
            channels: 'luminance',
            width: 1,
            height: 1,
            filter: 'nearest',
            repeat: 'clamp'
        });

        this.texture1 = this.gf.texture2D({
            channels: 'luminance',
            width: 1,
            height: 1,
            filter: 'nearest',
            repeat: 'clamp'
        });

        if (params.colormap != null) {
            this.setColormap(params.colormap);
        }

        if (params.data != null) {
            this.setData(params.data);
        }

        if (params.interpolation != null) {
            if (params.fadeFun != null) {
                this.fadeFun = params.fadeFun;
            }

            this.setInterpolation(params.interpolation);

        } else if (params.fadeFun != null) {
            this.setFadeFun(params.fadeFun);
        }
    }

    destroy() {
        if (this.state) {
            this.state.destroy();
        }
    }

    getShadersFadeFun(fadeFun) {
        let name;
        const shaders = {};

        for (name of ['nearest', 'lerp', 'smoothstep', 'euclidian', 'classicBicubic', 'hex-nearest', 'hex-linear', 'hex-smoothstep']) {
            shaders[name] = [
                require(`./texfuns/tween/${fadeFun}.shader`).default,
                require('./texfuns/intensity.shader').default,
                require('./texfuns/interpolation/rect.shader').default,
                require(`./texfuns/interpolation/${name}.shader`).default,
                require('./display.shader').default
            ];
        }

        for (name of ['bicubicLinear', 'polynom6th', 'bicubicSmoothstep', 'bspline', 'bell', 'catmull-rom']) {
            shaders[name] = [
                require(`./texfuns/tween/${fadeFun}.shader`).default,
                require('./texfuns/intensity.shader').default,
                require('./texfuns/interpolation/rect.shader').default,
                require(`./texfuns/interpolation/${name}.shader`).default,
                require('./texfuns/interpolation/generalBicubic.shader').default,
                require('./display.shader').default
            ];
        }

        return shaders;
    }

    updateBitmaps(data) {
        this.bitmaps = data.bitmaps;

        this.firstFrame = this.bitmaps[0];
        this.lastFrame = this.bitmaps[this.bitmaps.length-1];

        this.frame0 = this.bitmaps[0];
        this.frame1 = this.bitmaps[1%this.bitmaps.length];

        this.mixFactor = 0;
        this.time = 0;
        this.texture0.dataSized(this.frame0.bitmap, this.width, this.height, 1);
        return this.texture1.dataSized(this.frame1.bitmap, this.width, this.height, 1);
    }

        //min = max = data.bitmaps[0].bitmap[0]
        //for bitmap in data.bitmaps
        //    for value in bitmap.bitmap
        //        min = Math.min min, value
        //        max = Math.max max, value

    draw(matrix) {
        if (this.haveData && this.haveColormap) {
            // use this layer's program
            this.gf.gl.useProgram(this.shader.program);

            this.state
                .float('colormap', this.colormap)
                .float('mixFactor', this.mixFactor)
                .float('time', this.time)
                .vec2('sourceSize', this.texture1.width, this.texture1.height)
                .sampler('source0', this.texture0)
                .sampler('source1', this.texture1)
                .float('minIntensity', 0)
                .float('maxIntensity', 255)
                .int('colorCount', this.colorCount);

            if (matrix) {
                this.state.mat4('u_matrix', matrix);
            }



            if ((this.fadeFun === 'noise') || (this.fadeFun === 'fbm')) {
                if (this.fadeParams != null) {
                    this.state
                        .float('spatialFrequency', this.fadeParams.spatialFrequency != null ? this.fadeParams.spatialFrequency : 10)
                        .float('timeFrequency', this.fadeParams.timeFrequency != null ? this.fadeParams.timeFrequency : this.bitmaps.length/2)
                        .float('amplitude', this.fadeParams.amplitude != null ? this.fadeParams.amplitude : 1.0)
                        .float('attack', this.fadeParams.attack != null ? this.fadeParams.attack : 0.25);
                    if (this.fadeFun === 'fbm') {
                        this.state
                            .float('spatialLacunarity', this.fadeParams.spatialLacunarity != null ? this.fadeParams.spatialLacunarity : 2)
                            .float('timeLacunarity', this.fadeParams.timeLacunarity != null ? this.fadeParams.timeLacunarity : 1)
                            .float('gain', this.fadeParams.gain != null ? this.fadeParams.gain : 0.5);
                    }

                } else {
                    this.state
                        .float('spatialFrequency', 10)
                        .float('timeFrequency', this.bitmaps.length/2)
                        .float('amplitude', 1.0)
                        .float('attack', 0.25);
                    if (this.fadeFun === 'fbm') {
                        this.state
                            .float('spatialLacunarity', 2)
                            .float('timeLacunarity', 1)
                            .float('gain', 0.5);
                    }
                }
            }

            return this.state.draw();
        }
    }

    //# public interface ##
    setData(data) {
        this.parent.dirty = true;

        this.width = data.width;
        this.height = data.height;

        this.projection = proj4(
            new proj4.Proj(data.projection),
            new proj4.Proj('WGS84')
        );

        this.bounds = data.bounds;

        this.tessellate(data);
        this.updateBitmaps(data);

        return this.haveData = true;
    }

    setTime(time) {
        if (this.bitmaps != null) {
            let frame0, frame1;
            this.parent.dirty = true;

            if (time < this.bitmaps[0].time) {
                frame0 = this.bitmaps[0];
                frame1 = this.bitmaps[1];
            } else if (time > this.bitmaps[this.bitmaps.length-1].time) {
                frame0 = this.bitmaps[this.bitmaps.length-2];
                frame1 = this.bitmaps[this.bitmaps.length-1];
            } else {
                for (let i = 0, end = this.bitmaps.length-1, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
                    frame0 = this.bitmaps[i];
                    frame1 = this.bitmaps[i+1];
                    if ((time >= frame0.time) && (time <= frame1.time)) {
                        break;
                    }
                }
            }

            this.mixFactor = (time - frame0.time)/(frame1.time-frame0.time);

            if (this.frame0 !== frame0) {
                this.frame0 = frame0;
                this.texture0.dataSized(this.frame0.bitmap, this.width, this.height, 1);
            }

            if (this.frame1 !== frame1) {
                this.frame1 = frame1;
                this.texture1.dataSized(this.frame1.bitmap, this.width, this.height, 1);
            }

            return this.time = (time - this.firstFrame.time)/(this.lastFrame.time - this.firstFrame.time);
        }
    }

    setInterpolation(interpolationName) {
        this.interpolationName = interpolationName;
        this.parent.dirty = true;
        return this.shader.source(this.shaders[this.fadeFun][this.interpolationName]);
    }

    setFadeFun(fadeFun, params) {
        this.fadeFun = fadeFun;
        this.fadeParams = params;
        this.parent.dirty = true;
        return this.shader.source(this.shaders[this.fadeFun][this.interpolationName]);
    }
}

export { TextureVideoLayer as Video };
