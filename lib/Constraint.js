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
	
	// Precondition: layers has not to contain duplicated layers
	var Constraint = function(cassoConstraint, layers) {
		this.cassoConstraint = cassoConstraint;
		this.layers = layers;
		this.activeLayers = 0;
		for (var i = 0; i < this.layers.length; i++)
			if (this.layers[i].inCanvas) this.activeLayers++;
		this.jsonConstraint = {}; // TODO: ??
		this.priority = 0; // TODO: ??
		this.solver = null;
	};
	Constraint.prototype = {
		addToSolver: function(solver) {
			//if (this.solver) LAYX_THIS.DEBUG('Internal error. What? Error 1');
			//if (this.activeLayers != this.layers.length)
			//	LAYX_THIS.DEBUG('Internal error. What? Error 2');
			for (var i = 0; i < this.layers.length; i++)
				this.layers[i].activeConstraints.push(this);
			this.solver = solver;
			this.solver.addConstraint(this.cassoConstraint);
			return this;
		},
		removeFromSolver: function() {
			if (this.solver === null) throw 'This constraint has never been added to a solver';
			for (var i = 0; i < this.layers.length; i++) {
				var codeCons = this.layers[i].activeConstraints;
				var cIndex = codeCons.indexOf(this);
				if (cIndex >= 0) codeCons.splice(cIndex, 1);
			}
			this.solver.removeConstraint(this.cassoConstraint);
			this.solver = null;
			return this;
		},
		toString: function() {
			// TODO: ??
			return this.cassoConstraint.toString();
		}
	};

	Layx.addToPrototype({
		Constraint: Constraint
	});
})(Layx);
