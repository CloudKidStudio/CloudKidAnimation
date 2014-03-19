/**
*  Static class for namespacing objects and adding
*  classes to it.
*  @class namespace
*  @static
*/
(function(global){
	
	// The namespace function already exists
	if ("namespace" in global) return;
	
	/**
	*  Create the namespace and assing to the window
	*
	*  @example
		var SpriteUtils = function(){};
		namespace('cloudkid.utils').SpriteUtils = SpriteUtils;
	*
	*  @constructor
	*  @method namespace
	*  @param {string} namespaceString Name space, for instance 'cloudkid.utils'
	*  @return {object} The namespace object attached to the current window
	*/
	var namespace = function(namespaceString) {
		var parts = namespaceString.split('.'),
			parent = window,
			currentPart = '';

		for(var i = 0, length = parts.length; i < length; i++)
		{
			currentPart = parts[i];
			parent[currentPart] = parent[currentPart] || {};
			parent = parent[currentPart];
		}
		return parent;
	};
	
	// Assign to the global namespace
	global.namespace = namespace;
	
}(window));

(function(global, undefined){
	
	/**
	*  A static closure to provide easy access to the console
	*  without having errors if the console doesn't exist
	*  to use call: Debug.log('Your log here')
	*  
	*  @class Debug
	*  @static
	*/
	var Debug = function(){};	
	
	/**
	*  If we have a console
	*
	*  @private
	*  @property {bool} hasConsole
	*/
	var hasConsole = (global.console !== undefined);
	
	/** 
	* The most general default debug level
	* @static
	* @final
	* @property {int} GENERAL
	*/
	Debug.GENERAL = 0;
	
	/** 
	* Log level for debug messages
	* @static
	* @final
	* @property {int} DEBUG
	*/
	Debug.DEBUG = 1;
	
	/** 
	* Log level for debug messages
	* @static
	* @final
	* @property {int} INFO
	*/
	Debug.INFO = 2;
	
	/** 
	* Log level for warning messages
	* @static
	* @final
	* @property {int} WARN
	*/
	Debug.WARN = 3;
	
	/** 
	* Log level for error messages
	* @static
	* @final
	* @property {int} ERROR
	*/
	Debug.ERROR = 4;
	
	/**
	* The minimum log level to show, by default it's set to
	* show all levels of logging. 
	* @public
	* @static
	* @property {int} minLogLevel
	*/
	Debug.minLogLevel = Debug.GENERAL;
	
	/** 
	* Boolean to turn on or off the debugging
	* @public
	* @static
	* @property {bool} enabled
	*/
	Debug.enabled = true;
	
	/**
	*  The jQuery element to output debug messages to
	*
	*  @public
	*  @static
	*  @property {jQuery} output
	*/
	Debug.output = null;
	
	/** 
	* Browser port for the websocket browsers tend to block ports 
	*  @static
	*  @private
	*  @property {int} _NET_PORT
	*  @default 1025
	*/
	Debug._NET_PORT = 1025;
	
	/** 
	* If the web socket is connected 
	* @static
	* @private
	* @default false
	* @property {bool} _isConnected
	*/
	Debug._isConnected = false;
	
	/** 
	* The socket connection
	* @static
	* @private
	* @property {WebSocket} _socket
	*/
	Debug._socket = null;
	
	/** 
	* The current message object being sent to the `WebSocket`
	* @static
	* @private
	* @property {object} _messageObj
	*/
	Debug._messageObj = null;
	
	/** 
	* The `WebSocket` message queue 
	* @static
	* @private
	* @property {Array} _messageQueue
	*/
	Debug._messageQueue = null;
	
	/**
	*  Connect to the `WebSocket`
	*  @public
	*  @static
	*  @method connect
	*  @param {string} The IP address to connect to
	*/
	Debug.connect = function(ipAddr)
	{
		// Make sure WebSocket exists without prefixes for us
		if(!("WebSocket" in global) && !("MozWebSocket" in global)) return false;
		
		global.WebSocket = WebSocket || MozWebSocket; 
		
		try
		{
			var s = Debug._socket = new WebSocket("ws://" + ipAddr + ":" + Debug._NET_PORT);
			s.onopen = onConnect;
			s.onmessage = function(){};
			s.onclose = onClose;
			s.onerror = onClose;
			Debug._messageQueue = [];
			Debug._isConnected = true;
		}
		catch(error)
		{
			return false;
		}
		return true;
	};
	
	/**
	*  Disconnect from the `WebSocket`
	*  @public
	*  @static
	*  @method disconnect
	*/
	Debug.disconnect = function()
	{
		if(Debug._isConnected)
		{
			Debug._socket.close();
			onClose();
		}
	};
	
	/**
	*  Callback when the `WebSocket` is connected
	*  @private
	*  @static
	*  @method onConnect
	*/
	var onConnect = function()
	{
		// set up a function to handle all messages
		window.onerror = globalErrorHandler;
		
		// create and send a new session message
		Debug._messageObj = {level:"session", message:""};
		Debug._socket.send(JSON.stringify(Debug._messageObj));
		
		// send any queued logs
		for(var i = 0; i < Debug._messageQueue.length; ++i)
		{
			Debug._socket.send(JSON.stringify(Debug._messageQueue[i]));
		}
		// get rid of this, since we are connected
		Debug._messageQueue = null;
	};
	
	/**
	*  Global window error handler
	*  @static
	*  @private
	*  @method globalErrorHandler
	*  @param THe error message
	*  @param The url of the file
	*  @param The line within the file
	*/
	var globalErrorHandler = function(errorMsg, url, lineNumber)
	{
		Debug.remoteLog("Error: " + errorMsg + " in " + url + " at line " + lineNumber, "ERROR");
		return false;
	};
	
	/**
	*  Callback for when the websocket is closed
	*  @private
	*  @static
	*  @method onClose
	*/
	var onClose = function()
	{
		window.onerror = null;
		Debug._isConnected = false;
		var s = Debug._socket;
		s.onopen = null;
		s.onmessage = null;
		s.onclose = null;
		s.onerror = null;
		Debug._socket = null;
		Debug._messageObj = null;
		Debug._messageQueue = null;
	};
	
	/**
	*  Sent to the output
	*  @private
	*  @static
	*  @method output
	*  @param {string} level The log level
	*  @param {string} args Additional arguments
	*/
	function output(level, args)
	{
		if (Debug.output) 
		{
			Debug.output.append("<div class=\""+level+"\">" + args + "</div>");
		}
	}
	
	/**
	*  Send a remote log message using the socket connection
	*  @public
	*  @static
	*  @method remoteLog
	*  @param {string} message The message to send 
	*  @param {level} level The log level to send
	*/
	Debug.remoteLog = function(message, level)
	{
		if(!level)
			level = "GENERAL";
		if(Debug._messageQueue)//If we are still in the process of connecting, queue up the log
		{
			Debug._messageQueue.push({message:message, level:level});
		}
		else//send the log immediately
		{
			Debug._messageObj.level = level;
			Debug._messageObj.message = message;
			Debug._socket.send(JSON.stringify(Debug._messageObj));
		}
	};
	
	/**
	*  Log something in the console or remote
	*  @static
	*  @public 
	*  @method log
	*  @param {*} params The statement or object to log
	*/
	Debug.log = function(params)
	{
		if(!Debug.enabled) return;
		if(Debug._isConnected)
		{
			Debug.remoteLog(params, "GENERAL");
		}
		else if (Debug.minLogLevel == Debug.GENERAL && hasConsole) 
		{
			console.log(params);
			output("general", params);
		}	
	};
	
	/**
	*  Debug something in the console or remote
	*  @static
	*  @public 
	*  @method debug
	*  @param {*} params The statement or object to debug
	*/
	Debug.debug = function(params)
	{
		if(!Debug.enabled) return;
		if(Debug._isConnected)
		{
			Debug.remoteLog(params, "DEBUG");
		}
		else if (Debug.minLogLevel <= Debug.DEBUG && hasConsole) 
		{
			console.debug(params);
			output("debug", params);
		}
	};
	
	/**
	*  Info something in the console or remote
	*  @static
	*  @public 
	*  @method info
	*  @param {*} params The statement or object to info
	*/
	Debug.info = function(params)
	{
		if(!Debug.enabled) return;
		if(Debug._isConnected)
		{
			Debug.remoteLog(params, "INFO");
		}
		else if (Debug.minLogLevel <= Debug.INFO && hasConsole) 
		{
			console.info(params);
			output("info", params);
		}	
	};
	
	/**
	*  Warn something in the console or remote
	*  @static
	*  @public 
	*  @method warn
	*  @param {*} params The statement or object to warn
	*/
	Debug.warn = function(params)
	{
		if(!Debug.enabled) return;
		if(Debug._isConnected)
		{
			Debug.remoteLog(params, "WARNING");
		}
		else if (Debug.minLogLevel <= Debug.WARN && hasConsole) 
		{
			console.warn(params);
			output("warn", params);
		}	
	};
	
	/**
	*  Error something in the console or remote
	*  @static
	*  @public 
	*  @method error
	*  @param {*} params The statement or object to error
	*/
	Debug.error = function(params)
	{
		if(!Debug.enabled) return;
		if(Debug._isConnected)
		{
			Debug.remoteLog(params, "ERROR");
		}
		else if (hasConsole) 
		{
			console.error(params);
			output("error", params);
		}	
	};
	
	/**
	*  Assert that something is true
	*  @static
	*  @public
	*  @method assert
	*  @param {bool} truth As statement that is assumed true
	*  @param {*} params The message to error if the assert is false
	*/
	Debug.assert = function(truth, params)
	{
		if (hasConsole && Debug.enabled && console.assert) 
		{
			console.assert(truth, params);
			if (!truth) output("error", params);
		}	
	};
	
	/**
	*  Method to describe an object in the console
	*  @static
	*  @method dir
	*  @public
	*  @param {object} params The object to describe in the console
	*/
	Debug.dir = function(params)
	{
		if (Debug.minLogLevel == Debug.GENERAL && hasConsole && Debug.enabled) 
		{
			console.dir(params);
		}	
	};
	
	/**
	*  Method to clear the console
	*
	*  @static
	*  @public
	*  @method clear
	*/
	Debug.clear = function()
	{
		if (hasConsole && Debug.enabled) 
		{
			console.clear();
			if (Debug.output) Debug.output.html("");
		}	
	};
	
	/**
	*  Generate a stack track in the output
	*  @static
	*  @public
	*  @method trace
	*  @param {*} params Optional parameters to log
	*/
	Debug.trace = function(params)
	{
		if (Debug.minLogLevel == Debug.GENERAL && hasConsole && Debug.enabled) 
		{
			console.trace(params);
		}	
	};
	
	// Make the debug class globally accessible
	// If the console doesn't exist, use the dummy to prevent errors
	global.Debug = Debug;
	
}(window));
(function(undefined){
	
	/**
	*  Designed to mimic the feature-set of the CloudKidOS for AS3
	*  Provides a staging framework for other things to load
	*  handles the stage query string parameters, provides debug tools,
	*  as well as browser cache-busting.
	*  @class cloudkid.OS
	*  @extends createjs.Container|PIXI.DisplayObjectContainer
	*/
	var OS = function(){},
	
	/**
	* The prototype extends the easeljs' Container class
	* or the PIXI.DisplayObjectContainer class
	* 
	* @private
	* @property {createjs.Container|PIXI.DisplayObjectContainer} p
	*/
	p = OS.prototype = (true) ? new createjs.Container() : Object.create(PIXI.DisplayObjectContainer.prototype),
	
	/**
	*  Boolean to keep track if we're paused
	*  
	*  @property {bool} _paused
	*  @private
	*/
	_paused = false,
	
	/**
	*  When the OS is ready to use
	* 
	*  @property {bool} _isReady
	*  @private
	*/
	_isReady = false,
	
	/**
	*  The frame rate object
	*  @private
	*  @property {createjs.Text|PIXI.Text} _framerate
	*/
	_framerate = null,
	
	/**
	*  The number of ms since the last frame update
	*  @private
	*  @property {int} _lastFrameTime
	*/
	_lastFrameTime = 0,
	
	/**
	*  The last time since the last fps update
	*  @private
	*  @property {int} _lastFPSUpdateTime
	*/
	_lastFPSUpdateTime = 0,
	
	/**
	*  The calculated _framerate
	*  @private
	*  @property {Number} _framerateValue
	*/
	_framerateValue = null,
	
	/**
	*  The number of frames since the last fps update
	*  @private
	*  @property {int} _frameCount
	*/
	_frameCount = 0,
	
	/**
	*	The bound callback for listening to tick events
	*	@private
	*   @property {Function} _tickCallback
	*/
	_tickCallback = null,
	
	/**
	* Reference to the private instance object
	* 
	* @property {cloudkid.OS} _instance
	* @static
	* @protected
	*/
	_instance = null,
	
	/**
	* The id of the active requestAnimationFrame or setTimeout call.
	*
	* @property {Number} _tickId
	* @private
	*/
	_tickId = -1,
	
	/**
	* If requestionAnimationFrame should be used
	*
	* @private
	* @property {Bool} _useRAF
	* @default false
	*/
	_useRAF = false,
	
	/** 
	* The current internal frames per second
	*
	* @property {Number} _fps
	* @private
	*/
	_fps = 0,
	
	/**
	* The number of milliseconds per frame
	*
	* @property {int} _msPerFrame
	* @private
	*/
	_msPerFrame = 0;
	
	/** 
	* The version number 
	* @public
	* @static
	* @property {String} VERSION
	*/
	OS.VERSION = "${version}";	
	
	/**
	* Reference to the Container initialize()
	* @protected
	* @property {Function} Container_initialize
	*/
	p.Container_initialize = p.initialize;
		
	/**
	* Reference to the stage object
	* 
	* @property {createjs.Stage|PIXI.Stage} stage
	* @public
	*/
	p.stage = null;
	
	/**
	* [Pixi Only] The renderer used to draw the frame.
	* 
	* @property {PIXI.CanvasRenderer} _renderer description
	* @private
	*/
	p._renderer = null;
	
	/**
	* Reference to the current application
	* @protected
	* @property {cloudkid.Application} _app
	*/
	p._app = null;
	
	/**
	* The collection of query string parameters
	* @public
	* @property {Dictionary} options
	*/
	p.options = null;
	
	/**
	*  Collection of update functions
	*  @protected
	*  @property {Dictionary} _updateFunctions
	*/
	p._updateFunctions = {};
	
	/**
	*  Static constructor for setting up the stage
	*  
	*  @example
		var os = cloudkid.OS.init("stage", {
			showFramerate: true,
			fps: 60,
			parseQueryString: true,
			debug: true
		});
		
		os.addApp(myApplication);
	*  
	*  @method init
	*  @static
	*  @public
	*  @param {string} stageName The stage name selector
	*  @param {Dictionary} options Additional options
	*/
	OS.init = function(stageName, options)
	{
		if (!_instance)
		{
			if (true)
			{
				Debug.log("Creating the singleton instance of OS");
			}
			
			_instance = new OS();
			_instance.initialize(stageName, options);
		}
		return _instance;
	};
	
	/**
	*  The internal constructor extends Container constructor
	*  @constructor
	*  @public
	*  @method initialize
	*  @param {string} stageName The string name of the stage id
	*  @param {object*} opts The optional options to set
	*/
	p.initialize = function(stageName, opts)
	{
		// Call the super constructor
		if(true) this.Container_initialize();
		else if(false) PIXI.DisplayObjectContainer.call(this);
		
		// Setup the options container
		this.options = opts || {};
		
		// See if we should parse querystring
		if (this.options.parseQueryString !== undefined)
			this.options = parseQueryStringParams(this.options);
		
		// Turn on debugging
		if (this.options.debug !== undefined)
			Debug.enabled = this.options.debug === true || this.options.debug === "true";
			
		if (this.options.minLogLevel !== undefined)
			Debug.minLogLevel = parseInt(this.options.minLogLevel, 10);
		
		if(typeof this.options.ip == "string")//if we were supplied with an IP address, connect to it with the Debug class for logging
		{
			Debug.connect(this.options.ip);
		}
	
		// Setup the medialoader
		var loader = cloudkid.MediaLoader.init();
		
		// Setup the stage
		if(true)
		{
			this.stage = new createjs.Stage(stageName);
			this.stage.name = "cloudkid.OS";
		
			// prevent mouse down turning into cursor
			this.stage.canvas.onmousedown = function(e)
			{
				e.preventDefault();
			};
		}
		else if(false)
		{
			this.stage = new PIXI.Stage(this.options.backgroundColor || 0, true);
		}
		this.stage.addChild(this);
		
		//listen for when the page visibility changes so we can pause our timings
		this.visibleListener = this.onWindowVisibilityChanged.bind(this);
		addPageHideListener(this.visibleListener);
		
		if(true)
		{
			// Setup the touch events
			var touchDevice=(window.hasOwnProperty('ontouchstart'));
			
			//IE10 doesn't send mouseover events properly if touch is enabled
			if(window.navigator.userAgent.indexOf("MSIE 10.0") != -1 && !touchDevice)
			{
				if (true) Debug.log('IE10 Desktop');
			}
			else
				createjs.Touch.enable(this.stage);

			// Clear the stage
			this.stage.autoClear = !!this.options.clearView || false;
			
			if(this.options.showFramerate)
			{
				// Add the frame rate object
				_framerate = new createjs.Text('', '10px Arial', '#000');
				_framerate.stroke = {width:2, color:"#ffffff"};
				_framerate.x = _framerate.y = 5;
				this.addChild(_framerate);
			}
			
			// Initial render
			this.stage.update();
		}
		else if(false)
		{
			var transparent = !!this.options.transparent || false;

			this.containerName = (typeof stageName == "string") ? stageName : stageName.attr("id");
			var container = (typeof stageName == "string") ? document.getElementById(stageName) : stageName;
			
			//create the rendererer
			if(this.options.forceContext == "canvas2d")
			{
				this._renderer = new PIXI.CanvasRenderer(
					this.options.width || container.width(), 
					this.options.height || container.height(), 
					null, 
					transparent
				);
			}
			else if(this.options.forceContext == "webgl")
			{
				this._renderer = new PIXI.WebGLRenderer(
					this.options.width || container.width(), 
					this.options.height || container.height(), 
					null, 
					transparent
				);
			}
			else
			{
				this._renderer = PIXI.autoDetectRenderer(
					this.options.width || container.width(), 
					this.options.height || container.height(), 
					null, 
					transparent
				);
			}
			container.appendChild(this._renderer.view);
			
			//Here at CloudKid, we always have a bitmap background, so we can get better performance by not clearing the render area each render
			this._renderer.clearView = !!this.options.clearView || false;

			if(this.options.showFramerate)
			{
				// Add the frame rate object
				_framerate = new PIXI.Text('FPS: 0.000', {font:'10px Arial', fill:'black', stroke:'white', strokeThickness:2});
				_framerate.x = _framerate.y = 5;
				this.addChild(_framerate);
			}
			
			// Initial render
			this._renderer.render(this.stage);
		}
		
		//set up the tick callback
		_tickCallback = this.tick.bind(this);
		
		// If we should use requestAnimationFrame in the browser instead of setTimeout
		_useRAF = this.options.raf || false;
		
		//The fps to target - only used if not using requestAnimationFrame
		this.fps = this.options.fps || 60;

		// Set the app to default
		this.removeApp();
		
		// Check to see if we should load a versions file
		// The versions file keeps track of the OS version
		if (this.options.versionsFile !== undefined)
		{
			_isReady = false;
			
			var os = this;
			
			// Try to load the default versions file
			// callback should be made with a scope in mind
			loader.cacheManager.addVersionsFile(
				this.options.versionsFile, 
				function(){
					
					_isReady = true;
					
					// Someone added an application before the OS was ready
					// lets initialize is now
					if (os._app)
					{
						os.addChildAt(os._app, 0);
						os._app.init();
						os.resume();
					}
				}
			);
		}
		else
		{
			_isReady = true;
		}
	};
	
	var hidden = null;//needed inside the event listener as well
	var evtMap = null;
	var v = 'visible', h = 'hidden';
	var addPageHideListener = function(listener)
	{
		hidden = "hidden";
		// Standards:
		if (hidden in document)
			document.addEventListener("visibilitychange", listener);
		else if ((hidden = "mozHidden") in document)
			document.addEventListener("mozvisibilitychange", listener);
		else if ((hidden = "webkitHidden") in document)
			document.addEventListener("webkitvisibilitychange", listener);
		else if ((hidden = "msHidden") in document)
			document.addEventListener("msvisibilitychange", listener);
		else if ('onfocusin' in document)// IE 9 and lower:
		{
			evtMap = { focusin:v, focusout:h };
			document.onfocusin = document.onfocusout = listener;
		}
		else// All others:
		{
			evtMap = { focus:v, pageshow:v, blur:h, pagehide:h };
			window.onpageshow = window.onpagehide = window.onfocus = window.onblur = listener;
		}
	};
	
	var removePageHideListener = function(listener)
	{
		var hidden = "hidden";
		if (hidden in document)
			document.removeEventListener("visibilitychange", listener);
		else if ((hidden = "mozHidden") in document)
			document.removeEventListener("mozvisibilitychange", listener);
		else if ((hidden = "webkitHidden") in document)
			document.removeEventListener("webkitvisibilitychange", listener);
		else if ((hidden = "msHidden") in document)
			document.removeEventListener("msvisibilitychange", listener);
		document.onfocusin = document.onfocusout = null;
		window.onpageshow = window.onpagehide = window.onfocus = window.onblur = null;
	};

	p.onWindowVisibilityChanged = function(evt)
	{
		var v = 'visible', h = 'hidden';

		evt = evt || window.event;
		var value;
		if (evtMap)
			value = evtMap[evt.type];
		else
			value = document[hidden] ? h : v;
		if(value == h)
			this.pause();
		else
			this.resume();
	};
	
	/**
	*  Define all of the query string parameters
	*  @private
	*  @method parseQueryStringParams
	*  @param {object} output The object reference to update
	*/
	var parseQueryStringParams = function(output)
	{
		var href = window.location.href;
		var questionMark = href.indexOf("?");
		if (questionMark == -1) return output;
		
		var vars = questionMark < 0 ? '' : href.substr(questionMark+1);
		var pound = vars.indexOf('#');
		vars = pound < 0 ? vars : vars.substring(0, pound);
		var splitFlashVars = vars.split("&");
		var myVar;
		for( var i in splitFlashVars )
		{
			myVar = splitFlashVars[i].split("=");
			if (true)
			{
				Debug.log(myVar[0] + " -> " + myVar[1]);
			}
			output[myVar[0]] = myVar[1];
		}
		return output;
	};
	
	/**
	*  Pause the OS and stop frame updates
	*  @public
	*  @method pause
	*/
	p.pause = function()
	{
		if(_tickId != -1)
		{
			if(_useRAF)
			{
				if(window.cancelAnimationFrame)
					cancelAnimationFrame(_tickId);
			}
			else
				clearTimeout(_tickId);
			_tickId = -1;
		}
		_paused = true;
	};
	
	var nowFunc = window.performance && (performance.now || performance.mozNow || performance.msNow || performance.oNow || performance.webkitNow);
	if(nowFunc)
		nowFunc = nowFunc.bind(performance);
	else
		nowFunc = function() { return new Date().getTime(); };//apparently in Chrome this is extremely inaccurate (triple framerate or something silly)

	/**
	*  Gets the current time in milliseconds for timing purposes
	*  @public
	*  @method getTime
	*/
	p.getTime = function()
	{

		return nowFunc();
	};
	
	/**
	*  Resume the OS updates
	*  @public
	*  @method resume
	*/
	p.resume = function()
	{
		_paused = false;
		
		if(_tickId == -1)
		{
			_tickId = _useRAF ? 
				requestAnimFrame(_tickCallback): 
				setTargetedTimeout(_tickCallback);
		}
		_lastFPSUpdateTime = _lastFrameTime = this.getTime();
	};
	
	/**
	* The FPS that the OS is targeting.
	* 
	* @property {Number} fps
	* @public
	*/
	Object.defineProperty(p, "fps", {
		get: function() { return _fps; },
		set: function(value) {
			if(typeof value != "number") return;
			_fps = value;
			_msPerFrame = (1000 / _fps) | 0;
		}
	});
	
	var setTargetedTimeout = function(callback, timeInFrame)
	{
		var timeToCall = 0;
		if(timeInFrame)
			timeToCall = Math.max(0, _msPerFrame - timeInFrame);//subtract the time spent in the frame to actually hit the target fps
		return setTimeout(callback, timeToCall);
	};
	
	/**
	*  Remove the application
	*  @public
	*  @method removeApp
	*  @param {Boolean} destroying If the OS is being destroyed and shouldn't bother running any resetting code.
	*  @return {Boolean} If an `cloudkid.Application` was successfully removed
	*/
	p.removeApp = function(destroying)
	{
		var removed = false;
		
		var stage = this.stage;
		if (this._app)
		{
			if(true)
			{
				if(this.contains(this._app))
					this.removeChild(this._app);
				stage.removeAllChildren();
			}
			else if(false)
			{
				if(this._app.parent == this)
					this.removeChild(this._app);
				stage.removeChildren();
			}
			this._app.destroy();
			removed = true;
		}
		this._app = null;
		
		// Stop the update
		this.pause();
				
		if(!destroying)
		{			
			stage.addChild(this);
			if(_framerate)
			{
				// Reset the framerate
				_framerate.text = "FPS: 0.000";
			}
			
			// Ignore spikes in frame count
			_lastFrameTime = _lastFPSUpdateTime = _framerateValue = _frameCount = 0;
			
			// Update the stage
			if(false) this._renderer.render(stage);
			else if(true) this.stage.update();
		}
		
		return removed;
	};
	
	/**
	*  Add an app to this display list
	*  @public 
	*  @method addApp
	*  @param {cloudkid.Application} app The application to add
	*/
	p.addApp = function(app)
	{
		this.removeApp();
		if (!(app instanceof cloudkid.Application))
		{
			throw new Error("Can only objects that inherit cloudkid.Application");
		}
		this._app = app;
		if (_isReady)
		{
			this.addChildAt(app, 0);
			this._app.init();
			this.resume();
		}
	};
	
	/**
	*  Get the current application
	*  @method getApp
	*  @public
	*  @return {cloudkid.Application} The current Application, null if no application
	*/
	p.getApp = function()
	{
		return this._app;
	};
	
	/**
	*  Add an update callback, must take elapsed as a parameter
	*  @method addUpdateCallback
	*  @public
	*  @param {string} alias An alias to associate with this callback
	*  @param {function} f The callback function
	*/
	p.addUpdateCallback = function(alias, f)
	{
		if (this._updateFunctions[alias] === undefined)
		{
			this._updateFunctions[alias] = f;
		}		
	};
	
	/**
	*  Remove an update callback, must take elapsed as a parameter
	*  @public
	*  @method removeUpdateCallback
	*  @param {string} alias The callback function alias
	*/
	p.removeUpdateCallback = function(alias)
	{
		if (this._updateFunctions[alias] !== undefined)
		{
			delete this._updateFunctions[alias];
		}
	};
	
	/**
	*  Called by the stage listener
	*  @public
	*  @method tick
	*/
	p.tick = function()
	{
		if (_paused)
		{
			_tickId = -1;
			return;
		}
		
		var now = this.getTime();
		var dTime = now - _lastFrameTime;
		
		// Only update the framerate ever second
		if(_framerate && _framerate.visible)
		{
			_frameCount++;
			var elapsed = now - _lastFPSUpdateTime;
			if (elapsed > 1000)
			{
				_framerateValue = 1000 / elapsed * _frameCount;
				if(false)
					_framerate.setText("FPS: " + (Math.round(_framerateValue * 1000) / 1000));
				else if(true)
					_framerate.text = "FPS: " + (Math.round(_framerateValue * 1000) / 1000);
				_lastFPSUpdateTime = now;
				_frameCount = 0;
			}
		}
		_lastFrameTime = now;
		
		//update app				
		if (this._app)
		{
			this._app.update(dTime);
		}
		//update other functions
		for(var alias in this._updateFunctions)
		{
			this._updateFunctions[alias](dTime);
		}
		//render stage
		if(false) 
			this._renderer.render(this.stage);
		else if(true) 
			this.stage.update(dTime);
		
		//request the next animation frame
		_tickId = _useRAF ? 
			requestAnimFrame(_tickCallback) : 
			setTargetedTimeout(_tickCallback, this.getTime() - _lastFrameTime);
	};
	
	/**
	*  Destroy the instance of the OS, can init after this,
	*  also destroys the application, if around
	*  @public
	*  @method destroy
	*/
	p.destroy = function()
	{
		if(false)
		{
			this.stage.interactionManager.cleanup();
		}
		
		var ml = cloudkid.MediaLoader.instance;
		this.pause();
		this.removeApp(true);
		_instance = null;
		
		if(true)
		{
			createjs.Touch.disable(this.stage);
		}
		
		ml.destroy();
		this.stage = null;
		this._updateFunctions = null;
		removePageHideListener(this.visibleListener);
		
		if(false)
		{
			this._renderer.destroy();
			this._renderer = null;
		}
	};
	
	/**
	*  Static function for getting the singleton instance
	*  @static
	*  @readOnly
	*  @public
	*  @attribute instance
	*  @type cloudkid.OS
	*/
	Object.defineProperty(OS, "instance", {
		get:function()
		{
			if (!_instance)
			{
				throw 'Call cloudkid.OS.init(canvasId)';
			}
			return _instance;
		}
	});
	
	// Add to the name space
	namespace('cloudkid').OS = OS;
}());
/**
*  [CreateJS only] Designed to provide utility related to functions, the
*  most important of which is the `bind` method, used to properly scope callbacks.
*  @class bind
*/
(function(){
	
	// If there's already a bind, ignore
	if (!Function.prototype.bind)
	{
		/**
		*  Add the bind functionality to the Function prototype
		*  this allows passing a reference in the function callback 
	
		var callback = function(){};
		cloudkid.MediaLoader.instance.load('something.json', callback.bind(this));
	
		*  @constructor
		*  @method bind
		*  @param {function} that The reference to the function
		*/
		Function.prototype.bind = function bind(that) 
		{
			var target = this;

			if (typeof target != "function") 
			{
				throw new TypeError();
			}

			var args = Array.prototype.slice.call(arguments, 1),
			bound = function()
			{
				if (this instanceof bound) 
				{
					var F = function(){};
					F.prototype = target.prototype;
					var self = new F();

					var result = target.apply(self, args.concat(Array.prototype.slice.call(arguments)));
				
					if (Object(result) === result)
					{
						return result;
					}
					return self;
				}
				else 
				{
					return target.apply(that, args.concat(Array.prototype.slice.call(arguments)));
				}
			};
			return bound;
		};
	}
	
	// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
	// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
	// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
	// MIT license
	/**
	 * A polyfill for requestAnimationFrame
	 *
	 * @method requestAnimationFrame
	 */
	/**
	 * A polyfill for cancelAnimationFrame
	 *
	 * @method cancelAnimationFrame
	 */
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame)
	{
		window.requestAnimationFrame = function(callback) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};

		if (!window.cancelAnimationFrame)//only set this up if the corresponding requestAnimationFrame was set up
		{
			window.cancelAnimationFrame = function(id) {
				clearTimeout(id);
			};
		}
	}

	window.requestAnimFrame = window.requestAnimationFrame;
	
}());

