//dBoom_goon.js

//handles loading and creation of goon objects


var createGoon = function(pos_x, pos_y, pos_d, speed, alive, frame, type){
	switch(type){
		case "warrior":
			var spriteset = getSpriteSet("warrior_move");
			var size = 64;
			break;
		case "legion100":
			var spriteset = getSpriteSet("legion_move_100");
			var size = 100;
			break;
	}
	var goon = {
		x: pos_x,
		y: pos_y,
		degrees: pos_d,
		v_x: Math.sin(pos_d),
		v_y: Math.cos(pos_d),
		speed: speed,
		alive: alive,
		frame: frame,
		radius: size/4,
		id: self.globalGuidCount,
		happiness: 0,
		turndirection: "",
		turncount: 0,
		consecutiveturn: 0,
		command: "move",
		commandLength: 0,
		commandQueue: new Array(),
		target: null,
		moveTarget: null,
		distanceFromGoal: null,
		dmg: 1,
		movecount: 0,
		ignoreGoons: 0,
		leniency: 0,
		spriteSet: spriteset,
		turn: function(){
			if(document.frameturn == 0){
				if(this.consecutiveturn > 10){
					this.leniency -= 4;
				}
				if (this.turncount > 32){ //turned full circle one way, gotta try a new way now
					var origdirection = this.turndirection;
					//this.turndirection = Math.random()*10<=5 ? "left" : "right";
					//left: true, right: false
					if(origdirection == true){
						this.turndirection = false;
					} else {
						this.turndirection = true;
					}
					this.turncount = 0;
				}
				if(this.turndirection == false){
					//keep turning right
					goonIncDeg(this, self.PI_1_16);
				} else if (this.turndirection == true){
					//keep turning left;
					goonIncDeg(this, -self.PI_1_16);
				}
				this.v_x = Math.sin(this.degrees);
				this.v_y = Math.cos(this.degrees);
				this.turncount++;
				this.consecutiveturn++;
			}
		},
		face: function(goal_x, goal_y){ //turn towards the goal_x and goal_y, returns true if face success
			var goal_degrees = 0;
			if(document.frameturn == 0){
				var delta_x = Math.abs(goal_x - this.x);
				var delta_y = Math.abs(goal_y - this.y);
				this.goal_x = goal_x;
				this.goal_y = goal_y;
				if(delta_x == 0){
					if(delta_y == 0){
						//we're already at the goal, face anywhere.
						goal_degrees = this.degrees;
						//console.log("already at goal, face "+this.degrees);
					} else{
						goal_degrees = (goal_y > this.y ? self.PI : 0);
						//console.log("295: goal degrees = "+goal_degrees);
					}
				} else {
					if(delta_y == 0){
						goal_degrees = (goal_x > this.x? self.PI_3_2 : self.PI_1_2);
						//console.log("300: goal degrees = "+goal_degrees);
					} else {
						//which is the goal then? let's find out using trig!
						/*var quot = delta_x / delta_y;
						if(quot){
							var tangent = Math.atan(quot);
							if(!tangent){
								//console.log("bad quot: "+quot);
							} else {
								//console.log("tangent: "+tangent);
							}
						} else {
							//console.log("error: (304) "+delta_x+", "+delta_y);
							console.log("error: "+delta_x+", "+delta_y);
						}*/
						var tangent = Math.atan(delta_x/delta_y);
						if(goal_x < this.x && goal_y > this.y){
							//between 0 and 90
							goal_degrees = tangent;
						} else if(goal_x < this.x && goal_y < this.y){
							//between 90 and 180;
							goal_degrees = alterdegrees(tangent, self.PI_1_2);
						} else if(goal_x > this.x && goal_y < this.y){
							//between 180 and 270;
							goal_degrees = alterdegrees(self.PI_3_2, -tangent);
						} else if(goal_x > this.x && goal_y > this.y){
							//between 270 and 360;
							goal_degrees = alterdegrees(self.PI_2, -tangent);
						}
						
					}
				}
				
				goal_degrees = alterdegrees(goal_degrees, 0);
				var angledif1 = angledifference(alterdegrees(this.degrees, self.PI_1_8), goal_degrees);
				var angledif2 = angledifference(alterdegrees(this.degrees, -self.PI_1_8), goal_degrees);
				if ( angledif1 < angledif2 ){
					if(angledif1 >= self.PI_1_8){
						goonIncDeg(this, self.PI_1_8);
					} else {
						this.degrees = goal_degrees;
					}
				} else {
					if(angledif2 > self.PI_1_8){
						goonIncDeg(this, -self.PI_1_8);
					} else {
						this.degrees = goal_degrees;
					}
				}
				
				this.v_x = Math.sin(this.degrees);
				this.v_y = Math.cos(this.degrees);
			}
			return (this.degrees == goal_degrees);
			
		},
		move: function(delta_x, delta_y){
			this.x += delta_x;
			this.y += delta_y;
			if(!this.x || !this.y){
				//console.log("error: "+delta_x+", "+delta_y);
			}
			if(this.x < 50 || this.y < 50){
				document.getElementById("errorlog").innerHTML = "error: "+delta_x+", "+delta_y;
			}
			//console.log(delta_x+", "+delta_y);
			this.consecutiveturn = 0;
			if(this.leniency < 0){
				this.leniency += 2;
			}
			for(var ind in self.triggerAreas){ //entered trigger area
				var t = self.triggerAreas[ind] ;
				var distance2 = calcDist2(this.x, this.y, t.x, t.y);
				if(distance2 <= t.r*t.r){
					switch(t.trigger.command){
						case "self-destruct":
							//blow up the goon and remove an HP
							this.alive = 0;
							if(t.trigger.type == "bomb"){
								self.targetZones.push(self.createTargetZone(t.x, t.y, t.r*4, 5, 3));
								self.triggerAreas.splice(ind, 1);
							} else if(t.trigger.type == "shrine"){
								self.targetZones.push(self.createTargetZone(t.x, t.y, t.r*1.25, 5, 3));
								
								self.triggerAreas.splice(ind, 1);
								self.decreaseShrine();
							} else if(t.trigger.type == "factory"){
								self.targetZones.push(self.createTargetZone(t.x, t.y, t.r*2, 5, 5));
								announce("FACTORY DESTROYED", 500);
								self.triggerAreas.splice(ind, 1);
								self.removeFactory();
							}
							
							break;
						case "face":
						//console.log(t);
						default:
							if(this.goal_x != t.trigger.x || this.goal_y != t.trigger.y && this.commandQueue[0] != "face"){
								//this.command="face";
								//addCommand(this, "face", 5, t.trigger.x, t.trigger.y);
								this.goal_x = t.trigger.x;
								this.goal_y = t.trigger.y;
								//console.log(this.id+" facing "+this.goal_x+", "+this.goal_y);
							}
						break;
						
							
					}
					break;
				} else if(distance2 <= t.r*2){
					switch(t.trigger.type){
						case "shrine":
						case "factory": //turn toward shrine and factories!
							if(this.goal_x != t.x || this.goal_y != t.y && this.commandQueue[0] != "face"){
								//this.command="face";
								//addCommand(this, "face", 5, t.trigger.x, t.trigger.y);
								this.goal_x = t.x;
								this.goal_y = t.y;
								//console.log(this.id+" facing "+this.goal_x+", "+this.goal_y);
							}
							break;
						/*case "bomb": //turn away from bomb
							addCommand(this, "face", 5, 2*this.x-t.trigger.x, 2*this.y-t.trigger.y);
							break;*/
					}
					
				}
				
			}
			
			//check goal
			if(Math.random() < 0.03){
				addCommand(this, "face", 5, t.trigger.x, t.trigger.y);
			}
			
		},
		damage: function (dmg){
			this.hp -= dmg;
			if(this.hp <= 0){
				this.alive = 0;
			}
		},
		changeSpriteSet: function(name){
			//changes the animation sprite; sets frame to 0.
			this.frame = 0;
			this.spriteSet = getSpriteSet(name);
		},		
		pathCollides: function(delta_x, delta_y, ignoreGoons){
			var start_x = this.x;
			var start_y = this.y;
			var end_x = this.x + delta_x;
			var end_y = this.y + delta_y;
			//how to determine if the path collides with something?
			
			var collision = false;
			if(ignoreGoons == false){
				var goon_radius = this.leniency+this.radius;
				var ignore_id = this.id
				collision = collidesGoon(end_x, end_y, goon_radius, ignore_id);
			}
			
			if(!collision){
				var goon_radius = this.radius+this.leniency;
				if(goon_radius < -300){
					console.log("goon_radius: "+goon_radius);
				}
				collision = collidesObstacle(end_x, end_y, goon_radius);
			}
			return collision;
			
			
			
		},
		draw: function(){
			var img = this.spriteSet.frames[this.frame];
			drawSprite (this.x, this.y, this.radius*4, this.degrees, img);
			
			
			
			if(debugOn){
				if(this.radius+this.leniency > 0){
					ctx.strokeStyle = "rgb(0, 255, 255)";
				} else {
					ctx.strokeStyle = "rgb(255, 0, 0)";
				}
				ctx.beginPath();
				ctx.arc(this.x, this.y, Math.abs(this.radius+this.leniency), 0, self.PI_2, false);
				ctx.lineWidth = 1;
				ctx.closePath();
				ctx.stroke();
			}
		},
		remove: function(goonlist){
			if (this.list){
				var goonlist = this.list;
			}
			for(var ind in goonlist){
				var g = goonlist[ind];
				if(g.id == this.id){
					goonlist.splice(ind, 1);
				}
			}
		},
		nextFrame: function(){
			this.frame = (this.frame+1) % (this.spriteSet.size-1);
		}
	}
	self.globalGuidCount++;
	return goon;
	
}

