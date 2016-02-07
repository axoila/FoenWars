var game = new Game();

function init() {
	if(game.init())
		game.start();
}

function Game(){
    this.mode = 0; // 0 is intro // 1 is menu // 2 is play // 3 is paused // 4 is init play
	this.stuntime = 2;
    this.enemies = [];
    this.init = function() {
        if(this.setupCanvases()){
            this.background = new Background();
            return true;
        }
        return false;
    }

    this.tick = function(delta){
        switch(this.mode){
            case 0:
                this.intro();
                break;
			case 2:
				this.play(delta);
				break;
			case 4:
				this.initPlay();
        }
    }

    this.intro = function(){
        if(this.page == undefined)
            this.page = 0;
        switch(this.page){
            case 0:
                this.background.draw(imageRepository.story1);
                break;
            case 1:
                this.background.draw(imageRepository.story2);
                break;
            case 2:
                this.background.draw(imageRepository.story3);
                break;
            default:
                this.mode = 4;
        }
        if(KEY_STATUS.lmb){
            this.page++;
            KEY_STATUS.lmb = false;
        }
    }

	this.initPlay = function(){
		this.mode = 2;
		this.enemySpawnFrequency = 0.2;
		this.enemySpawnCounter = 0;
		this.enemies = [];
		Enemy.prototype.context.clearRect(0, 0, Enemy.prototype.contextWidth, Enemy.prototype.contextHeight);
		this.background.draw(imageRepository.background);
	}

 	this.play = function(delta){
		if(this.stunned == undefined)
			this.stunned = 0;
		//enemy spawning
		this.enemySpawnCounter+=delta;
		if(this.enemySpawnCounter>=1/this.enemySpawnFrequency){
			this.enemySpawnCounter =0;
			var newEnemy = new Enemy();
			newEnemy.walkImages = imageRepository.enemy1;
			newEnemy.dieImages = imageRepository.enemy1death;
			newEnemy.init();
			this.enemies.push(newEnemy);
			console.log("spawned enemy");
		}

		//first calculate the new enemy position without redrawing anything
		this.stunned -= delta;
		if(this.stunned<=0){//stuff for the arrows
			var button = -1;
			if(KEY_STATUS.up)
				button=0;
			if(KEY_STATUS.right)
				button=1;
			if(KEY_STATUS.down)
				button=2;
			if(KEY_STATUS.left)
				button=3;
			var combo = 0;
			this.enemies.forEach(function(enemy){
				if(enemy.arrows[0] != undefined && button == enemy.arrows[0].direction){
					enemy.arrows[enemy.arrows.length-1].clear(enemy.arrows.length-1);
					enemy.arrows.shift();
					combo++;
					KEY_STATUS.up = KEY_STATUS.right = KEY_STATUS.down = KEY_STATUS.left = false;
				}
			});
			if(combo == 0 && button != -1){
				this.stunned = this.stuntime;
				console.log("wrong button, stunning performance!")
			}
		}
		this.enemies.forEach(function(enemy){
			enemy.update(delta);
		});
		/*first clear all enemies, then draw them again, so they are off
		the screen for as short of a time span as possible*/
		this.enemies.forEach(function(enemy){
			enemy.clear();
		});
		this.enemies.forEach(function(enemy){
			enemy.draw();
		});
	}

    this.setupCanvases = function(){
        this.bgCanvas = document.getElementById('background');
		this.enemyCanvas = document.getElementById('enemies');
		this.playerCanvas = document.getElementById('player');
		this.hudCanvas = document.getElementById('hud');

        if(this.bgCanvas.getContext){
            this.bgContext = this.bgCanvas.getContext('2d');
			this.enemyContext = this.enemyCanvas.getContext('2d');
			this.playerContext = this.playerCanvas.getContext('2d');
			this.hudContext = this.hudCanvas.getContext('2d');

            Background.prototype.setContext(this.bgContext);
			Enemy.prototype.setContext(this.enemyContext);
			Arrow.prototype.setContext(this.enemyContext);

            return true;
        } else {
            return false;
        }
    }

    this.start = function(){
		animate();
	}
}

