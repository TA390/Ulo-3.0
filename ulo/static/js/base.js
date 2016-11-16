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
		hidden: "hidden",
		disabled: "disabled"

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
		Make a request and return the xhr instance.

		@param request: Request data object.
		@param reference: Optional reference assigned to the xhr instance.
	*/
	request: function(request, reference){

		if(Ulo.xhr !== undefined){

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

				Ulo.xhr = undefined;

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
	capitaliseLetter: function(str){

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

	/* -------------------------------------------------------------------------------- */
	/*
		Return the transition end event name or null if not supported by the browser. 
	*/
	transitionEnd: function(element){

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

	/* END HELPERS */
	/* -------------------------------------------------------------------------------- */

};

/* ------------------------------------------------------------------------------------ */








/* ------------------------------------------------------------------------------------ */

(function () {

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


			var element = Ulo.get( e.currentTarget.getAttribute("data-toggle") );


			if( element !== null ){


				var self = e.data.self,

				dimension = e.data.dimension,

				cap_dimension = Ulo.capitaliseLetter(dimension),

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


		var button = container.querySelector("button.toggle_filter_ul");

		Ulo.menus(button, "height", false, false, this.filters);


		$( this.getForm() ).on("submit", {self: this}, this.submit);

		$( container.querySelector("button.close") )
			.on(Ulo.evts.click, {self: this}, this.close);

		$( container.querySelector("button.submit") )
			.on(Ulo.evts.click, {self: this}, this.open);

	}

	NavSearch.prototype = {

		constructor: NavSearch,

		/* ----------------------------------------------------------------------------- */
		/*
			Handle filter selection and update the icon displayed on the search filters 
			button.

			@params *: See Class Menu callback function.
		*/
		filters: function(isClosed, button, menu, target){

			var icon_name = null,

			selected = menu.querySelector("li.selected");


			if(Ulo.isDescendant(menu, target, 1)){

				if(selected === target){

					icon_name = "down_arrow_white";

				} else{

					icon_name = target.getAttribute("data-icon");

					Ulo.removeClass(selected, "selected");

				}

				Ulo.toggleClass(target, "selected");

			} else if(selected === null){
				
				icon_name = (isClosed ? "down" : "up") + "_arrow_white";

			}

			if(icon_name !== null){

				var icon = button.querySelector("span.icon");

				icon.className = "icon icon_" + icon_name;

			}

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
			Open search form if it is not visible else submit the form.
		*/
		open: function(e){

			var self = e.data.self,

			container = self.getContainer();

			if(container.clientWidth < 100){	

				e.preventDefault();

				Ulo.addClass(container, "open");

			} else{

				e.target = e.currentTarget = self.getForm();

				self.submit.call(e.target, e);

			}

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Close search form.
		*/
		close: function(e){

			e.preventDefault();

			Ulo.removeClass(e.data.self.getContainer(), "open");

		},

		/* ----------------------------------------------------------------------------- */
		/*
			Submit handler.
		*/
		submit: function(e){

			e.preventDefault();

			console.log("submit");

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

	}

	/* END SESSION */
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
			Clone "element" returning a new element with the same attributes.
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

			scripts = scripts.getElementsByTagName("script");

			var current_scripts = $("script.js_file");

			var main = Ulo.getMain();


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


						main.js.push( script );

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
			
			self.resolve( self.deferred.resolve );

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

					this.resolve( this.cssComplete, arguments );

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


			/* Setup the loading bar animation */
			var loading = this.getLoadingBar();

			var transitionend = Ulo.transitionEnd(loading);

			loading.has_transitionend = transitionend !== null;

			if(loading.has_transitionend){

				$(loading).on(transitionend, {self: this}, this._resetLoadingBar);

			}


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
			Progress bar.
		*/
		progress: function(){

			var xhr = $.ajaxSettings.xhr();

			// Upload progress
			if(xhr.upload){

				xhr.upload.addEventListener("progress", function(evt){

					if(evt.lengthComputable){

						var percentComplete = evt.loaded / evt.total;
						
						//Do something with upload progress
						console.log("Upload: ", percentComplete);
					
					}

				}, false);

			}

			// Download progress
			xhr.addEventListener("progress", function(evt){

				console.log(evt);

				if(evt.lengthComputable){

					var percent = Math.ceil((evt.loaded / evt.total) * 100);
						
					/* Copied from getLoadingBar() */

					var header = document.getElementsByTagName("header")[0];

					header.querySelector("span.page_loading").style.width = percent + "%";
				
				}

			}, false);

			return xhr;

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return the element used to display a loading bar to the user.
		*/
		getLoadingBar: function(){

			var header = document.getElementsByTagName("header")[0];

			return header.querySelector("span.page_loading");

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Reset the loading bar.

			@param display: Boolean - if true display the loading bar after resetting it.
			@param onlyIfNoTransition: Boolean - if true reset the loading bar only if the
				browser does not support transitionend.
		*/
		resetLoadingBar: function(display, onlyIfNoTransition){

			var loading = this.getLoadingBar();

			if(onlyIfNoTransition !== true || loading.has_transitionend === false){

				Ulo.addClass(loading, Ulo.cls.hide);

				loading.style.width = 0;

				loading.offsetLeft;

				if(display === true){

					Ulo.removeClass(loading, Ulo.cls.hide);

				}

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Event handler for resetLoadingBar().
		*/
		_resetLoadingBar: function(e){

			var self = e.data.self,

			loading = self.getLoadingBar();
			

			if(loading.style.width === "100%"){

				self.resetLoadingBar(false);

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


			self.resetLoadingBar(true);


			Ulo.request({

					type: "GET", 
					url: url,
					cache: true,
					xhr: this.progress.bind(this)
				
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

						.always(function(){

							self.resetLoadingBar(false, true);

					});

				})
				
				.fail(function(xhr){

					/* Render the error page if one was returned. */

					Ulo.Content.change(Ulo.getMain(), xhr, true)

						.always(function(){

							self.resetLoadingBar(false);

					});

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


