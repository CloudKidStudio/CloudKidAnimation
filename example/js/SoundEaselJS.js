(function() {
	
	// Imports
	var OS = cloudkid.OS,
		Application = cloudkid.Application,
		Animator = cloudkid.Animator;
	
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
		
		if (!createjs.Touch.isSupported())
		{
			stage.enableMouseOver();
		}
		//set up sound
		createjs.FlashPlugin.BASE_PATH = "sounds/";
		createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.FlashPlugin]);
		var soundConfig = {
			"context":"sfx",
			"path":"sounds/",
			"soundManifest":
			[
				{"id":"Pizza_Intro_Sound", "src":"Pizza_Intro_Sound"}
			]
		};
		var supportedSound;
		if(createjs.Sound.getCapability("ogg"))
			this.supportedSound = supportedSound = ".ogg";
		else if(createjs.Sound.activePlugin instanceof createjs.FlashPlugin || createjs.Sound.getCapability("mp3"))
			this.supportedSound = supportedSound = ".mp3";

		cloudkid.Sound.init(supportedSound, soundConfig);
		cloudkid.Animator.audioLib = cloudkid.Sound.instance;

		var manifest = [
			{src:"images/PizzaPlace_IntroBG.jpg", id:"PizzaPlace_IntroBG"},
			{src:"images/Peg_FR_Hair_Back_Left.png", id:"Peg_FR_Hair_Back_Left"},
			{src:"images/Peg_FR_Hair_Back_Right.png", id:"Peg_FR_Hair_Back_Right"},
			{src:"images/Peg_FR_Head.png", id:"Peg_FR_Head"}
		];
		var tasks = 
		[
			new cloudkid.ListTask('manifests', manifest, onManifestLoaded)
		];
		var taskManager = new cloudkid.TaskManager(tasks);
		taskManager.addEventListener(
			cloudkid.TaskManager.ALL_TASKS_DONE, 
			loadTasksComplete
		);
		taskManager.startAll();
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
		cloudkid.Animator.play(anim, "intro", null, null, null, null, {alias:"Pizza_Intro_Sound", start:0.266});
	}
	
	/**
	*  Destroy this app, don't use after this
	*/
	p.destroy = function()
	{
		this.removeAllChildren();
		stage = null;
		currentShape = null;
		if(createjs.Sound.activePlugin instanceof createjs.FlashPlugin)
			$("#SoundJSFlashContainer").remove();
	}
	
	namespace('cloudkid').SoundEaselJS = SoundEaselJS;
}());