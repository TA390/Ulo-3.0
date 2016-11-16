# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils.functional import cached_property
from django.utils.translation import ugettext_lazy as _

# Thrid party app imports

# Project imports
from emails.emails import verify_email
from ulo.fields import PasswordField
from ulo.formmixins import CleanUsernameMixin
from ulo.forms import UloModelForm, UloSecureModelForm
from users.search import user_search

# -------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class AccountSettingsForm(CleanUsernameMixin, UloSecureModelForm):
	"""
	Render a form to change the user's account details.
	"""

	class Meta:

		model = get_user_model()

		fields = ('name', 'username', 'email')


	def __init__(self, *args, **kwargs):
		
		kwargs['auto_id'] = 'account_%s'
		
		super(AccountSettingsForm, self).__init__(*args, **kwargs)

		for name, field in self.fields.items():

			field.widget.attrs.update({

				'class':'box_border',
				'autocomplete': 'off'

			})
		
		self.fields['password'].widget.attrs.update({
			
			'placeholder': 'Current password', 

		})


	def add_account_update_error(self):

		self.add_error(

			None,
			_('Sorry, it looks like we failed to update your account. Please try again later.')

		)


	@cached_property
	def changed_data(self):
		"""
		Return a list of changed field names. This is a simplified version of Django's 
		changed_data function.

		https://docs.djangoproject.com/en/1.9/_modules/django/forms/forms/#Form
		"""
		changed = []
		
		for name, field in self.fields.items():

			value = self.cleaned_data.get(name, '')

			if name in ('username', 'email'):
				
				value = value.lower()
		
			if field.has_changed(self.initial.get(name, field.initial), value):
				
				changed.append(name)
		
		return changed


	# clean_username() is implemented by the CleanUsername Mixin. The function checks the
	# username against reserved usernames and returns a lowercase string.


	def clean_email(self):
		"""
		Normalise the email address (see users.models.UserManager)
		"""
		
		return self.cleaned_data['email'].lower()


	def is_valid(self):

		if super(AccountSettingsForm, self).is_valid() == False:
		
			for name, field in self.fields.items():
				
				# Set all fields on the user object back to their original values
				setattr(self.instance, name, self.initial.get(name, field.initial))
				
				# Set invalid form fields back to their original value
				if self.has_error(name, code='invalid'):
					
					self.data._mutable = True
					
					self.data[name] = self.initial[name]
					
					self.data._mutable = False

			return False


		return True


	def save(self, commit=True):
		"""
		Send a verification email to the user if they changed their existing email 
		address.
		"""

		user = super(AccountSettingsForm, self).save(commit=False)


		email_changed = 'email' in self.changed_data


		if email_changed:
			
			user.email_confirmed = False

		
		if commit:

			try:

				with transaction.atomic():

					user.save()

					user_search.update_instance( user )


				if email_changed:
						
					# Send verification email
					verify_email(user)


			except Exception as e:

				print(e)
				
				self.add_account_update_error()

				user = None

		return user

# ----------------------------------------------------------------------------------------

class PasswordSettingsForm(UloSecureModelForm):
	"""
	Render a form to change the user's password.
	"""

	new_password = PasswordField( 
	
		label=_('New password'),
		error_messages = {'required': _('Please enter a new password.')}
	
	)

	verify_password = forms.CharField(
	
		label=_('Re-enter new password'),
		widget=forms.PasswordInput,
		error_messages = {'required': _('Re-enter your new password.')}
	
	)


	class Meta:
		
		model = get_user_model()

		fields = ('password',)


	def __init__(self, *args, **kwargs):
		
		super(PasswordSettingsForm, self).__init__(*args, **kwargs)

		for name, field in self.fields.items():

			field.widget.attrs.update({'class': 'box_border'})


	def clean_verify_password(self):
		
		password = self.cleaned_data.get('new_password')
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
		
		user = super(PasswordSettingsForm, self).save(commit=False)
		
		user.set_password(self.cleaned_data['verify_password'])

		if commit:

			user.save()

		return user

# ----------------------------------------------------------------------------------------

class NotificationSettingsForm(UloModelForm):
	"""
	Render a form to change the user's notification settings.
	"""

	pass

# ----------------------------------------------------------------------------------------



