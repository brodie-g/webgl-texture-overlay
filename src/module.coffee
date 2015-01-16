WebGLFramework = require 'webgl-framework'
{TextureLayer,TextureFadeLayer} = require 'texture-layer'

class WebGLTextureOverlay
    constructor: ->
        @canvas = L.DomUtil.create 'canvas', 'leaflet-webgl-texture-overlay'
        @gf = new WebGLFramework
            canvas: @canvas

        @dirty = false
        @running = false

        @layers = []

        @interpolations = [
            'nearest', 'lerp', 'smoothstep', 'euclidian', 'classicBicubic', 'hex-nearest', 'hex-linear', 'hex-smoothstep',
            'bicubicLinear', 'polynom6th', 'bicubicSmoothstep', 'bspline', 'bell', 'catmull-rom'
        ]
        @fades = ['crossfade', 'dissolve']

    onAdd: (@map) ->
        @dirty = true
        @running = true

        size = @map.getSize()
        @canvas.width = size.x
        @canvas.height = size.y
        L.DomUtil.addClass(@canvas, 'leaflet-zoom-animated')

        @map.getPanes().overlayPane.appendChild(@canvas)
        @map.on 'movestart', @move, @
        @map.on 'move', @move, @
        @map.on 'moveend', @move, @
        @map.on 'resize', @resize, @
        @map.on 'zoomanim', @zoomanim, @

        requestAnimationFrame @draw
    
    addTo: (map) ->
        map.addLayer(@)
        return @
    
    onRemove: (map) ->
        @running = false

        map.getPanes().overlayPane.removeChild(@canvas)
        @map.off 'movestart', @move, @
        @map.off 'move', @move, @
        @map.off 'moveend', @move, @
        @map.off 'resize', @resize, @
        @map.off 'zoomanim', @zoomanim, @

    move: (event) ->
        @dirty = true
        topleft = @map.containerPointToLayerPoint([0,0])
        L.DomUtil.setPosition(@canvas, topleft)

    resize: (event) ->
        @dirty = true
        @canvas.width = event.newSize.x
        @canvas.height = event.newSize.y
    
    zoomanim: (event) ->
        scale = @map.getZoomScale(event.zoom)
        offset = @map._getCenterOffset(event.center)._multiplyBy(-scale).subtract(@map._getMapPanePos())

        @canvas.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(offset) + " scale(#{scale})"
    
    draw: =>
        if @dirty and @running
            @dirty = false
            size     = @map.getSize()
            bounds   = @map.getBounds()
            zoom = @map.getZoom()

            sw = bounds.getSouthWest()
            ne = bounds.getNorthEast()
            
            screenNorth = @map.latLngToContainerPoint(ne).y/size.y
            screenSouth = @map.latLngToContainerPoint(sw).y/size.y

            southWest = @map.project(sw, 0).divideBy(256)
            northEast = @map.project(ne, 0).divideBy(256)

            verticalSize = screenSouth - screenNorth
            verticalOffset = 1.0 - (screenSouth + screenNorth)

            for layer in @layers
                layer.draw(southWest, northEast, verticalSize, verticalOffset)

        requestAnimationFrame @draw

    addLayer: (params) ->
        @dirty = true
        layer = new TextureLayer(@, params)
        @layers.push layer
        return layer
    
    addFadeLayer: (params) ->
        @dirty = true
        layer = new TextureFadeLayer(@, params)
        @layers.push layer
        return layer

L.webglTextureOverlay = ->
    new WebGLTextureOverlay()
