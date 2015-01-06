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
	function isHexColor(color) {
		var charset = "0123456789ABCDEFabcdef";
		var isHex = (color.length == 3 || color.length == 6);
		for (var i = 0; isHex && i < color.length; i++)
			if (charset.indexOf(color.charAt(i)) < 0) isHex = false;
		return isHex;
	}
	
	function getTextContentSize(text, fontStyle, fontSize) {
		var textNode = $('<span style="display: none; font-family: '+fontStyle+'; font-size: '+fontSize+';">'+text+'</span>');
		textNode.appendTo("body");
		// TODO: Check why it's necessary the '+ 1' in Firefox
		var size = { width: textNode.width() + 1, height: textNode.height() };
		textNode.detach();
		return size;
	}

	function getTextBaseline(text, fontStyle, fontSize) {
		// Not hidden because the position has to be deduced
		var container = $('<span style="position: absolute; font-family: '+fontStyle+'; font-size: '+fontSize+';">A</span>')
		var smallA = $('<span style="vertical-align: baseline; font-size: 0px;">B</span>')
		container.append(smallA);
		container.appendTo('body');
		var relativeBaseline = smallA.position().top + 1; // [a, b] == [a, b+1)
		container.detach();
		return relativeBaseline;
	}
	
	// When setting an attribute use (ex: height) this.atts.height = X; instead of this.height = X;
	var Layer = function(layx, id, color, text) {
		if (typeof id === 'string' && (id in layx.views)) return null; // Invalid: duplicated ID // Check if it exists in all views (DOM+not already added)? Or check when it's added

		var anonymous = id == '_';
		
		this.layx = layx;
		this.id = id;
		this.parent = null;
		this.children = [];
		this.link = null;
		this.img = null;
		// TODO: Check if id parameter is necessary
		this.atts = new this.layx.LayerAttributes(this, id);
		this.classes = [];
		this.inCanvas = (id == "root" || id == "window");
		this.obj = null;

		this.contentSizeConstraints = { width : null, height : null };
		// WARNING: parentSizeConstraints are pseudo-deprecated (not in use yet)
		this.parentSizeConstraints = { bottom : null, right : null };
		this.intrinsicConstraints = {};
		this._toAdjustContentSize = false;
		this.activeConstraints = [];
		this.constraints = [];

		this.d = {}; // Attribute constraints Done
		this.e = {}; // Expressions
		for (att in this.atts) {
			this.d[att] = 0; // This has to be the first line
			this[att] = this.atts[att];
			this.e[att] = new c.Expression(this[att]);
			this.d[att] = 1; // This has to be the last line
		}

		if (typeof id === 'string' && !anonymous)
			this.layx.views[id] = this;

		if (id == "root") {
			this.div = $("#root");

		} else if (typeof id !== undefined && !anonymous) {
			// TODO: Check this to show IDs when debugging
			//var textContent = this.text || ('<span class="id">' + id + '</span>'); // When finished, remove the span
			//this.div = $('<a id="'+id+'" class="view">' + textContent + '</a>');
			this.div = $('<a id="'+id+'" class="view"></a>');
		} else {
			this.div = $('<a class="view"></a>');
		}
		if (color) this.setBackgroundColor(color);

		if (id == "root") {
			// We don't know if priorities make a difference for stays
			this.layx.solver.addStay(this.top, Layx.PRIORITIES.req); // Check what are the priority parameter here
			this.layx.solver.addStay(this.left, Layx.PRIORITIES.req);
		}
		if (id == "window") {
			// We don't know if priorities make a difference for stays
			this.layx.solver.addStay(this.top, Layx.PRIORITIES.req); // Check what are the priority parameter here
			this.layx.solver.addStay(this.left, Layx.PRIORITIES.req);
			this.layx.solver.addStay(this.height, Layx.PRIORITIES.req);
			this.layx.solver.addStay(this.width, Layx.PRIORITIES.req);
		}

		this.setText(text, false); // Be sure this is called first
		if (id == "root") {
			this.setFontStyle("Arial", false);
			this.setFontSize("20px", false);
		}
		this.setOverflow("visible");

		this._addViewConstraints(this.layx.solver);

		//this.layx.DEBUG("New view: " + this.id);
	};
	Layer.prototype = {
		get baseline() {
			if (this.d.baseline == 1) {
				var constr;
				this.d.baseline = 2;
				if (this.text) {
					var relativeBaseline = getTextBaseline(this.text, this.div.css('font-family'), this.div.css('font-size'));
					relativeBaseline = new c.Expression(relativeBaseline);
					constr = new c.Equation(this.e.baseline, this.e.top.plus(relativeBaseline), Layx.PRIORITIES.req);
				} else {
					constr = new c.Equation(this.e.top.plus(this.e.height), this.e.baseline, Layx.PRIORITIES.req); // TODO: SEE TEXTS
				}
				this.intrinsicConstraints.baseline = this.layx.addConstraint(constr, [this]); // TODO: SEE TEXTS
			}
			return this._baseline;
		},set baseline(baseline) { if (baseline instanceof c.Variable) this._baseline = baseline; else this._baseline.value = baseline; },
		get bottom() {
			if (this.d.bottom == 1) {
				this.d.bottom = 2;
				var constr = new c.Equation(this.e.top.plus(this.e.height), this.e.bottom, Layx.PRIORITIES.req); // top + height = bottom
				this.intrinsicConstraints.bottom = this.layx.addConstraint(constr, [this]);
			}
			return this._bottom;
		},set bottom(bottom) { if (bottom instanceof c.Variable) this._bottom = bottom; else this._bottom.value = bottom; },
		get centerX() {
			if (this.d.centerX == 1) {
				this.d.centerX = 2;
				var constr = new c.Equation(this.e.width.divide(2).plus(this.e.left), this.e.centerX, Layx.PRIORITIES.req); // width/2 + left = centerX
				this.intrinsicConstraints.centerX = this.layx.addConstraint(constr, [this]);
			}
			return this._centerX;
		},set centerX(centerX) { if (centerX instanceof c.Variable) this._centerX = centerX; else this._centerX.value = centerX; },
		get centerY() {
			if (this.d.centerY == 1) {
				this.d.centerY = 2;
				var constr = new c.Equation(this.e.height.divide(2).plus(this.e.top), this.e.centerY, Layx.PRIORITIES.req); // height/2 + top = centerY
				this.intrinsicConstraints.centerY = this.layx.addConstraint(constr, [this]);
			}
			return this._centerY;
		},set centerY(centerY) { if (centerY instanceof c.Variable) this._centerY = centerY; else this._centerY.value = centerY; },
		get height() { return this._height; },set height(height) { if (height instanceof c.Variable) this._height = height; else this._height.value = height; },
		get leading() {
			if (this.d.leading == 1) {
				this.d.leading = 2;
				var constr = new c.Equation(this.e.leading, this.e.left, Layx.PRIORITIES.req); // TODO: SEE LANGUAGE
				this.intrinsicConstraints.leading = this.layx.addConstraint(constr, [this]);
			}
			return this._leading;
		},set leading(leading) { if (leading instanceof c.Variable) this._leading = leading; else this._leading.value = leading; },
		get left() { return this._left; },set left(left) { if (left instanceof c.Variable) this._left = left; else this._left.value = left; },
		get right() {
			if (this.d.right == 1) {
				this.d.right = 2;
				var constr = new c.Equation(this.e.left.plus(this.e.width), this.e.right, Layx.PRIORITIES.req); // left + width = right
				this.intrinsicConstraints.right = this.layx.addConstraint(constr, [this]);
			}
			return this._right;
		},set right(right) { if (right instanceof c.Variable) this._right = right; else this._right.value = right;  },
		get top() { return this._top; },set top(top) { if (top instanceof c.Variable) this._top = top; else this._top.value = top; },
		get trailing() {
			if (this.d.trailing == 1) {
				this.d.trailing = 2;
				var constr = new c.Equation(this.e.left.plus(this.e.width), this.e.trailing, Layx.PRIORITIES.req); // TODO: SEE LANGUAGE
				this.intrinsicConstraints.trailing = this.layx.addConstraint(constr, [this]);
			}
			return this._trailing;
		},set trailing(trailing) { if (trailing instanceof c.Variable) this._trailing = trailing; else this._trailing.value = trailing; },
		get width() { return this._width; },set width(width) { if (width instanceof c.Variable) this._width = width; else this._width.value = width; },

		super: function(count) {
			if (typeof count === 'undefined') return this.parent;
			if (count < 0) throw 'count must be non-negative';
			var layer = this;
			for (var i = 0; layer && i < count; i++)
				layer = layer.parent;
			return layer;
		},

		prev: function(count) {
			if (!this.parent) return null;
			if (typeof count === 'undefined') count = 1;
			if (count < 0) throw 'count must be non-negative';
			var siblings = this.parent.children;
			var sIndex = siblings.indexOf(this)-count;
			if (sIndex >= 0) return siblings[sIndex];
			return null;
		},

		next: function(count) {
			if (!this.parent) return null;
			if (typeof count === 'undefined') count = 1;
			if (count < 0) throw 'count must be non-negative';
			var siblings = this.parent.children;
			var sIndex = siblings.indexOf(this)+count;
			if (sIndex < siblings.length) return siblings[sIndex];
			return null;
		},

		setZIndex: function(zIndex) {
			this.div.css("z-index", zIndex);
			return this;
		},

		setBackgroundColor: function(color) {
			// TODO: Check color & all other properties stuff
			if (isHexColor(color)) color = '#' + color;
			this.div.css("background-color", color);
			//this.div.css("background-color", "#"+hexColor);
			//this.div.children(".id").css("color", getContrastYIQ(hexColor));
			return this;
		},

		// TODO: What to do with this?
		setLink: function(link) {
			if (!link) link = null;
			this.link = link;
			if (this.link) {
				$(this.div).prop('href', this.link);
				$(this.div).prop('target', '_blank');
			} else {
				$(this.div).removeAttr('href');
				$(this.div).removeAttr('target');
			}
			return this;
		},

		setOverflow: function(overflow) {
			// TODO: ONLY visible & hidden
			this.div.css("overflow", overflow);
			return this;
		},

		setVisible: function(visible) {
			// TODO: Also admit true and false values
			if (visible == 'yes') this.div.css("display", "normal");
			else this.div.css("display", "none");
			return this;
		},

		setMultiline: function(multiline) {
			// TODO: Also admit true and false values
			if (multiline == 'yes') {
				this.div.css("white-space", "normal");
				this.div.css("text-overflow", "clip");
			} else {
				this.div.css("white-space", "nowrap");
				this.div.css("text-overflow", "ellipsis");
			}
			return this;
		},

		setImage: function(img) {
			if (!img) img = null;
			this.img = img;
			if (this.img) {
				this.div.get(0).style.backgroundImage = "url('" + this.img + "')";
				this.div.get(0).style.backgroundSize = "cover";
				this.div.get(0).style.backgroundPosition = "center";
			} else this.div.get(0).style.backgroundImage = '';
			return this;
		},

		setTextColor: function(color) {
			if (isHexColor(color)) color = '#' + color;
			this.div.css("color", color);
			//this.div.css("color", "#"+hexColor);
			return this;
		},

		_adjustContentSize: function() {
			if (this.id == "root") return;
			if (this.contentSizeConstraints.width) this.layx.removeConstraint(this.contentSizeConstraints.width);
			if (this.contentSizeConstraints.height) this.layx.removeConstraint(this.contentSizeConstraints.height);
			if (this.text) {
				var size = getTextContentSize(this.text, this.div.css('font-family'), this.div.css('font-size'));
				// TODO: Check where are more about: this.atts....
				var cw = new c.Equation(this.e.width, new c.Expression(size.width), Layx.PRIORITIES.chug);
				var ch = new c.Equation(this.e.height, new c.Expression(size.height), Layx.PRIORITIES.chug);
				this.contentSizeConstraints.width = this.layx.addConstraint(cw, [this]);
				this.contentSizeConstraints.height = this.layx.addConstraint(ch, [this]);
			}
			if (this.intrinsicConstraints.baseline) {
				this.layx.removeConstraint(this.intrinsicConstraints.baseline);

				this.d.baseline = 2;
				var baseConstraint;
				if (this.text) {
					var relativeBaseline = getTextBaseline(this.text, this.div.css('font-family'), this.div.css('font-size'));
					relativeBaseline = new c.Expression(relativeBaseline);
					baseConstraint = new c.Equation(this.e.baseline, this.e.top.plus(relativeBaseline), Layx.PRIORITIES.req);
				} else {
					baseConstraint = new c.Equation(this.e.baseline, this.e.top.plus(this.e.height), Layx.PRIORITIES.req); // TODO: SEE TEXTS
				}
				this.intrinsicConstraints.baseline = this.layx.addConstraint(baseConstraint, [this]); // TODO: SEE TEXTS

			}
		},

		setText: function(text, adjustContent) {
			if (typeof adjustContent === 'undefined') adjustContent = true;
			// TODO: think about root
			this.text = text;
			if (text !== "" && !text) return;
			// TODO: Check if it's better to put the code below in draw()
			if (text == "" && this.div.children("span").length == 1)
				this.div.children("span").remove();
			if (text != "") {
				if (this.div.children("span").length == 0)
					this.div.prepend('<span>'+text+'</span>');
				else
					this.div.children("span").html(text);
			}
			if (adjustContent) {
				if (this.inCanvas) this._adjustContentSize();
				else this._toAdjustContentSize = true;
			}
			return this;
		},

		addTextLine: function(text, adjustContent) {
			if (this.id == 'pepitoLopez') console.log('ahora');
			if (!this.text) return this.setText(text, adjustContent);
			// Here, we already had text before this call
			if (typeof adjustContent === 'undefined') adjustContent = true;
			// TODO: think about root
			if (text !== "" && !text) text = "";
			this.text += "<br/>" + text;
			// TODO: Check if it's better to put the code below in draw()
			if (text != "") {
				this.div.children("span").append("<br/>" + text);
			}
			if (adjustContent) {
				if (this.inCanvas) this._adjustContentSize();
				else this._toAdjustContentSize = true;
			}
			return this;
		},

		_adjustContentSizeToChildren: function(first) {
			if (this.inCanvas) this._adjustContentSize();
			else if (first) this._toAdjustContentSize = true;
			for (var i = 0; i < this.children.length; i++)
				this.children[i]._adjustContentSizeToChildren();
		},

		setFontStyle: function(fontStyle, adjustContent) {
			if (typeof adjustContent === 'undefined') adjustContent = true;
			// This property will only work for layers that has an own fontStyle
			this.fontStyle = fontStyle || "Arial"; // TODO: Pensar fontInherit en ON para heredar hacia abajo fontStyle y fontSize
			this.div.css("font-family", this.fontStyle);  // TODO: Check if it's better to do this in draw
			if (adjustContent) {
				if (this.inCanvas) this._adjustContentSizeToChildren(true);
				else this._toAdjustContentSize = true;
			}
			return this;
		},

		setFontSize: function(fontSize, adjustContent) {
			if (typeof adjustContent === 'undefined') adjustContent = true;
			// This property will only work for layers that has an own fontSize
			this.fontSize = fontSize || "20px";
			this.div.css("font-size", this.fontSize);  // TODO: Check if it's better to do this in draw
			if (adjustContent) {
				if (this.inCanvas) this._adjustContentSizeToChildren(true);
				else this._toAdjustContentSize = true;
			}
			return this;
		},

		_addViewConstraints: function(solver) { // Change name to _addIntrinsicConstraints
			// TODO: CHECK THIS return. Be sure if this code would be deprecated
			return;
			// CenterX Constraint
			var wdt = new c.Expression(this.width);
			var lft = new c.Expression(this.left);
			var cnX = new c.Expression(this.centerX);
			this.intrinsicConstraints.centerX = new c.Equation(wdt.divide(2).plus(lft), cnX, Layx.PRIORITIES.req); // width/2 + left = centerX

			// CenterY Constraint
			var hgt = new c.Expression(this.height);
			var top = new c.Expression(this.top);
			var cnY = new c.Expression(this.centerY);
			this.intrinsicConstraints.centerY = new c.Equation(hgt.divide(2).plus(top), cnY, Layx.PRIORITIES.req); // height/2 + top = centerY

			// Leading and Trialing Constraints
			var ldn = new c.Expression(this.leading);
			var trl = new c.Expression(this.trailing);
			this.intrinsicConstraints.leading = new c.Equation(ldn, lft, Layx.PRIORITIES.req); // TODO: SEE LANGUAGE
			this.intrinsicConstraints.trailing = new c.Equation(trl, lft.plus(wdt), Layx.PRIORITIES.req); // TODO: SEE LANGUAGE

			// Baseline constraint
			var bln = new c.Expression(this.baseline);
			this.intrinsicConstraints.baseline = new c.Equation(top.plus(hgt), bln, Layx.PRIORITIES.req); // TODO: SEE TEXTS

			// Right and Bottom
			var rgt = new c.Expression(this.right);
			var btm = new c.Expression(this.bottom);
			this.intrinsicConstraints.right = new c.Equation(lft.plus(wdt), rgt, Layx.PRIORITIES.req); // left + width = right
			this.intrinsicConstraints.bottom = new c.Equation(top.plus(hgt), btm, Layx.PRIORITIES.req); // top + height = bottom

			for (key in this.intrinsicConstraints) {
				this.layx.addConstraint(this.intrinsicConstraints[key], [this]);
			}
		},

		_setInCanvas: function(inCanvas) {
			var nowFalse = (this.inCanvas && !inCanvas);
			var nowTrue = (!this.inCanvas && inCanvas);
			this.inCanvas = inCanvas;
			for (var i = 0; i < this.children.length; i++)
				this.children[i]._setInCanvas(inCanvas);
			if (nowFalse) {
				for (var i = 0; i < this.constraints.length; i++) {
					this.constraints[i].activeLayers--;
					//if (this.constraints[i].activeLayers < 0)
					//	this.layx.DEBUG('Internal Problems! 1', constr.toString());
					if (this.constraints[i].solver)
						this.constraints[i].removeFromSolver();
				}
			}
			if (nowTrue) {
				for (var i = 0; i < this.constraints.length; i++) {
					var constr = this.constraints[i];
					constr.activeLayers++;
					//if (constr.activeLayers > constr.layers.length)
					//	this.layx.DEBUG('Internal Problems! 2', constr.toString());
					if (constr.activeLayers == constr.layers.length)
						constr.addToSolver(this.layx.solver);
				}
				// Adjusted here to get font-family/size when it's on canvas / DOM
				// This has to be below the iteration above to keep activeLayers consistent
				if (this._toAdjustContentSize) this._adjustContentSize();

				if (this.obj) {
					this.layx.addConstraintsAndProperties([this.obj]);
				}
			}
		},

		addChild: function(child) {
			if (child.id == "root") return null; // Invalid assignation of root as a subView
			if (child.parent == this.id) return false; // This parent-child relation already exists
			if (child.parent !== null) return null; // Invalid: Another parent-child relation exists

			child.parent = this;
			this.children.push(child);
			this.div.append(child.div.detach()); // TODO: always detach()?
			child._setInCanvas(this.inCanvas); // this should be after this.div.append

			if (false) {
				// == Este chunk es como el de abajo pero NO usa los getters que generan right y bottom ==
				// child.parentSizeConstraints.right = new c.Inequality(child.e.left.plus(child.e.width), c.LEQ, this.e.left.plus(this.e.width), Layx.PRIORITIES.chug);
				// this.layx.addConstraint(child.parentSizeConstraints.right, [this, child]);
				// child.parentSizeConstraints.bottom = new c.Inequality(child.e.top.plus(child.e.height), c.LEQ, this.e.top.plus(this.e.top), Layx.PRIORITIES.chug);
				// this.layx.addConstraint(child.parentSizeConstraints.bottom, [this, child]);
				// ====

				// TODO: Check what to do with this
				// ESTAS CONSTRAINTS CAMBIAN LA PERFORMANCE ROTUNDAMENTE!
				// POR ESO POR AHORA NO SE EJECUTAN
				var parentRight = new c.Expression(this.right);
				var childRight = new c.Expression(child.right);
				var cr = new c.Inequality(childRight, c.LEQ, parentRight, Layx.PRIORITIES.chug);
				child.parentSizeConstraints.right = this.layx.addConstraint(cr, [this, child]);

				var parentBottom = new c.Expression(this.bottom);
				var childBottom = new c.Expression(child.bottom);
				var cb = new c.Inequality(childBottom, c.LEQ, parentBottom, Layx.PRIORITIES.chug);
				child.parentSizeConstraints.bottom = this.layx.addConstraint(cb, [this, child]);
			}
			//this.layx.DEBUG(this.id + " added " + child.id);
			return this;
		},

		detachChild: function(child) {
			if (this.children.indexOf(child) < 0) 
				throw 'That layer is not a child of the parent!!';
			child.detach();
			return this;
		},

		detachAllChildren: function() {
			// Copying children as the original array will be changing in the middle
			var children = this.children.slice(0);
			for (var i = 0; i < children.length; i++)
				children[i].detach();
			return this;
		},

		detach: function() {
			// TODO: Check all this function in the future
			if (!this.parent) return this;
			this._setInCanvas(false);

			// Para que sea remove/destroy: AGREGAR A ESTO QUITAR DE views[] y ver si tambien la siguiente linea...
			//if (!this.parent) throw "layers without a parent cannot be removed";
			// Para quitar de la jerarquia de views tambien quitar los hijos!
			// algo como this.removeAllChildren();
			/* // Para quitar las constraints propias y de los hijos
			var ownCons = this.activeConstraints.slice();
			this.activeConstraints.length = 0;
			for (var i = 0; i < ownCons.length; i++)
				ownCons[i].removeFromSolver();
			*/
			if (this.parentSizeConstraints.right)
				this.layx.removeConstraint(this.parentSizeConstraints.right);
			if (this.parentSizeConstraints.bottom)
				this.layx.removeConstraint(this.parentSizeConstraints.bottom);
			this.parentSizeConstraints.right = null;
			this.parentSizeConstraints.bottom = null;

			var childIndex = this.parent.children.indexOf(this);
			if (childIndex >= 0)
				this.parent.children.splice(childIndex, 1);
			else
				throw 'whaaatttt.. no, really, whaattt??';
			this.div.detach();
			this.parent = null;
			return this;
		},

		draw: function(offsetX, offsetY) {
			$(this.div).css("top", (this["top"].value + offsetY) + "px");
			$(this.div).css("left", (this["left"].value + offsetX) + "px");
			$(this.div).css("width", this["width"].value + "px");
			$(this.div).css("height", this["height"].value + "px");
		},

		toString2: function() {
			var s = "";
			if (typeof this.id != 'undefined') s += " - " + this.id + ": ";
			for (a in this.atts) if (a.charAt(0) != '_' && a != "toString") {
				s += a + ":" + this.atts[a].value.toFixed(2) + ", ";
			}
			return s;
		},

		setTitle: function(title) {
			if (this === this.layx.root)
				document.title = title
			else {
				this.div.attr("title", title)
			}
			return this;
		},

		setIcon: function(url) {
			if (this !== this.layx.root)
				throw "'icon' property only valid for root"
			else {
				var link = $("link[rel='shortcut icon']");
				if (link.length == 0) {
					link = $("<link>");
					link.attr("type", "image/x-icon");
					link.attr("rel", "shortcut icon");
					$("head").append(link);
				}
				link.attr("href", url);
			}
			return this;
		},

		addClass: function(layerClass, args) {
			this.classes.push(layerClass);
			layerClass.generateTree(args, this);
			return this;
		},

		getHTML: function() {
			var tag = 'div', html = '';
			html += '<'+tag+'>' + (this.link ? ' <a href="'+this.link+'">' : '');
			html += (this.text ? '<span>' + this.text + '</span>' : '');
			html += (this.img ? '<img src="'+this.img+'">' : '');
			for (var i = 0; i < this.children.length; i++) html += this.children[i].getHTML();
			html += (this.link ? '</a> ' : '') + '<'+tag+'>';
			return html;
		}
	};
	
	Layx.addToPrototype({
		buildLayer: function(id, color, text) {
			return new Layer(this, id, color, text);
		}
	});
})(Layx);
