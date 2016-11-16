# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django import forms
from django.contrib.auth import get_user_model, authenticate, login
from django.contrib.auth.password_validation import validate_password
from django.utils.translation import ugettext_lazy as _

# Thrid party app imports

# Project imports
from users.utils import NOT_MY_ACCOUNT
from ulo.fields import PasswordField
from ulo.forms import UloForm, UloSecureForm

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class DeactivateAccountForm(UloSecureForm):

	def __init__(self, *args, **kwargs):

		self.instance = kwargs.pop('instance')
		
		kwargs['auto_id'] = 'deactivate_%s'
		
		super(DeactivateAccountForm, self).__init__(*args, **kwargs)
		
		self.fields['password'].widget.attrs.update({

			'class': 'box_border',
			'placeholder': _('Current Password')

		})

# ----------------------------------------------------------------------------------------

class NotMyAccountForm(forms.Form):
	"""
	Update the user instance to block the account.
	"""

	token = forms.CharField(

		widget=forms.HiddenInput(),
		required=False
		
	)

	def __init__(self, instance, *args, **kwargs):

		self.instance = instance

		super(NotMyAccountForm, self).__init__(*args, **kwargs)


	def save(self):

		# Add a block to the account
		self.instance.set_block(NOT_MY_ACCOUNT)
		
		# Deactivate the account so it can be deleted permanently in 30 days
		self.instance.is_active = False
		
		self.instance.save()

# ----------------------------------------------------------------------------------------

class PasswordResetBeginForm(UloForm):
	"""
	Form to search for the user's account. If valid a new session is started else an
	error message is displayed back to the user.
	"""

	email = forms.EmailField(

		label=_('Enter your email address.'),
		max_length=255,
		widget=forms.EmailInput(attrs={

			'class': 'box_border',
			'placeholder': 'Email address'

		}),
		
		error_messages = {

			'required': _('Please enter your email address.')

		}

	)


	def get_email(self):
		
		return self.cleaned_data.get('email')


	def clean_email(self):

		email = self.get_email()

		if get_user_model().objects.filter(email=email).exists() == False:
			
			raise forms.ValidationError(

				_('We did not find an account for this email address.'),
				code='not_found',

			)

		return email

# ----------------------------------------------------------------------------------------

class PasswordResetForm(UloForm):
	"""
	"""

	token = forms.CharField(

		widget=forms.HiddenInput(),
		required=False

	)

	password = PasswordField( 
	
		label=_('New password'),
		error_messages = {'required': _('Please enter a new password.')}
	
	)

	verify_password = forms.CharField(
	
		label=_('Verify password'),
		widget=forms.PasswordInput,
		error_messages = {'required': _('Re-enter your new password.')}
	
	)


	def __init__(self, instance, *args, **kwargs):

		self.instance = instance
		
		super(PasswordResetForm, self).__init__(*args, **kwargs)

		for name, field in self.fields.items():

			field.widget.attrs.update({'class': 'box_border'})


	def clean_verify_password(self):
		
		password = self.cleaned_data.get('password')
		verify = self.cleaned_data.get('verify_password')

		if password and verify:
			
			if password != verify:
			
				raise forms.ValidationError(
			
					_('Passwords do not match.'), code='mismatch'

				)

		# Run the validator(s) defined in the settings file:
		# config.settings.base.AUTH_PASSWORD_VALIDATORS
		validate_password(password=verify, user=self.instance)
		
		return verify


	def save(self, commit=True):
		
		password = self.cleaned_data['verify_password']

		self.instance.set_password(password)

		if commit:
			self.instance.save()

		return self.instance, password

# ----------------------------------------------------------------------------------------



