//dBoom processor

self.addEventListener('message', function(e) {
	var data = e.data;
	switch(data.cmd){
		case 'start':
			self.start();
			self.postMessage({cmd:"processStarted"});
			break;
		case 'stop':
			self.stop();
			break;
		case 'getGoons':
			self.postMessage({cmd:"updateGoons",goons:self.goonsInfo});
			break;
		case 'getCursor':
			self.postMessage({cmd:"updateCursor",cursor:self.cursorInfo});
			break;
		case 'setIntervalAmount':
			self.intervalAmount = data.intervalAmount;
			break;
		case 'pause':
			self.pause();
			self.postMessage({cmd:"pause"});
			break;
	};
	
}, false);


//helper methods
var pause = function(){
	self.clearInterval(self.interval);
	//stop the timer and everything else below

}

var start = function(){
	

	self.goonSize = 40;
	self.active = 0;
	self.intervalAmount = 50;
	self.canvasWidth = 1024;
	self.canvasHeight = 600;

	self.globalGoonCount = 0;
	self.globalTriggerCount = 0;
	self.globalSpawnZoneCount = 0;
	self.globalTileCount = 0;
	
	//acceleration
	self.ax = 0;
	self.ay = 0;
	self.xmod = 0;
	self.ymod = 0;
	
	self.dBall = createBoomBall(self.canvasWidth/2, self.canvasHeight/2, 30);

	self.goons = new Array();
	self.goonsInfo = new Array();//array of objects {x:goon.x, y:goon.y, frame:goon.frame, degrees:goon.degrees}
	self.cursorInfo = {
		x:self.dBall.x,
		y:self.dBall.y,
		r:self.dBall.r,
		type:self.dBall.type
	};
	self.obstacles = new Array();
	self.triggerAreas = new Array();
	self.spawnZones = new Array();

	/***create the obstacles***/
	self.obstacles.push(createObstacle(289, 297, 40));
	self.obstacles.push(createObstacle(304, 262, 39));
	self.obstacles.push(createObstacle(313, 186, 36));
	self.obstacles.push(createObstacle(288, 119, 37));
	self.obstacles.push(createObstacle(263, 77, 45));
	self.obstacles.push(createObstacle(300, 153, 38));
	self.obstacles.push(createObstacle(312, 30, 40));
	self.obstacles.push(createObstacle(308, 227, 36));
	self.obstacles.push(createObstacle(360, 8, 25));
	
	self.obstacles.push(createObstacle(40, 193, 60));
	self.obstacles.push(createObstacle(22, 262, 57));
	self.obstacles.push(createObstacle(7, 581, 55));
	
	self.obstacles.push(createObstacle(562, 163, 41));
	self.obstacles.push(createObstacle(522, 197, 23));
	self.obstacles.push(createObstacle(645, 151, 55));
	self.obstacles.push(createObstacle(687, 91, 55));
	self.obstacles.push(createObstacle(674, 219, 35));
	self.obstacles.push(createObstacle(682, 27, 27));
	
	self.obstacles.push(createObstacle(968, 387, 68));
	self.obstacles.push(createObstacle(998, 279, 45));
	self.obstacles.push(createObstacle(963, 488, 72));
	self.obstacles.push(createObstacle(956, 591, 95));
	self.obstacles.push(createObstacle(1012, 225, 50));
	
	/***create the triggers***/
	self.triggerAreas.push(createTrigger(51, 70, 20, {command:"face", x:132, y:57}));
	self.triggerAreas.push(createTrigger(172, 65, 20, {command:"face", x:177, y:191}));
	self.triggerAreas.push(createTrigger(177, 191, 40, {command:"face", x:137, y:404}));
	self.triggerAreas.push(createTrigger(137, 404, 25, {command:"face", x:317, y:550}));
	
	self.triggerAreas.push(createTrigger(859, 0, 85, {command:"face", x:797, y:332}));
	self.triggerAreas.push(createTrigger(868, 159, 25, {command:"face", x:797, y:332}));
	self.triggerAreas.push(createTrigger(742, 147, 15, {command:"face", x:797, y:332}));
	self.triggerAreas.push(createTrigger(797, 332, 25, {command:"face", x:625, y:306}));
	
	/***create the spawn zones***/
	self.spawnZones.push(createSpawnZone(115, 81, 60));
	self.spawnZones.push(createSpawnZone(477, 63, 70));
	self.spawnZones.push(createSpawnZone(849, 152, 70));
	
	var spawnIndex = Math.floor(Math.random()*self.spawnZones.length);
	var init_spawnZone = self.spawnZones[spawnIndex];
	/***create the goons***/
	spawnGoons(init_spawnZone);
	
	self.interval = self.setInterval("mainloop()", self.intervalAmount);

}