function Enemy() {
	this.speed = 1;
	this.x = 1300;
	this.y = 400;
	this.width = 128;
	this.height = 256;
	this.moveSpeed = 30; //speed at whick the enemy walks towards you (in px/sec)
	this.animCycle = 0; //used for decaying and walkcycle
	this.animFreqency = 2.5;//how often the image switches in fps
	this.animDeathFreqency = 1;//how often the image switches in fps
	this.alive = true; //is the enemy alive?
    this.walkImages = [];
	this.dieImages = [];
	this.image = imageRepository.no;

	this.arrowAmount = 10;
	this.arrows = [];

	this.clear = function() {
		this.context.clearRect(this.x, this.y, this.width+1, this.height);
		for(i=0;i<this.arrows.length;i++){
			this.arrows[i].clear(i);
		}
	};
	this.draw = function() {
        this.context.drawImage(this.image, this.x, this.y, this.width, this.height );
		for(i=0;i<this.arrows.length;i++){
			this.arrows[i].draw(i);
		}
	};
	this.update = function(delta) {
		//ANIMATING
		/*init animcounter (timing for the switching around)
		and imageIndex (the index in the index array)*/
		if(this.animCounter == undefined)
			this.animCounter = 0;
		if(this.imageIndex == undefined)
			this.imageIndex = 0;
		this.animCounter += delta;

		if(this.animCounter>=1/(this.animFreqency*this.speed) && this.alive){ //go to next image when tick
			this.imageIndex++;
			this.animCounter = 0;
			if(this.imageIndex>=this.walkImages.length) //reset index when it gets over the top
				this.imageIndex = 0;
			if(this.walkImages.length > 0) //set new image - if the image list is not empty
				this.image = this.walkImages[this.imageIndex];
		}
		if(this.animCounter>=1/this.animDeathFreqency && !this.alive){ //go to next image when tick
			this.imageIndex++;
			this.animCounter = 0;
			if(this.imageIndex>=this.dieImages.length){ //when the death animation is over the enemy gets deleted
				game.enemies.splice(game.enemies.indexOf(this), 1);
				this.clear();
				console.log(this.dieImages);
			}
			if(this.dieImages.length > 0) //set new image - if the image list is not empty
				this.image = this.dieImages[this.imageIndex];
		}
		if(this.alive && this.arrows.length == 0){
			this.alive = false;
			this.animCycle = 0;
			this.imageIndex = 0;
			this.image = this.dieImages[this.imageIndex];
			this.animCounter = 9999;
		}

		//MOVEMENT
		if(this.alive)
			this.x -= Math.min(this.moveSpeed * delta, 1);
	};
	this.init = function() {
		for(i=0;i<this.arrowAmount;i++){
			var newArrow = new Arrow();
			newArrow.enemy = this;
			this.arrows.push(newArrow);
		}
	}
}
Enemy.prototype = new Drawable();

function Arrow() {
	this.width = 64;
	this.height = 64;
	this.enemy;
	this.direction = Math.floor(Math.random()*4); //generate the arrow direction
		//0 is up, 1 is right, 2 is down, 3 is left
	switch(this.direction){
		case 0:
			this.image = imageRepository.upArrow;
			break;
		case 1:
			this.image = imageRepository.rightArrow;
			break;
		case 2:
			this.image = imageRepository.downArrow;
			break;
		case 3:
			this.image = imageRepository.leftArrow;
			break;
	}
	this.draw = function(index){
		this.context.drawImage(imageRepository.arrows[this.direction], this.enemy.x+32, this.enemy.y-96-index*96, this.width, this.height );
	}
	this.clear = function(index){
		this.context.clearRect(this.enemy.x+32, this.enemy.y-96-index*96, this.width+1, this.height );
	}
}
Arrow.prototype = new Drawable();

function Background(){
    this.image = imageRepository.background;
    this.context.drawImage(this.image, 0, 0);
	this.draw = function(newImage){
        if(this.image != newImage){
            //console.log(newImage);
            this.image = newImage;
			this.context.drawImage(this.image, 0, 0);
		}
	}
}
Background.prototype = new Drawable();

