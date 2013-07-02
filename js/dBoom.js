

/* Create a context for which to make drawings for a canvas */
var createContext = function(theCanvas){
	if (theCanvas.getContext) {
		return theCanvas.getContext("2d");
	} else {
		return false;
	}
};

var lastCalledTime;
var fps;
		
var eventHandler = function(canvas){
	//THEORY: if there are less event listeners, does that mean there are less processes?
	
	if (window.DeviceMotionEvent && window.navigator.userAgent.indexOf("Firefox") < 0){ //we're not using firefox browser, which doesnt have devicemotion, but returns true for this anyway
		window.addEventListener("devicemotion", function(event) {
			if(self.gameTimer.state != "stopped" && self.gameTimer.state != "paused" ){
				self.ax = event.accelerationIncludingGravity.x;
				self.ay = event.accelerationIncludingGravity.y;
			}
				
		}, true);
		
		/**Different skills**/
		
		window.addEventListener("touchstart", function(e){
			switch(e.target.id){
				case "fire_cannon":
					if(self.gameTimer.state != "stopped" && self.gameTimer.state != "paused"  ){
						self.dBall.target("cannon");
					}
					break;
				case "place_bomb":
					if(self.gameTimer.state != "stopped" && self.gameTimer.state != "paused"  ){
						self.dBall.target("bomb");
					}
					break;
			}
		}, true);
		
		$("#place_sticky").click(function(event){
			event.preventDefault();
			event.stopPropagation();
			if(self.gameTimer.state != "stopped" && self.gameTimer.state != "paused"  ){
				self.dBall.target("sticky");
			}
		});
		
	} else {
		//using mouse
		$(canvas).mousemove(function(event){
			if(self.gameTimer.state != "stopped" && self.gameTimer.state != "paused"  ){
				var dif_x = Math.abs((event.pageX - self.dBall.x));
				var dif_y = Math.abs((self.dBall.y - event.pageY));
				if(dif_x > 50){
					if(event.pageX - self.dBall.x < 0){
						self.ax = -2.5;
					} else {
						self.ax = 2.5;
					}
				} else {
					self.ax = (event.pageX - self.dBall.x)/20;
				}
				 if(dif_y > 50){
					 if(self.dBall.y - event.pageY < 0){
						 self.ay = -2.5;
					 } else {
						 self.ay = 2.5;
					 }
				 } else {
					self.ay = (self.dBall.y - event.pageY)/20;
				 }
				
				
				self.mouseX = event.pageX;
				self.mouseY = event.pageY;
				//console.log(self.ax+", "+self.ay);
			}
		});
		
		$(window).keydown(function(event){
			if(self.gameTimer.state != "stopped" && self.gameTimer.state != "paused"  ){
				if(event.keyCode == 49){ // the 1 key
					self.dBall.target("cannon");
				} else if(event.keyCode == 50){ // the 2 key
					self.dBall.target("bomb");
				}
			}
		});
	}
	
	
	//ending the game
	$(self.endButton).click(function(event){
		event.preventDefault();
		event.stopPropagation();
		if (!self.endingSequence){
			self.forceEnd = true; //end the game by setting this value to true
			self.endingSequence = true;
			
			gameTimerExec("commenceStop");
		}
	});
	
	
	window.addEventListener('touchmove', function(event){
		event.preventDefault();
		event.stopPropagation();
		return false;
	}, false);
	

}

