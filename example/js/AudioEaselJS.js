(function() {
	
	// Imports
	var OS = cloudkid.OS,
		Application = cloudkid.Application,
		CharacterController = cloudkid.CharacterController,
		CharacterClip = cloudkid.CharacterClip,
		Chick = lib.Chick,
		DOMElement = createjs.DOMElement,
		Animator = cloudkid.Animator;
	
	var AudioEaselJS = function()
	{
		this.initialize();
	}
	
	// Extend the createjs container
	var p = AudioEaselJS.prototype = new Application();
	
	// The name of this app
	p.name = "AnimationTest-Audio-EaselJS";
	
	// Private stage variable
	var stage;

	var isLoaded = false;
	var isLoading = false;

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
		cloudkid.Audio.init("sounds/pizzaplaceaudio.json", onReady);
		cloudkid.Animator.audioLib = cloudkid.Audio.instance;

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
	}

	function onReady()
	{
		stage.addEventListener("click", onClick);
	}

	function onClick()
	{
		if(!isLoading && !isLoaded)
			startLoading();
		else if(isLoaded)
			playAnim();
	}

	function startLoading()
	{
		isLoading = true;
		cloudkid.Audio.instance.load(audioLoaded);
	}

	function audioLoaded()
	{
		isLoading = false;
		isLoaded = true;
		anim = new lib.PizzaPlaceIntro();
		anim.id = "intro";
		anim.enableFramerateIndependence(15);
		stage.addChildAt(anim, 0);
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
	}
	
	namespace('cloudkid').AudioEaselJS = AudioEaselJS;
}());