var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var dice = require('./js/dice');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});
bot.on('message', function (user, userID, channelID, message, evt) {
	if (userID == bot.id) //Ignore ourselves
		return;
	
	 try {
		// Our bot needs to know if it will execute a command
		// It will listen for messages that will start with `!`
		
			var args = message.split(' ');
			var cmd = args[0];		   
			args = args.splice(1);
			
			switch(cmd) {					
					
				case '/calc':
					switch(args[0]) {
						case 'art': switch(args[1]){
								case 'xp': 
									var num = parseInt(args[2]);
									bot.sendMessage({
										to: channelID,
										message: '`It takes ' + (num * (num + 1) / 2) + ' XP to reach a score of ' + num + ' in an Art`'
									});	
									break;
								case 'score': 
									bot.sendMessage({
										to: channelID,
										message: "`" + args[2] + ' XP will grant a score of ' + Math.floor((Math.sqrt(8 * ( args[2]) + 1) - 1) / 2) + ' in an Art`'
									});	
									break
								default:
									bot.sendMessage({
										to: userID,
										message: 'available art calculations are *xp* or *score*'
									});	
									break;								
						}						
						break;
						case 'ability': switch(args[1]){
								case 'xp': 
									var num = parseInt(args[2]);
									bot.sendMessage({
										to: channelID,
										message: '`It takes ' + (5 * num * (num + 1) / 2) + ' XP to reach a score of ' + num + ' in an Ability`'
									});	
									break;
								case 'score': 
									bot.sendMessage({
										to: channelID,
										message: "`" + args[2] + ' XP will grant a score of ' + Math.floor((Math.sqrt(8 * (args[2] / 5) + 1) - 1) / 2) + ' in an Ability`'
									});	
									break
								default:
									bot.sendMessage({
										to: userID,
										message: 'available ability calculations are *xp* or *score*'
									});	
									break;								
						}						
						break;
						case 'xp': switch(args[1]){
								case 'art': 
									var num = parseInt(args[2]);
									bot.sendMessage({
										to: channelID,
										message: '`It takes ' + (num * (num + 1) / 2) + ' XP to reach a score of ' + num + ' in an Art`'
									});	
									break;
								case 'ability':
									var num = parseInt(args[2]);
									bot.sendMessage({
										to: channelID,
										message: '`It takes ' + (5 * num * (num + 1) / 2) + ' XP to reach a score of ' + num + ' in an Ability`'
									});	
									break;
								default:
									bot.sendMessage({
										to: userID,
										message: 'available experience calculations are *art* or *ability*'
									});	
									break;								
						}						
							break;
						case 'score': switch(args[1]){
								case 'art': 
									bot.sendMessage({
										to: channelID,
										message: "`" + args[2] + ' XP will grant a score of ' + Math.floor((Math.sqrt(8 * ( args[2]) + 1) - 1) / 2) + ' in an Art`'
									});	
									break;
								case 'ability':
									bot.sendMessage({
										to: channelID,
										message: "`" + args[2] + ' XP will grant a score of ' + Math.floor((Math.sqrt(8 * (args[2] / 5) + 1) - 1) / 2) + ' in an Ability`'
									});	
									break;
								default:
									bot.sendMessage({
										to: userID,
										message: 'available score calculations are *art* or *ability*'
									});	
									break;								
						}	
							break;
						default:
							bot.sendMessage({
								to: userID,
								message: "available calculations are *xp* and *score*"
							});		
							break;			
					}
				break;	
				
				case '/r':					
				case '/roll':
					var eval = dice.roll(args.join(), ''); 
					 
					bot.sendMessage({
						to: channelID,
						message: "```Result: " +  eval.val + "\n  Data:" +  eval.msg + "```"
					});	
				break;				
					
				case '/stress':
					var mod = '+0';
				
					if (args.length > 0 && (args[0].substring(0, 1) == '+' || args[0].substring(0, 1) == '-')){
						mod = args[0];
					}
					else if (args.length > 1 && (args[1].substring(0, 1) == '+' || args[1].substring(0, 1) == '-')){
						mod = args[0];						
					}
					
					
					var botch = 'b0';
				
					if (args.length > 0 && args[0].substring(0, 1) == 'b'){
						botch = args[0].substring(1);
					}
					else if (args.length > 1 && args[1].substring(0, 1) == 'b'){
						botch = args[0].substring(1);						
					}
				
					var eval = dice.roll('1dS' + botch + ' ' + mod , ''); 
					 
					bot.sendMessage({
						to: channelID,
						message: "```Result: " +  eval.val + "\n  Data:" +  eval.msg + "```"
					});	
				break;		
					
				case '/simple':
					var mod = args.length > 0 ? parseInt(args[0]) : 0;					
				
					var eval = dice.roll('1d10+' + mod , ''); 
					 
					bot.sendMessage({
						to: channelID,
						message: "```Result: " +  eval.val + "\n  Data:" +  eval.msg + "```"
					});	
				break;
			 }
		}
	catch(error){
		if (error.message){
			bot.sendMessage({
				to: 268938622227578880, //To me!
				message: error.message + "\n" + userID
			});					
		}
		console.log(error);
	}
});