//mainloop for progressing the game; drawing will be done in paintloop
var mainloop = function(){
	document.frameturn = ((document.frameturn+1) % 3);
	if(!self.active){
		//end the game
		if(self.gameTimer.state == "paused" ){
			//pause the game
			
		} else if (self.gameTimer.state == "stopped" ){
			//end the game
			
		}
		self.clearInterval(self.interval);
	} else {
		if (!self.endingSequence){
			//check for end condition
			if(self.endCondition() == true){
				gameTimerExec("commenceStop");
			}
		}
		
		switch(self.gameMode){
			case "timed":
				if(self.gameTurns % 20 == 0){ //updating every 20 frames
					if (self.gameTimer.t > self.gameTimer.max){
						self.timeBox.html("Time Left: 0");
					} else {
						self.timeBox.html("Time Left: "+Math.round((self.gameTimer.max - self.gameTimer.t)/1000)+" fps: "+fps);
					}
				}
				break;
		}
		
		var goonsAlive = 0;
		for(var goon_index in self.goons){
			var goon = self.goons[goon_index];
			if(goon.alive == 1){
				goonsAlive++;
			}
			
			processGoons(goon);
		}
		
		for(var target_index in self.targetZones){
			var target = self.targetZones[target_index];
			target.process();
		}
		
		
		if(self.dBall){
			processdBall(self.ax, self.ay);
		}
		
		//adding more bombs
		if(self.gameTurns % 200 == 0 && self.factoryAlive && self.bombsLeft < 20){
			self.bombsLeft++;
			self.bombCounter.html(self.bombsLeft);
		}
		
		//see if we need to spawn more goons
		if(goonsAlive < 50 && !self.isSpawning){ //goonsAlive < 20
			var spawnIndex = Math.floor(Math.random()*self.spawnZones.length);
			
			/***create the goons***/
			self.isSpawning = true;
			var t = self.setTimeout("spawnGoons("+spawnIndex+")", self.spawnDelay);
			//spawnGoons(init_spawnZone);
		}
		
		self.gameTurns++;
	}
};

var paintloop = function(){
	if(!self.active){
		//end the game
		if(self.gameTimer.state == "paused" ){
			//pause the game
			
		} else if (self.gameTimer.state != "stopped" ){
			//end the game
			
		}
	} else {

		self.ctx.clearRect(0, 0, self.canvasWidth, self.canvasHeight);
		self.ctx.save();
		self.ctx.moveTo(100, 100);
		self.ctx.shadowColor = "white";
		self.ctx.shadowBlur = 10;
		self.ctx.lineTo(100 + 10, 100 - 20);
		self.ctx.strokeStyle = "rgba(0,120,1,0.5)";
		self.ctx.stroke();
		self.ctx.restore();
		
		var goonsAlive = 0;
		for(var goon_index in self.goons){
			var goon = self.goons[goon_index];
			if(goon.alive == 1){
				goon.draw();
			}
		}
		
		for(var target_index in self.targetZones){
			var target = self.targetZones[target_index];
			target.draw(self.ctx);
		}
		
		
		if(self.dBall){
			self.dBall.draw(self.ctx);
		}
		
		/*Drawing the obstacles and stuff*/
		
		for(var obstacle_index in self.obstacles){
			var obstacle = self.obstacles[obstacle_index];
			obstacle.draw(self.ctx);
		}
		
		for(var trigger_index in self.triggerAreas){
			var trigger = self.triggerAreas[trigger_index];
			if(trigger.trigger.type){
				trigger.draw(self.ctx);
			}
		}
		
		for(var spawn_index in self.spawnZones){
			var spawnzone = self.spawnZones[spawn_index];
			spawnzone.draw(self.ctx);
		}
		
		
		
		
	}
	if( self.gameTimer.state != "stopped" && self.gameTimer.state != "paused"  ){
		if(!lastCalledTime) {
			lastCalledTime = new Date().getTime();
			fps = 0;
		}
		delta = (new Date().getTime() - lastCalledTime)/1000;
		lastCalledTime = new Date().getTime();
		fps = 1/delta;
		
		self.mainAnimation = window.requestAnimFrame(paintloop);
	}
}
var drawSprite = function(x, y, r, degree, image){
	if(x >=50 && y >=50 && x <= self.canvas.width-50 && y <= self.canvas.height-50){
		self.ctx.save();
		self.ctx.translate(x,y);
		self.ctx.rotate(degree);
		if(image){
			self.ctx.drawImage(image, -r/2, -r/2);
		} else {
			//console.log(spriteSet[this.frame]);
		}
		//	ctx.fillRect(-s/2, -s/2, s, s); //debug: draw a rectangle instead of creating the image
		self.ctx.restore();
	} else {
		//console.log(goon);
	}
}

var insertImage = function(x, y, img, anim_time){
	$('body').append(img)
}

