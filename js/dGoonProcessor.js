//Goon processor


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
		render:function(ctx, spriteSet){
			var rads = DegRad(this.degrees);
			//ctx.save();
			var s = self.goonSize;
			ctx.translate(this.x, this.y);
			ctx.rotate(rads);
			if(spriteSet[this.frame]){
				ctx.drawImage(spriteSet[this.frame], -s/2, -s/2);
			} else {
				console.log("invalid: "+this.frame);
				//console.log(spriteSet[this.frame]);
			}
			//ctx.fillRect(-s/2, -s/2, s, s); //debug: draw a rectangle instead of creating the image
			ctx.rotate(-rads);
			ctx.translate(-this.x, -this.y);
			//ctx.restore();
			
		},
		clear: function(ctx){
			ctx.clearRect(this.x-30, this.y-30, 60, 60);
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

var self = this;