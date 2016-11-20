/* Post Report Javascript File */
/* Dependencies: jQuery, Base.js */


/* ------------------------------------------------------------------------------------ */

(function () {
"use strict";

	/* -------------------------------------------------------------------------------- */



	/* -------------------------------------------------------------------------------- */
	/*
		Form validation. Return the form.

		@param form_id: form id.
		@param submit_id: submit button id.
		@param format_field_id: format string to derive the field's error container id. 
		@param format_form_id: format string to derive the form's error container id. 
	*/
	function Validation(form_id, submit_id, format_field_id, format_form_id){

		/* FOR TESTING ONLY */
		var required = $("[required]", Ulo.get(form_id)).removeAttr("required");


		/* Regular expression to check that an input field is not empty */
		this.not_empty = /^(?![\s]*$)/;

		/* Submit button id */
		this.submit_id = submit_id;

		/* String format used to derive the form's error container id */
		this.format_form_id = format_form_id || "{form_id}_errors";

		/* String format used to derive a field's error container id */
		this.format_field_id = format_field_id || "{field_name}_container";


		/* Form field validators */
		this.validators = {

			"name": {

				regexp: [
				
					this.not_empty,
					/^.{0,30}$/,
					/^[^<>(){}="`+_?!@#^*\[\]\\\/]*$/					
				
				],

				errors: [
				
					"Please enter your full name.",
					"Your name cannot be more than 30 characters long.",
					"Your name cannot contain special characters."
				
				]

			},
			
			"username": {
				
				regexp: [
				
					this.not_empty,
					/^.{0,30}$/,
					/^\w+$/
				
				],
				
				errors: [
				
					"Please choose a username.",
					"Your username cannot be more than 30 characters long.",
					"Your username can only contain letters, numbers and underscores."
				
				]
			
			},

			"email": {
					
				regexp: [
				
					this.not_empty,
					/^(?=.{3,255}$)[^@\s]+@[^@\s\.]+(\.[^@\s\.]+)+$/
				
				],
				
				errors: [
				
					"Please enter your email address.",
					"Please enter a valid email address."
				
				]
			
			},
			
			"password": {
				
				regexp: [
				
					this.not_empty,
					/^.{6,}$/,
					/^.{0,128}$/,
					/^(?![a-zA-Z]+$)/,
					/^(?!\d+$)/,
					/^(?!(.)\1+$|password(?:\d{0,2}|(\d)\2{1,})$)/
				
				],
				
				errors: [

					"Your password must combine letters, numbers or punctuation.",
					"Your password must be at least 6 characters long.",
					"Your password cannot be more than 128 characters long.",
					"Your password cannot contain letters only.",
					"Your password cannot contain numbers only.",
					"Please choose a more secure password."
				
				]
			
			},

			"verify_password": {

				regexp: [
					
					this.not_empty

				],

				errors: [

					"Re-enter your new password."

				],

				default_error: "Passwords do not match."
				
			}

		}

		/* Set the submit event handler on the form and return the form */
		return $(Ulo.get(form_id)).on("submit", {self: this}, this.submit);

	}

	Validation.prototype = {

		constructor: Validation,

		/* ---------------------------------------------------------------------------- */
		/*
			Enable/disable the submit button.
		*/
		setSubmitDisabled: function(disable){

			var submit = Ulo.get(this.submit_id);

			if(submit !== null){

				var toggle = (disable ? Ulo.addClass : Ulo.removeClass);

				toggle(submit, Ulo.cls.disabled).disabled = disable;

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Start/stop animation.
		*/
		loadingAnimation: function(start){

			Ulo.Animate.pulse(Ulo.get(this.submit_id), start);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Successful submission callback function.

			@param form: form.
			@param data: server data.
			@param xhr: XMLHttpRequest.
		*/
		done: function(form, data, xhr){

			if(this.redirect() === false){

				if(data.html === undefined){

					Ulo.messages(data.messages);

					return true;

				}

				else if(Ulo.checkDependencies(true, "Page", "Content")){

					var main = Ulo.getMain();
					
					Ulo.Content.change(main, xhr, true)

						.always(function(){

							Ulo.Page.updateHistory(data.url);

							Ulo.messages(data.messages);

					});

					return true;

				}

			}

			Ulo.replacePage(data.url);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Unsuccessful submission callback function.

			@param form: form.
			@param xhr: XMLHttpRequest.
		*/
		fail: function(form, xhr){

			this.addServerErrors(form, xhr);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Submission callback function.

			@param form: form.
			@param xhr: XMLHttpRequest.
		*/
		always: function(form, xhr){

			this.clearPasswords(form);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Hook for done(). Return true if the request should be redirected and false if 
			not.
		*/
		redirect: function(){
			
			return false;

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Hook for submit(). The function determines the type of request made. If the
			function returns true an ajax request is made, if false a normal request is
			made.
		*/
		ajaxRequest: function(){
			
			return true;

		},


		/* ---------------------------------------------------------------------------- */
		/*
			Event handler to submit the form if all fields are valid.
		*/
		submit: function(e){

			var self = e.data.self, 

			form = e.currentTarget;


			if(Ulo.requestAvailable() && self.validateForm(form, true)){

				/* 
					Avoid making an ajax request and triggering e.preventDefault() if  
					false.
				*/
				if(self.ajaxRequest() === false){

					return true;

				}


				Ulo.acquireRequest();
				
				
				self.loadingAnimation(true);


				setTimeout(function(){

					/* Send the form data for server side validation */
					Ulo.request({

							type: "POST",
							data: $(form).serialize(),
							url: form.getAttribute("action")

						})

						.done(function(data, sc, xhr){

							self.done(form, data, xhr);

						})
					
						.fail(function(xhr){

							self.fail(form, xhr);			
					
						})

						.always(function(xhr){

							self.loadingAnimation(false);

							self.always(form, xhr);
					
					});

				}, 500);

			}

			e.preventDefault();

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Perform a HEAD request to check the availability of a unique database field.
			E.g. username.

			@param target: Form field.
			@param url: Request URL.
			@param make_request: Boolean - true if the request should be made.
			@param done: Successful request callback function. Function arguments:
				@param target: form field.
				@param available: boolean - true if the data is available.
		*/
		isAvailable: function(target, url, make_request, done){

			/* Set the request information on the target element */
			if(target.request === undefined){

				target.request = {};

			}
			

			/* Abort any pending requests */
			clearTimeout(target.request.timeout);

			target.request.jqxhr && target.request.jqxhr.abort();


			if(make_request){

				var self = this;

				target.request.timeout = setTimeout(function(){

					target.request.jqxhr = $.ajax({
					
							type: "HEAD",
							cache: false,
							url: url
						
						})
						
						.done(function(_, __, xhr){

							done.call(

								self, 
								target, 
								xhr.getResponseHeader("exists")==="False"

							);

						})
						
						.always(function(xhr){
					
							target.request.jqxhr = false;
					
					})


				}, 800);

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Register the validation event handler for each input element listed in the
			validators object.

			@param context: optional context to narrow the scope.
		*/
		register: function(context){

			this.evt = this.evt || Ulo.isEventSupported("input") ? "input" : "change";

			for(var n in this.validators){

				$("input[name='" + n + "'], select[name='" + n + "']", context)

					.on(this.evt, {self: this}, this.validateHandler);

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Set all password fields to an empty string.

			@param context: optional context to narrow the scope.
		*/
		clearPasswords: function(context){

			var pwds = $("input[type='password']", context);

			for(var i=0; i<pwds.length; ++i){

				pwds[i].value = "";

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Convert the password validation errors into current passsword validation
			errors.
		*/
		currentPasswordValidator: function(){

			this.validators.password.errors = [ "Please enter your current password."];
			
			this.validators.password.validator = function(target, is_valid, is_evt){

				if(is_evt===false && is_valid===false && this.not_empty.test(target.value)){

					this.addText(this.getField(target.name), "Password incorrect.");

				}

				return is_valid;

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Set the validator callback function for a given field.

			@param name: field name.
			@param callback: validation function.
		*/
		setValidator: function(name, callback){

			var validation = this.validators[name]

			if(validation === undefined){

				this.validators[name] = { validator: callback };

			} else{

				validation.validator = callback;

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return the field's error container.

			@param name: field name.
		*/
		getField: function(name){

			return Ulo.get( this.format_field_id.replace('{field_name}', name) );

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return the form's error container.

			@param form: form.
			@param create: boolean - if true create the element if it does not exist and
				prepend it to the form.
		*/
		getNonField: function(form, create){

			var id = this.format_form_id.replace('{form_id}', form.id),
			
			container = Ulo.get(id);


			if(container === null){

				container = Ulo.create("div", {"id": id, "class": "form_errors"});
				
				form.insertBefore(container, form.firstChild);

			}

			return container;
		
		},

		/* ---------------------------------------------------------------------------- */
		/*
			Event handler for validate().
		*/
		validateHandler: function(e){

			e.data.self.validate(e.currentTarget, true, true);
			
		},

		/* ---------------------------------------------------------------------------- */
		/*
			Validate the form field and return true if valid and false if not.

			@param target: Form field.
			@param verbose: Boolean - if true add error messages to the field.
			@param is_evt: Boolean - true if the function is triggered by validateHandler
				and false if triggered by validateForm.
		*/
		validate: function(target, verbose, is_evt){

			var is_valid = true, 

			validator = this.validators[target.name];


			if(validator !== undefined){

				if(validator.regexp !== undefined){

					if(verbose){

						this.removeText(this.getField(target.name));

					}

					for(var i=0; i<validator.regexp.length; ++i){

						if(validator.regexp[i].test(target.value) === false){

							is_valid = false;

							if(verbose){

								this.addText(

									this.getField(target.name), 
									validator.errors[i] || validator.default_error

								);

							}
							
							break;

						}

					}

				}

				if(validator.validator !== undefined){

					return validator.validator.call(this, target, is_valid, is_evt);

				}

			}

			return is_valid;

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Validate all form fields and return true if valid and false if not.

			@param form: form.
			@param verbose: boolean - if true add error messages to each field.
		*/
		validateForm: function(form, verbose){

			var is_valid = true,
			
			form_fields = [
			
				form.getElementsByTagName("input"), 
				form.getElementsByTagName("select")
			
			];


			if(verbose){

				/* Remove non field specific form errors */
				var container = this.getNonField(form);
				
				if(container !== null){

					this.removeText(container);

				}

			}


			for(var i=0; i<form_fields.length; ++i){

				for(var j=0; j<form_fields[i].length; ++j){

					if(this.validate(form_fields[i][j], verbose, false) === false){

						is_valid = false;

						if(verbose === false){ 

							return false;

						}

					}

				}

			}


			return is_valid;

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Remove all messages.

			@param context: option context to narrow the scope.
		*/
		removeText: function(context){

			$("p.validation", context).remove();

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Add all messages.

			@param container: container to add messages to.
			@param messages: string or array of strings.
			@param cls: optional class set on the <p> element - defaults to "error".
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
			Add all server error messages.

			@param form: form.
			@param xhr: XMLHttpRequest.
		*/
		addServerErrors: function(form, xhr){
			
			this.removeText(form);

			if(xhr.responseJSON !== undefined && xhr.responseJSON.errors !== undefined){

				for(var n in xhr.responseJSON.errors){

					this.addText(

						n==="__all__" ? this.getNonField(form, true) : this.getField(n),
						xhr.responseJSON.errors[n]

					);

				}

			}
			
		}

		/* ---------------------------------------------------------------------------- */

	}

	/* -------------------------------------------------------------------------------- */

	/************************************************************************************/

	Ulo.refClass(Validation, "Validation", true);

	/************************************************************************************/

}());

