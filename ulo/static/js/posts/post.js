/*

	Post javascript file
	
	Dependencies: JQuery, Base.js

*/




/* ------------------------------------------------------------------------------------ */

(function(){

"use strict";


	/* -------------------------------------------------------------------------------- */
	/*
		Upload content.
	*/
	function PostForm(){

		/* Post form */
		
		var form = Ulo.get("post_form");

		/* Register post form submission */
		
		$(form).on("submit", {self: this}, this.submit);


		/* Title validation */

		this.registerText(Ulo.get("title"));


		/* Options drop down menus */

		var buttons = $("div.button", form);

		for(var i=0; i<buttons.length; ++i){

			this.registerOption(buttons[i]);

			$(buttons[i]).on(Ulo.evts.click, {self: this}, this.setColourPicker);

		}

		this.colourInput = Ulo.create("input", {"type": "color"});


		/* Settings drop down menus */

		var buttons = Ulo.get("settings").getElementsByTagName("button");

		for(var i=0; i<buttons.length; ++i){

			Ulo.menus(buttons[i], "height", "open", false, this.select.bind(this));

		}

		
		/* Toggle settings */

		$(Ulo.get("toggle_settings")).on(Ulo.evts.click, this.toggleSettings);

		/* Toggle extra option */

		$(Ulo.get("add_option")).on(Ulo.evts.click, this.toggleOption);

		Ulo.get("toggle_option1").disabled = true;


		/* Initialise file upload class */

		this.FileUpload = new FileUpload(

			Ulo.get("post"), /* Context */

			this.saveCanvas.bind(this), /* Submit handler */

			{ "image": { count: 0 }, "video": { count: 1 } }, /* Constraints */

			{ width: 16, height: 9}, /* Aspect ratio */

			false /* Media capture */

		);


	}

	PostForm.prototype = {

		constructor: PostForm,

		/* ---------------------------------------------------------------------------- */
		/*
			Register text validation on "field".

			@param field: Text input element.
		*/
		registerText: function(field){

			var event = Ulo.isEventSupported("input") ? "input" : "change";
		
			$(field).on(event, {self: this}, this._validateText);
		
		},

		/* ---------------------------------------------------------------------------- */
		/*
			Register / unregister toggling of the option menu.

			@param add: Element to attach menu toggling to.
			@param remove: Optional element to remove menu toggling from.
		*/
		registerOption: function(add, remove){

			Ulo.menus(add, "height", "open", false, this.selectOption.bind(this));

			if(remove){

				Ulo.menus(remove);

			}
		
		},

		/* ---------------------------------------------------------------------------- */
		/*
			Base select function called by select(), selectOption(), selectIcon(). Return
			the selected menu element or null if no selection was made.

			@params *: See Menu class callback function.
		*/
		_select: function(isClosed, button, menu, target){

			/*
				Add or remove the class "menu_open" from the button that toggles the 
				menu.
			*/

			(isClosed ? Ulo.removeClass : Ulo.addClass)(button, "menu_open");


			/* Change the button's arrow icon depending on the state of the menu */

			var arrow = button.querySelector(".arrow > span");

			if(arrow !== null){

				arrow.className = "icon icon_" + (isClosed ? "down" : "up") + "_arrow";

			}


			/*
				If a new menu element was selected, make it the current selection and
				return the element.
			*/
			if(isClosed && Ulo.isDescendant(menu, target, 6)){

				while(target.nodeName !== "LI"){

					target = target.parentNode;

				}


				var selected = menu.querySelector("li.selected");


				if(selected !== target){

					Ulo.removeClass(selected, "selected");

					Ulo.addClass(target, "selected");

					return target;

				}

			}


			/* Else return null */

			return null;

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Set the selected menu element.

			@params *: See Menu class callback function.
		*/
		select: function(isClosed, button, menu, target){

			/* Get the element selected or null */

			target = this._select.apply(this, arguments);


			if(target !== null){

				/* Clone the target element's child nodes into the button */

				button = button.querySelector(".content");

				Ulo.append(Ulo.empty(button), target.childNodes, true);

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Set the selected menu element for the options menus.

			@params *: See Menu class callback function.
		*/
		selectOption: function(isClosed, button, menu, target){

			/* Get the button that toggles the menu. (This can change. See below). */

			button = Ulo.get("toggle_" + menu.id);

			/* Get the option selected or null */

			target = this._select(isClosed, button, menu, target);


			if(target !== null){


				/* Clone the content of the selected element into the button */

				var elements = [".content", ".option"];

				for(var i=0, node; i<elements.length; ++i){

					Ulo.replace(

						target.querySelector(elements[i]).cloneNode(true),

						button.querySelector(elements[i])

					);

				}


				/* If the user selected the text option... */

				var input = button.querySelector("input.text");

				if(input !== null){

					/* Set up the input element */

					input.focus();

					input.required = true;

					this.registerText(input);


					/* Set up the icon menu toggle button */

					var icon = button.querySelector("button.toggle_icons");

					Ulo.menus(icon, "height", "open", false, this.selectIcon.bind(this));

					menu = Ulo.get(icon.getAttribute("data-toggle"));

					this.selectIcon(true, icon, menu, menu.querySelector(".default"));


					/* Toggle the menu using the arrow element only */

					this.registerOption(button.querySelector(".arrow"), button);


				} else{

					/* Toggle the menu using the dedicated button element. */

					this.registerOption(button, button.querySelector(".arrow"));

				}

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Set the selected menu element for the options menus.

			@params *: See Menu class callback function.
		*/
		selectIcon: function(isClosed, button, menu, target){

			/* Get the icon selected or null */

			target = this._select.apply(this, arguments);


			if(target !== null){

				/* Remove the current icon */

				Ulo.empty(button);

				/* Check if the selected icon is the colour input */

				var is_colour_picker = Ulo.hasClass(target, "picker");


				/*
					Set up the colour input element.
				*/
				if(is_colour_picker){

					/* Add a colour element to the button */

					target = Ulo.create("span", {"class": "colour picker"});

					Ulo.append(button, [target], false);


					/* Mimic the event object for setColourPicker */

					var event = {

						data: {

							self: this,

							target: target

						},

						currentTarget: button

					};

					/*
						Register the input element to change the colour of the new 
						element.
					*/
					this.setColourPicker(event);

				}

				/*
					Add the selected icon to the button.
				*/
				else{

					Ulo.append(button, target.childNodes, true);

				}

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return the background colour of "element" as a hexidecimal value.

			@param element: Node element.
		*/
		rgbToHex: function(element){

			var colour = element.style.backgroundColor;

			if(!colour ||  /^rgb/.test(colour) === false){
				
				return colour;
				
			}

			else{
				
				colour = colour.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);
				
				function hex(x){
						
					return ("0" + parseInt(x).toString(16)).slice(-2);
					
				}
					
				return "#" + hex(colour[1]) + hex(colour[2]) + hex(colour[3]); 

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Change event handler for an input[type=color] element. Update the background 
			colour of the element e.data.target.
		*/
		setColour: function(e){

			e.data.target.style.backgroundColor = e.target.value;
			
		},

		/* ---------------------------------------------------------------------------- */
		/*
			Register the input[type=color] change event handler on the colour picker
			element found within the target element.
		*/
		setColourPicker: function(e){

			var colour = e.currentTarget.querySelector("span.picker");


			if(colour !== null){

				var self = e.data.self;

				e.data.target = colour;


				$(self.colourInput)

					.off("change", self.setColour)

					.on("change", e.data, self.setColour)

					.trigger(Ulo.evts.click);


				if(!colour.style.backgroundColor){

					colour.style.backgroundColor = "#A7CBD5";				

				}

				self.colourInput.value = self.rgbToHex(colour);

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Toggle the display of the settings.
		*/
		toggleSettings: function(e){

			Ulo.toggleClass(Ulo.get("settings"), Ulo.cls.hide);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Toggle the display of the extra option ("option1").
		*/
		toggleOption: function(e){

			var disabled = Ulo.toggleClass(Ulo.get("option1_container"), Ulo.cls.hide);

			Ulo.toggleClass(e.currentTarget, "remove");

			var option = Ulo.get("toggle_option1");

			option.disabled = disabled;

			Ulo.empty(e.currentTarget);

			e.currentTarget.appendChild(

				document.createTextNode(disabled ? "+ Add option" : "- Remove option")

			);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return true if the form is valid and false if not.

			@param form: Post form.
		*/
		validateForm: function(form){

			var is_valid = true,

			inputs = $("input[type='text']", form);


			/* Validate the text input fields */

			for(var i=0; i<inputs.length; ++i){

				if(this.validateText(inputs[i]) === false){

					is_valid = false;

				}

			}


			/* Validate the file upload field */

			if(Boolean(this.files) === false){

				var container = this.getFileField();

				this.removeText(container);

				this.addText(container, "Please upload a video.");

				is_valid = false;

			}

			return is_valid;

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return true if the text input field has a value and false if not.

			@param input: input[type='text'].
		*/
		validateText: function(input){

			var container = this.getField(input.name);

			if(container !== null){

				this.removeText(container);

				if(input.required && /^\s*$/.test(input.value)){

					console.log(container);

					this.addText(container, "This field is required.");

					return false;

				}

			}

			return true;

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Event handler for validateText().
		*/
		_validateText: function(e){

			e.data.self.validateText(e.currentTarget);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Create the upload loading bar element.
		*/
		createLoader: function(){

			var loader = Ulo.create("div", {"class": "loading hide"});


			var data = loader.appendChild(Ulo.create("div", {"class": "data"}));

			data.appendChild(Ulo.create("span", {"class": "bar outer"}))

				.appendChild(Ulo.create("span", {"class": "bar inner"}));

			data.appendChild(Ulo.create("span", {"class": "percent"}));


			this.getFileField().appendChild(loader);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Update the loading bar element.
		*/
		setLoader: function(value){

			var bar = this.getFileField(".inner");

			var percent = this.getFileField(".percent");

			bar.style.width = value;

			Ulo.empty(percent).appendChild(document.createTextNode(value));

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Toggle the display of the loading bar element and the animation set on the 
			submit button.

			@param start: True if called before submission and false if called after.
		*/
		animateLoader: function(start){

			var loader = this.getFileField(".loading");

			(start ? Ulo.removeClass : Ulo.addClass)(loader, Ulo.cls.hide);

			if(start){

				this.setLoader("0%");

			}

			Ulo.Animate.pulse(Ulo.get("post_submit"), start);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return the field's error container.

			@param name: field name.
		*/
		getField: function(name){

			return Ulo.get(name + "_container");

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return the file field container or an element within the file container.

			@param selector: Optional element selector.
		*/
		getFileField: function(selector){

			return Ulo.get("file_container", selector);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return the form's error container.

			@param form: form.
		*/
		getNonField: function(form){

			var id = form.id + "_errors",
			
			container = Ulo.get(id);


			if(container === null){

				container = Ulo.create("div", {"id": id, "class": "form_errors"});
				
				form.insertBefore(container, form.firstChild);

			}

			return container;
		
		},

		/* ---------------------------------------------------------------------------- */
		/*
			Remove all messages.

			@param context: Option context to narrow the scope.
		*/
		removeText: function(context){

			$("p.validation", context).remove();

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Add all messages.

			@param container: Container to add messages to.
			@param messages: String or array of strings.
			@param cls: Optional class set on the <p> element - defaults to "error".
		*/
		addText: function(container, messages, cls){

			if(container !== null){

				if(Array.isArray(messages) === false){

					messages = [messages];

				}

				for(var i=0; i<messages.length; ++i){

					if(messages[i]){

						container.insertBefore( 

							Ulo.create("p", {

								"class": "validation " + (cls===undefined ? "error" : cls)

							}, messages[i]),

							container.firstChild

						);

					}

				}

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Add all server error messages to the form.

			@param form: Form.
			@param xhr: XMLHttpRequest.
		*/
		addServerErrors: function(form, xhr){
			
			this.removeText(form);

			if(xhr.responseJSON !== undefined && xhr.responseJSON.errors !== undefined){

				for(var n in xhr.responseJSON.errors){

					this.addText(

						n==="__all__" ? this.getNonField(form) : this.getField(n),

						xhr.responseJSON.errors[n][0]

					);

				}

			}
			
		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return a FormData instance containing all form field values.
		*/
		serialise: function(form){

			var data = new FormData();


			/* CSRF token */

			var token = Ulo.Session.getToken(form);

			data.append(token.name, token.value);


			/* Text fields */

			var fields = [Ulo.get("title"), Ulo.get("description")];

			for(var i=0; i<fields.length; ++i){

				data.append(fields[i].name, fields[i].value); 

			}


			/* Menu fields */

			fields = [Ulo.get("category"), Ulo.get("comment_settings")];

			for(var i=0, selected; i<fields.length; ++i){

				selected = fields[i].querySelector("li.selected");

				data.append(

					fields[i].getAttribute("name"), 

					selected.getAttribute("value")

				);

			}


			/* Option fields */

			fields = [Ulo.get("toggle_option0"), Ulo.get("toggle_option1")];

			for(var i=0, menu, button; i<fields.length; ++i){

				if(fields[i].disabled !== true){

					button = fields[i];

					menu = Ulo.get(button.getAttribute("data-toggle"));


					var name = menu.getAttribute("name");

					var selected = menu.querySelector("li.selected");


					/* Option type id value */

					var type = selected.getAttribute("data-type");

					data.append(name+"-type", type || "");


					/* Option text value */

					var text = button.querySelector(".text");

					text = text.value || text.textContent || text.innerHTML || "";

					data.append(name+"-text", text);


					/* Option icon class */

					var icon = button.querySelector(".font_icon");

					if(icon){

						icon = icon.className.match(/icon_\w+/)[0] || "";

						data.append(name+"-icon", icon);

					}

					/* Option colour value */

					var colour = button.querySelector(".colour");

					if(colour){

						data.append(name+"-colour", this.rgbToHex(colour) || "");

					}


				}

			}


			/* File fields. */

			for(var key in this.files){

				data.append(key, this.files[key]);

			}
			

			return data;

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Function called when the user uploads a file.
		*/
		saveCanvas: function(){

			/* 
				Min and max multipliers (aspect ratio 4:3).

				Min (image and video):
					
					32 will output a min width or height of 128px (32 X 4) which is the 
					same min value used by the Editor's isValid function for both images 
					and videos.

				Max (image):

					512 will ensure that all images are lte 2048px (512 X 4) in any
					dimension.

				Max (video):

					150 will ensure that all video posters are lte 600px (150 X 4) in any
					dimension.
			*/

			var max = this.FileUpload.file_type === "video" ? 150 : 512;

			var canvas = this.FileUpload.Editor.getCanvas(true, 32, max);


			if(canvas !== null){

				this.FileUpload.terminate();

				/* Replace the contents of the file container with the canvas */

				var container = this.getFileField();

				Ulo.empty(container).appendChild(canvas);


				/* Add animation over the canvas while it is being processed */

				var animation = Ulo.create("div", {"class": "animation"});

				var bounce = animation.appendChild(Ulo.create("div", {"class": "bounce"}));

				bounce.appendChild(Ulo.create("div", {"class": "one"}));

				bounce.appendChild(Ulo.create("div", {"class": "two"}));

				bounce.appendChild(Ulo.create("div", {"class": "three"}));

				container.appendChild(animation);


				/* Set an interval that checks when the canvas is ready. */

				this.canvasReady(canvas);


				/* Add a progress bar to the form */

				this.createLoader();

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Periodically check to see if the canvas has finished processing. Define the 
			class variable "files" containing all file fields.

			@param canvas: Canvas returned from the editor.
		*/
		canvasReady: function(canvas){

			var self = this;

			var interval = setInterval(function(e){


				if(canvas.failed){

					clearInterval(interval);

					Ulo.messages(

						"Sorry, it looks like we failed to create your post. Please try again later.", 
						true

					);

				}


				/* If the canvas has no more files pending... */
				else if(canvas.pending === 0){

					clearInterval(interval);

					/* Convert the canvas image to a blob */
					canvas.toBlob(function(blob){
						
						/* 
							If the file is a video the canvas image is its thumbnail and
							the video file is set on the canvas as the property video.
							See ImageEditor.videoToCanvas() in upload.js.
						*/
						if(canvas.videos){

							var video = canvas.videos[0];

							self.files = {

								"file": video.file,

								"thumbnail": blob,

								"duration": video.duration,

								"thumbnail_time": video.currentTime

							};

							self.path = "video/";

							canvas.videos = null;

							URL.revokeObjectURL(video.src);

						}

						/*
							Else blob is the image file and the thumbnail for images are
							created server side.
						*/
						else{
						
							self.files = {

								"file": blob

							};

							self.path = "image/";
						
						}

						Ulo.remove(self.getFileField(".animation"));


					}, 'image/jpeg', 95);

				}

			}, 800);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Upload progress bar.
		*/
		upload: function(){

			var xhr = $.ajaxSettings.xhr();

			if(xhr.upload){

				var self = this;

				xhr.upload.addEventListener("progress", function(e){

					if(e.lengthComputable){

						self.setLoader(Math.ceil((e.loaded / e.total) * 100) + "%");
					
					}

				}, false);

			}

			return xhr;

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Form submit handler.
		*/
		submit: function(e){

			try{

				e.preventDefault();

				var self = e.data.self, 

				form = e.currentTarget;


				// var formData = self.serialise(form);
				// var iter = formData.entries();
				// var en;
				// while( (en = iter.next().value) ){
				// 	console.log(en);
				// }


				if(Ulo.requestAvailable() && self.validateForm(form)){


					Ulo.acquireRequest();
					
					
					self.animateLoader(true);


					setTimeout(function(){

						/* Send the form data for server side validation */
						Ulo.request({

								type: "POST",
								xhr: self.upload.bind(self),
								data: self.serialise(form),
								cache: false,
								processData: false,
								contentType: false,
								url: form.getAttribute("action") + self.path

							})

							.done(function(data, sc, xhr){

								Ulo.replacePage(data.url || "/");

							})
						
							.fail(function(xhr){

								self.addServerErrors(form, xhr);			
						
							})

							.always(function(xhr){

								self.animateLoader(false);
						
						});

					}, 500);

				}

			} catch(e){

				Ulo.messages(

					"Sorry, it looks like we failed to create your post. Please try again."

				);

			}

		}

		/* ---------------------------------------------------------------------------- */

	}

	/* -------------------------------------------------------------------------------- */




	/* DOCUMENT READY FUNCTION */
	/* -------------------------------------------------------------------------------- */
	
	$(function(){
	
		try{
			
			new PostForm();

		} catch(e){

			debug(e);
		
		}

	});

/* ------------------------------------------------------------------------------------ */

}());

