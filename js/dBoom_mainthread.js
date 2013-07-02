

/* Create a context for which to make drawings for a canvas */
var createContext = function(theCanvas){
	if (theCanvas.getContext) {
		return theCanvas.getContext("2d");
	} else {
		return false;
	}
}

var eventHandler = function(){
	
	/**User Interface Controls**/
	$(self.fireButton).mousedown(function(event){
		//console.log("mousedown!");
		event.preventDefault();
		event.stopPropagation();
		//$(self.fireImg1).addClass("hide");
		//$(self.fireImg2).removeClass("hide");
		self.dBall.target();
		self.gameProcessor.postMessage({cmd:"target",self.dBall.x, self.dBall.y}); //start the processor!
		$(self.topborder).show();
		$(self.leftborder).show();
		$(self.rightborder).show();
		$(self.botborder).show();
		
		$(self.topborder).fadeOut(300);
		$(self.leftborder).fadeOut(300);
		$(self.rightborder).fadeOut(300);
		$(self.botborder).fadeOut(300);
	
	});
	
	window.document.addEventListener('touchmove', function(event){
		event.preventDefault();
		event.stopPropagation(); 
		window.scroll(0, 0);
		return false;
	}, false);
	/*
	window.addEventListener("devicemotion", function(event) {
		self.ax = event.accelerationIncludingGravity.x;
		self.ay = event.accelerationIncludingGravity.y;
	}, false);
	*/
	
	/**Game Processor Events**/
	self.gameProcessor.addEventListener('message', function(e) {
		var data = e.data;
		switch(data.cmd){
			case 'processStarted':
				self.backgroundProcess = true;
				console.log('process Started');
				break;
			case 'updateGoons':
				self.goons = data.goons;
				console.log(self.goons);
				break;
			case 'updateCursor':
				self.cursor = data.cursor;
				break;
		};
	}, false);
}

var mainloop = function(){
	//console.log("mainloop entered");
	if(self.active <= 10000){
		self.active++;
		flushCanvas();
	}
	self.gameProcessor.postMessage({cmd:"updateAcceleration", ax:self.ax, ay:self.ay}); //start the processor!
	//console.log(self.active);
}

var goon = {
	clear: function(x, y){
		self.ctx.clearRect(x-30, y-30, 60, 60);
	},
	render:function(x, y, frame, degrees){
		var rads = DegRad(degrees);
		//ctx.save();
		var s = self.goonSize;
		self.ctx.translate(x, y);
		self.ctx.rotate(rads);
		if(self.spriteSet[frame]){
			ctx.drawImage(self.spriteSet[frame], -s/2, -s/2);
		} else {
			console.log("invalid: "+frame);
		}
		self.ctx.rotate(-rads);
		self.ctx.translate(-x, -y);
		
	}
}

var dBall = {
	draw: function(x, y, r, type){
		if(type == 1){
			self.ctx.beginPath();
			self.ctx.arc(x, y, r, DegRad(0), DegRad(359), false);
			self.ctx.closePath();
			self.ctx.stroke();
		}
	},
	clear: function(prev_x, prev_y, x, y, r){
		if(prev_x > 0 && prev_y > 0){
			self.ctx.clearRect(prev_x-r-20, prev_y-r-20, r*2+40,r*2+40);
		}
	}
}

var flushCanvas = function(){
	dBall.clear(self.cursor.prevx, self.cursor.prevy, self.cursor.x, self.cursor.y, self.cursor.r);
	for(var goon_index in self.goons){
		var goon = self.goons[goon_index];
		goon.clear(self.ctx);
	}
	
	for(var goon_index in self.goons){
		var goon = self.goons[goon_index];
		if(goon.alive == 1){
			goon.render(goon.x, goon.y, goon.frame, goon.degrees);
		}
	}
	
	dBall.draw(ball_x, ball_y, ball_r, ball_type);
}


var run = function(){
	var self = this;
	
	eventHandler();
	
	self.interval = self.setInterval("mainloop()", self.intervalAmount);

}

var dBoom = function(){
	//create the processor...
	self.gameProcessor = new Worker('js/dBoomProcessor.js');
	self.gameProcessor.postMessage({cmd:"start"}); //start the processor!
	
	//DOM Elements
	self.fireButton = document.getElementById("dFireButton");
	self.fireImg1 = document.getElementById("fire_button");
	self.fireImg2 = document.getElementById("fire_button2");
	
	self.topborder = $("#dTopBorder");
	self.leftborder = $("#dLeftBorder");
	self.rightborder = $("#dRightBorder");
	self.botborder = $("#dBotBorder");
	
	
	self.canvas = document.getElementById("dCanvas"); //the dimensions of the canvas is 800x500
	self.ctx = createContext(self.canvas);
	self.intervalAmount = 50;
	self.canvasWidth = 1024;
	self.canvasHeight = 600;
	
	//animation for walking goon
	self.spriteSet = new Array();
	for (var ind = 0; ind < 24; ind++){
		self.spriteSet[ind] = new Image();
		self.spriteSet[ind].src = "img/skeleton_archer/s_a_move_torso_00"+(ind < 5 ? "0" : "")+(ind*2)+".png";;
	}
	
	//the cursor
	self.cursor = {prev_x:0, prev_y: 0, x:self.canvasWidth/2, y:self.canvasHeight/2, r:30}; //the exact same as in dBoomProcessor.js
	
	run();
	//var t=setTimeout("run()",100); //slight delay so that the processor is created first
}


var restart = function(){
	var self = this;
	console.log("resetting");
	self.ctx.clearRect(0, 0, 800, 500);
	//self.clearInterval(self.interval);
	self = {};
	var gameBoard = dBoom();
}

/*$(document).ready(function(){
	var gameBoard = dBoom();
});*/

window.onload = function(){
	var gameBoard = dBoom();
	$("#reset_button").click(function(){
		restart();
	});
}