var createTargetZone = function(pos_x, pos_y, pos_r, f_time, x_time){
	if(self.hasSound){
		var sfx = document.createElement("audio");
		sfx.src = "sfx/grenade.mp3";
	}
	var zone = {
		x: pos_x,
		y: pos_y,
		r: pos_r,
		t: 0,
		f_time: f_time,
		x_time: x_time+f_time,
		id: self.globalGuidCount,
		goonsKilled: 0,
		sound: sfx,
		draw:function(ctx){
			if(this.t < f_time){
				ctx.fillStyle = "rgba(128, 0, 0, "+this.t/this.f_time*0.5+")";
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.r*this.f_time/this.x_time, 0, self.PI_2, false);
				ctx.closePath();
				ctx.fill();
			} else {
				ctx.fillStyle = "rgba(200, 200, 200, 0.7)";
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.t/this.x_time*this.r, 0, self.PI_2, false);
				ctx.closePath();
				ctx.fill();
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.t/this.x_time*this.r/4*3, 0, self.PI_2, false);
				ctx.closePath();
				ctx.fill();
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.t/this.x_time*this.r/2, 0, self.PI_2, false);
				ctx.closePath();
				ctx.fill();
			}
		},
		process:function(){
			if(this.t >= this.f_time){
				var goonlist = getGoonsInArea(this.x, this.y, this.t/this.x_time*(this.r+10));
				for(var ind_goon in goonlist){
					var g = goonlist[ind_goon];
					g.alive = 0;
				}
				
				this.goonsKilled+=goonlist.length;
				
			}
			if(this.t > this.x_time){
				/*points scaling and stats tracking*/
				if(this.goonsKilled == 1){
					self.currentPoints++;
					self.goonsKilled++;
				} else if(this.goonsKilled == 2){
					self.currentPoints+=3;
					self.goonsKilled+=2;
					self.doubleKills++;
					announce("DOUBLE KILL", 500);
				} else if(this.goonsKilled == 3) {
					self.currentPoints += 5;
					self.goonsKilled+=3;
					self.tripleKills++;
					announce("TRIPLE KILL", 500);
				} else if(this.goonsKilled == 4) {
					self.currentpoints += 8;
					self.goonsKilled+=4;
					self.quadraKills++;
					announce("QUADRAKILL", 500);
				} else if(this.goonsKilled >= 5) {
					self.currentPoints += (this.goonsKilled-4)*13;
					self.goonsKilled+=5;
					self.pentaKills++;
					self.goonsKilled+=goonlist.length;
					announce("PENTAKILL", 500);
				}
				self.pointsbox.html(self.currentPoints);
				
				this.remove(self.targetZones);
				goonlist = null; //remove this array, we don't need it anymore
			}
			this.t++;
			
		},
		remove: function(targetlist){
			for(var ind in targetlist){
				var t = targetlist[ind];
				if(t.id == this.id){
					targetlist.splice(ind, 1);
				}
			}
			this.sound = null;
		}
	};
	
	self.setTimeout(function(){var t = getTargetZone(zone.id); if(t && t.sound){t.sound.play();}}, f_time*20); // play the sound of the explosion
	self.globalGuidCount++;
	return zone;
	
}

var getTargetZone = function(id){
	var self = this;
	var ret;
	for (var t_ind in self.targetZones){
		var t = self.targetZones[t_ind];
		if (t.id == id){
			ret = t;
			break;
		}
	}
	return ret;
};

