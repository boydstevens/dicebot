var dice = {
	parse: require('./parse').parse,
	eval: require('./evaluate').eval,
	ops: require('./evaluate').ops,
	version: require('../package').version
};

function roll(str, scope){
	var parsed = dice.parse(str);
	var evaled = dice.eval(parsed, scope);
	return evaled;
};

dice.roll = roll;

dice.statistics = function(str, scope, samples){
	if(typeof(scope) == "number"){
		samples = scope;
		scope = {};
	}
	scope = scope || {};
	samples = samples || 1000;
	var resultSet = [];
	var i;
	for(i = 0; i < samples; i++){
		resultSet.push(roll(str, scope));
	}
	var mean = resultSet.reduce(function(n, acc){ return n + acc; }, 0) / samples;
	var min = resultSet.reduce(function(n, acc){ return n < acc ? n : acc; }, resultSet[0]);
	var max = resultSet.reduce(function(n, acc){ return n > acc ? n : acc; }, resultSet[0]);

	var parsed = dice.parse(str);

	var minMaxPossible = determine_min_max_possible(parsed, scope);

	return {
		'results': resultSet,
		'mean': mean,
		'min': parseInt(min.toFixed()),
		'max': parseInt(max.toFixed()),
		'min_possible': minMaxPossible[0],
		'max_possible': minMaxPossible[1]
	};
};

function determine_min_max_possible(opObject, scope){
	if(opObject.op == 'static'){
		return [opObject.value, opObject.value];
	}
	if(opObject.op == 'lookup'){
		var lookup = dice.ops.lookup.call(opObject, scope);
		return [lookup(scope), lookup(scope)];
	}
	if(opObject.op == 'floor'){
		var minmax = determine_min_max_possible(opObject.args[0], scope);
		return [Math.floor(minmax[0]), Math.floor(minmax[1])];
	}
	if(opObject.op == 'ceil'){
		var minmax = determine_min_max_possible(opObject.args[0], scope);
		return [Math.ceil(minmax[0]), Math.ceil(minmax[1])];
	}
	if(opObject.op == 'round'){
		var minmax = determine_min_max_possible(opObject.args[0], scope);
		return [Math.round(minmax[0]), Math.round(minmax[1])];
	}
	if(opObject.op == 'd'){
		var multipleMinMax = determine_min_max_possible(opObject.args[0], scope);
		var randPartMinMax = determine_min_max_possible(opObject.args[1], scope);
		var min = randPartMinMax[0] * multipleMinMax[0];
		var max = randPartMinMax[1] * multipleMinMax[1];
		return [min, max];
	}
	if(opObject.op == 'w'){
		var multipleMinMax = determine_min_max_possible(opObject.args[0], scope);
		var randPartMinMax = determine_min_max_possible(opObject.args[1], scope);
		var min = randPartMinMax[0] * multipleMinMax[0];
		var max = randPartMinMax[1] * multipleMinMax[1];
		return [min, max];
	}
	if(opObject.op == 'random'){
		var minMinMax = determine_min_max_possible(opObject.args[0], scope);
		var maxMinMax = determine_min_max_possible(opObject.args[1], scope);
		return [minMinMax[0], maxMinMax[1]];
	}
	if(opObject.op == 'sum'){
		var minMaxes = opObject.addends.map(function(sumOp){
			return [sumOp[0], determine_min_max_possible(sumOp[1], scope)];
		});
		var minMaxInit = minMaxes.shift();
		var min = minMaxes.reduce(function(acc, sumOp){
			if(sumOp[0] === '+'){
				return acc + sumOp[1][0];
			} else {
				return acc - sumOp[1][1];
			}
		}, minMaxInit[1][0]);
		var max = minMaxes.reduce(function(acc, sumOp){
			if(sumOp[0] === '+'){
				return acc + sumOp[1][1];
			} else {
				return acc - sumOp[1][0];
			}
		}, minMaxInit[1][1]);
		return [min, max];
	}
	if(opObject.op == 'mult'){
		var minMaxes = opObject.multiplicants.map(function(multOp){
			return [multOp[0], determine_min_max_possible(multOp[1], scope)];
		});
		var minMaxInit = minMaxes.shift();
		var min = minMaxes.reduce(function(acc, multOp){
			if(multOp[0] === '*'){
				return acc * multOp[1][0];
			} else {
				return acc / multOp[1][1];
			}
		}, minMaxInit[1][0]);
		var max = minMaxes.reduce(function(acc, multOp){
			if(multOp[0] === '*'){
				return acc * multOp[1][1];
			} else {
				return acc / multOp[1][0];
			}
		}, minMaxInit[1][1]);
		return [min, max];
	}
	if(opObject.op == 'paren_express'){
		return determine_min_max_possible(opObject.args[0], scope);
	}
}

function stringify_expression(evaled_op){
	var sub = stringify(evaled_op.expression);
	var prefix = evaled_op.op[0];
	if(prefix === 'p'){
		prefix = '';
	}
	
	return prefix + "( " + sub + " )";
};

function stringify_op(evaled_op){
	if(evaled_op.op === 'sum'){
		return stringify_seq(evaled_op.addends);
	}
	if(evaled_op.op === 'mult'){
		return stringify_seq(evaled_op.multiplicants);
	}
	var rs = stringify(evaled_op.rightSide);
	var ls = stringify(evaled_op.leftSide);
	return rs + ' ' + evaled_op.op + ' ' + ls;
};

function stringify_seq(sequence){
	var allThings = [];
	sequence.map(function(opRes){
		var op = opRes[0];
		var res = stringify(opRes[1]);
		allThings.push(op);
		allThings.push(res);
	});
	allThings.shift();
	return allThings.join(" ");
}

function stringify_rolls(evaled_roll){
	var minStr = evaled_roll.min > 1 ? evaled_roll.min + '..' : '';
	var preamble = evaled_roll.x + evaled_roll.mode + minStr + evaled_roll.max + ':[';
	return preamble + evaled_roll.rolls.join(', ') + ']';
};

function stringify(evaled){
	if(evaled.expression){
		return stringify_expression(evaled);
	}

	if(evaled.op){
		return stringify_op(evaled);
	}

	if(evaled.rolls){
		return stringify_rolls(evaled);
	}

	return evaled.toString();
};

dice.stringify = stringify;

var k;
for(k in dice){
    exports[k] = dice[k];
}