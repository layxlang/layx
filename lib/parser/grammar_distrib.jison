// http://zaach.github.io/jison/try/

/* Parsing constraint */
%lex
%%

\s+       {/* ignore */}
","       { return 'COMMA'; }
"/"       { return 'DIV'; }
"+"|"-"   { return 'SUM'; }
"*"       { return 'MUL'; }
"|"       { return 'OR'; }
"("       { return '('; }
")"       { return ')'; }
"["       { return '['; }
"]"       { return ']'; }
"="|">="|"<="       { return 'COMPARATOR'; }
"@"       { return 'AT'; }
"position"       { return 'POSITION'; }
"size"       { return 'SIZE'; }
"rect"       { return 'RECT'; }
"center"       { return 'CENTER'; }
"top"|"right"|"left"|"bottom"|"width"|"height"|"centerX"|"centerY"|"leading"|"trailing"|"baseline" { return 'ATTRIBUTE'; }
"this"|"super"|"prev"|"next"  { return 'RELATIVE'; }
"children"  { return 'CHILDREN'; }
[a-zA-Z_]+[a-zA-Z0-9_]*  { return 'ID'; }
[0-9]*("."[0-9]+)\b  { return 'FLOAT' }
[0-9]+\b  { return 'NATURAL' }
"."       { return '.'; }
<<EOF>>   { return 'EOF'; }
/lex

/* operator associations and precedence */

%left COMPARATOR
%left COMMA
%left OR
%left SUM
%left MUL DIV
%left USIGN

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
	: expression EOF { return $1.replace(/\(this\)/g, 'this'); }
	//| tuple EOF { return $1.replace(/\(this\)/g, 'this'); }
	;

// Ejemplo:
// e.(pepito.(3434, 1 * (width+2), aa.height, top), 3+height), rr.size
// e.(pepito.(3434, 1 * (width+2), aa.height, top), 3+height), rr.children[1].prev.size
// e.(pepito.(3434, 1 * (width+2), this.height, top), 3+height), rr.size

tuple
	: tuple COMMA expression { $$ = $1 + "," + $3; }
	| expression COMMA tuple { $$ = $1 + "," + $3; }
	| tuple COMMA tuple { $$ = $1 + "," + $3; }
	| expression COMMA tuple { $$ = $1 + "," + $3; }
	;

// el error aparece en expression.. 
expression
	: constant { $$ = $1; }
	| variable { $$ = $1; }
	| expression COMMA expression { $$ = $1 + "," + $3; }
	| layer "." "(" expression ")" { $$ = $4.replace(/\(this\)/g, $1); }
	| POSITION { $$ = "(this).left,(this).top"; } // TODO: Add parenthesis
	| SIZE { $$ = "(this).width,(this).height"; } // TODO: Add parenthesis
	| RECT { $$ = "(this).left,(this).top,(this).width,(this).height"; } // TODO: Add parenthesis
	| CENTER { $$ = "(this).centerX,(this).centerY"; } // TODO: Add parenthesis
	| layer "." POSITION { $$ = $1+".left,"+$1+".top"; } // TODO: Add parenthesis
	| layer "." SIZE { $$ = $1+".width,"+$1+".height"; } // TODO: Add parenthesis
	| layer "." RECT { $$ = $1+".left,"+$1+".top,"+$1+".width,"+$1+".height"; } // TODO: Add parenthesis
	| layer "." CENTER { $$ = $1+".centerX,"+$1+".centerY"; } // TODO: Add parenthesis
	;

variable
	: constant SUM variable { $$ = $1 + $2 + $3; }
	| variable SUM constant { $$ = $1 + $2 + $3; }
	| variable SUM variable { $$ = $1 + $2 + $3; }
	| constant MUL variable { $$ = $1 + "*" + $3; }
	| variable MUL constant { $$ = $1 + "*" + $3; }
	| variable DIV constant { $$ = $1 + "/" + $3; }
	| variable OR constant { $$ = $1 + "|" + $3; }
	| variable OR variable { $$ = $1 + "|" + $3; }
	| attribute { $$ = "(this)" + "." + $1; }
	| layer "." attribute { $$ = $1 + "." + $3; }
	| SUM variable %prec USIGN { $$ = $1 + $2; }
	| "(" variable ")" { $$ = "(" + $2 + ")"; }
	;

constant
	: constant SUM constant { $$ = $1 + $2 + $3; }
	| constant MUL constant { $$ = $1 + "*" + $3; }
	| constant DIV constant { $$ = $1 + "/" + $3; }
	| number { $$ = $1; }
	| SUM constant %prec USIGN { $$ = $1 + $2; }
	| "(" constant ")" { $$ = "(" + $2 + ")"; }
	;

number
	: NATURAL
	| FLOAT
	;

attribute
	: ATTRIBUTE { $$ = $1; }
	;

layer
	: ID { $$ = $1; }
	| RELATIVE
	{
		$$ = ($1 == "this" ? $1 : "(this)" + "." + $1);
	}
	| layer "." RELATIVE
	{
		$$ = $1 + "." + $3;
	}
	| RELATIVE "(" NATURAL ")"
	{
		$$ = ($1 == "this" ? "this(" + $3 + ")" : "(this)" + "." + $1 + "(" + $3 + ")");
	}
	| layer "." RELATIVE "(" NATURAL ")"
	{
		$$ = $1 + "." + $3 + "(" + $5 + ")";
	}
	| CHILDREN "[" NATURAL "]"
	{
		$$ = "(this)" + ".children[" + $3 + "]";
	}
	| layer "." CHILDREN "[" NATURAL "]"
	{
		$$ = $1 + ".children[" + $5 + "]";
	}
	;

/*
// Add to the end of the generated .js
var grammarDistrib = parser;
delete parser;
*/