var createBoomBall = function(pos_x, pos_y, pos_r, f_time, x_time, c_time, b_time){
	
	var dBall = {
		x: pos_x,
		y: pos_y,
		r: pos_r,
		prev_x: -1,
		prev_y: -1,
		type: 1,
		s_x: 0,
		s_y: 0,
		f_time: f_time,
		x_time: x_time,
		c_time: c_time,
		b_time: b_time,
		t_c: 0,
		t_b: 0,
		draw: function(ctx){
			if(this.type == 1){
				ctx.save();
				ctx.lineWidth=2;
				//outer circle
				ctx.strokeStyle = "rgb(100, 100, 100)";
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.r, 0, self.PI_2, false);
				ctx.closePath();
				ctx.stroke();
				//inner circle
				ctx.strokeStyle = "rgb(100, 100, 100)";
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.r/2, 0, self.PI_2, false);
				ctx.closePath();
				ctx.stroke();
				
				//the crosshair
				ctx.strokeStyle = "rgb(250, 250, 250)";
				ctx.beginPath();
				ctx.moveTo(this.x, this.y-10);
				ctx.lineTo(this.x, this.y+10);
				ctx.closePath();
				ctx.stroke();
				
				ctx.beginPath();
				ctx.moveTo(this.x-10, this.y);
				ctx.lineTo(this.x+10, this.y);
				ctx.closePath();
				ctx.stroke();
				
				if(this.t_c != 0) {
					ctx.lineWidth = this.r/2
				
					ctx.strokeStyle = "rgba(150, 0, 0, 0.5)";
					ctx.beginPath();
					ctx.arc(this.x, this.y, this.r*3/4, -self.PI_1_2, self.PI_2*(this.t_c/this.c_time)-self.PI_1_2, true);
					ctx.stroke();
				}
				
				if(this.t_b != 0) {
					ctx.lineWidth = this.r/2
			
					ctx.strokeStyle = "rgba(0, 0, 150, 0.5)";
					ctx.beginPath();
					ctx.arc(this.x, this.y, this.r/4, -self.PI_1_2, self.PI_2*(this.t_b/this.b_time)-self.PI_1_2, true);
					ctx.stroke();
				}
				ctx.restore();
			}
		},
		clear: function(ctx){
			if(this.prev_x > 0 && this.prev_y > 0){
				//ctx.fillStyle="rgba(20, 30, 255, 0.2)";
				ctx.clearRect(this.prev_x-this.r-20, this.prev_y-this.r-30, this.r*2+40, this.r*2+60);
				
			}
		},
		target: function(type){
		
			if(this.t_c == 0 && type == "cannon"){
				if(self.hasSound){
					var sfx = document.createElement("audio");
					sfx.src = "sfx/cannon.mp3";
					sfx.play();
					sfx.addEventListener("ended", function(){
						sfx = null; //remove this sfx object
					});
				}
				self.targetZones.push(createTargetZone(this.x, this.y, this.r, this.f_time, this.x_time));
				this.t_c = this.c_time;
			}	
			
			if(this.t_b == 0 && type == "bomb"){
				if(self.bombsLeft > 0){
					self.triggerAreas.push(createTrigger(this.x, this.y, 16, {command:"self-destruct", x:this.x, y:this.y, type:"bomb", degree:0}));
					this.t_b = this.b_time;
					//update number of bombs left
					self.bombsLeft--;
					self.bombCounter.html(self.bombsLeft);
				}
			}
		},
		set: function(pos_x, pos_y){
			this.x = pos_x;
			this.y = pos_y;
		}
	};
	return dBall;
};


var angledifference = function(deg1, deg2){
	var dif = Math.abs(deg2 - deg1);
	if(dif > Math.PI){
		dif = Math.PI*2 - dif;
	}
	return dif;
};

function alterdegrees(degrees, delta){
	var newdeg = degrees + delta;
	if(newdeg >= self.PI_2){
		while (newdeg >= self.PI_2){
			newdeg -= self.PI_2;
		}
	} else if(newdeg < 0){
		while(newdeg < 0){
			newdeg += self.PI_2;
		}
	}
	return newdeg;
}

var calcDist = function(x1, y1, x2, y2){
	var d_x = x2 - x1;
	var d_y = y2 - y1;
	return Math.sqrt(d_x*d_x + d_y*d_y);
};

var calcDist2 = function(x1, y1, x2, y2){
	var d_x = x2 - x1;
	var d_y = y2 - y1;
	return d_x*d_x + d_y*d_y;
};

var posConflict = function(x, y, r){
	//console.log("checking conflicts of: "+x+", "+y);
	var end_x = x;
	var end_y = y;
	//how to determine if the coordinate collides with something?
	var collision = false;
	if(!r){
		var r = 60; //default val
	}
	
	collision = collidesGoon(x, y, r, null);
	if(!collision){
		//console.log("checking against obstacles");
		
		collision = collidesObstacle(end_x, end_y, r);
		
	}
	//console.log(collision);
	return collision;
			
}

var collidesBorder = function(o_x, o_y){
	var self = this;
	if(o_x < 50 || o_x > self.canvasWidth-50 || o_y < 50 || o_y > self.canvasHeight-50){ //edge of screen
		return true;
	} else {
		return false;
	}
}

var collidesObstacle = function (o_x, o_y, o_r){ //this checks border too
	var self = this;
	var collision = false;
	
	collision = collidesBorder(o_x, o_y);
	
	if(!collision){
		for(var ind in self.obstacles){ //obstacles (walls, terrain, etc)
			var ob = self.obstacles[ind];
			var d_x = Math.abs(o_x - ob.x);
			var d_y = Math.abs(o_y - ob.y);
		//	console.log(d_x+", "+d_y);
			if( d_x >= o_r + ob.r || d_y >= o_r + ob.r){
				//don't bother checking, the distance is going to be greater for sure
			} else {
				var dist2 = calcDist2(ob.x, ob.y, o_x, o_y);
				if( dist2 <= Math.pow(o_r+ob.r,2)){
					collision = true;
				}
			}
			if(collision)
				break;
		}
	}
	return collision;
};

