/*
	Login form javascript file

	Dependencies: JQuery, Base.js

*/

/* ------------------------------------------------------------------------------------ */

(function(){

"use strict";

	/*

	*/	
	function Login(){

		Ulo.checkDependencies("Content", "Session", "Pip");


		/* Field validation */

		var not_empty = /^(?![\s]*$)/;

		this.validators = {

			"login_email": {
					
				regexp: [
				
					not_empty,
					/^(?=.{3,255}$)[^@\s]+@[^@\s\.]+(\.[^@\s\.]+)+$/
				
				],
			
			},
			
			"login_password": {
				
				regexp: [
				
					not_empty,
					/^.{6,}$/,
					/^.{0,128}$/,
					/^(?![a-zA-Z]+$)/,
					/^(?!\d+$)/,
					/^(?!(.)\1+$|password(?:\d{0,2}|(\d)\2{1,})$)/
				
				],
			
			},
				
		}


		$(Ulo.get("login_form")).on("submit", {self: this}, this.submit);

	}

	Login.prototype = {

		constructor: Login,

		/* ---------------------------------------------------------------------------- */
		/*

		*/
		setSubmitDisabled: function(disable){
		
			var submit = Ulo.get("login_submit");
			
			if(submit !== null){

				submit.disabled = disable;

				(disable ? Ulo.addClass : Ulo.removeClass)(submit, Ulo.cls.disabled);

			}
		
		},

		/* ---------------------------------------------------------------------------- */
		/*
			
		*/
		clearPassword: function(){

			var password = Ulo.get("login_password");

			if(password !== null){

				password.value = ""; 

			}
		
		},
		/* ---------------------------------------------------------------------------- */
		/*

		*/
		setPipRedirect: function(form){

			if(Ulo.Pip.isPip(form)){

				var redirect = Ulo.get("login_redirect_to");

				if(redirect !== null){

					redirect.value = Ulo.getURL();

				}
			
			}
		
		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return the field's error container.

			@param name: field name.
		*/
		getField: function(name){

			return Ulo.get("login_" + name + "_container");

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
						
						n==="__all__" ? this.getNonField(form) : this.getField(n),
						xhr.responseJSON.errors[n]

					);

				}

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Run all regex validators on the form fields and return true if all succeed
			and false if not. Display an error message if it fails.
		*/
		isValid: function(form){

			for(var id in this.validators){


				var value = Ulo.get(id).value,
				
				regexp = this.validators[id].regexp;


				for(var i in regexp){

					if(regexp[i].test(value) === false){

						var self = this;

						setTimeout(function(){
							
							self.removeText(form);

							self.addText(

								self.getNonField(form),
								"The email address and password do not match."

							);
							
							self.setSubmitDisabled(false);

						}, 500)
						
						return false;

					}
				}
			}

			return true;
		},
		/* ---------------------------------------------------------------------------- */
		/*
			Submit the form and redirect the page if successful or display an error 
			message back to the user.
		*/
		submit: function(e){

			e.preventDefault();

			var self = e.data.self, 

			form = this;


			if(Ulo.requestAvailable()){


				self.setSubmitDisabled(true);


				if(self.isValid(form)){

					self.setPipRedirect(this);

					Ulo.request({

							type: "POST",
							url: this.getAttribute("action"),
							data: $(this).serialize(),
							cache:false
						
						})
						
						/* Params: server data, status code, xhr */
						.done(function(data, sc, xhr){

							if(data.html && Ulo.Pip.isPip(form) && Ulo.checkDependencies(true, "Page")){

								Ulo.Content.removeFiles(Ulo.get("login"));
								
								Ulo.Content.change(Ulo.getMain(), xhr, true)

									.done(function(){

										Ulo.Page.updateHistory(data.url);

										Ulo.Pip.close();

									})

									.fail(function(){

										Ulo.replacePage(data.url);

								});

							} else{

								Ulo.replacePage(data.url);

							}					

						})

						/* Params: xhr, status code, error type */
						.fail(function(xhr){

							/*
								If the login redirect produces a 404 refresh the page as 
								the user will have been logged in.
							*/
							if(Ulo.Pip.isPip(form) && xhr.status === 404){

								/* Refresh the page */
								Ulo.replacePage();

							} else{

								self.clearPassword();

								var expired = Ulo.Session.hasExpired(xhr);

								self.setSubmitDisabled(expired);

								if(expired){

									self.addText(

										self.getNonField(form), 
										"Your session has expired. Refresh the page and try again."

									)

								} else{

									self.addServerErrors(form, xhr);

								}

								

								

							}
							
					});

				}
			}
		}
	}


	/* DOCUMENT READY FUNCTION */
	/* -------------------------------------------------------------------------------- */
	$(function(){
		try{

			new Login();

		} catch(e){

			debug(e);
		
		}
	});

/* ------------------------------------------------------------------------------------ */
}());

