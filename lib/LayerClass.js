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
	
	var LayerClass = function(layx, name, params, codeLines) {
		this.layx = layx;
		this.name = name;
		this.codeLines = codeLines;
		this.codeLines.unshift("_");

		this.params = [];
		this.defaults = [];
		for (var i = 0; i < params.length; i++) {
			var param = params[i].split("=");
			var defVal = null;
			if (param[1])
				defVal = param[1].trim();
			this.params.push(param[0].trim());
			this.defaults.push(defVal);
		}

		if (this.params.length > 0)
			this.prepareCodeWithParams();
	};

	LayerClass.prototype = {

		replaceCodeWithArgs: function(args) {

			if (this.defaults.length == 0 || this.lineNumsWithParams.length == 0)
				return this.codeLines;

			var argsWithDefaults = [];
			for (var i = 0; i < this.defaults.length; i++) {
				var deflt = this.defaults[i];
				var arg = (i in args) ? args[i] : deflt;
				argsWithDefaults.push(arg);
			}
			args = argsWithDefaults;

			var replacedLines = [];

			var lineNum = -1;
			for (var i = 0; i < this.lineNumsWithParams.length; i++) {
				var oldLineNum = lineNum + 1;
				lineNum = this.lineNumsWithParams[i];

				var prevLines = this.codeLines.slice(oldLineNum, lineNum);
				Array.prototype.push.apply(replacedLines, prevLines);

				var paramNums = this.paramNumsByLineNums[lineNum];

				var replacedLine = this.codeLines[lineNum];

				for (var j = 0; j < paramNums.length; j++) {
					var paramNum = paramNums[j];
					var arg = args[paramNum];

					// if this is the first cycle of this loop, replacedLine will contain chunks.
					// if not, we have to divide it in chunks again for this other param.
					var chunks = (j == 0) ? replacedLine : this.chunksForParamInLine(this.params[paramNum], replacedLine);
					replacedLine = chunks.join(arg);
				}

				replacedLines.push(replacedLine);
			}

			Array.prototype.push.apply(replacedLines, this.codeLines.slice(lineNum + 1));

			return replacedLines;
		},

		prepareCodeWithParams: function() {

			this.paramNumsByLineNums = {}; // key: line number, value: array with param numbers
			this.lineNumsWithParams = [];

			for (var i = 0; i < this.codeLines.length; i++) {
				var line = this.codeLines[i];

				var hasChunks = false;

				for (var j = 0; j < this.params.length; j++) {
					var param = this.params[j];

					var chunks = this.chunksForParamInLine(param, line);

					if (chunks) {

						if (!(i in this.paramNumsByLineNums)) {
							this.paramNumsByLineNums[i] = [];
							this.lineNumsWithParams.push(i);
						}

						this.paramNumsByLineNums[i].push(j);

						// if this is the first time we find a param in the line,
						// save the chunks. otherwise we'll just have to get them
						// again later since they cannot be combined.
						if (!hasChunks) {
							this.codeLines[i] = chunks;
							hasChunks = true;
						}
					}
				}
			}
		},

		// returns false if we can't find the param. if we do, returns chunks
		// of code surrounding where it should be replaced.
		chunksForParamInLine: function(param, line) {
			if (line.length == 0)
				return false;
			var reAlnum = /[a-zA-Z0-9_]/;
			var chunks = [];
			line = line.split(param);
			var result = line[0];
			var last = line.length - 1;
			for (var i = 0; i < last; i++) {
				var doReplace = false;
				var pre = line[i];
				var post = (i == last) ? false : line[i + 1];
				var preEmpty = pre.length == 0;
				var postEmpty = !post || post.length == 0;
				// if pre or post are empty, it MUST be because they are the extremes. otherwise, don't try replacing
				// (this would mean we have something like "asd PARAMPARAM fgh")
				if ((!preEmpty || i == 0) && (!postEmpty || i == last - 1)) {
					var preChar = !preEmpty ? pre.charAt(pre.length - 1) : false;
					var postChar = !postEmpty ? post.charAt(0) : false;
					// replace only if A: there is no pre char (or is but fails alnum test) and B: same for post char
					doReplace = ((!preChar || !reAlnum.test(preChar)) && (!postChar || !reAlnum.test(postChar)));
				}

				var endPart = post || "";
				if (doReplace) {
					chunks.push(result);
					result = endPart;
				} else {
					result += param + endPart;
				}
			}
			chunks.push(result);

			if (chunks.length <= 1)
				return false;

			return chunks;
		},

		generateTree: function(args, attachTo) {
			var parsedLines = this.layx.parseLines(this.replaceCodeWithArgs(args));
			parsedLines[0].view = attachTo;
			this.layx.generateViewTree(parsedLines[0].children, attachTo);
			this.layx.addConstraintsAndProperties(parsedLines);
		}
	};

	Layx.addToPrototype({
		buildLayerClass: function(name, params, codeLines) {
			return new LayerClass(this, name, params, codeLines);
		}
	});
})(Layx);
