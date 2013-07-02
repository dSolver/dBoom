//dBoom_map.js

var debugOn = false;

//handles loading and creation of all the maps

var bomb_image = new Image();
bomb_image.src = "img/map_tiles/bomb_0.png";

var shrine_image = new Image();
shrine_image.src = "img/map_tiles/shrine.png";

var factory_spriteset = [];
for(var i = 0; i<=20; i++){
	var factory_image = new Image();
	factory_image.src = "img/map_tiles/factory_"+i+".png";
	factory_spriteset[i] = factory_image;
}


var createMap = function(name, image, obstacles, spawns, triggers, info){
	var map = {
		name: name,
		image: image,
		obstacles: obstacles,
		spawns: spawns,
		triggers: triggers,
		info: info
	}
	var preload_image = new Image();
	return map;
}
var createObstacle = function(pos_x, pos_y, pos_r){
	var obstacle = {
		x: pos_x,
		y: pos_y,
		r: pos_r,
		draw: function(ctx){
			//ctx.save();
			if(debugOn){
			ctx.fillStyle = "rgb(255, 0, 0)";
			ctx.fillRect(this.x, this.y, 1,1);
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.r, 0, self.PI_2, false);
			ctx.lineWidth = 1;
			ctx.strokeStyle = "black";
			ctx.closePath();
			ctx.stroke();
			//ctx.restore();
			}
		}
	}
	return obstacle;
}
var createTrigger = function(pos_x, pos_y, pos_r, trigger_obj){
	var area = {
		x: pos_x,
		y: pos_y,
		r: pos_r,
		r2: pos_r*pos_r,
		trigger: trigger_obj,
		id: self.globalGuidCount,
		draw: function(ctx){
			//ctx.save();
			if(debugOn){
				ctx.fillStyle = "rgb(255, 0, 0)";
				ctx.fillRect(this.x, this.y, 1,1);
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.r, 0, self.PI_2, false);
				ctx.lineWidth = 1;
				ctx.strokeStyle = "blue";
				ctx.closePath();
				ctx.stroke();
			}
			switch(trigger_obj.type){
				case "shrine":
					ctx.save();
					ctx.translate(this.x,this.y);
					ctx.drawImage(shrine_image, -this.r, -this.r);
					ctx.restore();
					break;
				case "factory":
					ctx.save();
					ctx.translate(this.x,this.y);
					ctx.drawImage(factory_spriteset[self.bombsLeft], -this.r, -this.r);
					ctx.restore();
					break;
				case "bomb":
					ctx.save();
					ctx.translate(this.x, this.y);
					ctx.drawImage(bomb_image, -this.r/2, -this.r/2);
					ctx.restore();
			}
		},
		pointIn: function(x, y){
			var dist_2;
			if(Math.abs(this.x - x) >= this.r){
				dist2 = this.r2;
			} else if(Math.abs(this.y - y)>= this.r){
				dist2 = this.r2;
			} else {
				dist2 = calcDist2(x, y, this.x, this.y);
			}
			if(dist2 < this.r2){
				//t.updateFlag = true;
				return true;
			} else {
				return false;
			}
		
		}
	}
	self.globalGuidCount++;
	return area;
}

var createSpawnZone = function(pos_x, pos_y, pos_r){
	var zone = {
		x: pos_x,
		y: pos_y,
		r: pos_r,
		r2: pos_r*pos_r,
		x1: pos_x-pos_r,
		y1: pos_y-pos_r,
		x2: pos_x+pos_r,
		y2: pos_y+pos_r,
		id: self.globalGuidCount,
		draw: function(ctx){
			if(debugOn){
				ctx.fillStyle="rgba(20, 30, 255, 0.2)";
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.r, 0, self.PI_2, false);
				ctx.closePath();
				ctx.fill();
			}
		},
		pointIn: function(x, y){
			if(calcDist2(x, y, this.x, this.y) <= this.r2){
				return true;
			} else {
				return false;
			}
		}
	}
	self.globalGuidCount++;
	return zone;
}

