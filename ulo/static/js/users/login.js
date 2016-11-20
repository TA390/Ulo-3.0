/* Sign Up Form javascript file */
/* Dependencies: jQuery, base.js */


/* ------------------------------------------------------------------------------------ */
(function(){

"use strict";


	/* -------------------------------------------------------------------------------- */
	/*
		Current Password Validation.
	*/
	function LogIn(){

		/* Run the base class constructor first */

		var form = Ulo.Temp.Validation.apply(this, arguments);

	}

	/* -------------------------------------------------------------------------------- */

	LogIn.prototype = Ulo.inherit(Ulo.Temp.Validation.prototype);

	/* -------------------------------------------------------------------------------- */

	LogIn.prototype.constructor = LogIn;

	/* -------------------------------------------------------------------------------- */

	LogIn.prototype.redirect = function(){

		return true;

	};

	/* -------------------------------------------------------------------------------- */

	LogIn.prototype.validateForm = function(form, verbose){

		var is_valid = Ulo.Temp.Validation.prototype.validateForm.call(this, form, false);

		if(is_valid === false){

			var self = this;

			self.loadingAnimation(true);

			setTimeout(function(){
							
				self.removeText(form);

				self.addText(

					self.getNonField(form),

					"The email address and password do not match."

				);
				
				self.loadingAnimation(false);

			}, 500);

		}

		return is_valid

	};

	/* DOCUMENT READY FUNCTION */
	/* ------------------------------------------------------------------------------------ */
	$(function(){
	
		try{
			
			if(Ulo.checkTempDependencies(true, "Validation")){
				
				new LogIn(

					"login_form", 
					"login_submit",
					"login_{field_name}_container"

				);
			
			}

		} catch(e){

			debug(e);
		
		}

	});

/* ------------------------------------------------------------------------------------ */

}());

