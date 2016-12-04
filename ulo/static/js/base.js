/*

	Site wide javascript file

	Dependencies: JQuery 

*/




/* ------------------------------------------------------------------------------------ */

function debug(e){
	
	var msg = "DEBUG: " + e

	console.log(msg);

	// alert(msg);

}

/* ------------------------------------------------------------------------------------ */








/* POLYFILLERS */
/* ------------------------------------------------------------------------------------ */

if (!Function.prototype.bind){

	Function.prototype.bind = function(oThis) {
		
		if(typeof this !== "function"){

			throw new TypeError(

				"Function.prototype.bind - what is trying to be bound is not callable"

			);
		
		}

		var a = Array.prototype.slice.call(arguments, 1),
		
		FtoB = this,
		
		FN = function(){},
		
		FB = function(){

			return FtoB.apply(

				this instanceof FN ? this : oThis,
				a.concat(Array.prototype.slice.call(arguments))

			);

		};

		if (this.prototype) {

			// Function.prototype doesn't have a prototype property
			FN.prototype = this.prototype; 
		
		}
		
		FB.prototype = new FN();

		return FB;
	
	};

}

/* ------------------------------------------------------------------------------------ */
/*
	Source: https://github.com/Alhadis/Snippets/blob/master/js/polyfills/IE8-child-elements.js
*/
if(!("firstElementChild" in document.documentElement)){

	Object.defineProperty(Element.prototype, "firstElementChild", {
	
		get: function(){
			
			for(var nodes = this.children, n, i = 0, l = nodes.length; i < l; ++i){
				
				if(n = nodes[i], 1 === n.nodeType){

					return n;
				
				}

			}

			return null;
		}

	});

}

/* ------------------------------------------------------------------------------------ */
/*
	Source: https://github.com/Alhadis/Snippets/blob/master/js/polyfills/IE8-child-elements.js
*/
if(!("lastElementChild" in document.documentElement)){

	Object.defineProperty(Element.prototype, "lastElementChild", {

		get: function(){

			for(var nodes = this.children, n, i = nodes.length - 1; i >= 0; --i){
				
				if(n = nodes[i], 1 === n.nodeType){

					return n;
			
				}

			}

			return null;
		
		}

	});
}

/* ------------------------------------------------------------------------------------ */

if(!Array.isArray){

	Array.isArray = function(arg) {
		
		return Object.prototype.toString.call(arg) === '[object Array]';
		
	};
		
}

/* ------------------------------------------------------------------------------------ */








