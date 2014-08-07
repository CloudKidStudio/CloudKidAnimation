/**
*  @module cloudkid
*/
(function() {
	
	"use strict";

	/**
	*  [PIXI Only] Animator for interacting with Spine animations
	*  @class PixiAnimator
	*/
	var PixiAnimator = function()
	{
		this._timelines = [];
		this._boundUpdate = this._update.bind(this);
	};
	
	var p = PixiAnimator.prototype = {};
	
	/**
	* A reference to this instance of PixiAnimator. This is internal to PixiAnimator and can't be accessed externally.
	* @property {PixiAnimator} _instance
	* @private
	* @static
	*/
	var _instance = null;
	
	/**
	* The collection of AnimTimelines that are playing
	* @property {Array} _timelines
	* @private
	*/
	p._timelines = null;
	
	/**
	* The number of animations
	* @property {int} _numAnims
	* @private
	*/
	p._numAnims = 0;
	
	/**
	* A string reference to PixiAnimator's update callback
	* so it can be removed in the event that there are no
	* animations to play
	* @property {String} _updateAlias
	* @private
	*/
	p._updateAlias = "animator";
	
	/**
	* The function that PixiAnimator uses for update calls. Do not modify.
	* @property {function} _boundUpdate
	* @private
	*/
	p._boundUpdate = null;
	
	/**
	* The instance of cloudkid.Audio or cloudkid.Sound for playing audio along with animations.
	* 
	* @property {cloudkid.Audio|cloudkid.Sound} soundLib
	* @public
	*/
	p.soundLib = null;
	
	/**
	 * Stored collection of AnimTimelines. This is internal to PixiAnimator and can't be accessed externally.
	 * @property {Array} _animPool
	 * @private
	 * @static
	 */
	var _animPool = null;
	
	/**
	*  The global captions object to use with animator
	*  @property {cloudkid.Captions} captions
	*  @public
	*/
	p.captions = null;

	/**
	 * Initializes the singleton instance of PixiAnimator.
	 * @method init
	 * @static
	 */
	PixiAnimator.init = function()
	{
		_instance = new PixiAnimator();
		_animPool = [];
	};
	
	/**
	* Getter for the reference to this instance of PixiAnimator
	* @property {PixiAnimator} instance
	* @readOnly
	* @static
	*/
	Object.defineProperty(PixiAnimator, "instance",
	{
		get: function() { return _instance; }
	});
	
	/**
	* Play a specified animation
	* 
	* @function play
	* @param {PIXI.MovieClip|PIXI.Spine} clip The clip to play
	* @param {String|Array} anim Depending on the type of clip, this could be one of several things.
	*
	* If animating a MovieClip, this should be the array of Textures that is the animation (or null to use the existing array on the clip).
	*
	* If animating a Spine object:
	* - If anim is a string it will play that single animation by name.
	* - If anim is an array of strings it will play as a list of animations (only the last one can loop).
	* - If anim is an array of objects (with anim, loop, and speed properties) then multiple animations will be played simultaneously.
	*    When multiple animations play, animation stops when any non looping animation ends.
	* @param {Object|function} [options] The object of optional parameters or onComplete callback function
	* @param {function} [options.callback=null] The function to call once the animation has finished
	* @param {bool} [options.loop=false] Whether the animation should loop
	* @param {int} [options.speed=1] The speed at which to play the animation
	* @param {int} [options.startTime=0] The time in milliseconds into the animation to start.
	* @param {Object|String} [options.soundData=null] Data about a sound to sync the animation to, as an alias or in the format {alias:"MyAlias", start:0}.
	*        start is the seconds into the animation to start playing the sound. If it is omitted or soundData is a string, it defaults to 0.
	*/
	p.play = function(clip, anim, options, loop, speed, startTime, soundData)
	{
		var callback = null;

		if (options && typeof options == "function")
		{
			callback = options;
			options = {};
		}
		else if (!options)
		{
			options = {};
		}

		if(clip === null || (!(clip instanceof PIXI.Spine) && !(clip.updateAnim/*clip instanceof PIXI.MovieClip*/)))
		{
			if(callback) callback();
			return;
		}
		
		this.stop(clip);
		callback = options.callback || callback || null;
		loop = options.loop || loop || false;
		speed = options.speed || speed || 1;
		startTime = options.startTime || startTime;
		startTime = startTime ? startTime * 0.001 : 0;//convert into seconds, as that is what the time uses internally
		soundData = options.soundData || soundData || null;

		var t = _animPool.length ? 
			_animPool.pop().init(clip, callback, speed) : 
			new AnimTimeline(clip, callback, speed);

		if(t.isSpine)//PIXI.Spine
		{
			var i;
			
			if(typeof anim == "string")//allow the animations to be a string, or an array of strings
			{
				if(!checkSpineForAnimation(clip, anim))
				{
					this._repool(t);
					if(callback)
						callback();
					return;
				}
				clip.state.setAnimationByName(anim, loop);
				clip.updateAnim(startTime > 0 ? startTime * t.speed : 0);
			}
			else//Array - either animations in order or animations at the same time
			{
				if(typeof anim[0] == "string")//array of Strings, play animations by name in order
				{
					clip.state.setAnimationByName(anim[0], false);
					for(i = 1; i < anim.length; ++i)
					{
						clip.state.addAnimationByName(anim[i], loop && i == anim.length - 1);
					}
					clip.updateAnim(startTime > 0 ? startTime * t.speed : 0);
				}
				else//array of objects - play different animations at the same time
				{
					t.spineStates = new Array(anim.length);
					t.speed = new Array(anim.length);
					for(i = 0; i < anim.length; ++i)
					{
						var s = new PIXI.spine.AnimationState(clip.stateData);
						t.spineStates[i] = s;
						s.setAnimationByName(anim[i].anim, loop || anim[i].loop);
						if(anim[i].speed)
							t.speed[i] = anim[i].speed;
						else
							t.speed[i] = speed || 1;
						if(startTime > 0)
							s.update(startTime * t.speed[i]);
						s.apply(clip.skeleton);
					}
				}
			}
		}
		else//standard PIXI.MovieClip
		{
			if(anim && anim instanceof Array)
			{
				clip.textures = anim;
				clip.updateDuration();
			}
			clip.loop = loop;
			clip.onComplete = this._onMovieClipDone.bind(this, t);
			clip.gotoAndPlay(0);
			if(startTime > 0)
				clip.updateAnim(startTime * t.speed);
		}
		if(soundData)
		{
			t.playSound = true;
			if(typeof soundData == "string")
			{
				t.soundStart = 0;
				t.soundAlias = soundData;
			}
			else
			{
				t.soundStart = soundData.start > 0 ? soundData.start : 0;//seconds
				t.soundAlias = soundData.alias;
			}
			t.useCaptions = this.captions && this.captions.hasCaption(t.soundAlias);

			if(t.soundStart === 0)
			{
				t.soundInst = this.soundLib.play(t.soundAlias, onSoundDone.bind(this, t), onSoundStarted.bind(this, t));
			}
			else if(this.soundLib.preloadSound)//if it can preload sound this way
				this.soundLib.preloadSound(soundData.alias);
		}
		t.loop = loop;
		t.time = startTime > 0 ? startTime : 0;
		this._timelines.push(t);
		if(++this._numAnims == 1)
			cloudkid.OS.instance.addUpdateCallback(this._updateAlias, this._boundUpdate);
		return t;
	};

	/**
	 * Checks to see if a Spine animation includes a given animation alias
	 * 
	 * @function instanceHasAnimation
	 * @param {PIXI.spine} instance The animation to search. This has to be a Spine animation.
	 * @param {String} anim The animation alias to search for
	 * @returns {Boolean} Returns true if the animation is found
	 */
	p.instanceHasAnimation = function(instance, anim)
	{
		if(instance instanceof PIXI.Spine)
			return checkSpineForAnimation(instance, anim);
		return false;
	};
	
	/**
	 * Checks to see if a Spine animation includes a given animation alias
	 * 
	 * @function checkSpineForAnimation
	 * @param {PIXI.spine} clip The spine to search
	 * @param {String} anim The animation alias to search for
	 * @returns {Boolean} Returns true if the animation is found
	 */
	var checkSpineForAnimation = function(clip, anim)
	{
		return clip.stateData.skeletonData.findAnimation(anim) !== null;
	};
	
	/**
	 * Stop a clip
	 * 
	 * @function stop
	 * @param {PIXI.MovieClip|PIXI.Spine} clip The clip to stop
	 * @param {bool} doCallback Whether the animations callback should be run
	 */
	p.stop = function(clip, doCallback)
	{
		for(var i = 0; i < this._numAnims; ++i)
		{
			if(this._timelines[i].clip === clip)
			{
				var t = this._timelines[i];
				this._timelines.splice(i, 1);
				if(--this._numAnims === 0)
					cloudkid.OS.instance.removeUpdateCallback(this._updateAlias);
				if(doCallback && t.callback)
					t.callback();
				if(t.soundInst)
					t.soundInst.stop();
				this._repool(t);
				break;
			}
		}
	};
	
	/**
	 * Stops all current animations
	 * 
	 * @function stop
	 */
	p.stopAll = function()
	{
		for(var i = 0; i < this._numAnims; ++i)
		{
				var t = this._timelines[i];
				if(t.soundInst)
					t.soundInst.stop();
				this._repool(t);
				break;
		}		
		cloudkid.OS.instance.removeUpdateCallback(this._updateAlias);
		this._timelines.length = this._numAnims = 0;
	};
	
	/**
	 * Put an AnimTimeline back into the general pool after it's done playing
	 * or has been manually stopped
	 * 
	 * @function _repool
	 * @param {PixiAnimator.AnimTimeline} timeline
	 * @private
	 */
	p._repool = function(timeline)
	{
		timeline.clip = null;
		timeline.callback = null;
		timeline.loop = false;
		timeline.spineStates = null;
		timeline.speed = null;
		timeline.soundInst = null;
		_animPool.push(timeline);
	};
	
	/**
	 * Update each frame
	 * 
	 * @function _update
	 * @param {int} elapsed The time since the last frame
	 * @private
	 */
	p._update = function(elapsed)
	{
		var delta = elapsed * 0.001;//ms -> sec
		
		for(var i = this._numAnims - 1; i >= 0; --i)
		{
			var t = this._timelines[i];
			if(t.paused) continue;
			var prevTime = t.time;
			if(t.soundInst)
			{
				if(t.soundInst.isValid)
				{
					t.time = t.soundStart + t.soundInst.position * 0.001;//convert sound position ms -> sec
					if (t.useCaptions)
					{
						this.captions.seek(t.soundInst.position);
					}
				}
				else//if sound is no longer valid, stop animation immediately
				{
					this._onMovieClipDone(t);
					continue;
				}
			}
			else
			{
				t.time += delta;
				if(t.playSound && t.time >= t.soundStart)
				{
					t.time = t.soundStart;
					t.soundInst = this.soundLib.play(
						t.soundAlias, 
						onSoundDone.bind(this, t), 
						onSoundStarted.bind(this, t)
					);
					if (t.useCaptions)
					{
						this.captions.isSlave = true;
						this.captions.run(t.soundAlias);
					}
				}
			}
			var c = t.clip;
			if(t.isSpine)//PIXI.Spine
			{
				if(t.spineStates)
				{
					var complete = false;
					for(var j = 0, len = t.spineStates.length; j < len; ++j)
					{
						var s = t.spineStates[j];
						s.update((t.time - prevTime) * t.speed[j]);
						s.apply(c.skeleton);
						if(!s.currentLoop && s.isComplete())
							complete = true;
					}
					if(complete)
					{
						this._timelines.splice(i, 1);
						this._numAnims--;
						if(t.useCaptions)
							this.captions.stop();
						if(t.callback)
							t.callback();
						this._repool(t);
					}
				}
				else
				{
					c.updateAnim((t.time - prevTime) * t.speed);
					var state = c.state;
					if(!state.currentLoop && state.queue.length === 0 && state.currentTime >= state.current.duration)
					{
						this._timelines.splice(i, 1);
						this._numAnims--;
						if(t.useCaptions)
							this.captions.stop();
						if(t.callback)
							t.callback();
						this._repool(t);
					}
				}
			}
			else//standard PIXI.MovieClip
			{
				c.updateAnim((t.time - prevTime) * t.speed);
			}
		}
		if(this._numAnims === 0)
			cloudkid.OS.instance.removeUpdateCallback(this._updateAlias);
	};
	
	var onSoundStarted = function(timeline)
	{
		timeline.playSound = false;
		timeline.soundEnd = timeline.soundStart + timeline.soundInst.length * 0.001;//convert sound length to seconds
	};
	
	var onSoundDone = function(timeline)
	{
		if(timeline.soundEnd > 0 && timeline.time < timeline.soundEnd)
			timeline.time = timeline.soundEnd;
		timeline.soundInst = null;
	};
	
	/**
	 * Called when a movie clip is done playing, calls the AnimTimeline's
	 * callback if it has one
	 * 
	 * @function _onMovieClipDone
	 * @param {PixiAnimator.AnimTimeline} timeline
	 * @private
	 */
	p._onMovieClipDone = function(timeline)
	{
		for(var i = 0; i < this._numAnims; ++i)
		{
			if(this._timelines[i] === timeline)
			{
				var t = this._timelines[i];
				if(t.useCaptions)
					this.captions.stop();
				t.clip.onComplete = null;
				this._timelines.splice(i, 1);
				if(--this._numAnims === 0)
					cloudkid.OS.instance.removeUpdateCallback(this._updateAlias);
				if(t.callback)
					t.callback();
				this._repool(t);
				break;
			}
		}
	};
	
	/**
	 * Destroy this
	 * 
	 * @function destroy
	 */
	p.destroy = function()
	{
		if (this.captions)
		{
			this.captions.destroy();
		}
		this.captions = null;
		_instance = null;
		_animPool = null;
		this._timelines = null;
		cloudkid.OS.instance.removeUpdateCallback(this._updateAlias);
		this._boundUpdate = null;
	};
	
	/**
	 * [Pixi Only] Internal PixiAnimator class for keeping track of animations
	 * 
	 * @class PixiAnimator.AnimTimeline
	 * @constructor
	 * @param {PIXI.MovieClip|Pixi.Spine} clip The AnimTimeline's clip
	 * @param {function} callback The function to call when the clip is finished playing
	 * @param {int} speed The speed at which the clip should be played
	 */
	var AnimTimeline = function(clip, callback, speed)
	{
		this.init(clip, callback, speed);
	};
	
	AnimTimeline.constructor = AnimTimeline;
	
	/**
	 * Initialize the AnimTimeline
	 * 
	 * @function init
	 * @param {PIXI.MovieClip|Pixi.Spine} clip The AnimTimeline's clip
	 * @param {function} callback The function to call when the clip is finished playing
	 * @param {Number} speed The speed at which the clip should be played
	 * @returns {PixiAnimator.AnimTimeline}
	 */
	AnimTimeline.prototype.init = function(clip, callback, speed)
	{
		/**
		*	The clip for this AnimTimeLine
		*	@property {PIXI.MovieClip|PIXI.Spine} clip
		*	@public
		*/
		this.clip = clip;

		/**
		*	Whether the clip is a PIXI.Spine
		*	@property {bool} isSpine
		*	@public
		*/
		this.isSpine = clip instanceof PIXI.Spine;

		/**
		*	The function to call when the clip is finished playing
		*	@property {function} callback
		*	@public
		*/
		this.callback = callback;

		/**
		*	The speed at which the clip should be played
		*	@property {Number} speed
		*	@public
		*/
		this.speed = speed;

		/**
		*	@property {Array} spineStates
		*	@public
		*/
		this.spineStates = null;

		/**
		*	Not used by PixiAnimator, but potentially useful for other code to keep track of what type of animation is being played
		*	@property {bool} loop
		*	@public
		*/
		this.loop = null;

		/**
		*	The position of the animation in seconds
		*	@property {Number} time
		*	@public
		*/
		this.time = 0;

		/**
		*	Sound alias to sync to during the animation.
		*	@property {String} soundAlias
		*	@public
		*/
		this.soundAlias = null;

		/**
		*	A sound instance object from cloudkid.Sound or cloudkid.Audio, used for tracking sound position.
		*	@property {Object} soundInst
		*	@public
		*/
		this.soundInst = null;

		/**
		*	If the timeline will, but has yet to, play a sound
		*	@property {bool} playSound
		*	@public
		*/
		this.playSound = false;

		/**
		*	The time (seconds) into the animation that the sound starts.
		*	@property {Number} soundStart
		*	@public
		*/
		this.soundStart = 0;

		/**
		*	The time (seconds) into the animation that the sound ends
		*	@property {Number} soundEnd
		*	@public
		*/
		this.soundEnd = 0;

		/**
		*  If this timeline plays captions
		*
		*  @property {bool} useCaptions
		*  @readOnly
		*/
		this.useCaptions = false;

		/**
		*	If this animation is paused.
		*	@property {bool} _paused
		*	@private
		*/
		this._paused = false;

		return this;
	};
	
	/**
	* Sets and gets the animation's paused status.
	* 
	* @property {bool} paused
	* @public
	*/
	Object.defineProperty(AnimTimeline.prototype, "paused", {
		get: function() { return this._paused; },
		set: function(value) {
			if(value == this._paused) return;
			this._paused = !!value;
			if(this.soundInst)
			{
				if(this.paused)
					this.soundInst.pause();
				else
					this.soundInst.unpause();
			}
		}
	});
	
	namespace('cloudkid').PixiAnimator = PixiAnimator;
}());