function processGoons(goon){
	if(goon.alive == 1){
		goon.movecount++;
		if(goon.commandLength > 0 && goon.command != "move"){
			switch(goon.command){
				case 'face':
					//console.log("facing: "+goon.goal_x+", "+goon.goal_y);
					if(goon.face(goon.goal_x, goon.goal_y)){
						goon.commandLength = 0; //finished!
						//console.log("goon: "+goon.id+" faced "+goon.goal_x+", "+goon.goal_y+" successfully!");
					} else {
						//console.log("goon: "+goon.id+" trying to face "+goon.goal_x+", "+goon.goal_y+"");
						goon.face(goon.goal_x, goon.goal_y);
					}
					
					//try moving anyway
					
					var delta_x = -goon.v_x*goon.speed/4;
					var delta_y = goon.v_y*goon.speed/4;
					
					if(!goon.pathCollides(delta_x, delta_y, (goon.ignoreGoons > 0))){
						goon.move(delta_x, delta_y);
					}
					
					goon.nextFrame();
					break;
				case "attack_face":
					if(goon.face(goon.target.x, goon.target.y)){
						goon.commandLength = 0; //finished!
					} else {
						goon.face(goon.target.x, goon.target.y);
						goon.commandLength --;
					}
					break;
				case "attack_strike":
					if(goon.commandLength > 0 && goon.spriteSet.name != "warrior_strike"){
						goon.changeSpriteSet("attack");
						goon.commandLength--;
						goon.target.damage(goon.dmg);
					}
					break;
				case "stepBack":
					//console.log(goon.id+" stepping back");
					var delta_x = goon.v_x*goon.speed/2;
					var delta_y = -goon.v_y*goon.speed/2;
					
					if(goon.pathCollides(delta_x, delta_y, (goon.ignoreGoons > 0))){
						goon.turn();
					} else {
						goon.move(delta_x, delta_y);
					}
					goon.nextFrame();
				break;
			}
			goon.commandLength --;
		} else {
			
			
			if(goon.command == "move"){ //move is a special command, there is no command length
				
				var delta_x = -goon.v_x*goon.speed/2;
				var delta_y = goon.v_y*goon.speed/2;
				if(!delta_x || !delta_y){
					//console.log("error: degrees = "+goon.degrees);
				}
				if(goon.pathCollides(delta_x, delta_y, (goon.ignoreGoons > 0))){
					goon.turn();
				} else {
					goon.move(delta_x, delta_y);
				}
				if(goon.ignoreGoons > 0){
					goon.ignoreGoons--;
				}
				
				goon.nextFrame();
			} else {
				//console.log(goon.command+", "+goon.commandLength)
			}
			
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
				addCommand(goon, "move", 0, -1, -1);
			}
		}
	}
}


var createSpriteSet = function(name, setSize, imgPath){
	var imgArr = [];
	for(var i = 0; i<setSize; i++){
		imgArr[i] = new Image();
		imgArr[i].src = imgPath+"_00"+(i < 5 ? "0" : "")+(i*2)+".png";
	}
	
	var spriteSet = {
		name: name,
		size: setSize,
		frames: imgArr
	}
	return spriteSet;
}

var getSpriteSet = function(name){
	for(var i in self.spriteSets){
		if(self.spriteSets[i].name == name){
			return self.spriteSets[i];
		}
	}
}

var setupGoons = function(){
	self.spriteSets = new Array();
	/*** Create Sprite Sets ***/
	self.spriteSets.push(createSpriteSet("warrior_move", 24, "img/skeleton_warrior/move/resized/s_w_torso_move"));
	self.spriteSets.push(createSpriteSet("warrior_attack", 13, "img/skeleton_warrior/attack/resized/s_w_sw_attack_01"))
	self.spriteSets.push(createSpriteSet("legion_move_100", 24, "img/skeleton_legion-100x100/s_l_walk_torso"));
}
	