var mainloop = function(){
	//console.log("mainloop entered");
	if(self.active > 10000){
		self.clearInterval(self.interval);
		if(confirm("Are you still there?")){
			self.interval = self.setInterval("mainloop()", self.intervalAmount);
			self.active = 0;
		}
	} else {
		
		self.active++;
		self.dBall.process(self.ax, self.ay, self.xmod, self.ymod);
		//updating cursorInfo object
		self.cursorInfo.prev_x = self.dBall.prev_x;
		self.cursorInfo.prev_y = self.dBall.prev_y;
		self.cursorInfo.x = self.dBall.x;
		self.cursorInfo.y = self.dBall.y;
		self.cursorInfo.r = self.dBall.r;
		self.cursorInfo.type = self.dBall.type;
		
		for(var goon_index in self.goons){
			var goon = self.goons[goon_index];
			if(goon.alive == 1){
				processGoons(goon);
				//updating goonsInfo object
				self.goonsInfo[goon_index].x = goon.x;
				self.goonsInfo[goon_index].y = goon.y;
				self.goonsInfo[goon_index].degrees = goon.degrees;
				self.goonsInfo[goon_index].frame = goon.frame;
			} else if(goon.alive == 0) {
				goon.remove(self.goons);
			}
		}
		//see if we need to spawn more goons
		if(self.goons.length < 3){
			var spawnIndex = Math.floor(Math.random()*self.spawnZones.length);
			var init_spawnZone = self.spawnZones[spawnIndex];
			/***create the goons***/
			spawnGoons(init_spawnZone);
		}
	}
	
}
//create a goon!
var createGoon = function(pos_x, pos_y, pos_d, speed, alive, frame){
	var goon = {
		x: pos_x,
		y: pos_y,
		degrees: pos_d,
		speed: speed,
		alive: alive,
		frame: frame,
		radius: 40,
		id: self.globalGoonCount,
		happiness: 0,
		turndirection: "",
		turncount: 0,
		consecutiveturn: 0,
		command: "move",
		commandLength: 0,
		commandQueue: new Array(),
		ignoreGoons: 0,
		leniency: 30,
		turn: function(){
			if(this.consecutiveturn > 36){
				this.leniency -= 2;
			}
			if (this.turncount > this.consecutiveturn*3){
				var origdirection = this.turndirection;
				//this.turndirection = Math.random()*10<=5 ? "left" : "right";
				if(origdirection == "left"){
					this.turndirection = "right";
				} else {
					this.turndirection = "left";
				}
				this.turncount = 0;
			}
			if(this.turndirection == "right"){
				//keep turning right
				this.incrementdegrees(10);
			} else if (this.turndirection == "left"){
				//keep turning left;
				this.incrementdegrees(-10);
			} else {
				//pick a direction at random!
				this.turndirection = Math.random() < 0.5 ? "left" : "right";
			}
			this.turncount++;
			this.consecutiveturn++;
		},
		face: function(goal_x, goal_y){
			var goal_degrees = 0;
			if(goal_x == this.x){
				if(goal_y == this.y){
					//we're already at the goal, face anywhere.
					goal_degrees = this.degrees;
				} else{
					goal_degrees = (goal_y > this.y ? 180: 0);
				}
			} else {
				if(goal_y == this.y){
					//we're above or below...
					goal_degrees = (goal_x > this.x? 270: 90);
				} else {
					//which is the goal then? let's find out using trig!
					var delta_x = Math.abs(goal_x - this.x);
					var delta_y = Math.abs(goal_y - this.y);
					
					if(goal_x < this.x && goal_y > this.y){
						//between 0 and 90
						//console.log("0 - 90");
						goal_degrees = RadDeg(Math.atan(delta_x / delta_y));
						
					} else if(goal_x < this.x && goal_y < this.y){
						//between 90 and 180;						
					//	console.log("90 - 180");
						goal_degrees = RadDeg(Math.atan(delta_y / delta_x))+90;
					} else if(goal_x > this.x && goal_y < this.y){
						//between 180 and 270;						
					//	console.log("180 - 270 ("+RadDeg(Math.atan(delta_y / delta_x))+")");
						goal_degrees = 270-RadDeg(Math.atan(delta_y / delta_x));
					} else if(goal_x > this.x && goal_y > this.y){						
						//between 270 and 360;
					//	console.log("270 - 360");
						goal_degrees = 360 - RadDeg(Math.atan(delta_x / delta_y));
					}
					
				}
			}
			goal_degrees = alterdegrees(goal_degrees, 0);
			if (angledifference(alterdegrees(this.degrees, 10), goal_degrees) < angledifference(alterdegrees(this.degrees, -10), goal_degrees)){
				if(angledifference(alterdegrees(this.degrees, 10), goal_degrees) > 10){
					this.incrementdegrees(10);
				} else {
					//console.log("diff: "+angledifference(alterdegrees(this.degrees, -10), goal_degrees));
					this.degrees = goal_degrees;
				}
			} else {
				if(angledifference(alterdegrees(this.degrees, -10), goal_degrees) > 10){
					this.incrementdegrees(-10);
				} else {
					//console.log("diff: "+angledifference(alterdegrees(this.degrees, -10), goal_degrees));
					this.degrees = goal_degrees;
				}
			}
			
			
		//	console.log("("+goal_x+", "+goal_y+") ("+this.x+", "+this.y+") currentdegrees: "+this.degrees+" : "+goal_degrees);
			return (this.degrees == goal_degrees);
			
		},
		move: function(delta_x, delta_y){
			this.x -= delta_x;
			this.y += delta_y;
			//console.log(delta_x+", "+delta_y);
			this.consecutiveturn = 0;
			this.leniency = 30;
			for(var ind in self.triggerAreas){ //entered trigger area
				var t = self.triggerAreas[ind] ;
				if(Math.abs(t.x - this.x) - 30 >= t.r){
					var dist = t.r;
				} else if(Math.abs(t.y - this.y) - 30 >= t.r){
					var dist = t.r;
				} else {
					var dist = calcDist(this.x, this.y, t.x, t.y)-30;
				}
				if(dist < t.r){
					//t.updateFlag = true;
					switch(t.command){
						case "face":
						default:
							if(this.goal_x != t.trigger.x || this.goal_y != t.trigger.y && this.command != "face"){
								//this.command="face";
								this.addCommand("face", 40, t.trigger.x, t.trigger.y);
								//console.log("facing "+this.goal_x+", "+this.goal_y);
							}
						break;
					}
					break;
				}
			}
		},
		incrementdegrees: function(delta){
			this.degrees+=delta;
			if(this.degrees < 0){
				this.degrees += 360;
			} else if(this.degrees >= 360){
				this.degrees -= 360;
			}
		},
		addCommand: function(cmd, cmdLength, goal_x, goal_y){
			//if goal_x and goal_y are negative, they are ignored
			this.commandQueue.unshift({
				command: cmd,
				commandLength: cmdLength,
				x:goal_x,
				y:goal_y
			});
		},
		pathCollides: function(delta_x, delta_y, ignoreGoons){
			var start_x = this.x;
			var start_y = this.y;
			var end_x = this.x - delta_x;
			var end_y = this.y + delta_y;
			//how to determine if the path collides with something?
			
			var collision = false;
			if(ignoreGoons == false){
				var goon_radius = this.leniency;
				var ignore_id = this.id
				collision = collidesGoon(end_x, end_y, goon_radius, ignore_id);
			}
			
			if(!collision){
				var goon_radius = this.leniency;
				collision = collidesObstacle(end_x, end_y, goon_radius);
			}
			return collision;
			
		},
		informCollision:function(delta_x, delta_y){
			var end_x = this.x - delta_x;
			var end_y = this.y + delta_y;
			
			for(var ind in self.goons){
				var g = self.goons[ind];
				if(g.x != this.x && g.y != this.y){
					var dist = calcDist(g.x, g.y, end_x, end_y);
					if( dist > this.leniency){
						g.addCommand("wait", 200, -1, -1);
						console.log("waitCount set");
					}
				}
			}
		},
		
		remove: function(goonlist){
			for(var ind in goonlist){
				var g = goonlist[ind];
				if(g.id == this.id){
					goonlist.splice(ind, 1);
				}
			}
		}
	}
	self.globalGoonCount++;
	return goon;
	
}
var createBoomBall = function(pos_x, pos_y, pos_r){
	var dBall = {
		x: pos_x,
		y: pos_y,
		r: pos_r,
		prev_x: -1,
		prev_y: -1,
		type: 1,
		process: function(ax, ay, xmod, ymod){
			this.prev_x = this.x;
			this.prev_y = this.y;
			
			var sx = ax*ax*(ax<0? -1: 1);
			var sy = ay*ay*1.5*(ay<0? -1: 1);
			var end_x = Math.round(this.x + sx);
			var end_y = Math.round(this.y - sy);
			
			
			var change_x = !collidesBorder(end_x, this.y);
			var change_y = !collidesBorder(this.x, end_y);
			
			if(change_x){
				this.x = end_x;
			}
			if(change_y){
				this.y = end_y;
			}
		},
		target: function(){
			var goonlist = getGoonsInArea(this.x, this.y, this.r);
			for(var ind_goon in goonlist){
				var g = goonlist[ind_goon];
				g.alive = 0;
			}
		}
	}	
	return dBall;
}
var createObstacle = function(pos_x, pos_y, pos_r){
	var obstacle = {
		x: pos_x,
		y: pos_y,
		r: pos_r,
		
	}
	return obstacle;
}

