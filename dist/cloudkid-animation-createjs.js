/**
*  @module cloudkid
*/
(function(){

	"use strict";

	/**
	*   Animator Timeline is a class designed to provide
	*   base animation functionality
	*   
	*   @class AnimatorTimeline
	*   @constructor
	*/
	var AnimatorTimeline = function(){};
	
	// Create a prototype
	var p = AnimatorTimeline.prototype;
	
	/**
	* The event to callback when we're done
	* 
	* @event onComplete
	*/
	p.onComplete = null;
	
	/** 
	* The parameters to pass when completed 
	* 
	* @property {Array} onCompleteParams
	*/
	p.onCompleteParams = null;
	
	/**
	* The event label
	* 
	* @property {String} event
	*/
	p.event = null;
	
	/**
	* The instance of the timeline to animate 
	* 
	* @property {AnimatorTimeline} instance
	*/
	p.instance = null;
	
	/**
	* The frame number of the first frame
	* 
	* @property {int} firstFrame
	*/
	p.firstFrame = -1;
	
	/**
	* The frame number of the last frame
	* 
	* @property {int} lastFrame
	*/
	p.lastFrame = -1;
	
	/**
	* If the animation loops - determined by looking to see if it ends in " stop" or " loop"
	* 
	* @property {bool} isLooping
	*/
	p.isLooping = false;
	
	/**
	* Ensure we show the last frame before looping
	* 
	* @property {bool} isLastFrame
	*/
	p.isLastFrame = false;
	
	/**
	* length of timeline in frames
	* 
	* @property {int} length
	*/
	p.length = 0;

	/**
	*  If this timeline plays captions
	*
	*  @property {bool} useCaptions
	*  @readOnly
	*/
	p.useCaptions = false;
	
	/**
	* If the timeline is paused.
	* 
	* @property {bool} _paused
	* @private
	*/
	p._paused = false;
	
	/**
	* Sets and gets the animation's paused status.
	* 
	* @property {bool} paused
	* @public
	*/
	Object.defineProperty(AnimatorTimeline.prototype, "paused", {
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

	/**
	* The animation start time in seconds on the movieclip's timeline.
	* @property {Number} startTime
	* @public
	*/
	p.startTime = 0;
	/**
	* The animation duration in seconds.
	* @property {Number} duration
	* @public
	*/
	p.duration = 0;
	/**
	* The animation speed. Default is 1.
	* @property {Number} speed
	* @public
	*/
	p.speed = 1;
	/**
	* The position of the animation in seconds.
	* @property {Number} time
	* @public
	*/
	p.time = 0;
	/**
	* Sound alias to sync to during the animation.
	* @property {String} soundAlias
	* @public
	*/
	p.soundAlias = null;
	/**
	* A sound instance object from cloudkid.Sound or cloudkid.Audio, used for tracking sound position.
	* @property {Object} soundInst
	* @public
	*/
	p.soundInst = null;
	/**
	* If the timeline will, but has yet to play a sound.
	* @property {bool} playSound
	* @public
	*/
	p.playSound = false;
	/**
	* The time (seconds) into the animation that the sound starts.
	* @property {Number} soundStart
	* @public
	*/
	p.soundStart = 0;
	/**
	* The time (seconds) into the animation that the sound ends
	* @property {Number} soundEnd
	* @public
	*/
	p.soundEnd = 0;
	
	// Assign to the name space
	namespace('cloudkid').AnimatorTimeline = AnimatorTimeline;
	
}());
/**
*  @module cloudkid
*/
(function(undefined){

	"use strict";

	// Imports
	var OS = cloudkid.OS,
		AnimatorTimeline = cloudkid.AnimatorTimeline,
		MovieClip = createjs.MovieClip;
	
	/**
	*   Animator is a static class designed to provided
	*   base animation functionality, using frame labels of MovieClips
	*
	*   @class Animator
	*   @static
	*/
	var Animator = function(){};
	
	/**
	* The current version of the Animator class 
	* 
	* @property {String} VERSION
	* @public
	* @static
	*/
	Animator.VERSION = "${version}";
	
	/**
	* If we fire debug statements 
	* 
	* @property {bool} debug
	* @public
	* @static
	*/
	Animator.debug = false;
	
	/**
	* The instance of cloudkid.Audio or cloudkid.Sound for playing audio along with animations.
	* This MUST be set in order to play synced animations.
	* 
	* @property {cloudkid.Audio|cloudkid.Sound} soundLib
	* @public
	* @static
	*/
	Animator.soundLib = null;

	/**
	*  The global captions object to use with animator
	*  @property {cloudkid.Captions} captions
	*  @public
	*  @static
	*/
	Animator.captions = null;
	
	/**
	* The collection of timelines
	* 
	* @property {Array} _timelines
	* @private
	*/
	var _timelines = [];
	
	/**
	* A collection of timelines for removal - kept out here so it doesn't need to be
	* reallocated every frame
	* 
	* @property {Array} _removedTimelines
	* @private
	*/
	var _removedTimelines = [];
	
	/** Look up a timeline by the instance
	* 
	* @property {Dictionary} _timelinesMap
	* @private
	*/
	var _timelinesMap = {};
	
	/**
	* If the Animator is paused
	* 
	* @property {bool} _paused
	* @private
	*/
	var _paused = false;

	/**
	* An empty object to avoid creating new objects in play()
	* when an options object is not used for parameters.
	* 
	* @property {Object} _optionsHelper
	* @private
	*/
	var _optionsHelper = {};
	
	/**
	*	Sets the variables of the Animator to their defaults. Use when _timelines is null,
	*	if the Animator data was cleaned up but was needed again later.
	*	
	*	@function init
	*	@static
	*/
	Animator.init = function()
	{
		_timelines = [];
		_removedTimelines = [];
		_timelinesMap = {};
		_paused = false;
	};
	
	/**
	*	Stops all animations and cleans up the variables used.
	*	
	*	@function destroy
	*	@static
	*/
	Animator.destroy = function()
	{
		Animator.stopAll();
		
		_timelines = null;
		_removedTimelines = null;
		_timelinesMap = null;
	};
	
	/**
	*   Play an animation for a frame label event
	*   
	*   @function play
	*   @param {AnimatorTimeline} instance The timeline to animate
	*   @param {String} event The frame label event (e.g. "onClose" to "onClose stop")
	*   @param {Object|function} [options] The object of optional parameters or onComplete callback function
	*   @param {function} [options.onComplete=null] The callback function when the animation is done
	*   @param {Array} [options.onCompleteParams=null] Parameters to pass to onComplete function
	*	@param {int} [options.startTime=0] The time in milliseconds into the animation to start. A value of -1 makes the animation play at a random startTime.
	*	@param {Number} [options.speed=1] The speed at which to play the animation.
	*	@param {Object|String} [options.soundData=null] soundData Data about a sound to sync the animation to, as an alias or in the format {alias:"MyAlias", start:0}.
	*		start is the seconds into the animation to start playing the sound. If it is omitted or soundData is a string, it defaults to 0.
	*   @param {bool} [options.doCancelledCallback=false] Should an overridden animation's callback function still run?
	*   @return {AnimatorTimeline} The Timeline object
	*   @static
	*/
	Animator.play = function(instance, event, options, onCompleteParams, startTime, speed, soundData, doCancelledCallback)
	{
		var onComplete;

		if (options && typeof options == "function")
		{
			onComplete = options;
			options = _optionsHelper;//use the helper instead of creating a new object
		}
		else if (!options)
		{
			options = _optionsHelper;//use the helper instead of creating a new object
		}

		onComplete = options.onComplete || onComplete || null;
		onCompleteParams = options.onCompleteParams || onCompleteParams || null;
		startTime = options.startTime || startTime;
		startTime = startTime ? startTime * 0.001 : 0;//convert into seconds, as that is what the time uses internally
		speed = options.speed || speed || 1;
		doCancelledCallback = options.doCancelledCallback || doCancelledCallback || false;
		soundData = options.soundData || soundData || null;

		if (!_timelines) 
			Animator.init();
		
		if (_timelinesMap[instance.id] !== undefined)
		{
			Animator.stop(instance, doCancelledCallback);
		}
		var timeline = Animator._makeTimeline(instance, event, onComplete, onCompleteParams, speed, soundData);
		
		if (timeline.firstFrame > -1 && timeline.lastFrame > -1)//if the animation is present and complete
		{
			timeline.time = startTime == -1 ? Math.random() * timeline.duration : startTime;
			
			instance.elapsedTime = timeline.startTime + timeline.time;
			instance.play();//have it set its 'paused' variable to false
			instance._tick();//update the movieclip to make sure it is redrawn correctly at the next opportunity
			
			// Before we add the timeline, we should check to see
			// if there are no timelines, then start the enter frame
			// updating
			if (!Animator._hasTimelines()) Animator._startUpdate();
			
			_timelines.push(timeline);
			_timelinesMap[instance.id] = timeline;

			//If the sound doesn't play immediately and we can preload it, we should do that
			if(timeline.soundStart > 0 && Animator.audioLib.preloadSound)
			{
				Animator.soundLib.preloadSound(timeline.soundAlias);
			}
			
			return timeline;
		}
		
		if (true)
		{
			Debug.log("No event " + event + " was found, or it lacks an end, on this MovieClip " + instance);
		}
		
		if (onComplete)
		{
			onComplete.apply(null, onCompleteParams);
		}
		return null;
	};
	
	/**
	*   Play an animation for a frame label event, starting at a random frame within the animation
	*   
	*   @function playAtRandomFrame
	*   @param {AnimatorTimeline} instance The timeline to animate.
	*   @param {String} event The frame label event (e.g. "onClose" to "onClose_stop").
	*   @param {Object|function} [options] The object of optional parameters or onComplete callback function
	*   @param {function} [options.onComplete=null] The callback function when the animation is done
	*   @param {Array} [options.onCompleteParams=null] Parameters to pass to onComplete function
	*	@param {Number} [options.speed=1] The speed at which to play the animation.
	*	@param {Object} [options.soundData=null] soundData Data about a sound to sync the animation to, as an alias or in the format {alias:"MyAlias", start:0}.
	*		start is the seconds into the animation to start playing the sound. If it is omitted or soundData is a string, it defaults to 0.
	*   @param {bool} [options.doCancelledCallback=false] Should an overridden animation's callback function still run?
	*   @return {AnimatorTimeline} The Timeline object
	*   @static
	*/
	Animator.playAtRandomFrame = function(instance, event, options, onCompleteParams, speed, soundData, doCancelledCallback)
	{
		return Animator.play(instance, event, options, onCompleteParams, -1, speed, soundData, doCancelledCallback);
	};
	
	/**
	*   Creates the AnimatorTimeline for a given animation
	*   
	*   @function _makeTimeline
	*   @param {easeljs.MovieClip} instance The timeline to animate
	*   @param {String} event The frame label event (e.g. "onClose" to "onClose stop")
	*   @param {function} onComplete The function to callback when we're done
	*   @param {function} onCompleteParams Parameters to pass to onComplete function
	*   @param {Number} speed The speed at which to play the animation.
	*	@param {Object} soundData Data about sound to sync the animation to.
	*   @return {AnimatorTimeline} The Timeline object
	*   @private
	*   @static
	*/
	Animator._makeTimeline = function(instance, event, onComplete, onCompleteParams, speed, soundData)
	{
		var timeline = new AnimatorTimeline();
		if(!Animator._canAnimate(instance))//not a movieclip
		{
			return timeline;
		}
		instance.advanceDuringTicks = false;//make sure the movieclip doesn't play outside the control of Animator
		var fps;
		if(!instance.framerate)//make sure the movieclip is framerate independent
		{
			fps = cloudkid.OS.instance.options.fps;
			if(!fps)
				fps = cloudkid.OS.instance.fps;
			if(!fps)
				fps = 15;
			instance.framerate = fps;
		}
		else
			fps = instance.framerate;//we'll want this for some math later
		timeline.instance = instance;
		timeline.event = event;
		timeline.onComplete = onComplete;
		timeline.onCompleteParams = onCompleteParams;
		timeline.speed = speed;
		if(soundData)
		{
			timeline.playSound = true;
			if(typeof soundData == "string")
			{
				timeline.soundStart = 0;
				timeline.soundAlias = soundData;
			}
			else
			{
				timeline.soundStart = soundData.start > 0 ? soundData.start : 0;//seconds
				timeline.soundAlias = soundData.alias;
			}
			timeline.useCaptions = Animator.captions && Animator.captions.hasCaption(timeline.soundAlias);
		}
		
		//go through the list of labels (they are sorted by frame number)
		var labels = instance.getLabels();
		var stopLabel = event + "_stop";
		var loopLabel = event + "_loop";
		for(var i = 0, len = labels.length; i < len; ++i)
		{
			var l = labels[i];
			if(l.label == event)
			{
				timeline.firstFrame = l.position;
			}
			else if(l.label == stopLabel)
			{
				timeline.lastFrame = l.position;
				break;
			}
			else if(l.label == loopLabel)
			{
				timeline.lastFrame = l.position;
				timeline.isLooping = true;
				break;
			}
		}

		timeline.length = timeline.lastFrame - timeline.firstFrame;
		timeline.startTime = timeline.firstFrame / fps;
		timeline.duration = timeline.length / fps;
		
		return timeline;
	};

	/**
	*   Determines if a given instance can be animated by Animator, to allow things that aren't
	*	MovieClips from EaselJS to be animated if they share the same API. Note - 'id' is a property with
	*	a unique value for each createjs.DisplayObject. If a custom object is made that does not inherit from DisplayObject,
	*	it needs to not have an id that is identical to anything from EaselJS.
	*   
	*   @function _canAnimate
	*   @param {easeljs.MovieClip} instance The object to check for animation properties.
	*   @return {Boolean} If the instance can be animated or not.
	*   @private
	*   @static
	*/
	Animator._canAnimate = function(instance)
	{
		if(instance instanceof MovieClip)//all createjs.MovieClips are A-OK
			return true;
		if(instance.framerate !== undefined &&//property - calculate timing
			instance.getLabels !== undefined &&//method - get framelabels
			instance.elapsedTime !== undefined &&//property - set time passed
			instance._tick !== undefined &&//method - update after setting elapsedTime
			instance.gotoAndStop !== undefined &&//method - stop at end of anim
			instance.play !== undefined &&//method - start playing
			instance.id !== undefined)//property - used to avoid duplication of timelines
			return true;
		if(true)
		{
			Debug.error("Attempting to use Animator to play something that is not movieclip compatible: " + instance);
		}
		return false;
	};

	/**
	*   Checks if animation exists
	*   
	*   @function _makeTimeline
	*   @param {easeljs.MovieClip} instance The timeline to check
	*   @param {String} event The frame label event (e.g. "onClose" to "onClose stop")
	*   @public
	*   @static
	*	@return {bool} does this animation exist?
	*/
	Animator.instanceHasAnimation = function(instance, event)
	{
		var labels = instance.getLabels();
		var startFrame = -1, stopFrame = -1;
		var stopLabel = event + "_stop";
		var loopLabel = event + "_loop";
		for(var i = 0, len = labels.length; i < len; ++i)
		{
			var l = labels[i];
			if(l.label == event)
			{
				startFrame = l.position;
			}
			else if(l.label == stopLabel || l.label == loopLabel)
			{
				stopFrame = l.position;
				break;
			}
		}

		return startFrame >= 0 && stopFrame >= 0;
	};
	
	/**
	*   Stop the animation.
	*   
	*   @function stop
	*   @param {createjs.MovieClip} instance The MovieClip to stop the action on
	*   @param {bool} doOnComplete If we are suppose to do the complete callback when stopping (default is false)
	*   @static
	*/
	Animator.stop = function(instance, doOnComplete)
	{
		doOnComplete = doOnComplete || false;
		
		if (!_timelines) return;
		
		if (_timelinesMap[instance.id] === undefined)
		{
			if (true)
			{
				Debug.log("No timeline was found matching the instance id " + instance);
			}
			return;
		}
		var timeline = _timelinesMap[instance.id];
		Animator._remove(timeline, doOnComplete);
	};
	
	/**
	*   Stop all current Animator animations.
	*   This is good for cleaning up all animation, as it doesn't do a callback on any of them.
	*   
	*   @function stopAll
	*   @param {createjs.Container} container Optional - specify a container to stop timelines contained within
	*   @static
	*/
	Animator.stopAll = function(container)
	{
		if (!Animator._hasTimelines()) return;
		
		var timeline;
		var removedTimelines = _timelines.slice();

		for(var i=0; i < removedTimelines.length; i++)
		{
			timeline = removedTimelines[i];
			
			if (!container || container.contains(timeline.instance))
			{
				Animator._remove(timeline, false);
			}
		}
	};
	
	/**
	*   Remove a timeline from the stack
	*   
	*   @function _remove
	*   @param {AnimatorTimeline} timeline
	*   @param {bool} doOnComplete If we do the on complete callback
	*   @private
	*   @static
	*/
	Animator._remove = function(timeline, doOnComplete)
	{
		var index = _removedTimelines.indexOf(timeline);
		if (index >= 0)
		{
			_removedTimelines.splice(index, 1);
		}
		
		index = _timelines.indexOf(timeline);
		
		// We can't remove an animation twice
		if (index < 0) return;
		
		var onComplete = timeline.onComplete;
		var onCompleteParams = timeline.onCompleteParams;
		
		// Stop the animation
		timeline.instance.stop();

		//in most cases, if doOnComplete is true, it's a natural stop and the audio can be allowed to continue
		if(!doOnComplete && timeline.soundInst)
			timeline.soundInst.stop();//stop the sound from playing
		
		// Remove from the stack
		_timelines.splice(index, 1);
		delete _timelinesMap[timeline.instance.id];

		//stop the captions, if relevant
		if (timeline.useCaptions)
		{
			Animator.captions.stop();
		}
		
		// Clear the timeline
		timeline.instance = null;
		timeline.event = null;
		timeline.onComplete = null;
		timeline.onCompleteParams = null;
		
		// Check if we should stop the update
		if (!Animator._hasTimelines()) Animator._stopUpdate();
		
		if (doOnComplete && onComplete)
		{
			onComplete.apply(null, onCompleteParams);
		}
	};
	
	/**
	*   Pause all tweens which have been excuted by Animator.play()
	*   
	*   @function pause
	*   @static
	*/
	Animator.pause = function()
	{
		if (!_timelines) return;
		
		if (_paused) return;
		
		_paused = true;
		
		for(var i = 0; i < _timelines.length; i++)
		{
			_timelines[i].paused = true;
		}
		Animator._stopUpdate();
	};
	
	/**
	*   Resumes all tweens executed by the Animator.play()
	*   
	*   @function resume
	*   @static
	*/
	Animator.resume = function()
	{
		if(!_timelines) return;
		
		if (!_paused) return;
		
		_paused = false;
		
		// Resume playing of all the instances
		for(var i = 0; i < _timelines.length; i++)
		{
			_timelines[i].paused = false;
		}
		if (Animator._hasTimelines()) Animator._startUpdate();
	};
	
	/**
	*   Pauses or unpauses all timelines that are children of the specified DisplayObjectContainer.
	*   
	*   @function pauseInGroup
	*   @param {bool} paused If this should be paused or unpaused
	*   @param {createjs.Container} container The container to stop timelines contained within
	*   @static
	*/
	Animator.pauseInGroup = function(paused, container)
	{
		if (!Animator._hasTimelines() || !container) return;
		
		for(var i=0; i< _timelines.length; i++)
		{
			if (container.contains(_timelines[i].instance))
			{
				_timelines[i].paused = paused;
			}
		}
	};
	
	
	/**
	*   Get the timeline object for an instance
	*   
	*   @function getTimeline
	*   @param {createjs.MovieClip} instance MovieClip 
	*   @return {AnimatorTimeline} The timeline
	*   @static
	*/
	Animator.getTimeline = function(instance)
	{
		if (!Animator._hasTimelines()) return null;
		
		if (_timelinesMap[instance.id] !== undefined)
		{
			return _timelinesMap[instance.id];
		}
		return null;
	};
	
	/**
	*  Whether the Animator class is currently paused.
	*  
	*  @function getPaused
	*  @return {bool} if we're paused or not
	*/
	Animator.getPaused = function()
	{
		return _paused;
	};
	
	/**
	*  Start the updating 
	*  
	*  @function _startUpdate
	*  @private
	*  @static
	*/
	Animator._startUpdate = function()
	{
		if (OS.instance)
			OS.instance.addUpdateCallback("Animator", Animator._update);
	};
	
	/**
	*   Stop the updating
	*   
	*   @function _stopUpdate
	*   @private
	*   @static
	*/
	Animator._stopUpdate = function()
	{
		if (OS.instance)
			OS.instance.removeUpdateCallback("Animator");
	};
	
	/**
	*   The update every frame
	*   
	*   @function
	*   @param {int} elapsed The time in milliseconds since the last frame
	*   @private
	*   @static
	*/
	Animator._update = function(elapsed)
	{
		if(!_timelines) return;
		
		var delta = elapsed * 0.001;//ms -> sec
		
		var t;
		for(var i = _timelines.length - 1; i >= 0; --i)
		{
			t = _timelines[i];
			var instance = t.instance;
			if(t.paused) continue;
			
			if(t.soundInst)
			{
				if(t.soundInst.isValid)
				{
					//convert sound position ms -> sec
					var audioPos = t.soundInst.position * 0.001;
					if(audioPos < 0)
						audioPos = 0;
					t.time = t.soundStart + audioPos;
					
					if (t.useCaptions)
					{
						Animator.captions.seek(t.soundInst.position);
					}
					//if the sound goes beyond the animation, then stop the animation
					//audio animations shouldn't loop, because doing that properly is difficult
					//letting the audio continue should be okay though
					if(t.time >= t.duration)
					{
						instance.gotoAndStop(t.lastFrame);
						_removedTimelines.push(t);
						continue;
					}
				}
				//if sound is no longer valid, stop animation playback immediately
				else
				{
					_removedTimelines.push(t);
					continue;
				}
			}
			else
			{
				t.time += delta * t.speed;
				if(t.time >= t.duration)
				{
					if(t.isLooping)
					{
						t.time -= t.duration;
						if (t.onComplete)
							t.onComplete.apply(null, t.onCompleteParams);
					}
					else
					{
						instance.gotoAndStop(t.lastFrame);
						_removedTimelines.push(t);
						continue;
					}
				}
				if(t.playSound && t.time >= t.soundStart)
				{
					t.time = t.soundStart;
					t.soundInst = Animator.audioLib.play(
						t.soundAlias, 
						onSoundDone.bind(this, t), 
						onSoundStarted.bind(this, t)
					);
					if (t.useCaptions)
					{
						Animator.captions.isSlave = true;
						Animator.captions.run(t.soundAlias);
					}
				}
			}
			instance.elapsedTime = t.startTime + t.time;
			//because the movieclip only checks the elapsed time here (advanceDuringTicks is false), 
			//calling advance() with no parameters is fine
			instance.advance();
		}
		for(i = 0; i < _removedTimelines.length; i++)
		{
			t = _removedTimelines[i];
			Animator._remove(t, true);
		}
	};
	
	/**
	*  The sound has been started
	*  @method onSoundStarted
	*  @private
	*  @param {AnimatorTimeline} timeline
	*/
	var onSoundStarted = function(timeline)
	{
		timeline.playSound = false;
		timeline.soundEnd = timeline.soundStart + timeline.soundInst.length * 0.001;//convert sound length to seconds
	};
	
	/**
	*  The sound is done
	*  @method onSoundDone
	*  @private
	*  @param {AnimatorTimeline} timeline
	*/
	var onSoundDone = function(timeline)
	{
		if(timeline.soundEnd > 0 && timeline.soundEnd > timeline.time)
			timeline.time = timeline.soundEnd;
		timeline.soundInst = null;
	};
	
	/**
	*  Check to see if we have timeline
	*  
	*  @function _hasTimelines
	*  @return {bool} if we have timelines
	*  @private
	*  @static
	*/
	Animator._hasTimelines = function()
	{
		if(!_timelines) return false;
		return _timelines.length > 0;
	};
	
	/**
	*  String representation of this class
	*  
	*  @function toString
	*  @return String
	*  @static
	*/
	Animator.toString = function() 
	{
		return "[Animator version:" + Animator.VERSION + "]";
	};
	
	// Assign to the global namespace
	namespace('cloudkid').Animator = Animator;

}());
/**
*  @module cloudkid
*/
(function(){
	
	"use strict";

	/**
	*   CharacterClip is used by the CharacterController class
	*   
	*   @class CharacterClip
	*   @constructor
	*   @param {String} event Animator event to play
	*   @param {int} loops The number of loops
	*/
	var CharacterClip = function(event, loops)
	{
		this.initialize(event, loops);
	};
	
	var p = CharacterClip.prototype;
	
	/**
	* The event to play
	*
	*@property {String} event
	*/
	p.event = null;
	
	/**
	* The number of times to loop
	* 
	* @property {int} loops
	*/
	p.loops = 0;
	
	/**
	*   Initialiaze this character clip
	*   
	*   @function initialize
	*   @param {String} event The frame label to play using Animator.play
	*   @param {int} loops The number of times to loop, default of 0 plays continuously
	*/
	p.initialize = function(event, loops)
	{
		this.event = event;
		this.loops = loops || 0;
	};
	
	// Assign to the cloudkid namespace
	namespace('cloudkid').CharacterClip = CharacterClip;
}());
/**
*  @module cloudkid
*/
(function(){

	"use strict";

	// Imports
	var Animator = cloudkid.Animator;
	
	/**
	*   Character Controller class is designed to play animated
	*   sequences on the timeline. This is a flexible way to
	*   animate characters on a timeline
	*   
	*   @class CharacterController
	*/
	var CharacterController = function()
	{
		this.initialize();
	};
	
	var p = CharacterController.prototype;
	
	/**
	* The current stack of animations to play
	*
	* @property {Array} _animationStack
	* @private
	*/
	p._animationStack = null;
	
	/**
	* The currently playing animation 
	* 
	* @property {CharacterClip} _currentAnimation
	* @private
	*/
	p._currentAnimation = null;
	
	/**
	* Current number of loops for the current animation
	* 
	* @property {int} _loops
	* @private
	*/
	p._loops = 0;
	
	/**
	* If the current animation choreographies can't be interrupted 
	* 
	* @property {bool} _interruptable
	* @private
	*/
	p._interruptable = true;
	
	/**
	* If frame dropping is allowed for this animation set
	* 
	* @property {bool} _allowFrameDropping
	* @private
	*/
	p._allowFrameDropping = false;
	
	/**
	* The current character
	* 
	* @property {createjs.MovieClip} _character
	* @private
	*/
	p._character = null;
	
	/**
	* Callback function for playing animation 
	* 
	* @property {function} _callback
	* @private
	*/
	p._callback = null;
	
	/** 
	* If this instance has been destroyed
	* 
	* @property {bool} _destroyed
	* @private
	*/
	p._destroyed = false;
	
	/**
	* Initiliazes this Character controller
	* 
	* @function initialize
	*/
	p.initialize = function()
	{
		this._animationStack = [];
	};
	
	/**
	*   Set the current character, setting to null clears character
	*   
	*   @function setCharacter
	*   @param {createjs.MovieClip} character MovieClip
	*/
	p.setCharacter = function(character)
	{
		this.clear();
		this._character = character;
		if (this._character)
		{
			Debug.assert(this._character instanceof createjs.MovieClip, "character must subclass MovieClip");
			this._character.stop();
		}
	};
	
	/**
	*   If we want to play a static frame
	*   
	*   @function gotoFrameAndStop
	*   @param {String} event The frame label to stop on
	*/
	p.gotoFrameAndStop = function(event)
	{
		Debug.assert(this._character, "gotoFrameAndStop() requires a character!");
		Animator.stop(this._character);
		this._animationStack.length = 0;
		this._character.gotoAndStop(event);
	};
	
	/**
	 * Will play a sequence of animations
	 * 
	 * @function playClips
	 * @param {Array} clips an array of CharacterClip objects
	 * @param {function} callback Callback for when the animations are either done, or
	 *             have been interrupted. Will pass true is interrupted,
	 *             false if they completed
	 * @param {bool} interruptable If calling this can interrupt the current animation(s)
	 * @param {bool} cancelPreviousCallback Cancel the callback the last time this was called
	 * @param {bool} allowFrameDropping If frame dropping is allowed for this frame, if the Animator is doing frame drop checks
	 */
	p.playClips = function(clips, callback, interruptable, cancelPreviousCallback, allowFrameDropping)
	{
		callback = callback || null;
		interruptable = interruptable || true;
		cancelPreviousCallback = cancelPreviousCallback || true;
		allowFrameDropping = allowFrameDropping || true;
		
		Debug.assert(this._character, "playClips requires a character!");
		
		if (!this._interruptable) return;
		
		Animator.stop(this._character);
		
		this._interruptable = interruptable;
		
		if (this._callback && !cancelPreviousCallback)
		{
			this._callback(true);
		}
		
		this._callback = callback;
		this._animationStack.length = 0;
		for(var c in clips)
		{
			this._animationStack.push(clips[c]);
		}
		this._allowFrameDropping = allowFrameDropping;
		
		this.startNext();
	};
	
	/**
	*   Start the next animation in the sequence
	*   
	*   @function startNext
	*/
	p.startNext = function()
	{
		this._loops = 0;
		if (this._animationStack.length > 0)
		{
			this._currentAnimation = this._animationStack.shift();
			Animator.play(
				this._character, 
				this._currentAnimation.event, 
				this._animationComplete.bind(this), 
				[this], 
				this._allowFrameDropping
			);	
		}
		else if(this._callback)
		{
			this._interruptable = true;
			var cb = this._callback;
			this._callback = null;
			cb(false);
		}
	};
	
	/**
	*   When the animation has completed playing
	*   
	*   @function _animationComplete
	*   @private
	*/
	p._animationComplete = function()
	{		
		this._loops++;
		
		if(this._currentAnimation.loops === 0 || this._loops < this._currentAnimation.loops)
		{
			Animator.play(
				this._character, 
				this._currentAnimation.event, 
				this._animationComplete.bind(this), 
				null, 
				this._allowFrameDropping
			);
		}
		else if (this._currentAnimation.loops == this._loops)
		{
			this.startNext();
		}
	};
	
	/**
	*   Clear any animations for the current character
	*   
	*   @function clear
	*/
	p.clear = function()
	{
		if (this._character)
		{
			Animator.stop(this._character);
		}
		this._currentAnimation = null;
		this._interruptable = true;
		this._callback = null;
		this._animationStack.length = 0;
		this._loops = 0;
	};
	
	/**
	*  Don't use after this
	*  
	*  @function destroy
	*/
	p.destroy = function()
	{
		if(this._destroyed) return;
		
		this._destroyed = true;
		this.clear();
		this._character = null;
		this._animationStack = null;
	};
	
	// Assign to the cloudkid namespace
	namespace('cloudkid').CharacterController = CharacterController;
}());
(function(undefined) {

	/**
	*  Handles a spritesheet.
	*  @class TextureAtlas
	*  @constructor
	*  @param {Image|HTMLCanvasElement|Array} image The image that all textures pull from.
	*       This can also be an array of images, if the TextureAtlas should be built from several spritesheets.
	*  @param {Object|Array} spritesheetData The JSON object describing the frames in the atlas.
	*       This is expected to fit the JSON Hash format as exported from TexturePacker.
	*       This can also be an array of data objects, if the TextureAtlas should be built from several spritesheets.
	*/
	var TextureAtlas = function(image, spritesheetData)
	{
		/**
		*  The an array of image elements (Image|HTMLCanvasElement) that frames in texture atlas use.
		*  @property {Array} _image
		*  @private
		*/
		if(Array.isArray(image))
		{
			this._images = image;
		}
		else
		{
			this._images = [image];
			spritesheetData = [spritesheetData];
		}

		/**
		*  The dictionary of Textures that this atlas consists of.
		*  @property {Object} frames
		*/
		this.frames = {};

		for(var i = 0; i < this._images.length; ++i)
		{
			image = this._images[i];

			var dataFrames = spritesheetData[i].frames;
			for(var name in dataFrames)
			{
				var data = dataFrames[name];
				var index = name.lastIndexOf(".");
				if(index > 0)
					name = name.substring(0, index);//strip off any ".png" or ".jpg" at the end
				index = name.lastIndexOf("/");
				if(index < 0)
					name = name.substring(index + 1);//strip off any folder structure included in the name
				this.frames[name] = new Texture(image, data);
			}
		}
	};
	
	// Extend Object
	var p = TextureAtlas.prototype = {};

	/**
	*  Handler when the skip button is pressed
	*  @method getFrame
	*  @param {String} name The frame name to get.
	*  @return {cloudkid.TextureAtlas.Texture} The texture by that name, or null if it doesn't exist.
	*/
	p.getFrame = function(name)
	{
		return this.frames[name] || null;
	};

	/**
	*  Get an array of Textures that match a specific name.
	*  @method getFrames
	*  @param {String} name The base name of all frames to look for, like "anim_#" to search for an animation exported
	*         as anim_0001.png (the ".png" is dropped when the TextureAtlas is loaded).
	*  @param {int} numberMin The number to start on while looking for frames. Flash generally starts at 1.
	*  @param {int} numberMax The number to go until while looking for frames. 
	*         If your animation runs from frame 0001 to frame 0014, numberMax would be 14.
	*  @param {int} [maxDigits=4] Maximum number of digits, like 4 for an animation exported as anim_0001.png
	*  @param {Array} [outArray] If already using an array, this can fill it instead of creating a new one.
	*  @return {Array} An collection of cloudkid.TextureAtlas.Textures.
	*/
	p.getFrames = function(name, numberMin, numberMax, maxDigits, outArray)
	{
		if(maxDigits === undefined)
			maxDigits = 4;
		if(maxDigits < 0)
			maxDigits = 0;
		if(!outArray)
			outArray = [];
		//set up strings to add the correct number of zeros ahead of time to avoid creating even more strings.
		var zeros = [];//preceding zeroes array
		var compares = [];//powers of 10 array for determining how many preceding zeroes to use
		var i, c;
		for(i = 1; i < maxDigits; ++i)
		{
			var s = "";
			c = 1;
			for(var j = 0; j < i; ++j)
			{
				s += "0";
				c *= 10;
			}
			zeros.unshift(s);
			compares.push(c);
		}
		var compareLength = compares.length;//the length of the compar

		var prevTex;//the previous Texture, so we can place the same object in multiple times to control animation rate
		for(i = numberMin, len = numberMax; i <= len; ++i)
		{
			var num = null;
			//calculate the number of preceding zeroes needed, then create the full number string.
			for(c = 0; c < compareLength; ++c)
			{
				if(i < compares[c])
				{
					num = zeros[c] + i;
					break;
				}
			}
			if(!num)
				num = i.toString();
			
			//If the texture doesn't exist, use the previous texture - this should allow us to use fewer textures
			//that are in fact the same, if those textures were removed before making the spritesheet
			var texName = name.replace("#", num);
			var tex = this.frames[texName];
			if(tex)
				prevTex = tex;
			if(prevTex)
				outArray.push(prevTex);
		}

		return outArray;
	};

	p.destroy = function()
	{
		this.image = null;
		this.frames = null;
	};

	namespace('cloudkid').TextureAtlas = TextureAtlas;

	/**
	*  A Texture - a specific portion of an image that can then be drawn by a Bitmap.
	*  This class is hidden within TextureAtlas, and can't be manually created.
	*  @class Texture
	*/
	var Texture = function(image, data)
	{
		/**
		*  The image element that this texture references.
		*  @property {Image|HTMLCanvasElement} image
		*/
		this.image = image;
		var f = data.frame;
		/**
		*  The frame rectangle within the image.
		*  @property {createjs.Rectangle} frame
		*/
		this.frame = new createjs.Rectangle(f.x, f.y, f.w, f.h);
		/**
		*  If this texture has been trimmed.
		*  @property {Boolean} trimmed
		*/
		this.trimmed = data.trimmed;
		/**
		*  The offset that the trimmed sprite should be placed at to restore it to the untrimmed position.
		*  @property {createjs.Point} offset
		*/
		this.offset = new createjs.Point(data.spriteSourceSize.x, data.spriteSourceSize.y);
		/**
		*  The width of the untrimmed texture.
		*  @property {Number} width
		*/
		this.width = data.sourceSize.w;
		/**
		*  The height of the untrimmed texture.
		*  @property {Number} height
		*/
		this.height = data.sourceSize.h;
	};
}());
(function(undefined) {

	/**
	*  A class similar to createjs.MovieClip, but made to play animations from a cloudkid.TextureAtlas.
	*  The CreateJS Sprite class requires a spritesheet with equal sized and spaced frames. By using cloudkid.TextureAtlas,
	*  you can use a much smaller spritesheet, sprites on screen with fewer extra transparent pixels, and use the same
	*  API as MovieClip.
	*
	*  See "Export BitmapMovieClip.jsfl" in the library for a script that will export a selected MovieClip in the library
	*  with all of the information (except data.scale) needed to reassemble the BitmapMovieClip.
	*
	*  @class BitmapMovieClip
	*  @extends createjs.Container
	*  @constructor
	*  @param {TextureAtlas} atlas=null The texture atlas to pull frames from.
	*  @param {Object} data=null Initialization data
	*   @param {int} [data.fps] Framerate to play the movieclip at. Omitting this will use the current framerate.
	*   @param {Object} [data.labels] A dictionary of the labels in the movieclip to assist in playing animations.
	*   @param {Object} [data.origin={x:0,y:0}] The origin of the movieclip.
	*   @param {Array} [data.frames] An array of frame sequences to pull from the texture atlas.
	*   @param {String} [data.frames.name] The name to use for the frame sequence. This should include a "#" to be replaced with the image number.
	*   @param {int} [data.frames.min] The first frame number in the frame sequence.
	*   @param {int} [data.frames.max] The last frame number in the frame sequence.
	*   @param {int} [data.frames.digits=4] The maximum number of digits in the names of the frames, e.g. myAnim0001 has 4 digits.
	*   @param {Number} [data.scale=1] The scale at which the art was exported, e.g. a scale of 1.4 means the art was increased
	*          in size to 140% before exporting and should be scaled back down before drawing to the screen.
	*
	*  Format for data:
	*	{
	*		fps:30,
	*		labels:
	*		{
	*			animStart:0,
	*			animStart_loop:15
	*		},
	*		origin:{ x: 20, y:30 },
	*		frames:
	*		[
	*			{
	*				name:"myAnim#",
	*				min:1,
	*				max:20,
	*				digits:4
	*			}
	*		],
	*		scale:1
	*	}
	*
	* The object describes a 30 fps animation that is 20 frames long, and was originally myAnim0001.png->myAnim0020.png,
	* with frame labels on the first and 16th frame. 'digits' is optional, and defaults to 4.
	*/
	var BitmapMovieClip = function(atlas, data)
	{
		createjs.Container.call(this);
		this.mouseChildren = false;//mouse events should reference this, not the child bitmap
		this._bitmap = new createjs.Bitmap();
		this.addChild(this._bitmap);
		if(atlas && data)
			this.init(atlas, data);
	};

	var p = BitmapMovieClip.prototype = new createjs.Container();
	var s = createjs.Container.prototype;

	//==== Public properties =====

	/**
	 * Indicates whether this BitmapMovieClip should loop when it reaches the end of its timeline.
	 * @property loop
	 * @type Boolean
	 * @default true
	 */
	p.loop = true;

	/**
	 * The current frame of the movieclip.
	 * @property currentFrame
	 * @type Number
	 * @default 0
	 * @readonly
	 */
	p.currentFrame = 0;

	/**
	 * If true, the BitmapMovieClip's position will not advance when ticked.
	 * @property paused
	 * @type Boolean
	 * @default false
	 */
	p.paused = false;

	/**
	 * If true, the BitmapMovieClip will advance its timeline during ticks. If false then it must be externally advanced.
	 * @property advanceDuringTicks
	 * @type Boolean
	 * @default true
	 */
	p.advanceDuringTicks = true;

	/**
	 * By default BitmapMovieClip instances advance one frame per tick. Specifying a framerate for the BitmapMovieClip
	 * will cause it to advance based on elapsed time between ticks as appropriate to maintain the target
	 * framerate.
	 *
	 * For example, if a BitmapMovieClip with a framerate of 10 is placed on a Stage being updated at 40fps, then the BitmapMovieClip will
	 * advance roughly one frame every 4 ticks. This will not be exact, because the time between each tick will
	 * vary slightly between frames.
	 *
	 * This feature is dependent on the tick event object (or an object with an appropriate "delta" property) being
	 * passed into {{#crossLink "Stage/update"}}{{/crossLink}}.
	 * @property framerate
	 * @type {Number}
	 * @default 0
	 **/
	Object.defineProperty(p, 'framerate', {
		get: function() {
			return this._framerate;
		},
		set: function(value) {
			if(value > 0)
			{
				this._framerate = value;
				this._duration = value ? this._frames.length / value : 0;
			}
			else
				this._framerate = this._duration = 0;
		}
	});

	/**
	 * When the BitmapMovieClip is framerate independent, this is the time elapsed from frame 0 in seconds.
	 * @property elapsedTime
	 * @type Number
	 * @default 0
	 * @public
	 */
	Object.defineProperty(p, 'elapsedTime', {
		get: function() {
			return this._t;
		},
		set: function(value) {
			this._t = value;
		}
	});

	//==== Private properties =====

	/**
	 * By default BitmapMovieClip instances advance one frame per tick. Specifying a framerate for the BitmapMovieClip
	 * will cause it to advance based on elapsed time between ticks as appropriate to maintain the target
	 * framerate.
	 * 
	 * @property _framerate
	 * @type {Number}
	 * @default 0
	 * @private
	 **/
	p._framerate = 0;

	/**
	 * When the BitmapMovieClip is framerate independent, this is the total time in seconds for the animation.
	 * @property _duration
	 * @type Number
	 * @default 0
	 * @private
	 */
	p._duration = 0;

	/**
	 * When the BitmapMovieClip is framerate independent, this is the time elapsed from frame 0 in seconds.
	 * @property _t
	 * @type Number
	 * @default 0
	 * @private
	 */
	p._t = 0;

	/**
	 * @property _prevPosition
	 * @type Number
	 * @default 0
	 * @private
	 */
	p._prevPosition = 0;

	/**
	 * The Bitmap used to render the current frame of the animation.
	 * @property _bitmap
	 * @type createjs.Bitmap
	 * @private
	 */
	p._bitmap = 0;

	/**
	 * An array of frame labels.
	 * @property _labels
	 * @type Array
	 * @private
	 */
	p._labels = 0;

	/**
	 * An array of textures.
	 * @property _frames
	 * @type Array
	 * @private
	 */
	p._frames = null;

	/**
	 * The current texture.
	 * @property _currentTexture
	 * @type cloudkid.TextureAtlas.Texture
	 * @private
	 */
	p._currentTexture = null;

	/**
	 * The origin point of the BitmapMovieClip.
	 * @property _origin
	 * @type createjs.Point
	 * @private
	 */
	p._origin = null;

	/**
	 * A scale to apply to the images in the BitmapMovieClip
	 * to restore normal size (if spritesheet was exported at a smaller or larger size).
	 * @property _scale
	 * @type Number
	 * @private
	 */
	p._scale = 1;

	//==== Public Methods =====

	/**
	 * Returns true or false indicating whether the display object would be visible if drawn to a canvas.
	 * This does not account for whether it would be visible within the boundaries of the stage.
	 * NOTE: This method is mainly for internal use, though it may be useful for advanced uses.
	 * @method isVisible
	 * @return {Boolean} Boolean indicating whether the display object would be visible if drawn to a canvas
	 **/
	p.isVisible = function() {
		// children are placed in draw, so we can't determine if we have content.
		return !!(this.visible && this.alpha > 0 && this.scaleX !== 0 && this.scaleY !== 0);
	};

	/**
	 * Draws the display object into the specified context ignoring its visible, alpha, shadow, and transform.
	 * Returns true if the draw was handled (useful for overriding functionality).
	 * NOTE: This method is mainly for internal use, though it may be useful for advanced uses.
	 * @method draw
	 * @param {CanvasRenderingContext2D} ctx The canvas 2D context object to draw into.
	 * @param {Boolean} ignoreCache Indicates whether the draw operation should ignore any current cache.
	 * For example, used for drawing the cache (to prevent it from simply drawing an existing cache back
	 * into itself).
	 **/
	p.draw = function(ctx, ignoreCache) {
		// draw to cache first:
		if (this.DisplayObject_draw(ctx, ignoreCache)) { return true; }
		this._updateTimeline();
		s.draw.call(this, ctx, ignoreCache);//Container's call
		return true;
	};

	/**
	 * Sets paused to false.
	 * @method play
	 **/
	p.play = function() {
		this.paused = false;
	};
	
	/**
	 * Sets paused to true.
	 * @method stop
	 **/
	p.stop = function() {
		this.paused = true;
	};
	
	/**
	 * Advances this movie clip to the specified position or label and sets paused to false.
	 * @method gotoAndPlay
	 * @param {String|Number} positionOrLabel The animation name or frame number to go to.
	 **/
	p.gotoAndPlay = function(positionOrLabel) {
		this.paused = false;
		this._goto(positionOrLabel);
	};
	
	/**
	 * Advances this movie clip to the specified position or label and sets paused to true.
	 * @method gotoAndStop
	 * @param {String|Number} positionOrLabel The animation or frame name to go to.
	 **/
	p.gotoAndStop = function(positionOrLabel) {
		this.paused = true;
		this._goto(positionOrLabel);
	};

	/**
	 * Advances the playhead. This occurs automatically each tick by default.
	 * @param [time] {Number} The amount of time in ms to advance by. Only applicable if framerate is set.
	 * @method advance
	*/
	p.advance = function(time) {
		if(!this.paused)
		{
			if(this._framerate > 0)
			{
				if(this.advanceDuringTicks)
					this._t += time * 0.001;//milliseconds -> seconds
				if(this._t > this._duration)
					this._t = this.loop ? this._t - this._duration : this._duration;
				this._prevPosition = Math.floor(this._t * this._framerate);
				if(this._prevPosition >= this._frames.length)
					this._prevPosition = this._frames.length - 1;
			}
			else if(this.advanceDuringTicks)
				this._prevPosition = this._prevPosition + 1;
			this._updateTimeline();
		}
	};
	
	/**
	 * Returns a sorted list of the labels defined on this BitmapMovieClip. Shortcut to TweenJS: Timeline.getLabels();
	 * @method getLabels
	 * @return {Array[Object]} A sorted array of objects with label and position (aka frame) properties.
	 **/
	p.getLabels = function() {
		return this._labels;
	};
	
	/**
	 * Returns the name of the label on or immediately before the current frame. See TweenJS: Timeline.getCurrentLabel()
	 * for more information.
	 * @method getCurrentLabel
	 * @return {String} The name of the current label or null if there is no label.
	 **/
	p.getCurrentLabel = function() {
		var labels = this._labels;
		var current = null;
		for(var i = 0, len = labels.length; i < len; ++i)
		{
			if(labels[i].position <= this.currentFrame)
				current = labels[i].label;
			else
				break;
		}
		return current;
	};

	/**
	 * Returns the name of the label on or immediately before the current frame. See TweenJS: Timeline.getCurrentLabel()
	 * for more information.
	 * @method init
	 * @param {TextureAtlas} atlas The texture atlas to pull frames from.
	 * @param {Object} data Initialization data
	 *  @param {int} [data.fps] Framerate to play the movieclip at. Omitting this will use the current framerate.
	 *  @param {Object} [data.labels] A dictionary of the labels in the movieclip to assist in playing animations.
	 *  @param {Object} [data.origin={x:0,y:0}] The origin of the movieclip.
	 *  @param {Array} [data.frames] An array of frame sequences to pull from the texture atlas.
	 *  @param {String} [data.frames.name] The name to use for the frame sequence. This should include a "#" to be replaced with the image number.
	 *  @param {int} [data.frames.min] The first frame number in the frame sequence.
	 *  @param {int} [data.frames.max] The last frame number in the frame sequence.
	 *  @param {int} [data.frames.digits=4] The maximum number of digits in the names of the frames, e.g. myAnim0001 has 4 digits.
	 *   @param {Number} [data.scale=1] The scale at which the art was exported, e.g. a scale of 1.4 means the art was increased
	 *          in size to 140% before exporting and should be scaled back down before drawing to the screen.
	 *
	 *  Format for data:
	 *	{
	 *		fps:30,
	 *		labels:
	 *		{
	 *			animStart:0,
	 *			animStart_loop:15
	 *		},
	 *		origin:{ x: 20, y:30 },
	 *		frames:
	 *		[
	 *			{
	 *				name:"myAnim#",
	 *				min:1,
	 *				max:20,
	 *				digits:4
	 *			}
	 *		]
	 *	}
	 *
	 * The object describes a 30 fps animation that is 20 frames long, and was originally myAnim0001.png->myAnim0020.png,
	 * with frame labels on the first and 16th frame. 'digits' is optional, and defaults to 4.
	 **/
	p.init = function(atlas, data)
	{
		//collect the frame labels
		var labels = this._labels = [];
		if(data.labels)
		{
			for(var name in data.labels)
			{
				labels.push({label:name, position: data.labels[name]});
			}
			labels.sort(labelSorter);
		}
		//collect the frames
		this._frames = [];
		for(var i = 0; i < data.frames.length; ++i)
		{
			var frameSet = data.frames[i];
			atlas.getFrames(frameSet.name, frameSet.min, frameSet.max, frameSet.digits, this._frames);
		}
		//set up the framerate
		if(data.fps)
			this.framerate = data.fps;
		else if(this._framerate)
			this.framerate = this._framerate;
		if(data.scale && data.scale > 0)
			this._scale = 1 / data.scale;
		else
			this._scale = 1;
		this._bitmap.scaleX = this._bitmap.scaleY = this._scale;
		if(data.origin)
			this._origin = new createjs.Point(data.origin.x * this._scale, data.origin.y * this._scale);
		else
			this._origin = new createjs.Point();
	};

	function labelSorter(a, b)
	{
		return a.position - b.position;
	}

	/**
	*	Copies the labels, textures, origin, and framerate from another BitmapMovieClip.
	*	The labels and textures are copied by reference, instead of a deep copy.
	*	@method copyFrom
	*	@param {BitmapMovieClip} other The movieclip to copy data from.
	*/
	p.copyFrom = function(other)
	{
		this._frames = other._frames;
		this._labels = other._labels;
		this._origin = other._origin;
		this._framerate = other._framerate;
		this._duration = other._duration;
		this._scale = other._scale;
		this._bitmap.scaleX = this._bitmap.scaleY = this._scale;
	};

	/**
	*	Destroys the BitmapMovieClip, removing all children and nulling all reference variables.
	*	@method destroy
	*/
	p.destroy = function()
	{
		this.removeAllChildren();
		this._bitmap = null;
		this._frames = null;
		this._origin = null;
	};

	//===== Private Methods =====

	/**
	 * @method _tick
	 * @param {Object} props Properties to copy to the DisplayObject {{#crossLink "DisplayObject/tick"}}{{/crossLink}} event object.
	 * function.
	 * @protected
	 **/
	p._tick = function(props) {
		this.advance(props&&props.delta);
		s._tick.call(this, props);
	};
	
	/**
	 * @method _goto
	 * @param {String|Number} positionOrLabel The animation name or frame number to go to.
	 * @protected
	 **/
	p._goto = function(positionOrLabel) {
		var pos = null;
		if(typeof positionOrLabel == "string")
		{
			var labels = this._labels;
			for(var i = 0, len = labels.length; i < len; ++i)
			{
				if(labels[i].label == positionOrLabel)
				{
					pos = labels[i].position;
					break;
				}
			}
		}
		else
			pos = positionOrLabel;
		if (pos === null) { return; }
		this._prevPosition = pos;
		if(this._framerate > 0)
			this._t = pos / this._framerate;
		else
			this._t = 0;
		this._updateTimeline();
	};

	/**
	 * @method _updateTimeline
	 * @protected
	 **/
	p._updateTimeline = function() {
		if(this._prevPosition < 0)
			this._prevPosition = 0;
		else if(this._prevPosition >= this._frames.length)
			this._prevPosition = this._frames.length - 1;
		this.currentFrame = this._prevPosition;
		if(this._currentTexture != this._frames[this.currentFrame])
		{
			var tex = this._currentTexture = this._frames[this.currentFrame];
			this._bitmap.image = tex.image;
			this._bitmap.sourceRect = tex.frame;
			this._bitmap.x = -this._origin.x + tex.offset.x * this._bitmap.scaleX;
			this._bitmap.y = -this._origin.y + tex.offset.y * this._bitmap.scaleY;
		}
	};
	
	/**
	 * @method _reset
	 * @private
	 **/
	p._reset = function() {
		this._prevPosition = 0;
		this._t = 0;
		this.currentFrame = 0;
	};

	namespace('cloudkid').BitmapMovieClip = BitmapMovieClip;
}());