var collidesGoon = function (o_x, o_y, o_r, ignore_id){
	var self = this;
	var collision = false;
	for(var ind in self.goons){
		var g = self.goons[ind];
		if (g.id != ignore_id){
			
			var dist2 = calcDist2(g.x, g.y, o_x, o_y);
			//console.log(dist);
			if( dist2 <= Math.pow(o_r+g.radius+g.leniency, 2)){
				collision = true;
				break;
			}
			if(collision == true)
				break;
		}
	}
	return collision;
};

var getGoonsInArea = function (o_x, o_y, o_r){
	var self = this;
	//console.log("params: "+o_x+", "+o_y+", "+o_r);
	var c_goons = new Array();
	for(var ind in self.goons){
		var g = self.goons[ind];
		if (g.alive == 1){
			var d_x = Math.abs(g.x - o_x);
			var d_y = Math.abs(g.y - o_y);
			//console.log(g.id+" : "+d_x+", "+d_y+" ~ "+o_r);
			if(d_x >= o_r || d_y >= o_r){
				//don't consider it
				
			} else {
				var dist2 = calcDist2(g.x, g.y, o_x, o_y);
				//console.log(dist);
				if( dist2 < o_r*o_r){
					c_goons.push(g);
				}
			}
		}
	}
	return c_goons;
};


function processdBall(ax, ay){
	self.dBall.prev_x = self.dBall.x;
	self.dBall.prev_y = self.dBall.y;
	
	//going over obstacles
	/*
	if (collidesObstacle(self.dBall.x, self.dBall.y, self.dBall.r)){
		ax = ax/4;
		ay = ay/4;
	}*/
	ax = (Math.abs(ax)<0.75) ? 0 : ax;
	ay = (Math.abs(ay)<0.75) ? 0 : ay;
	var sx = ax*2.5;
	var sy = ay*2.5;
	var end_x = self.dBall.x + sx;
	var end_y = self.dBall.y - sy;
	
	var change_x = !collidesBorder(end_x, self.dBall.y);
	var change_y = !collidesBorder(self.dBall.x, end_y);
	
	if(self.dBall.t_b > 0){
		self.dBall.t_b--;
	}
	
	if(self.dBall.t_c > 0){
		self.dBall.t_c--;
	}
	
	if(change_x){
		self.dBall.x = Math.round(end_x);
	}
	if(change_y){
		self.dBall.y = Math.round(end_y);
	}
	
	
	if(calcDist2(self.dBall.x, self.dBall.y, self.mouseX, self.mouseY) < Math.pow(self.dBall.r, 2)){
		self.ax = 0;
		self.ay = 0;
	}
	
	
}


var spawnGoons = function(spawnIndex){
	//var d = Date.parse(new Date());
	//console.log("spawnning at "+spawnIndex);
	var init_spawnZone = self.spawnZones[spawnIndex];
	if (init_spawnZone){
		var goonlist = new Array();
		for(var g_id in self.goons){
			var goon = self.goons[g_id];
			if(goon.alive == 1){
				goonlist.push(goon);
			}
		}
		
		self.goons = null; //remove the current list
		self.goons = goonlist; //add the new list
		
		for(var i = 0; i<3; i++){
			//var init_x = Math.round(Math.random()*1024);
			//var init_y = Math.round(Math.random()*500);
			var randX = Math.random();
			var randY = Math.random();
			var init_x = Math.round(randX*init_spawnZone.r*2)+init_spawnZone.x1;
			var init_y = Math.round(randY*init_spawnZone.r*2)+init_spawnZone.y1;
			var init_d = Math.round((randX+randY)*Math.PI);
			
			var init_speed = 3;
			var init_alive = 1;
			var init_frame = Math.round(randX*23);
			
			if(!posConflict(init_x, init_y)){
				
				if(randX<0){ //disabled for now
					var init_type = "legion100";
				} else {
					var init_type = "warrior";
				}
				
				var goon = createGoon(init_x, init_y, init_d, init_speed, init_alive, init_frame, init_type);
				self.goons.push(goon);
				//goon.list = self.goons;
			}
		}
		//var d2 = Date.parse(new Date());
		//console.log(d2-d);
		self.isSpawning = false;
	}
}

