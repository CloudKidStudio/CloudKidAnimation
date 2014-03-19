(function(){
	
	/**
	*   Animator Timeline is a class designed to provide
	*   base animation functionality
	*   
	*   @class cloudkid.AnimatorTimeline
	*   @constructor
	*   @author Matt Moore
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
	* @property {cloudkid.AnimatorTimeline} instance
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
	* The time passed in milliseconds, used to calculate frame dropping, if needed
	* 
	* @property {int} timePassed
	*/
	p.timePassed = 0;
	
	/**
	* The actual frame started on, if the animation started on a different frame for some reason 
	* 
	* @property {int} realStartFrame
	*/
	p.realStartFrame = 0;
	
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
	* If this animation is valid for frame dropping - flash will already do it because of audio, etc
	* 
	* @property {bool} dropFrames
	*/
	p.dropFrames = false;
	
	/**
	* If the timeline is paused 
	* 
	* @property {bool} _isPaused
	* @private
	*/
	p._isPaused = false;
	
	/**
	* If this timeline is paused
	* 
	* @function getPaused
	* @return {bool} Whether the timeline is paused
	*/
	p.getPaused = function()
	{
		return this._isPaused;
	};
	
	/**
	* Set is paused
	* 
	* @function setPaused
	* @param {bool} pause Whether to pause or unPause
	*/
	p.setPaused = function(pause)
	{
		this._isPaused = pause;
		if(this.instance)
		{
			if(pause)
				this.instance.stop();
			else
				this.instance.play();
		}
	};
	
	// Assign to the name space
	namespace('cloudkid').AnimatorTimeline = AnimatorTimeline;
	
}());
(function(undefined){
	
	// Imports
	var OS = cloudkid.OS,
		AnimatorTimeline = cloudkid.AnimatorTimeline,
		MovieClip = createjs.MovieClip;
	
	/**
	*   Animator is a static class designed to provided
	*   base animation functionality, using frame labels of MovieClips
	*
	*   @class cloudkid.Animator
	*   @static
	*   @author Matt Moore
	*/
	var Animator = function(){};
	
	/**
	* The current version of the Animator class 
	* 
	* @property {String} VERSION
	* @static
	*/
	Animator.VERSION = "${version}";
	
	/**
	* If we fire debug statements 
	* 
	* @property {bool} debug
	*/
	Animator.debug = false;
	
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
	* if the animator should use magic frame dropping technology
	* 
	* @property {bool} useFrameDropping
	* @static
	*/
	Animator.useFrameDropping = false;
	
	/**
	*	Sets the variables of the Animator to their defaults. Used when __timelines is null,
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
		Animator.useFrameDropping = false;
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
	*   @param {cloudkid.AnimatorTimeline} instance The timeline to animate
	*   @param {String} event The frame label event (e.g. "onClose" to "onClose stop")
	*   @param {function} onComplete The function to callback when we're done
	*   @param {function} onCompleteParams Parameters to pass to onComplete function
	*   @param {bool} dropFrames If Animator should check this for frame dropping, if frame dropping is allowed
	*   @param {int} frameOffset The number of frames into the animation to start
	*   @param {bool} doCancelledCallback Should an overridden animation's callback function still run?
	*   @return {cloudkid.AnimatorTimeline} The Timeline object
	*   @static
	*/
	Animator.play = function(instance, event, onComplete, onCompleteParams, dropFrames, frameOffset, doCancelledCallback)
	{
		onComplete = onComplete || null;
		onCompleteParams = onCompleteParams || null;
		dropFrames = dropFrames || true;
		frameOffset = frameOffset || 0;
		doCancelledCallback = doCancelledCallback || false;
		
		if (!_timelines) 
			Animator.init();
		
		if (_timelinesMap[instance.id] !== undefined)
		{
			Animator.stop(instance, doCancelledCallback);
		}
				
		var timeline = Animator._makeTimeline(instance, event, onComplete, onCompleteParams, dropFrames);
		
		if (timeline.firstFrame > -1 && timeline.lastFrame > -1)//if the animation is present and complete
		{
			timeline.realStartFrame = timeline.firstFrame + frameOffset;
			
			instance.gotoAndPlay(timeline.realStartFrame);
			
			// Before we add the timeline, we should check to see
			// if there are no timelines, then start the enter frame
			// updating
			if (!Animator._hasTimelines()) Animator._startUpdate();
			
			_timelines.push(timeline);
			_timelinesMap[instance.id] = timeline;
			
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
	*   @param {cloudkid.AnimatorTimeline} instance The timeline to animate
	*   @param {String} event The frame label event (e.g. "onClose" to "onClose_stop")
	*   @param {function} onComplete The function to callback when we're done
	*   @param {function} onCompleteParams Parameters to pass to onComplete function
	*   @param {bool} dropFrames If Animator should check this for frame dropping, if frame dropping is allowed
	*   @return {cloudkid.AnimatorTimeline} The Timeline object
	*   @static
	*/
	Animator.playAtRandomFrame = function(instance, event, onComplete, onCompleteParams, dropFrames)
	{
		onComplete = onComplete || null;
		onCompleteParams = onCompleteParams || null;
		dropFrames = dropFrames || true;
				
		if (!_timelines) 
			Animator.init();
		
		if (_timelinesMap[instance.id] !== undefined)
		{
			Animator.stop(instance, false);
		}
		
		var timeline = Animator._makeTimeline(instance, event, onComplete, onCompleteParams, dropFrames);
		
		if (timeline.firstFrame > 0 && timeline.lastFrame > 0)//if the animation is present and complete
		{
			timeline.realStartFrame = Math.random() * (timeline.lastFrame - timeline.firstFrame) + timeline.firstFrame;
			
			instance.gotoAndPlay(timeline.realStartFrame);
			
			// Before we add the timeline, we should check to see
			// if there are no timelines, then start the enter frame
			// updating
			if (!Animator._hasTimelines()) Animator._startUpdate();
			
			_timelines.push(timeline);
			_timelinesMap[instance.id] = timeline;
			
			return timeline;
		}
		
		if (Animator.debug)
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
	*   Creates the AnimatorTimeline for a given animation
	*   
	*   @function _makeTimeline
	*   @param {cloudkid.AnimatorTimeline} instance The timeline to animate
	*   @param {String} event The frame label event (e.g. "onClose" to "onClose stop")
	*   @param {function} onComplete The function to callback when we're done
	*   @param {function} onCompleteParams Parameters to pass to onComplete function
	*   @param {bool} dropFrames If Animator should check this for frame dropping, if frame dropping is allowed
	*   @return {cloudkid.AnimatorTimeline} The Timeline object
	*   @private
	*   @static
	*/
	Animator._makeTimeline = function(instance, event, onComplete, onCompleteParams, dropFrames)
	{
		var timeline = new AnimatorTimeline();
		if(instance instanceof MovieClip === false)//not a movieclip
		{
			return timeline;
		}
		timeline.instance = instance;
		timeline.event = event;
		timeline.onComplete = onComplete;
		timeline.onCompleteParams = onCompleteParams;
		timeline.dropFrames = dropFrames;
				
		var startTime = instance.timeline.resolve(event); 
		var stopTime = instance.timeline.resolve(event + "_stop");
		var stopLoopTime = instance.timeline.resolve(event + "_loop");

		if (startTime !== undefined)
		{
			timeline.firstFrame = timeline.realStartFrame = startTime;
		}
		if (stopTime !== undefined)
		{
			timeline.lastFrame = stopTime;
		}
		else if (stopLoopTime !== undefined)
		{
			timeline.lastFrame = stopLoopTime;
			timeline.isLooping = true;
		}
		timeline.length = timeline.lastFrame - timeline.firstFrame;
		
		return timeline;
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
	*   @param {cloudkid.AnimatorTimeline} timeline
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
		
		// Remove from the stack
		_timelines.splice(index, 1);
		delete _timelinesMap[timeline.instance.id];
		
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
			_timelines[i].setPaused(true);
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
			_timelines[i].setPaused(false);
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
				_timelines[i].setPaused(paused);
			}
		}
	};
	
	
	/**
	*   Get the timeline object for an instance
	*   
	*   @function getTimeline
	*   @param {createjs.MovieClip} instance MovieClip 
	*   @return {cloudkid.AnimatorTimeline} The timeline
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
		
		/** The expected frame that a movieclip should be on when dropping frames. */
		var expected = 0;//used when dropping frames
		/** The framerate / 1000, for calculations (0.030 for 30fps) */
		var frameRate = 0;
		/** The expected length of a frame in milliseconds, to weed out wierd frames that are too short */
		var expectedFrameLength = 0;
		
		if(Animator.useFrameDropping)
		{
			frameRate = OS.instance.fps;
			expectedFrameLength = 1000 / frameRate;
			frameRate *= 0.001;
		}
		
		var timeline;
		var instance;
		var currentFrame;
		
		for (var i = 0; i < _timelines.length; i++)
		{
			timeline = _timelines[i];
			
			if(timeline.getPaused()) continue;
			
			instance = timeline.instance;
			currentFrame = instance.timeline.position || 0;
			
			if (currentFrame >= timeline.lastFrame || currentFrame < timeline.firstFrame || timeline.isLastFrame)
			{
				if(currentFrame == timeline.lastFrame && !timeline.isLastFrame)
				{
					timeline.isLastFrame = true;
					if(Animator.useFrameDropping && timeline.dropFrames)
					{
						if(elapsed < expectedFrameLength)
							timeline.timePassed += expectedFrameLength;
						else
							timeline.timePassed += elapsed;
					}
					instance.stop();
					continue;
				}
				if(timeline.isLooping)
				{
					if(timeline.isLastFrame)
					{
						timeline.isLastFrame = false;
					}
					
					if(Animator.useFrameDropping && timeline.dropFrames)
					{
						if(currentFrame == 1 && timeline.firstFrame > 1)
						{
							instance.gotoAndPlay(timeline.firstFrame);
							timeline.timePassed = 0;
						}
						else
						{
							if(elapsed < expectedFrameLength)
								timeline.timePassed += expectedFrameLength;
							else
								timeline.timePassed += elapsed;
							
							expected = Math.round(timeline.timePassed * frameRate) + timeline.realStartFrame;
							expected -= timeline.firstFrame;
							expected = expected % timeline.length + timeline.firstFrame;
							timeline.timePassed = Math.round((expected - timeline.firstFrame) / frameRate);
							timeline.realStartFrame = timeline.firstFrame;
							instance.gotoAndPlay(expected);
						}
					}
					else
						instance.gotoAndPlay(timeline.firstFrame);
					
					if (true)
					{
						Debug.log("animation ended - " + timeline.event);
					}
					if (timeline.onComplete)
					{
						timeline.onComplete.apply(null, timeline.onCompleteParams);
					}
				}
				else
				{
					instance.gotoAndStop(timeline.lastFrame);
					_removedTimelines.push(timeline);
				}
			}
			//try to drop frames to keep up, timewise - may look bad, but shouldn't result in animations interfering with timing
			else if(Animator.useFrameDropping && timeline.dropFrames)
			{
				if(elapsed < expectedFrameLength)
					timeline.timePassed += expectedFrameLength;
				else
					timeline.timePassed += elapsed;
				expected = Math.round(timeline.timePassed * frameRate) + timeline.realStartFrame;
					
				//if we are behind
				if(currentFrame < expected)
				{
					if(expected >= timeline.lastFrame)
					{
						if(expected == timeline.lastFrame)
						{
							timeline.isLastFrame = true;
							instance.gotoAndStop(expected);
							continue;
						}
						if(timeline.isLooping)
						{
							expected -= timeline.firstFrame;
							expected = expected % timeline.length + timeline.firstFrame;
							instance.gotoAndPlay(expected);
							timeline.timePassed = Math.round((expected - timeline.firstFrame) / frameRate);
							timeline.realStartFrame = timeline.firstFrame;

							if (timeline.onComplete)
							{
								timeline.onComplete.apply(null, timeline.onCompleteParams);
							}
						}
						else
						{
							//make sure it is on the last frame before we stop it
							instance.gotoAndStop(timeline.lastFrame);
							_removedTimelines.push(timeline);
						}
					}
					else//otherwise, just skip ahead as needed
					{
						instance.gotoAndPlay(expected);
					}
				}
			}
		}
		for(i = 0; i < _removedTimelines.length; i++)
		{
			timeline = _removedTimelines[i];
			Animator._remove(timeline, true);
		}
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
(function(){
	
	/**
	*   CharacterClip is used by the CharacterController class
	*   
	*   @class cloudkid.CharacterClip
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
(function(){
	
	// Imports
	var Animator = cloudkid.Animator;
	
	/**
	*   Character Controller class is designed to play animated
	*   sequences on the timeline. This is a flexible way to
	*   animate characters on a timeline
	*   
	*   @class cloudkid.CharacterController
	*   @constructor
	*   @author Matt Moore
	*/
	var CharacterController = function()
	{
		this.initialize();
	};
	
	var p = CharacterController.prototype;
	
	/** The current stack of animations to play */
	p_animationStack = null;
	
	/**
	* The currently playing animation 
	* 
	* @property {cloudkid.CharacterClip} _currentAnimation
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
	 * @param {bool} allowFrameDropping If frame dropping is allowed for this frame, if the cloudkid.Animator is doing frame drop checks
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
				[], 
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