var createTrigger = function(pos_x, pos_y, pos_r, trigger_obj){
	var area = {
		x: pos_x,
		y: pos_y,
		r: pos_r,
		trigger: trigger_obj,
		id: self.globalTriggerCount,
		
	}
	self.globalTriggerCount++;
	return area;
}

var createSpawnZone = function(pos_x, pos_y, pos_r){
	var zone = {
		x: pos_x,
		y: pos_y,
		r: pos_r,
		x1: pos_x-pos_r,
		y1: pos_y-pos_r,
		x2: pos_x+pos_r,
		y2: pos_y+pos_r,
		id: self.globalSpawnZoneCount,
		pointIn: function(x, y){
			if(calcdist(x, y, this.x, this.y) <= this.r){
				return true;
			} else {
				return false;
			}
		}
	}
	self.globalSpawnZoneCount++;
	return zone;
}

var RadDeg = function(rad){
	return rad*180/Math.PI;
}

var DegRad = function(deg){
	return deg*Math.PI/180;
}

var angledifference = function(deg1, deg2){
	var dif = Math.abs(deg2 - deg1);
	if(dif > 180){
		dif = 360 - dif;
	}
	return dif;
}

var alterdegrees = function(degrees, delta){
	var newdeg = degrees + delta;
	if(newdeg >= 360){
		newdeg = newdeg % 360;
	} else if(newdeg < 0){
		while(newdeg < 0){
			newdeg += 360;
		}
	}
	return newdeg;
}

