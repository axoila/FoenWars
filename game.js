var game = new Game();

function init() {
	if(game.init())
		game.start();
}

function Game(){
    this.mode = 0; //0 is story | 1 in running | 2 is paused
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
                this.mode = 1;
        }
        if(KEY_STATUS.lmb){
            this.page++;
            KEY_STATUS.lmb = false;
        }
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

            Background.prototype.context = this.bgContext;
			Background.prototype.canvasWidth = this.bgCanvas.width;
			Background.prototype.canvasHeight = this.bgCanvas.height;

            return true;
        } else {
            return false;
        }
    }

    this.start = function(){
		animate();
	}
}


function Background(){
    this.image = imageRepository.background;
    this.context.drawImage(this.image, 0, 0);
	this.draw = function(newImage){
        if(this.image != newImage){
            console.log(newImage);
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

    game.tick();

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
	this.init = function(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
	this.speed = 0;
	this.canvasWidth = 0;
	this.canvasHeight = 0;

	this.draw = function(){};
}

var imageRepository = new function() {
    this.background = new Image();
    this.story1 = new Image();
    this.story2 = new Image();
    this.story3 = new Image();
    this.story3.onload = function() {
		window.init();
	}
    this.background.src = "imgs/background_programmer-art.png";
    this.story1.src = "imgs/backgroundstory1.png";
    this.story2.src = "imgs/backgroundstory2.png";
    this.story3.src = "imgs/backgroundstory3.png";
}

//ALL THINGS BELOW ARE MAGIC

// The keycodes that will be mapped when a user presses a button.
KEY_CODES = {
  32: 'space',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  77: 'm',
  78: 'n',
  89: 'y',
  82: 'r',
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
