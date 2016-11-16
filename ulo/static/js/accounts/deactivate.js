/* Deactivate Account Javascript File */
/* Dependencies: JQuery, Base.js, Validation.js */


/* ------------------------------------------------------------------------------------ */

(function () {
"use strict";

	
	/* -------------------------------------------------------------------------------- */
	/*
		Current Password Validation.
	*/
	function PasswordValidation(){

		/* Run the base class constructor first */
		var form = Ulo.TEMP.Validation.apply(this, arguments);

		/* Customise the validators */
		this.currentPasswordValidator();

		this.register(form);

	}

	/* -------------------------------------------------------------------------------- */

	PasswordValidation.prototype = inherit(Ulo.TEMP.Validation.prototype);

	/* -------------------------------------------------------------------------------- */

	PasswordValidation.prototype.constructor = PasswordValidation;

	/* -------------------------------------------------------------------------------- */

	
	/* DOCUMENT READY FUNCTION */
	/* -------------------------------------------------------------------------------- */

	$(function(){

		if(Ulo.checkTempDependencies(true, "Validation")){

			new PasswordValidation(

				"deactivate_form", 
				"deactivate_submit",
				"deactivate_{field_name}_container"

			);

		}

	});

/* ------------------------------------------------------------------------------------ */
}());