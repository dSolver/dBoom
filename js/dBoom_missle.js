//dBoom_missile.js

var createMissile = function(pos_x, pos_y, pos_r, pos_degree, spriteSet, path_r, cw  ){
	
	var missile = {
		x:pos_x,
		y:pos_y,
		r:pos_r,
		degree:pos_degree,
		pr:path_r,
		clockwise:cw,
		state:"attached",
		speed: 5,
		spriteSet: spriteSet,
		frame: 0,
		move:function(){
			switch (state){
				case "attached":
					this.degree = IncDeg(this.degree, speed);
					var delta_x = Math.sin(this.degrees)*this.speed/2;
					var delta_y = Math.cos(this.degrees)*this.speed/2;
				break;
			}
		},
		draw:function(){
			var img = this.spriteSet[this.frame];
			if(img){
				drawSprite(this.x, this.y, this.r, this.degree, img);
			}
			
		}
		
	}
	
}

