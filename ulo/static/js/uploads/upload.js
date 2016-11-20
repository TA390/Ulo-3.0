/* File Upload javascript file */
/* Dependencies: JQuery, Base.js */


"use strict";


/* ------------------------------------------------------------------------------------ */
/* POLYFILLERS */
/* ------------------------------------------------------------------------------------ */

Number.isNaN = Number.isNaN || function(value){     

    return value!==value;

}

/* ------------------------------------------------------------------------------------ */

Number.isFinite = Number.isFinite || function(value){

	return typeof value==="number" && isFinite(value);

}

/* ------------------------------------------------------------------------------------ */


/* ------------------------------------------------------------------------------------ */
/* 
	Functions to round the value n to the nearest m
*/
function roundTo(n, m){

	/* Round to the nearest m */
	return Math.round(n/m)*m;

}

function roundUpTo(n, m){

	/* Round up to the nearest m */
	return Math.ceil(n/m)*m;

}

function roundDownTo(n, m){

	/* Round down to the nearest m */
	return Math.floor(n/m)*m;

}

/* ------------------------------------------------------------------------------------ */


/* ------------------------------------------------------------------------------------ */
/* BASE CLASS */
/* ------------------------------------------------------------------------------------ */
/* 
	Create a draggable element.

	@param id: id of a relative or absolutely positioned html element.
	@param settings: an object of variables to extend the classes settings object.

	A draggable object can be moved within its bounding box defined by the
	css positions in settings. Override calcPosition() to alter the default behaviour.

*/
function Draggable(id, settings){
	
	try{
		
		/* Events */
		this.start_events = "mousedown touchstart pointerdown";
		this.move_events = "mousemove touchmove pointermove";
		this.end_events = "mouseup touchend pointerup";

		/* Client X and Y positions set when a start event is triggered. */
		self.start = { X:0, Y:0 };

		/*
			Optional target element - If set to null the class will not trigger the start
			events.
		*/
		this.target = true;

		/* Relative or absolute positioned html element */
		this.element = document.getElementById(id);

		/* Fefault settings */
		this.settings = {
			
			/* Css box boundaries */
			top: 0, right: 0, bottom: 0, left: 0,
			
			/* Directions of movement */
			horizontal: true, vertical: true
		
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
		Set the new position of the element constraining it to its bounding box positions 
		defined by the settings object.
	
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
		Return the on screen position of the current event or throw an exception.
		
		@params: e: the event object. 
		@param coord: the client coordinate (must be a capitalised string "X" or "Y") 
	*/
	getPosition: function(e){
		
		var pos;
		
		/* JQuery's normalised pageX/Y */
		if(e.pageX !== undefined){
		
			return { X: e.pageX, Y: e.pageY };
	
		} 

		/* Raw event data with scroll offsets applied */
		else if(e.originalEvent.clientX !== undefined){
		
			var scroll = this.getScrollOffsets();

			return { 

				X: e.originalEvent.clientX + scroll, 
				Y: e.originalEvent.clientY + scroll

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

}

/* END BASE CLASS */
/* ------------------------------------------------------------------------------------ */




/* ------------------------------------------------------------------------------------ */
/* SCALE ELEMENT */
/* ------------------------------------------------------------------------------------ */
/*

*/
function ScaleElement(){

	Draggable.call(this, "scale_slider", { vertical: false });

	this.elements = [];

	this.target = null;

	this.register();

}
/* ------------------------------------------------------------------------------------ */

ScaleElement.prototype = Ulo.inherit(Draggable.prototype);

/* ------------------------------------------------------------------------------------ */

ScaleElement.prototype.constructor = ScaleElement;

/* ------------------------------------------------------------------------------------ */
/*
	Set the selected element to null to disable the start events (See Draggable) and 
	clear the array.
*/
ScaleElement.prototype.close = function(){

	this.elements.length = 0;

	this.target = null;

};

/* ------------------------------------------------------------------------------------ */
/*
	Add the element to the array of elements currently in the editor.

	@param element: Canvas or video element.
*/
ScaleElement.prototype.queue = function(element){

	this.elements.push(element);

};

/* ------------------------------------------------------------------------------------ */
/*
	Remove the element from the array.

	@param element: Canvas or video element.
*/
ScaleElement.prototype.dequeue = function(element){

	for(var i=0; i<this.elements.length; ++i){

		if(element === this.elements[i]){

			this.elements.splice(i, 1);

			break;
		
		}

	}

};

/* ------------------------------------------------------------------------------------ */
/*
	Set the selected element.

	@param element: Canvas or video element.
*/
ScaleElement.prototype.select = function(element){

	this.target = element;

	this.element.style.left = (element !== null && element.scale || "0%");

};

/* ------------------------------------------------------------------------------------ */
/*
	Set the max position that the slider can move to and update the scale of all elements
	in the editor.
*/
ScaleElement.prototype.update = function(){

	this.settings.right = this.element.parentNode.clientWidth || 0;

	this.scale_all();

}

/* ------------------------------------------------------------------------------------ */
/*
	Set the position of the slider and scale the selected element.

	@params *: See base class Draggable.
*/
ScaleElement.prototype.calcPosition = function(pos, p1, p2){

	/* Calculate the position of the slider */

	if(pos < this.settings[p1]){ 
		
		pos = this.settings[p1]; 
	
	} else if(pos > this.settings[p2]){ 
	
		pos = this.settings[p2]; 
	
	}

	pos = this.pixelToPercent(pos, this.settings[p2]);


	/* Set the position of the slider */

	this.element.style[p1] = this.target.scale = pos + "%";


	/* Scale the element */

	this.scale(pos, this.target);

};

/* ------------------------------------------------------------------------------------ */
/*
	Scale the element.

	@param percent: Percentage value between 0 - 100.
	@param element: Canvas or video element.
*/
ScaleElement.prototype.scale = function(percent, element){

	percent += 100;

	/* Get the dimensions set on the element by the Editor class */
	var size = element.size;

	/* Calculate the new width */
	var w = size.width*0.01*percent;
	
	/* Calculate the new height */
	var h = size.height*0.01*percent;

	/* Constrain left to its min value (crop area width - new width of the image) */
	var l = Math.max(

		/* Constrain left to its max value (0) */
		Math.min(

			parseFloat(element.style.left) + (parseFloat(element.style.width)-w)*0.5,
			0
		
		),
		
		size.crop_width-w
	
	);
	
	/* Constrain top to its min value (crop area height - new height of the image) */
	var t = Math.max(

		/* Constrain top to its max value (0) */
		Math.min(

			parseFloat(element.style.top) + (parseFloat(element.style.height)-h)*0.5,
			0
		
		),
		
		size.crop_height-h

	)

	element.style.width  = w + "px";
	element.style.height = h + "px";
	element.style.left = l + "px";
	element.style.top  = t + "px";

};

/* ------------------------------------------------------------------------------------ */
/*
	Scale all elements in the editor.
*/
ScaleElement.prototype.scale_all = function(){

	for(var i=0; i<this.elements.length; ++i){

		console.log( this.elements[i].scale );

		this.scale(parseFloat(this.elements[i].scale) || 0, this.elements[i]);

	}

}

/* ------------------------------------------------------------------------------------ */




/* ------------------------------------------------------------------------------------ */
/* MOVE ELEMENT */
/* ------------------------------------------------------------------------------------ */
/*
	Move an element within its crop area.
*/
function MoveElement(){

	Draggable.call(this);

}
/* ------------------------------------------------------------------------------------ */

MoveElement.prototype = Ulo.inherit(Draggable.prototype);

/* ------------------------------------------------------------------------------------ */

MoveElement.prototype.constructor = MoveElement;

/* ------------------------------------------------------------------------------------ */
/*
	Set the selected element.

	@param element: Canvas or video element.
*/
MoveElement.prototype.select = function(element){

	this.element = element;

	this.update();

};

/* ------------------------------------------------------------------------------------ */
/*
	Set the boundary positions for the selected element.
*/
MoveElement.prototype.update = function(){

	if(this.element !== null){

		this.settings.right = this.element.size.crop_width;
		this.settings.bottom = this.element.size.crop_height;

	}

};

/* ------------------------------------------------------------------------------------ */
/*
	Set the selected element to null to disable the start events. See Draggable
*/
MoveElement.prototype.close = function(){

	this.element = null;

};

/* ------------------------------------------------------------------------------------ */
/*
	Set the position of the element.

	@params *: See base class Draggable.
*/
MoveElement.prototype.calcPosition = function(pos, p1, p2){

	var wh = (p1==="top") ? this.element.clientHeight : this.element.clientWidth;

	/* Calculate the difference between the crop area and the current w or h */
	
	var diff = this.settings[p2]-wh;

	/* Ensure the element does not fall within its crop area */

	if(pos > this.settings[p1]){
	
		pos = this.settings[p1];
	
	}else if(pos < diff){ 
	
		pos = diff; 
	
	}

	/* Set the elements new left or top position */
	
	this.element.style[p1] = pos + "px";

};

/* ------------------------------------------------------------------------------------ */




/* ------------------------------------------------------------------------------------ */
/* VIDEO THUMBNAIL ELEMENT */
/* ------------------------------------------------------------------------------------ */
/*
	Change the current frame of the video in relation to the position of the slider.
*/
function VideoThumbnail(){

	Draggable.call(this, "thumbnail_slider", { vertical: false });

	if(this.element === null){

		this.select = this.update = function(){}

	} else{

		this.target = null;

		this.register();

		this.update();

	}

}
/* ------------------------------------------------------------------------------------ */

VideoThumbnail.prototype = Ulo.inherit(Draggable.prototype);

/* ------------------------------------------------------------------------------------ */

VideoThumbnail.prototype.constructor = VideoThumbnail;

/* ------------------------------------------------------------------------------------ */
/*
	Register the time input field.
*/
VideoThumbnail.prototype.register = function(){

	var evt = isEventSupported("input") ? "input" : "change";

	$( this.getTime() ).on(evt, {self: this}, this.setTime);

	Draggable.prototype.register.apply(this, arguments);

};

/* ------------------------------------------------------------------------------------ */
/*
	Unregister the time input field.
*/
VideoThumbnail.prototype.unregister = function(){

	var evt = isEventSupported("input") ? "input" : "change";

	$( this.getTime() ).off(evt, this.setTime);

	Draggable.prototype.unregister.apply(this, arguments);

};

/* ------------------------------------------------------------------------------------ */
/*
	Set video as the target element.

	@param video: Video element.
*/
VideoThumbnail.prototype.select = function(video){

	if(video === null || video.nodeName === "VIDEO"){

		this.target = video;

		this.element.style.left = (video !== null && video.thumbnail_position || "0%");

	}
	
};

/* ------------------------------------------------------------------------------------ */
/*
	Set the max position that the slider can move to.
*/
VideoThumbnail.prototype.update = function(){

	this.settings.right = this.element.parentNode.clientWidth || 0;

};

/* ------------------------------------------------------------------------------------ */
/*
	Set this.target to null to disable the start events. See Draggable
*/
VideoThumbnail.prototype.close = function(){

	this.target = null;

};

/* ------------------------------------------------------------------------------------ */
/*
	Set the position of the slider and update the current time of the video.

	@params *: See base class Draggable.
*/
VideoThumbnail.prototype.calcPosition = function(pos, p1, p2){

	/* Calculate the position of the slider */

	if(pos < this.settings[p1]){ 
		
		pos = this.settings[p1]; 
	
	} else if(pos > this.settings[p2]){ 
	
		pos = this.settings[p2]; 
	
	}

	pos = this.pixelToPercent(pos, this.settings[p2]);


	/* Set the position of the slider */

	this.element.style[p1] = this.target.thumbnail_position = pos + "%";
	

	/* Set the time of the video. */

	this.target.currentTime = (this.target.duration / 100) * pos;


	/* Set the time input value */

	this.getTime().value = this.secsToTime( this.target.currentTime );

};

/* ------------------------------------------------------------------------------------ */
/*
	Get the time input field.
*/
VideoThumbnail.prototype.getTime = function(){

	return Ulo.get("thumbnail_time");

};

/* ------------------------------------------------------------------------------------ */
/*
	Validate the input and set the video's currentTime and slider buttons. The format must
	be h:m:s or m:s or s. 
*/
VideoThumbnail.prototype.setTime = function(e){

	var self = e.data.self,

	video = self.target;


	if(video !== null){

		var secs = null,

		/* Match strings of integers. However, the final string can be a float. */
		time = this.value.match( /(\d*\.\d+)$|(\d+)/g );


		if(time === null){

			if(/^\s*$/.test(this.value)){

				secs = 0;

			}
			
		}

		else if(time.length < 4){

			var multiplier = 1;

			for(var i = time.length-1; i >= 0; --i){

				if( time[i] !== "" ){

					secs += time[i] * multiplier;

					multiplier *= 60;

				}

			}

		}


		if(secs !== null && secs >= 0 && secs <= video.duration){

			self.element.style.left = video.thumbnail_position = (100 * secs / video.duration) + "%";
			
			video.currentTime = secs;

		}

	}

};

/* ------------------------------------------------------------------------------------ */
/*
	Convert seconds into the time format h:m:s or m:s if h === 0.

	@param secs: float.
*/
VideoThumbnail.prototype.secsToTime = function(secs){

	var md = secs % 3600;

	var h = Math.floor(secs / 3600);

	var m = Math.floor(md / 60);

	var s = Math.ceil(md % 60);


	return (h === 0 ? "" : h + ":") + m + ":" + (s < 10 ? "0" + s : s);
	
};

/* ------------------------------------------------------------------------------------ */




/* ------------------------------------------------------------------------------------ */
/*
	Scale, position and crop images.

	@param aspect_ratio: Aspect ratio { width: N, height: N }
*/
function ImageEditor(aspect_ratio){


	this.dimensions = { 

		orientation: "landscape", 
		landscape: 600, 
		portrait: 360, 
		min: 320 

	};


	this.setSubmitDisabled(true);

	
	this.ratio = aspect_ratio || { width: 1, height: 1 };

	/*
		Round the editor window dimension to the lowest common multiple of the aspect
		ratio.
	*/
	this.ratio.round_to = this.lcm(this.ratio.width, this.ratio.height);


	$(Ulo.get("toggle_editor_menu_actions")).on(Ulo.evts.click, {self: this}, this.showMenu);
	
	$(Ulo.get("editor_rotate")).on(Ulo.evts.click, {self: this}, this.rotateEditor);
	
	this.registerDelete(this._delete);
	
	this.registerClose(this._close);


	/* Remove any whitespace */
	Ulo.empty(this.getContent());

}

ImageEditor.prototype = {

	constructor: ImageEditor,

	/* -------------------------------------------------------------------------------- */

	registerClose: function(handler){

		$(this.getClose()).on(Ulo.evts.click, {self: this}, handler);

	},

	/* -------------------------------------------------------------------------------- */

	registerSubmit: function(handler){

		$(this.getSubmit()).on(Ulo.evts.click, {self: this}, handler);

	},

	/* -------------------------------------------------------------------------------- */

	registerDelete: function(handler){

		$(this.getDelete()).on(Ulo.evts.click, {self: this}, handler);

	},

	/* -------------------------------------------------------------------------------- */

	registerSelect: function(element){

		$(element).on("mousedown touchstart pointerdown", {self: this}, this._select);

	},

	/* -------------------------------------------------------------------------------- */

	unregisterSelect: function(element){

		$(element).off(Ulo.evts.click, this._select);

	},

	/* -------------------------------------------------------------------------------- */
	
	getEditor: function(){

		return Ulo.get("editor_container");

	},

	/* -------------------------------------------------------------------------------- */

	getContent: function(){

		return Ulo.get("editor_content");

	},

	/* -------------------------------------------------------------------------------- */

	getDelete: function(){

		return this.getMenuContainer().querySelector("button.editor_delete");

	},

	/* -------------------------------------------------------------------------------- */

	getClose: function(){

		return Ulo.get("editor_close");
	
	},

	/* -------------------------------------------------------------------------------- */

	getSubmit: function(){

		return Ulo.get("editor_submit");
	
	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return the element's outer most container. See open() for element creation.
	*/
	getContainer: function(element){

		return element.parentNode.parentNode;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return the element within the container. See open() for element creation.
	*/
	getElement: function(container){

		return container.firstChild.firstChild;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return true if the canvas is in portrait mode.
	*/
	isPortrait: function(){

		return this.dimensions.orientation==="portrait";

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Show the editor.
	*/
	show: function(){

		Ulo.removeClass(this.getEditor(), Ulo.cls.hide);
		Ulo.addClass(document.body, Ulo.cls.modal_open);

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Hide the editor.
	*/
	hide: function(){

		Ulo.addClass(this.getEditor(), Ulo.cls.hide);
		Ulo.removeClass(document.body, Ulo.cls.modal_open);

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Set the disabled attribute on the submit button.

		@param disable: Boolean value to set disabled to.
	*/
	setSubmitDisabled: function(disable){

		(disable ? Ulo.addClass : Ulo.removeClass)(this.getSubmit(), "disabled").disabled = disable;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Set the disabled attribute on the input[type=file] element.

		@param count: Number of elements currently in the editor.
	*/
	setInputDisabled: function(count){

		var input = Ulo.get("editor_input");

		if(input !== null){

			var disable = count >= this.max_count;

			(disable ? Ulo.addClass : Ulo.removeClass)(input, "disabled");
		
			input.querySelector("input").disabled = disable;

		}

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return true if all elements in the editor have been loaded and false if not.
	*/
	isComplete: function(){

		var masks = this.getContent().childNodes;

		for(var i=0; i<masks.length; ++i){

			/* Get the canvas or video element */

			if(this.getElement( masks[i] ).complete !== true){

				return false;

			}

		}

		return true

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return the number of elements in the editor.
	*/
	count: function(e){

		return this.getContent().childNodes.length;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Greatest common divisor.
	*/
	gcd: function(a, b){

		var tmp;

		while (b != 0){
		
			tmp = b;
			b = a % b;
			a = tmp;
		
		}

		return a;
	
	},

	/* -------------------------------------------------------------------------------- */
	/*
		Lowest common multiple.
	*/
	lcm: function(a, b){
		
		return a*b / this.gcd(a, b);
		
	},

	/* -------------------------------------------------------------------------------- */

	swapRatios: function(){

		var tmp = this.ratio.width;
			
		this.ratio.width = this.ratio.height;
			
		this.ratio.height = tmp;

	},

	/* -------------------------------------------------------------------------------- */

	resetOrientation: function(){

		if(this.isPortrait()){

			this.dimensions.orientation = "landscape";

			this.swapRatios();

		}

	},

	/* -------------------------------------------------------------------------------- */

	rotateEditor: function(e){

		var self = e.data.self;

		/* Toggle the current orientation. */
		
		self.dimensions.orientation = self.isPortrait() ? "landscape" : "portrait";

		self.swapRatios();

		self.update( self.getContent() );

	},

	/* -------------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */
	/*
		Register the new element so that it can be interacted with in the editor.
	*/
	initialise: function(element){

		/*
			If this is the first element make it the selected element.
		*/
		if(!this.selected){

			this.select(element);

		}

		/* Enable selecting, moving and scaling of the element */

		this.registerSelect(element);

		this.MoveElement.register(element);
		
		this.ScaleElement.queue(element);


		/* Enable the submit button if all elements in the editor have loaded */

		if(this.isComplete()){

			this.setSubmitDisabled( false );

		}

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Scale callback function to initialise new canvases loaded into the editor once 
		they have been scaled on a web worker.

		@param src: Source canvas.
		@param dst: Destination canvas.
	*/
	initialiseDone: function(src, dst){

		src.width = src.height = 0;

		src = null;

		this.initialise(dst);

		if(dst.parentNode !== null){

			/* Remove the loading animation */
			Ulo.remove( dst.parentNode.querySelector(".loading") );

		}

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Scale callback function to remove a new canvas loaded into the editor if the 
		scale operation on the web worker fails.
	*/
	initialiseFail: function(e){

		e.preventDefault();

		var dst = e.data.dst;

		if(dst){

			var self = e.data.self;

			self.removeAllWorkers(dst);

			dst.width = dst.height = 0;

			if(dst.parentNode !== null){

				self.deleteElement( self.getContainer(dst) );

				self.update( self.getContent() );

			}			

		}

		Ulo.messages("Sorry, we encountered a problem while trying to edit your image.");

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Convert an img to a canvas element and scale large canvases to improve editor 
		performance. Return the new canvas.

		@param element: canvas or image element.
	*/
	toCanvas: function(element){

		var canvas;

		if(element.nodeName === "CANVAS"){
		
			canvas = element;
		
		}else{

			/* Draw the image into the canvas */

			canvas = document.createElement("canvas");

			canvas.width = element.naturalWidth || element.width;
			canvas.height = element.naturalHeight || element.height;

			canvas.getContext("2d").drawImage(element, 0, 0);
		
		}

		/* Check that the canvas is valid */

		if(canvas.width === 0 || canvas.height === 0){

			throw new Error("Invalid canvas dimensions.");
		
		}


		/* Max resolution */

		var res = { width: 4096, height: 4096 };


		/* 
			Method 1:

			Scale the image by a power of 2. Use the first value that brings the
			image width and height below res.width and res.height.
		*/
		var r = Math.max(canvas.width/(res.width>>1), canvas.height/(res.height>>1));

		var exp = Math.floor(Math.log(r)/Math.log(2));
		
		var scale = 1/Math.pow(2, exp);

		/* 
			Method 2:

			Scale the image to largest dimension below res.width and res.height.
		*/
		// var scale = Math.min(res.width/cv.width, res.height/cv.height);


		/* Check that scale is a number */

		if(Number.isFinite(scale)===false){
			
			throw new Error("Invalid scale value.");
		
		}


		/* Downsample the canvas if necessary */

		if(scale < 1){

			/* Scale canvas into dst */

			var dst = document.createElement("canvas");
			
			dst.width = Math.round(canvas.width*scale);
			
			dst.height = Math.round(canvas.height*scale);

			/*
				Scale functions will set the property .complete on the dst canvas.

				If true the canvas has finished scaling, Else the scaling operation
				is still in progess on a worker thread.
			*/

			// this.scaleInOne(

			// 	canvas, dst, 0, 0, dst.width, dst.height, true, scale, 
			// this.bilinear, this.initialiseDone, this.initialiseFail

			// );

			this.scaleInChunks(

				canvas, dst, 0, 0, dst.width, dst.height, true, scale, 
				this.bilinear, this.initialiseDone, this.initialiseFail

			);

			/* If the scale has completed remove the pixels from the original canvas. */

			if(dst.complete){

				canvas.width = canvas.height = 0;

			}

			canvas = dst;

		
		} else{

			/* Mark the element as complete if it was not scaled */

			canvas.complete = true;

		}

		return canvas;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Validate the file resolution. Return true if the element's dimensions are within 
		the min and max range for the element type, else return false.

		@param element: Image or canvas or video element.
	*/
	isValid: function(element){

		var w, h, resolution, isImage = element.nodeName!=="VIDEO";

		if( isImage ){

			/* Define the min and max dimensions for an image/canvas */

			resolution = {

				min: { width: 128, height: 128 },

				max: { width: 104028, height: 104028 }

			};

			/* Get the dimensions of the element */

			w = element.naturalWidth || element.width;

			h = element.naturalHeight || element.height;

		} else{

			/* Define the min and max dimensions for a video */

			resolution = {

				min: { width: 128, height: 128 },

				max: { width: 3840, height: 2160 }

			};

			w = element.videoWidth;

			h = element.videoHeight;

		}


		var key, text = isImage ? "an image" : "a video";

		/* Check that the element is greater that the minimum width and height */

		if( w < resolution.min.width || h < resolution.min.height ){

			key = "min";

		}

		/* Check that the element is less than the maximum width and height */

		else if( w > resolution.max.width || h > resolution.max.height ){

			key = "max";
				
		}

		/* Else the dimensions are valid so return true */

		else{

			return true;

		}


		/* Display an error message to the user and return false. */

		Ulo.messages(

			"Please upload " + text + (key==="min" ? " greater" : " less") + 
			" than " + resolution[key].width + " x " + 
			resolution[key].height + " pixels.",
			true
				
		);

		return false;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Open an element in the editor.

		@param element: Image or canvas or video element.
		@param max_count: Maximum number of files permitted for this type.
	*/
	open: function(element, max_count){

		try{

			if( this.isValid(element) ){

				 /* Update max_count */

				this.max_count = max_count;


				var video_thumbnail = Ulo.get("video_thumbnail");

				/*
					If video show the thumbnail slider button and set the element as 
					complete in the same way that toCanvas() does for images.
				*/
				if( element.nodeName === "VIDEO" ){

					Ulo.removeClass(video_thumbnail, Ulo.cls.hide);

					element.complete = true;

				}

				/*
					Else hide the thumbnail slider button and convert the image to a 
					canvas. toCanvas() also scales the image if necessary.
				*/
				else{

					Ulo.addClass(video_thumbnail, Ulo.cls.hide);

					element = this.toCanvas(element);

				}


				/* Add the new element to the editor */

				var mask = Ulo.create("div", {"class": "clipping_mask"});

				var crop = Ulo.create("div", {"class": "crop"});

				mask.appendChild( crop )
						
					.appendChild( element );

				var content = this.getContent();

				content.appendChild(mask);


				/*
					Display the editor window - Do this before calling update() or any of 
					the constructors below so that they can read the editor dimensions.
				*/

				var container = this.getEditor();

				if(Ulo.hasClass(container, Ulo.cls.hide)){

					this.show();

					if(this.MoveElement===undefined){

						this.MoveElement = new MoveElement();

						this.ScaleElement = new ScaleElement();
						
						this.VideoThumbnail = new VideoThumbnail();

					}

				}


				this.update(content);


				/* 
					If the element has finished loading initialise it.
				*/
				if(element.complete){

					this.initialise(element);

				}

				/*
					Else disabled the submit button and display a loading animation.
				*/
				else{

					this.setSubmitDisabled(true);

					crop.appendChild( Ulo.create("span", {"class": "loading"}) );

				}

				/*
					If the number of elements now in the editor is gte to this.max_count
					disable the input[type=file] element.
				*/
				this.setInputDisabled( this.count() );

			}

		} catch(e){

			console.log('EDITOR FAILED TO OPEN FILE: ', e);

			this.triggerClose();

		}

	},

	/* -------------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */
	/*
		Close the editor.
	*/
	close: function(){

		this.hide();

		/* Move the menu to the foot of the editor before deleting the content */
		this.moveMenu();

		/* Empty content after moving the menu. */
		this.deleteAllElements();


		this.selected = null;

		this.MoveElement.close();
		
		this.ScaleElement.close();
		
		this.VideoThumbnail.close();

		this.resetOrientation();

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Trigger all event handlers registered to the close button.
	*/
	triggerClose: function(){

		$(this.getClose()).trigger(Ulo.evts.click);

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Event handler for close().
	*/
	_close: function(e){

		var self = e.data.self.close();

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Terminate the class.
	*/
	terminate: function(){

		$(Ulo.get("toggle_editor_menu_actions")).off(Ulo.evts.click, this.showMenu);
		
		$(Ulo.get("editor_rotate")).off(Ulo.evts.click, this.rotateEditor);
		
		$(this.getClose()).off(Ulo.evts.click);
		
		$(this.getDelete()).off(Ulo.evts.click);

		$(this.getSubmit()).off(Ulo.evts.click);

		

		this.MoveElement.unregister();

		this.ScaleElement.unregister();

		this.VideoThumbnail.unregister();


		this.close();

	},

	/* -------------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */
	/*
		Return an object containing the on screen dimensions of the element, scaled to
		fit the dimensions of the crop area.

		@param element: canvas or video element.
		@param cw: crop area width.
		@param ch: crop area height.
	*/
	screenSize: function(element, cw, ch){

		var w, h, ratio;

		if(element.nodeName === "VIDEO"){

			w = element.videoWidth;
			h = element.videoHeight;

		} else{

			w = element.width;
			h = element.height;

		}
		
		ratio = Math.max(cw/w, ch/h);

		if(ratio !== ratio || w <= 0 || h <= 0 || cw <= 0 || ch <= 0){ 
		
			throw new Error("Invalid file dimensions.");
		
		}

		w = Math.max(w*ratio, cw);
		h = Math.max(h*ratio, ch);

		return { 
			
			width: w, 
			height: h,
			crop_width: cw,
			crop_height: ch
		
		};

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Update the dimensions of the content window and the elements loaded into the
		editor.

		@param content: Content container. See getContent().
	*/
	update: function(content){

		/* Crop area border size - must match the value in the css files */
		var trim = 30;

		/* Calculate the width to open the editor content window to. */
		var width = roundDownTo(

			Math.max(

				Math.min(

					/* The current width of the screen - Default to min width */
					document.body.clientWidth || this.dimensions.min, 

					/* The max width for the current orientation. */
					this.dimensions[this.dimensions.orientation]

				), 

				/* The min width to open the editor window to - May change with roundDownTo. */
				this.dimensions.min

			) - (trim<<1),

			/* Round the width to the nearest 'round_to' value. See constructor. */
			this.ratio.round_to

		)

		/* Calculate the height to open the editor content window to. */
		var height = (width/this.ratio.width) * this.ratio.height;


		/* Set the content window dimensions - dimension + (border * 2) */
		content.style.width = width + (trim<<1) + "px";
		content.style.height = height + (trim<<1) + "px";

		/* Clipping masks */
		var masks = content.childNodes;

		/* Variables to calculate the crop area width and height in the for loop */
		var dimensions = { width:0, height:0 };

		var styles = this.isPortrait() ? 
			
			{
				/* Position offsets */
				top:0, bottom:0, left:trim, right:trim,
				
				/* Objects keys to adjust the first and last element */
				first:"top", last:"bottom", extend:"height",
				
				/* Width and height of each crop window */
				width:width, height:height/masks.length
			} : 
			
			{
				top:trim, bottom:trim, left:0, right:0,
				
				first:"left", last:"right", extend:"width",
				
				width:width/masks.length, height:height
			};



		for(var i=0, crop, elem; i<masks.length; ++i){
			
			/* 
				The first child of the mask is the crop area div. See open() for 
				element creation. 
			*/
			crop = masks[i].firstChild;

			/* Set the position of the crop div */
			crop.style.top = styles.top + "px";
			crop.style.bottom = styles.bottom + "px";
			crop.style.left = styles.left + "px";
			crop.style.right = styles.right + "px";

			/* Calculate the width and height of the clipping mask */
			dimensions.width = styles.width + styles.left + styles.right;
			dimensions.height = styles.height + styles.top + styles.bottom;

			/* 
				If first element:
					
					If portrait - offset the top position (styles.first) of the crop 
					element by the trim and extend the height (styles.extend) of the 
					clipping mask to include the trim offset.

					If landscape - offset the left position (styles.first) of the crop 
					element by the trim and extend the width (styles.extend) of the 
					clipping mask to include the trim offset.
			*/
			if(i===0){

				crop.style[styles.first] = trim + "px";
				dimensions[styles.extend] += trim;

			}

			/* 
				If last element:
					
					If portrait - offset the bottom position (styles.last) of the crop 
					element by the trim and extend the height (styles.extend) of the 
					clipping mask to include the trim offset.

					If landscape - offset the right position (styles.lasy) of the crop 
					element by the trim and extend the width (styles.extend) of the 
					clipping mask to include the trim offset.
			*/
			if(i+1===masks.length){

				crop.style[styles.last] = trim + "px";
				dimensions[styles.extend] += trim;

			}

			/* Set the width and height of the clipping mask */
			masks[i].style.width = dimensions.width + "px";
			masks[i].style.height = dimensions.height + "px";

			/*
				The first child of the crop is the canvas/video element. 
				See open() for element creation. 
			*/
			elem = crop.firstChild;


			/*
				Set the property size to an object containing the dimensions of the
				element scaled to the crop area. The property is accessed by the 
				file processing classes (E.g. ScaleElement).
			*/
			elem.size = this.screenSize(elem, styles.width, styles.height);

			/* Set the on screen canvas/video dimensions */
			elem.style.width  = elem.size.width +"px";
			elem.style.height = elem.size.height+"px";

			/* Centre the canvas/video */
			elem.style.left = Math.floor((elem.size.width-styles.width) * -0.5) + "px";
			elem.style.top = Math.floor((elem.size.height-styles.height) * -0.5) + "px";

		}


		/* Update the classes after updating the editor window. */
		
		this.MoveElement.update();

		this.ScaleElement.update();
		
		this.VideoThumbnail.update();

	},

	/* -------------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */
	/*
		Remove an element from the editor.

		@param container: Canvas or video element container. See getContainer().
	*/
	deleteElement: function(container){

		/* Remove the element from the editor */

		Ulo.remove( container );


		/* Disable the submit button if the editor is empty */

		var count = this.count();

		if(count === 0){

			this.setSubmitDisabled( true );

		}

		/* Enable the input[type=file] element if count < this.max_count */

		this.setInputDisabled( count );

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Remove all elements from the editor.
	*/
	deleteAllElements: function(){

		var containers = this.getContent().childNodes;

		for(var i=0; i<containers.length; ++i){

			/*
				Terminate all workers. This function is called by close() so there may be 
				scale operations still in progress.
			*/
			this.removeAllWorkers( this.getElement(containers[i]) );

			this.deleteElement( containers[i] );

		}

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Remove an element from the editor. Update the editor to reflect the change.
	*/
	_delete: function(e){

		var self = e.data.self;

		if(self.selected && self.count() > 0){

			/*
				Move the menu to the foot of the editor before deleting the element.
			*/
			self.moveMenu();

			/*
				Prevent the select event from triggering on the deleted element by 
				removing its event handler.
			*/
			self.unregisterSelect(self.selected);


			/* Remove the element from the Scale class */
			self.ScaleElement.dequeue(self.selected);

			/* Delete the element from the editor. */
			self.deleteElement( self.getContainer(self.selected) );


			var content = self.getContent(),
			select;

			/*
				The editor is empty so set select to null.
			*/
			if(content.firstChild === null){

				select = null;

			}

			/*
				Else make the first element in the editor the selected element.
			*/
			else{

				select = self.getElement(content.firstChild);

				self.update(content);		
	
			}


			self.select(select);

		}

	},

	/* -------------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */
	/*
		Return the file actions menu container.
	*/
	getMenuContainer: function(){

		return Ulo.get("editor_menu");

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Move the file actions menu into the container.

		@param container: Optional element to append the menu to. Defaults to 
			this.getEditor().
	*/
	moveMenu: function(container){

		var menu = this.getMenuContainer();

		this.hideMenu(menu, false);

		( container || this.getEditor() ).appendChild( menu );

	},
	/* -------------------------------------------------------------------------------- */
	/*
		Display the file actions menu.
	*/
	showMenu: function(e){

		var self = e.data.self;

		/* Get the menu that this button toggles */

		var menu = Ulo.get( e.currentTarget.getAttribute("data-toggle") );


		/* If the menu is hidden then show it */

		if(Ulo.hasClass(menu, Ulo.cls.hide)){

			Ulo.removeClass(menu, Ulo.cls.hide);
			
			var icon  = e.currentTarget.querySelector("span.icon");

			Ulo.addClass(Ulo.removeClass(icon, "icon_down_arrow_white"), "icon_up_arrow_white");

			$(document).on(Ulo.evts.click, {self: self, ignore: true}, self._hideMenu);

		}

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Hide the file actions menu.

		@param menu: Menu container. See getMenuContainer().
		@param ignore: Boolean - if true ignore the function call.
	*/
	hideMenu: function(menu, ignore){

		if(ignore !== true){

			/* Get the button that toggle the actions menu */

			var button = menu.querySelector("button.toggle_menu");


			/* Get the menu that this button toggles */

			menu = Ulo.get( button.getAttribute("data-toggle") );


			if(button !== null && menu !== null && Ulo.hasClass(menu, Ulo.cls.hide) === false){
			
				Ulo.addClass(menu, Ulo.cls.hide);

				var icon  = button.querySelector("span.icon");

				Ulo.addClass(Ulo.removeClass(icon, "icon_up_arrow_white"), "icon_down_arrow_white");

				$(document).off(Ulo.evts.click, this._hideMenu);

			}

		}

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Event handler form hideMenu().
	*/
	_hideMenu: function(e){

		e.data.self.hideMenu(e.data.self.getMenuContainer(), e.data.ignore);

		e.data.ignore = false;

	},

	/* -------------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */
	/*
		Make target the current selection.

		@param target: canvas or video element.
	*/
	select: function(target){

		if(target !== this.selected){

			this.selected = target;

			
			this.MoveElement.select(target);

			this.ScaleElement.select(target);
			
			this.VideoThumbnail.select(target);


			if(target !== null){

				/* Move the file actions menu into the selected elements container */

				this.moveMenu(target.parentNode);

			}

		}
		
	},

	/* -------------------------------------------------------------------------------- */
	/*
		Event handler for select().
	*/
	_select: function(e){

		e.data.self.select(e.currentTarget);

	},

	/* -------------------------------------------------------------------------------- */




	/* SCALING */
	/* -------------------------------------------------------------------------------- */
	/*
		Create an inline web worker for scale functions and return the worker instance.

		@param fn: Scale function.
		@param dst: Destination canvas.
		@param fail: Error handler.
	*/
	createWorker: function(fn, dst, fail){

		/*
			Create a file like object using the Blob constructor. The onmessage function
			will return fn's return value as a transferable object so it must return an
			ArrayBuffer.
		*/
		var blob = new Blob([
			
			"onmessage = function(e){ ",
			
				"var d = (", fn.toString(), ").apply(null, e.data);",

				"postMessage(d, [d]);",
			
			"}"
		
		]);
		
		var url = window.URL.createObjectURL(blob);
		
		var worker = new Worker(url);
		
		window.URL.revokeObjectURL(url);


		$(worker).on("error", { self: this, dst: dst }, fail);

		/* Normalise postMessage. */

		worker.postMessage = worker.webkitPostMessage || worker.postMessage;

		return worker;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Store reference to the web worker on the destination canvas.

		@param dst: Destination canvas.
		@param worker: Web worker.
	*/
	addWorker: function(dst, worker){

		if(dst.workers === undefined){

			dst.workers = [worker];

		} else{

			dst.workers.push(worker);

		}

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Terminate the web worker for the destination canvas.

		@param dst: Destination canvas.
		@param worker: Web worker.
	*/
	removeWorker: function(dst, worker){

		if(worker){

			for(var i in dst.workers){

				if(dst.workers[i] === worker){

					dst.workers.splice(i, 1);

					worker.terminate();

					break;

				}

			}

		}

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Terminate all web workers for the destination canvas.

		@param dst: Destination canvas.
	*/
	removeAllWorkers: function(dst){

		for(var i in dst.workers){

			dst.workers[i].terminate();

		}

		dst.workers = undefined;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Scale the source image (src) into the destination image (dst).

		If isWorkerThread is true src and dst must be ArrayBuffers and the function will
		return the destination buffer (dst), else they must be Uint8ClampedArrays and 
		the function will not return a value.

		@param src: Souce image (ArrayBuffer or Uint8ClampedArray).
		@param sw: Source image width.
		@param sw: Source image height.
		@param dst: Destination image (ArrayBuffer or Uint8ClampedArray).
		@param dw: Destination image width.
		@param dw: Destination image height.
		@param scale: Scale value (float).
		@param isWorkerThread: True if called from a worker and false if not.
	*/
	bilinear: function(src, sw, sh, dst, dw, dh, scale, isWorkerThread){

		/* Loop variables. */
		var iy_max = sh-1;
		var ix_max = sw-1;
		var i, ix,ix0,ix1,iy,iy0,iy1, p1,p2,p3,p4, w1,w2,w3,w4, dx,dx1,dy,dy1;

		/* Uint8ClampedArray is supported from IE 11, Uint8Array from IE 10. */
		if(isWorkerThread){
		
			src = new Uint8Array(src);
			dst = new Uint8Array(dst);
		
		}

		for(var y=0; y<dh; ++y){

			iy  = y / scale;
			iy0 = Math.floor(iy);
			iy1 = Math.ceil(iy);
			if(iy1 > iy_max){ iy1=iy_max; }

			for(var x=0; x<dw; ++x){
			
				ix  = x / scale;
				ix0 = Math.floor(ix);
				ix1 = Math.ceil(ix);
				if(ix1 > ix_max){ ix1=ix_max; }
				
				/* Calc the weights for each pixel. */
				dx = ix-ix0; 
				dy = iy-iy0;
				dx1 = 1.0-dx;
				dy1 = 1.0-dy;
				w1 = dx1 * dy1;
				w2 = dx * dy1;
				w3 = dx1 * dy;
				w4 = dx * dy;

				/* Index positions of the surrounding pixels. */
				p1 = (ix0 + sw * iy0) << 2;
				p2 = (ix1 + sw * iy0) << 2;
				p3 = (ix0 + sw * iy1) << 2;
				p4 = (ix1 + sw * iy1) << 2;

				i = (y*dw+x) << 2;

				dst[i]   = (src[p1] * w1 + src[p2] * w2 + src[p3] * w3 + src[p4] * w4); //& 0xff;
				dst[i+1] = (src[p1+1]*w1 + src[p2+1]*w2 + src[p3+1]*w3 + src[p4+1]*w4); //& 0xff;
				dst[i+2] = (src[p1+2]*w1 + src[p2+2]*w2 + src[p3+2]*w3 + src[p4+2]*w4); //& 0xff;
				dst[i+3] = (src[p1+3]*w1 + src[p2+3]*w2 + src[p3+3]*w3 + src[p4+3]*w4); //& 0xff;
		
			}
		
		}

		/*
			Return the destination array buffer if called from a web worker.
		*/
		if(isWorkerThread){

			return dst.buffer;
		
		}
		
	},

	/* -------------------------------------------------------------------------------- */
	/*
		Scale the source image (src) into the destination image (dst).

		If isWorkerThread is true src and dst must be ArrayBuffers and the function will
		return the destination buffer (dst), else they must be Uint8ClampedArrays and 
		the function will not return a value.

		NOTE: CAN PRODUCE SPECS OF RGB PIXELS WHEN DOWN SAMPLING LARGE IMAGES TO SMALL
		SIZES.

		@param src: Souce image (ArrayBuffer or Uint8ClampedArray).
		@param sw: Source image width.
		@param sw: Source image height.
		@param dst: Destination image (ArrayBuffer or Uint8ClampedArray).
		@param dw: Destination image width.
		@param dw: Destination image height.
		@param scale: Scale value (float).
		@param isWorkerThread: True if called from a worker and false if not.
	*/
	bicubic: function(src, sw, sh, dst, dw, dh, scale, isWorkerThread) {

		/* Loop variables */
		var dx, dy;
		var repeatX, repeatY;
		var r0, r1, r2, r3;
		var c0, c1, c2, c3;
		var v0, v1, v2, v3;
		var yv, y0, xv, x0, i;

		/* Uint8ClampedArray is supported from IE 11, Uint8Array from IE 10. */
		if(isWorkerThread){
		
			src = new Uint8Array(src);
			dst = new Uint8Array(dst);
		
		}
		
		for (var y=0; y < dh; ++y) {
			
			yv = y / scale;
			y0 = Math.floor(yv);

			repeatY = 0;
			
			if(y0 < 1){
			
				repeatY = -1;
			
			} else if(y0 > sh - 3){
			
				repeatY = y0 - (sh - 3); 
			
			}

			for (var x=0; x < dw; ++x) {
				
				xv = x / scale;
				x0 = Math.floor(xv);

				repeatX = 0;
				
				if(x0 < 1){
				
					repeatX = -1;
				
				} else if(x0 > sw - 3){
				
					repeatX = x0 - (sw - 3);
				
				}

				r1 = (y0 * sw + x0) << 2;
				r0 = repeatY < 0 ? r1 : ((y0-1) * sw + x0) << 2;
				r2 = repeatY > 1 ? r1 : ((y0+1) * sw + x0) << 2;
				r3 = repeatY > 0 ? r2 : ((y0+2) * sw + x0) << 2;

				c0 = repeatX < 0 ? 0 : -4;
				c2 = repeatX > 1 ? 0 : 4;
				c3 = repeatX > 0 ? c2 : 8;

				dx = xv - x0; 
				dy = yv - y0;
				i = (y*dw+x) << 2;

				/* rgba values: j===0 is r, j===1 is g, j===2 is b, j===3 is a */ 
				for(var j=0; j<4; ++r0, ++r1, ++r2, ++r3, ++i, ++j){

					v0 = 0.5*(src[r0+c2]-src[r0+c0]+(2*src[r0+c0]-5*src[r0]+4*src[r0+c2]-src[r0+c3]+
						(3*(src[r0]-src[r0+c2])+src[r0+c3]-src[r0+c0])*dx)*dx)*dx+src[r0];

					v1 = 0.5*(src[r1+c2]-src[r1+c0]+(2*src[r1+c0]-5*src[r1]+4*src[r1+c2]-src[r1+c3]+
						(3*(src[r1]-src[r1+c2])+src[r1+c3]-src[r1+c0])*dx)*dx)*dx+src[r1];

					v2 = 0.5*(src[r2+c2]-src[r2+c0]+(2*src[r2+c0]-5*src[r2]+4*src[r2+c2]-src[r2+c3]+
						(3*(src[r2]-src[r2+c2])+src[r2+c3]-src[r2+c0])*dx)*dx)*dx+src[r2];

					v3 = 0.5*(src[r3+c2]-src[r3+c0]+(2*src[r3+c0]-5*src[r3]+4*src[r3+c2]-src[r3+c3]+
						(3*(src[r3]-src[r3+c2])+src[r3+c3]-src[r3+c0])*dx)*dx)*dx+src[r3];

					dst[i] = 0.5*(v2-v0+(2*v0-5*v1+4*v2-v3+(3*(v1-v2)+v3-v0)*dy)*dy)*dy+v1;
				
				}

			}
		
		}
		
		/*
			Return the destination array buffer if called from a web worker.
		*/
		if(isWorkerThread){
		
			return dst.buffer;
		
		}

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Scale the canvas in place and return true if the scale has completed and false
		if it is still in progress on the worker thread.

		NOTE: putImageData() DOES NOT WORK CONSISTENTLY - USE drawImage() IF SCALE STARTS
		RETURNING BLANK IMAGES.

		@param canvas: Source image canvas.
		@param scale: Scale value (float).
		@param mw: Minimum scale width.
		@param mh: Minimum scale height.
		@param scaleCallback: Scale function - this.bilinear() or this.bicubic().
		@param workerCallback: Called once the worker has completed.
		@param errorCallback: Called if the worker throws an exception. See createWorker().
	*/
	// scaleInOne: function(canvas, scale, mw, mh, scaleCallback, workerCallback, errorCallback){

	// 	try{

	// 		/*
	// 			Get the original image data - if the canvas is too large the browser may 
	// 			throw an exception.
	// 		*/
	// 		var src = canvas.getContext("2d").getImageData(0,0,canvas.width,canvas.height);

	// 		/*
	// 			Create an ImageData instance to the scaled dimensions.
	// 		*/
	// 		var dst = canvas.getContext("2d").createImageData(

	// 			Math.max(Math.round(canvas.width*scale), mw),
	// 			Math.max(Math.round(canvas.height*scale), mh)
			
	// 		);

	// 		/*
	// 			If dst is null the canvas dimensions are too large.
	// 		*/
	// 		if(dst===null){ 
			
	// 			throw new Error(); 
			
	// 		}

	// 	} catch(e){

	// 		throw new Error(

	// 			"The browser you are using does not support editing of large images."

	// 		);
		
	// 	}


	// 	/*
	// 		Run scaleCallback in a web worker if given a callback function.
	// 	*/
	// 	if(workerCallback!==undefined && window.Worker){

	// 		try{

	// 			var worker = this.createWorker(scaleCallback, canvas, errorCallback);

	// 			var self = this;


	// 			/*
	// 				Add onmessage handler to fill the original canvas with the scaled 
	// 				image data and run the workerCallback function.
	// 			*/
	// 			worker.onmessage = function(e){

	// 				worker.terminate();

	// 				/*
	// 					If dst was transfered then its buffer will have been neutered so
	// 					reassign it an empty ImageData object.
	// 				*/
	// 				if(dst.data.buffer.byteLength === 0){
					
	// 					dst = canvas.getContext("2d").createImageData(dst.width,dst.height);
					
	// 				}

	// 				/* Set the array buffer on the scaled ImageData object. */
	// 				dst.data.set(new Uint8Array(e.data));
					
	// 				/* Set the original canvas dimensions to the scaled dimensions. */
	// 				canvas.width=dst.width; canvas.height=dst.height;
					
	// 				/* Add the data to the original canvas. */
	// 				canvas.getContext("2d").putImageData(dst, 0, 0);
					
	// 				dst = null;

	// 				workerCallback.call(self, canvas);
					
	// 			}


	// 			/* Set the scaleCallback parameter values. See args above. */
	// 			var data = [
				
	// 				src.data.buffer, src.width, src.height,  
	// 				dst.data.buffer, dst.width, dst.height, 
	// 				scale, true
				
	// 			];

	// 			/*
	// 				Send the data to the worker - src and dst are sent as transferable 
	// 				objects. 
	// 			*/
	// 			worker.postMessage(data, [data[0], data[3]]);

	// 			return false;

	// 		} catch(e){

	// 			if(worker){
				
	// 				worker.terminate();
				
	// 			}

	// 			/* Continue and attempt to perform the scale on the main thread. */

	// 		}

	// 	}


	// 	/* Perform the scale on the main thread. */
	// 	scaleCallback(src.data, src.width, src.height, dst.data, dst.width, dst.height, scale, false);
		
	// 	/* 
	// 		Set canvas to the scaled dimensions and add the scaled image data to the 
	// 		original canvas.
	// 	*/
	// 	canvas.width=dst.width; canvas.height=dst.height;
		
	// 	canvas.getContext("2d").putImageData(dst, 0, 0);
		
	// 	dst = null;

	// 	return true;
	
	// },

	/*
		Scale the source canvas (src) into the destination canvas (dst) in one go.

		NOTE: putImageData() DOES NOT WORK CONSISTENTLY - USE drawImage() WHEN POSSIBLE.

		@param src: Source image canvas.
		@param dst: Destination image canvas.
		@param dx: Destination canvas x offset.
		@param dy: Destination canvas y offset.
		@param dy: Destination canvas width.
		@param dy: Destination canvas height.
		@param sync: Boolean - If true attempt to scale the canvas on a worker thread.
		@param scale: Scale value (float).
		@param scaleFunction: Scale function - bilinear() ir bicubic().
		@param done: Success callback function for web worker scaling,
		@param fail: Error callback function for web worker scaling,
	*/
	scaleInOne: function(src, dst, dx, dy, dw, dh, sync, scale, scaleFunction, done, fail){

		try{

			if(src === null || dst === null){

				throw new Error();

			}

			var src_ = src.getContext("2d").getImageData(0, 0, src.width, src.height);

			var dst_ = dst.getContext("2d").getImageData(dx, dy, dw, dh);

		} catch(e){

			throw new Error(

				"The browser you are using does not support editing of large images."

			);
		
		}


		/*
			Run scaleFunction inside a web worker.
		*/
		if(sync && window.Worker){

			try{

				var worker = this.createWorker(scaleFunction, dst, fail);

				var self = this;


				worker.onmessage = function(e){

					self.removeWorker(dst, worker);

					/*
						If dst was transfered then its buffer will have been neutered so
						reassign it an empty ImageData object.
					*/
					if(dst_.data.buffer.byteLength === 0){
					
						dst_ = dst.getContext("2d").createImageData(dst_.width,dst_.height);
					
					}


					/*
						Add the scaled image data to the destination canvas.
					*/
					dst_.data.set(new Uint8Array(e.data));

					dst.getContext("2d").putImageData(dst_, dx, dy);


					src_ = dst_ = null;


					/* Mark the canvas as complete. Set before calling done() */
					dst.complete = true;

					done.call(self, src, dst);
					
				}


				/*
					Create an array of arguments for the scaleFunction.
				*/
				var data = [
				
					src_.data.buffer, src_.width, src_.height,  
					dst_.data.buffer, dst_.width, dst_.height, 
					scale, true
				
				];


				/*
					Send the data to the worker - src and dst are sent as transferable 
					objects. 
				*/
				worker.postMessage(data, [data[0], data[3]]);

				/*
					Store reference to the worker so it can be terminated on success or 
					failure.
				*/
				self.addWorker(dst, worker);


				dst.complete = false;

				return dst;


			} catch(e){

				self.removeWorker(dst, worker);

				/* Continue and attempt to perform the scale on the main thread. */

			}

		}


		/* Perform the scale on the main thread. */

		scaleFunction(

			src_.data, src_.width, src_.height, 
			dst_.data, dst_.width, dst_.height, 
			scale, false

		);
		
		dst.getContext("2d").putImageData(dst_, dx, dy);

		src_ = dst_ = null;

		dst.complete = true;

		return dst;
	
	},

	/* -------------------------------------------------------------------------------- */
	/* -------------------------------------------------------------------------------- */
	/*
		Return an array of {x,y} indices used to calculate the x and y offset for each 
		chunk. See getData() and scaleInChunks().

		@param x_count: Number of chunks along the x axis.
		@param y_count: Number of chunks along the y axis.
	*/
	getIndices: function(x_count, y_count){

		var i = [];

		for(var y=0; y<y_count; ++y){

			for(var x=0; x<x_count; ++x){

				i.push({ x:x, y:y });

			}

		}

		return i;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return an object containing the information of the destination chunk.

		@param indices: Object containing the x and y index position of the chunk.
		@param src: Source image canvas.
		@param dst: Destination image canvas.
		@param dx: Destination canvas x offset.
		@param dy: Destination canvas y offset.
		@param dy: Destination canvas width.
		@param dy: Destination canvas height.

	*/
	getData: function(indices, src, dst, dx, dy, dw, dh, size, sizeScaled){

		var data=null, i=indices.pop();

		if(i !== undefined){

			var src_chunk, dst_chunk, x, y, w, h;

			data = { args: [] }

			/* Calculate the x and y offset for this chunk inside the source canvas */
			x = i.x*size;
			y = i.y*size;

			/* Calculate the width and height of this chunk inside the source canvas */
			w = Math.min(src.width -x, size);
			h = Math.min(src.height-y, size);

			/* Get the chunk from the source canvas */
			src_chunk = src.getContext("2d").getImageData(x, y, w, h);

			/* Add the source canvas arguments used by the scaleFunction */
			data.args.push(src_chunk.data, w, h);


			/* Calculate the x and y offset for this chunk inside the destination canvas */
			x = i.x*sizeScaled;
			y = i.y*sizeScaled;

			/* Calculate the width and height of this chunk inside the destination canvas */
			w = Math.min(dw-x, sizeScaled);
			h = Math.min(dh-y, sizeScaled);

			/* Apply the offsets before retrieving the chunk */
			x += dx;
			y += dy;

			/* Get the chunk from the destination canvas */
			dst_chunk = dst.getContext("2d").getImageData(x, y, w, h);

			/* Add the destination canvas arguments used by the scaleFunction */
			data.args.push(dst_chunk.data, w, h);


			/*
				Add extra information for the destination chunk to the returned data. 
				See scaleInChunks().
			*/
			data.chunk = dst_chunk;
			data.x = x;
			data.y = y;

		}

		return data;
	},

	/* -------------------------------------------------------------------------------- */
	/*
		Scale the source canvas (src) into the destination canvas (dst) in chunks.

		NOTE: putImageData() DOES NOT WORK CONSISTENTLY - USE drawImage() WHEN POSSIBLE.

		@param src: Source image canvas.
		@param dst: Destination image canvas.
		@param dx: Destination canvas x offset.
		@param dy: Destination canvas y offset.
		@param dy: Destination canvas width.
		@param dy: Destination canvas height.
		@param sync: Boolean - If true attempt to scale the canvas on a worker thread.
		@param scale: Scale value (float).
		@param scaleFunction: Scale function - bilinear() ir bicubic().
		@param done: Success callback function for web worker scaling,
		@param fail: Error callback function for web worker scaling,
	*/
	scaleInChunks: function(src, dst, dx, dy, dw, dh, sync, scale, scaleFunction, done, fail){

		try{

			if(src === null || dst === null){

				throw new Error();

			}

			/*
				Attempt to read a single piece of information from the canvases. If the 
				canvas is too large the browser may throw an exception.
			*/
			src.getContext("2d").getImageData(0,0,1,1);

			dst.getContext("2d").getImageData(0,0,1,1);	

		} catch(e){

			throw new Error(

				"The browser you are using does not support editing of large images."

			);
		
		}


		var data,

		/* Chunk size */
		size = 1024,

		/* Scaled chunk size */
		sizeScaled = Math.round(size*scale),

		/* Number of chunks along the x axis */
		x_count = Math.ceil(src.width/size),

		/* Number of chunks along the y axis */
		y_count = Math.ceil(src.height/size),

		/* Object of indices {x: N, y: N} used to calculate the offset for each chunk. */
		i = this.getIndices(x_count, y_count);


		if(sync && window.Worker){

			try{

				var worker = this.createWorker(scaleFunction, dst, fail);

				var self = this;


				worker.onmessage = function(e){

					/*
						If dst was transfered then its buffer will have been neutered so
						reassign it an empty ImageData object.
					*/
					if(data.chunk.data.buffer.byteLength === 0){
					
						data.chunk = dst.getContext("2d")
							.createImageData(data.chunk.width, data.chunk.height);
					
					}

					/*
						Add the scaled image data to the destination chunk.
					*/
					data.chunk.data.set(new Uint8Array(e.data));
					
					dst.getContext("2d").putImageData(data.chunk, data.x, data.y);


					/*
						Get data for the next chunk.
					*/
					data = self.getData(i, src, dst, dx, dy, dw, dh, size, sizeScaled);

					if(data !== null){

						/*
							Add the scaleFunction arguments scale and isWorkerThread.
							See bilinear() or bicubic().
						*/
						data.args.push(scale, true);

						/*
							Replace the source and destination chunks with their buffers
							so that they can be transferred instead of copied.
						*/

						data.args[0] = data.args[0].buffer;
						
						data.args[3] = data.args[3].buffer;
						
						worker.postMessage(data.args, [data.args[0], data.args[3]]);

					}

					/*
						If there are no more chunks...
					*/
					else{

						self.removeWorker(dst, worker);

						/* Mark the canvas as complete. Set before calling done() */
						dst.complete = true;

						done.call(self, src, dst);

					}
					
				}

				
				/*
					Get the first chunk to begin the process.
				*/
				data = this.getData(i, src, dst, dx, dy, dw, dh, size, sizeScaled);

				/*
					Add the scaleFunction arguments scale and isWorkerThread.
					See bilinear() or bicubic().
				*/
				data.args.push(scale, true);

				/*
					Replace the source and destination chunks with their buffers
					so that they can be transferred instead of copied.
				*/

				data.args[0] = data.args[0].buffer;
					
				data.args[3] = data.args[3].buffer;
					
				worker.postMessage(data.args, [data.args[0], data.args[3]]);

				/*
					Store reference to the worker so it can be terminated on success or 
					failure.
				*/
				self.addWorker(dst, worker);


				dst.complete = false;

				return dst;


			} catch(e){

				self.removeWorker(dst, worker);

				i = this.getIndices(x_count, y_count);

				/* Continue and attempt to perform the scale on the main thread. */

			}

		}


		/*
			Perform the scale on the main thread.
		*/

		while( (data=this.getData(i, src, dst, dx, dy, dw, dh, size, sizeScaled)) !== null ){

			data.args.push(scale, false);
			
			scaleFunction.apply(null, data.args);

			dst.getContext("2d").putImageData(data.chunk, data.x, data.y);

		}

		dst.complete = true;

		return dst

	},

	/* END SCALING */
	/* -------------------------------------------------------------------------------- */
	



	/* CREATE FINAL CANVAS */
	/* -------------------------------------------------------------------------------- */
	/*
		Scale callback function to decrement the pending counter when creating the final
		canvas. See getCanvas().

		@param src: Source canvas.
		@param dst: Destination canvas.
	*/
	canvasDone: function(src, dst){

		--dst.pending;

		src.width = src.height = 0;

		src = null;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Scale callback function to set the property failed on the final canvas if an error
		occurs while scaling the canvas on the web worker thread.

		@param e: Event or Destination canvas.
	*/
	canvasFail: function(e){

		var self, dst;

		if(e.nodeName === "CANVAS"){

			dst = e;

			self = this;

		} else{

			e.preventDefault();

			dst = e.data.dst;

			self = e.data.self;

		}

		if(dst){

			dst.failed = true;

			dst.width = dst.height = 0;

			self.removeAllWorkers(dst);

		}

	},
	/* -------------------------------------------------------------------------------- */
	/*
		Return a canvas containing the current video frame.
		
		@param video: Video element.
		@param canvas: Final canvas. See getCanvas().
	*/
	videoToCanvas: function(video, canvas){

		if(video.nodeName === "CANVAS"){

			return video;

		}

		if(canvas.videos === undefined){

			canvas.videos = [];

		}

		/*
			The original video file is set as a property on the element by the class
			FileUpload before being loaded into the editor.
		*/
		canvas.videos.push(video);

		/*
			Render the current frame into the canvas, copying all attributes required
			by getCanvas() to scale and position the image.
		*/

		var tmp = document.createElement("canvas");

		tmp.scale = video.scale;

		tmp.width = video.videoWidth;
		
		tmp.height = video.videoHeight;

		tmp.style.top = video.style.top;
		tmp.style.left = video.style.left;
		tmp.style.width = video.style.width;
		tmp.style.height = video.style.height;
		
		tmp.getContext("2d").drawImage(video, 0, 0);

		return tmp

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return a single canvas cropped and scaled to the current state of the editor. 
		The canvas will set a property 'pending' which indicates the number of canvases
		that are still being processed. The canvas is ready when pending === 0. The
		canvase will also set a property failed to true if the process fails.
		
		@param sync: Boolean - If true attempt to scale the canvases on the worker thread.
		@param min: Multiple used to determine the min width and height of the final canvas
			by multiplying its value with the aspect ratio.
		@param max: Multiple used to determine the max width and height of the final canvas
			by multiplying its value with the aspect ratio.
	*/
	getCanvas: function(sync, min, max){

		try{

			/* FINAL CANVAS */

			var canvas = document.createElement("canvas"),
			masks = this.getContent().childNodes,
			canvases = [], 
			w = 0, 
			h = 0,
			gcm,
			canvas;

			for(var i=0, tmp; i<masks.length; ++i){

				/*
					Get the canvas or video element
				*/
				tmp = this.getElement( masks[i] );

				/*
					If any file in the editor has not fully loaded return null.
				*/
				if(tmp.complete !== true){

					return null;

				}

				/* Convert any video files to a canvas */
				tmp = this.videoToCanvas( tmp, canvas );

				/* Sum the width and height values to calculate an average */
				w += tmp.width;
				h += tmp.height;

				/* Queue each canvas for processing */
				canvases.push( tmp );

			}

			if(canvases.length === 0){

				throw new Error("No Files in the editor.");

			}

			/* Get an average for the width and height */
			w /= canvases.length;
			h /= canvases.length;


			/* 
				Calculate the greatest common multiple in relation to the aspect ratio,
				capped by min and max.

				E.g. If canvas dimension: 400 X 400, aspect ratio 4:3, gcm = 100, which
					will result in a final canvas size of 400 X 300.
			*/
			gcm = Math.max(
			
				Math.min(

					Math.round(

						Math.min( w/this.ratio.width, h/this.ratio.height )

					), max

				), min
			
			);

			/* Set the width and height of the final canvas */
			w = this.ratio.width * gcm;
			h = this.ratio.height* gcm;

			/* Set the properties of the final canvas */
			canvas.pending = canvases.length;
			canvas.width  = w;
			canvas.height = h;

			/* FINAL CANVAS */


			/* INDIVIDUAL CANVAS DIMENSIONS */

			var aspect_ratio = { width: this.ratio.width, height: this.ratio.height },

			isPortrait = this.isPortrait();

			if(isPortrait){

				h /= canvases.length;

				aspect_ratio.height /= canvases.length;

			} else{

				w /= canvases.length;

				aspect_ratio.width /= canvases.length;

			}

			/* END INDIVIDUAL CANVAS DIMENSIONS */


			/* CROP AND SCALE */

			var zoom, scale, ratio, x, y, offsets;

			for(var i=0; i<canvases.length; ++i){

				/*
					Canvas zoom - The value is set on the canvas as the property scale 
					by the class ScaleElement.
				*/
				zoom = ((parseFloat(canvases[i].scale) || 0) * 0.01) + 1;

				/*
					Calculate the scale.
				*/
				scale = Math.max(w/canvases[i].width, h/canvases[i].height) * zoom;


				/* CROP */

				/*
					Calculate the greatest common multiple in relation to the aspect ratio,
					applying any zoom (scale) to the value.
				*/
				gcm = Math.min( 

						canvases[i].width / aspect_ratio.width, 
						canvases[i].height/ aspect_ratio.height

					) / zoom;

				/*
					Create a canvas to the crop dimensions.
				*/
				var crop = document.createElement("canvas");
				crop.width  = Math.round(aspect_ratio.width * gcm);
				crop.height = Math.round(aspect_ratio.height* gcm);

				/*
					Calculate the ratio between the natural size and the stylised
					size to scale between the to.
				*/
				ratio = Math.min(

					canvases[i].width /parseFloat(canvases[i].style.width),
					canvases[i].height/parseFloat(canvases[i].style.height)
				
				);

				/*
					Calculate the x offset for the crop.
				*/
				x = Math.min(

					Math.round(Math.abs(parseFloat(canvases[i].style.left) * ratio)),
					canvases[i].width - crop.width

				);

				/*
					Calculate the y offset for the crop.
				*/
				y = Math.min(

					Math.round(Math.abs(parseFloat(canvases[i].style.top) * ratio)),
					canvases[i].height - crop.height

				);

				if(x !== 0 || y !== 0){

					/*
						Crop the image.
					*/
					crop.getContext("2d").drawImage(

						canvases[i], 
						x, y, crop.width, crop.height, 
						0, 0, crop.width, crop.height

					);

					/* Remove the pixels from the original canvas */
					canvases[i].width = canvases[i].height = 0;

				} else{

					crop = canvases[i];

				}

				/* END CROP */

				
				/* SCALE */

				/*
					Calculate the offsets for the destination canvas.
				*/
				offsets = isPortrait ? [0, i * h] : [i * w, 0];

				if(scale !== 1){

					/*
						Scale the image.
					*/
					this.scaleInOne(

						crop, canvas, offsets[0], offsets[1], w, h, sync, 
						scale, this.bilinear, this.canvasDone, this.canvasFail

					);

				} else{

					canvas.getContext("2d").drawImage(crop, offsets[0], offsets[1], w, h);

					/*
						Mark the canvas as ready in the same way that the scale functions  
						(scaleInOne or scaleInChunks) do.
					*/
					canvas.complete = true;

				}
				
				/* END SCALE */


				/*
					Run the callback function if the canvas was not scaled on the worker
					thread (or not scaled at all).
				*/
				if(canvas.complete){

					this.canvasDone(crop, canvas);

				}

			}

			/* END CROP AND SCALE */

		} catch(e){

			this.canvasFail(canvas);

			this.triggerClose();

		}

		return canvas;
	
	},

	/* END CREATE FINAL CANVAS */
	/* -------------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */
	/*
		Return true if the browser supports the features required to scale a canvas, else
		return false.
	*/
	isAPISupported: function(){
		
		var canvas = document.createElement("canvas");
		
		return Boolean(

			window.UInt8Array && canvas.getContext && canvas.getContext("2d")

		)
		
	}

	/* -------------------------------------------------------------------------------- */

}

/* ------------------------------------------------------------------------------------ */




/* ------------------------------------------------------------------------------------ */
/*
	Manage file uploads to the ImageEditor.

	@param context: Register all input[type=file] elements found within this element.
	@param submit: Callback function executed when the file is submitted from ImageEditor.
	@param constraints: Optional setting object. See configure().
	@param aspect_ratio: Optional aspect ratio for ImageEditor. Defaults to 1:1.
	@param capture: Optional boolean - If true enable media capture.

*/
function FileUpload(context, submit, constraints, aspect_ratio, capture){

	if( this.isAPISupported() ){


		this.polyfillers();

		this.configure(constraints);


		this.resetValues();

		/* Input elements container - Set before calling register() or unregister() */
		this.context = context;	

		/* Register all input[type=file] element within the context */
		this.register();


		/* Initialise the ImageEditor class */
		this.Editor = new ImageEditor(aspect_ratio);
		this.Editor.registerClose( this.close.bind(this) );
		this.Editor.registerSubmit( submit );


		if(capture === true){

			try{

				/* Initialuse the MediaCapture class */

				capture = new MediaCapture();
				capture.registerOpen( this.openCapture.bind(this) );
				capture.registerCloseHandler( this.closeCapture.bind(this) );

				this.Capture = capture;

			} catch(e){

				/* Media capture not supported */

			}

		}
	
	} else{

		Ulo.Ulo.messages("We do not support your browser \
			for file uploads. Upgrade to the latest version to continue.");

	}

}

FileUpload.prototype = {

	constructor: FileUpload,
	
	/* -------------------------------------------------------------------------------- */
	/*
		Register all input[type=file] element within the context.
	*/
	register: function(){

		$("input[type=file]", this.context).on("change", {self: this}, this.upload);

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Unregister all input[type=file] element within the context.
	*/
	unregister: function(){

		$("input[type=file]", this.context).off("change", this.upload);

	},

	/* -------------------------------------------------------------------------------- */

	resetValues: function(){

		/* Number of files waiting to be loaded into ImageEditor. */
		this.pending = 0;

		/* Current file type ("image" or "video") */
		this.file_type = null;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Set the validation property values.

		@param constraints: Object used to override the default settings.

			{
				image: { 

					count: N (where N is max number of files), 
					size: N (where N is the max size in bytes)

				},

				video: {

					Same as above.

				},

			}
	*/
	configure: function(constraints){

		var image = constraints.image || {};

		var video = constraints.video || {};


		this.max_files = {

			"image": image.count || 1,
			"video": video.count || 0

		};


		this.max_size = {

			/* 
				MUST MATCH THE FILE UPLOAD HANDLERS SERVER SIDE.
				See class MediaUploadHandler - __init__() 
			*/
			"image": image.size || 10485760,
			"video": video.size || 73400320

		};


		this.mime_types = [

			/*
				MUST MATCH THE FILE UPLOAD HANDLERS SERVER SIDE.
				See class MediaUploadHandler - validate_type() 
			*/
			/^(image)\/(?:gif|jpeg|pjpeg|png|tiff)/,
			/^(video)\/(?:mp4|ogg|webm)/

		];

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Reset the file uploading process.
	*/
	close: function(){

		this.Editor.close();

		if(this.Capture){

			this.Capture.close();

		}

		this.resetValues();

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Terminate the class.
	*/
	terminate: function(){

		this.Editor.terminate();

		if(this.Capture){

			this.Capture.terminate();

		}

		this.resetValues();

		this.unregister();

	},




	/* -------------------------------------------------------------------------------- */
	/*
		Return the name of the file type ("image" or "video") if the uploaded file is
		a supported type. Else return null.

		@param file: File instance.
	*/
	getFileType: function(file){
		
		var results = null;

		for(var i=0; i<this.mime_types.length; ++i){

			results = file.type.match( this.mime_types[i] );

			if(results !== null){
			
				return results[1];
			
			}
		
		}

		return results;
	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return true if the file is valid and false if not. Display an error message to 
		the user when returning false to inform them of any issues.

		@param file: File instance or Canvas element (canvases must be given a size 
			property before being passed to the function. See closeCapture()).
		@param type: file type ("image", "video" or null).
	*/
	isValid: function(file, type){

		var is_valid = false;

		var count = this.Editor.count();

		/*
			If there are no files then assign this.file_type to the type of the current 
			file.
		*/
		if( this.pending===0 && count===0 ){

			this.file_type = type;

		}

		/*
			If the file type is valid ("image" or "video") and the file type is the same 
			as the files currently loaded or loading then proceed to validate the file.
		*/
		if( type !== null && type === this.file_type ){

			/*
				If the current file count exceeds the maximum for this file type, display 
				a message to the user.
			*/
			if( (this.max_files[type] - this.pending - count) <= 0 ){

				var max = this.max_files[type];

				Ulo.messages(

					"You can upload a maximum of " + max + " " + type + 
					(max===1 ? "." : "s."), false, true	

				);

			}

			/*
				If the file size exceeds the maximum size for this file type, display a 
				message to the user.
			*/
			else if( file.size > this.max_size[type] ){

				var name = type==="image" ? "an image" : "a video";

				Ulo.messages(

					"Please upload " + name + " less than " +
					this.formatBytes(this.max_size[type]) + "."

				);

			}

			/*
				Else the file is valid.
			*/
			else{

				is_valid = true;

			}

		}

		return is_valid;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Perform basic file validation before setting event handlers to process the files.
	*/
	upload: function(e){

		var self = e.data.self;

		if(this.files){

			for(var i=0, args, type; i<this.files.length; ++i){

				/* Returns "image", "video" or null */

				type = self.getFileType( this.files[i] );



				if( self.isValid( this.files[i], type ) ){

					/* Build an array of arguments for the upload handlers */

					args = type==="image" ? 

						["img", "load"] 
						
						:

						["video", "loadeddata"];

					args.push( this.files[i] );


					/* Blob URL */

					if(window.URL){

						self.ObjectURL.apply(self, args);

					}


					/* Data URL */

					else if (window.FileReader && type !== "video"){

						self.dataURL.apply(self, args);	

					}


					/* Not supported */

					else{

						var name = this.files[i].name;

						Ulo.messages(

							"Sorry, we cannot load the file" + 
							(name ? " "+name : "") + ".", false, true

						);

					}

				}

			}

		}

		this.value = null;

	},




	/* -------------------------------------------------------------------------------- */
	/*
		Create an object url for the file. If an error is raised the file is most likely
		not of the expected type.

		@param tag: Element tag ("img" or "video").
		@param evt: Load event name for the file type.
		@param file: Original file instance.
	*/
	ObjectURL: function(tag, evt, file){

		var element = document.createElement( tag );

		element.file = file;

		$(element).on(evt, {self: this}, this.objectLoad);

		$(element).on("error", {self: this}, this.objectError);

		element.src = window.URL.createObjectURL( file );

		++this.pending;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Create a data url for the file. If an error is raised the file is most likely
		not of the expected type.

		@param tag: Element tag ("img" or "video").
		@param evt: Load event name for the file type.
		@param file: Original file instance.
	*/
	dataURL: function(tag, evt, file){

		var reader = new FileReader();
		
		$(reader).on("load", {self: this, tag: tag, evt: evt, file: file}, this.dataResult);

		$(reader).on("error", {self: this}, this.dataError);
		
		reader.readAsDataURL(file);

		++this.pending;

	},




	/* -------------------------------------------------------------------------------- */
	/*
		Base function for all load events. Decrement the pending counter and turn off all
		events set on the element before opening the file in the editor.
		
		@param e: Event.
		@param loadHandler: Name of the load handler.
		@param errorHandler: Name of the error handler.
	*/
	baseLoad: function(e, loadHandler, errorHandler){

		--this.pending;

		$(e.target).off(e.type, this[loadHandler]);

		$(e.target).off("error", this[errorHandler]);

		this.Editor.open(e.target, this.max_files[this.file_type]);

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Base function for all error events. Decrement the pending counter and turn off all
		events set on the element before displaying an error message to the user.
		
		@param e: Event.
		@param loadHandler: Name of the load handler.
		@param errorHandler: Name of the error handler.
	*/
	baseError: function(e){

		--this.pending;

		$(e.target).off();


		/* Create a string of all file type names separated by "or" */

		var files = "";

		for(var n in this.max_files){

			if(this.max_files[n] > 0){

				files += " " + n + " or";

			}
			
		}

		Ulo.messages("Please upload a supported" + files.slice(0, -3) + " file.");

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Object url onload handler.
	*/
	objectLoad: function(e){

		if(e.target.nodeName === "IMG"){

			window.URL.revokeObjectURL(e.target.src);

		}

		e.data.self.baseLoad(e, "objectLoad", "objectError");

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Object url onerror handler.
	*/
	objectError: function(e){

		window.URL.revokeObjectURL(e.target.src);

		e.data.self.baseError(e);
	
	},


	/* -------------------------------------------------------------------------------- */
	/*
		Data url results handler.
	*/
	dataResult: function(e){

		var self = e.data.self;

		$(e.target).off();

		var element = document.createElement( e.data.tag );

		element.file = e.data.file;

		$(element).on(e.data.evt, {self: self}, self.dataLoad);

		$(element).on("error", {self: self}, self.dataError);

		element.src = e.target.result;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Data url onload handler.
	*/
	dataLoad: function(e){

		e.data.self.baseLoad(e, "dataLoad", "dataError");

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Data url onerror handler.
	*/
	dataError: function(e){

		e.data.self.baseError(e);
	
	},




	/* -------------------------------------------------------------------------------- */
	/*
		Capture open() callback function.

		Hide the editor window before opening the capture window.
	*/
	openCapture: function(){

		this.Editor.hide();

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Capture close() callback function. 

		Validate the canvas before opening it in the editor.
	*/
	closeCapture: function(canvas){

		/* The canvas will be retuned only if an image was taken by the user */

		if(canvas){

			canvas.size = canvas.getContext("2d")

				.getImageData(0, 0, canvas.width, canvas.height).data.length;


			if( this.isValid(canvas, "image") ){

				this.Editor.open(canvas, this.max_files[this.file_type]);

				return true;

			}

		}


		/* Always display the editor if it contains elements */

		if(this.Editor.count() !== 0){

			this.Editor.show();

		}

	},





	/* -------------------------------------------------------------------------------- */
	/*
		Return bytes as a human readable string.

		@param bytes: int
		@param precision: Optional precision value.
	*/
	formatBytes: function(bytes, precision){

		precision = precision || 0;
		var kb = 1024;
		var mb = kb * 1024;
		var gb = mb * 1024;

		if ((bytes >= 0) && (bytes < kb)) {

			return bytes + " B";
		
		} else if ((bytes >= kb) && (bytes < mb)) {
		
			return (bytes / kb).toFixed(precision) + " KB";

		} else if ((bytes >= mb) && (bytes < gb)) {
		
			return (bytes / mb).toFixed(precision) + " MB";

		} else{
		
			return (bytes / gb).toFixed(precision) + " GB";
		}

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Poly fillers.
	*/
	polyfillers: function(){

		/* https://developer.mozilla.org/en-US/docs/Web/API/Window/URL */

		window.URL = window.URL || window.webkitURL;


		/* https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob */
		
		if (!HTMLCanvasElement.prototype.toBlob) {
			
			Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
			
				value: function (callback, type, quality) {

					var binStr = atob( this.toDataURL(type, quality).split(",")[1] ),
					len = binStr.length,
					arr = new Uint8Array(len);

					for (var i=0; i<len; i++ ) {
			
						arr[i] = binStr.charCodeAt(i);
			
					}

					return callback( new Blob( [arr], {type: type || "image/png"} ) );
			
				}
			
			});
		
		}

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return true if the browser has full support for all features required to process
		a file, else return false.
	*/
	isAPISupported: function(){
		
		var canvas = document.createElement("canvas");
		
		return Boolean(
 				
			window.File && window.FileList && window.Blob && window.Uint8Array && 
			window.FormData && (window.URL || window.webkitURL || window.FileReader) && 
			window.atob && canvas.getContext && canvas.getContext("2d")

		) && this.isFileInputSupported()
	
	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return true if the browser supports input[type=file], else return false.

		https://github.com/Modernizr/Modernizr/blob/master/feature-detects/forms/fileinput.js
	*/
	isFileInputSupported: function() {
		
		if (navigator.userAgent.match(/(Android (1.0|1.1|1.5|1.6|2.0|2.1))|(Windows Phone (OS 7|8.0))|(XBLWP)|(ZuneWP)|(w(eb)?OSBrowser)|(webOS)|(Kindle\/(1.0|2.0|2.5|3.0))/)) {
		
			return false;
		
		}
		
		var input = document.createElement("input");
		
		input.type = "file";
		
		return !input.disabled;
	
	},

}

/* ------------------------------------------------------------------------------------ */




/* ------------------------------------------------------------------------------------ */
/*
	Enable the user to take a picture using their webcam.
*/
function MediaCapture(){

	this.polyfillers();

	this.registerOpen(this.open);

}

MediaCapture.prototype = {

	constructor: MediaCapture,

	/* -------------------------------------------------------------------------------- */
	/*
		Enable the taking and saving of a photo.
	*/
	register: function(){

		$(Ulo.removeClass(this.getPhoto(), "disabled"))
			.on(Ulo.evts.click, {self: this}, this.photo);
		
		$(Ulo.removeClass(this.getSave(), "disabled"))
			.on(Ulo.evts.click, {self: this}, this.save);

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Disable the taking and saving of a photo.
	*/
	unregister: function(){

		$(Ulo.addClass(this.getPhoto(), "disabled"))
			.off(Ulo.evts.click, this.photo);

		$(Ulo.addClass(this.getSave(), "disabled"))
			.off(Ulo.evts.click, this.save);

	},
	
	/* -------------------------------------------------------------------------------- */
	/*
		Register an event handler on all open media capture buttons.
	*/
	registerOpen: function(handler){

		$("button.media_capture").on(Ulo.evts.click, {self: this}, handler);

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Register a function that is called each time the capture window is close. The
		function is passed the canvas element containing the photo taken by the user or 
		undefined.
	*/
	registerCloseHandler: function(callback){

		this.callback = callback;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return the capture window container.
	*/
	getContainer: function(){

		return Ulo.get("capture_container");

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return the video/canvas element container.
	*/
	getContent: function(){

		return Ulo.get("capture_body");

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return the close button.
	*/
	getClose: function(){

		return Ulo.get("capture_close");

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return the take photo button.
	*/
	getPhoto: function(){

		return Ulo.get("capture_photo");

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return the save photo button.
	*/
	getSave: function(){

		return Ulo.get("capture_save");

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Set the button text og the take photo button.

		@param text: string.
	*/
	photoText: function(text){

		Ulo.empty(this.getPhoto()).appendChild(document.createTextNode(text));

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Show the capture window.
	*/
	show: function(){

		Ulo.removeClass(this.getContainer(), Ulo.cls.hide);
		Ulo.addClass(document.body, "capture_"+Ulo.cls.modal_open);

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Hide the capture window.
	*/
	hide: function(){

		Ulo.addClass(this.getContainer(), Ulo.cls.hide);
		Ulo.removeClass(document.body, "capture_"+Ulo.cls.modal_open);

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Video onload event handler.
	*/
	objectLoad: function(e){
		
		var self = e.data.self;

		self.register();

		$(e.target).off();

		Ulo.empty(self.getContent()).appendChild( e.target );
	
	},

	/* -------------------------------------------------------------------------------- */
	/*
		Stop all running tracks.
	*/
	stopTracks: function(){

		if(this.stream && this.stream.active){

			var tracks = this.stream.getTracks();
			
			for(var i=0; i<tracks.length; i++){
				
				if(tracks[i].stop){

					tracks[i].stop();
				
				}
				
			}

			this.stream = null;
		}

	},




	/* -------------------------------------------------------------------------------- */
	/*
		Open the capture window.
	*/
	open: function(e){

		var self = e.data.self;


		/* Create a stream */

		navigator.mediaDevices.getUserMedia({
				
				video: { width: 1280, height: 720, facingMode: "environment" },
				
				audio: false
			
			})
				
			/* Success callback */
			.then( function(s){

				self.stream = s;

				self.video = Ulo.create("video", {"autoplay": "autoplay"});

				$(self.video).on("loadedmetadata", {self: self}, self.objectLoad);

				$(self.video).on("error", {self: self}, self._close);

				self.video.src = window.URL.createObjectURL(s);

			})
			
			/* Error callback - Do not use .catch with IE8 */
			["catch"](function(e){

				if(e.name === "SecurityError"){
			
					/* User did not allow access */
				
				} else if(e.name === "NotFoundError"){
				
					/* No media types were found for those specified in the constraints */
					Ulo.messages("We could not find your camera.");
				
				} else{
					
					/* Unknown error */
				
				}

				self.close();

			});


		/* Register the close capture button */

		$(self.getClose()).on(Ulo.evts.click, {self: self}, self._close);


		/*
			If the browser has native support the user must explicitly give access to 
			their camera so display a message requesting access.
		*/

		if(self.fullSupport===true){

			self.getContent().appendChild(

				document.createTextNode("Can we use your camera?")

			);

		}


		/* Reset the take photo button text */

		self.photoText("Take photo");


		self.show();

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Close the capture window.
	*/
	close: function(canvas){

		this.hide();


		$(this.getClose()).off(Ulo.evts.click, this._close);

		/* Unregister take photo and save photo */
		
		this.unregister();


		if(this.video){

			$(this.video).off();

			window.URL.revokeObjectURL(this.video.src);

		}

		this.stopTracks();


		clearInterval(this.interval);

		Ulo.empty(this.getContent());
		

		/* Return the canvas to the callback */

		if(this.callback){

			this.callback(canvas);

		}

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Event handler for close();
	*/
	_close: function(e){

		e.data.self.close();

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Terminate the class.
	*/
	terminate: function(){

		/* Call close() before setting callback to null */
		this.close();

		this.callback = null;

		$("button.media_capture").off(Ulo.evts.click);

	},




	/* -------------------------------------------------------------------------------- */
	/*
		Mimic taking a photo by pausing the video feed.
	*/
	photo: function(e){

		var self = e.data.self;

		if(self.video.paused){

			self.photoText("Take photo");

			self.video.play();

		} else{

			self.unregister();

			var countdown = self.getContent().appendChild(

				Ulo.create("span", {"class": "countdown"}, 3)

			);

			var property = countdown.textContent ? "textContent" : "innerHTML";

			self.interval = setInterval(function(){

				var value = parseInt(countdown[property]) - 1;

				if(value === 0){

					self.video.pause();

					Ulo.remove(countdown);

					clearInterval(self.interval);

					self.photoText("Retake photo");

					self.register();


				} else{

					countdown[property] = value;

				}

			}, 1000);

		}

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Render the current frame into a canvas and close the editor.
	*/
	save: function(e){

		var self = e.data.self;

		var canvas = undefined;

		if(self.video && self.video.paused){

			canvas = Ulo.create("canvas");

			canvas.width = self.video.videoWidth;
			
			canvas.height = self.video.videoHeight;
			
			canvas.getContext("2d").drawImage(self.video, 0, 0);

		}
		
		self.close(canvas);

	},




	/* -------------------------------------------------------------------------------- */

	polyfillers: function(){

		window.URL = window.URL || window.webkitURL;

		/* 
		*/
		if(!window.URL) {
			
			new Error('Object URLs are not supported by this browser')
			
		}

		/* https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia */
		/* 
			If the browser does not support mediaDevices at all set an empty object 
			first.
		*/
		if(navigator.mediaDevices === undefined) {
		
			navigator.mediaDevices = {};
		
		}
		
		/* 
			If the browser does not support getUserMedia for mediaDevices then add the
			property.
		*/
		if(navigator.mediaDevices.getUserMedia === undefined) {
			
			navigator.mediaDevices.getUserMedia = function(constraints) {

				/* Get the deprecated version of getUserMedia if available */
				var getUserMedia =	navigator.getUserMedia || navigator.webkitGetUserMedia ||
					navigator.mozGetUserMedia || navigator.msGetUserMedia;
				
				/* 
					If not supported by the browser return a rejected promise with an error
					to keep a consistent interface.
				*/
				if(!getUserMedia) {
					
					return Promise.reject(
					
						new Error('getUserMedia is not implemented in this browser')
					
					);
				
				}

				/*
					Otherwise, wrap the call to the old navigator.getUserMedia with a 
					promise.
				*/
				return new Promise(function(resolve, reject) {
				
					getUserMedia.call(navigator, constraints, resolve, reject);
				
				});

			};
		
		} else{

			/* The browser supports navigator.mediaDevices.getUserMedia natively. */
			this.fullSupport = true;
		
		}
	},

}

/* ------------------------------------------------------------------------------------ */



