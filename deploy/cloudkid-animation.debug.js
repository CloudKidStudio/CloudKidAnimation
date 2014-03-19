!function() {
    var AnimatorTimeline = function() {}, p = AnimatorTimeline.prototype;
    p.onComplete = null, p.onCompleteParams = null, p.event = null, p.instance = null, 
    p.firstFrame = -1, p.lastFrame = -1, p.isLooping = !1, p.timePassed = 0, p.realStartFrame = 0, 
    p.isLastFrame = !1, p.length = 0, p.dropFrames = !1, p._isPaused = !1, p.getPaused = function() {
        return this._isPaused;
    }, p.setPaused = function(pause) {
        this._isPaused = pause, this.instance && (pause ? this.instance.stop() : this.instance.play());
    }, namespace("cloudkid").AnimatorTimeline = AnimatorTimeline;
}(), function(undefined) {
    var OS = cloudkid.OS, AnimatorTimeline = cloudkid.AnimatorTimeline, MovieClip = createjs.MovieClip, Animator = function() {};
    Animator.VERSION = "1.0.0", Animator.debug = !1;
    var _timelines = [], _removedTimelines = [], _timelinesMap = {}, _paused = !1;
    Animator.useFrameDropping = !1, Animator.init = function() {
        _timelines = [], _removedTimelines = [], _timelinesMap = {}, _paused = !1, Animator.useFrameDropping = !1;
    }, Animator.destroy = function() {
        Animator.stopAll(), _timelines = null, _removedTimelines = null, _timelinesMap = null;
    }, Animator.play = function(instance, event, onComplete, onCompleteParams, dropFrames, frameOffset, doCancelledCallback) {
        onComplete = onComplete || null, onCompleteParams = onCompleteParams || null, dropFrames = dropFrames || !0, 
        frameOffset = frameOffset || 0, doCancelledCallback = doCancelledCallback || !1, 
        _timelines || Animator.init(), _timelinesMap[instance.id] !== undefined && Animator.stop(instance, doCancelledCallback);
        var timeline = Animator._makeTimeline(instance, event, onComplete, onCompleteParams, dropFrames);
        return timeline.firstFrame > -1 && timeline.lastFrame > -1 ? (timeline.realStartFrame = timeline.firstFrame + frameOffset, 
        instance.gotoAndPlay(timeline.realStartFrame), Animator._hasTimelines() || Animator._startUpdate(), 
        _timelines.push(timeline), _timelinesMap[instance.id] = timeline, timeline) : (Debug.log("No event " + event + " was found, or it lacks an end, on this MovieClip " + instance), 
        onComplete && onComplete.apply(null, onCompleteParams), null);
    }, Animator.playAtRandomFrame = function(instance, event, onComplete, onCompleteParams, dropFrames) {
        onComplete = onComplete || null, onCompleteParams = onCompleteParams || null, dropFrames = dropFrames || !0, 
        _timelines || Animator.init(), _timelinesMap[instance.id] !== undefined && Animator.stop(instance, !1);
        var timeline = Animator._makeTimeline(instance, event, onComplete, onCompleteParams, dropFrames);
        return timeline.firstFrame > 0 && timeline.lastFrame > 0 ? (timeline.realStartFrame = Math.random() * (timeline.lastFrame - timeline.firstFrame) + timeline.firstFrame, 
        instance.gotoAndPlay(timeline.realStartFrame), Animator._hasTimelines() || Animator._startUpdate(), 
        _timelines.push(timeline), _timelinesMap[instance.id] = timeline, timeline) : (Animator.debug && Debug.log("No event " + event + " was found, or it lacks an end, on this MovieClip " + instance), 
        onComplete && onComplete.apply(null, onCompleteParams), null);
    }, Animator._makeTimeline = function(instance, event, onComplete, onCompleteParams, dropFrames) {
        var timeline = new AnimatorTimeline();
        if (instance instanceof MovieClip == !1) return timeline;
        timeline.instance = instance, timeline.event = event, timeline.onComplete = onComplete, 
        timeline.onCompleteParams = onCompleteParams, timeline.dropFrames = dropFrames;
        var startTime = instance.timeline.resolve(event), stopTime = instance.timeline.resolve(event + "_stop"), stopLoopTime = instance.timeline.resolve(event + "_loop");
        return startTime !== undefined && (timeline.firstFrame = timeline.realStartFrame = startTime), 
        stopTime !== undefined ? timeline.lastFrame = stopTime : stopLoopTime !== undefined && (timeline.lastFrame = stopLoopTime, 
        timeline.isLooping = !0), timeline.length = timeline.lastFrame - timeline.firstFrame, 
        timeline;
    }, Animator.stop = function(instance, doOnComplete) {
        if (doOnComplete = doOnComplete || !1, _timelines) {
            if (_timelinesMap[instance.id] === undefined) return Debug.log("No timeline was found matching the instance id " + instance), 
            void 0;
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
            timeline.instance.stop(), _timelines.splice(index, 1), delete _timelinesMap[timeline.instance.id], 
            timeline.instance = null, timeline.event = null, timeline.onComplete = null, timeline.onCompleteParams = null, 
            Animator._hasTimelines() || Animator._stopUpdate(), doOnComplete && onComplete && onComplete.apply(null, onCompleteParams);
        }
    }, Animator.pause = function() {
        if (_timelines && !_paused) {
            _paused = !0;
            for (var i = 0; i < _timelines.length; i++) _timelines[i].setPaused(!0);
            Animator._stopUpdate();
        }
    }, Animator.resume = function() {
        if (_timelines && _paused) {
            _paused = !1;
            for (var i = 0; i < _timelines.length; i++) _timelines[i].setPaused(!1);
            Animator._hasTimelines() && Animator._startUpdate();
        }
    }, Animator.pauseInGroup = function(paused, container) {
        if (Animator._hasTimelines() && container) for (var i = 0; i < _timelines.length; i++) container.contains(_timelines[i].instance) && _timelines[i].setPaused(paused);
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
            var expected = 0, frameRate = 0, expectedFrameLength = 0;
            Animator.useFrameDropping && (frameRate = OS.instance.fps, expectedFrameLength = 1e3 / frameRate, 
            frameRate *= .001);
            for (var timeline, instance, currentFrame, i = 0; i < _timelines.length; i++) if (timeline = _timelines[i], 
            !timeline.getPaused()) if (instance = timeline.instance, currentFrame = instance.timeline.position || 0, 
            currentFrame >= timeline.lastFrame || currentFrame < timeline.firstFrame || timeline.isLastFrame) {
                if (currentFrame == timeline.lastFrame && !timeline.isLastFrame) {
                    timeline.isLastFrame = !0, Animator.useFrameDropping && timeline.dropFrames && (timeline.timePassed += expectedFrameLength > elapsed ? expectedFrameLength : elapsed), 
                    instance.stop();
                    continue;
                }
                timeline.isLooping ? (timeline.isLastFrame && (timeline.isLastFrame = !1), Animator.useFrameDropping && timeline.dropFrames ? 1 == currentFrame && timeline.firstFrame > 1 ? (instance.gotoAndPlay(timeline.firstFrame), 
                timeline.timePassed = 0) : (timeline.timePassed += expectedFrameLength > elapsed ? expectedFrameLength : elapsed, 
                expected = Math.round(timeline.timePassed * frameRate) + timeline.realStartFrame, 
                expected -= timeline.firstFrame, expected = expected % timeline.length + timeline.firstFrame, 
                timeline.timePassed = Math.round((expected - timeline.firstFrame) / frameRate), 
                timeline.realStartFrame = timeline.firstFrame, instance.gotoAndPlay(expected)) : instance.gotoAndPlay(timeline.firstFrame), 
                Debug.log("animation ended - " + timeline.event), timeline.onComplete && timeline.onComplete.apply(null, timeline.onCompleteParams)) : (instance.gotoAndStop(timeline.lastFrame), 
                _removedTimelines.push(timeline));
            } else if (Animator.useFrameDropping && timeline.dropFrames && (timeline.timePassed += expectedFrameLength > elapsed ? expectedFrameLength : elapsed, 
            expected = Math.round(timeline.timePassed * frameRate) + timeline.realStartFrame, 
            expected > currentFrame)) if (expected >= timeline.lastFrame) {
                if (expected == timeline.lastFrame) {
                    timeline.isLastFrame = !0, instance.gotoAndStop(expected);
                    continue;
                }
                timeline.isLooping ? (expected -= timeline.firstFrame, expected = expected % timeline.length + timeline.firstFrame, 
                instance.gotoAndPlay(expected), timeline.timePassed = Math.round((expected - timeline.firstFrame) / frameRate), 
                timeline.realStartFrame = timeline.firstFrame, timeline.onComplete && timeline.onComplete.apply(null, timeline.onCompleteParams)) : (instance.gotoAndStop(timeline.lastFrame), 
                _removedTimelines.push(timeline));
            } else instance.gotoAndPlay(expected);
            for (i = 0; i < _removedTimelines.length; i++) timeline = _removedTimelines[i], 
            Animator._remove(timeline, !0);
        }
    }, Animator._hasTimelines = function() {
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