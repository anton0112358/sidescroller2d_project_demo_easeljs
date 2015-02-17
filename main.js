"use strict";

var sidescroller_game = (function namespace(){
	// Constants section >>>
	
	var SCREEN_W; // set up when the page is loaded (to 95% of width of containing element)

	var SCREEN_H = 600;

	var B2D_SCALE = 30;
	
	// END Constants section <<<

	// Utility
	var Utility = (function()
	{
		var lg = function()
		{
			/*
			 * shortcut to console.log()
			 * prints all arguments to console
			 * first argument is used as a label for the rest
			 *
			 * each labeled group is enclosed into the colored delimiters
			 * >>> and <<< so it's easily distinguished. I found it helpful,
			 * if you don't let me know, or use something else
			 */
			console.log("%s %c %s", arguments[0], "background: #DAF2B1", ">>>");
			
			for(var i = 1; i < arguments.length; i++)
			{
				console.log("\t", arguments[i]);
			}
			console.log("%c<<<", "background: #DAF2B1");

		};

		var random_choice = function(probabilities, choices){
			/*
			   takes 2 arrays with elements at corresponding indexes
			   being choice and it's probability. picks random one.
			   choices are anything, probability is integer a, such that
			   probability of a choice is a/10. with a < 10, of course
			   and probabilities adding up to 10. 
			   Yes, it's not very good implementation (read: terrible), 
			   and since you noticed, now it's your job to improve it.

			*/

		   var blah = []; // can't think of a name

		   for(var i = 0; i < choices.length; i++){
			   for(var j = 0; j < probabilities[i]; j++){
				   blah.push(choices[i]);
			   }
		   }

		   var rand_index = Math.floor(Math.random() * blah.length);

		   return blah[rand_index];
		};

		

		return {
			lg: lg,
			random_choice: random_choice
		};
	})();
	var lg = Utility.lg; // for quicker access

	// Models section: >>>
	
	// Unlike controllers, which are allowed to support "private" methods,
	// models are not allowed to have that.
	
	var GameModel = new function(){ // main model

		this.stage;

		this.players = {};
	};

	var PlayerModel;

	var TerrainModel = new function(){

		this.terrain_queues = [
			[],
			[],
			[]
		];

	};

	var BackgroundModel;

	var HUDModel;

	var EnemyModel;

	var AssetModel = new function(){
		this.manifest = [ // defining resources to be loaded in bulk with preload.js
				{src: "greek_warrior.png", id: "greek_warrior"},
				//{src:, id:},
				{src: "middle_terrain.png", id:"middle_terrain"},
				{src: "bottom_terrain.png", id: "bottom_terrain"},
				{src: "grass.png", id: "grass"}
			]; 
			// TODO make adding resources easier? Automatic loading 
			// of everything from assets, automatic names etc.?

		this.shapes = {};

		this.bitmaps = {};

		this.animations = {};

	};


	// END Models section <<<

	// Controllers section: >>>
	
	var GameController = (function(){

		var update_all = function(){
			/*
			 * main function pretty much
			 * everyghing else is called from here every tick
			 */

			var cmds = KeyboardController.movement_commands();
			//$.each(cmds, lg);

			if(cmds.indexOf("right") > -1){
				// temporary
				lg("right");
				TerrainController.move_left(10);
			}


			TerrainController.generate_terrain();

			GameModel.stage.update();
		};

		var init_all = function(){

			AssetController.load_all();

			// this may need to move to either load_game or some sort of resizing function
			GameModel.stage = new createjs.Stage("display_canvas");
			GameModel.stage.canvas.width = SCREEN_W;
			GameModel.stage.canvas.height = SCREEN_H;


		};

		return {
			update_all: update_all,
			init_all: init_all
		};

	})();

	var WorldGenerationController = (function(){

		// move stuff from terrain controller here
		return {
		}
	})();

	var PhysicsController;

	var PlayerController;

	var EnemyController;

	var TerrainController = (function(){
		var LVL_PROB = [
			[7, 2, 1],
			[0, 7, 3],
			[0, 1, 9]
		]; // probabilities for each level; temporary!

		
		
		var retrieve_world_parameters = function(){};

		var generate_terrain = function(){
			/*
			   Load appropriate amount of the terrain ahead
			   Only a demo!!! must be made more sophisticated!
			*/


		var terrain_choices = ["grass", "middle_terrain", "bottom_terrain"];

		for(var i = 0; i < TerrainModel.terrain_queues.length; i++){
			//// for each level of terrain
			var slice_index = 0; //
			var terrain_queue =  TerrainModel.terrain_queues[i];

			for(var j = 0; j < terrain_queue.length; j++){
				// for each tile, if tile is ofscreen, delete it
				var tile = terrain_queue[j];
				if(tile.x < -100){
					GameModel.stage.removeChild(tile);
					slice_index += 1;
				   }
			   }

			if(slice_index > 0){
				terrain_queue = terrain_queue.slice(slice_index);
			}

			var last_tile = terrain_queue[terrain_queue.length - 1];
			var next_x = last_tile ? last_tile.x + 30 : -100;

			while(terrain_queue.length < 70){
					// while level queue isn't full

					var random_id = Utility.random_choice(LVL_PROB[i], terrain_choices);

					var rand_tile = AssetController.request_bitmap(random_id);

					//This must be it's own function and be greately generalized and standartized:
					rand_tile.regX = 0;
					rand_tile.regY = 30;
					rand_tile.y = 510 + 30*(i+1);
					rand_tile.x = next_x;
					next_x += 30;

					// this must be done in its own function, to keep track of everything
					// e.g. "z-index" of every element, etc.
					GameModel.stage.addChild(rand_tile); 

					terrain_queue.push(rand_tile);

			   }

			   
		   } // end for 


		}; //end generate_terrain

		var move_left = function(pixels){
			// TODO make better 
			for(var i = 0; i < TerrainModel.terrain_queues.length; i++){
					var queue = TerrainModel.terrain_queues[i];
					queue[0].x -= pixels;
					//$.each(queue, function(index){
						//var tile = queue[index];
						//tile.x -= pixels;
					//});
			}

		}; // end move_left

		return {
			generate_terrain: generate_terrain,
			move_left: move_left

		}
	})();

	var AssetController = (function(){
		/*
		   AssetController is in charge of setting up all bitmaps/animations/other resources
		   for everyone else.
	   */

		// use AssetController.loader.getResult("id_of_the_asset");
		var loader;



		var load_all = function(){

			/* TODO make model with the easily managed tables of resources which will be
			   added to the loader automatically
			*/

			var manifest = AssetModel.manifest;	


			loader = new createjs.LoadQueue(false); // loading resourses using preload.js
			loader.addEventListener("complete", handleComplete);
			loader.loadManifest(manifest, true, "./assets/art/");
		}

		var request_bitmap = function(id){
			// if id is invalid, throw meaningful exception?
			return new createjs.Bitmap(loader.getResult(id));
			// TODO research DisplayObject's caching. and maybe incorporate
		};

		var handleComplete = function(){

			// TODO VERY IMPORTANT!!! 
			createjs.Ticker.addEventListener("tick", GameController.update_all);
		};

		return {
			load_all: load_all,
			loader: loader,
			request_bitmap: request_bitmap
		};

	})();



	var KeyboardController = (function()
	{
		// TODO: does this section belong into the controller? >>>
		var keys = {};

		var TR_TABLES = // translation tables
		{
			code_to_name: {
				37: "left",
				38: "up",
				39: "right",
				40: "down"
			}
		}

		// <<< end TODO

		var get_active_commands = function(table){
			// get all commands associated with keys that are defined in the >table<,
			// and are currently pressed
			//
			// returns: array of commands
			
			var commands = [];
			
			$.each(table, function(key, cmd){
				if(keys[key]){
					commands.push(cmd);
				}
			});

			return commands;
		};

		// public:
		
		var keydown = function(event){
			keys[event.keyCode] = true;
		};

		var keyup = function(event){
			delete keys[event.keyCode];
		};


		var movement_commands = function(){
			return get_active_commands(TR_TABLES.code_to_name);
		};


		return {
			keydown: keydown,
			keyup: keyup,

			movement_commands: movement_commands

		};

	})();

	// END Controllers section <<<
	

	// Game initiation section: >>>
	
	var test = function(){
		//lg($('#display_canvas').height());
	};
	
	var load_game = function()
	{
		// Setting up events:

			// ticker: on each tick call GameController.update_all();
			createjs.Ticker.setFPS(30);

		//
			// keyboard input event: on each keyboard event call appropriate KeyboardController function
			document.onkeydown = KeyboardController.keydown;
			document.onkeyup = KeyboardController.keyup;

		//
			// on interrupt event: stop/pause ticker 

		// Setting up other stuff:
			// e.g setup canvas size
			

			SCREEN_W = $('#canvas_container').width(); // is dynamically set to pixel width of the containing element

			// possible resizing technique: 
			// http://www.fabiobiondi.com/blog/2012/08/createjs-and-html5-canvas-resize-fullscreen-and-liquid-layouts/

			
			//$('#debug_canvas').width(String(SCREEN_W) + "px");
			//$('#display_canvas').width(String(SCREEN_W) + "px");

			//$('#debug_canvas').height(String(SCREEN_H) + "px");
			//$('#display_canvas').height(String(SCREEN_H) + "px");

		// Initialize all game initial game data (assets, necessary variables, etc. 
			GameController.init_all();

		test();
	};

	var run = function()
	{
		// done this way to ensure that load_game's internals aren't accessible to the world:
		load_game();
	}; 
	
	return {run: run}; // expose function run to the world

})(); 
