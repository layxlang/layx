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
	Layx.LAYX_DEBUG = false;
	Layx.LAYX_DEBUG_MSG = true;
	Layx.LAYX_DEBUG_TIME = true;
	
	Layx.addToPrototype({
		DEBUG: function() {
			if (Layx.LAYX_DEBUG_MSG)
				console['log'].apply(console, arguments);
		},

		DEBUG_TIMEI: function(index) {
			if (Layx.LAYX_DEBUG_MSG && Layx.LAYX_DEBUG_TIME) {
				if (typeof window.DEBUG_T_ === 'undefined')
					window.DEBUG_T_ = {};
				var args = Array.prototype.slice.call(arguments).slice(1);
				console['log'].apply(console, args);
				window.DEBUG_T_[index] = new Date();
			}
		},

		DEBUG_TIME: function(index) {
			if (Layx.LAYX_DEBUG_MSG && Layx.LAYX_DEBUG_TIME) {
				if (typeof window.DEBUG_T_ === 'undefined')
					window.DEBUG_T_ = {};
				var args = Array.prototype.slice.call(arguments).slice(1);
				if (index in window.DEBUG_T_) {
					var t = (new Date().getTime() - window.DEBUG_T_[index].getTime()) / 1000.0;
					console['log'].apply(console, [t].concat(args));
				} else
					console['log'].apply(console, args);
				window.DEBUG_T_[index] = new Date();
			}
		}
	});
})(Layx);