(function(){
	
	/**
	*  An application is an abstract class which extends `createjs.Container`
	*  and is managed by the `cloudkid.OS`
	*
	*  @class cloudkid.Application
	*/
	var Application = function()
	{
		if(true) 
		{
			this.initialize();
		}	
		else if(false)
		{
			PIXI.DisplayObjectContainer.call(this);
		}	
	};
	
	// Shortcut reference to the prototype
	var p;
	
	// Extends the container
	if (true)
	{
		p = Application.prototype = new createjs.Container();
	}
	// Extends the PIXI display object
	else if (false)
	{
		p = Application.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
	}
		
	/**
	* The application is ready to use, added to stage
	*
	* @public
	* @method init
	*/
	p.init = function(){};
	
	/**
	*  The updated function called by the OS
	*  this function is implementation-specific
	*
	*  @public
	*  @method update
	*  @param {int} elapsed The number of MS since the last frame update
	*/
	p.update = function(elapsed){};
	
	/**
	* Destroy the application, don't use after this
	* 
	* @public
	* @method destroy
	*/
	p.destroy = function(){};
	
	/**
	*  Resize the application
	*
	* @public 
	* @method resize
	*/
	p.resize = function(){};
	
	namespace('cloudkid').Application = Application;
}());
(function(){
	
	/**
	*  Represents a single item in the loader queue 
	*  @class cloudkid.LoaderQueueItem
	*/
	var LoaderQueueItem = function(){};
	
	/** Reference to the prototype */
	var p = LoaderQueueItem.prototype;
	
	/** 
	* Highest priority
	* @static
	* @public
	* @final
	* @property {int} PRIORITY_HIGH
	*/
	LoaderQueueItem.PRIORITY_HIGH = 1;
	
	/** 
	* Normal priority, the default
	* @static
	* @public
	* @final
	* @property {int} PRIORITY_NORMAL
	*/
	LoaderQueueItem.PRIORITY_NORMAL = 0;
	
	/** 
	* Lowest priority
	* @static
	* @public
	* @final
	* @property {int} PRIORITY_LOW
	*/
	LoaderQueueItem.PRIORITY_LOW = -1;
	
	/**
	*  The url of the load
	*  @public
	*  @property {string} url
	*/
	p.url = null;
	
	/**
	*  Data associate with the load
	*  @public
	*  @property {*} data
	*/
	p.data = null;
	
	/**
	*  The callback function of the load, to call when 
	*  the load as finished, takes one argument as result
	*  @public
	*  @property {function} callback
	*/
	p.callback = null;
	
	/**
	*  The priority of this item
	*  @property {int} priority
	*  @public
	*/
	p.priority = 0;
	
	/**
	*  The amount we've loaded so far, from 0 to 1
	*  @public
	*  @property {Number} progress
	*/
	p.progress = 0;
	
	/**
	*  The progress callback
	*  @public
	*  @proprty {function} updateCallback
	*/
	p.updateCallback = null;
	
	/**
	*  Represent this object as a string
	*  @public
	*  @method toString
	*  @return {string} The string representation of this object
	*/
	p.toString = function()
	{
		return "[LoaderQueueItem(url:'"+this.url+"', priority:"+this.priority+")]";
	};
	
	/**
	*  Destroy this result
	*  @public
	*  @method destroy
	*/
	p.destroy = function()
	{
		this.callback = null;
		this.updateCallback = null;
		this.data = null;
	};
	
	// Assign to the name space
	namespace('cloudkid').LoaderQueueItem = LoaderQueueItem;
}());
(function(){
	
	/**
	*  The Medialoader is the singleton loader for loading all assets
	*  including images, data, code and sounds. MediaLoader supports cache-busting
	*  in the browser using dynamic query string parameters.
	* 
	*  @class cloudkid.MediaLoader
	*/
	var MediaLoader = function(){};
	
	/** The prototype */
	var p = MediaLoader.prototype;
	
	/**
	* Reference to the private instance object
	* @static
	* @protected
	*/
	MediaLoader._instance = null;
	
	/**
	*  The collection of LoaderQueueItems
	*  @private
	*/
	var queue = null;
	
	/**
	*  The collection of LoaderQueueItems by url
	*  @private
	*/
	var queueItems = null;
	
	/**
	*  The collection of loaders
	*  @private
	*  @property {object} loaders
	*/
	var loaders = null;
	
	/**
	*  The current number of items loading
	*  @private
	*  @property {int} numLoads
	*  @default 0
	*/
	var numLoads = 0;
	
	var retries = null;
	
	/**
	*  If we can load
	*  @private
	*/
	p._canLoad = true;
	
	/**
	*  The maximum number of simulaneous loads
	*  @public
	*  @property {int} maxSimultaneousLoads
	*  @default 2
	*/
	p.maxSimultaneousLoads = 2;
	
	/**
	*  The reference to the cache manager
	*  @public
	*  @property {cloudkid.CacheManager} cacheManager
	*/
	p.cacheManager = null;
	
	/**
	*  Static constructor creating the singleton
	*  @method init
	*  @static
	*  @public
	*/
	MediaLoader.init = function()
	{
		if (!MediaLoader._instance)
		{
			MediaLoader._instance = new MediaLoader();
			MediaLoader._instance._initialize();
		}
		return MediaLoader._instance;
	};
		
	/**
	*  Static function for getting the singleton instance
	*  @static
	*  @readOnly
	*  @public
	*  @property {cloudkid.OS} instance
	*/
	Object.defineProperty(MediaLoader, "instance", {
		get:function()
		{
			if (!MediaLoader._instance)
			{
				throw 'Call cloudkid.MediaLoader.init()';
			}
			return MediaLoader._instance;
		}
	});
	
	/**
	*  Destroy the MediaLoader singleton, don't use after this
	*  @public
	*  @method destroy
	*/
	p.destroy = function()
	{
		MediaLoader._instance = null;
		if (this.cacheManager)
			this.cacheManager.destroy();
		this.cacheManager = null;
		queue = null;
	};
	
	/**
	*  Initilize the object
	*  @protected
	*  @method _initialize
	*/
	p._initialize = function()
	{
		queue = [];
		queueItems = {};
		loaders = {};
		retries = {};
		this.cacheManager = new cloudkid.CacheManager();
	};
	
	/**
	*  Load a file 
	*  @method load
	*  @public
	*  @param {string} url The file path to load
	*  @param {function} callback The callback function when completed
	*  @param {function*} updateCallback The callback for load progress update, passes 0-1 as param
	*  @param {int*} priority The priority of the load
	*  @param {*} data optional data
	*/
	p.load = function(url, callback, updateCallback, priority, data)
	{
		var qi = new cloudkid.LoaderQueueItem();
		
		qi.url = url;
		qi.callback = callback;
		qi.updateCallback = updateCallback || null;
		qi.priority = priority || cloudkid.LoaderQueueItem.PRIORITY_NORMAL;
		qi.data = data || null;
		
		queue.push(qi);
		
		// Sory by priority
		queue.sort(function(a, b){
			return a.priority - b.priority;
		});
		
		// Try to load the next queue item
		this._tryNextLoad();
	};
	
	/**
	*  There was an error loading the file
	*  @private
	*  @method _onLoadFailed
	*  @param {cloudkid.LoaderQueueItem} qi The loader queue item
	*/
	p._onLoadFailed = function(qi, event)
	{
		Debug.error("Unable to load file: " + qi.url  + " - reason: " + event.error);
		
		var loader = loaders[qi.url];
		loader.removeAllEventListeners();
		loader.close();
		
		delete queueItems[qi.url];
		delete loaders[qi.url];
		
		if(retries[qi.url])
			retries[qi.url]++;
		else
			retries[qi.url] = 1;
		if(retries[qi.url] > 3)
			this._loadDone(qi, null);
		else
		{
			numLoads--;
			queue.push(qi);
			this._tryNextLoad();
		}
	};
	
	/**
	*  The file load progress event
	*  @method _onLoadProgress
	*  @private
	*  @param {cloudkid.LoaderQueueItem} qi The loader queue item
	*  @param {object} event The progress event
	*/
	p._onLoadProgress = function(qi, event)
	{
		qi.progress = event.progress;
		if (qi.updateCallback){
			qi.updateCallback(qi.progress);
		}	
	};
	
	/**
	*  The file was loaded successfully
	*  @private
	*  @method _onLoadCompleted
	*  @param {cloudkid.LoaderQueueItem} qi The loader queue item
	*  @param {object} ev The load event
	*/
	p._onLoadCompleted = function(qi, ev)
	{
		if(true)
		{
			Debug.log("File loaded successfully from " + qi.url);
		}
		var loader = loaders[qi.url];
		loader.removeAllEventListeners();
		loader.close();
		
		delete queueItems[qi.url];
		delete loaders[qi.url];
		this._loadDone(qi, new cloudkid.MediaLoaderResult(ev.result, qi.url, loader));
	};
	
	/**
	*  Attempt to do the next load
	*  @method _tryNextLoad
	*  @private
	*/
	p._tryNextLoad = function()
	{
		if (numLoads > this.maxSimultaneousLoads - 1 || queue.length === 0) return;
		
		numLoads++;
		
		var qi = queue.shift();
		
		if(true)
		{
			Debug.log("Attempting to load file '" + qi.url + "'");
		}
		
		queueItems[qi.url] = qi;
		
		var loader = new createjs.LoadQueue(true);
		//allow the loader to handle sound as well
		if(createjs.Sound)
			loader.installPlugin(createjs.Sound);
		
		// Add to the list of loaders
		loaders[qi.url] = loader;
		
		loader.addEventListener("fileload", this._onLoadCompleted.bind(this, qi));
		loader.addEventListener("error", this._onLoadFailed.bind(this, qi));
		loader.addEventListener("fileprogress", this._onLoadProgress.bind(this, qi));
		var url = this.cacheManager.prepare(qi.url);
		loader.loadFile(qi.data ? {id:qi.data.id, src:url, data:qi.data} : url);
	};
	
	/**
	*  Alert that the loading is finished
	*  @private 
	*  @method _loadDone
	*  @param {cloudkid.LoaderQueueItem} qi The loader queue item
	*  @param {object} result The event from preloadjs or null
	*/
	p._loadDone = function(qi, result)
	{
		numLoads--;
		qi.callback(result);
		qi.destroy();
		this._tryNextLoad();
	};
	
	/**
	*  Cancel a load that's currently in progress
	*  @public
	*  @method cancel
	*  @param {string} url The url
	*  @return {cloudkid.LoaderQueueItem} If canceled returns the queue item, null if not canceled
	*/
	p.cancel = function(url)
	{
		var qi = queueItems[url];
		var loader = loaders[url];
		
		if (qi && loader)
		{
			loader.close();
			delete loaders[url];
			delete queueItems[qi.url];
			numLoads--;
			return qi;
		}
		
		for(i = 0; i < len; i++)
		{
			qi = queue(i);
			if (qi.url == url){
				queue.splice(i, 1);
				return qi;
			}
		}
		return null;		
	};
	
	namespace('cloudkid').MediaLoader = MediaLoader;
}());
(function(){
	
	/**
	*  The return result of the MediaLoader load
	*  @class cloudkid.MediaLoaderResult
	*  @constructor
	*  @param {*} content The dynamic content loaded
	*  @param {string} string
	*  @param {createjs.LoadQueue} loader
	*/
	var MediaLoaderResult = function(content, url, loader)
	{
		this.content = content;
		this.url = url;
		this.loader = loader;
	};
	
	/** Reference to the prototype */
	var p = MediaLoaderResult.prototype;
	
	/**
	*  The contents of the load
	*  @public
	*  @property {*} content 
	*/
	p.content = null;
	
	/**
	*  The url of the load
	*  @public
	*  @property {string} url
	*/
	p.url = null;
	
	/**
	*  Reference to the preloader object
	*  @public
	*  @property {createjs.LoaderQueue} loader
	*/
	p.loader = null;
	
	/**
	* A to string method
	* @public
	* @method toString
	* @return {string} A string rep of the object
	*/
	p.toString = function()
	{
		return "[MediaLoaderResult('"+this.url+"')]";
	};
	
	/**
	* Destroy this result
	* @public
	* @method destroy
	*/
	p.destroy = function()
	{
		this.callback = null;
		this.url = null;
		this.content = null;
	};
	
	// Assign to the name space
	namespace('cloudkid').MediaLoaderResult = MediaLoaderResult;
}());
(function(undefined){
	
	/**
	*  Used for managing the browser cache of loading external elements
	*  can easily load version manifest and apply it to the media loader
	*  supports cache busting all media load requests
	*  uses the query string to bust browser versions.
	*  
	*  @class cloudkid.CacheManager
	*/
	var CacheManager = function()
	{
		this.initialize();
	};
	
	/** Easy access to the prototype */
	var p = CacheManager.prototype = {};
	
	/**
	*  The collection of version numbers
	*  @protected
	*  @property {Dictionary} _versions
	*/
	p._versions = null;
	
	/**
	*  If we are suppose to cache bust every file
	*  @property {bool} cacheBust
	*  @public
	*  @default false
	*/
	p.cacheBust = false;
	
	/**
	* The constructor for the Cache manager
	* @public
	* @constructor
	* @method initialize
	*/
	p.initialize = function()
	{
		this._versions = [];
				
		var cb = cloudkid.OS.instance.options.cacheBust;
		this.cacheBust = cb ? (cb === "true" || cb === true) : false;
		
		if(true)
		{
			if (this.cacheBust) Debug.log("CacheBust all files is on.");
		}
	};
	
	/**
	*  Destroy the cache manager, don't use after this
	*  @public
	*  @method destroy
	*/
	p.destroy = function()
	{
		this._versions = null;
	};
	
	/**
	*  Add the versions
	*  @public
	*  @method addVersionsFile
	*  @param {string} url The url of the versions file
	*  @param {function} callback Callback when the url has been laoded
	*  @param {string} baseUrl A base url to prepend all lines of the file
	*/
	p.addVersionsFile = function(url, callback, baseUrl)
	{		
		Debug.assert(/^.*\.txt$/.test(url), "The versions file must be a *.txt file");
				
		var ml = cloudkid.MediaLoader.instance;
		
		// If we already cache busting, we can ignore this
		if (this.cacheBust)
		{
			if (callback) callback();
			return;
		}
		
		// Add a random version number to never cache the text file
		this.addVersion(url, Math.round(Math.random()*100000));
		
		var cm = this;
		
		// Load the version
		ml.load(url, 
			function(result)
			{				
				// check for a valid result content
				if (result && result.content)
				{
					// Remove carrage returns and split on newlines
					var lines = result.content.replace(/\r/g, '').split("\n");
					var i, parts;

					// Go line by line
					for(i = 0; i < lines.length; i++)
					{	
						// Check for a valid line
						if (!lines[i]) continue;

						// Split lines
						parts = lines[i].split(' ');

						// Add the parts
						if (parts.length != 2) continue;

						// Add the versioning
						cm.addVersion((baseUrl || "") + parts[0], parts[1]);
					}
				}
				if (callback) callback();
			}
		);
	};
	
	/**
	*  Add a version number for a file
	*  @method addVersion
	*  @public
	*  @param {string} url The url of the object
	*  @param {string} version Version number or has of file
	*/
	p.addVersion = function(url, version)
	{
		var ver = this._getVersionByUrl(url);
		if (!ver)
			this._versions.push({'url': url, 'version': version});
	};
	
	/**
	*  Search for a version number by url
	*  @method _getVersionByUrl
	*  @private
	*  @param {string} url The url to search
	*  @return {string} The version number as a string or null
	*/
	p._getVersionByUrl = function(url)
	{
		var i, len = this._versions.length;
		for(i = 0; i < len; i++)
		{
			if (url == this._versions[i].url)
			{
				return this._versions[i];
			}
		}
		return null;
	};
	
	/**
	*  Prepare a URL with the necessary cache busting and/or versioning
	*  as well as the base directoryr
	*  @public
	*  @method prepare
	*  @param {string} url The url to prepare
	*  @return {string} The final url with version/cache and basePath added
	*/
	p.prepare = function(url)
	{
		var ver = this._getVersionByUrl(url);
		
		if (this.cacheBust && /(\?|\&)cb\=[0-9]*/.test(url) === false)
		{
			if(!this._cbVal)
				this._cbVal = new Date().getTime().toString();
			url = url + (url.indexOf("?") < 0 ? "?" : "&") + "cb=" + this._cbVal;
		} 
		else if (ver && /(\?|\&)v\=[0-9]*/.test(url) === false)
		{
			url = url + (url.indexOf("?") < 0 ? "?" : "&") + "v=" + ver.version;
		}
		var basePath = cloudkid.OS.instance.options.basePath;
		if (/^http(s)?\:/.test(url) === false && basePath !== undefined && url.search(basePath) == -1)
		{
			url = basePath + url;
		}
		return url;
	};
	
	namespace('cloudkid').CacheManager = CacheManager;
	
}());
(function(undefined) {
	/**
	*  A Multipurpose button class. It is designed to have one image, and an optional text label.
	*  The button can be a normal button or a selectable button.
	*  The button functions similarly with both CreateJS and PIXI, but slightly differently in
	*  initialization and callbacks.
	*
	*  - Initialization - the parameters for initialization are different. See the documentation for initialize().
	*  - [PIXI only] Use releaseCallback and overCallback to know about button clicks and mouse overs, respectively.
	*  - [CreateJS only] Add event listeners for click and mouseover to know about button clicks and mouse overs, respectively.
	*  @class cloudkid.Button
	*  @extends createjs.Container|PIXI.DisplayObjectContainer
	*/
	var Button = function(imageSettings, label, enabled)
	{
		this.initialize(imageSettings, label, enabled);
	};
	
	// Extend Container
	var p = Button.prototype = new createjs.Container();
	
	var s = createjs.Container.prototype;//super
	
	/**
	*  The sprite that is the body of the button.
	*  The type of this property is dependent on which version of the OS library is used.
	*  @public
	*  @property {createjs.Bitmap|PIXI.Sprite} back
	*  @readOnly
	*/
	p.back = null;
	/**
	*  The text field of the button. The label is centered by both width and height on the button.
	*  The type of this property is dependent on which version of the OS library is used.
	*  @public
	*  @property {createjs.Text|PIXI.Text|PIXI.BitmapText} label
	*  @readOnly
	*/
	p.label = null;
	
	//===callbacks for mouse/touch events
	/**
	* Callback for mouse over, bound to this button.
	* @private
	* @property {Function} _overCB
	*/
	p._overCB = null;
	/**
	* Callback for mouse out, bound to this button.
	* @private
	* @property {Function} _outCB
	*/
	p._outCB = null;
	/**
	* Callback for mouse down, bound to this button.
	* @private
	* @property {Function} _downCB
	*/
	p._downCB = null;
	/**
	* Callback for mouse up, bound to this button.
	* @private
	* @property {Function} _upCB
	*/
	p._upCB = null;
	/**
	* A reference to the mouse down event that was triggered on this button.
	* @private
	* @property {createjs.MouseEvent} _downEvent
	*/
	p._downEvent = null;
	
	//===button state variables
	/**
	* If this button is enabled.
	* @private
	* @property {Boolean} _enabled
	*/
	p._enabled = false;
	/**
	* If this button is held down.
	* @private
	* @property {Boolean} _isDown
	*/
	p._isDown = false;
	/**
	* If the mouse is over this button
	* @private
	* @property {Boolean} _isOver
	*/
	p._isOver = false;
	/**
	* If this button is selected.
	* @private
	* @property {Boolean} _isSelected
	*/
	p._isSelected = false;
	/**
	* If this button is a selectable button, and will respond to select being set.
	* @private
	* @property {Boolean} _isSelectable
	*/
	p._isSelectable = false;
	
	//===textures for different button states
	/**
	* [CreateJS only] An object noting the rectangles for the button up state. This should have a src property
	*	and an optional trim property, both createjs.Rectangles.
	* @private
	* @property {Object} _upRects
	*/
	p._upRects = null;
	/**
	* [CreateJS only] An object noting the rectangles for the button over state. This should have a src property
	*	and an optional trim property, both createjs.Rectangles.
	* @private
	* @property {Object} _overRects
	*/
	p._overRects = null;
	/**
	* [CreateJS only] An object noting the rectangles for the button down state. This should have a src property
	*	and an optional trim property, both createjs.Rectangles.
	* @private
	* @property {Object} _downRects
	*/
	p._downRects = null;
	/**
	* [CreateJS only] An object noting the rectangles for the button disabled state. This should have a src property
	*	and an optional trim property, both createjs.Rectangles.
	* @private
	* @property {Object} _disabledRects
	*/
	p._disabledRects = null;
	/**
	* [CreateJS only] An object noting the rectangles for the button selected state. This should have a src property
	*	and an optional trim property, both createjs.Rectangles.
	* @private
	* @property {Object} _selectedRects
	*/
	p._selectedRects = null;
	
	/**
	* The width of the button art, independent of the scaling of the button itself.
	* @private
	* @property {Number} _width
	*/
	p._width = 0;
	/**
	* The height of the button art, independent of the scaling of the button itself.
	* @private
	* @property {Number} _height
	*/
	p._height = 0;
	
	/** 
	* **[CreateJS only]** Constructor for the button when using CreateJS.
	* @method initialize
	* @constructor
	* @param {Object|Image|HTMLCanvasElement} [imageSettings] Information about the art to be used for button states, as well as if the button is selectable or not.
	*			If this is an Image or Canvas element, then the button assumes that the image is full width and 3 images
	*			tall, in the order (top to bottom) up, over, down. If so, then the properties of imageSettings are ignored.
	*	@param {Image|HTMLCanvasElement} [imageSettings.image] The image to use for all of the button states.
	*	@param {Object} [imageSettings.up] The rectangle information about the up state.
	*	@param {createjs.Rectangle} [imageSettings.up.src] The sourceRect for the state within the image.
	*	@param {createjs.Rectangle} [imageSettings.up.trim=null] Trim data about the state, where x & y are how many pixels were 
	*			trimmed off the left and right, and height & width are the untrimmed size of the button.
	*	@param {Object} [imageSettings.over=null] The rectangle information about the over state. If omitted, uses the up state.
	*	@param {createjs.Rectangle} [imageSettings.over.src] The sourceRect for the state within the image.
	*	@param {createjs.Rectangle} [imageSettings.over.trim=null] Trim data about the state, where x & y are how many pixels were 
	*			trimmed off the left and right, and height & width are the untrimmed size of the button.
	*	@param {Object} [imageSettings.down=null] The rectangle information about the down state. If omitted, uses the up state.
	*	@param {createjs.Rectangle} [imageSettings.down.src] The sourceRect for the state within the image.
	*	@param {createjs.Rectangle} [imageSettings.down.trim=null] Trim data about the state, where x & y are how many pixels were 
	*			trimmed off the left and right, and height & width are the untrimmed size of the button.
	*	@param {Object} [imageSettings.disabled=null] The rectangle information about the disabled state. If omitted, uses the up state.
	*	@param {createjs.Rectangle} [imageSettings.disabled.src] The sourceRect for the state within the image.
	*	@param {createjs.Rectangle} [imageSettings.disabled.trim=null] Trim data about the state, where x & y are how many pixels were 
	*			trimmed off the left and right, and height & width are the untrimmed size of the button.
	*	@param {Object} [imageSettings.selected=null] The rectangle information about the over state. If omitted, the button is not a selectable button.
	*	@param {createjs.Rectangle} [imageSettings.selected.src] The sourceRect for the state within the image.
	*	@param {createjs.Rectangle} [imageSettings.selected.trim=null] Trim data about the state, where x & y are how many pixels were 
	*			trimmed off the left and right, and height & width are the untrimmed size of the button.
	* @param {Object} [label=null] Information about the text label on the button. Omitting this makes the button not use a label.
	*	@param {String} [label.text] The text to display on the label.
	*	@param {String} [label.font] The font name and size to use on the label, as createjs.Text expects.
	*	@param {String} [label.color] The color of the text to use on the label, as createjs.Text expects.
	*	@param {String} [label.textBaseline=top] The baseline for the label text, as createjs.Text expects.
	*	@param {String} [label.stroke=null] The stroke to use for the label text, if desired, as createjs.Text expects.
	* @param {Boolean} [enabled=true] Whether or not the button is initially enabled.
	*/
	p.initialize = function(imageSettings, label, enabled)
	{
		s.initialize.call(this);
		
		this._downCB = this._onMouseDown.bind(this);
		this._upCB = this._onMouseUp.bind(this);
		this._overCB = this._onMouseOver.bind(this);
		this._outCB = this._onMouseOut.bind(this);
		
		var image, width, height;
		if(imageSettings.image)//is a settings object with rectangles
		{
			image = imageSettings.image;
			//each rects object has a src property (createjs.Rectangle), and optionally a trim rectangle
			this._upRects = imageSettings.up;
			if(this._upRects.trim)//if the texture is trimmed, use that for the sizing
			{
				this.upTrim = this._upRects.trim;
				width = this.upTrim.width;
				height = this.upTrim.height;
			}
			else//texture is not trimmed and is full size
			{
				width = this.upRect.src.width;
				height = this.upRect.src.height;
			}
			this._overRects = imageSettings.over || this._upRects;
			this._downRects = imageSettings.down || this._upRects;
			this._disabledRects = imageSettings.disabled || this._upRects;
			if(imageSettings.selected)
			{
				this._selectedRects = imageSettings.selected;
				this._isSelectable = true;
			}
		}
		else//imageSettings is just an image to use directly - use the old stacked images method
		{
			image = imageSettings;
			width = image.width;
			height = image.height / 3;
			this._upRects = {src:new createjs.Rectangle(0, 0, width, height)};
			this._overRects = {src:new createjs.Rectangle(0, height, width, height)};
			this._downRects = {src:new createjs.Rectangle(0, height * 2, width, height)};
			this._disabledRects = this._upRects;
		}
		
		this.back = new createjs.Bitmap(image);
		this.addChild(this.back);
		this._width = width;
		this._height = height;
		
		if(label)
		{
			this.label = new createjs.Text(label.text, label.font, label.color);
			if(label.textBaseline)
				this.label.textBaseline = label.textBaseline;
			this.label.stroke = label.stroke;
			this.addChild(this.label);
			this.label.x = (width - this.label.getMeasuredWidth()) * 0.5;
			var h = this.label.getMeasuredLineHeight();
			this.label.y = (height - h) * 0.5;
		}
		
		this.enabled = enabled === undefined ? true : !!enabled;
	};
	
	/**
	*  The width of the button, based on the width of back. This value is affected by scale.
	*  @public
	*  @property {Number} width
	*/
	Object.defineProperty(p, "width", {
		get:function(){return this._width * this.scaleX;},
		set:function(value){
			this.scaleX = value / this._width;
		}
	});
	/**
	*  The height of the button, based on the height of back. This value is affected by scale.
	*  @public
	*  @property {Number} height
	*/
	Object.defineProperty(p, "height", {
		get:function(){return this._height * this.scaleY;},
		set:function(value){
			this.scaleY = value / this._width;
		}
	});
	
	/**
	*  Sets the text of the label. This does nothing if the button was not initialized with a label.
	*  @public
	*  @method setText
	*  @param {String} text The text to set the label to.
	*/
	p.setText = function(text)
	{
		if(this.label)
		{
			this.label.text = text;
			this.label.x = (width - this.label.getMeasuredWidth()) * 0.5;
			var h = this.label.getMeasuredLineHeight();
			this.label.y = (height - h) * 0.5;
		}
	};
	
	/**
	*  Whether or not the button is enabled.
	*  @public
	*  @property {Boolean} enabled
	*  @default true
	*/
	Object.defineProperty(p, "enabled", {
		get: function() { return this._enabled; },
		set: function(value)
		{
			this._enabled = value;
			
			if(this._enabled)
			{
				this.cursor = 'pointer';
				this.addEventListener('mousedown', this._downCB);
				this.addEventListener('mouseover', this._overCB);
				this.addEventListener('mouseout', this._outCB);
			}
			else
			{
				this.cursor = null;
				this.removeEventListener('mousedown', this._downCB);
				this.removeEventListener('mouseover', this._overCB);
				this.removeEventListener('mouseout', this._outCB);
				this._isDown = this._isOver = false;
			}
			
			this._updateState();
		}
	});
	
	/**
	*  Whether or not the button is selected. Setting this only works if the button was given selected state when initialized.
	*  @public
	*  @property {Boolean} selected
	*  @default false
	*/
	Object.defineProperty(p, "selected", {
		get: function() { return this._isSelected; },
		set: function(value)
		{
			if(this._isSelectable)
			{
				this._isSelected = value;
				this._updateState();
			}
		}
	});
	
	/**
	*  Updates back based on the current button state.
	*  @private
	*  @method _updateState
	*/
	p._updateState = function()
	{
		if(!this.back) return;
		var data;
		if(!this._enabled)
			data = this._disabledRects;
		else if(this._isDown)
			data = this._downRects;
		else if(this._isOver)
			data = this._overRects;
		else if(this._isSelected)
			data = this._selectedRects;
		else
			data = this._upRects;
		this.back.scrollRect = data.src;
		if(data.trim)
		{
			this.back.x = data.trim.x;
			this.back.y = data.trim.y;
		}
		else
		{
			this.back.x = this.back.y = 0;
		}
	};
	
	/**
	*  [CreateJS only] The callback for when the button receives a mouse down event.
	*  @private
	*  @method _onMouseDown
	*/
	p._onMouseDown = function(e)
	{
		this._downEvent = e;
		this._downEvent.addEventListener('mouseup', this._upCB);
		this._isDown = true;
		this._updateState();
	};
	
	/**
	*  The callback for when the button for when the mouse/touch is released on the button
	*  - only when the button was held down initially.
	*  @private
	*  @method _onMouseUp
	*/
	p._onMouseUp = function(e)
	{
		this._downEvent.removeEventListener('mouseup', this._upCB);
		this._downEvent = null;
		this._isDown = false;
		this._updateState();
	};
	
	/**
	*  [CreateJS only] The callback for when the button is moused over.
	*  @private
	*  @method _onMouseOver
	*/
	p._onMouseOver = function(e)
	{
		this._isOver = true;
		this._updateState();
	};
	
	/**
	*  [CreateJS only] The callback for when the mouse leaves the button area.
	*  @private
	*  @method _onMouseOut
	*/
	p._onMouseOut = function(e)
	{
		this._isOver = false;
		this._updateState();
	};
	
	/**
	*  Destroys the button.
	*  @public
	*  @method destroy
	*/
	p.destroy = function()
	{
		this.removeAllChildren();
		this.removeAllListeners();
		this._upRects = null;
		this._overRects = null;
		this._downRects = null;
		this._disabledRects = null;
		this._selectedRects = null;
		this._downCB = null;
		this._upCB = null;
		this._overCB = null;
		this._outCB = null;
		if(this._downEvent)
		{
			this._downEvent.removeEventListener('mouseup', this._upCB);
			this._downEvent = null;
		}
		this.back = null;
		this.label = null;
	};

	namespace('cloudkid').Button = Button;
}());
(function() {
	
	/**
	*  [CreateJS only] Drag manager is responsible for handling the dragging of stage elements
	*  supports click-n-stick and click-n-drag functionality
	*  @class cloudkid.DragManager
	*/
	var DragManager = function(startCallback, endCallback)
	{
		this.initialize(startCallback, endCallback);
	};
	
	/** Reference to the drag manager */
	var p = DragManager.prototype = {};
		
	/**
	* The function call when finished dragging
	* @private
	* @property {function} _updateCallback 
	*/
	p._updateCallback = null;
	
	/**
	* The moust down event while draggin
	* @private
	* @property {createjs.MouseEvent} _mouseDownEvent 
	*/
	p._mouseDownEvent = null;
	
	/**
	* The object that's being dragged
	* @public
	* @readOnly
	* @property {createjs.DisplayObject} draggedObj
	*/
	p.draggedObj = null;
	
	/**
	* The local to global position of the drag
	* @private
	* @property {createjs.Point} _dragOffset
	*/
	p._dragOffset = null;
	
	/**
	* The radius in pixel to allow for dragging, or else does sticky click
	* @public
	* @property dragStartThreshold
	* @default 20
	*/
	p.dragStartThreshold = 20;
	
	/**
	* The position x, y of the mouse down on the stage
	* @private
	* @property {object} _mouseDownStagePos
	*/
	p._mouseDownStagePos = null;
	
	/**
	* Is the move touch based
	* @public
	* @readOnly
	* @property {Bool} isTouchMove
	* @default false
	*/
	p.isTouchMove = false;
	
	/**
	* Is the drag being held on mouse down (not sticky clicking)
	* @public
	* @readOnly
	* @property {Bool} isHeldDrag
	* @default false
	*/
	p.isHeldDrag = false;
	
	/**
	* Is the drag a sticky clicking (click on a item, then mouse the mouse)
	* @public
	* @readOnly
	* @property {Bool} isStickyClick
	* @default false
	*/
	p.isStickyClick = false;
	
	/**
	* Reference to the stage
	* @private
	* @property {createjsStage} _theStage
	*/
	p._theStage = null;
	
	/**
	* Callback when we start dragging
	* @private
	* @property {Function} _dragStartCallback
	*/
	p._dragStartCallback = null;
	
	/**
	* Callback when we are done dragging
	* @private
	* @property {Function} _dragEndCallback
	*/
	p._dragEndCallback = null;
	
	/**
	* Callback when we are done dragging holding drag
	* @private
	* @property {Function} _triggerHeldDragCallback
	*/
	p._triggerHeldDragCallback = null;
	
	/**
	* Callback when we are done width sticky clicking
	* @private
	* @property {Function} _triggerStickyClickCallback
	*/
	p._triggerStickyClickCallback = null;
	
	/**
	* Callback when we are done width sticky clicking
	* @private
	* @property {Function} _stageMouseUpCallback
	*/
	p._stageMouseUpCallback = null;
	
	/**
	* The collection of draggable objects
	* @private
	* @property {Array} _draggableObjects
	*/
	p._draggableObjects = null;
	
	/** 
	* Constructor 
	* @method initialize
	* @constructor
	* @param {function} startCallback The callback when when starting
	* @param {function} endCallback The callback when ending
	*/
	p.initialize = function(startCallback, endCallback)
	{
		this._updateCallback = this._updateObjPosition.bind(this);
		this._triggerHeldDragCallback = this._triggerHeldDrag.bind(this);
		this._triggerStickyClickCallback = this._triggerStickyClick.bind(this);
		this._stageMouseUpCallback = this._stopDrag.bind(this);
		this._theStage = cloudkid.OS.instance.stage;
		this._dragStartCallback = startCallback;
		this._dragEndCallback = endCallback;
		this._draggableObjects = [];
		this._mouseDownStagePos = {x:0, y:0};
	};
	
	/**
	*	Manually starts dragging an object. If a mouse down event is not supplied as the second argument, it 
	*   defaults to a held drag, that ends as soon as the mouse is released.
	*  @method startDrag
	*  @public
	*  @param {createjs.DisplayObject} object The object that should be dragged.
	*  @param {createjs.MouseEvent} ev A mouse down event to listen to to determine what type of drag should be used.
	*/
	p.startDrag = function(object, ev)
	{
		this._objMouseDown(ev, object);
	};
	
	/**
	* Mouse down on an obmect
	*  @method _objMouseDown
	*  @private
	*  @param {createjs.MouseEvent} ev A mouse down event to listen to to determine what type of drag should be used.
	*  @param {createjs.DisplayObject} object The object that should be dragged.
	*/
	p._objMouseDown = function(ev, obj)
	{
		// if we are dragging something, then ignore any mouse downs
		// until we release the currently dragged stuff
		if(this.draggedObj !== null) return;

		this.draggedObj = obj;
		createjs.Tween.removeTweens(this.draggedObj);
		
		this._dragStartCallback(this.draggedObj);
		
		//get the mouse postion in object space
		this._dragOffset = this.draggedObj.globalToLocal(ev.stageX, ev.stageY);
		
		//get that object space position and convert it to parent space
		this._dragOffset = this.draggedObj.localToLocal(this._dragOffset.x, this._dragOffset.y, this.draggedObj.parent);
		
		//move the offset to respect the object's current position
		this._dragOffset.x -= this.draggedObj.x;
		this._dragOffset.y -= this.draggedObj.y;
		
		if(!ev)//if we don't get an event (manual call neglected to pass one) then default to a held drag
		{
			this.isHeldDrag = true;
			this._startDrag();
		}
		else if(ev.nativeEvent.type == 'touchstart')//if it is a touch event, force it to be the held drag type
		{
			this.isTouchMove = true;
			this.isHeldDrag = true;
			this._startDrag();
		}
		else//otherwise, wait for a movement or a mouse up in order to do a held drag or a sticky click drag
		{
			this._mouseDownEvent = ev;
			this._mouseDownStagePos.x = ev.stageX;
			this._mouseDownStagePos.y = ev.stageY;
			this._mouseDownEvent.addEventListener("mousemove", this._triggerHeldDragCallback);
			this._mouseDownEvent.addEventListener("mouseup", this._triggerStickyClickCallback);
		}
	};
	
	/**
	* Start the sticky click
	* @method _triggerStickyClick
	* @private
	*/
	p._triggerStickyClick = function()
	{
		this.isStickyClick = true;
		this._mouseDownEvent.removeAllEventListeners();
		this._mouseDownEvent = null;
		this._startDrag();
	};

	/**
	* Start hold dragging
	* @method _triggerHeldDrag
	* @private
	* @param {createjs.MouseEvent} ev The mouse down event
	*/
	p._triggerHeldDrag = function(ev)
	{
		var xDiff = ev.stageX - this._mouseDownStagePos.x;
		var yDiff = ev.stageY - this._mouseDownStagePos.y;
		if(xDiff * xDiff + yDiff * yDiff >= this.dragStartThreshold * this.dragStartThreshold)
		{
			this.isHeldDrag = true;
			this._mouseDownEvent.removeAllEventListeners();
			this._mouseDownEvent = null;
			this._startDrag();
		}
	};

	/**
	* Internal start dragging on the stage
	* @method _startDrag
	* @private 
	*/
	p._startDrag = function()
	{
		this._theStage.removeEventListener("stagemousemove", this._updateCallback);
		this._theStage.addEventListener("stagemousemove", this._updateCallback);
		this._theStage.removeEventListener("stagemouseup", this._stageMouseUpCallback);
		this._theStage.addEventListener("stagemouseup", this._stageMouseUpCallback);
	};
	
	/**
	* Stops dragging the currently dragged object.
	* @public
	* @method stopDrag
	* @param {Bool} doCallback If the drag end callback should be called. Default is false.
	*/
	p.stopDrag = function(doCallback)
	{
		this._stopDrag(null, doCallback === true);//pass true if it was explicitly passed to us, false and undefined -> false
	};

	/**
	* Internal stop dragging on the stage
	* @method _stopDrag
	* @private 
	* @param {createjs.MouseEvent} ev Mouse up event
	* @param {Bool} doCallback If we should do the callback
	*/
	p._stopDrag = function(ev, doCallback)
	{
		if(doCallback !== false) // true or undefined
			this._dragEndCallback(this.draggedObj);
		
		if(this._mouseDownEvent !== null)
		{
			this._mouseDownEvent.removeAllEventListeners();
			this._mouseDownEvent = null;
		}
		this._theStage.removeEventListener("stagemousemove", this._updateCallback);
		this._theStage.removeEventListener("stagemouseup", this._stageMouseUpCallback);
		this.draggedObj = null;
		this.isTouchMove = false;
		this.isStickyClick = false;
		this.isHeldMove = false;
	};

	/**
	* Update the object position based on the mouse
	* @method _updateObjPosition
	* @private
	* @param {createjs.MouseEvent} e Mouse move event
	*/
	p._updateObjPosition = function(e)
	{
		if(!this.isTouchMove && !this._theStage.mouseInBounds) return;
		
		var mousePos = this.draggedObj.parent.globalToLocal(e.stageX, e.stageY);
		var bounds = this.draggedObj._dragBounds;
		this.draggedObj.x = clamp(mousePos.x - this._dragOffset.x, bounds.x, bounds.right);
		this.draggedObj.y = clamp(mousePos.y - this._dragOffset.y, bounds.y, bounds.bottom);
	};
	
	/**
	* Simple clamp function
	*/
	var clamp = function(x,a,b)
	{
		return (x < a ? a : (x > b ? b : x));
	};
	
	//=== Giving functions and properties to draggable objects objects
	var enableDrag = function()
	{
		this.addEventListener("mousedown", this._onMouseDownListener);
		this.cursor = "pointer";
	};
	
	var disableDrag = function()
	{
		this.removeEventListener("mousedown", this._onMouseDownListener);
		this.cursor = null;
	};
	
	var _onMouseDown = function(ev)
	{
		this._dragMan._objMouseDown(ev, this);
	};
	
	/** 
	* Adds properties and functions to the object - use enableDrag() and disableDrag() on 
	* objects to enable/disable them (they start out disabled). Properties added to objects:
	* _dragBounds (Rectangle), _onMouseDownListener (Function), _dragMan (cloudkid.DragManager) reference to the DragManager
	* these will override any existing properties of the same name
	* @method addObject
	* @public
	* @param {createjs.DisplayObject} obj The display object
	* @param {createjs.Rectangle} bound The rectangle bounds
	*/
	p.addObject = function(obj, bounds)
	{
		if(!bounds)
		{
			bounds = {x:0, y:0, width:this._theStage.canvas.width, height:this._theStage.canvas.height};
		}
		bounds.right = bounds.x + bounds.width;
		bounds.bottom = bounds.y + bounds.height;
		obj._dragBounds = bounds;
		if(this._draggableObjects.indexOf(obj) >= 0)
		{
			//don't change any of the functions or anything, just quit the function after having updated the bounds
			return;
		}
		obj.enableDrag = enableDrag;
		obj.disableDrag = disableDrag;
		obj._onMouseDownListener = _onMouseDown.bind(obj);
		obj._dragMan = this;
		this._draggableObjects.push(obj);
	};
	
	/** 
	* Removes properties and functions added by addObject().
	* @public
	* @method removeObject
	* @param {createjs.DisplayObject} obj The display object
	*/
	p.removeObject = function(obj)
	{
		obj.disableDrag();
		delete obj.enableDrag;
		delete obj.disableDrag;
		delete obj._onMouseDownListener;
		delete obj._dragMan;
		delete obj._dragBounds;
		var index = this._draggableObjects.indexOf(obj);
		if(index >= 0)
			this._draggableObjects.splice(index, 1);
	};
	
	/**
	*  Destroy the manager
	*  @public
	*  @method destroy
	*/
	p.destroy = function()
	{
		if(this.draggedObj !== null)
		{
			//clean up dragged obj
			this._mouseDownEvent.removeAllEventListeners();
			this._mouseDownEvent = null;
			this._theStage.removeEventListener("stagemousemove", this._updateCallback);
			this.draggedObj = null;
		}
		this._updateCallback = null;
		this._dragStartCallback = null;
		this._dragEndCallback = null;
		this._triggerHeldDragCallback = null;
		this._triggerStickyClickCallback = null;
		this._stageMouseUpCallback = null;
		this._theStage = null;
		for(var i = this._draggableObjects.length - 1; i >= 0; --i)
		{
			var obj = this._draggableObjects[i];
			obj.disableDrag();
			delete obj.enableDrag;
			delete obj.disableDrag;
			delete obj._onMouseDownListener;
			delete obj._dragMan;
			delete obj._dragBounds;
		}
		this._draggableObjects = null;
	};
	
	/** Assign to the global namespace */
	namespace('cloudkid').DragManager = DragManager;
}());
