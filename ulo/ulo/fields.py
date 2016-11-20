# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals
from datetime import date
import re

# Core django imports
from django.conf import settings
from django.contrib.auth.forms import  ReadOnlyPasswordHashWidget
from django.contrib.auth.password_validation import (
	validate_password, CommonPasswordValidator
)
from django.core.exceptions import ValidationError
from django.forms import BooleanField, CharField, DateField, FileField, PasswordInput
from django.utils.translation import ugettext_lazy as _

# Thrid party app imports

# Project imports
from .widgets import UloDOBWidget, UloPIPWidget

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class UloPIPField(BooleanField):
	"""
	Hidden boolean field that is added to forms that can be rendered and executed from 
	within another page. The field does not render an id attribute if one is not passed 
	to the function as a kwarg.
	"""

	def __init__(self, *args, **kwargs):

		kwargs.update({'initial': False, 'required': False})
		
		self.widget = UloPIPWidget(attrs={'id': kwargs.pop('id', None)})
		
		super(UloPIPField, self).__init__(*args, **kwargs)

# ----------------------------------------------------------------------------------------

class UloDOBField(DateField):
	"""
	Date of birth field that splits the DateField into individual select fields (day, 
	month and year) and checks that age is above 'min_age'.
	"""

	def __init__(self, *args, **kwargs):
		
		error_messages = {

			'invalid': _('Please enter a valid date.'),
		
			'age_restriction': _(
		
				'Sorry, we require all our users to be at least %(age)s years old.'
		
			),
		
		}
		
		if 'error_messages' in kwargs:
			
			kwargs['error_messages'].update(error_messages)
		
		else:
			
			kwargs['error_messages'] = error_messages

		# Minimum age of a user.
		self.min_age = kwargs.pop('min_age', 0)

		# Set UloDOBWidget as the default.
		self.widget = kwargs.pop('widget', UloDOBWidget)(min_age=self.min_age)
		
		super(UloDOBField, self).__init__(*args, **kwargs)


	def validate_age(self, dob):

		if dob != None and self.min_age:
		
			today = date.today()
		
			age = today.year - dob.year - (
		
				(today.month, today.day) < (dob.month, dob.day)
		
			)
		
			if age < self.min_age:
		
				raise ValidationError(
		
					self.error_messages['age_restriction'],
					code='age_restriction',
					params={'age': self.min_age}
		
				)
		
		return dob


	def clean(self, dob):
		"""
		
		UloDOBWidget returns a list for invalid dates and a string for valid dates.
		
		"""

		# Run the base class clean method - may raise ValidationError
		dob  = super(UloDOBField, self).clean( dob )

		# Verify the user's age before returning the dob.
		return self.validate_age(dob)

# ----------------------------------------------------------------------------------------

class PasswordField(CharField):

	description = _('A password field with built in security checks.')
	

	def __init__(self, max_length=128, min_length=6, widget=PasswordInput, *args, **kwargs):

		kwargs['widget'] = widget
		
		error_messages = {
			
			'min_length': _('Your password must be at least %(min)s characters long.') \
				%({'min': min_length}),
		
			'max_length': _('Your password cannot be more than %(max)s characters long.') \
				%({'max': max_length}),
		
			'alpha': _('Your password cannot contain letters only.'),
		
			'numeric': _('Your password cannot contain numbers only.'),
		
			'security': _('Please choose a more secure password.'),
		
		}
		
		if 'error_messages' in kwargs:
		
			kwargs['error_messages'].update(error_messages)
		
		else:
		
			kwargs['error_messages'] = error_messages


		super(PasswordField, self).__init__(

			max_length=max_length, 
			min_length=min_length,
			*args, 
			**kwargs,

		)


	def clean(self, value):
		
		# Get the password value entered by the user
		value  = super(PasswordField, self).clean(value)
		
		# If the field is empty and required is False, return the empty value
		if not value and self.required == False:
		
			return value
		
		# Validate the password against a file of common alpha numeric passwords using
		# django's CommonPasswordValidator.
		validator = CommonPasswordValidator(
		
			password_list_path=settings.COMMON_PASSWORDS_FILE
		
		)
		
		validate_password(value, password_validators=(validator,))
		
		# Run addition validation checks on the password before returning its value
		self.password_validation(value)

		return value


	def password_validation(self, password):
		
		# Convert the password to lowercase
		password_lower = password.lower()

		try:
		
			# Must not consist of only letters or only numbers 
			self.letters_and_numbers(password_lower)
		
			# Password cannot start with password followed by a digit
			self.simple_password(password_lower)
		
			# Must not contain a common keyboard pattern
			self.keyboard_pattern(password_lower)

		except ValidationError as error:
			
			raise ValidationError(
			
				self.error_messages[error.message], code=error.message
			
			)

	# INTERNAL HELPERS
	# ------------------------------------------------------------------------------------
	
	def letters_and_numbers(self, password):
		
		# Password cannot consist of letters only
		all_letters = re.compile(r'[^\W\d_]+$', re.U)
		
		if re.match(all_letters, password):
		
			raise ValidationError('alpha')
		

		# Password cannot consist of numbers only
		all_numbers = re.compile(r'\d+$', re.U)
		
		if re.match(all_numbers, password):
		
			raise ValidationError('numeric')


	def simple_password(self, password):
		
		# Password cannot be 'password' followed by one, two or the same digit
		password_prefix = r'^password(?:\d{0,2}|(\d)\1+)$'
		
		# A password consisting of one character only cannot be used
		single_char = r'^(.)\1+$'

		if re.match(password_prefix, password) or re.match(single_char, password):
			
			raise ValidationError('security')


	def keyboard_pattern(self, password):

		common_keyboard_patterns = (

			'1q2w3e4r5t6y7u8i9o0p',
			'0p9o8i7u6y5t4r3e2w1q',
			'q1w2e3r4t5y6u7i8o9p0',
			'p0o9i8u7y6t5r4e3w2q1',
			'1qaz2wsx3edc4rfv5tgb6yhn7ujm8ik9ol0p',

		)

		# Password cannot be a substring of a common keyboard pattern
		substring = re.compile(r'.*'+re.escape(password)+r'.*', re.U|re.L)

		for pattern in common_keyboard_patterns:

			if re.match(substring, pattern):

				raise ValidationError('security')

	# END INTERNAL HELPERS
	# ------------------------------------------------------------------------------------

# ----------------------------------------------------------------------------------------

class ReadOnlyPasswordField(PasswordField):
	"""
	See https://github.com/django/django/blob/master/django/contrib/auth/forms.py
	"""
	
	def __init__(self, max_length=128, min_length=6, widget=ReadOnlyPasswordHashWidget, *args, **kwargs):
		
		kwargs.setdefault("required", False)
		
		super(ReadOnlyPasswordField, self).__init__(
			
			max_length=max_length, 
			min_length=min_length,
			*args, 
			**kwargs,
		
		)


	def bound_data(self, data, initial):

		# Always return initial because the widget doesn't
		# render an input field.
		return initial


	def has_changed(self, initial, data):

		return False

# ----------------------------------------------------------------------------------------