var calcDist = function(x1, y1, x2, y2){
	var d_x = x2 - x1;
	var d_y = y2 - y1;
	return Math.sqrt(d_x*d_x + d_y*d_y);
}

var posConflict = function(x, y){
	//console.log("checking conflicts of: "+x+", "+y);
	var end_x = x;
	var end_y = y;
	//how to determine if the coordinate collides with something?
	var collision = false;
	
	//console.log("checking against goons");
	for(var ind in self.goons){
		var g = self.goons[ind];
		
		var d_x = Math.abs(end_x - g.x);
		var d_y = Math.abs(end_y - g.y);
		if( d_x >= g.leniency || d_y >= g.leniency){
			//don't bother checking
		} else {
			var dist = Math.sqrt(d_x * d_x + d_y * d_y);
			if( dist < g.leniency){
				collision = true;
			}
		}
		if(collision == true)
			break;
	}
	
	if(!collision){
		//console.log("checking against obstacles");
		var goon_radius = 60;
		collision = collidesObstacle(end_x, end_y, goon_radius);
		
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
				var dist = calcDist(ob.x, ob.y, o_x, o_y) - ob.r;
				if( dist < o_r + ob.r){
					collision = true;
				}
			}
			if(collision == true)
				break;
		}
	}
	return collision;
}

var collidesGoon = function (o_x, o_y, o_r, ignore_id){
	var self = this;
	var collision = false;
	for(var ind in self.goons){
		var g = self.goons[ind];
		if (g.id != ignore_id){
			var d_x = Math.abs(g.x - o_x);
			var d_y = Math.abs(g.y - o_y);
			if(d_x >= o_r || d_y >= o_r){
			
			} else {
				var dist = calcDist(g.x, g.y, o_x, o_y);
				//console.log(dist);
				if( dist < o_r){
					collision = true;
					break;
				}
			}
			if(collision == true)
				break;
		}
	}
	return collision;
}

