function makeSeq(endIndex){
	var seq = [];
	seq[endIndex] = true;
	for(var i = 0; i < seq.length; i++){
		seq[i] = true;
	}
	return seq;
};

var ops = {

	'static': function(){
		var outValue = this.value;
		return function(){
			return {val: outValue, msg: outValue};
		};
	},

	'lookup': function(){
		var variableName = this.value;
		return function(scope){
			var undef;
			var out = scope[variableName];
			if(out != undef){
				return out;
			}
			var split = variableName.split('.');
			if(variableName == split){
				return out;
			}
			reduceRes = split.reduce(function(acc, elem){
				if(acc == undef){
					return;
				}
				return acc[elem];
			}, scope);
			return reduceRes;
		}
	},

	'floor': function(value){
		return function(scope){
			var floorable = value(scope);
			var tots = new Number(Math.floor(floorable));
			tots.op = 'floor';
			tots.expression = floorable;
			return tots;
		}
	},

	'ceil': function(value){
		return function(scope){
			var ceilable = value(scope);
			var tots = new Number(Math.ceil(ceilable));
			tots.op = 'ceil';
			tots.expression = ceilable;
			return tots;
		}
	},

	'round': function(value){
		return function(scope){
			var roundable = value(scope);
			var tots = new Number(Math.round(roundable));
			tots.op = 'round';
			tots.expression = roundable;
			return tots;
		}
	},

	'd': function(numFunc, facesFunc, arg3func){
		return function(scope){
			var num = numFunc(scope);
			var faces = facesFunc(scope);
			var arg3;
			if (arg3func)
				arg3 = arg3func(scope);
			var total = 0;
			var msg = "";
			
			for(var i = 0; i < num.val; i++){				
				var rndNumber;
				if (faces.val == 'Stress'){
					rndNumber = Math.round(9 * Math.random());
					var botches = 0;
					var mult = 1;
					
					if (rndNumber == 0 && arg3.val > 0){
						msg = msg + ", [";						
						for(var j = 0; j < arg3.val; j++) {
							rndNumber = Math.round(9 * Math.random());
							if(rndNumber == 0)
								botches++;
							msg = msg + rndNumber;
						}
						
						msg = msg + "]->";
					}
					else if (rndNumber == 1){
						msg = msg + ", {1";
						rndNumber = Math.round(9 * Math.random()) + 1;
						mult = 2;
						
						while (rndNumber == 1){
							rndNumber = Math.round(9 * Math.random()) + 1;
							mult *= 2;
							msg = msg + ",1";
						}
						
						msg = msg + ',' + rndNumber + "}";
					}
					if (botches > 0){
						total = "BOTCH("+botches+") after " + (i + 1) + " rolls";	
						msg = msg + "BOTCH("+botches+")";
						i = num.val;
					}			
					else if (rndNumber == 0){
						msg = msg + "0";							
					}			
					else if (mult > 1){
					total = total + (rndNumber * mult);
						msg = msg + "->" + (rndNumber * mult);							
					}			
					else{
					total = total + rndNumber;
						msg = msg + ", " + rndNumber;							
					}					
					faces.msg = "S";
					
				}else if (faces.val == 'Fudge'){
					faces.msg = "F";
					rndNumber = Math.round(2 * Math.random()) - 1;
				
					total = total + rndNumber;
					msg = msg + ", " + rndNumber;
				} else {
					rndNumber = 1 + Math.round((faces.val - 1) * Math.random());
				
					total = total + rndNumber;
					msg = msg + ", " + rndNumber;
				}
			}
			
			return {val: total, msg: "(" + num.msg + "d" + faces.msg + ":" + msg.substring(1) + ")"};
		};
	},

	'*': function(leftFunc, rightFunc){
		return function(scope){
			left = leftFunc(scope);
			right = rightFunc(scope);
			return {val: left.val * right.val, msg: left.msg + "*" + right.msg};
		}
	},

	'/': function(leftFunc, rightFunc){
		return function(scope){
			left = leftFunc(scope);
			right = rightFunc(scope);
			return {val: left.val / right.val, msg: left.msg + "/" + right.msg};
		}
	},

	'+': function(leftFunc, rightFunc){
		return function(scope){
			left = leftFunc(scope);
			right = rightFunc(scope);
			return {val: left.val + right.val, msg: left.msg + "+" + right.msg};
		}
	},

	'-': function(leftFunc, rightFunc){
		return function(scope){
			left = leftFunc(scope);
			right = rightFunc(scope);
			return {val: left.val - right.val, msg: left.msg + "-" + right.msg};
		}
	}
};

function resolve_ops(args){
	args = args || [];
	return args.map(resolve_op);
};

function resolve_op(opObj){
	var subArgs = resolve_ops(opObj.args);
	return ops[opObj.op].apply(opObj, subArgs);
};


exports.eval = function(parsed, scope){		
	scope = scope || {};
	var ops = resolve_op(parsed);
	return ops(scope);

	/*var acc = {sum: 0, mode: "+", rolls: [], 'scope':scope}
	var reduced = parsed.reduce(reduceThemBones, acc);
	return {sum: reduced.sum, rolls: reduced.rolls};*/
}

exports.ops = ops;
