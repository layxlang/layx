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
	c.Variable.prototype.setLayer = function(layer) {
		this.layer = layer;
	};
	// TODO: Check if id is necessary
	var LayerAttributes = function(layer, id) {
		var atts = { top: 0, right: 0, left: 0, bottom: 0, width: 0, height: 0, centerX: 0, centerY: 0, leading: 0, trailing: 0, baseline: 0 };
		for (att in atts) {
			var varAtt = { value: atts[att] };
			if (typeof id !== 'undefined') varAtt.name = id+'.'+att; // name is just for debugging, it's not necessary. Use 'A' instead of '.' if it's an error when parsing
			this[att] = new c.Variable(varAtt);
			// TODO: Check if it's necessary setLayer for this
			this[att].setLayer(layer);
		}
	};
	LayerAttributes.prototype = {
		get baseline() { return this._baseline; },set baseline(baseline) { if (baseline instanceof c.Variable) this._baseline = baseline; else this._baseline.value = baseline; },
		get bottom() { return this._bottom; },set bottom(bottom) { if (bottom instanceof c.Variable) this._bottom = bottom; else this._bottom.value = bottom; },
		get centerX() { return this._centerX; },set centerX(centerX) { if (centerX instanceof c.Variable) this._centerX = centerX; else this._centerX.value = centerX; },
		get centerY() { return this._centerY; },set centerY(centerY) { if (centerY instanceof c.Variable) this._centerY = centerY; else this._centerY.value = centerY; },
		get height() { return this._height; },set height(height) { if (height instanceof c.Variable) this._height = height; else this._height.value = height; },
		get leading() { return this._leading; },set leading(leading) { if (leading instanceof c.Variable) this._leading = leading; else this._leading.value = leading; },
		get left() { return this._left; },set left(left) { if (left instanceof c.Variable) this._left = left; else this._left.value = left; },
		get right() { return this._right; },set right(right) { if (right instanceof c.Variable) this._right = right; else this._right.value = right; },
		get top() { return this._top; },set top(top) { if (top instanceof c.Variable) this._top = top; else this._top.value = top; },
		get trailing() { return this._trailing; },set trailing(trailing) { if (trailing instanceof c.Variable) this._trailing = trailing; else this._trailing.value = trailing; },
		get width() { return this._width; },set width(width) { if (width instanceof c.Variable) this._width = width; else this._width.value = width; },
		toString: function() { return ""; }
	};

	Layx.addToPrototype({
		LayerAttributes: LayerAttributes
	});
})(Layx);
