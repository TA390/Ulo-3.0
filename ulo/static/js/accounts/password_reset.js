/* Post Report Javascript File */
/* Dependencies: jQuery, Base.js */


/* ------------------------------------------------------------------------------------ */

(function () {
"use strict";

	
	/* -------------------------------------------------------------------------------- */
	/*
		Current Password Validation.
	*/
	function PasswordReset(){

		/* Run the base class constructor first */
		var form = Ulo.TEMP.Validation.apply(this, arguments);

		this.setValidator("password", this.matchPasswords);
		
		this.setValidator("verify_password", this.matchPasswords);

		this.register(form);

	}

	/* -------------------------------------------------------------------------------- */

	PasswordReset.prototype = inherit(Ulo.TEMP.Validation.prototype);

	/* -------------------------------------------------------------------------------- */

	PasswordReset.prototype.constructor = PasswordReset;

	/* -------------------------------------------------------------------------------- */
	/*
		Prevent the form from making an ajax submission.
	*/
	PasswordReset.prototype.ajaxRequest = function(){

		return false;

	}

	/* -------------------------------------------------------------------------------- */
	/*
		Validation.validator callback function. Check that the password fields match.

		@param target: form field.
		@param is_valid: boolean - true if the field value is valid.
		@param is_evt: boolean - true if the function is called by an event.
	*/
	PasswordReset.prototype.matchPasswords = function(target, is_valid, is_evt){

		if(is_valid){

			var vpw = getElement("verify_password");

			if(this.not_empty.test(vpw.value)){

				var container = this.getField(vpw.name),
				npw = getElement("password");

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

	/* -------------------------------------------------------------------------------- */

	
	/* DOCUMENT READY FUNCTION */
	/* -------------------------------------------------------------------------------- */

	$(function(){

		if(Ulo.checkTempDependencies(true, "Validation")){

			new PasswordReset(

				"password_reset_form", 
				"password_reset_submit"

			);

		}

	});

/* ------------------------------------------------------------------------------------ */
}());