var lastUpdate = Date.now();
function animate(){
	now = Date.now();
	delta = (now - lastUpdate)/1000;
	delta = Math.min(delta, 0.1);
	//console.log(delta);
	lastUpdate = now;

    game.tick(delta);

	requestAnimFrame(animate);
}

window.requestAnimFrame = (function(){ //this makes the frames..... somehow
	return  window.requestAnimationFrame   ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame    ||
			window.oRequestAnimationFrame      ||
			window.msRequestAnimationFrame     ||
			function(/* function */ callback, /* DOMElement */ element){
				window.setTimeout(callback, 1000 / 60);
			};
})();


function Drawable(){
	this.setContext = function(context){
		this.context = context;
		this.canvasWidth = context.width;
		this.canvasHeight = context.height;
	}
}

var imageRepository = new function() {
    this.background = new Image();
	this.no = new Image();
	this.enemy1 = [new Image(), new Image(), new Image(), new Image()];
	this.enemy1death = [new Image(), new Image(), new Image()];
	this.arrows = [new Image(), new Image(), new Image(), new Image()];
    this.story1 = new Image();
    this.story2 = new Image();
    this.story3 = new Image();
    this.story3.onload = function() {
		window.init();
	}
    this.background.src = "imgs/background_programmer-art.png";
	this.no.src = "imgs/NO.png";
	this.enemy1[0].src = "imgs/enemyWalk1.png";
	this.enemy1[1].src = "imgs/enemyWalk2.png";
	this.enemy1[2].src = "imgs/enemyWalk3.png";
	this.enemy1[3].src = "imgs/enemyWalk4.png";
	this.enemy1death[0].src = "imgs/enemyDeath1.png";
	this.enemy1death[1].src = "imgs/enemyDeath2.png";
	this.enemy1death[2].src = "imgs/enemyDeath3.png";
	this.arrows[0].src = "imgs/upArrow.png";
	this.arrows[1].src = "imgs/rightArrow.png";
	this.arrows[2].src = "imgs/downArrow.png";
	this.arrows[3].src = "imgs/leftArrow.png";
	this.story1.src = "imgs/backgroundstory1.png";
    this.story2.src = "imgs/backgroundstory2.png";
    this.story3.src = "imgs/backgroundstory3.png";
}


//ALL THINGS BELOW ARE MAGIC

// The keycodes that will be mapped when a user presses a button.
KEY_CODES = {
  32: 'lmb', //spacebar
  38: 'up',
  37: 'left',
  40: 'down',
  39: 'right',
  87: 'up',
  65: 'left',
  83: 'down',
  68: 'right',
  27: 'esc',
  0: 'lmb',
  2: 'rmb',
}
/* Creates the array to hold the KEY_CODES and sets all their values
// to false. Checking true/flase is the quickest way to check status
// of a key press and which one was pressed when determining
// when to move and which direction. */
KEY_STATUS = {};
for (code in KEY_CODES) {
KEY_STATUS[ KEY_CODES[ code ]] = false; }
	/** * Sets up the document to listen to onkeydown events
	(fired when * any key on the keyboard is pressed down).
	 When a key is pressed, * it sets the appropriate direction
	 to true to let us know which * key it was. */
document.onkeydown = function(e) {
	 // Firefox and opera use charCode instead of keyCode to
	 // return which key was pressed.
	 var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
	 if (KEY_CODES[keyCode]) {
		e.preventDefault();
		KEY_STATUS[KEY_CODES[keyCode]] = true;
	}
}
	 /** * Sets up the document to listen to ownkeyup events
	 (fired when * any key on the keyboard is released). When a key
	 is released, * it sets teh appropriate direction to false to let
	 us know which * key it was. */
document.onkeyup = function(e) {
	 var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
	 if (KEY_CODES[keyCode]) {
		 e.preventDefault();
		 KEY_STATUS[KEY_CODES[keyCode]] = false;
	 }
}

document.onmousedown = function(e){
    if (KEY_CODES[e.button]) {
        e.preventDefault();
        KEY_STATUS[KEY_CODES[e.button]] = true;
    }
}
document.onmouseup = function(e){
    if (KEY_CODES[e.button]) {
        e.preventDefault();
        KEY_STATUS[KEY_CODES[e.button]] = false;
    }
}
