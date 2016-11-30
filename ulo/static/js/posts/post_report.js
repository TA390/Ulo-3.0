/* Post Report Javascript File */
/* Dependencies: jQuery, Base.js */


/* ------------------------------------------------------------------------------------ */
(function () {
"use strict";


/* ------------------------------------------------------------------------------------ */
	
	function PostReport(page_id, ul_id){

		Ulo.checkDependencies("Session", "Pip");

		this.page_id = page_id;

		this.ul_id = ul_id;

		this.setSubmitDisabled(true);

		this.register();	

	}
	PostReport.prototype = {

		constructor: PostReport,

		/* ---------------------------------------------------------------------------- */
		/*
			Register all event handlers.
		*/
		register: function(){
			
			$(this.getForm()).on("submit", {self: this}, this.submit);

			/* Detect when a radio button has been selected */
			$(Ulo.get(this.ul_id)).on("change", {self: this}, this.enableSubmit);
		
		},
		
		/* ---------------------------------------------------------------------------- */
		/*
			Unregister all event handlers.
		*/
		unregister: function(){
			
			$(this.getForm()).off("submit", this.submit);

			$(Ulo.get(this.ul_id)).off("change", this.enableSubmit);
		
		},
		
		/* ---------------------------------------------------------------------------- */
		/* 
			Return the report form.
		*/
		getForm: function(){

			return Ulo.get(this.page_id + "_form");
		
		},
		
		/* ---------------------------------------------------------------------------- */
		/*
			Disable the form's submission button.
		*/
		setSubmitDisabled: function(disable){
		
			var submit = Ulo.get(this.page_id + "_submit");

			if(submit !== null){

				submit.disabled = disable;

				(disable ? Ulo.addClass : Ulo.removeClass)(submit, Ulo.cls.disabled);

			}
		
		},
		
		/* ---------------------------------------------------------------------------- */
		/*
			Enable the form's submission button.
		*/
		enableSubmit: function(e){

			e.data.self.setSubmitDisabled(false);
			
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
			Return the form's error container.

			@param form: form.
		*/
		getNonField: function(form){

			var id = form.id + "_errors", 

			container = Ulo.get(id);


			if(container===null){

				container = Ulo.create("div", {"id": id, "class": "form_errors"});
				
				form.parentNode.insertBefore(container, form);

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
			
			this.removeText(Ulo.get(this.page_id));

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
			Handle form submissions.
		*/
		submit: function(e){

			e.preventDefault();

			var self = e.data.self, 

			form = this;


			if(Ulo.requestAvailable() && Ulo.hasClass(Ulo.get(self.page_id), Ulo.cls.hide)===false){

				Ulo.request({

						type: "POST",
						url: form.getAttribute("action"),
						data: $(form).serialize()
					
					})

					/* Params: server data, status code, xhr */
					.done(function(data, sc, xhr){

						/* 
							Render the report complete page or the login form.
						*/
						if(data.html && Ulo.Pip.isPip(form)){

							Ulo.Pip.displayPage(xhr, "post_report_complete");

						}

						/* 
							Else redirect to the report complete page.
						*/
						else{

							Ulo.replacePage(data.url);

						}
					
					})

					/* Params: xhr, status code, error type */
					.fail(function(xhr){

						if(Ulo.Session.hasExpired(xhr)){

							self.setSubmitDisabled(true);
							
							self.unregister();
							
						}

						self.addServerErrors(form, xhr);

				});

			}

		},

	}

	/* DOCUMENT READY FUNCTION */
	/* ------------------------------------------------------------------------------------ */

	$(function(){

		new PostReport("post_report", "issue");

	});

/* ------------------------------------------------------------------------------------ */
}());