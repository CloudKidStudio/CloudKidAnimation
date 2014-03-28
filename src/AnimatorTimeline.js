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
			{
				this.instance.stop();
				if(this.soundInst)
					this.soundInst.pause();
			}
			else
			{
				this.instance.play();
				if(this.soundInst)
					this.soundInst.unpause();
			}
		}
	};

	/**
	* The animation startTime in seconds on the movieclip's timeline.
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
	this.time = 0;
	/**
	* Sound alias to sync to during the animation.
	* @property {String} soundAlias
	* @public
	*/
	this.soundAlias = null;
	/**
	* A sound instance object from cloudkid.Sound or cloudkid.Audio, used for tracking sound position.
	* @property {Object} soundInst
	* @public
	*/
	this.soundInst = null;
	/**
	* If the timeline will, but has yet to play a sound.
	* @property {bool} playSound
	* @public
	*/
	this.playSound = false;
	/**
	* The time (seconds) into the animation that the sound starts.
	* @property {Number} soundStart
	* @public
	*/
	this.soundStart = 0;
	/**
	* The time (seconds) into the animation that the sound ends
	* @property {Number} soundEnd
	* @public
	*/
	this.soundEnd = 0;
	
	// Assign to the name space
	namespace('cloudkid').AnimatorTimeline = AnimatorTimeline;
	
}());