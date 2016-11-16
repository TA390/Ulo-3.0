# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals
import os, re

# Core django imports
from django import forms
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils.crypto import get_random_string
from django.utils.translation import ugettext_lazy as _

# Thrid party app imports

# Project imports
from .search import user_search
from .widgets import ProfileUpdateDOBWidget, SignUpDOBWidget
from emails.emails import reactivation_email, verify_email
from ulo.fields import PasswordField, UloDOBField, UloPIPField
from ulo.formmixins import CleanUsernameMixin
from ulo.forms import UloForm, UloModelForm
from ulo.utils import reserved_usernames

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

USERS_MIN_AGE = 13

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class SignUpForm(CleanUsernameMixin, UloModelForm):

	# Auto generated username.
	generated_username = None

	# Use custom PasswordField for additional validation
	password = PasswordField( label=_('Password'), )
	
	# Use custom Widget to list dates in a drop down select menu
	dob = UloDOBField(

		label=_('Birthday'), 
		localize=True, 
		min_age=USERS_MIN_AGE, 
		widget=SignUpDOBWidget

	)


	class Meta:
		
		model = get_user_model()
		
		fields = ('name', 'email', 'password', 'dob',)
		
		localized_fields = ('dob',)
		
		widgets = {

			'name': forms.TextInput(attrs={'autofocus': 'autofocus'})

		}

		error_messages = {

			'email': {

				'invalid': _('Please enter a valid email address.')

			}

		}


	def __init__(self, *args, **kwargs):
		"""
		
		Set form field attributes.
		
		"""

		kwargs['auto_id'] = 'signup_%s'

		super(SignUpForm, self).__init__(*args, **kwargs)

		for i, field in self.fields.items():
			
			field.widget.attrs.update({

				'placeholder': _(field.label),
				'autocomplete': 'off',
				'class': 'box_border'
			
			})


	def add_account_creation_error(self):

		self.add_error(

			None,
			_('Sorry, it looks like we failed to create your account. Please try again.')

		)


	def is_valid(self):
		"""

		NOTE Delete this function and add 'username' to Meta.fields to have the
		user create their own username when signing up.

		"""
		valid = super(SignUpForm, self).is_valid()

		if valid == True:

			try:
			
				self.generated_username =  self.auto_username()
			
			except forms.ValidationError as e:

				valid = False


		return valid


	def auto_username(self, max_length=30):
		"""
		
		Return a unique username generate from the user's name or email. Raise a
		ValidationError if no username was generated.

		@param max_length: max length of the username.

		"""

		pattern = r'\w+'

		name = self.cleaned_data.get('name', '')

		username = 	''.join(re.findall(pattern, name, re.I))[:max_length]


		if username == '':

			name = self.cleaned_data.get('email', '').split('@', 1)[0]
		
			username = ''.join(re.findall(pattern, name, re.I))[:max_length]


		if username == '':

			length = 16

			allowed_chars='abcdefghijklmnopqrstuvwxyz0123456789'
		
			username = get_random_string(length=length, allowed_chars=allowed_chars)

		
		username = username.lower()
		
		username_copy = username
		
		attempt, max_attempt, length = 0, 5, 5


		while attempt < max_attempt:

			if get_user_model().objects.filter(username=username).exists() or \
				username in reserved_usernames:

				attempt = attempt+1

				if attempt >= max_attempt:

					self.add_account_creation_error()

					raise forms.ValidationError(

						'Auto generate username error', code='auto_username'

					)

				username = (

					username_copy[:max_length-length] + 

					get_random_string(length=length, allowed_chars='0123456789')
				
				)

				length = length+1

			else:

				attempt = max_attempt

		return username.lower()


	def clean_password(self):
		"""
		
		Create a user instance from the USER_ATTRIBUTES fields. This will create a 
		user with only the fields required to run UserAttributeSimilarityValidator which 
		tests the password for similarities with the user's personal information.

		"""
		
		attrs = settings.USER_ATTRIBUTES
		
		user_params = {}
		
		for attr in attrs:

			user_params[attr] = self.cleaned_data.get(attr)
		
		user = get_user_model()(**user_params)
		

		password = self.cleaned_data.get('password')
		
		# Run the validator(s) defined in the settings file (base.py)
		validate_password(password=password, user=user)
		
		user = None

		return password


	def save(self, commit=True):
		"""

		Save the form data to the database, storing a hashed version of the
		user's password and send an email confirmation email to the user.

		"""

		user = super(SignUpForm, self).save(commit=False)
		
		user.set_password(self.cleaned_data['password'])

		user.username = self.generated_username


		if commit:

			user.save()

			verify_email(user)


		return user

# ----------------------------------------------------------------------------------------

class LoginForm(UloForm):

	# Indicates if this form has been loaded within another page.
	pip = UloPIPField(id='login_pip')

	# Email Address
	email = forms.EmailField(
		
		label=_('Email address'),
		
		widget=forms.TextInput(attrs={
			
			'class': 'box_border',
			'autofocus': 'autofocus',
			'placeholder': _('Email address'),
			'required': 'required',
		
		}),
	)

	# Password - PasswordField performs its own validation.
	password = PasswordField(
		
		label=_('Password'),
		
		widget=forms.PasswordInput(attrs={
			
			'class': 'box_border',
			'placeholder': _('Password'),
			'required': 'required',
		
		}),
	
	)

	# Determines when the session should expire
	remember = forms.BooleanField(
	
		label=_('Remember me'),
	
		required=False,
	
	)

	# Redirect path
	redirect_to = forms.CharField(
		
		widget=forms.HiddenInput(),

		required = False
	
	)


	def __init__(self, redirect_to=None, *args, **kwargs):
		"""
		Store a reference to the authenticated user and prefix all IDs with the 
		value 'login_'
		"""

		kwargs['auto_id'] = 'login_%s'

		super(LoginForm, self).__init__(*args, **kwargs)


	def add_login_error(self, msg=None):

		# Remove all field specific error messages.
		self.errors.clear()

		# Add a single non field error message.
		self.add_error(None, msg or _('The email address and password do not match.'))

# ----------------------------------------------------------------------------------------