function goonIncDeg(goon, delta){
	if(!goon){
		//console.log('not a goon! ');
		//console.log(goon);
	}
	goon.degrees = IncDeg(goon.degrees, delta);
}

function IncDeg(degree, delta){
	degree+=delta;
	if(degree < 0){
		while(degree < 0){
			degree += self.PI_2;
		}
	} else if(degree >= self.PI_2){
		while(degree >= self.PI_2){
			degree -= self.PI_2;
		}
	}
	if(!degree){
		//console.log("error: 840 "+goon.degrees+", delta = "+delta);
	}
	return degree;
}

function addCommand(goon, cmd, cmdLength, goal_x, goal_y){
	//if goal_x and goal_y are negative, they are ignored
	//if the previous command has the same command, ignore
	if(goon.commandQueue.length > 0){
		if(goon.commandQueue[0].command != cmd){
			goon.commandQueue.unshift({
				command: cmd,
				commandLength: cmdLength,
				x:goal_x,
				y:goal_y
			});
		}
	} else {
		goon.commandQueue.unshift({
			command: cmd,
			commandLength: cmdLength,
			x:goal_x,
			y:goal_y
		});
	}
}

function decreaseShrine(amount){
	self.shrinesLeft--;
	//console.log("shrine decreased");
	self.shrinesLeftBox.html("shrines left: "+self.shrinesLeft);
}

function removeFactory(){
	self.factoryAlive = false;
	self.bombsLeft = 0;
	self.bombCounter.html("0");
}

//assert: when we hit run, we will load the game from fresh. everything needed for a round is reset. Everything.
function run(){
	var self = this;
	
	var map = loadmap(self.maplevel);
	self.endConditions = new Array();
	
	if(self.gameMode == "timed"){
		self.endConditions.push(function(){
			if(self.gameTimer.t >= self.gameTimer.max || self.forceEnd)
				return true;
			else 
				return false;
		});
	} else if(self.gameMode == "freeplay"){
		self.endConditions.push(function(){
			return self.forceEnd;
		});
	}
	
	//console.log(map);
	
	if(map.info.endCondition){
		//console.log("has Map Condition");
		//console.log(map.info.endCondition);
		self.endConditions.push(map.info.endCondition);
	}
	
	self.endCondition = function(){
		var ret = false;
		for(var i in self.endConditions){
			if(self.endConditions[i]() == true){
				ret = true;
			}
		}
		if(ret){
			//console.log("end condition true");
		}
		return ret;
	};
	
	var spawnIndex = Math.floor(Math.random()*self.spawnZones.length);
	
	/***remove the overlay***/
	self.shadowOverlay.addClass('hide');
	
	/***create the goons***/
	spawnGoons(spawnIndex);
	
	
	self.shrinesLeft = map.info.shrines;
	self.shrinesLeftBox.html("shrines left: "+self.shrinesLeft);
	
	self.factoryAlive = map.info.factory;
	
	/***game stats***/
	self.currentPoints = 0;
	self.goonsKilled = 0;
	self.doubleKills = 0;
	self.tripleKills = 0;
	self.quadraKills = 0;
	self.pentaKills = 0;
	
	self.pointsbox.html(self.currentPoints);
	
	self.active = true;
	
	self.bombsLeft = 5;
	self.bombCounter.html(self.bombsLeft);
	
	self.gameTurns = 0;
	if(self.hasSound && self.backgroundTrack != undefined){
		self.backgroundTrack.play();
	}
	
	gameTimerExec("start");
	self.mainAnimation = null;
	
	if(self.mainAnimation == null){
		self.mainAnimation = window.requestAnimFrame(paintloop);
		self.interval = self.setInterval("mainloop()", document.intervalAmount);
	}
}

