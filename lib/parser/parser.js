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
(function(Layx) {
	// TODO: This is awful
	var withoutFirstLastChars = function (str) { return str.substr(1, str.length - 2); };
	
	Layx.addToPrototype({
		getPriorityFromLine: function(line) {
			var split = line.split("@");
			if (split.length == 2)
				return split[1].trim();
			return null;
		},

		dictFromSingleLine: function(line) {
			var reIndentation = /^\t*/; // matches tabs in the beginning of a line
			var reEvent = /^(\![a-zA-Z]+)\s*:\s*([^\s:].*)$/; // matches an event and it's action in an expression like "!click: replace(a,b)"
			var reProperty = /^([a-zA-Z]+)\s*:\s*([^\s:].*)$/; // matches a property and it's value in an expression like "bgColor: aabbcc"
			var reCSSProperty = /^css\(([a-zA-Z\-]+)\)\s*:\s*([^\s:].*)$/; // matches a css property and it's value in an expression like "css(border): 1px solid red"
			var reConstraint = /^([^"]+)\s*(<=|>=|=)\s*([^\s"@][^"@]*)(\s*@\s*\d+)?$/; // matches left side, comparison operator and right side of a constraint. UPDATE: matches @123 also
			var reViewName = /^([a-zA-Z_][a-zA-Z0-9_\-]*)(::(.+))?$/; // to check if string is a proper name (no start with numbers, no weird chars)
			var reTextContent = /^\"(.*)\"$/; // matches a single line text content

			// comments don't reach this place anymore
			// var commentStart = line.indexOf("#");
			// if (commentStart >= 0)
				// line = line.substr(0, commentStart);
			line = line.trim();

			if (line.length == 0) return null; // TODO: this should never happen. check.
		/*
			if (line.indexOf('"') < 0 && line.indexOf(',') >= 0) {
				var ops = [">=", "<=", "=", ":"], op = null;
				for (var iop = 0; !op && iop < ops.length; iop++)
					if (line.indexOf(ops[iop]) >= 0) op = ops[iop];
				if (!op) return [{ "error" : "mysterious comma found" }];

				var sides = line.split(op);
				var left = sides[0].split(',');
				var right = sides[0].split(',');

				if (left.length == right.length || right.length == 1) {
					var unpackedLines = [];
					for (var i = 0; i < left.length; i++) {
						var rightIndex = i % right.length;
						unpackedLines.push(parseLine(left[i] + op + right[rightIndex])[0]);
					}
					return unpackedLines;
				} else {
					return [{ "error" : "invalid number of values to unpack" }];
				}
			}
			*/
			var results;

			if (results = line.match(reConstraint)) {
				// we have a constraint in our hands

				return {
					"comparator" : results[2],
					"string" : line
				};


			} else if (results = line.match(reProperty)) {
				// we have a property (like bgColor)

				if (results[1] == "content" || results[1] == "title" || results[1] == "icon") {
					// TODO: Regex for this and quotes (simple, double, and escaped)
					return {
						"property" : results[1],
						"value" : withoutFirstLastChars(results[2])
					};
				}

				return {
					"property" : results[1],
					"value" : results[2]
				};

			} else if (results = line.match(reCSSProperty)) {
				// we have a CSS property (like border)

				return {
					"cssProperty" : results[1],
					"value" : results[2]
				};

			} else if (results = line.match(reEvent)) {
				// we have an event (like !click)

				return {
					"event" : results[1].substr(1),
					"action" : results[2]
				};

			// TODO: Join duplicated call currentView.setText(results[1]);
			} else if (results = line.match(reTextContent)) {
				// we have a single line text content (like "hello world! :)")

				// TODO: Regex for this and quotes (simple, double, and escaped)
				return {
					"property" : "content",
					"value" : results[1]
				};

			} else if (results = line.match(reViewName)) {
				// we have a view id

				var newViewDict = { "name" : results[1] };

				if (results[3])
					newViewDict.class = results[3];

				return newViewDict;

			}
			return { "error" : "I don't understand what this is supposed to be" };
		},


		splitLayerClass: function(str) {
			var reLayerClass = /^::([a-zA-Z_][a-zA-Z0-9_\-]*)\s*(\(.*\))?$/;
			var results = str.match(reLayerClass);

			if (!results)
				return false;

			var className = results[1];
			var params = [];
			if (results[2] && results[2] != "()") {
				withoutFirstLastChars(results[2]);
				var untrimmedParams = withoutFirstLastChars(results[2]).split(",");
				for (var i = 0; i < untrimmedParams.length; i++)
					params.push(untrimmedParams[i].trim());
			}

			return { "name": className, "params": params };
		},

		parseLines: function(linesIn) {
			if (linesIn.length == 0) return [];
			var that = this;
			function buildLayerDict() {
				if (firstLevel == 0 && (classStuff = that.splitLayerClass(name))) {
					that.classes[classStuff.name] = that.buildLayerClass(classStuff.name, classStuff.params, childrenLines);
					childrenLines = [];
					return;
				}

				if (childrenLines.length > 0) {
					jsonLines = that.parseLines(childrenLines);
					for (var k = 0; k < jsonLines.length; k++) {
						var jsonLine = jsonLines[k];
						if ("comparator" in jsonLine)
							layerDict.constraints.push(jsonLine);
						else if ("property" in jsonLine)
							layerDict.properties.push([jsonLine.property, jsonLine.value]);
						else if ("cssProperty" in jsonLine)
							layerDict.cssProperties[jsonLine.cssProperty] = jsonLine.value;
						else if ("event" in jsonLine)
							layerDict.events[jsonLine.event] = jsonLine.action;
						else
							layerDict.children.push(jsonLine);
					}
					childrenLines = []; // TODO: check .length = 0 differences
				} else {
					// This "line" has no children inside.
					// So if this is a layer => this has not to break the code,
					// as this would be a possible instance of a class.
					// (If this is not an instance of a class this would also work)
					// ---
					// if possibleLeaf has a name property, it actually is a
					// layer that has nothing inside, so don't kill layerDict
					if(!("name" in possibleLeaf))
						layerDict = possibleLeaf;

				}
				list.push(layerDict);
			}

			var reTabs = /^\t*/;

			var firstLevel = linesIn[0].match(reTabs)[0].length; // now that there's no empty lines, this is sure to work
			var layerDict = {};
			var name = null;
			var possibleLeaf = null;

			var list = [];
			var childrenLines = [];
			for (var i = 0; i < linesIn.length; i++) {
				var rawLine = linesIn[i];
				var currentLevel = rawLine.match(reTabs)[0].length;

				if (!name) {
					var lineDict = this.dictFromSingleLine(rawLine.trim());
					if ("name" in lineDict)
						name = lineDict.name; // Has to be a name //linesIn[i].trim();
					else
						name = rawLine;
					possibleLeaf = lineDict;
					//if ("name" in possibleLeaf) possibleLeaf = null;
					layerDict = {
						name: name,
						children: [],
						constraints: [],
						properties: [],
						cssProperties: {},
						events: [],
						classes : {},
						view: null
					};

					if ("class" in lineDict) {
						var classes = lineDict.class.split("::");
						for (var j = 0; j < classes.length; j++) {
							var layerClass = classes[j];
							var classStuff = this.splitLayerClass("::"+layerClass);
							layerDict.classes[classStuff.name] = classStuff.params;
						}
					}

					continue;
				}

				if (currentLevel > firstLevel) {
					childrenLines.push(rawLine);
				} else {
					// terminar y guardar en el layerDict
					buildLayerDict();
					i--;
					layerDict = null;
					name = null;
				}

			}
			// TODO: al final tambien o agregarle algo al final
			buildLayerDict();
			return list;
		},

		generateViewTree: function(children, parentView) {
			for (var i = 0; i < children.length; i++) {
				var child = children[i];
				var name = child.name;
				var view = (name == "root") ?
					this.views["root"] : this.buildLayer(name);
				if (name == "_")
					child.view = view;
				if (parentView) parentView.addChild(view);
				this.generateViewTree(child.children, view);
			}
		},

		processLayerObject: function(layer) {
			var that = this;
			var propertySetters = {
				textColor: "setTextColor",
				zindex: "setZIndex",
				overflow: "setOverflow",
				visible: "setVisible",
				multiline: "setMultiline",
				bgColor: "setBackgroundColor",
				fontStyle: "setFontStyle",
				fontSize: "setFontSize",
				link: "setLink",
				img: "setImage",
				content: "addTextLine",
				title: "setTitle",
				icon: "setIcon"
			};
			var jsEvents = {
				click: "click"
			};

			var layerObj = layer.obj;
			this.DEBUG_TIMEI(2,'\t\tInternal');

			// Add constraints
			for (var j = 0; j < layerObj.constraints.length; j++) {
				var cons = layerObj.constraints[j];
				var priority = "priority" in cons ? cons.priority : undefined;

				// This is here to remember how to add our own constraints (Constrant class) to this
				//var c_old = this.addConstraint(layer[cons.attribute], cons.comparator, rightAttribute, cons.m, cons.b, priority);

				// Do not use window. as it will ruin the layx2html
				PARSER_LAYX = this;
				PARSER_LAYER = layer;
				// This parser will throw the nice-error if there are any
				var objConstraint = parser.parse(cons.string);
				var cassoConstraint = objConstraint[0];
				var cLayers = objConstraint[1];
				// DOC: Constraints also depend on the container layer to admit
				// DOC: for ex. layer.height = 200 only when the layer is in canvas
				cLayers.push(layer);
				this.addConstraint(cassoConstraint, cLayers);
			}
			this.DEBUG_TIME(2,'\t\t\tConstraints');

			// This is for optimization (start)
			var inCanvas = layer.inCanvas;
			layer.inCanvas = false;

			// Add properties
			for (var j = 0; j < layerObj.properties.length; j++) {
				var prop = layerObj.properties[j];
				var pName = prop[0], pValue = prop[1];
				if (pName in propertySetters) {
					var funcName = propertySetters[pName];
					layer[funcName](pValue);
				} else {
					throw 'property \''+pName+'\' not recognized, duuuude!';
				}
			}
			this.DEBUG_TIME(2,'\t\t\tProperties');

			// This is for optimization (end)
			layer.inCanvas = inCanvas;
			if (layer.inCanvas && layer._toAdjustContentSize) {
				layer._adjustContentSize();
				layer._toAdjustContentSize = false;
			}

			// Add CSS properties
			for (var pName in layerObj.cssProperties) {
				var pValue = layerObj.cssProperties[pName];
				layer.div.css(pName, pValue);
			}
			this.DEBUG_TIME(2,'\t\t\tCSS Properties');
			// Add events
			for (var eName in layerObj.events) {
				var eAction = layerObj.events[eName];
				if (eName in jsEvents) {
					var jsEvent = jsEvents[eName];
					var f = function(eAction) {
						return function(e) {
							// Stop loading if opened in another tab / page
							var event = e || window.event;
							if (event && (event.ctrlKey || event.metaKey || event.shiftKey)) return true;
							// TODO: Check if this improves the performance
							setTimeout(function() {
								// TODO: Check if this improves the performance
								that.solver.autoSolve = false;
								eval(eAction);
								that.solver.autoSolve = true;
								that.solver.solve();
								that.drawAll();
							}, 1);
							return false;
						};
					};
					layer.div.on(jsEvent, f(eAction));
					if (jsEvent === 'click') {
						layer.div.css('cursor', 'pointer');

						var linkIni = eAction.indexOf('loadURL(');
						if (linkIni >= 0) {
							var link = eAction.substr(linkIni+9, eAction.indexOf(')', linkIni+1) - linkIni - 10);
							layer.setLink(link);
						}
					}
				} else {
					throw 'event \''+eName+'\' not recognized, duuuude!';
				}
			}
			// Add classes
			for (var cName in layerObj.classes) {
				var args = layerObj.classes[cName];
				if (cName in this.classes) {
					var layerClass = this.classes[cName];
					layer.addClass(layerClass, args);
				} else {
					throw 'class \''+cName+'\' not recognized, duuuude!';
				}
			}
			this.DEBUG_TIME(2,'\t\t\tEvents');
			layer.obj = null;
		},

		addConstraintsAndProperties: function(children) {
			for (var i = 0; i < children.length; i++) {
				var child = children[i];
				// in case we have an anonymous "_" view
				var layer = ("view" in child && !!child.view) ? child.view : this.views[child.name];
				layer.obj = child;
				if (!layer.inCanvas) continue;
				this.processLayerObject(layer);
				this.addConstraintsAndProperties(child.children);
			}
		},

		parseConstraint: function(line) {
			var priority = this.getPriorityFromLine(line);
			line = line.split("@")[0];
			var terms = line.split('=');
			if (terms.length > 2) {
				var lines = [];
				for (var i = 0; i < terms.length - 1; i++) {
					var l = (terms[i] + '=' + terms[i+1]).trim();
					if (l.charAt(0) == '>' || l.charAt(0) == '<') l = l.substr(1);
					if (l.charAt(l.length-1) == '>' || l.charAt(l.length-1) == '<') l = l.substr(0, l.length-1);
					if (priority) l += " @ " + priority;
					lines.push(l);
				}
				return lines;
			}
			// var a = 'holachaup=epea  asd=asd', j = /^.*(a).*$/g; var i; while(i = j.exec(a)) this.DEBUG(i);
			return [line];
		},

		parseCode: function(code) {

			this.DEBUG_TIMEI(1, '\tParse A');
			var chunks = code.split('program'); // TODO: HACERLO BIEN! CHEQUEAR QUE SEA UNA LINEA, ETC..
			code = chunks[0];
			var program = chunks.length == 1 ? '' : chunks.slice(1).join('');
			var lines = code.split("\n");

			this.DEBUG_TIME(1, '\t\tParse A done');
			var tmpLines, expanded;
			do {
				expanded = false;
				tmpLines = [];

				var multiLineComment = false;

				for (var k = 0; k < lines.length; k++) {
					var line = lines[k];

					// if we're inside a multiline comment
					if (multiLineComment) {
						var multiLineCommentEnd = line.indexOf("=#");
						// if it ended with a =#, remove that part and carry on
						if (multiLineCommentEnd >= 0) {
							line = line.substr(multiLineCommentEnd + 2);
							multiLineComment = false;
						// if it didn't end, skip this line
						} else {
							continue;
						}
					}

					// multiLine comments that actually are only one line
					// e.g.: "A #= B =# C" -> "A  C"
					line = line.replace(/#=.*?=#/g, "");

					var singleLineCommentStart = line.indexOf("#");


					// allow lines like this:
					// 		"this is a # fake comment" # this is a real comment
					// 
					// TODO:
					// lines like these 2 don't work yet:
					//		"this is a # fake comment" # this is a real comment with a " character
					// 		"this is a string with #= a comment =# in it"
					//
					// I think starts and ends of strings AND comments should both be handled
					// by the jison parser, thus this wouldn't happen -mati
					if (singleLineCommentStart >= 0) {
						var quoteStart = line.indexOf('"');
						if (quoteStart >= 0 && quoteStart < singleLineCommentStart) {
							var quoteEnd = line.lastIndexOf('"');

							singleLineCommentStart = line.indexOf("#", quoteEnd);
						}
					}

					if (singleLineCommentStart >= 0) {

						// if it's an '#='
						if (line[singleLineCommentStart + 1] == "=") {
							multiLineComment = true;

							// no 'continue', we still need to parse this one line
						}

						line = line.substr(0, singleLineCommentStart);
					}	

					var reTabs = /^\t*/;
					var tabsCount = line.match(reTabs)[0].length;
					line = line.trim();
					// TODO: by ignoring lines, line numbers screw up for error messages.
					// actually they're already screwed up by expanding so doesn't matter much.
					if (line == "") continue;
					var tabs = "";
					for (var j = 0; j < tabsCount; j++) tabs += '\t';

					var ops = [">=", "<=", "=", ":"], op = null;
					for (var iop = 0; !op && iop < ops.length; iop++)
						if (line.indexOf(ops[iop]) >= 0) op = ops[iop];

					// TODO: Enhance this code. Avoiding '(' to permit f(x,y) and rgb(r,g,b) in the right side
					// TODO: Avoid characters in strings in functions, etc.
					var constraintTerms = line.split('=');
					if (line.substr(0, 2) !== '::' && constraintTerms.length > 2 && line.indexOf('"')) {
						var constraints = this.parseConstraint(line);
						for (var i = 0; i < constraints.length; i++)
							tmpLines.push(tabs + constraints[i].trim());
						expanded = true;

					// TODO: Enhance this code. Avoiding '(' to permit f(x,y) and rgb(r,g,b) in the right side
					// TODO: Avoid characters in strings in functions, etc.
					// TODO: GUARDA CON LAS NUEVAS CLASES Y ESTAS CONDICIONES!
					// Separating commas into multiple lines
					} else if (line.indexOf('"') < 0 && (line.indexOf(',') >= 0 || (op != ':' && (line.indexOf('rect') >= 0 || line.indexOf('position') >= 0 || line.indexOf('center') >= 0 || line.indexOf('size') >= 0))) && (op !== ':' || line.indexOf('(') < 0) && line.indexOf('::') < 0) {
						if (!op) {
							tmpLines.push(tabs + "error: LALALAL mysterious comma found");
							continue;
						}
						var priority = this.getPriorityFromLine(line);
						priority = (priority ? " @ " + priority : "");
						line = line.split("@")[0];

						var sides = line.split(op);
						var left = sides[0], right = sides[1];
						if (op != ':') {
							// grammarDistrib-parser will throw the nice-error if there are any
							left = grammarDistrib.parse(left);
							right = grammarDistrib.parse(right);
						}
						left = left.split(",");
						right = right.split(",");
						if (left.length === right.length) {
							for (var i = 0; i < left.length; i++) {
								tmpLines.push(tabs + (left[i] + op + right[i]).trim() + priority);
							}
							if (left.length > 1 || ((left[0] + op + right[0]).trim() + priority) != line.trim() + priority)
								expanded = true;
						} else if (right.length === 1) {
							for (var i = 0; i < left.length; i++) {
								tmpLines.push(tabs + (left[i] + op + right[0]).trim() + priority);
							}
							expanded = true;
						} else if (left.length === 1) {
							if (op != ':') {
								for (var i = 0; i < right.length; i++) {
									tmpLines.push(tabs + (left[0] + op + right[i]).trim() + priority);
								}
								expanded = true;
							} else {
								tmpLines.push(tabs + line + priority);
							}
						} else{
							tmpLines.push(tabs + "error: LALALAL invalid number of values to unpack");
							expanded = true;
						}


					} else {
						tmpLines.push(tabs + line);
					}
				}
				lines = tmpLines;
			} while(expanded);
			this.DEBUG_TIME(1, '\t\tParse B done');

			if (false) {
				// TODO: Check this
				// TODO: (something else) parseLine was replaced with this.dictFromSingleLine,
				//		 returns a dict instead of an array of dicts.
				this.DEBUG("----PARSED LINES INIT-----------------------");
				for (var i = 0; i < lines.length; i++)
					this.DEBUG(JSON.stringify(parseLine(lines[i])));
				this.DEBUG("----PARSED LINES END------------------------");
			}

			this.DEBUG_TIME(1, '\t\tParse C done');

			var parsedCode = this.parseLines(lines);
			//this.DEBUG(JSON.stringify(parsedCode, undefined, 2));

			this.DEBUG_TIME(1, '\t\tParse D done');
			if (parsedCode.length >= 1 && (parsedCode[0] && ('children' in parsedCode[0]))) {
				this.generateViewTree(parsedCode);
				this.DEBUG_TIME(1, '\t\tParse E done');
				this.addConstraintsAndProperties(parsedCode);
				this.DEBUG_TIME(1, '\t\tParse F done');
			}
			if (program) {
				this.drawAll();
				//$('body').append('<script>' + program + '</scr' + 'ipt>');
				eval(program); // Using eval() to run in nodejs when layx-html~ing
				// TODO: Check security!
			}
			this.DEBUG_TIME(1, '\t\tParse G done');
			return;


			// ESTO ES VIEJO Y ES POR REFERENCIA DE IMPLEMENTACION ITERATIVA vs. RECURSIVA
			//var reIndentation = /^\t*/; // matches tabs in the beginning of a line
			/*
			var lines = code.split("\n");
			var viewStack = [root];

			for (var i = 0; i < lines.length; i++) {

				try {

					var line = lines[i];
					var lineLevel = line.match(reIndentation)[0].length;
					var commentStart = line.indexOf("#");
					if (commentStart >= 0)
						line = line.substr(0, commentStart);
					line = line.trim();

					if (line.length == 0)
						continue;

					if (lineLevel == 0 && line == "root")
						continue;

					if (viewStack.length < lineLevel)
						throw "looks like there are too many tabs";

					if (lineLevel == 0)
						throw "are you trying to add a view/constraint/property to the super of root???";

					viewStack.length = lineLevel;

					var currentView = viewStack[viewStack.length - 1];

					var results;
					// Esto lo hace parseLine


				} catch (ex) {
					throw "[PARSER] "+ex+" (line "+(i + 1)+")";
				}
			}*/
		}
	});
})(Layx);
