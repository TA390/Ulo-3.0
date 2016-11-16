/* Sign Up Form javascript file */
/* Dependencies: jQuery, base.js */


/* ------------------------------------------------------------------------------------ */
(function(){

"use strict";


	/* -------------------------------------------------------------------------------- */
	/*
		Current Password Validation.
	*/
	function SignUp(){

		/* Run the base class constructor first */

		var form = Ulo.Temp.Validation.apply(this, arguments);


		/* Date of birth validation */

		this.dob_checked = 0;

		this.dob = [Ulo.get("dob_day"), Ulo.get("dob_month"), Ulo.get("dob_year")];

		this.setValidator(this.dob[0].name, this.validateDOB);
		this.setValidator(this.dob[1].name, this.validateDOB);
		this.setValidator(this.dob[2].name, this.validateDOB);

		/* END Date of birth validation */


		/* Username availability check. */

		this.setValidator("username", this.usernameAvailable);


		this.register(form);

	}

	/* -------------------------------------------------------------------------------- */

	SignUp.prototype = Ulo.inherit(Ulo.Temp.Validation.prototype);

	/* -------------------------------------------------------------------------------- */

	SignUp.prototype.constructor = SignUp;

	/* -------------------------------------------------------------------------------- */
	/*
		Return true if the form should be submitted via an ajax request should be made 
		and false if not.
	*/
	SignUp.prototype.ajaxRequest = function(){
			
		return true;

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return the field's container.

		@param name: Field name.
	*/
	SignUp.prototype.getField = function(name){

		if(/^dob/.test(name)){

			name = "dob";

		}

		return Ulo.Temp.Validation.prototype.getField.call(this, name);

	},

	/* -------------------------------------------------------------------------------- */
	/*
		Return true if the username field is valid/available and false if not.

		@param target: Form field.
		@param is_valid: True if the field is valid and false if not.
		@param is_evt: True if the function has been called inside an event handler and
			false if not.
	*/
	SignUp.prototype.usernameAvailable = function(target, is_valid, is_evt){

		if(is_evt){

			removeClass(target.parentNode, target.availability);

		} else if(is_valid){

			is_valid = target.availability==="available";

			this.addText(this.getField(target.name), "This username has been taken.");

		}

		/* Make a request to check the availability of the username */
		this.isAvailable(

			target,

			"/user/available/" + target.value + "/",
			
			is_valid && is_evt,
			
			function(target, available){

				target.availability = available ? "available" : "unavailable";
				addClass(target.parentNode, target.availability)

			}

		)

		return is_valid;

	}

	/* -------------------------------------------------------------------------------- */
	/*
		Return the user's age.

		@param date: Today's date.
		@param dob: User's date of birth.
	*/
	SignUp.prototype.getAge = function(date, dob){

		var age = date.getFullYear() - dob.getFullYear();
				
		var month = date.getMonth() - dob.getMonth();
		
		if(month < 0 || (month === 0 && date.getDate() < dob.getDate())){ 
			
			--age; 
		
		}

		return age;

	}

	/* -------------------------------------------------------------------------------- */
	/*
		Return true if the user's date of birth is a valid date and gte the minimum age 
		requirement, else return false.

		@param target: Form field.
		@param is_valid: True if the field is valid and false if not.
		@param is_evt: True if the function has been called inside an event handler and
			false if not.
	*/
	SignUp.prototype.validateDOB = function(target, is_valid, is_evt){

		/* Check all date of birth fields (day, month, year) */
		if(this.dob_checked === 0){

			var error = null,
			
			container = this.getField(target.name);


			/* Remove the current errors / help text */
			this.removeText(container);
			

			for(var i=0; i<this.dob.length; ++i){

				if(this.dob[i].value==="0"){

					/*
						Display an error only if the function has been called from the
						submit handler.
					*/
					if(is_evt === false){

						error = "Please enter your date of birth.";

					} else{

						error = []

					}

					break;

				}

			}

			
			if(error === null){

				var min_age = 13,
				
				date = new Date(),
				
				month = this.dob[1].value-1,
				
				dob = new Date(this.dob[2].value, month, this.dob[0].value);


				/* Check the date. */
				if(dob.getMonth() !== month){

					error = "Please enter a valid date.";
				
				}

				/* Check the age. */
				if(this.getAge(date, dob) < min_age){

					error = "Sorry, we require all our users to be at least " + 
						min_age + " years old.";

				}

			}

			/* Add any error messages to the field */
			if(error !== null){

				this.addText(container, error);

				is_valid = false;

			}

		}

		/*
			Increment the counter to prevent the function from running multiple times when 
			called from the submit handler.
		*/
		if(is_evt===false){

			this.dob_checked = (this.dob_checked+1) % 3;

		}

		return is_valid;

	}

	/* DOCUMENT READY FUNCTION */
	/* ------------------------------------------------------------------------------------ */
	$(function(){
	
		try{
			
			if(Ulo.checkTempDependencies(true, "Validation")){
				
				new SignUp(

					"signup_form", 
					"signup_submit",
					"signup_{field_name}_container"

				);
			
			}

		} catch(e){

			debug(e);
		
		}

	});

/* ------------------------------------------------------------------------------------ */

}());

