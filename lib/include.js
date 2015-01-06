var files = [

// IMPORTANT:
// 1) Keep files order
// 2) Keep SINGLE quotes for packer!
// 3) Do not change the PACKER lines below.

//PACKER_INIT//
	'jquery-1.11.1.min.js',
	'cassowary/c.js',
	'cassowary/HashTable.js',
	'cassowary/HashSet.js',
	'cassowary/Error.js',
	'cassowary/SymbolicWeight.js',
	'cassowary/Strength.js',
	'cassowary/Variable.js',
	//'cassowary/Point.js',
	'cassowary/Expression.js',
	'cassowary/Constraint.js',
	'cassowary/EditInfo.js',
	'cassowary/Tableau.js',
	'cassowary/SimplexSolver.js',
	//'cassowary/Timer.js',
	//'cassowary/parser/parser.js',
	//'cassowary/parser/api.js',
	'layx.js',
	'debug.js',
	'LayerAttributes.js',
	'Layer.js',
	'LayerClass.js',
	'Constraint.js',
	'parser/parser_distrib.js',
	'parser/parser_obj.js',// TODO: Rename this parser (parser.) object variable
	'parser/parser.js',
	'finishLoading.js'
//PACKER_END//
];
for (var i = 0; i < files.length; i++)
	document.write('<script src="'+modPath+files[i]+'"></scr'+'ipt>');
