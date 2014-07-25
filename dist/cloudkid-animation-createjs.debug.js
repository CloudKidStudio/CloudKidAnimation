!function() {
    "use strict";
    var AnimatorTimeline = function() {}, p = AnimatorTimeline.prototype;
    p.onComplete = null, p.onCompleteParams = null, p.event = null, p.instance = null, 
    p.firstFrame = -1, p.lastFrame = -1, p.isLooping = !1, p.isLastFrame = !1, p.length = 0, 
    p.useCaptions = !1, p._paused = !1, Object.defineProperty(AnimatorTimeline.prototype, "paused", {
        get: function() {
            return this._paused;
        },
        set: function(value) {
            value != this._paused && (this._paused = !!value, this.soundInst && (this.paused ? this.soundInst.pause() : this.soundInst.unpause()));
        }
    }), p.startTime = 0, p.duration = 0, p.speed = 1, p.time = 0, p.soundAlias = null, 
    p.soundInst = null, p.playSound = !1, p.soundStart = 0, p.soundEnd = 0, namespace("cloudkid").AnimatorTimeline = AnimatorTimeline;
}(), function(undefined) {
    "use strict";
    var OS = cloudkid.OS, AnimatorTimeline = cloudkid.AnimatorTimeline, MovieClip = createjs.MovieClip, Animator = function() {};
    Animator.VERSION = "2.3.0", Animator.debug = !1, Animator.soundLib = null, 
    Animator.captions = null;
    var _timelines = [], _removedTimelines = [], _timelinesMap = {}, _paused = !1, _optionsHelper = {};
    Animator.init = function() {
        _timelines = [], _removedTimelines = [], _timelinesMap = {}, _paused = !1;
    }, Animator.destroy = function() {
        Animator.stopAll(), _timelines = null, _removedTimelines = null, _timelinesMap = null;
    }, Animator.play = function(instance, event, options, onCompleteParams, startTime, speed, soundData, doCancelledCallback) {
        var onComplete;
        options && "function" == typeof options ? (onComplete = options, options = _optionsHelper) : options || (options = _optionsHelper), 
        onComplete = options.onComplete || onComplete || null, onCompleteParams = options.onCompleteParams || onCompleteParams || null, 
        startTime = options.startTime || startTime, startTime = startTime ? .001 * startTime : 0, 
        speed = options.speed || speed || 1, doCancelledCallback = options.doCancelledCallback || doCancelledCallback || !1, 
        soundData = options.soundData || soundData || null, _timelines || Animator.init(), 
        _timelinesMap[instance.id] !== undefined && Animator.stop(instance, doCancelledCallback);
        var timeline = Animator._makeTimeline(instance, event, onComplete, onCompleteParams, speed, soundData);
        return timeline.firstFrame > -1 && timeline.lastFrame > -1 ? (timeline.time = -1 == startTime ? Math.random() * timeline.duration : startTime, 
        instance.elapsedTime = timeline.startTime + timeline.time, instance.play(), instance._tick(), 
        Animator._hasTimelines() || Animator._startUpdate(), _timelines.push(timeline), 
        _timelinesMap[instance.id] = timeline, timeline.soundStart > 0 && Animator.audioLib.preloadSound && Animator.soundLib.preloadSound(timeline.soundAlias), 
        timeline) : (Debug.log("No event " + event + " was found, or it lacks an end, on this MovieClip " + instance), 
        onComplete && onComplete.apply(null, onCompleteParams), null);
    }, Animator.playAtRandomFrame = function(instance, event, options, onCompleteParams, speed, soundData, doCancelledCallback) {
        return Animator.play(instance, event, options, onCompleteParams, -1, speed, soundData, doCancelledCallback);
    }, Animator._makeTimeline = function(instance, event, onComplete, onCompleteParams, speed, soundData) {
        var timeline = new AnimatorTimeline();
        if (!Animator._canAnimate(instance)) return timeline;
        instance.advanceDuringTicks = !1;
        var fps;
        instance.framerate ? fps = instance.framerate : (fps = cloudkid.OS.instance.options.fps, 
        fps || (fps = cloudkid.OS.instance.fps), fps || (fps = 15), instance.framerate = fps), 
        timeline.instance = instance, timeline.event = event, timeline.onComplete = onComplete, 
        timeline.onCompleteParams = onCompleteParams, timeline.speed = speed, soundData && (timeline.playSound = !0, 
        "string" == typeof soundData ? (timeline.soundStart = 0, timeline.soundAlias = soundData) : (timeline.soundStart = soundData.start > 0 ? soundData.start : 0, 
        timeline.soundAlias = soundData.alias), timeline.useCaptions = Animator.captions && Animator.captions.hasCaption(timeline.soundAlias));
        for (var labels = instance.getLabels(), stopLabel = event + "_stop", loopLabel = event + "_loop", i = 0, len = labels.length; len > i; ++i) {
            var l = labels[i];
            if (l.label == event) timeline.firstFrame = l.position; else {
                if (l.label == stopLabel) {
                    timeline.lastFrame = l.position;
                    break;
                }
                if (l.label == loopLabel) {
                    timeline.lastFrame = l.position, timeline.isLooping = !0;
                    break;
                }
            }
        }
        return timeline.length = timeline.lastFrame - timeline.firstFrame, timeline.startTime = timeline.firstFrame / fps, 
        timeline.duration = timeline.length / fps, timeline;
    }, Animator._canAnimate = function(instance) {
        return instance instanceof MovieClip ? !0 : instance.framerate !== undefined && instance.getLabels !== undefined && instance.elapsedTime !== undefined && instance._tick !== undefined && instance.gotoAndStop !== undefined && instance.play !== undefined && instance.id !== undefined ? !0 : (Debug.error("Attempting to use Animator to play something that is not movieclip compatible: " + instance), 
        !1);
    }, Animator.instanceHasAnimation = function(instance, event) {
        for (var labels = instance.getLabels(), startFrame = -1, stopFrame = -1, stopLabel = event + "_stop", loopLabel = event + "_loop", i = 0, len = labels.length; len > i; ++i) {
            var l = labels[i];
            if (l.label == event) startFrame = l.position; else if (l.label == stopLabel || l.label == loopLabel) {
                stopFrame = l.position;
                break;
            }
        }
        return startFrame >= 0 && stopFrame >= 0;
    }, Animator.stop = function(instance, doOnComplete) {
        if (doOnComplete = doOnComplete || !1, _timelines) {
            if (_timelinesMap[instance.id] === undefined) return void Debug.log("No timeline was found matching the instance id " + instance);
            var timeline = _timelinesMap[instance.id];
            Animator._remove(timeline, doOnComplete);
        }
    }, Animator.stopAll = function(container) {
        if (Animator._hasTimelines()) for (var timeline, removedTimelines = _timelines.slice(), i = 0; i < removedTimelines.length; i++) timeline = removedTimelines[i], 
        (!container || container.contains(timeline.instance)) && Animator._remove(timeline, !1);
    }, Animator._remove = function(timeline, doOnComplete) {
        var index = _removedTimelines.indexOf(timeline);
        if (index >= 0 && _removedTimelines.splice(index, 1), index = _timelines.indexOf(timeline), 
        !(0 > index)) {
            var onComplete = timeline.onComplete, onCompleteParams = timeline.onCompleteParams;
            timeline.instance.stop(), !doOnComplete && timeline.soundInst && timeline.soundInst.stop(), 
            _timelines.splice(index, 1), delete _timelinesMap[timeline.instance.id], timeline.useCaptions && Animator.captions.stop(), 
            timeline.instance = null, timeline.event = null, timeline.onComplete = null, timeline.onCompleteParams = null, 
            Animator._hasTimelines() || Animator._stopUpdate(), doOnComplete && onComplete && onComplete.apply(null, onCompleteParams);
        }
    }, Animator.pause = function() {
        if (_timelines && !_paused) {
            _paused = !0;
            for (var i = 0; i < _timelines.length; i++) _timelines[i].paused = !0;
            Animator._stopUpdate();
        }
    }, Animator.resume = function() {
        if (_timelines && _paused) {
            _paused = !1;
            for (var i = 0; i < _timelines.length; i++) _timelines[i].paused = !1;
            Animator._hasTimelines() && Animator._startUpdate();
        }
    }, Animator.pauseInGroup = function(paused, container) {
        if (Animator._hasTimelines() && container) for (var i = 0; i < _timelines.length; i++) container.contains(_timelines[i].instance) && (_timelines[i].paused = paused);
    }, Animator.getTimeline = function(instance) {
        return Animator._hasTimelines() ? _timelinesMap[instance.id] !== undefined ? _timelinesMap[instance.id] : null : null;
    }, Animator.getPaused = function() {
        return _paused;
    }, Animator._startUpdate = function() {
        OS.instance && OS.instance.addUpdateCallback("Animator", Animator._update);
    }, Animator._stopUpdate = function() {
        OS.instance && OS.instance.removeUpdateCallback("Animator");
    }, Animator._update = function(elapsed) {
        if (_timelines) {
            for (var t, delta = .001 * elapsed, i = _timelines.length - 1; i >= 0; --i) {
                t = _timelines[i];
                var instance = t.instance;
                if (!t.paused) {
                    if (t.soundInst) {
                        if (!t.soundInst.isValid) {
                            _removedTimelines.push(t);
                            continue;
                        }
                        t.time = t.soundStart + .001 * t.soundInst.position, t.useCaptions && Animator.captions.seek(t.soundInst.position), 
                        t.time >= t.duration && (instance.gotoAndStop(t.lastFrame), _removedTimelines.push(t));
                    } else t.time += delta * t.speed, t.time >= t.duration && (t.isLooping ? (t.time -= t.duration, 
                    t.onComplete && t.onComplete.apply(null, t.onCompleteParams)) : (instance.gotoAndStop(t.lastFrame), 
                    _removedTimelines.push(t))), t.playSound && t.time >= t.soundStart && (t.time = t.soundStart, 
                    t.soundInst = Animator.audioLib.play(t.soundAlias, onSoundDone.bind(this, t), onSoundStarted.bind(this, t)), 
                    t.useCaptions && (Animator.captions.isSlave = !0, Animator.captions.run(t.soundAlias)));
                    instance.elapsedTime = t.startTime + t.time, instance._tick();
                }
            }
            for (i = 0; i < _removedTimelines.length; i++) t = _removedTimelines[i], Animator._remove(t, !0);
        }
    };
    var onSoundStarted = function(timeline) {
        timeline.playSound = !1, timeline.soundEnd = timeline.soundStart + .001 * timeline.soundInst.length;
    }, onSoundDone = function(timeline) {
        timeline.soundEnd > 0 && timeline.soundEnd > timeline.time && (timeline.time = timeline.soundEnd), 
        timeline.soundInst = null;
    };
    Animator._hasTimelines = function() {
        return _timelines ? _timelines.length > 0 : !1;
    }, Animator.toString = function() {
        return "[Animator version:" + Animator.VERSION + "]";
    }, namespace("cloudkid").Animator = Animator;
}(), function() {
    "use strict";
    var CharacterClip = function(event, loops) {
        this.initialize(event, loops);
    }, p = CharacterClip.prototype;
    p.event = null, p.loops = 0, p.initialize = function(event, loops) {
        this.event = event, this.loops = loops || 0;
    }, namespace("cloudkid").CharacterClip = CharacterClip;
}(), function() {
    "use strict";
    var Animator = cloudkid.Animator, CharacterController = function() {
        this.initialize();
    }, p = CharacterController.prototype;
    p._animationStack = null, p._currentAnimation = null, p._loops = 0, p._interruptable = !0, 
    p._allowFrameDropping = !1, p._character = null, p._callback = null, p._destroyed = !1, 
    p.initialize = function() {
        this._animationStack = [];
    }, p.setCharacter = function(character) {
        this.clear(), this._character = character, this._character && (Debug.assert(this._character instanceof createjs.MovieClip, "character must subclass MovieClip"), 
        this._character.stop());
    }, p.gotoFrameAndStop = function(event) {
        Debug.assert(this._character, "gotoFrameAndStop() requires a character!"), Animator.stop(this._character), 
        this._animationStack.length = 0, this._character.gotoAndStop(event);
    }, p.playClips = function(clips, callback, interruptable, cancelPreviousCallback, allowFrameDropping) {
        if (callback = callback || null, interruptable = interruptable || !0, cancelPreviousCallback = cancelPreviousCallback || !0, 
        allowFrameDropping = allowFrameDropping || !0, Debug.assert(this._character, "playClips requires a character!"), 
        this._interruptable) {
            Animator.stop(this._character), this._interruptable = interruptable, this._callback && !cancelPreviousCallback && this._callback(!0), 
            this._callback = callback, this._animationStack.length = 0;
            for (var c in clips) this._animationStack.push(clips[c]);
            this._allowFrameDropping = allowFrameDropping, this.startNext();
        }
    }, p.startNext = function() {
        if (this._loops = 0, this._animationStack.length > 0) this._currentAnimation = this._animationStack.shift(), 
        Animator.play(this._character, this._currentAnimation.event, this._animationComplete.bind(this), [ this ], this._allowFrameDropping); else if (this._callback) {
            this._interruptable = !0;
            var cb = this._callback;
            this._callback = null, cb(!1);
        }
    }, p._animationComplete = function() {
        this._loops++, 0 === this._currentAnimation.loops || this._loops < this._currentAnimation.loops ? Animator.play(this._character, this._currentAnimation.event, this._animationComplete.bind(this), null, this._allowFrameDropping) : this._currentAnimation.loops == this._loops && this.startNext();
    }, p.clear = function() {
        this._character && Animator.stop(this._character), this._currentAnimation = null, 
        this._interruptable = !0, this._callback = null, this._animationStack.length = 0, 
        this._loops = 0;
    }, p.destroy = function() {
        this._destroyed || (this._destroyed = !0, this.clear(), this._character = null, 
        this._animationStack = null);
    }, namespace("cloudkid").CharacterController = CharacterController;
}(), function(undefined) {
    var TextureAtlas = function(image, spritesheetData) {
        Array.isArray(image) ? this._images = image : (this._images = [ image ], spritesheetData = [ spritesheetData ]), 
        this.frames = {};
        for (var i = 0; i < this._images.length; ++i) {
            image = this._images[i];
            var dataFrames = spritesheetData[i].frames;
            for (var name in dataFrames) {
                var data = dataFrames[name], index = name.lastIndexOf(".");
                index > 0 && (name = name.substring(0, index)), index = name.lastIndexOf("/"), 0 > index && (name = name.substring(index + 1)), 
                this.frames[name] = new Texture(image, data);
            }
        }
    }, p = TextureAtlas.prototype = {};
    p.getFrame = function(name) {
        return this.frames[name] || null;
    }, p.getFrames = function(name, numberMin, numberMax, maxDigits, outArray) {
        maxDigits === undefined && (maxDigits = 4), 0 > maxDigits && (maxDigits = 0), outArray || (outArray = []);
        var i, c, zeros = [], compares = [];
        for (i = 1; maxDigits > i; ++i) {
            var s = "";
            c = 1;
            for (var j = 0; i > j; ++j) s += "0", c *= 10;
            zeros.unshift(s), compares.push(c);
        }
        var prevTex, compareLength = compares.length;
        for (i = numberMin, len = numberMax; len >= i; ++i) {
            var num = null;
            for (c = 0; compareLength > c; ++c) if (i < compares[c]) {
                num = zeros[c] + i;
                break;
            }
            num || (num = i.toString());
            var texName = name.replace("#", num), tex = this.frames[texName];
            tex && (prevTex = tex), prevTex && outArray.push(prevTex);
        }
        return outArray;
    }, p.destroy = function() {
        this.image = null, this.frames = null;
    }, namespace("cloudkid").TextureAtlas = TextureAtlas;
    var Texture = function(image, data) {
        this.image = image;
        var f = data.frame;
        this.frame = new createjs.Rectangle(f.x, f.y, f.w, f.h), this.trimmed = data.trimmed, 
        this.offset = new createjs.Point(data.spriteSourceSize.x, data.spriteSourceSize.y), 
        this.width = data.sourceSize.w, this.height = data.sourceSize.h;
    };
}(), function() {
    function labelSorter(a, b) {
        return a.position - b.position;
    }
    var BitmapMovieClip = function(atlas, data) {
        createjs.Container.call(this), this.mouseChildren = !1, this._bitmap = new createjs.Bitmap(), 
        this.addChild(this._bitmap), atlas && data && this.init(atlas, data);
    }, p = BitmapMovieClip.prototype = new createjs.Container(), s = createjs.Container.prototype;
    p.loop = !0, p.currentFrame = 0, p.paused = !1, p.advanceDuringTicks = !0, Object.defineProperty(p, "framerate", {
        get: function() {
            return this._framerate;
        },
        set: function(value) {
            value > 0 ? (this._framerate = value, this._duration = value ? this._frames.length / value : 0) : this._framerate = this._duration = 0;
        }
    }), Object.defineProperty(p, "elapsedTime", {
        get: function() {
            return this._t;
        },
        set: function(value) {
            this._t = value;
        }
    }), p._framerate = 0, p._duration = 0, p._t = 0, p._prevPosition = 0, p._bitmap = 0, 
    p._labels = 0, p._frames = null, p._currentTexture = null, p._origin = null, p._scale = 1, 
    p.isVisible = function() {
        return !!(this.visible && this.alpha > 0 && 0 !== this.scaleX && 0 !== this.scaleY);
    }, p.draw = function(ctx, ignoreCache) {
        return this.DisplayObject_draw(ctx, ignoreCache) ? !0 : (this._updateTimeline(), 
        s.draw.call(this, ctx, ignoreCache), !0);
    }, p.play = function() {
        this.paused = !1;
    }, p.stop = function() {
        this.paused = !0;
    }, p.gotoAndPlay = function(positionOrLabel) {
        this.paused = !1, this._goto(positionOrLabel);
    }, p.gotoAndStop = function(positionOrLabel) {
        this.paused = !0, this._goto(positionOrLabel);
    }, p.advance = function(time) {
        this.paused || (this._framerate > 0 ? (this.advanceDuringTicks && (this._t += .001 * time), 
        this._t > this._duration && (this._t = this.loop ? this._t - this._duration : this._duration), 
        this._prevPosition = Math.floor(this._t * this._framerate), this._prevPosition >= this._frames.length && (this._prevPosition = this._frames.length - 1)) : this.advanceDuringTicks && (this._prevPosition = this._prevPosition + 1), 
        this._updateTimeline());
    }, p.getLabels = function() {
        return this._labels;
    }, p.getCurrentLabel = function() {
        for (var labels = this._labels, current = null, i = 0, len = labels.length; len > i && labels[i].position <= this.currentFrame; ++i) current = labels[i].label;
        return current;
    }, p.init = function(atlas, data) {
        var labels = this._labels = [];
        if (data.labels) {
            for (var name in data.labels) labels.push({
                label: name,
                position: data.labels[name]
            });
            labels.sort(labelSorter);
        }
        this._frames = [];
        for (var i = 0; i < data.frames.length; ++i) {
            var frameSet = data.frames[i];
            atlas.getFrames(frameSet.name, frameSet.min, frameSet.max, frameSet.digits, this._frames);
        }
        data.fps ? this.framerate = data.fps : this._framerate && (this.framerate = this._framerate), 
        this._scale = data.scale && data.scale > 0 ? 1 / data.scale : 1, this._bitmap.scaleX = this._bitmap.scaleY = this._scale, 
        this._origin = data.origin ? new createjs.Point(data.origin.x * this._scale, data.origin.y * this._scale) : new createjs.Point();
    }, p.copyFrom = function(other) {
        this._frames = other._frames, this._labels = other._labels, this._origin = other._origin, 
        this._framerate = other._framerate, this._duration = other._duration, this._scale = other._scale, 
        this._bitmap.scaleX = this._bitmap.scaleY = this._scale;
    }, p.destroy = function() {
        this.removeAllChildren(), this._bitmap = null, this._frames = null, this._origin = null;
    }, p._tick = function(props) {
        this.advance(props && props.delta), s._tick.call(this, props);
    }, p._goto = function(positionOrLabel) {
        var pos = null;
        if ("string" == typeof positionOrLabel) {
            for (var labels = this._labels, i = 0, len = labels.length; len > i; ++i) if (labels[i].label == positionOrLabel) {
                pos = labels[i].position;
                break;
            }
        } else pos = positionOrLabel;
        null !== pos && (this._prevPosition = pos, this._t = this._framerate > 0 ? pos / this._framerate : 0, 
        this._updateTimeline());
    }, p._updateTimeline = function() {
        if (this._prevPosition < 0 ? this._prevPosition = 0 : this._prevPosition >= this._frames.length && (this._prevPosition = this._frames.length - 1), 
        this.currentFrame = this._prevPosition, this._currentTexture != this._frames[this.currentFrame]) {
            var tex = this._currentTexture = this._frames[this.currentFrame];
            this._bitmap.image = tex.image, this._bitmap.sourceRect = tex.frame, this._bitmap.x = -this._origin.x + tex.offset.x * this._bitmap.scaleX, 
            this._bitmap.y = -this._origin.y + tex.offset.y * this._bitmap.scaleY;
        }
    }, p._reset = function() {
        this._prevPosition = 0, this._t = 0, this.currentFrame = 0;
    }, namespace("cloudkid").BitmapMovieClip = BitmapMovieClip;
}();