var getGoonsInArea = function (o_x, o_y, o_r){
	var self = this;
	//console.log("params: "+o_x+", "+o_y+", "+o_r);
	var c_goons = new Array();
	for(var ind in self.goons){
		var g = self.goons[ind];
		var d_x = Math.abs(g.x - o_x);
		var d_y = Math.abs(g.y - o_y);
		//console.log(g.id+" : "+d_x+", "+d_y+" ~ "+o_r);
		if(d_x >= o_r || d_y >= o_r){
			//don't consider it
			
		} else {
			var dist = calcDist(g.x, g.y, o_x, o_y);
			//console.log(dist);
			if( dist < o_r){
				c_goons.push(g)
			}
		}
	}
	return c_goons;
}

var processGoons = function(goon){

	if(goon.commandLength > 0 && goon.command != "move"){
		if(goon.command == "face"){
			if(goon.face(goon.goal_x, goon.goal_y)){
				goon.commandLength = 0; //finished!
			} else {
				goon.face(goon.goal_x, goon.goal_y);
			}
		} else if(goon.command == "attack"){
			//console.log("attacking");
		} else if(goon.command == "wait"){
			//console.log("waiting...");
		} else if(goon.command == "stepBack"){
			//console.log(goon.id+" stepping back");
			var delta_x = -Math.round(Math.sin(DegRad(goon.degrees))*goon.speed/2);
			var delta_y = -Math.round(Math.cos(DegRad(goon.degrees))*goon.speed/2);
			
			if(goon.pathCollides(delta_x, delta_y, (goon.ignoreGoons > 0), goon.leniency)){
				goon.turn();
			} else {
				goon.move(delta_x, delta_y);
			}
			goon.frame = ( goon.frame + 1) % 24;
		}	
		goon.commandLength --;
	} else {
		if(goon.commandQueue.length > 0){
			var cmd_obj = goon.commandQueue.pop();
			goon.command = cmd_obj.command;
			goon.commandLength = cmd_obj.commandLength;
			if(cmd_obj.x > 0 && cmd_obj.y > 0){
				goon.goal_x = cmd_obj.x;
				goon.goal_y = cmd_obj.y;
			}
		} else {
			//console.log(goon.id+" told to move");
			goon.addCommand("move", 0, -1, -1);
		}
		
		if(goon.command == "move"){ //move is a special command, there is no command length
			var delta_x = Math.round(Math.sin(DegRad(goon.degrees))*goon.speed/2);
			var delta_y = Math.round(Math.cos(DegRad(goon.degrees))*goon.speed/2);
			
			if(goon.pathCollides(delta_x, delta_y, (goon.ignoreGoons > 0), goon.leniency)){
				goon.turn();
			} else {
				goon.move(delta_x, delta_y);
			}
			if(goon.ignoreGoons > 0){
				goon.ignoreGoons--;
			}
			goon.frame = (goon.frame+1) % 24;
		}
	}
	
}

var spawnGoons = function(init_spawnZone){
	for(var i = 0; i<10; i++){
		//var init_x = Math.round(Math.random()*1024);
		//var init_y = Math.round(Math.random()*500);
		var init_x = Math.round(Math.random()*init_spawnZone.r*2)+init_spawnZone.x1;
		var init_y = Math.round(Math.random()*init_spawnZone.r*2)+init_spawnZone.y1;
		var init_d = Math.round(Math.random()*359);
		
		var init_speed = 3;
		var init_alive = 1;
		var init_frame = Math.round(Math.random()*23);
		var posfound = false;
		var tryCount = 0;
		while(!posfound && tryCount < 24){
			init_x = Math.round(Math.random()*init_spawnZone.r*2)+init_spawnZone.x1;
			init_y = Math.round(Math.random()*init_spawnZone.r*2)+init_spawnZone.y1;
			//console.log(init_x+", "+init_y);
			//console.log("checking position: ("+i+") "+init_x+", "+init_y);
			posfound = !posConflict(init_x, init_y);
			tryCount++;
		}
		if(tryCount >= 24){
			//console.log("no room. discarded");
		} else {
			var goon = createGoon(init_x, init_y, init_d, init_speed, init_alive, init_frame);
			self.goons.push(goon);
			self.goonsInfo.push({x:goon.x, y:goon.y, frame:goon.frame, degrees:goon.degrees});
		}
	}
}
var self = this;