(function() {
	
	// Imports
	var OS = cloudkid.OS,
		Application = cloudkid.Application,
		Animator = cloudkid.Animator,
		TaskManager = cloudkid.TaskManager,
		ListTask = cloudkid.ListTask,
		Touch = createjs.Touch,
		Audio = cloudkid.Audio;
	
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
		
		if (!Touch.isSupported())
		{
			stage.enableMouseOver();
		}
		Audio.init("sounds/pizzaplaceaudio.json", onReady);
		Animator.audioLib = Audio.instance;

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
	}

	function onReady()
	{
		if (Touch.isSupported())
		{
			$(document).click(onClick);
		}
		else
		{
			onClick();
		}
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
		Audio.instance.load(audioLoaded);
	}

	function audioLoaded()
	{
		isLoading = false;
		isLoaded = true;
		anim = new lib.PizzaPlaceIntro();
		anim.enableFramerateIndependence(15);
		anim.id = "intro";
		stage.addChildAt(anim, 0);
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
	}
	
	namespace('cloudkid').AudioEaselJS = AudioEaselJS;
}());