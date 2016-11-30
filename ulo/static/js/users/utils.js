/*

	User helper functions javascript file

	Dependencies: JQuery, Base.js

*/


"use strict";


/* ------------------------------------------------------------------------------------ */

function _Connect(){

	if(Ulo.checkDependencies(true, "Session", "Pip") === false){

		this.register = function(){}

	}

}

_Connect.prototype = {

	constructor: Connect,

	/* -------------------------------------------------------------------------------- */

	register: function(context){

		$("a.connect", context).on(Ulo.evts.click, {self: this}, this.request);

	},

	/* -------------------------------------------------------------------------------- */

	getIconName: function(type){

		return type + (type === "follow" ? "" : "_white");

	},

	/* -------------------------------------------------------------------------------- */

	create: function(type, user_id){

		var cap_type = Ulo.capitalise(type),

		anchor = Ulo.create("a", {

			"title": cap_type,
			"class": "connect " + type,
			"href": "/user/" + type + "/" + user_id + "/"

		});


		anchor.appendChild(Ulo.create("span", {

			"class": "icon icon_" + this.getIconName(type)}) 

		);

		anchor.appendChild(Ulo.create("span", {

				"class": "text"

			},  cap_type)

		);


		$(anchor).on(Ulo.evts.click, {self: this}, this.request);

		return anchor;

	},

	/* -------------------------------------------------------------------------------- */
	
	request: function(e){

		e.preventDefault();

		var self = e.data.self;


		if(Ulo.Pip.login() !== null){

			Ulo.Pip.open();

		}

		else if(Ulo.requestAvailable()){

			Ulo.acquireRequest();

			Ulo.addClass(e.currentTarget, Ulo.cls.disabled);


			setTimeout(function(){

				Ulo.request({

						type:"GET",
						url: e.currentTarget.getAttribute("href")

					})

					/* Params: server data, status code, xhr */
					.done(function(data, sc, xhr){

						/* If the session has changed update the entire page.  */
						
						if(Ulo.Session.hasChanged(xhr)){

							Ulo.Pip.updatePage(xhr);

						}

						/* If the login form is returned display it. */

						else if(data.html){

							Ulo.Pip.displayPage(xhr, "login");

						}

						else{

							var follow = Ulo.hasClass(e.currentTarget, "follow"),

							remove_add = follow ? ["follow", "unfollow"] : ["unfollow", "follow"];


							/* Update the url */

							e.currentTarget.href = e.currentTarget.href.replace(remove_add[0], remove_add[1]);


							/* Toggle the class on the button */

							Ulo.replaceClass(e.currentTarget, new RegExp(remove_add[0]), remove_add[1]);


							/* Change the icon */

							var icon = e.currentTarget.querySelector("span.icon");

							if(icon !== null){

								Ulo.replaceIcon(icon, self.getIconName(remove_add[1]));

							}


							/* Update the text */

							var text = e.currentTarget.querySelector("span.text"),

							cap_text = Ulo.capitalise(remove_add[1]);

							if(text !== null){

								Ulo.empty(text).appendChild( 

									document.createTextNode(cap_text) 

								);

							}

							e.currentTarget.setAttribute("title", cap_text);


							/* Update the counters */

							updateCounters(e.currentTarget, follow);

						}

					})

					/* Params: xhr, status code, error type */
					.fail(function(xhr, sc, type){


						
					})

					.always(function(){

						Ulo.removeClass(e.currentTarget, Ulo.cls.disabled);
				
				});

			}, 500);

		}

	}

}

/****************************************************************************************/

var Connect = new _Connect();

/****************************************************************************************/




/* ------------------------------------------------------------------------------------ */

function updateCounters(context, increment, value){

	var counter = context.querySelector("span.full_count");

	if(counter !== null){

		if(value === undefined){

			value = parseInt(counter.innerHTML.replace(/,/g, "")) + (increment ? 1 : -1)

		}

		if(value >= 0 && value === value){

			Ulo.empty(counter).appendChild( 

				document.createTextNode(value.toLocaleString())

			);

			counter = context.querySelector("span.abbr_count");

			if(counter !== null){

				Ulo.empty(counter)

					.appendChild( document.createTextNode( abbreviate(value) ) );

			}
			
		}

	}

}

/* ------------------------------------------------------------------------------------ */
/*
	Return the abbreviation of "value" as a string in the format "Ns" where "N" 
	is a value between 0 - 100 and "s" is the symbol that represents the value.

	@param value: int or float < 10^18 (Q, Quintillion)

	SYMBOL TABLE:

		10^3 	'K, Thousand'
		10^6 	'M, Million'
		10^9 	'B, Billion'
		10^12 	't, Trillion'
		10^15 	'q, Quadrillion'
		10^18 	'Q, Quintillion'
		...

	NOTE: This is a copy of the abbreviate function implemented in the template 
	tags file ulo_humanise.py in the ulo app.
*/
function abbreviate(value){
	
	var unit = 1
	
	var mult = 1000
	
	var max_value = 1000
	
	var abbr = ["", "K", "M", "B", "T", "Q"];

	try{

		for(var i=0; i<abbr.length; ++i){
		
			if(value < max_value){

				return Math.floor(value/unit)+abbr[i];
			
			}

			unit *= mult
			
			max_value *= mult
		
		}

		throw new Error("The value passed is too large");

	} catch(e){

		return "";
	
	}
		
}

/* ------------------------------------------------------------------------------------ */
/*
	Return a date in the format "Month Day, Year" or an empty string.
	
	@param date: DateTime string.

	NOTE: This is a copy of the short_date function implemented in the template 
	tags file ulo_humanise.py in the ulo app.
*/
function shortDate(date){
	
	try{

		date = new Date(date)

		return this.months[date.getMonth()]+" "+date.getDate()+", "+date.getFullYear();
	
	} catch(e){
	
		return "";
	
	}

}

/* ------------------------------------------------------------------------------------ */
/*
	Return datetime in the format "Nt" where N is a number and t is a period of time 
	("y" - years, "w" - weeks, "d" - days, "h" - hours, "m" - minutes and "s" - seconds).
	
	@param now: epoch milliseconds.
	@param date: DateTime string.

	NOTE: This is a copy of the elapsed_time function implemented in the template 
	tags file ulo_humanise.py in the ulo app.
*/
function elapsedTime(now, date){

	try{

		date = new Date(date);
		
		// var timeOffset = now.getTimezoneOffset();
		
		/* Seconds */
		var secs = (now-date.getTime())/1000;
		
		/* Days */
		var days = Math.floor(secs/86400);


		/* Years */
		
		if(days > 364){
			
			return Math.floor(days/365)+"y";
		
		}
			
		/* Weeks */
		
		if(days > 27){
			
			return Math.floor(days/7)+"w";
		
		}

		/* Days */

		if(days >= 1){
			
			return days+"d";
		
		}
		

		/* Hours */
		
		var t = secs / 3600
		
		if(t >= 1){
		
			return Math.floor(t)+"h";
		
		}

		/* Minutes */
		
		t = (secs % 3600) / 60
		
		if(t >= 1){
		
			return Math.floor(t)+"m";
		
		}

		/* Seconds */
		
		t = secs % 60
		
		if(t >= 1){
		
			return Math.floor(t)+"s";
		
		}

		return "now";

	} catch(e){
	
		return "";
	
	}

}

/* ------------------------------------------------------------------------------------ */



