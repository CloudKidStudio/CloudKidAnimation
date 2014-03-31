!function() {
    var AnimatorTimeline = function() {}, p = AnimatorTimeline.prototype;
    p.onComplete = null, p.onCompleteParams = null, p.event = null, p.instance = null, 
    p.firstFrame = -1, p.lastFrame = -1, p.isLooping = !1, p.isLastFrame = !1, p.length = 0, 
    p._paused = !1, Object.defineProperty(AnimatorTimeline.prototype, "paused", {
        get: function() {
            return this._paused;
        },
        set: function(value) {
            value != this._paused && (this._paused = !!value, this.soundInst && (this.paused ? this.soundInst.pause() : this.soundInst.unpause()));
        }
    }), p.startTime = 0, p.duration = 0, p.speed = 1, p.time = 0, p.soundAlias = null, 
    p.soundInst = null, p.playSound = !1, p.soundStart = 0, p.soundEnd = 0, namespace("cloudkid").AnimatorTimeline = AnimatorTimeline;
}(), function(undefined) {
    var OS = cloudkid.OS, AnimatorTimeline = cloudkid.AnimatorTimeline, MovieClip = createjs.MovieClip, Animator = function() {};
    Animator.VERSION = "2.0.0", Animator.debug = !1, Animator.soundLib = null;
    var _timelines = [], _removedTimelines = [], _timelinesMap = {}, _paused = !1;
    Animator.init = function() {
        _timelines = [], _removedTimelines = [], _timelinesMap = {}, _paused = !1;
    }, Animator.destroy = function() {
        Animator.stopAll(), _timelines = null, _removedTimelines = null, _timelinesMap = null;
    }, Animator.play = function(instance, event, onComplete, onCompleteParams, startTime, speed, soundData, doCancelledCallback) {
        onComplete = onComplete || null, onCompleteParams = onCompleteParams || null, startTime = startTime ? .001 * startTime : 0, 
        speed = speed || 1, doCancelledCallback = doCancelledCallback || !1, _timelines || Animator.init(), 
        _timelinesMap[instance.id] !== undefined && Animator.stop(instance, doCancelledCallback);
        var timeline = Animator._makeTimeline(instance, event, onComplete, onCompleteParams, speed, soundData);
        return timeline.firstFrame > -1 && timeline.lastFrame > -1 ? (timeline.time = startTime, 
        instance._elapsedTime = timeline.startTime + timeline.time, instance.play(), instance._tick(), 
        Animator._hasTimelines() || Animator._startUpdate(), _timelines.push(timeline), 
        _timelinesMap[instance.id] = timeline, timeline) : (Debug.log("No event " + event + " was found, or it lacks an end, on this MovieClip " + instance), 
        onComplete && onComplete.apply(null, onCompleteParams), null);
    }, Animator.playAtRandomFrame = function(instance, event, onComplete, onCompleteParams, speed) {
        onComplete = onComplete || null, onCompleteParams = onCompleteParams || null, speed = speed || 1, 
        doCancelledCallback = doCancelledCallback || !1, _timelines || Animator.init(), 
        _timelinesMap[instance.id] !== undefined && Animator.stop(instance, !1);
        var timeline = Animator._makeTimeline(instance, event, onComplete, onCompleteParams, dropFrames);
        return timeline.firstFrame > -1 && timeline.lastFrame > -1 ? (timeline.time = Math.random() * timeline.duration, 
        instance._elapsedTime = timeline.startTime + timeline.time, instance.play(), instance._tick(), 
        Animator._hasTimelines() || Animator._startUpdate(), _timelines.push(timeline), 
        _timelinesMap[instance.id] = timeline, timeline) : (Animator.debug && Debug.log("No event " + event + " was found, or it lacks an end, on this MovieClip " + instance), 
        onComplete && onComplete.apply(null, onCompleteParams), null);
    }, Animator._makeTimeline = function(instance, event, onComplete, onCompleteParams, speed, soundData) {
        var timeline = new AnimatorTimeline();
        if (instance instanceof MovieClip == !1) return timeline;
        instance.advanceDuringTicks = !1, timeline.instance = instance, timeline.event = event, 
        timeline.onComplete = onComplete, timeline.onCompleteParams = onCompleteParams, 
        timeline.speed = speed, soundData && (timeline.playSound = !0, timeline.soundStart = soundData.start, 
        timeline.soundAlias = soundData.alias);
        var startFrame = instance.timeline.resolve(event), stopFrame = instance.timeline.resolve(event + "_stop"), stopLoopFrame = instance.timeline.resolve(event + "_loop");
        return startFrame !== undefined && (timeline.firstFrame = startFrame, timeline.startTime = startFrame / instance.getAnimFrameRate()), 
        stopFrame !== undefined ? timeline.lastFrame = stopFrame : stopLoopFrame !== undefined && (timeline.lastFrame = stopLoopTime, 
        timeline.isLooping = !0), timeline.length = timeline.lastFrame - timeline.firstFrame, 
        timeline.duration = timeline.length / instance.getAnimFrameRate(), timeline;
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
            timeline.instance.stop(), timeline.soundInst && timeline.soundInst.stop(), _timelines.splice(index, 1), 
            delete _timelinesMap[timeline.instance.id], timeline.instance = null, timeline.event = null, 
            timeline.onComplete = null, timeline.onCompleteParams = null, Animator._hasTimelines() || Animator._stopUpdate(), 
            doOnComplete && onComplete && onComplete.apply(null, onCompleteParams);
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
                    {
                        t.time;
                    }
                    if (t.soundInst) {
                        if (!t.soundInst.isValid) {
                            _removedTimelines.push(timeline);
                            continue;
                        }
                        t.time = t.soundStart + .001 * t.soundInst.position;
                    } else t.time += delta * t.speed, t.time >= t.duration && (t.isLooping ? (t.time -= t.duration, 
                    t.onComplete && t.onComplete.apply(null, t.onCompleteParams)) : (instance.gotoAndStop(t.lastFrame), 
                    _removedTimelines.push(t))), t.playSound && t.time >= t.soundStart && (t.time = t.soundStart, 
                    t.soundInst = Animator.audioLib.play(t.soundAlias, onSoundDone.bind(this, t), onSoundStarted.bind(this, t)));
                    instance._elapsedTime = t.startTime + t.time, instance._tick();
                }
            }
            for (i = 0; i < _removedTimelines.length; i++) t = _removedTimelines[i], Animator._remove(t, !0);
        }
    };
    var onSoundStarted = function(timeline) {
        timeline.playSound = !1, timeline.soundEnd = timeline.soundStart + .001 * timeline.soundInst.length;
    }, onSoundDone = function(timeline) {
        timeline.time = timeline.soundEnd || timeline.soundStart, timeline.soundInst = null;
    };
    Animator._hasTimelines = function() {
        return _timelines ? _timelines.length > 0 : !1;
    }, Animator.toString = function() {
        return "[Animator version:" + Animator.VERSION + "]";
    }, namespace("cloudkid").Animator = Animator;
}(), function() {
    var CharacterClip = function(event, loops) {
        this.initialize(event, loops);
    }, p = CharacterClip.prototype;
    p.event = null, p.loops = 0, p.initialize = function(event, loops) {
        this.event = event, this.loops = loops || 0;
    }, namespace("cloudkid").CharacterClip = CharacterClip;
}(), function() {
    var Animator = cloudkid.Animator, CharacterController = function() {
        this.initialize();
    }, p = CharacterController.prototype;
    p_animationStack = null, p._currentAnimation = null, p._loops = 0, p._interruptable = !0, 
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
        this._loops++, 0 === this._currentAnimation.loops || this._loops < this._currentAnimation.loops ? Animator.play(this._character, this._currentAnimation.event, this._animationComplete.bind(this), [], this._allowFrameDropping) : this._currentAnimation.loops == this._loops && this.startNext();
    }, p.clear = function() {
        this._character && Animator.stop(this._character), this._currentAnimation = null, 
        this._interruptable = !0, this._callback = null, this._animationStack.length = 0, 
        this._loops = 0;
    }, p.destroy = function() {
        this._destroyed || (this._destroyed = !0, this.clear(), this._character = null, 
        this._animationStack = null);
    }, namespace("cloudkid").CharacterController = CharacterController;
}();