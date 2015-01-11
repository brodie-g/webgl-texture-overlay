exports = class TextureLayer
    constructor: (@parent, params={}) ->
        @gf = @parent.gf
        @map = @parent.map
        @haveData = false
        @haveColormap = false

        @shaders = {}

        for name in ['nearest', 'lerp', 'smoothstep', 'euclidian', 'classicBicubic']
            @shaders[name] = [
                fs.open('texfuns/rect.shader')
                fs.open("texfuns/#{name}.shader")
                fs.open('display.shader')
            ]

        for name in ['bicubicLinear', 'polynom6th', 'bicubicSmoothstep', 'bspline', 'bell', 'catmull-rom']
            @shaders[name] = [
                fs.open('texfuns/rect.shader')
                fs.open("texfuns/#{name}.shader")
                fs.open("texfuns/generalBicubic.shader")
                fs.open('display.shader')
            ]

        @shader = @gf.shader(@shaders['bell'])
        
        @state = @gf.state
            #shader: fs.open('display.shader')
            shader: @shader
            vertexbuffer:
                pointers: [
                    {name:'position', size:2}
                    {name:'texcoord', size:2}
                ]
       
        @texture = @gf.texture2D
            width: 1
            height: 1
            filter: 'linear'
            repeat: 'clamp'

        if params.colormap?
            @setColormap params.colormap

        if params.data?
            @setData params.data

        if params.interpolation?
            @setInterpolation params.interpolation
        
    ## utility methods ##
    project: (s, t) ->
        b = @bounds
        x = b.left + (b.right - b.left)*s
        y = b.top + (b.bottom - b.top)*t
        [lng,lat] = @projection.forward([x,y])
        lng += 360 # avoid wrapping issues
        {x,y} = @map.project({lat:lat, lng:lng}, 0).divideBy(256)
        return {x:x-1,y:y}

    testMarkers: ->
        s = 0
        t = 0
        b = @bounds
        for i in [0...50]
            for j in [0...50]
                s = i/(@texture.width-1)
                t = j/(@texture.height-1)
                x = b.left + (b.right - b.left)*s
                y = b.top + (b.bottom - b.top)*t
                [lng,lat] = @projection.forward([x,y])
                L.circleMarker({lat:lat, lng:lng}, {radius:1}).addTo(@map)
       
    tessellate: (data) ->
        size = 50

        sScale = (data.width+1)/data.width
        sOffset = 0.5/data.width
        tScale = (data.height+1)/data.height
        tOffset = 0.5/data.height
        
        centroids = []
        for t in [0..size]
            t = t/size
            for s in [0..size]
                s = s/size
                {x,y} = @project(s*sScale-sOffset, t*tScale-tOffset)
                centroids.push x:x, y:y, s:s, t:t

        v = new Float32Array(Math.pow(size, 2)*3*4*2)
        o = 0
        d = size+1

        for y in [0...size]
            y0 = y*d
            y1 = (y+1)*d
            for x in [0...size]
                x0 = x
                x1 = x+1

                p0 = centroids[x0+y0]
                p1 = centroids[x1+y0]
                p2 = centroids[x0+y1]
                p3 = centroids[x1+y1]

                v[o++] = p0.x; v[o++] = p0.y; v[o++]=p0.s; v[o++]=p0.t
                v[o++] = p1.x; v[o++] = p1.y; v[o++]=p1.s; v[o++]=p1.t
                v[o++] = p2.x; v[o++] = p2.y; v[o++]=p2.s; v[o++]=p2.t
                
                v[o++] = p1.x; v[o++] = p1.y; v[o++]=p1.s; v[o++]=p1.t
                v[o++] = p2.x; v[o++] = p2.y; v[o++]=p2.s; v[o++]=p2.t
                v[o++] = p3.x; v[o++] = p3.y; v[o++]=p3.s; v[o++]=p3.t

        @state.vertices(v)

    updateBitmap: (data) ->
        min = max = data.bitmap[0]
        for item in data.bitmap
            min = Math.min(item, min)
            max = Math.max(item, max)

        @minIntensity = min
        @maxIntensity = max

        range = max-min
        bitmap = new Uint8Array(data.width*data.height*4)
        shortView = new Uint16Array(bitmap.buffer)

        for intensity, i in data.bitmap
            intensity = (intensity-min)/range
            intensity = intensity * 65535
            shortView[i*2] = intensity

        @texture.dataSized bitmap, data.width, data.height

    draw: (southWest, northEast, verticalSize, verticalOffset) ->
        if @haveData and @haveColormap
            @state
                .float('colormap', @colormap)
                .vec2('sourceSize', @texture.width, @texture.height)
                .sampler('source', @texture)
                .float('minIntensity', @minIntensity)
                .float('maxIntensity', @maxIntensity)
                .float('verticalSize', verticalSize)
                .float('verticalOffset', verticalOffset)
                .vec2('slippyBounds.southWest', southWest.x, southWest.y)
                .vec2('slippyBounds.northEast', northEast.x, northEast.y)
                .draw()
   
    ## public interface ##
    setData: (data) ->
        @parent.dirty = true
        
        @projection = proj4(
            new proj4.Proj(data.projection)
            new proj4.Proj('WGS84')
        )

        @bounds = data.bounds

        @tessellate(data)
        @updateBitmap(data)

        @haveData = true
        
        #@testMarkers()

    setColormap: (data) ->
        @parent.dirty = true

        data = data[..]
        data.unshift data[0]
        data.push data[data.length-1]
        data[0].alpha = 0

        @colormap = new Float32Array(18*5)
        for color, i in data
            @colormap[i*5+0] = color.r/255
            @colormap[i*5+1] = color.g/255
            @colormap[i*5+2] = color.b/255
            @colormap[i*5+3] = color.alpha ? 1
            @colormap[i*5+4] = color.center

        @haveColormap = true

    setInterpolation: (name) ->
        @parent.dirty = true
        @shader.source @shaders[name]
