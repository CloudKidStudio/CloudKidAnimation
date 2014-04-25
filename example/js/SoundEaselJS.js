(function() {
	
	// Imports
	var OS = cloudkid.OS,
		Application = cloudkid.Application,
		Animator = cloudkid.Animator,
		Touch = createjs.Touch,
		FlashPlugin = createjs.FlashPlugin,
		TaskManager = cloudkid.TaskManager,
		ListTask = cloudkid.ListTask,
		Sound = cloudkid.Sound,
		SoundJS = createjs.Sound,
		WebAudioPlugin = createjs.WebAudioPlugin;
	
	var SoundEaselJS = function()
	{
		this.initialize();
	}
	
	// Extend the createjs container
	var p = SoundEaselJS.prototype = new Application();
	
	// The name of this app
	p.name = "AnimationTest-Souns-EaselJS";
	
	// Private stage variable
	var stage;

	var anim = null;
	
	/**
	* @protected
	*/
	p.init = function()
	{	
		stage = OS.instance.stage;
		
		if (!Touch.isSupported())
		{
			stage.enableMouseOver();
		}
		//set up sound
		FlashPlugin.BASE_PATH = "sounds/";

		SoundJS.registerPlugins([WebAudioPlugin, FlashPlugin]);
		var soundConfig = {
			"context":"sfx",
			"path":"sounds/",
			"soundManifest":
			[
				{"id":"Pizza_Intro_Sound", "src":"Pizza_Intro_Sound"}
			]
		};
		var supportedSound;

		if (SoundJS.getCapability("ogg"))
		{
			this.supportedSound = supportedSound = ".ogg";
		}
		else if(SoundJS.activePlugin instanceof FlashPlugin || SoundJS.getCapability("mp3"))
		{
			this.supportedSound = supportedSound = ".mp3";
		}
		
		Sound.init(supportedSound, soundConfig);
		Animator.audioLib = Sound.instance;

		var manifest = [
			{src:"images/PizzaPlace_IntroBG.jpg", id:"PizzaPlace_IntroBG"},
			{src:"images/Peg_FR_Hair_Back_Left.png", id:"Peg_FR_Hair_Back_Left"},
			{src:"images/Peg_FR_Hair_Back_Right.png", id:"Peg_FR_Hair_Back_Right"},
			{src:"images/Peg_FR_Head.png", id:"Peg_FR_Head"}
		];

		TaskManager.process(
			[new ListTask('manifests', manifest, onManifestLoaded)], 
			loadTasksComplete
		);
	}

	function onManifestLoaded(results)
	{
		for(var id in results)
		{
			images[id] = results[id].content;
		}
	}

	function loadTasksComplete()
	{
		stage.addEventListener("click", onClick);
		anim = new lib.PizzaPlaceIntro();
		anim.id = "intro";
		anim.enableFramerateIndependence(15);
		stage.addChildAt(anim, 0);
		playAnim();
	}

	function onClick()
	{
		playAnim();
	}

	function playAnim()
	{
		Animator.play(anim, "intro", {
			soundData : {alias:"Pizza_Intro_Sound", start:0.266}
		});
	}
	
	/**
	*  Destroy this app, don't use after this
	*/
	p.destroy = function()
	{
		this.removeAllChildren();
		stage = null;
		currentShape = null;
		if (SoundJS.activePlugin instanceof FlashPlugin)
			$("#SoundJSFlashContainer").remove();
	}
	
	namespace('cloudkid').SoundEaselJS = SoundEaselJS;
}());