function dBoom(){
	var self = this;
	
	self.canvas = document.getElementById("dCanvas"); //the dimensions of the canvas is 800x500

	self.canvas.width = Math.min(1200, window.innerWidth);
	self.canvas.height = Math.min(765, window.innerHeight - 35);
	
	$("#fire_cannon").css({"left":self.canvas.width-260,"top":self.canvas.height-58});
	$("#place_bomb").css({"left":self.canvas.width-130,"top":self.canvas.height-108});
	/***UI Components***/
	//self.fireButton = document.getElementById("dFireButton");
	//self.fireImg1 = document.getElementById("fire_button");
	//self.fireImg2 = document.getElementById("fire_button2");
	
	self.centerX = self.canvas.width/2;
	self.centerY = self.canvas.height/2;
	
	self.shadowOverlay = $("#shadowOverlay");
	
	self.pointsbox = $("#dPoints");
	self.timeBox = $("#dTime");
	self.shrinesLeftBox = $("#dShrinesLeft");
	self.bombCounter = $("#dBombCounter");
	
	//self.backgroundTrack = document.getElementById("backgroundMusic");
	
	self.hasSound = false;
	
	if(self.hasSound){
		self.backgroundTrack = new Audio();
		self.backgroundTrack.src = "sfx/Kalimba.mp3";
		self.backgroundTrack.load();
	}
	
	self.endButton = $("#gameEnd");
	self.pauseButton = $("#gamePause");
	
	self.ctx = createContext(self.canvas);
	self.spriteSet = new Array();
	self.goonSize = 40;
	self.active = false;
	document.intervalAmount = 20;
	self.canvasWidth = self.canvas.width;
	self.canvasHeight = self.canvas.height;
	
	document.frameturn = 0;
	
	self.mainDiv = document.getElementById("mainDiv");
	
	self.spawnDelay = 500;
	
	self.announceInProgress = false;
	
	self.forceEnd = false; //force end the game, for the End button
	
	self.gameTimer = gameTimerExec("create");
	
	//acceleration
	self.ax = 0;
	self.ay = 0;
	
	self.PI_1_2 = Math.PI/2;
	self.PI_1_8 = Math.PI/8;
	self.PI_1_16 = Math.PI/16;
	self.PI_1_24 = Math.PI/24;
	self.PI_1_4 = Math.PI/4;
	self.PI_3_2 = Math.PI*3/2;
	self.PI_2 = 2*Math.PI;
	self.PI = Math.PI;
	
	//setup the events
	eventHandler(self.canvas);
	
	//setup the goons
	setupGoons();
	
	self.maplevel = 2; //default map level
	
	setupRoundVars();
	//wait for the user to hit something on the main menu
	setupMainMenu();
	setupGameEndMenu();
	
}

var gameTimerExec = function(cmd){
	switch(cmd){
		case 'create':
			return {t:0, state:'stopped'};
			break;
		case 'start':
			self.gameTimer.t = 0;
			self.gameTimer.state = "running";
			self.gameTimer.interval = self.setInterval("gameTimerExec('run')", 100);
			//console.log("timer started");
			break;
		case 'run':
			self.gameTimer.t += 100;
			break;
		case 'pause':
			self.gameTimer.state = "paused";
			clearInterval(self.gameTimer.interval);
			break;
		case 'resume':
			self.gameTimer.interval = self.setInterval("gameTimerExec('run')", 100);
			break;
		case 'stop':
			self.gameTimer.state = "stopped";
			clearInterval(self.gameTimer.interval);
			self.clearInterval(self.interval);
			
			self.shadowOverlay.removeClass('hide');
			self.gameEndMenu.removeClass('hide');
			if (self.backgroundTrack){
				self.backgroundTrack.pause();
			}
			
			$("#totalPoints").html(self.currentPoints);
			$("#goonsKilled").html(self.goonsKilled);
			$("#doubleKills").html(self.doubleKills);
			$("#tripleKills").html(self.tripleKills);
			$("#quadraKills").html(self.quadraKills);
			$("#pentaKills").html(self.pentaKills);
			$("#shrinesLeft").html(self.shrinesLeft);
			//update achievements!
			var newAchievements = updateAchievements();
			
			$("#newAchievements").html("");
			$.each(newAchievements, function(ind, ach){
				$("#newAchievements").append(ach.elem);
			});
			
			for(var i in newAchievements){
				$("#newAchievements").append(newAchievments[i].elem);
			}
			
			self.goons = new Array();
			self.obstacles = new Array();
			self.triggerAreas = new Array();
			self.spawnZones = new Array();
			self.targetZones = new Array();
			
			self.currentPoints = 0;
			
			self.endingSequence = false;
			self.endConditions = new Array();
			break;
		case 'commenceStop':
			var stopgame = self.setTimeout("gameTimerExec('stop')", 1500);
			self.shadowOverlay.fadeIn(1500).removeClass("hide");
			if(self.hasSound){
				fadeOutBackgroundMusic(1500);
			}
			self.endingSequence = true;
			break;
		case 'commenceRun':
			var rungame = self.setTimeout("gameTimerExec('run')", 3000);
			gameCountDown(3);
			break;
	}
}

