/* Post Detail Page Javascript File */
/* Dependencies: JQuery, Base.js, Users.js */


/* ------------------------------------------------------------------------------------ */

(function () {
"use strict";

	/* -------------------------------------------------------------------------------- */
	/*
		Settings tabs.
	*/
	function SettingTabs(){

		this.cls = "selected";

		var tabs = Ulo.get("tabs").getElementsByTagName("a");

		/* Set this.active_tab */
		for(var i=0; i<tabs.length; ++i){

			if(Ulo.hasClass(tabs[i], this.cls)){

				this.active_tab = tabs[i];

				this.validation(tabs[i]);
				
				break;

			}

		}

		if(this.active_tab !== undefined){

			$(tabs).on(Ulo.evts.click, {self: this}, this.selectTab);

		}

	}

	SettingTabs.prototype = {

		constructor: SettingTabs,

		/* ---------------------------------------------------------------------------- */
		/*
			Return the ID of the tab's container.
		
			@param tab: anchor element.
		*/
		getContainerID: function(tab){

			return tab.id+"_tab";
		
		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return the tab's content container.
		
			@param tab: anchor element.
		*/
		getContainer: function(tab){
		
			return Ulo.get(this.getContainerID(tab));
		
		},

		/* ---------------------------------------------------------------------------- */
		/*
			Create a new instance of the tab's validation class or reset the existing
			class. Set the instance as a variable on the tab (tab.Validation).
			
			@param tab: anchor element.
			@param container: tab's content container.
		*/
		validation: function(tab, container){

			if(tab.Validation !== undefined){

				tab.Validation.reset(container);

			} else{

				if(tab.id==="account_settings"){
					
					tab.Validation = new AccountSetting(

						"account_form", 
						"account_submit",
						"account_{field_name}_container"

					);

				}

				else if(tab.id==="password_settings"){

					tab.Validation = new PasswordSetting(

						"password_form", 
						"password_submit"

					); 
					
				}

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Switch the current tab's content with the selected tab's content.
			
			@param tab: anchor element.
			@param container: tab's content container.
		*/
		changeTab: function(tab, container){

			/* Hide the current tab's content */
			Ulo.addClass(this.getContainer(this.active_tab), Ulo.cls.hide);
			Ulo.removeClass(this.active_tab, this.cls);

			/* Display the selected tab's content */
			Ulo.removeClass(container, Ulo.cls.hide);
			this.active_tab = Ulo.addClass(tab, this.cls);

			/* Update the url */
			if(Ulo.Page !== undefined){

				Ulo.Page.updateHistory(tab.getAttribute("href"));

			}

			/* Set or reset the validation class */
			this.validation(tab, container);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Event handler to select a new tab.
		*/
		selectTab: function(e){

			var self = e.data.self;

			if(e.currentTarget !== self.active_tab){

				var container = self.getContainer(e.currentTarget);

				/* Make an ajax request for the tab's content. */
				if(container===null){

					if(Ulo.checkDependencies(true, "Page")){

						self.getContent(e.currentTarget);

					}

					else{

						/* 
							Prevent the function from triggering e.preventDefault if
							the url cannot be updated.
						*/
						return true;

					}
				
				}

				/* Switch the current tab content for the selected tab content */
				else{

					self.changeTab(e.currentTarget, container);

				}

			}

			e.preventDefault();

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Request the tab's content.		
	
			@param tab: anchor element.
		*/
		getContent: function(tab){

			var self=this;

			if(Ulo.requestAvailable()){

				Ulo.request({

						type: "GET", 
						url: tab.getAttribute("href")

					})

					/* Params: server data, status code, xhr */
					.done(function(data, sc, xhr){

						var container = Ulo.getFragment(

							Ulo.createFragment(data.html),
							self.getContainerID(tab)

						);

						Ulo.addClass(container, Ulo.cls.hide);
						
						Ulo.get("tab_content").appendChild(container);

						self.changeTab(tab, container);

				});
			
			}

		}

	}

	/* -------------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */
	/*
		Account settings form.
	*/
	function AccountSetting(){

		/* Run the base class constructor first */
		var form = Ulo.Temp.Validation.apply(this, arguments);

		/* Customise the validators */
		this.setValidator("username", this.usernameAvailable);
		this.currentPasswordValidator();
		this.register(form);

		/* Run after this.register is called */
		this.storeState(form);

	}

	/* -------------------------------------------------------------------------------- */

	AccountSetting.prototype = Ulo.inherit(Ulo.Temp.Validation.prototype);

	/* -------------------------------------------------------------------------------- */

	AccountSetting.prototype.constructor = AccountSetting;

	/* -------------------------------------------------------------------------------- */
	/*
		Store the new form field values after a successful submission.
	*/
	AccountSetting.prototype.done = function(form, data, xhr){

		if(data.html===undefined){

			this.storeState(form);

		}

		if(Ulo.EmailConfirmation){

			 var email = this.getField("email");

			 if(email){

			 	Ulo.EmailConfirmation.update(email.value);

			 }

		}

		Ulo.Temp.Validation.prototype.done.call(this, form, data, xhr);

	}

	/* -------------------------------------------------------------------------------- */
	/*
		Enable the submit button if the only form error is due to the current password 
		field.
	*/
	AccountSetting.prototype.fail = function(form, xhr){

		Ulo.Temp.Validation.prototype.fail.call(this, form, xhr);

		if(xhr.responseJSON !== undefined && xhr.responseJSON.errors !== undefined){

			for(var n in xhr.responseJSON.errors){

				if(n !== "password"){

					return true;

				}

			}

		}
			
		this.setSubmitDisabled(false);
	
	}

	/* -------------------------------------------------------------------------------- */
	/*
		Return all input fields (excluding the hidden and password fields).

		@param context: context to narrow the scope.
	*/
	AccountSetting.prototype.getInputs = function(context){

		return $("input[type='text'], input[type='email']", context);

	}

	/* -------------------------------------------------------------------------------- */
	/*
		Reset the form to its original state.

		@param context: context to narrow the scope for getInputs().
	*/
	AccountSetting.prototype.reset = function(context){

		var inputs = this.getInputs(context);

		for(var i=0; i<inputs.length; ++i){

			inputs[i].value = inputs[i].initial;

		}

		this.clearPasswords();
		this.removeText(context);

	}

	/* -------------------------------------------------------------------------------- */
	/*
		Validation.validator callback function. Check if the username is available.

		@param target: form field.
		@param is_valid: boolean - true if the field value is valid.
		@param is_evt: boolean - true if the function is called by an event.
	*/
	AccountSetting.prototype.usernameAvailable = function(target, is_valid, is_evt){

		this.isAvailable(

			target,

			"/user/available/" + target.value + "/",
			
			is_valid && is_evt && target.regexp.test(target.value)===false,
			
			function(target, available){

				var text = available ? "available" : "unavailable";
				
				this.addText(this.getField(target.name), Ulo.capitalise(text), text);

			}

		)

		return is_valid;

	}

	/* -------------------------------------------------------------------------------- */
	/*
		Store the current state of the form and attach an event handler to monitor 
		changes.

		@param context: context to narrow the scope for getInputs() and removeText().
	*/
	AccountSetting.prototype.storeState = function(context){

		var inputs = this.getInputs(context);

		for(var i=0, flag; i<inputs.length; ++i){

			/* Store the current value */
			inputs[i].initial = inputs[i].value;

			/* Store a regular expression to test for value changes at runtime */
			inputs[i].regexp = new RegExp(

				"(^|^\\s+)"+inputs[i].value+"(\\s+$|$)", 
				inputs[i].id==="account_name" ? undefined : "i"

			);

			/* Boolean - has the field changed */
			inputs[i].changed = false;

			/* If this is the first time calling the function set event handlers */
			if(this.changed===undefined){

				$(inputs[i]).on(this.evt, {self: this}, this.enableSubmitHandler);

			}

		}

		/* Counter - number of fields changed */
		this.changed=0;
		
		this.removeText(context);

		this.setSubmitDisabled(true);

	}

	/* -------------------------------------------------------------------------------- */
	/*
		Return true if the form has changed and false if not.

		@param target: form field.
	*/
	AccountSetting.prototype.formChanged = function(target){

		/* Check if the input field has changed */
		var changed = target.regexp.test(target.value)===false;

		/* Update the counter if the state of the field has changed */
		if(changed !== target.changed){

			this.changed = this.changed + (changed ? 1 : -1);

		}

		/* Set the state of this field */
		target.changed=changed;

		/* Return true if any form field has changed */
		return this.changed!==0;

	}

	/* -------------------------------------------------------------------------------- */
	/*
		Enable the form's submit button if the form has changed.
	*/
	AccountSetting.prototype.enableSubmitHandler = function(e){

		var self = e.data.self;

		self.setSubmitDisabled( !self.formChanged(e.currentTarget) );

	}

	/* -------------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */
	/*
		Password settings form.
	*/
	function PasswordSetting(){


		var form = Ulo.Temp.Validation.apply(this, arguments);
		
		this.validators["new_password"] = this.copy("password");
		this.setValidator("new_password", this.matchPasswords);
		
		this.setValidator("verify_password", this.matchPasswords);

		this.currentPasswordValidator();
		
		this.register(form);
	
	}
	
	/* -------------------------------------------------------------------------------- */

	PasswordSetting.prototype = Ulo.inherit(Ulo.Temp.Validation.prototype);

	/* -------------------------------------------------------------------------------- */

	PasswordSetting.prototype.constructor = PasswordSetting;

	/* -------------------------------------------------------------------------------- */
	/*
		Enable the submit button after each submission.
	*/
	PasswordSetting.prototype.always = function(form, xhr){

		Ulo.Temp.Validation.prototype.always.call(this, form, xhr);
		this.setSubmitDisabled(false);

	}

	/* -------------------------------------------------------------------------------- */
	/*
		Reset the form to its original state.

		@param context: context to narrow the scope for removeText().
	*/
	PasswordSetting.prototype.reset = function(context){

		this.removeText(context);
		this.clearPasswords();

	}

	/* ---------------------------------------------------------------------------- */
	/*
		Return a copy of a validator.

		@param name: field name.
	*/
	PasswordSetting.prototype.copy = function(name){

		var copy={}, validator=this.validators[name];

		if(validator!==undefined){

			for(var i in validator){

				copy[i]=Array.isArray(validator[i]) ? validator[i].slice(0) : validator[i];

			}

		}

		return copy;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Validation.validator callback function. Check that the password fields match.

		@param target: form field.
		@param is_valid: boolean - true if the field value is valid.
		@param is_evt: boolean - true if the function is called by an event.
	*/
	PasswordSetting.prototype.matchPasswords = function(target, is_valid, is_evt){

		if(is_valid){

			var vpw = Ulo.get("verify_password");

			if(this.not_empty.test(vpw.value)){

				var container = this.getField(vpw.name),
				
				npw = Ulo.get("new_password")

				this.removeText(container);

				/* Check that the new_password and verify_password values are equal */
				is_valid = new RegExp("(^|^\\s+)"+npw.value+"(\\s+$|$)", "i").test(vpw.value);

				if(is_valid===false){

					this.addText(

						container, 
						this.validators["verify_password"].default_error

					);

				}

			}

		}

		return is_valid;

	}

	/* -------------------------------------------------------------------------------- 



	/* -------------------------------------------------------------------------------- */
	/* DOCUMENT READY FUNCTION */
	/* -------------------------------------------------------------------------------- */

	$(function(){

		if(Ulo.checkTempDependencies(true, "Validation")){

			new SettingTabs();

		}

	});

	/* -------------------------------------------------------------------------------- */

}());