var createTarget = function(pos_x, pos_y, pos_r, pos_deg, type, image){
	var target = {
		x:pos_x,
		y:pos_y,
		r:pos_r,
		r2: pos_r*pos_r,
		degrees:pos_deg,
		type:type,
		image:image,
		draw: function(ctx){
			ctx.save();
			ctx.translate(this.x, this.y);
			ctx.rotate(this.degrees);
			ctx.drawImage(this.image, -this.r, -this.r);
			ctx.restore();
		}
	}
	
}

var loadmap = function(maplevel){
	var self = this;
	//clear any old map information
	self.obstacles = [];
	self.spawnZones = [];
	self.triggerAreas = [];
	
	
	var map = self.mapArray[maplevel];

	var map = self.mapArray[maplevel];
	if (!map.info){
		map.info = {};
	}
	
	self.canvas.style.backgroundImage = "url("+map.image+")"; //set the background image
	
	
	for(var ind in map.obstacles){
		var obs = map.obstacles[ind];
		if (obs.x+obs.r < self.canvasWidth && obs.y+obs.r < self.canvasHeight && obs.x-obs.r/2 > 0 && obs.y-obs.r/2 > 0){
			self.obstacles.push(createObstacle(obs.x, obs.y, obs.r));
		}
	
	}
	
	for(var ind in map.spawns){
		var spawn = map.spawns[ind];
		if (spawn.x+spawn.r/2 < self.canvasWidth && spawn.y+spawn.r/2 < self.canvasHeight && spawn.x-spawn.r/2 > 0 && spawn.y-spawn.r/2 > 0){
			self.spawnZones.push(createSpawnZone(spawn.x, spawn.y, spawn.r));
		}
	}
	
	map.info.shrines = 0;
	map.info.factory = false;
	for(var ind in map.triggers){
		var trigger = map.triggers[ind];
		if (trigger.x+trigger.r < self.canvasWidth && trigger.y+trigger.r < self.canvasHeight && trigger.x-trigger.r/2 > 0 && trigger.y-trigger.r/2 > 0){
			self.triggerAreas.push(createTrigger(trigger.x, trigger.y, trigger.r, {command:trigger.commandObj.cmd, x:trigger.commandObj.x, y:trigger.commandObj.y, type:trigger.commandObj.type, degree:trigger.commandObj.degree}));
			if(trigger.commandObj.type == "shrine"){
				map.info.shrines++;
			} else if(trigger.commandObj.type == "factory"){
				map.info.factory = true;
			}
		}
	}
	
	
	return map;
}



self.mapArray = [];

//level0
self.mapArray.push(createMap(
	"level0",
	"img/map_01.jpg",
	[ //obstacles: {x, y, r}
		{x:48, y:27, r:185},
		{x:516, y:301, r:50},
		{x:200, y:0, r:160},
		{x:42, y:544, r:120},
		{x:177, y:553, r:60},
		{x: 955, y:549, r:70},
		{x: 852, y: 573, r:42},
		{x:1003, y:467, r:30}
	
	],
	[ //spawns: {x, y, r}
		{x:66, y:312, r:50},
		{x:900, y:100, r:80},
		{x:410, y:450, r:70}
	],
	[ //triggers:{x, y, r, commandObj:{cmd, x, y}}
		{x:66, y:312, r:30, commandObj:{cmd:"face", x:512, y:300}},
		{x:66, y:255, r:15, commandObj:{cmd:"face", x:512, y:300}},
		{x:350, y:443, r:50, commandObj:{cmd:"face", x:920, y:201}},
		{x:520, y:100, r:30, commandObj:{cmd:"face", x:920, y:201}},
		{x:220, y:324, r:45, commandObj:{cmd:"face", x:520, y:100}},
		{x:415, y:50, r:30, commandObj:{cmd:"face", x:920, y:201}}
	],
	{}
));

