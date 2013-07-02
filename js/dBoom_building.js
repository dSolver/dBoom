//dBoom_goon.js

//handles loading and creation of goon objects


var createBuilding = function(pos_x, pos_y, pos_d, hp, pos_r, type){
	var building = {
		x: pos_x,
		y: pos_y,
		degrees: pos_d,
		hp: hp,
		maxhp: hp,
		currenthp: hp,
		frame: 0,
		radius: pos_r,
		id: self.globalGuidCount,
		spriteSet: getSpriteSet("building_"+type),
		draw: function(ctx){
			var img = getSprite(this.currenthp/this.maxhp);
			drawSprite (this.x, this.y, this.radius, this.degrees, img);	
		},
		process: function(){
			var AttackingGoons = getGoonsInArea(this.x, this.y, this.radius);
			if(this.hp > 0 && AttackingGoons.length > 0){
				for(var g_id in AttackingGoons){
					var goon = AttackingGoons[g_id];
					if (goon.currentCommand != "attack_face" || goon.currentCommand !="attack_strike"){
						addCommand(goon, "attack_face", 10, this.x, this.y);
						addCommand(goon, "attack_strike", 200, this.x, this.y);
					}
				}
			}
		},
		damage: function (dmg){
			this.hp -= dmg;
		}
	}
	
	self.globalGuidCount++;
	return building;
}

var setupGoons = function(){
	self.spriteSets = new Array();
	/*** Create Sprite Sets ***/
	self.spriteSets.push(createSpriteSet("warrior_move", 24, "img/skeleton_warrior/s_w_torso_move"));
}
	