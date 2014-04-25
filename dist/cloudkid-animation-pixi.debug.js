!function() {
    var PixiAnimator = function() {
        this._timelines = [], this._boundUpdate = this._update.bind(this);
    }, p = PixiAnimator.prototype = {}, _instance = null;
    p._timelines = null, p._numAnims = 0, p._updateAlias = "animator", p._boundUpdate = null, 
    p.soundLib = null;
    var _animPool = null;
    p.captions = null, PixiAnimator.init = function() {
        _instance = new PixiAnimator(), _animPool = [];
    }, Object.defineProperty(PixiAnimator, "instance", {
        get: function() {
            return _instance;
        }
    }), p.play = function(clip, anim, options, loop, speed, startTime, soundData) {
        var callback = null;
        if (options && "function" == typeof options ? (callback = options, options = {}) : void 0 === options && (options = {}), 
        null === clip || !(clip instanceof PIXI.Spine) && !clip.updateAnim) return void (callback && callback());
        this.stop(clip), callback = options.callback || callback || null, loop = options.loop || loop || !1, 
        speed = options.speed || speed || 1, startTime = options.startTime || startTime, 
        startTime = startTime ? .001 * startTime : 0, soundData = options.soundData || soundData || null;
        var t = _animPool.length ? _animPool.pop().init(clip, callback, speed) : new AnimTimeline(clip, callback, speed);
        if (t.isSpine) {
            var i;
            if ("string" == typeof anim) {
                if (!checkSpineForAnimation(clip, anim)) return this._repool(t), void (callback && callback());
                clip.state.setAnimationByName(anim, loop), clip.updateAnim(startTime > 0 ? startTime * t.speed : 0);
            } else if ("string" == typeof anim[0]) {
                for (clip.state.setAnimationByName(anim[0], !1), i = 1; i < anim.length; ++i) clip.state.addAnimationByName(anim[i], loop && i == anim.length - 1);
                clip.updateAnim(startTime > 0 ? startTime * t.speed : 0);
            } else for (t.spineStates = new Array(anim.length), t.speed = new Array(anim.length), 
            i = 0; i < anim.length; ++i) {
                var s = new PIXI.spine.AnimationState(clip.stateData);
                t.spineStates[i] = s, s.setAnimationByName(anim[i].anim, loop || anim[i].loop), 
                t.speed[i] = anim[i].speed ? anim[i].speed : speed || 1, startTime > 0 && s.update(startTime * t.speed[i]), 
                s.apply(clip.skeleton);
            }
        } else anim && anim instanceof Array && (clip.textures = anim, clip.updateDuration()), 
        clip.loop = loop, clip.onComplete = this._onMovieClipDone.bind(this, t), clip.gotoAndPlay(0), 
        startTime > 0 && clip.update(startTime * t.speed);
        return soundData && (t.playSound = !0, "string" == typeof soundData ? (t.soundStart = 0, 
        t.soundAlias = soundData) : (t.soundStart = soundData.start > 0 ? soundData.start : 0, 
        t.soundAlias = soundData.alias), timeline.useCaptions = this.captions && this.captions.hasCaption(timeline.soundAlias), 
        0 === t.soundStart ? t.soundInst = cloudkid.Sound.instance.play(t.soundAlias, onSoundDone.bind(this, t), onSoundStarted.bind(this, t)) : cloudkid.Sound.instance.preloadSound(soundData.alias)), 
        t.loop = loop, t.time = startTime > 0 ? startTime : 0, this._timelines.push(t), 
        1 == ++this._numAnims && cloudkid.OS.instance.addUpdateCallback(this._updateAlias, this._boundUpdate), 
        t;
    }, p.instanceHasAnimation = function(instance, anim) {
        return instance instanceof PIXI.Spine ? checkSpineForAnimation(instance, anim) : !1;
    };
    var checkSpineForAnimation = function(clip, anim) {
        return null !== clip.stateData.skeletonData.findAnimation(anim);
    };
    p.stop = function(clip, doCallback) {
        for (var i = 0; i < this._numAnims; ++i) if (this._timelines[i].clip === clip) {
            var t = this._timelines[i];
            this._timelines.splice(i, 1), 0 === --this._numAnims && cloudkid.OS.instance.removeUpdateCallback(this._updateAlias), 
            doCallback && t.callback && t.callback(), t.soundInst && t.soundInst.stop(), this._repool(t);
            break;
        }
    }, p.stopAll = function() {
        for (var i = 0; i < this._numAnims; ++i) {
            var t = this._timelines[i];
            t.soundInst && t.soundInst.stop(), this._repool(t);
            break;
        }
        cloudkid.OS.instance.removeUpdateCallback(this._updateAlias), this._timelines.length = this._numAnims = 0;
    }, p._repool = function(timeline) {
        timeline.clip = null, timeline.callback = null, timeline.loop = !1, timeline.spineStates = null, 
        timeline.speed = null, timeline.soundInst = null, _animPool.push(timeline);
    }, p._update = function(elapsed) {
        for (var delta = .001 * elapsed, i = this._numAnims - 1; i >= 0; --i) {
            var t = this._timelines[i];
            if (!t.paused) {
                var prevTime = t.time;
                if (t.soundInst) {
                    if (!t.soundInst.isValid) {
                        this._onMovieClipDone(t);
                        continue;
                    }
                    t.time = t.soundStart + .001 * t.soundInst.position, t.useCaptions && this.captions.seek(t.soundInst.position);
                } else t.time += delta, t.playSound && t.time >= t.soundStart && (t.time = t.soundStart, 
                t.soundInst = this.soundLib.play(t.soundAlias, onSoundDone.bind(this, t), onSoundStarted.bind(this, t)), 
                t.useCaptions && (this.captions.isSlave = !0, this.captions.run(t.soundAlias)));
                var c = t.clip;
                if (t.isSpine) if (t.spineStates) {
                    for (var complete = !1, j = 0, len = t.spineStates.length; len > j; ++j) {
                        var s = t.spineStates[j];
                        s.update((t.time - prevTime) * t.speed[j]), s.apply(c.skeleton), !s.currentLoop && s.isComplete() && (complete = !0);
                    }
                    complete && (this._timelines.splice(i, 1), this._numAnims--, t.callback && t.callback(), 
                    this._repool(t));
                } else {
                    c.updateAnim((t.time - prevTime) * t.speed);
                    var state = c.state;
                    !state.currentLoop && 0 === state.queue.length && state.currentTime >= state.current.duration && (this._timelines.splice(i, 1), 
                    this._numAnims--, t.callback && t.callback(), this._repool(t));
                } else c.updateAnim((t.time - prevTime) * t.speed);
            }
        }
        0 === this._numAnims && cloudkid.OS.instance.removeUpdateCallback(this._updateAlias);
    };
    var onSoundStarted = function(timeline) {
        timeline.playSound = !1, timeline.soundEnd = timeline.soundStart + .001 * timeline.soundInst.length;
    }, onSoundDone = function(timeline) {
        timeline.soundEnd > 0 && timeline.time < timeline.soundEnd && (timeline.time = timeline.soundEnd), 
        timeline.soundInst = null;
    };
    p._onMovieClipDone = function(timeline) {
        for (var i = 0; i < this._numAnims; ++i) if (this._timelines[i] === timeline) {
            var t = this._timelines[i];
            t.clip.onComplete = null, this._timelines.splice(i, 1), 0 === --this._numAnims && cloudkid.OS.instance.removeUpdateCallback(this._updateAlias), 
            t.callback && t.callback(), this._repool(t);
            break;
        }
    }, p.destroy = function() {
        this.captions && this.captions.destroy(), this.captions = null, _instance = null, 
        _animPool = null, this._timelines = null, cloudkid.OS.instance.removeUpdateCallback(this._updateAlias), 
        this._boundUpdate = null;
    };
    var AnimTimeline = function(clip, callback, speed) {
        this.init(clip, callback, speed);
    };
    AnimTimeline.constructor = AnimTimeline, AnimTimeline.prototype.init = function(clip, callback, speed) {
        return this.clip = clip, this.isSpine = clip instanceof PIXI.Spine, this.callback = callback, 
        this.speed = speed, this.spineStates = null, this.loop = null, this.time = 0, this.soundAlias = null, 
        this.soundInst = null, this.playSound = !1, this.soundStart = 0, this.soundEnd = 0, 
        this.useCaptions = !1, this._paused = !1, this;
    }, Object.defineProperty(AnimTimeline.prototype, "paused", {
        get: function() {
            return this._paused;
        },
        set: function(value) {
            value != this._paused && (this._paused = !!value, this.soundInst && (this.paused ? this.soundInst.pause() : this.soundInst.unpause()));
        }
    }), namespace("cloudkid").PixiAnimator = PixiAnimator;
}();