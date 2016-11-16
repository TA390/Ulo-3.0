# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.core.exceptions import ValidationError
from django.utils.safestring import mark_safe
from django.utils.translation import ugettext_lazy as _

# Thrid party app imports

# Project imports
from .utils import reserved_usernames

# ----------------------------------------------------------------------------------------




# FORM MIXINS
# ----------------------------------------------------------------------------------------

class UloBaseFormMixin(object):

	def __init__(self, *args, **kwargs):

		kwargs.setdefault('auto_id', '%s')
		
		kwargs.setdefault('label_suffix', '')
		
		super(UloBaseFormMixin, self).__init__(*args, **kwargs)
		
		
	def http_referer(self):
		"""
		Add the hidden input field 'http_referer' to the form.
		"""
		
		value = self.initial.get('http_referer', '')
		
		return mark_safe('<input type="hidden" name="http_referer" value="'+value+'">')


# ----------------------------------------------------------------------------------------

class CleanUsernameMixin(object):
	"""
	Check that the 'username' form field is not a reserved username. Raise a 
	ValidationError if it is.
	"""

	def clean_username(self):

		username = self.cleaned_data.get('username', '').lower()
		
		if username in reserved_usernames:
			
			raise ValidationError(
			
				_('This username has been taken.'), code='reserved_username'
			
			)

		return username

# ----------------------------------------------------------------------------------------

class PasswordRequiredMixin(object):
	"""
	Require the user to enter their current password. If the form instance is not a User
	instance the form must define the variable 'user'.
	"""

	# Fallback user instance if self.instance is not a User instance.
	user = None

	# Check that the password entered matches the user's current password.
	def clean_password(self):
		
		password = self.cleaned_data.get('password', '')

		if password == '':

			raise ValidationError(
			
				_('Please enter your current password.'), code='required'
			
			)


		user = self.instance if hasattr(self.instance, 'check_password') else self.user

		if user.check_password(password) == False:

			raise ValidationError(

				_('Password incorrect.'), code='password_incorrect'

			)


		return self.initial.get('password', '')

# ----------------------------------------------------------------------------------------



# ----------------------------------------------------------------------------------------



