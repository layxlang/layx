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
	: comparation EOF { return $1; }
	| prioritized_comparation EOF { return $1; }
	;

comparation
	: expression COMPARATOR expression
	{
		if (!$1 || !$3) throw 'referenced layer does not exist!'; // TODO: Use relative instead of referenced?
		if ($2 == '=') $$ = [new c.Equation($1[0], $3[0], Layx.PRIORITIES.eq), $1[1].concat($3[1])];
		else if ($2 == '<=')  $$ = [new c.Inequality($1[0], c.LEQ, $3[0], Layx.PRIORITIES.ineq), $1[1].concat($3[1])];
		else $$ = [new c.Inequality($1[0], c.GEQ, $3[0], Layx.PRIORITIES.ineq), $1[1].concat($3[1])];
	}
	;

prioritized_comparation
	: expression COMPARATOR expression AT NATURAL // TODO: CHECK PRIORITY BETWEEN 0 AND 1000
	{
		if (!$1 || !$3) throw 'referenced layer does not exist!'; // TODO: Use relative instead of referenced?
		if ($2 == '=') $$ = [new c.Equation($1[0], $3[0], c.Strength.priority($5)), $1[1].concat($3[1])];
		else if ($2 == '<=')  $$ = [new c.Inequality($1[0], c.LEQ, $3[0], c.Strength.priority($5)), $1[1].concat($3[1])];
		else $$ = [new c.Inequality($1[0], c.GEQ, $3[0], c.Strength.priority($5)), $1[1].concat($3[1])];
	}
	;



expression
	: constant
	| variable
	;

variable
	: constant SUM variable { if (!$3) $$ = $3; else if ($2 == '+') $$ = [$1[0].plus($3[0]), $3[1]]; else $$ = [$1[0].minus($3[0]), $3[1]]; }
	| variable SUM constant { if (!$1) $$ = $1; else if ($2 == '+') $$ = [$1[0].plus($3[0]), $1[1]]; else $$ = [$1[0].minus($3[0]), $1[1]]; }
	| variable SUM variable { if (!$1 || !$3) $$ = $1 && $3; else if ($2 == '+') $$ = [$1[0].plus($3[0]), $1[1].concat($3[1])]; else $$ = [$1[0].minus($3[0]), $1[1].concat($3[1])]; }
	| constant MUL variable { if (!$3) $$ = $3; else $$ = [$3[0].times($1[0]), $3[1]]; }
	| variable MUL constant { if (!$1) $$ = $1; else $$ = [$1[0].times($3[0]), $1[1]]; }
	| variable DIV constant { if (!$1) $$ = $1; else $$ = [$1[0].divide($3[0]), $1[1]]; }
	| variable OR constant { if ($1) $$ = $1; else $$ = $3; }
	| variable OR variable { if ($1) $$ = $1; else $$ = $3; }
	| attribute
	{
		if ($1 == "bottom") $$ = [PARSER_LAYER.e.top.plus(PARSER_LAYER.e.height), [PARSER_LAYER]];
		else if ($1 == "centerX") $$ = [PARSER_LAYER.e.width.divide(2).plus(PARSER_LAYER.e.left), [PARSER_LAYER]];
		else if ($1 == "centerY") $$ = [PARSER_LAYER.e.height.divide(2).plus(PARSER_LAYER.e.top), [PARSER_LAYER]];
		else if ($1 == "right") $$ = [PARSER_LAYER.e.left.plus(PARSER_LAYER.e.width), [PARSER_LAYER]];
		else
		$$ = [new c.Expression(PARSER_LAYER[$1]), [PARSER_LAYER]];
	}
	| layer "." attribute
	{
		if (!$1) $$ = $1;
		else {
			if ($3 == "bottom") $$ = [$1.e.top.plus($1.e.height), [$1]];
			else if ($3 == "centerX") $$ = [$1.e.width.divide(2).plus($1.e.left), [$1]];
			else if ($3 == "centerY") $$ = [$1.e.height.divide(2).plus($1.e.top), [$1]];
			else if ($3 == "right") $$ = [$1.e.left.plus($1.e.width), [$1]];
			else
			$$ = [new c.Expression($1[$3]), [$1]];
		}
	}
	| SUM variable %prec USIGN
	{
		if (!$2) $$ = $2;
		else $$ = [$2[0].times(parseInt($1+"1")), $2[1]];
	}
	| "(" variable ")" { $$ = $2; }
	;

constant
	: constant SUM constant { if ($2 == '+') $$ = [$1[0].plus($3[0]), []]; else $$ = [$1[0].minus($3[0]), []]; }
	| constant MUL constant { $$ = [$1[0].times($3[0]), []]; }
	| constant DIV constant { $$ = [$1[0].divide($3[0]), []]; }
	| number { $$ = [new c.Expression(parseFloat($1)), []]; }
	| SUM constant %prec USIGN { $$ = [$2[0].times(parseInt($1+"1")), []]; }
	| "(" constant ")" { $$ = $2; }
	;

number
	: NATURAL
	| FLOAT
	;

attribute
	: ATTRIBUTE { $$ = $1; }
	;

layer
	: ID { $$ = PARSER_LAYX.views[$1]; }
	| RELATIVE
	{
		$$ = PARSER_LAYER;
		if ($1 == "super")     $$ = $$.super();
		else if ($1 == "prev") $$ = $$.prev();
		else if ($1 == "next") $$ = $$.next();
	}
	| layer "." RELATIVE
	{
		if ($3 == "super")     $$ = $1.super();
		else if ($3 == "prev") $$ = $1.prev();
		else if ($3 == "next") $$ = $1.next();
		else $$ = $1; // this
	}
	| RELATIVE "(" NATURAL ")"
	{
		var count = parseInt($3); // TODO: CONSIDER WHAT HAPPENS TO 'this'
		$$ = PARSER_LAYER;
		if ($1 == "super")     $$ = $$.super(count);
		else if ($1 == "prev") $$ = $$.prev(count);
		else if ($1 == "next") $$ = $$.next(count);
	}
	| layer "." RELATIVE "(" NATURAL ")"
	{
		var count = parseInt($5); // TODO: CONSIDER WHAT HAPPENS TO 'this'
		if ($3 == "super")     $$ = $1.super(count);
		else if ($3 == "prev") $$ = $1.prev(count);
		else if ($3 == "next") $$ = $1.next(count);
		else $$ = $1; // this
	}
	| CHILDREN "[" NATURAL "]"
	{
		if (parseInt($3) < PARSER_LAYER.children.length)
			$$ = PARSER_LAYER.children[parseInt($3)];
		else $$ = null;
	}
	| layer "." CHILDREN "[" NATURAL "]"
	{
		if (parseInt($5) < $1.children.length)
			$$ = $1.children[parseInt($5)];
		else $$ = null;
	}
	;
