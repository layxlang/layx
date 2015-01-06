// http://zaach.github.io/jison/try/

/* Parsing constraint */
%lex
%%

\s+       {/* ignore */}
","       { return 'COMMA'; }
"/"       { return 'DIV'; }
"+"|"-"   { return 'SUM'; }
"*"       { return 'MUL'; }
"("       { return '('; }
")"       { return ')'; }
"="|">="|"<="       { return 'COMPARATOR'; }
"@"       { return 'AT'; }
"top"|"right"|"left"|"bottom"|"width"|"height"|"centerX"|"centerY"|"leading"|"trailing"|"baseline" { return 'ATTRIBUTE'; }
[a-zA-Z]+[a-zA-Z0-9]*  { return 'ID'; }
[0-9]+("."[0-9]+)\b  { return 'FLOAT' }
[0-9]+\b  { return 'NATURAL' }
"."       { return '.'; }
<<EOF>>   { return 'EOF'; }
/lex

/* operator associations and precedence */

%left COMPARATOR
%left COMMA
%left '+' '-'
%left '*' '/'
// TODO: Think about this: %left UMINUS

%start line



%% /* language grammar */


/*
addition
	: addition_ EOF { return $1; }
	;

addition_
	: tuple SUM addition_ {
		if ($1.length != $3.length) {
			alert('error');
		} else {
			$$ = [];
			for (var i = 0; i < $1.length; i++)
				$$.push($1[i] + "+++" + $3[i]);
		}
	}
	| tuple { $$ = $1; }
	;


tuple
	: tuple COMMA expression { $$ = $1.concat([$3]); }
	| "(" tuple ")" { $$ = $2; }
	| expression { $$ = [$1]; }
	;

*/


/*
line
	: comparations EOF { return $1; }
	;

comparations
	: comparations COMPARATOR expression {
		$$ = $1.concat([[$1[$1.length-1][2], $2, $3]]); 
	}
	| comparation { $$ = [$1]; }
	;
*/
line
	: comparation EOF { return $1; }
	| prioritized_comparation EOF { return $1; }
	;

comparation
	: expression COMPARATOR expression { $$ = [undefined, $1, $2, $3]; }
	;

prioritized_comparation
	: expression COMPARATOR expression AT NATURAL { $$ = [$5, $1, $2, $3]; }
	;

expression
	: additionV { $$ = $1; $v = $$; }
	| additionC { $$ = $1; $v = $$; }
	;

additionV
	: multiplicationC SUM additionV { $$ = "("+$1+" V"+$2+" "+$3+")"; }
	| multiplicationV SUM additionV { $$ = "("+$1+" V"+$2+" "+$3+")"; }
	| multiplicationV SUM additionC { $$ = "("+$1+" V"+$2+" "+$3+")"; }
	| multiplicationV
	;

additionC
	: multiplicationC SUM additionC { $$ = "("+$1+" C"+$2+" "+$3+")"; }
	| multiplicationC
	;

multiplicationC
	: constant MUL multiplicationC { $$ = "("+$1+" C"+$2+" "+$3+")"; }
	| constant DIV multiplicationC { $$ = "("+$1+" C"+$2+" "+$3+")"; }
	| constant
	;

multiplicationV
	: variable MUL multiplicationC { $$ = "("+$1+" V"+$2+" "+$3+")"; }
	| variable DIV multiplicationC { $$ = "("+$1+" V"+$2+" "+$3+")"; }
	| constant MUL multiplicationV { $$ = "("+$1+" V* "+$3+")"; }
	| variable
	;

constant
	: number { $$ = $1; $v = [$$]; }
	| "(" additionC ")" { $$ = "("+$2+")"; $v = $v; } // TODO: Hace falta $v = $v?
	;

number
	: NATURAL
	| FLOAT
	;

variable
	: attribute { $$ = "this." + $1; $v = [$$]; }
	| id "." attribute { $$ = $1 + "." + $3; $v = [$$]; }
	| "(" additionV ")" { $$ = "("+$2+")"; $v = $v; } // TODO: Hace falta $v = $v?
	;


attribute
	: ATTRIBUTE { $$ = $1; }
	;

id
	: ID { $$ = $1; }
	;
