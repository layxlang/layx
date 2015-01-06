/**
 * Layx Layout Language | layx.org
 * Copyright (C) 2014 Axel Brzostowski & Matias Altalef
 * 
 * using jQuery:
 *    (modifications: minified, used internally)
 * 	Copyright 2005, 2014 jQuery Foundation, Inc. and other contributors
 * 	Released under the MIT license
 * 	http://jquery.org/license
 * 
 * using Cassowary Constraint Solving Toolkit:
 *    (modifications: minified, used internally)
 * 	Copyright (C) 1998-2000 Greg J. Badros
 * 	Parts Copyright (C) 2011-2012, Alex Russell (slightlyoff@chromium.org)
 * 
 * Both Layx and Cassowary licensed under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with the
 * License. You may obtain a copy of the License at
 * 
 * 	http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var Layx = function() {
	var that = this;
	
	function showViewLog(view) {
		if (typeof view === 'undefined') view = that.root;
		//that.DEBUG(view.toString2());
		for (var i = 0; i < view.children.length; i++) showViewLog(view.children[i]);
	}
	
	// Pensar luego constraintsWithVisualFormat:options:metrics:views:
	// hacer grupos de objetos? (clases) y hacer constraints sobre clases?

	// views is 'viewsByID'. Pueden existir views sin ID fuera de este dict.
	this.views = {};
	this.root = null;
	this.windowLayer = null;
	this.solver = new c.SimplexSolver();
	this.classes = {};
	
	this.URLs = null;
	this.urlLoaded = null;
	
	this.DEBUG_TIMEI(0, 'Document almost loaded...');
	
	//=================================================================
	// INITIAL CODE
	//=================================================================
	$(document).ready(function() {
		that.DEBUG_TIME(0, '\tDone document ready');
		that.root = that.buildLayer("root");
		that.views["root"] = that.root;

		that.windowLayer = that.buildLayer("window");
		that.views["window"] = that.windowLayer;

		that.solver.addEditVar(that.windowLayer.width)
			.addEditVar(that.windowLayer.height)
			.addEditVar(that.windowLayer.left)
			.addEditVar(that.windowLayer.top)
			.beginEdit();


		// TODO: ARREGLAR EL SIZE DE ROOT
		// INTRINSINC CONTENT SIZE
		//that.solver.addEditVar(that.root.width).addEditVar(that.root.height).beginEdit();
		//that.solver.suggestValue(that.root.height, 999).suggestValue(that.root.width, 999);



		// Adding constraint: root is never smaller than window
		var wHeight = new c.Expression(that.windowLayer.height);	
		var rHeight = new c.Expression(that.root.height);
		var rootWindowHeightConstraint = new c.Inequality(wHeight, c.LEQ, rHeight, Layx.PRIORITIES.req);
		that.solver.addConstraint(rootWindowHeightConstraint);

		var wWidth = new c.Expression(that.windowLayer.width);	
		var rWidth = new c.Expression(that.root.width);
		var rootWindowWidthConstraint = new c.Inequality(wWidth, c.LEQ, rWidth, Layx.PRIORITIES.req);
		that.solver.addConstraint(rootWindowWidthConstraint);

		$(window).resize(function() { that.updateWindowLayer(); });
		$(window).scroll(function() { that.updateWindowLayer(); });

		that.updateWindowLayer(); // TODO: CHECK WHY THIS MUST BE CALLED TWICE ON START
	});
};

Layx.addToPrototype = function(funcs) { for (name in funcs) this.prototype[name] = funcs[name]; };

Layx.prototype = {
	mainDone: function() {
		// TODO: Do this once. (window.params)
		window.params = {};
		if (window.location.search) {
			var search = window.location.search.substr(1).split("&");
			for (var i = 0; i < search.length; i++) {
				var param = search[i].split("=");
				window.params[param[0]] = param[1];
			}
		}
		if ("solverLog" in window.params) {
			this.DEBUG(that.solver.getInternalInfo());
			this.DEBUG("Solution:"); showViewLog();
		}
		this.drawAll();

		this.updateWindowLayer(); // MUST BE CALLED TWICE ON START


		// TO KNOW (chain)
		// this.solver.addEditVar(var1).addEditVar(var2).beginEdit();
		// this.solver.suggestValue(var1, val1).suggestValue(var2, val2).resolve(); // esto ya las cambia
		// this.solver.endEdit(); // esto dice que si o si no vas a editar mas
	},
	
	loadFile: function(fileName) {
		var that = this;
		var noCache = "?" + new Date().getTime();
		this.DEBUG_TIMEI(0, 'Opening layx file...');
		$.get(fileName + noCache, function (data) {
			that.DEBUG_TIME(0, '\tLayx file loaded');
			that.DEBUG_TIMEI(0, 'Parsing');
			that.parseCode(data);
			that.DEBUG_TIME(0, '\tParsing complete');
			if (that.URLs) {
				var urlCode = location.href.substr(location.href.lastIndexOf('/')+1);
				that.loadURL(urlCode, true);
			}
			//main();
			that.mainDone();
			that.DEBUG('Done All');
		}, "text").fail(function () {
			alert("Can't find "+fileName+"!");
		});
	},

	loadFileFromGETParameter: function(paramName, defaultFilename, path) {
		if (typeof path === 'undefined') path = '';
		var fileName = path + defaultFilename;
		window.params = {};
		if (window.location.search) {
			var search = window.location.search.substr(1).split("&");
			for (var i = 0; i < search.length; i++) {
				var param = search[i].split("=");
				if (param[0] == paramName) {
					fileName = path + param[1];
					break;
				}
			}
		}
		this.loadFile(fileName);
	},
	
	drawAll: function(view, offsetX, offsetY) {
		if (typeof view === 'undefined') {
			view = this.root;
			offsetX = 0;
			offsetY = 0;
		}
		view.draw(offsetX, offsetY);
		for (var i = 0; i < view.children.length; i++) {
			var left = parseFloat(view.div.css('left'));
			left += parseFloat(view.div.css('border-left-width'));
			left += parseFloat(view.children[i].div.css('margin-left'));
			var top = parseFloat(view.div.css('top'));
			top += parseFloat(view.div.css('border-top-width'));
			top += parseFloat(view.children[i].div.css('margin-top'));
			this.drawAll(view.children[i], offsetX-left, offsetY-top);
		}
		return this;
	},
	
	updateWindowLayer: function() {
		var
			left = $(window).scrollLeft(),
			top = $(window).scrollTop(),
			width = $(window).width(),
			height = $(window).height();

		// in OSX, you can scroll out of bounds :/
		var maxLeft = this.root.width.value - width, maxTop = this.root.height.value - height;
		if (left < 0)
			left = 0;
		else if (left > maxLeft)
			left = maxLeft;

		if (top < 0)
			top = 0;
		else if (top > maxTop)
			top = maxTop;


		this.solver.suggestValue(this.windowLayer.left, left)
			.suggestValue(this.windowLayer.top, top)
			.suggestValue(this.windowLayer.width, width)
			.suggestValue(this.windowLayer.height, height)
			.resolve();
		// this.solver.endEdit(); // Never?

		this.drawAll();

	},
	
	//=================================================================
	// CONSTRAINS METHODS
	//=================================================================

	addConstraint: function(cassoConstraint, _layers) {
		if (window.LAYX_DUMMY_FLAG) return;
		var layers = [];
		for (var i = 0; i < _layers.length; i++) {
			// TODO: This is quadratic. Consider to sort first, O(n log n) + O(n)
			// Removing duplicated layers
			if (layers.indexOf(_layers[i]) < 0) layers.push(_layers[i]);
		}
		// TODO: new Layx.Constraint(...) is better than new this.Constraint(...)
		// TODO: Check this to move all non-static classes to static (Layer, etc.)
		var constr = new this.Constraint(cassoConstraint, layers), addToSolver = true;
		for (var i = 0; i < layers.length; i++) {
			layers[i].constraints.push(constr);
			if (!layers[i].inCanvas) addToSolver = false;
		}
		if (addToSolver) {
			constr.addToSolver(this.solver);
		}
		return constr;
	},

	removeConstraint: function(constraint) {
		if (window.LAYX_DUMMY_FLAG) return;
		// TODO: Test this function correclty
		if (constraint.solver) {
			constraint.removeFromSolver();
		}
		var layers = constraint.layers;
		for (var i = 0; i < layers.length; i++) {
			var codeCons = layers[i].constraints;
			var cIndex = codeCons.indexOf(constraint);
			if (cIndex >= 0) codeCons.splice(cIndex, 1);
			// TODO: else?
		}
	},
	
	//=================================================================
	// REPLACE
	//=================================================================
	
	replace_: function(container, content) {
		container = this.views[container];
		content = this.views[content];
		// Copying children as the original array will be changing in the middle
		var children = container.children.slice(0), alreadyChild = false;
		for (var i = 0; i < children.length; i++) {
			if (children[i] === content)
				alreadyChild = true;
			else children[i].detach();
		}
		if (!alreadyChild)
			container.addChild(content.detach());
		this.drawAll(); // Do it on addChild too but avoiding it with a parameter		
	},

	replace: function(container, content, file) {
		if (typeof file !== 'undefined') {
			$.get(file, function (data) {
				parseCode(data);
				this.replace_(container, content);

			}, "text").fail(function () {
				alert("Can't read "+file+"!");
			});
		} else {
			this.replace_(container, content);
		}
	},
	
	//=================================================================
	// LOAD URLS
	//=================================================================
	
	loadURLChunks: function(contentsArray, i) {
		if (typeof i === 'undefined') i = 0;
		if (i < contentsArray.length) {
			var containerLayer = this.views[contentsArray[i][0]];
			var contentLayer = this.views[contentsArray[i][1]];
			var needToReplace = containerLayer.children.length != 1 || containerLayer.children[0] != contentLayer;
			// TODO: Add this loader-functionality to replace()
			// TODO: Use arrays instead of dictionaries for URL containers and
			//       loaders to load them in the correct order!!
			if (window.LAYX_DUMMY_FLAG) {
				this.replace(contentsArray[i][0], contentsArray[i][1]);
				this.loadURLChunks(contentsArray, i + 1);
			} else {
				if (contentsArray[i][2] && needToReplace) {
					this.replace(contentsArray[i][0], contentsArray[i][2]);
					contentsArray[i].length = 2; // deleting contentsArray[i][2]
					var that = this;
					setTimeout(function() {
						that.loadURLChunks(contentsArray, i);
						that.drawAll();
					}, 1);
				} else {
					this.replace(contentsArray[i][0], contentsArray[i][1]);
					this.loadURLChunks(contentsArray, i + 1);
				}
			}
		}
	},
	
	loadURL: function(urlCode, firstTime) {
		function newState() {
			var state = {
				containers : {},
				url : "",
				time : new Date().getTime(),
				obj : null,
				nl : true
			};
			return state;
		}
		if (typeof firstTime === 'undefined') firstTime = false;
		var changeURL = !firstTime;
		var urlID = urlCode;
		if (!(urlID in this.URLs)) urlID = '';
		if (urlID == '') urlID = this.URLs[urlID];
		var url = this.URLs[urlID];
		if (urlCode == "") urlCode = window.location.pathname;

		var title = url.title;
		var contents = url.contents;
		var loaders = url.loaders ? url.loaders : {};

		if (title) document.title = title;
		var contentsArray = [];
		for (var container in contents) {
			contentsArray.push([container, contents[container], loaders[container]]);
		}
		this.loadURLChunks(contentsArray);
		if (!firstTime && 'scrollY' in url) {
			// TODO: Fix this visual bug (scrolls on window <=> non-scrolls on window)
			var that = this;
			$('html,body').animate({scrollTop: url.scrollY}, 200, function() {
				that.updateWindowLayer();
			});
		}
		if (changeURL) {
			var state = (history.state ? history.state : newState());
			for (var id in contents) {
				state.containers[id] = contents[id];
			}
			state.time = new Date().getTime();
			state.nl = false;
			try {
				history.replaceState(null, "", urlCode);
			} catch (err) {
				// Limit size?
			}
		}
		if (this.urlLoaded) this.urlLoaded(urlID);
	}
};


// TODO: Move this function to Layx.priority(...)
c.Strength.priority = function(priority) { return new c.Strength("priority", 0, 0, priority); };
Layx.PRIORITIES = {
	req: c.Strength.priority(1000), // Required
	ineq: c.Strength.priority(200), // Inequality
	eq: c.Strength.priority(100), // Equation
	chug: c.Strength.priority(2), // Content hugging
};