//level1
self.mapArray.push(createMap(
	"level1",
	"img/map_02.jpg",
	[ //obstacles: {x, y, r}
		{x: 246, y:283, r: 60},
		{x: 576, y: 389, r: 58},
		{x: 701, y: 340, r: 64},
		{x: 820, y: 356, r: 60},
		{x: 485, y: 36, r: 60},
		{x: 743, y: 458, r: 60},
		{x: 867, y: 449, r: 57},
		{x: 762, y: 534, r: 39},
		{x: 589, y: 645, r: 60},
		{x: 612, y: 755, r: 60},
		{x: 496, y: 536, r: 40},
		{x: 741, y: 763, r: 40},
		{x: 1168, y: 785, r: 60},
		{x: 331, y: 482, r: 40},
		{x: 157, y: 408, r: 40},
		{x: 322, y: 156, r: 40},
		{x: 760, y: 241, r: 40},
		{x: 702, y: 196, r: 40},
		{x: 1009, y: 155, r: 35},
		{x: 991, y: 126, r: 35},
		{x: 964, y: 91, r: 35},
		{x: 959, y: 32, r: 33},
		{x: 974, y: 1, r: 40},
		{x: 1166, y: 191, r: 35},
		{x: 1194, y: 190, r: 35}
	],
	[ //spawns
		{x: 68, y: 129, r: 120},
		{x: 1136, y: 52, r: 150},
		{x: 1123, y: 552, r: 85},
		{x: 452, y: 701, r: 80},
		{x: 759, y: 18, r: 100}
	],
	[ //triggers
		{x:488, y:285, r:64, commandObj:{cmd:"self-destruct", type:"factory", degree:50}},
		{x:488, y:285, r:64, commandObj:{cmd:"self-destruct", type:"shrine", degree:70}},
		{x:77, y:525, r:64, commandObj:{cmd:"self-destruct", type:"shrine", degree:180}},
		{x:554, y:190, r:16, commandObj:{cmd:"self-destruct", type:"bomb", degree:90}}
	],
	{ //special information
		endCondition:function(){
			return (self.shrinesLeft <= 0);
		}
	}
));
	
	

//level2
self.mapArray.push(createMap(
	"level2",
	"img/map_03.jpg",
	[ //obstacles: {x, y, r}
		{x: 139, y: 377, r: 40},
		{x: 449, y: 275, r: 35},
		{x: 704, y: 401, r: 50},
		{x: 741, y: 267, r: 35},
		{x: 920, y: 343, r: 35},
		{x: 836, y: 142, r: 50},
		{x: 1160, y: 253, r: 50},
		{x: 139, y: 377, r: 40},
		{x: 911, y: 26, r: 35},
		{x: 1025, y: 646, r: 50},
		{x: 1188, y: 610, r: 50},
		{x: 367, y: 373, r: 40},
		{x: 357, y: 298, r: 45},
		{x: 489, y: 208, r: 30},
		{x: 763, y: 753, r: 40},
		{x: 1165, y: 280, r: 50},
		{x: 1010, y: 494, r: 35},
		{x: 792, y:552, r:50},
		{x: 1163, y:249, r: 50}
	],
	[ //spawns
		{x: 388, y: 443, r: 60},
		{x: 432, y: 510, r: 65},
		{x: 549, y: 507, r: 50},
		{x: 472, y: 521, r: 70}
	],
	[ //triggers
		{x:137, y:110, r:64, commandObj:{cmd:"self-destruct", type:"factory", degree:50}},
		{x:725, y:184, r:64, commandObj:{cmd:"self-destruct", type:"shrine", degree:70}},
		{x:472, y:521, r:90, commandObj:{cmd:"face", x:725, y:184}}
	],
	{ //special information
		endCondition:function(){
			return (self.shrinesLeft <= 0);
		}
	}
));
	
	