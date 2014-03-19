(function() {
	
	// Imports
	var OS = cloudkid.OS,
		Application = cloudkid.Application,
		CharacterController = cloudkid.CharacterController,
		CharacterClip = cloudkid.CharacterClip,
		Chick = lib.Chick,
		DOMElement = createjs.DOMElement,
		Animator = cloudkid.Animator;
	
	var AnimationApp = function()
	{
		this.initialize();
	}
	
	// Extend the createjs container
	var p = AnimationApp.prototype = new Application();
	
	// The name of this app
	p.name = "AnimationApp";
	
	// Private stage variable
	var stage;
	
	// The animation clip	
	var chick = null;
	
	// The character controller
	var controller = null;
	
	// The initial size of the chick animation
	var chickSize = {width:120, height:220};
	
	// The animation clips
	var upClip = null;
	var downClip = null;
	
	// THe DOM object of the ui
	var ui = null;
	
	/**
	* @protected
	*/
	p.init = function()
	{	
		stage = OS.instance.stage;
		
		if (!createjs.Touch.isSupported())
		{
			stage.enableMouseOver();
		}
		
		// Grab the chick from the library
		chick = new Chick;
		chick.stop();
		chick.name = "Chick";
		this.addChild(chick);	
		
		// center
		chick.x = (stage.canvas.width - chickSize.width) * 0.75;
		chick.y = (stage.canvas.height - chickSize.height) / 2;
		
		// Create the character controller
		controller = new CharacterController;
		controller.setCharacter(chick);
		
		upClip = new CharacterClip("up", 1);
		downClip = new CharacterClip("down", 1);
		
		// Create the DOM element for the ui
		ui = new DOMElement($("#ui").get(0));
		this.addChild(ui);
		
		Animator.useFrameDropping = true;
		
		$("#ui").show();
		$("#ui a").click(function(e){
			e.preventDefault();
			var action = $(this).attr('data-action');
			Debug.log("Button action : " + action);
			switch(action)
			{
				case "up" : controller.playClips([upClip]); break;
				case "down" : controller.playClips([downClip]); break;
				case "upDown" : controller.playClips([upClip, downClip]); break;
				case "clear" : controller.clear(); chick.gotoAndStop(0); break;
				case "loop" : {
					var loop = function(){controller.playClips([upClip, downClip], loop);}
					loop();
					break;
				}
			}
		});
	}
	
	/**
	*  Destroy this app, don't use after this
	*/
	p.destroy = function()
	{
		ui = null;
		
		$("#ui").hide();
		$("#ui a").unbind("click");
		
		if (controller)
			controller.destroy();
		controller = null;	
		
		upClip = null;
		downClip = null;
		
		this.removeAllChildren();
		stage = null;
		currentShape = null;
	}
	
	namespace('cloudkid').AnimationApp = AnimationApp;
}());