/* ------------------------------------------------------------------------------------ */
/*
	Global namespace.
*/
window.Ulo = {

	/* -------------------------------------------------------------------------------- */
	/*
		Common css classes.
	*/
	cls: {

		hide: "hide",
		show: "show",
		open: "open",
		hidden: "hidden",
		disabled: "disabled",
		modal: "modal",
		modal_open: "modal_open"

	},

	/* -------------------------------------------------------------------------------- */
	/*
		"Click" event.
	*/
	evts: {

		click: "click"

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Temporary class instances removed with each page load.
	*/
	Temp: {},

	/* -------------------------------------------------------------------------------- */

	getMediaURL: function(url){

		return "/media/" + url;

	},

	/* -------------------------------------------------------------------------------- */
	
	getUserURL: function(id){

		return "/user/" + id + "/";

	},

	/* -------------------------------------------------------------------------------- */
	
	getPostURL: function(id){

		return "/post/" + id + "/";

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Error messages displayed for request errors.

		@param xhr: xhr instance.
		@param codes: Optional object of codes/messages. If null no messages are displayed.
	*/
	requestError: function(xhr, codes){

		if(codes === null){

			return codes;

		} else{

			var messages = {

				0: "Please check your internet connection.",
				
				403: "Sorry, your request has been denied.",
				
				404: "Sorry, we could not find the page you were looking for.",

				500: "Sorry, the server did not send anything back.",

			}


			codes = codes || {};

			for(var c in codes){

				messages[c] = codes[c];

			}


			return messages[xhr.status] || codes.all;

		}

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return true if the global xhr instance is available for use. The xhr is available 
		if it is not in use or "reference" matches the current reference.

		@param reference: Optional reference assigned to the xhr instance so it can be 
			identified by its caller. The xhr instance is always available to its caller.
	*/
	requestAvailable: function(reference){

		return (

			Ulo.xhr === undefined || 
			Ulo.xhr.reference !== undefined && Ulo.xhr.reference === reference

		);

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Acquire the xhr instance if it is free.

		@param reference: Optional reference assigned to the xhr instance
	*/
	acquireRequest: function(reference){

		if(Ulo.requestAvailable(reference)){

			Ulo.xhr = {reference: reference};

		}

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Release the xhr instance.

		@param reference: Optional reference assigned to the xhr instance.
	*/
	releaseRequest: function(reference){

		if(reference === undefined || Ulo.requestAvailable(reference)){

			Ulo.xhr = undefined;

		}

	}, 

	/* -------------------------------------------------------------------------------- */
	/*
		Make a request and return the xhr instance.

		@param request: Request data object.
		@param reference: Optional reference assigned to the xhr instance.
		@param manual_release: Boolean - if true the xhr instance will not be released
			automatically on completion.
	*/
	request: function(request, reference, manual_release){

		if(Ulo.xhr !== undefined && Ulo.xhr.abort !== undefined){

			Ulo.xhr.abort();

		}

		Ulo.xhr = $.ajax(request)

			.fail(function(xhr){

				var messages = xhr.responseJSON && xhr.responseJSON.messages;

				if(messages === undefined || messages.length === 0){

					messages = Ulo.requestError(xhr, request.codes);

				}

				Ulo.messages(messages);

			})

			.always(function(){

				if(manual_release !== true){

					Ulo.releaseRequest();

				}

		});

		Ulo.xhr.reference = reference;

		return Ulo.xhr;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return the current url.
	*/
	getURL: function(){
	
		return location.pathname + location.search;
	
	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return the ID of the main element.
	*/
	getMainID: function(){

		return "main_content";

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return the the main element.
	*/
	getMain: function(){
	
		return document.getElementById("main_content");
	
	},
	
	/* -------------------------------------------------------------------------------- */
	/*
		Replace the current page with the page at "url".

		@param url: Page url. Defaults to the current page.
	*/
	replacePage: function(url){
	
		window.location.replace(url || Ulo.getURL());
	
	},

	/* ------------------------------------------------------------------------------------ */
	/*
		Return "html" as a document fragment.

		@param html: String of html.
	*/
	createFragment: function(html){

		var d = document.createDocumentFragment();
		
		d.appendChild(document.createElement("div")).innerHTML = html;
		
		return d;

	},

	/* ------------------------------------------------------------------------------------ */
	/*
		Return an element contained in a document fragment. IE does not recognise
		getElementByID consistently.

		@param fragment: Document fragment.
		@param id: Element id.
	*/
	getFragment: function(fragment, id){

		if(fragment.getElementById === undefined){
		
			return fragment.querySelector("#" + id);
		
		}
		
		return fragment.getElementById(id);

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return the element by its ID.

		@param id: Element id.
		@param selector: Optional query selector.
	*/
	get: function(id, selector){

		var e = document.getElementById(id);

		return (e === null || selector === undefined) ? e : e.querySelector(selector);

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Create a new element.

		@param tag: Element tag name.
		@param attrs: Optional object of attributes.
		@param text: Optional text string.
	*/
	create: function(tag, attrs, text){

		var e = document.createElement(tag);
		
		for(var n in attrs){

			e.setAttribute(n, attrs[n]);

		}
		
		if(text !== undefined){

			e.appendChild(document.createTextNode(text));
		
		}

		return e;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Remove all child nodes of an element.

		@param element: Node element.
	*/
	empty: function(element){

		if(element){

			while(element.firstChild){

				element.removeChild(element.firstChild);

			}

			return element;

		}

	},

	/* ------------------------------------------------------------------------------------ */
	/*
		Remove all element passed to the function.

		@param *: Node Elements.
	*/
	remove: function(){
		
		for(var i=0; i<arguments.length; i++){
		
			if(arguments[i] && arguments[i].parentNode !== null){
		
				arguments[i].parentNode.removeChild(arguments[i]);
		
			}
		
		}

	},

	/* ------------------------------------------------------------------------------------ */
	/*
		Replace old_elem with with new_elem.s
	*/
	replace: function(new_elem, old_elem){

		return old_elem.parentNode.replaceChild(new_elem, old_elem);

	},

	/* ------------------------------------------------------------------------------------ */
	/*
		Append all elements in "array" to "element".

		@param element: Node element.
		@param array: Array of node/text elements.
		@param clone: If true shallow clone the elements instead of moving them.
	*/
	append: function(element, array, clone){


		for(var i=array.length-1, reference=null, node; i>=0; --i){

			node = array[i];

			if(node){

				if(node.nodeType === node.ELEMENT_NODE || node.nodeType === node.TEXT_NODE){

					if(clone){

						node = node.cloneNode(false);

					}

					reference = element.insertBefore( node, reference );

				}

			}

		}

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return true if child is a descendant of parent and false if not.

		@param parent: Parent element that contains child.
		@param child: Element to find.
		@param depth: Max number of iterations (Defaults to 5).
	*/
	isDescendant: function(parent, child, depth){

		depth = depth || 5;
	
		for(var node = child.parentNode; node !== null && depth > 0; --depth){
			
			if(node===parent){
			
				return true;
			
			}
			
			node = node.parentNode;
		
		}
		
		return false;

	},

	/* ------------------------------------------------------------------------------------ */
	/*
		Return true if the browser supports a particular feature, else return false.

		@param attr: Name of the attribute to test for (e.g. mulitple)
		@param element: Element or Element tag name.
	*/
	isAttributeSupported: function(attr, element){

		if(element.nodeType===undefined){

			element = document.createElement(element); 

		}

		return element[attr] !== undefined;

	},

	/* ------------------------------------------------------------------------------------ */
	/*
		Return true if the event is supports.

		http://perfectionkills.com/detecting-event-support-without-browser-sniffing/

		@param name: Event name.
		@param element: Optional element to test the event against.
	*/
	isEventSupported: (function(){
	
		var TAGNAMES = {
	
			"select":"input",
			"change":"input",
			"input": "input",
			"submit":"form",
			"reset":"form",
			"error":"img",
			"load":"img",
			"abort":"img"
	
		}
		
		function isEventSupported(name, element) {
			
			if(element===undefined || element.nodeType===undefined){

				element = document.createElement(element || TAGNAMES[name] || "div");
			
			}
			
			name = "on" + name;

			var isSupported = (name in element);
			
			if (!isSupported) {
			
				element.setAttribute(name, "return;");
			
				isSupported = typeof element[name] == "function";
			
			}
			
			element = null;

			return isSupported;
		
		}
		
		return isEventSupported;

	})(),

	/* ------------------------------------------------------------------------------------ */
	/* 
		Return a class instance that inherits "prototype".

		@param prototype: Object.
	*/
	inherit: function(prototype){

		/* Dummy constructor function */
		function f(){}

		/* Assign to it the prototype to inherit */
		f.prototype = prototype;

		/* Return 'subclass' */
		return new f();

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Capitalise the first letter in a string.

		@param str: String.
	*/
	capitalise: function(str){

		return str.charAt(0).toUpperCase() + str.slice(1);

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return a regexp to find a class name in a string.

		@param cls: Class name.
	*/
	classRegExp: function(cls){

		return new RegExp("(^|\\s+)" + cls + "(\\s+|$)");

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return true if "element" has the class "cls" and false otherwise.

		@param element: Javascript element.
		@param cls: Class name.
	*/
	hasClass: function(element, cls){

		return Ulo.classRegExp(cls).test(element.className);

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Append the class "cls" to the "element".

		@param element: Javascript element.
		@param cls: Class name.
	*/
	_addClass: function(element, cls){

		element.className += ( element.className === "" ? "" : " " ) + cls;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Append the class "cls" to the "element" if it does not exist.

		@param element: Javascript element.
		@param cls: Class name.
	*/
	addClass: function(element, cls){

		try{
		
			if(Ulo.classRegExp(cls).test(element.className) === false){
		
				Ulo._addClass(element, cls);
		
			}
		
		}catch(e){ 

			debug(e); 

		}
		
		return element;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Remove the class "cls" from the "element".

		@param element: Javascript element.
		@param cls: Class name.
	*/
	removeClass: function(element, cls){

		try{

			element.className = element.className.replace(Ulo.classRegExp(cls), "$2");
		
		} catch(e){

			debug(e);

		}

		return element;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Remove the class that matches the regular expression "regexp" and add "cls" to 
		"element".

		@param element: Javascript element.
		@param regex: Regular expression.
		@param cls: Class name.
	*/
	replaceClass: function(element, regexp, cls){

		try{

			element.className = element.className.replace(regexp, "");

			Ulo.addClass(element, cls);
		
		} catch(e){

			debug(e);

		}

		return element;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Remove the current icon class and add the icon "name" to the element.

		@param element: Javascript element.
		@param name: Icon name (excluding the prefix "icon_").
	*/
	replaceIcon: function(element, name){

		return Ulo.replaceClass(element, /icon_[\w]+/, "icon_" + name);

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Toggle the class "cls" on the "element". Return true if the class has been added
		and false if removed.

		@param element: Javascript element.
		@param cls: Class name.
	*/
	toggleClass: function(element, cls){

		var add_class = Ulo.classRegExp(cls).test(element.className) === false;

		(add_class ? Ulo._addClass : Ulo.removeClass)(element, cls);

		return add_class;

	},

	/* -------------------------------------------------------------------------------- */




	/* CLASSES */
	/* -------------------------------------------------------------------------------- */
	/*
		Simplified version of Function.prototype.bind() for class instances created in 
		Ulo namespace.
	*/
	_bindClsArgs: function(){

		/* Remove the required arguments from the list. See Ulo.newClass arguments */
		var args = Array.prototype.slice.call(arguments, 3);

		/* Bind the arguments */
		function F(){

			return this.constructor.apply(

				this,
				args.concat(Array.prototype.slice.call(arguments))

			);
		
		}

		F.prototype = this.prototype;

		return F;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Create an instance of the class and store a global reference to it in the Ulo
		namespace.
		
		@param Cls: Class
		@param name: Fallback name if Cls.name is not a property.
		@param tmp: Boolean - If true remove the class when the page unloads.
		@params 3..N: arguments passed to the class constructor.
	*/
	newClass: function(Cls, name, tmp){

		try{

			if(Cls.name===undefined){

				Cls.name = name;

			}

			var obj = (tmp===true) ? this.Temp : this;

			obj[Cls.name] = new (this._bindClsArgs.apply(Cls, arguments));

		} catch(e){

			debug(e);

		}

	},
	
	/* -------------------------------------------------------------------------------- */
	/*
		Store a global reference to a class.

		@param Cls: Class
		@param name: Class name
		@param tmp: Boolean - If true remove the class when the page unloads.
	*/
	refClass: function(Cls, name, tmp){

		if(Cls.name === undefined){

			Cls.name = name;

		}
		
		var obj = (tmp === true ? this.Temp : this);
		
		obj[Cls.name] = Cls;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Remove a reference to a class.

		@param Cls: Class
	*/	
	delClass: function(Cls){

		delete this[Cls.name];

	},

	/* -------------------------------------------------------------------------------- */	
	/*
		Check that the class names passed as arguments are referenced in the Global 
		(window) or temporary (Ulo.Temp) namespace.

		@param fail_silently: Optional boolean to prevent an exception from being thrown.
		@params 0..N: Class names (e.g. "Page", "Menu");.
	*/
	checkTempDependencies: function(fail_silently){

		var i = typeof arguments[0]==="boolean" ? 1 : 0;

		for(; i<arguments.length; ++i){

			if(window[arguments[i]]===undefined && this.Temp[arguments[i]]===undefined){
	
				if(arguments[0]===true){

					return false;

				}
				
				throw new Error("Global dependency missing: " + arguments[i]);

			}

		}

		return true;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Check that the class names passed as arguments (args) are referenced in the Ulo
		namespace. Thrown an exception or return false if the class has not been defined
		and return true otherwise.

		@param type: typeof value to check the class name against.
		@param name: Name of the check to perform ("dependency" or "reference").
		@param args: Array of class names. A boolean value can be passed as the first
			argument and if true the function will return false instead of throwing an
			exception.
	*/
	_checkUloCls: function(type, name, args){

		var i = typeof args[0]==="boolean" ? 1 : 0;

		for(; i<args.length; ++i){

			if(this[args[i]]===undefined || typeof this[args[i]]!==type){

				if(args[0]===true){

					return false;

				}
				
				throw new Error("Missing "+name+": "+args[i]);

			}

		}

		return true;

	},

	/* -------------------------------------------------------------------------------- */	
	/*
		Check that all classes have instances defined in the Ulo namespace.
		
		@param fail_silently: Optional boolean to prevent an exception from being thrown.
		@params 0..N: Class names (e.g. "Page", "Menu");
	*/
	checkDependencies: function(fail_silently){
	
		return this._checkUloCls("object", "dependency", arguments);
	
	},
	
	/* -------------------------------------------------------------------------------- */
	/*
		Check that all classes have references defined in the Ulo namespace.

		@param fail_silently: Optional boolean to prevent an exception from being thrown.
		@params 0..N: Class names (e.g. "Page", "Menu");
	*/
	checkReferences: function(fail_silently){
	
		return this._checkUloCls("function", "reference", arguments);
	
	},
	
	/* END CLASSES */
	/* -------------------------------------------------------------------------------- */




	/* HELPERS */
	/* -------------------------------------------------------------------------------- */
	/*
		Helper function for Class Page.
	*/
	register: function(context){

		if(Ulo.Page !== undefined){

			Ulo.Page.register(context)

		}

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Helper function for Class Message.
	*/
	messages: function(){

		if(Ulo.Message !== undefined){

			Ulo.Message.add.apply(Ulo.Message, arguments);

		}

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Helper function for Class Menu.
	*/
	menus: function(){

		if(Ulo.Menu !== undefined){

			var fn = arguments.length === 1 ? "unregister" : "register";

			Ulo.Menu[fn].apply(Ulo.Menu, arguments);

		}

	},

	/* END HELPERS */
	/* -------------------------------------------------------------------------------- */

};

/* ------------------------------------------------------------------------------------ */








/* GLOBALS */
/* ------------------------------------------------------------------------------------ */
/* 
	(5-Feb-16)
	https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/encodeURI.
	
*/
function fixedEncodeURI(str){

    return encodeURI(str).replace(/%5B/g, '[').replace(/%5D/g, ']');

}

/* ------------------------------------------------------------------------------------ */
/*
	(5-Feb-16)
	https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/
		encodeURIComponent.
*/
function fixedEncodeURIComponent(str){

	return encodeURIComponent(str).replace(/[!'()*]/g, function(c){

		return '%' + c.charCodeAt(0).toString(16);

	});

}

/* DRAGGABLE */
/* ------------------------------------------------------------------------------------ */
/*
	Base class to create draggable elements.

	@param element: Element node or element ID.
	@param settings: Optional settings to add or override existing settings (this.settings).
	@param target: Optional element stored in the class. 
*/
function Draggable(element, settings, target, centre){
	
	try{
		
		/* Events */
		this.start_events = "mousedown touchstart pointerdown";
		this.move_events = "mousemove touchmove pointermove";
		this.end_events = "mouseup touchend pointerup";

		/* Client X and Y positions set when a start event is triggered. */
		this.start = { X: 0, Y: 0 };

		/*
			Optional target element - If null the class will not set move or end handler
			in the start event.
		*/
		this.target = target;


		this.centre = (centre === undefined ? true : centre);

		/* Relative or absolute positioned html element */
		var isElementNode = (

			element && 
			element.nodeType !== undefined && 
			element.nodeType === element.ELEMENT_NODE

		);

		this.element = (isElementNode ? element : document.getElementById(element));

		/* Fefault settings */
		this.settings = {
			
			/* Css box boundaries */
			top: 0, right: 0, bottom: 0, left: 0,
			
			/* Directions of movement */
			horizontal: true, vertical: true,

			/* Start position offsets */
			offsetX: 0, offsetY: 0
		
		}
		
		for(var key in settings){
		
			/* Override or add variables to the settings object */
			this.settings[key] = settings[key];
		
		}

	} catch(e){

		debug(e);
	
	}

}

Draggable.prototype = {
	
	constructor: Draggable,

	/* -------------------------------------------------------------------------------- */
	/*
		Register start events on the element.
	*/
	register: function(element){
	
		$(element || this.element).off(this.start_events, this.startHandler)
			.on(this.start_events, {self: this}, this.startHandler);

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Unregister start events on the element.
	*/
	unregister: function(element){
		
		$(element || this.element).off(this.start_events, this.startHandler);

	},

	/* -------------------------------------------------------------------------------- */


	/* EVENT HANDLERS */
	/* -------------------------------------------------------------------------------- */
	/*
		Set the starting postions (X and Y) and register the move and end events.
	*/
	startHandler: function(e){
		
		try{

			var self = e.data.self;
			
			if(self.element !== null && self.target !== null){


				/* Move the element to start position */

				if(self.centre === true){

					self.start = self.getOffset(e.currentTarget);
					self.moveHandler.call(this, e);

				}

				/* Set the start position for move events */

				self.start = self.getPosition(e);
				self.start.X -= e.currentTarget.offsetLeft;
				self.start.Y -= e.currentTarget.offsetTop;


				/* Add move and end events to the document */

				$(document).on(self.move_events, {self: self}, self.moveHandler);
				$(document).on(self.end_events, {self: self}, self.endHandler);


				/* Event handled */

				e.stopPropagation();
				e.preventDefault();

			}

		}catch(e){
	
			debug(e);
	
		}
	
	},

	/* -------------------------------------------------------------------------------- */
	/*
		Set the new left and top position of the element. See calcPosition.
	*/
	moveHandler: function(e){
		
		try{
		
			var self = e.data.self,

			pos = self.getPosition(e);


			/* If horizontal movements are enabled set the left postition */
			if(self.settings.horizontal){
			
				self.calcPosition(pos.X-self.start.X, "left", "right");
			
			}

			/* If vertical movements are enabled set the top postition */
			if(self.settings.vertical){
				
				self.calcPosition(pos.Y-self.start.Y, "top", "bottom");
			
			}

			/* Event handled */
			e.stopPropagation();
			e.preventDefault();

		}catch(e){
		
			debug(e);
		
		}
	
	},

	/* -------------------------------------------------------------------------------- */
	/*
		Remove the move and end events from the document.
	*/
	endHandler: function(e){
	
		try{
			
			var self = e.data.self;
			
			/* Remove move and end events */
			$(document).off(self.move_events, self.moveHandler);
			$(document).off(self.end_events, self.endHandler);
	
			/* Event handled */
			e.stopPropagation();
			e.preventDefault();	
			
		}catch(e){
	
			debug(e);
	
		}
	
	},

	/* END EVENT HANDLERS */
	/* -------------------------------------------------------------------------------- */


	/* ELEMENT POSITIONING */
	/* -------------------------------------------------------------------------------- */
	/*
		Set the new position of the element constraining it to its bounding box 
		positions defined by the settings object.
	
		@param e: Event object.
		@param pos: X or Y position of the event. 
		@param p1: First bounding position ("left" or "top").
		@param p2: Second bounding position ("right" or "bottom").
	*/
	calcPosition: function(pos, p1, p2){

		if(pos < this.settings[p1]){ 
		
			pos = this.settings[p1]; 
		
		} else if(pos > this.settings[p2]){ 
		
			pos = this.settings[p2]; 
		
		}

		this.element.style[p1] = pos + "px";

	},

	/* END ELEMENT POSITIONING */
	/* -------------------------------------------------------------------------------- */


	/* HELPER FUNCTIONS */
	/* -------------------------------------------------------------------------------- */
	/*
		Return the pixel value (pix) as a percentage.
		
		@param pixels: Pixel length.
		@param length: Full length of the element to which pix is a section of.
	*/
	pixelToPercent: function(pixels, length){
	
		return 100*pixels / length;
	
	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return the X and Y position of "target".

		@param target: Element node.
	*/
	getOffset: function(target){

		var scroll = this.getScrollOffsets(),

		bounding = target.parentNode.getBoundingClientRect();
		
		return {

			X: target.clientWidth * 0.5 + bounding.left + scroll.X - this.settings.offsetX,
			Y: target.clientHeight * 0.5 + bounding.top + scroll.Y - this.settings.offsetY

		}

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return the X and Y position of the event throw an exception.
		
		@params: e: Event.
	*/
	getPosition: function(e){
		
		var pos;
		
		/* JQuery's normalised pageX/Y */
		if(e.pageX !== undefined){
		
			return { X: e.pageX, Y: e.pageY };
	
		} 

		/* Raw event data with scroll offsets applied */
		else if(e.originalEvent.clientX !== undefined){
		
			var scroll = e.data.self.getScrollOffsets();

			return { 

				X: e.originalEvent.clientX + scroll.X, 
				Y: e.originalEvent.clientY + scroll.Y

			}
		
		}

		/* Touch events */
		else if(e.originalEvent.touches !== undefined){
		
			return { 

				X: e.originalEvent.touches[0].pageX, 
				Y: e.originalEvent.touches[0].pageY

			} 
		
		}

		// /* Pointer events: UNTESTED!!! */
		// else if(e.originalEvent.currentPoint){
			
		// 	return e.originalEvent.currentPoint[coord.toLowerCase()];
		
		// }
		
		throw new Error("Start position not found.");
	
	},

	/* -------------------------------------------------------------------------------- */
	/* 
		Return the scroll X and Y offset positions.
		Javascript The Definitive Guide (6th Edition) pg: 391
	*/
	getScrollOffsets: function(){
	
		/* All browsers except IE8 and before */
		if(window.pageXOffset !== null){
	
			return {X: window.pageXOffset, Y: window.pageYOffset};
	
		}
	
		/* For IE or any browser in standard mode */
		var d = window.document;
	
		if(d.compatMode === "CSS1Compat"){
	
			return { X: d.documentElement.scrollLeft, Y: d.documentElement.scrollTop };
	
		}
	
		/* For browsers in Quirks mode */
		return { X: d.body.scrollLeft, Y: d.body.scrollTop };
	
	}

	/* END HELPER FUNCTIONS */
	/* -------------------------------------------------------------------------------- */

};

/* END DRAGGABLE */
/* ------------------------------------------------------------------------------------ */


/* END GLOBALS */
/* ------------------------------------------------------------------------------------ */








/* ------------------------------------------------------------------------------------ */

(function () {


	/* ANIMATE */
	/* -------------------------------------------------------------------------------- */

	function Animate(){

		var bar = this.get();

		this.transitionEvent = this.transitionEvent(bar);


		if(this.transitionEvent !== null){

			$(bar).on(this.transitionEvent, {self: this}, this.transitionend);

		}

	}

	Animate.prototype = {

		constructor: Animate,

		/* ---------------------------------------------------------------------------- */
		/*
			Return the element used to display a loading bar to the user.
		*/
		get: function(){

			var header = document.getElementsByTagName("header")[0];

			return header.querySelector("span.loading_bar");

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Set the width of the loading bar.

			@param value: Value between 0 and 100.
		*/
		set: function(value){

			var bar = this.get();

			if(value === 0 || value === 100 && this.transitionEvent === null){

				Ulo.addClass(bar, Ulo.cls.hide);

				value = 0;

			}

			bar.style.width = value + "%";
			
			bar.offsetLeft;

			Ulo.removeClass(bar, Ulo.cls.hide);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Reset the loading bar when the transition ends.
		*/
		transitionend: function(e){

			var self = e.data.self,

			bar = self.get();


			if(bar.style.width === "100%"){

				self.set(0);

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return the transition end event name or null if not supported by the browser. 
		*/
		transitionEvent: function(element){

			var transitions = {

				"transition"		: "transitionend",
				"WebkitTransition"	: "webkitTransitionEnd",
				"MozTransition"		: "transitionend",
				"OTransition"		: "oTransitionEnd otransitionend"
			
			};

			for(var t in transitions){
				
				if(element.style[t] !== undefined){
					
					return transitions[t];
				
				}
			
			}

			return null;

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Upload progress bar.
		*/
		upload: function(){

			var xhr = $.ajaxSettings.xhr();

			// Upload progress
			if(xhr.upload){

				xhr.upload.addEventListener("progress", function(e){

					if(e.lengthComputable){

						var percent = Math.ceil((e.loaded / e.total) * 100);

						Ulo.Animate.set(percent);
					
					}

				}, false);

			}

			return xhr;

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Download progress bar.
		*/
		download: function(){

			var xhr = $.ajaxSettings.xhr();

			// Download progress
			xhr.addEventListener("progress", function(e){

				if(e.lengthComputable){

					var percent = Math.ceil((e.loaded / e.total) * 100);

					Ulo.Animate.set(percent);
				
				}

			}, false);

			return xhr;

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Upload progress bar.
		*/
		_animate: function(element, start, cls){

			(start ? Ulo.addClass : Ulo.removeClass)(element, cls);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Upload progress bar.
		*/
		bounce: function(element, start){

			this._animate(element, start, "bounce");

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Upload progress bar.
		*/
		pulse: function(element, start){

			this._animate(element, start, "pulse");

		},

		/* ---------------------------------------------------------------------------- */

	}

	/* -------------------------------------------------------------------------------- */

	Ulo.newClass(Animate, "Animate");

	/* END ANIMATE */
	/* -------------------------------------------------------------------------------- */




	/* MESSAGE */
	/* -------------------------------------------------------------------------------- */
	/*
		Disaply a message at the top of the page.
	*/
	function Message(){

		var button = Ulo.get("messages", "div.container")

			.appendChild( Ulo.create("div", {"class": "close"}) )

			.appendChild(

				Ulo.create("button", {"class": "icon icon_cross", "type": "button"})

		);

		button.appendChild(Ulo.create("span", {"class": "hide"}, "Close"));

		$(button).on(Ulo.evts.click, {self: this}, this.closeHandler);	

		Ulo.removeClass(this.getContainer(), "no_js");
		
	}

	Message.prototype = {

		constructor: Message,

		/* ---------------------------------------------------------------------------- */
		/*
			Return the outermost container.
		*/
		getContainer: function(){
		
			return Ulo.get("messages");
		
		},
		
		/* ---------------------------------------------------------------------------- */
		/*
			Return the messages container.
		*/
		getMessages: function(){
		
			return Ulo.get("messages", "div.text");
		
		},
		
		/* ---------------------------------------------------------------------------- */
		/*
			Hide the messages container and clear the timeout.
		*/
		close: function(){
		
			clearTimeout(this.timeout_id);
		
			Ulo.empty(this.getMessages());
		
			Ulo.removeClass(this.getContainer(), Ulo.cls.show);
		
		},

		/* ---------------------------------------------------------------------------- */
		/*
			Event handler for close().
		*/
		closeHandler: function(e){
		
			e.data.self.close();
		
		},
		
		/* ---------------------------------------------------------------------------- */
		/*
			Remove all messages after a timeout.

			@param time: Optional time in milliseconds.
		*/
		timeout: function(time){
		
			var self = this;
		
			clearTimeout(this.timeout_id);
		
			this.timeout_id = setTimeout(function(){ self.close(); }, time || 4000);
		
		},
		
		/* ---------------------------------------------------------------------------- */
		/*
			Append messages to the message container.
	
			@param messages: String or array of objects containing the properties 
				"message" and "tags" (optional) where tags is a string of class names.
			@param keep: Optional boolean - if true append new messages to the current
				messages, else remove the old messages before displaying the new ones.
			@param time: Optional time in milliseconds. All messages will be removes
				after "time". If zero the message will not timeout. Defaults to 4000.

		*/
		add: function(messages, keep, time){

			if(messages){

				if(Array.isArray(messages) === false){

					messages = [{message: messages}];

				}

				if(messages.length !== 0){

					var msg = this.getMessages();

					/* Clear the current contents if keep is not true */
					if(keep !== true){

						Ulo.empty(msg);
					
					}

					/* Append each message to the message box */
					for(var i in messages){

						var attrs = {};

						if(typeof messages[i] === "string" || messages[i] instanceof String){

							messages[i] = { message: messages[i] };

						}

						if(messages[i].tags){ 

							attrs["class"] = messages[i].tags;
						
						}

						var p = Ulo.create("p", attrs, messages[i].message || "");

						if(Ulo.hasClass(p, "persist")){

							time = 0;

						}

						msg.appendChild(p);

					}

					/* Set a timeout to remove the messages. */
					if(time !== 0){

						this.timeout(time);
					
					}

					/* Display the messages container */
					Ulo.addClass(this.getContainer(), Ulo.cls.show);
				
				}

			}

		},

	}

	/************************************************************************************/

	Ulo.newClass(Message, "Message");

	/************************************************************************************/

	/* END MESSAGE */
	/* -------------------------------------------------------------------------------- */




	/* MENU */
	/* -------------------------------------------------------------------------------- */
	/*
		Toggle the display of an element.

		Attributes (set on the button or anchor):

			"data-toggle": 

				ID of the element to toggle.

			"data-touch" (optional):

				"local": Toggle the element via the dedicated button only.
				
				"global": Close the element with the first click outside of the element.
				
				none: Close the element with the next click.

	*/
	function Menu(){

		this.open_menus = [];

	}

	Menu.prototype = {

		constructor: Menu,

		/* ----------------------------------------------------------------------------- */
		/*
			Register click events on the button to toggle an element.

			@param button: Button or anchor element.
			@param dimension: Dimension to toggle ("height" or "width").
			@param menu_cls: Optional class name toggled on the element being toggled.
			@param cls_only: Optional boolean - If true set menu_cls only and not the 
				pixel dimension.
			@param callback: Option callback function. Arguments passed to the function:

					@param isClosed: True if the menu is closed or menu_cls has been 
						removed and cls_only is true, else false.
					@param button: Register button or anchor element.
					@param element: Element being toggled.
					@param target: Event target element (e.target).

			@param preventDefault: Boolean - if true trigger e.preventDefault().
		*/
		register: function(button, dimension, menu_cls, cls_only, callback, preventDefault){

			if(button){

				var data = {

					self: this,
					dimension: dimension,
					menu_cls: menu_cls || false,
					cls_only: cls_only || false,
					callback: callback || false,
					preventDefault: preventDefault || false

				}

				$( button.nodeType === undefined ? Ulo.get(button) : button )

					.off(Ulo.evts.click, this.toggle)

					.on(Ulo.evts.click, data, this.toggle);

			}
		},

		/* ----------------------------------------------------------------------------- */
		/*
			Unregister the element.

			@param button: Registered button or anchor element.
		*/
		unregister: function(button){

			$( button.nodeType === undefined ? Ulo.get(button) : button )

				.off(Ulo.evts.click, this.toggle);

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Update the dimensions and css of the toggled element and button.

			@param data: Data of the element. See register.
			@param value: Dimension value.
			@param target. Event target element (e.target).
		*/
		actions: function(data, value, target){

			var close = value===0,

			cls_added;


			/* Set the class name on the button */
			(close ? Ulo.removeClass : Ulo.addClass)(data.button, "menu_open");

			/* Force repaint */
			data.element.offsetLeft;

			/* Toggle the class on the menu if one was provided. */
			if(data.menu_cls !== false){

				cls_added = Ulo.toggleClass(data.element, data.menu_cls);

			}
			

			/* Set the new dimension of the element if not class only. */
			if(data.cls_only === false){

				data.element.style[ data.dimension ] = value + "px";

			}

			/*
				Else set the value of close to indicate if menu_cls has been added (false) 
				or removed (true) from the element.
			*/
			else{

				close = !cls_added;

			}


			/* Run the callback function if one was provided. */
			if(data.callback !== false){
				
				data.callback(close, data.button, data.element, target);
			
			}

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Toggle element event handler.
		*/
		toggle: function(e){

			if(e.data.preventDefault === true){

				e.preventDefault();

			}


			var element = Ulo.get(e.currentTarget.getAttribute("data-toggle"));


			if(element !== null){


				var self = e.data.self,

				dimension = e.data.dimension,

				cap_dimension = Ulo.capitalise(dimension),

				value = element[ "client" + cap_dimension ];


				if(value === 0){

					if(e.data.cls_only){

						value = 1;

					} else{

						value = element[ "scroll" + cap_dimension ];

						value = undefined;
						
						/*
							If element.scrollWidth/Height is undefined show the menu
							to read its width or height
						*/
						if(value===undefined){
							
							var display_style = element.style.display,

							dimension_style = element.style[ dimension ];


							element.style.display = "block";

							element.style[ dimension ] = "auto";
							

							value = element[ "client" + cap_dimension ];

							element.style.display = display_style;

							element.style[ dimension ] = dimension_style;

						}

					}

				} else{

					value = 0;
				
				}


				var touch = e.currentTarget.getAttribute("data-touch");

				e.data.touch = touch;

				e.data.button = e.currentTarget;

				e.data.element = element;


				if(touch === "local"){

					self.actions(e.data, value, e.target);

				}


				else if(value !== 0){

					if(self.open_menus.length === 0){

						self.open_menus.push( undefined );

						$(document).on(Ulo.evts.click, {self: self}, self.close);

					}

					self.open_menus.push( e.data );

					self.actions(e.data, value, e.target);

				}

			}

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Document event handler to close the open menu.
		*/
		close: function(e){

			var self = e.data.self,

			data = self.open_menus.shift();


			if(data !== undefined){

				if(data.touch === "global" && 
					Ulo.isDescendant(data.element.parentNode, e.target)){

					self.open_menus.unshift(data);

				}

				else{

					self.actions(data, 0, e.target);

					if(self.open_menus.length === 0){

						$(document).off(e.type, self.close);

					}

				}	

			}

		}

	}

	/************************************************************************************/

	Ulo.newClass(Menu, "Menu");

	/************************************************************************************/

	/* END MENU */
	/* -------------------------------------------------------------------------------- */




	/* NAV SEARCH */
	/* -------------------------------------------------------------------------------- */
	/*
		Toggle and submit the nav search form.
	*/
	function NavSearch(){

		var container = this.getContainer();


		/* Search filters */

		var filter = this.getFilter(),

		button = container.querySelector("button.toggle_filter_ul"),

		target = Ulo.get("filter_ul", "li[data-value='" + filter.value + "']");

		if(target !== null){

			Ulo.addClass(target, "selected");

			Ulo.replaceIcon(button.querySelector("span.icon"), target.getAttribute("data-icon"));

		}

		Ulo.menus(button, "height", "open", false, this.filters.bind(this));


		/* Search form */

		$(this.getForm()).on("submit", {self: this}, this.submit);

		$(this.getInput()).on("input", {self: this}, this.autocomplete);

		$(container.querySelector("button.close")).on(Ulo.evts.click, {self: this}, this.close);

		$(container.querySelector("button.submit")).on(Ulo.evts.click, {self: this}, this.open);

	}

	NavSearch.prototype = {

		constructor: NavSearch,

		/* ----------------------------------------------------------------------------- */
		/*
			Register search suggestions links.
		*/
		register: function(a){

			if(Ulo.Page !== undefined){

				$(a).on(Ulo.evts.click, {self: this}, this.search);

			}

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Update the search input field before following the link. See posts().
		*/
		search: function(e){

			e.preventDefault();

			var self = e.data.self,

			query = e.currentTarget.querySelector("div.title");

			self.getInput().value = query.textContent || query.innerHTML;
			
			Ulo.Page.getPage(e.currentTarget.href, true);

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Return the nav search container.
		*/
		getContainer: function(){

			return Ulo.get("nav_search");

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Return the nav search form.
		*/
		getForm: function(){

			return Ulo.get("nav_search_form");

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Return the nav search input field.
		*/
		getInput: function(){

			return Ulo.get("nav_search_form", "input[name='q']");

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Return the nav search filter field.
		*/
		getFilter: function(){

			return Ulo.get("nav_search_form", "input.query_filter");

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Return the nav search suggestions / filter container.
		*/
		getSuggestionsContainer: function(){

			return Ulo.get("nav_search", "div.search_data");

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Return the nav search suggestions container.
		*/
		getSuggestions: function(){

			return Ulo.get("suggestions");

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Open the search form if it is not visible else submit the form.
		*/
		open: function(e){

			var self = e.data.self,

			container = self.getContainer();


			if(container.clientWidth < 100){	

				e.preventDefault();

				Ulo.addClass(container, Ulo.cls.open);

			} else{

				e.target = e.currentTarget = self.getForm();

				self.submit.call(e.target, e);

			}

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Close the search form.
		*/
		close: function(e){

			e.preventDefault();

			Ulo.removeClass(e.data.self.getContainer(), Ulo.cls.open);

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Submit search form.
		*/
		submit: function(e){

			var self = e.data.self,

			input = self.getInput(),

			value = $.trim(input.value);

			
			if(value !== ""){

				/*
					Do not trigger e.preventDefault() if the url cannot be updated 
					following an ajax call.
				*/
				if(Ulo.Page === undefined){
		
					return true;
				
				}

				var url = e.target.getAttribute("action") + "?" + $(e.target).serialize();	
				
				Ulo.Page.getPage(url, true);

			}

			e.preventDefault();

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Filter selection.

			@params *: See Class Menu callback function.
		*/
		filters: function(isClosed, button, menu, target){

			var icon_name = null,

			selected = menu.querySelector("li.selected");


			if(Ulo.isDescendant(menu, target, 1)){

				var filter_value = null;


				if(selected === target){

					icon_name = "down_arrow";

				} else{

					filter_value = target.getAttribute("data-value");

					icon_name = target.getAttribute("data-icon");

					Ulo.removeClass(selected, "selected");

				}


				Ulo.toggleClass(target, "selected");

				this.getFilter().value = filter_value;

				this.autocomplete();


			} else if(selected === null){
				
				icon_name = (isClosed ? "down" : "up") + "_arrow";

			}


			if(icon_name !== null){

				Ulo.replaceIcon(button.querySelector("span.icon"), icon_name);

			}

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Fetch search suggestions.
		*/
		autocomplete: function(e){

			if(e === undefined){

				e = { data: { self: this }, currentTarget: this.getInput() };

			} else{

				e.preventDefault();

			}

			var self = e.data.self,

			value = $.trim(e.currentTarget.value);

			if(value !== "" && Ulo.requestAvailable("autocomplete")){

				Ulo.request({

						type: "GET",
						data: $(self.getForm()).serialize(),
						url: "/search/autocomplete/"

					}, "autocomplete")

					.done(function(data, sc, xhr){

						self.suggestions(data);

				});

			} else{

				self.hideSuggestions();

			}

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Render the sugeestions.
		*/
		suggestions: function(data){

			var keys = ["posts", "users"], 

			isEmpty = true,

			suggestions, 

			container;


			for(var key in keys){

				key = keys[key];

				suggestions = data[key];

				container = Ulo.get("suggestions", "ul." + key + "_suggestions");


				Ulo.empty(container, key);

				if(suggestions && suggestions.length > 0){

					isEmpty = false;

					this[key](suggestions, container);

					Ulo.removeClass(container, Ulo.cls.hide);

				} else{

					Ulo.addClass(container, Ulo.cls.hide);

				}

			}


			if(isEmpty){

				this.hideSuggestions();

			} else{

				this.showSuggestions();

			}

		},

		/* ----------------------------------------------------------------------------- */
		/*
			HTML for user suggestions.

			@param suggestions: User suggestions.
			@param container: User suggestions container.
		*/
		users: function(suggestions, container){

			var i, li, user, source;

			for(i in suggestions){

				source = suggestions[i]._source;

				li = Ulo.create("li");

				user = li.appendChild(

					Ulo.create("a", {

						"href": Ulo.getUserURL(source.username),
						"data-apl": "true"

					})

				);

				user.appendChild(

					Ulo.create("img", {"src": Ulo.getMediaURL(source.thumbnail)})

				);

				user = user.appendChild(

					Ulo.create("div", {"class": "names"})

				);

				user.appendChild(

					Ulo.create("span", {"class": "name ellipsis"}, source.name)

				);

				user.appendChild(

					Ulo.create("span", {

						"class": "username ellipsis"}, 
						"@" + source.username

					)

				);

				Ulo.register(li);

				container.appendChild(li);

			}

		},

		/* ----------------------------------------------------------------------------- */
		/*
			HTML for post suggestions.

			@param suggestions: Post suggestions.
			@param container: Post suggestions container.
		*/
		posts: function(suggestions, container){

			var i, li, title, filter = this.getForm().querySelector("input.query_filter");

			for(i in suggestions){

				li = Ulo.create("li");

				title = li.appendChild(

					Ulo.create("a", {

						"href": (

							"/search/?q=" + fixedEncodeURIComponent(suggestions[i].text) + 
							"&" + filter.name + "=" + filter.value

						),
						"data-apl": "true"

					})

				);

				this.register(title);

				title.appendChild(

					Ulo.create("div", {"class": "title"}, suggestions[i].text)

				);

				container.appendChild(li);

			}

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Hide search suggestions.
		*/
		hideSuggestions: function(e){

			var self = (e === undefined ? this : e.data.self),

			hide = (

				e === undefined ||
				Ulo.isDescendant(self.getForm(), e.target, 2) === false &&
				Ulo.isDescendant(Ulo.get("filter_ul"), e.target, 2) === false

			);

			if(hide){

				var container = self.getSuggestionsContainer(),

				suggestions = self.getSuggestions();


				Ulo.removeClass(container, Ulo.cls.open);

				Ulo.removeClass(suggestions, Ulo.cls.open);


				$(suggestions)

					.off("mouseover", self.focusLink)
					
					.off("mouseout", self.blurLink);


				$(document)

					.off("keydown",  self.shortcuts)
					
					.off(Ulo.evts.click, self.hideSuggestions);

			}

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Show search suggestions.
		*/
		showSuggestions: function(){

			var container = this.getSuggestionsContainer(),

			suggestions = this.getSuggestions();

			
			Ulo.addClass(container, Ulo.cls.open);
				
			Ulo.addClass(suggestions, Ulo.cls.open);


			$(suggestions)

				.on("mouseover", {self: this}, this.focusLink)
					
				.on("mouseout", {self: this}, this.blurLink);

			$(document)

				.on("keydown", {self: this}, this.shortcuts)

				.on(Ulo.evts.click, {self: this}, this.hideSuggestions);

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Select the next or previous suggestions.

			@param next: Boolean - if true select next, else select previous.
			@param selected: Current selection or null.
			@param suggestions: Suggestions container.
		*/
		selectSibling: function(next, selected, suggestions){

			var sibling,

			direction = next ? 

				{ element: "firstElementChild", sibling: "nextSibling" }

				:

				{ element: "lastElementChild", sibling: "previousSibling" };


			/* Select the first or last li */

			if(selected === null){

				/* Get the first or last ul. */

				sibling = suggestions[direction.element];

				/* Set sibling to the first or last li in the ul. */

				sibling = sibling[direction.element];

			}

			/* Select the next or previous li */

			else{

				/* Get the next or previous li. */

				sibling = selected[direction.sibling];


				if(sibling === null){

					/* Get the next or previous ul. */

					sibling = selected.parentNode[direction.sibling];


					/* Ignore all non element nodes */

					while(sibling !== null && sibling.nodeType !== selected.ELEMENT_NODE){

						sibling = sibling[direction.sibling];

					}


					/* If there is no next or previous ul wrap back around */

					if(sibling === null){

						sibling = suggestions[direction.element];

					}

					/* Set sibling to the first or last li in the next or previous ul. */

					sibling = sibling[direction.element];

				}	

			}

			Ulo.removeClass(selected, "selected");

			Ulo.addClass(sibling, "selected");

			sibling.querySelector("a").focus();

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Navigate the suggestions with the arrow keys.
		*/
		shortcuts: function(e){

			var self = e.data.self,

			suggestions = self.getSuggestions(),

			selected = suggestions.querySelector("li.selected");


			/* Up arrow */

			if(e.which === 38){

				e.preventDefault();

				self.selectSibling(false, selected, suggestions);

			}

			/* Down arrow */

			else if(e.which === 40){

				e.preventDefault();

				self.selectSibling(true, selected, suggestions);

			}

		},


		/* ----------------------------------------------------------------------------- */
		/*
			Focus the suggestions link.
		*/
		focusLink: function(e){

			if(e.target !== e.currentTarget){

				/* Normalise e.target to the li element */

				while(e.target !== null && e.target.nodeName !== "LI"){

					e.target = e.target.parentNode;

				}

				/* Get the current selection */

				var selected = e.currentTarget.querySelector("li.selected");

				/* If target is not the current selection update the selection */

				if(e.target !== null && selected !== e.target){

					Ulo.removeClass(selected, "selected");

					Ulo.addClass(e.target, "selected");

					e.target.querySelector("a").focus();

				}

			}

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Blur the selected suggestion.
		*/
		blurLink: function(e){

			/* Get the current selection */

			var selected = e.currentTarget.querySelector("li.selected");

			/* Deselect the element */

			if(selected !== null){

				Ulo.removeClass(selected, "selected");

				selected.querySelector("a").blur();

			}

		},

		/* ----------------------------------------------------------------------------- */

	}

	/* END NAV SEARCH */
	/* -------------------------------------------------------------------------------- */




	/* NAV MENU */
	/* -------------------------------------------------------------------------------- */
	/*
		Toggle nav menu.
	*/
	function NavMenu(){

		Ulo.menus("toggle_nav_ul", "height", "open", true, this.bodyScroll, true);

	}

	NavMenu.prototype = {

		constructor: NavMenu,

		/* ---------------------------------------------------------------------------- */
		/*
			Toggle scrolling on the body element when the nav menu is opened and closed.
		*/
		bodyScroll: function(isClosed){

			var toggle = isClosed ? Ulo.removeClass : Ulo.addClass;

			toggle(document.body, "nav_ul_open");
		
		}

	}

	/* END NAV MENU */
	/* -------------------------------------------------------------------------------- */




	/* CONTENT */
	/* -------------------------------------------------------------------------------- */
	/*
		Change the contents of the current page.
	*/
	function Content(){

		/* Assign the meta, css and js files to the main object */
		var main = Ulo.getMain();

		main.meta = $("meta.meta_tag");

		main.css = $("link.css_file");

		window.onload = function(){

			main.js = $("script.js_file");

		}
		

		/* Browser support */
		this.isLinkOnLoadSupported = Ulo.isEventSupported("load", "link");

		var script = document.createElement("script");
		
		this.isAsyncSupported = Ulo.isAttributeSupported("async", script);

	}

	Content.prototype = {

		constructor: Content,

		/* ---------------------------------------------------------------------------- */
		/*
			Shallow clone "element" returning a new element with the same attributes.
		*/
		cloneElement: function(element){

			var e = document.createElement(element.nodeName);
				
			for(var i=0; i<element.attributes.length; ++i){
				
				e.setAttribute(

					element.attributes[i].name, element.attributes[i].value

				);
				
			}
			
			return e;
		},

		/* ---------------------------------------------------------------------------- */
		/*
			Resolve the deferred object.

			@param callback: Optional callback function triggered when all the files for
				a specific tag (meta, css or script) have been loaded.
			@param parameters: Optional arguments passed to the callback function.
		*/
		resolve: function(callback, parameters){

			var main = Ulo.getMain();

			if(--main.loading <= 0){

				callback.apply(this, parameters || []);

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Reject the deferred object and remove the file that failed.

			@param file: File which failed to load.
			@param key: Property name to access all files of this type.
		*/
		reject: function(file, key){

			var files = Ulo.getMain()[key];

			for(var i=0; i<files.length; ++i){

				if(file === files[i]){

					if(file.count === undefined || --file.count <= 0){

						files.splice(i, 1);

						if(file.parentNode){

							Ulo.remove(file);

						}

						break;

					}

				}

			}

			this.deferred.reject();
		
		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return true if "file" exists in "files" and false if not.

			@param files: Array of files.
			@param file: File to search for.
			@param attr: Attribute to compare.
		*/
		exists: function(files, file, attr){

			for(var i=0; i<files.length; ++i){

				if(file[attr] === files[i][attr]){

					files[i].count = (files[i].count || 0) + 1;

					return true;

				}

			}

			return false;

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Reset all properties on main which track the loaded files.

			@param main: Main element.
		*/
		reset: function(main){

			if(main !== null){

				main.loading = 0;

				main.meta = [];

				main.css = [];

				main.js = [];

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Remove all files from the DOM related to main.

			@param main: Main element.
		*/
		removeAllFiles: function(main){

			Ulo.remove.apply(null, main.meta);

			Ulo.remove.apply(null, main.css);

			Ulo.remove.apply(null, main.js);

		},

		/* ---------------------------------------------------------------------------- */

		removeFiles: function(element){

			if(element.parentNode !== null){

				Ulo.remove(element);

			}

		},

		/* ---------------------------------------------------------------------------- */




		/* CSS */
		/* ---------------------------------------------------------------------------- */
		/*
			Load event handler for <link> elements.
		*/
		cssLoad: function(e){

			var self = e.data.self;

			e.target.disabled = true;
			
			self.resolve(self.cssComplete, e.data.arguments);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Error event handler for <link> elements.
		*/
		cssError: function(e){

			var self = e.data.self;
			
			self.reject(e.target, "css");

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Enable all page specific css files, add the content of the new page and begin
			loading the javascript files.

			@params *: See change().
		*/
		cssComplete: function(container, main, fragment, xhr, replace){

			/* Enabel all css files */

			var css = $("link.css_file");

			for(var i=0; i<css.length; ++i){

				css[i].disabled = false;

			}


			var head = document.getElementsByTagName("head")[0];

			var current_main = Ulo.getMain();


			/* Register all app page loader links (a[data-apl="true"]) */
			Ulo.register(main);
			

			/* 
				Replace "current_main" with "main".
			*/
			if(replace){

				/* Remove all pages loaded by Pip */
				// Ulo.Pip.unload();


				/* Remove all page specific meta, css and javascript */
				this.removeAllFiles( current_main );

				
				/* Update the title */
				var title = Ulo.getFragment(fragment, "page_title");

				var current_title = Ulo.empty(head.querySelector("title"));

				Ulo.append(current_title, title.childNodes);


				/* Replace the new page (main) with the old page (current_main) */
				Ulo.replace(main, current_main);


				/*
					Update the session if the csrf token and/or authenticated user id
					has changed. This is determined by comparing the values from the 
					request (xhr) and the data attributes set on the old page (current_main). 

					The new values for the csrf token and the user id are set on the new
					page container (main).
				*/
				// Ulo.Session.update(xhr, current_main, fragment);


				// if(Ulo.EmailConfirmation!==undefined){

				// 	Ulo.EmailConfirmation.register();

				// }

			}

			/*
				Else append all child nodes of "main" to "container"
			*/
			else{

				Ulo.append(container, main.childNodes);

			}



			/* Append the new meta tags to the head */
			Ulo.append(head, Ulo.getFragment(fragment, "page_meta").childNodes);


			/* Get and execute the javascript files */
			this.getScripts(Ulo.getFragment(fragment, "page_js"), replace );

		},

		/* END CSS */
		/* ---------------------------------------------------------------------------- */




		/* JS */
		/* ---------------------------------------------------------------------------- */
		/*
			Load scripts.

			@param scripts: Array of scripts.
			@param replace: Boolean - true if the page is being replaced and false if not.
		*/
		getScripts: function(scripts, replace){

			scripts = scripts.getElementsByTagName("script"),

			current_scripts = $("script.js_file"),

			main = Ulo.getMain();


			/* Fallback solutions */

			if(this.isAsyncSupported === false){

				if(this.scriptsQueue !== undefined){

					for(var i=0; i<this.scriptsQueue.length; ++i){

						$( this.scriptsQueue[i] ).off();

					}

				}
				
				this.scriptsQueue = [];

			}
			

			for(var i=0, script; i<scripts.length; ++i){

				if(replace || this.exists(current_scripts, scripts[i], "src") === false){

					++main.loading;


					/* Node.cloneNode() does not work. */
					script = this.cloneElement( scripts[i] );
					
					$(script).on("error", {self: this}, this.jsError);


					/* Modern browsers */
					if(this.isAsyncSupported){

						script.async = false;

						/*
							Add onload events to trigger the deferred object's resolve 
							function when all scripts have been loaded.
						*/
						$(script).on("load", {self: this}, this.jsLoad);


						main.js.push(script);

						/*
							Append each script relying on "async=false" to load each file 
							asynchronously and in order.
						*/
						document.body.appendChild(script);
						
					}


					/* IE lt 10 */
					else if(script.readyState){

						/* Remove src before adding the event */
						var src = script.src;

						script.src = null;


						/* Add event handler to execute loaded scripts in order. */
						$(script).on("readystatechange", {self: this}, this.ieLoad);

						/* 
							Set src AFTER adding the onreadystatechange listener so that 
							loaded events for cached scripts are not missed.

							IE fetches the file as soon as source is set and only executes 
							the file once it is added to the DOM.
						*/
						script.src = src;


						this.scriptsQueue.push(script);

					}


					/* Load scripts in order */
					else{
						
						$(script).on("load", {self: this}, this.asyncLoad);

						this.scriptsQueue.push(script);
						
						if(scripts.length === i+1){
						
							this.asyncLoad();

						}
					
					}

				}

			}

			if(main.loading <= 0){

				this.resolve( this.deferred.resolve );

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Load event handler for <script> elements.
		*/
		jsLoad: function(e){

			var self = e.data.self;
			
			self.resolve(self.deferred.resolve);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Error event handler for <script> elements.
		*/
		jsError: function(e){

			var self = e.data.self;
			
			self.reject(e.target, "js");

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Load event handler for <script> elements if IE < 10.
		*/
		ieLoad: function(e){

			var self = e.data.self;

			var main = Ulo.getMain();

			/*
				Execute as many loaded scripts as possible in order by adding them to 
				the DOM.
			*/
			while(self.scriptsQueue.length>0 && 
					(self.scriptsQueue[0].readyState==="loaded" 
						|| self.scriptsQueue[0].readyState==="complete")){
			
				/* Pop the script at the front of the array */
				var script = self.scriptsQueue.shift();
				
				/* Avoid future loading events for this script (eg, if src changes) */
				script.onreadystatechange = null;

				/* Store a reference to the script so it can be remove later */
				main.js.push( script );
				
				/* Do not appendChild, old IE bug if element isn't closed */
				document.body.insertBefore(script, document.body.lastChild);

				/* Resolve the deferred object if all scripts have loaded. */
				self.resolve( self.deferred.resolve );
	
			}	
		
		},
		/* ---------------------------------------------------------------------------- */
		/*
			Load event handler to load scripts in order when the browser does not support 
			the "async" attribute and is not an IE browser with readyState.
		*/
		asyncLoad: function(e){

			var self = e===undefined ? this : e.data.self;
			
			/* Get the script at the front of the array */
			var script = self.scriptsQueue.shift();

			if(script !== undefined){

				Ulo.getMain().js.push(script);

				/* Load the script */
				document.body.appendChild(script);

				/* Resolve the deferred object if all scripts have loaded. */
				self.resolve(self.deferred.resolve);

			}
			

		},

		/* ---------------------------------------------------------------------------- */
		/*
			@param container: Element to replace/append content with/to.
			@param xhr: XMLHttpRequest.
			@param replace: If true replace container else if false append to it.
		*/
		change: function(container, xhr, replace){
			
			var fragment = Ulo.createFragment(

				(xhr.responseJSON !== undefined && xhr.responseJSON.html) || 

				xhr.responseText

			);

			var main = Ulo.getFragment(fragment, Ulo.getMainID());

			return this._change(container, main, fragment, xhr, replace);
		
		},

		/* ---------------------------------------------------------------------------- */
		/*
			Replace or append the new page content to the container. Return a JQuery 
			deferred object to assign done, fail and always callback functions to.
			
			@param container: Element to replace/append "main" with/to.
			
			@param main: Element to replace "container" with or append its child nodes to.

			@param fragment: A document fragment containing the individual page elements.
				Each element is wrapped in a span element with the following ids for easy
				access. See base_ajax.html:
				
				Meta: 			"#page_meta"
				CSS: 			"#page_css"
				Title: 			"#page_title"
				Javascript: 	"#page_javascript"

				Each page specific meta tag, link element and script element must be 
				given the following class names:

				Meta: 			".meta_tag"
				CSS: 			".css_file"
				Javascript: 	".js_file"

			@param xhr: XMLHttpRequest.

			@param replace: Boolean - if true "container" is replaced by "main" and 
				all page specific elements (meta, css, title, javascript) are replaced 
				by the new elements found in the document fragment. If false the child 
				nodes of "main" are appended to "container" and all other page 
				specific elements (meta, css, javascript) are appended to the head or 
				body.
			
		*/
		_change: function(container, main, fragment, xhr, replace){


			this.deferred = $.Deferred();


			if(container !== null && main !== null){

				var head = document.getElementsByTagName("head")[0];

				var current_main = Ulo.getMain();

				current_main.loading = 0;


				if(replace){

					this.reset(main);

				}
				

				/* CSS */

				var css = Ulo.getFragment(fragment, "page_css");

				if(css !== null){

					var current_css = $("link.css_file");

					css = css.getElementsByTagName("link");


					for(var i=0; i<css.length;){

						if(replace || this.exists(current_css, css[i], "href") === false){

							if(this.isLinkOnLoadSupported){

								++current_main.loading;

								$( css[i] ).on("load", {self: this, arguments: arguments}, this.cssLoad);
								
								$( css[i] ).on("error", {self: this}, this.cssError);

							} else{

								css[i].disabled = true;

							}

							(replace ? main : current_main).css.push( head.appendChild( css[i] ) );

						} else{

							++i;

						}

					}

				}

				if(current_main.loading <= 0){

					this.resolve(this.cssComplete, arguments);

				}

				/* END CSS */


				this.deferred.fail(function(){

					Ulo.messages("The page did not load correctly. Refresh the page and try again.");

				});


			} else{

				this.deferred.reject();

			}


			return this.deferred.promise();

		}		

	}

	/************************************************************************************/

	Ulo.newClass(Content, "Content");

	/************************************************************************************/

	/* END CONTENT */
	/* -------------------------------------------------------------------------------- */




	/* PAGE */
	/* -------------------------------------------------------------------------------- */
	/*
		Ajax page loader. Load the page with an ajax call for all anchor element with
		the data attribute "data-apl".
	*/
	function Page(){

		Ulo.checkDependencies("Content");

		if(window.history && history.pushState){

			/* Params: state object, title, url */
			history.replaceState({}, document.title, Ulo.getURL());

			/* Handle backwards and forwards page navigation. */
			$(window).on("popstate", this.history);

			/* Register all anchor elements with the attribute data-apl */
			this.register();

		} else{

			throw Error("History API not supported.");

		}

	}

	Page.prototype = {

		constructor: Page,

		/* ---------------------------------------------------------------------------- */
		/*
			Register a click event on all <a> tags marked with the data attribute
			data-apl (ajax page loader). Return the optional context parameter.

			@param context: Optional context to narrow the scope.
		*/
		register: function(context){

			$("a[data-apl]", context).on(Ulo.evts.click, this._getPage);
			
			return context;

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Do not unload the classes in the temporary namespace (Ulo.Temp) if called
			before calling getPage().
		*/
		preventUnload: function(){

			this._prevent_unload = true;

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Update the page without performing a full page refresh when a user moves 
			backwards or forwards through their browser history.
		*/
		history: function(e){
			
			e.preventDefault();
		
			Ulo.Page.getPage(Ulo.getURL(), false);	
			
		},

		/* ---------------------------------------------------------------------------- */
		/*
			Update the browser history if the url has changed.

			@param url: URL of the returned html document.
			@param push: Boolean - if true add the url to the history else replace it.
		*/
		updateHistory: function(url, push){

			if(Ulo.getURL() !== url){

				var fn = push === true ? "pushState" : "replaceState";

				history[fn]({}, document.title, url);

			}
		
		},

		/* ---------------------------------------------------------------------------- */
		/*
			Event handler for getPage().
		*/
		_getPage: function(e){
			
			e.preventDefault();

			Ulo.Page.getPage(e.currentTarget.href, true);
		
		},

		/* ---------------------------------------------------------------------------- */
		/*
			Get the html document that resides at "url" and update the current page 
			content with the page requested.

			@param url: Page URL.
			@param push: Boolean - if true add the url to the history else replace it.
			@param done: Option callback function, called when a request is successful.
			@param fail: Option callback function, called when a request fails.
		*/
		getPage: function(url, push, done, fail){

			var self = this;


			Ulo.Animate.set(0);


			Ulo.request({

					type: "GET", 
					url: url,
					cache: true,
					xhr: Ulo.Animate.download
				
				})
			
				.done(function(data, sc, xhr){

					/* Push or replace the url onto the history. */

					Ulo.Page.updateHistory(data.url, push);


					/* Unload all temporary classes and scroll to the top of the page. */

					if(Ulo.Page._prevent_unload !== true){

						Ulo.Temp = {};

						document.body.scrollTop = 0;

					}


					/* Update the contents of the page */

					Ulo.Content.change(Ulo.getMain(), xhr, true)
						
						.done(function(){

							if(done !== undefined){

								done();

							}

						})

						.fail(function(){

							if(fail !== undefined){

								fail();

							}

						})

				})
				
				.fail(function(xhr){

					/* Render the error page if one was returned. */

					Ulo.Content.change(Ulo.getMain(), xhr, true);

					Ulo.Animate.set(0);

					if(fail !== undefined){

						fail();

					}

				})

				.always(function(){

					Ulo.Page._prevent_unload = false;
			
			});

		}

	}

	/************************************************************************************/

	Ulo.newClass(Page, "Page");

	/************************************************************************************/

	/* END PAGE */
	/* -------------------------------------------------------------------------------- */




		/* SESSION */
	/* -------------------------------------------------------------------------------- */

	function Session(){

		var main = Ulo.getMain();

		this.token = main.getAttribute("data-token-id") || null;

		this.auth_id = main.getAttribute("data-auth-id") || null;

		main.removeAttribute("data-token-id");

		main.removeAttribute("data-auth-id");

	}

	Session.prototype = {

		constructor: Session,

		/* ---------------------------------------------------------------------------- */

		isOwner: function(id){

			return this.auth_id !== null && this.auth_id == id;

		},

		/* ---------------------------------------------------------------------------- */

		isAuthenticated: function(id){

			if(id === undefined){ 

				id = this.auth_id;

			}
			
			return id !== "" && id !== null;

		},

		/* ---------------------------------------------------------------------------- */

		get: function(){

			return {

				token: this.token,
				auth_id: this.auth_id

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			@param xhr: XMLHttpRequest.
		*/
		set: function(xhr){

			this.token = xhr.getResponseHeader("token-id");

			this.auth_id = xhr.getResponseHeader("auth-id");

		},

		/* ---------------------------------------------------------------------------- */
		/*
			@param xhr: XMLHttpRequest.
		*/
		update: function(xhr, fragment){

			if(this.hasChanged(xhr)){

				console.log("SESSION CHANGED!");

				Ulo.Session.set(xhr);

				this.setTokens(this.token);

				var nav = Ulo.getFragment(fragment, "nav_ul");

				if(nav !== null){

					Ulo.replace(nav, Ulo.get(nav.id));
					
					Ulo.register(nav);

				}

			}

			
		},

		/* ---------------------------------------------------------------------------- */
		/*
			@param xhr: XMLHttpRequest.
		*/
		hasChanged: function(xhr){

			return xhr.getResponseHeader("session-changed") !== null

		},

		/* ---------------------------------------------------------------------------- */

		getUser: function(){

			return this.auth_id;

		},

		/* ---------------------------------------------------------------------------- */

		getToken: function(context){

			var name = "csrfmiddlewaretoken",

			value = (

				context ? 

				context.querySelector("input[name='" + name + "']").value

				:

				this.token

			)

			return { name: name, value: value };
			
		},

		/* ---------------------------------------------------------------------------- */

		setTokens: function(token, context){

			if(token){

				var tokens = $("input[name='csrfmiddlewaretoken']", context);

				for(var i=0; i<tokens.length; ++i){

					tokens[i].value = token;

				}

			}
			
		},

		/* ---------------------------------------------------------------------------- */
		/*
			@param xhr: XMLHttpRequest.
		*/
		hasExpired: function(xhr){

			return xhr.responseJSON !== undefined && xhr.responseJSON.csrf_error === true;

		},

		/* ---------------------------------------------------------------------------- */

	}

	/************************************************************************************/

	Ulo.newClass(Session, "Session");

	/************************************************************************************/

	/* END SESSION */
	/* -------------------------------------------------------------------------------- */




	/* Pip */
	/* -------------------------------------------------------------------------------- */

	function Pip(){

		Ulo.checkDependencies("Content");

		this.elements = [];

		this.callbacks = [];

	}

	Pip.prototype = {

		constructor: Pip,


		/* ---------------------------------------------------------------------------- */

		isPip: function(context){

			var pip = context.querySelector("input[name='pip']");

			return pip !== null && (pip.value === "true" || pip.value === true);
		
		},

		/* ---------------------------------------------------------------------------- */

		setPips: function(context){

			var pips = $("input[name='pip']", context);

			for(var i=0; i<pips.length; ++i){

				pips[i].value = true;
			
			}
	
		},

		/* ---------------------------------------------------------------------------- */

		updatePage: function(xhr, page_id, removeOnClose, callback){
			
			if(Ulo.checkDependencies(true, "Page")){


				Ulo.Page.preventUnload();

				/* 
					Refresh the current page before displaying the requested page in the 
					modal. 
				*/
				Ulo.Page.getPage(
					
					Ulo.getURL(), 
					false,
					this.displayPage.bind(this, xhr, page_id, removeOnClose, callback)
				
				);
			
			} else{

				Ulo.replacePage();

			}

		},

		/* ---------------------------------------------------------------------------- */

		displayPage: function(xhr, page_id, removeOnClose, callback){

			if(xhr){

				var html = xhr.responseJSON !== undefined && xhr.responseJSON.html;

				if(html !== undefined){

					var self = this,
					
					fragment = Ulo.createFragment(html),
					
					main = Ulo.getFragment(fragment, Ulo.getMainID());


					this.setPips(main);


					Ulo.Content._change(this.get(), main, fragment, xhr, false)

						.done(function(){

							self.open( Ulo.get(page_id), removeOnClose, callback );

						})
						
						.fail(function(){

							self.close();

							Ulo.remove( Ulo.get(page_id) );

							Ulo.messages("Sorry, we could not load the page you requested.");

						})

						.always(function(){

						
							
					});

				}

			}


		},

		/* ---------------------------------------------------------------------------- */

		getPage: function(url, page_id, callback){

			var self = this;

			/* Make a request for the page */
			Ulo.request({

					type:"GET",
					url: url, 
					cache:true,
					codes: {all: "Sorry, we could not load the page you requested."}
					
				})

				/* Params: server data, status code, xhr */
				.done(function(data, sc, xhr){

					if(Ulo.Session.hasChanged(xhr)){

						self.updatePage(xhr, page_id, callback);

					}

					else{

						self.displayPage(xhr, page_id, callback);

					}

				})

				/* Params: xhr, status code, error type */
				.fail(function(xhr){
					
			
				})

				.always(function(){


			});

		},

		/* -------------------------------------------------------------------------------- */

		get: function(create){

			var id = "pip_modal";

			var modal = Ulo.get(id);

			if(create !== false && modal === null){

				modal = Ulo.create("div", {

					"id": id, 
					"class": "modal " + Ulo.cls.hide,

				});

				Ulo.getMain().appendChild(modal);

			}

			return modal;

		},

		/* -------------------------------------------------------------------------------- */

		login: function(){

			return Ulo.get("login");

		},

		/* -------------------------------------------------------------------------------- */

		open: function(element, removeOnClose, callback){

			var login = this.login(),

			modal = this.get();


			if(login){

				element = login;

				removeOnClose = false;

				var fields = [Ulo.get("login_email"), Ulo.get("login_password")];
			
				for(var i=0; i<fields.length; ++i){
					
					if(fields[i] !== null){
						
						fields[i].value="";

					}

				}

			}


			if(element){

				this.hideNodes(modal);

				if(removeOnClose === true){

					this.elements.push(element);

				}

				modal.appendChild(Ulo.removeClass(element, Ulo.cls.hide));

			}


			if(Ulo.hasClass(modal, Ulo.cls.hide)){

				Ulo.removeClass(modal, Ulo.cls.hide);

				Ulo.addClass(document.body, Ulo.cls.modal_open);

				$(modal).on(Ulo.evts.click, {self: this}, this.close);


			}


			/* Run callback at the end. */

			if(callback !== undefined){
				
				this.callbacks.push(callback);

				callback(true);

			}

		},

		/* -------------------------------------------------------------------------------- */

		close: function(e){

			var self, modal, close_modal;

			if(e === undefined){

				self = this;
				modal = self.get();
				close_modal = true;

			} else{

				self = e.data.self;
				modal = self.get();
				close_modal = e.target === modal;

			}

			if(close_modal || e.target.getAttribute("data-close-pip") === "true"){

				for(var i=0; i<self.callbacks.length; ++i){

					self.callbacks[i]( false );

				}

				for(var i=0; i<self.elements.length; ++i){

					Ulo.Content.removeFiles( self.elements[i] );

				}

				self.callbacks.length = self.elements.length = 0;


				$(modal).off(Ulo.evts.click, self.close);

				Ulo.removeClass(document.body, Ulo.cls.modal_open);

				Ulo.addClass(modal, Ulo.cls.hide);

				self.hideNodes(modal);				

			}

		},

		/* -------------------------------------------------------------------------------- */

		unload: function(e){

			var modal = this.get(false);

			if(modal !== null){

				$(modal).trigger(Ulo.evts.click);

				while(modal.firstChild !== null){

					Ulo.Content.removeFiles(modal.firstChild);

				}

			}

		},

		/* -------------------------------------------------------------------------------- */

		hideNodes: function(modal){

			for(var i=0; i<modal.childNodes.length; ++i){

				Ulo.addClass(modal.childNodes[i], Ulo.cls.hide);

			}

		}

	}

	/************************************************************************************/

	Ulo.newClass(Pip, "Pip");

	/************************************************************************************/

	/* END Pip */
	/* -------------------------------------------------------------------------------- */




	/* DOCUMENT READY FUNCTION */
	/* -------------------------------------------------------------------------------- */
	
	$(function(){

		try{

			Ulo.removeClass(document.body, "preload");

			try{
			
				/* Polyfiller to remove the 300ms delay on mobile browsers */
				// Origami.fastclick(document.body);
			
			} catch(e){}

			new NavSearch();

			new NavMenu();

		} catch(e){

			debug(e);

		}

	});

	/* -------------------------------------------------------------------------------- */

}());

/* ------------------------------------------------------------------------------------ */



