if(!localstorage.dBoom){
	localstorage.dBoom = {};
	localstorage.dBoom.achievements = {
		"1000 goons": false, //killed 1000 goons in 1 round of free play
		"Lifetime 5000 goons": false, //killed over 5000 goons in total
		"Lifetime 10000 goons": false, //killed over 10000 goons in total
		"Close Call": false,
		"Living Dangerously": false
	}
}

function getAchievements(){
	if(!localstorage.achievements){
		localstorage.achievements = [
			
		]
	}
	return localstorage.achievements;
}