var fadeOutBackgroundMusic = function(time){
	//fades out the background music by turning down the volume over the specified time period
	var self = this;
	if (self.backgroundTrack.volume > 0.02 && time > 0){
		self.backgroundTrack.volume -= 0.02
	}
	
	var fader = self.setTimeout("fadeOutBackgroundMusic("+(time-30)+")", 30);
}

var gameCountDown = function(num){

}

var announce = function(string, time){
	var self = this;
	self.announceInProgress = true;
	$("#announcement").html(string);
	$("#announcement").fadeIn();
	self.centerItem("#announcement"); 	
	console.log(string);
	console.log($("#announcement"));
	self.setTimeout("$('#announcement').fadeOut(500); self.announceInProgress = false;", time);

};

var restart = function(){
	var self = this;
	console.log("restarting...");
	self.forceEnd = false;
	self.endingSequence = false;
	
	if(self.hasSound){
		self.backgroundTrack = null;
		self.backgroundTrack = new Audio();
		self.backgroundTrack.src = "sfx/Kalimba.mp3"; //reload the track;
	}
	self.shadowOverlay.addClass("hide").removeAttr("style");
	run();
};

var setupRoundVars = function(){
	var self = this;
	
	self.globalGuidCount = 0;
	
	self.currentPoints = 0;
	self.currentHP = 20;
	self.goons = new Array();
	self.obstacles = new Array();
	self.triggerAreas = new Array();
	self.spawnZones = new Array();
	self.targetZones = new Array();
	self.isSpawning = false;

	self.dBall = createBoomBall(400, 250, 45, 10, 15, 25, 50);
	
	self.bombsLeft = 5;
}

var setupMainMenu = function(){
	var self = this;
	self.mainMenu = $("#dMenu");
	self.newGame = $("#NewGame");
	self.timedGame = $("#TimedGame");
	
	//centering the main Menu
	centerItem(self.mainMenu);
	
	self.currentPoints = 0;
	
	self.mainMenu.click(function(event){
		console.log(event.target);
		console.log(event.target.id);
		switch(event.target.id){
			case "NewGame":
				
				self.mainMenu.addClass('hide');
				self.shadowOverlay.addClass('hide');
				self.gameMode = "freeplay";
				run();
				break;
			case "TimedGame":
				self.mainMenu.addClass('hide');
				self.shadowOverlay.addClass('hide');
				self.gameMode = "timed";
				self.gameTimer.max = 60000; //60s = 1 min round
				run();
				break;
			case "Achievements":
				self.mainMenu.addClass('hide');
				self.achievementsPane.removeClass('hide');
				break;
		}
	});
	
}

var centerItem = function(elem){
	var self = this;
	$(elem).css({
		"position":"absolute",
		"left":(self.canvas.width - $(elem).innerWidth()) / 2,
		"top":(self.canvas.height - $(elem).innerHeight()) / 2,
	});
}

var setupGameEndMenu = function(){
	var self = this;
	self.gameEndMenu = $("#dGameEndMenu");
	//centering the main Menu
	self.gameEndMenu.css({"top":(self.canvas.height - self.gameEndMenu.innerHeight()) / 2, "left":(self.canvas.width - self.gameEndMenu.innerWidth()) / 2});
	
	self.restartGame = $("#Restart");
	self.restartGame.click(function(event){
		console.log("clicked");
		self.gameEndMenu.addClass('hide');
		restart();
	});
}

//this function will initialize global events for controlling everything outside of the game itself - menus, high scores, etc.
var setupGameContainerControls = function(){
	
	
	
}

var updateAchievements = function(){
	var self = this;
	console.log("updating...");
	return [];
}

$(document).ready( function(){
	dBoom();
	var self = this;
	/*$("#reset_button").click(function(){
		restart();
	});*/
	//console.log(self);
});

window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     || 
            function( callback ){
              window.setTimeout(callback, 1000 / 60);
            };
  })();
