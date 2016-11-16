# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.forms import Form, ModelForm
from django.utils.translation import ugettext_lazy as _

# Thrid party app imports

# Project imports
from .fields import ReadOnlyPasswordField
from .formmixins import UloBaseFormMixin, PasswordRequiredMixin

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class UloForm(UloBaseFormMixin, Form):
	
	pass

# ----------------------------------------------------------------------------------------

class UloSecureForm(UloBaseFormMixin, PasswordRequiredMixin, Form):
	
	password = ReadOnlyPasswordField( label=_('Current password') )

# ----------------------------------------------------------------------------------------

class UloModelForm(UloBaseFormMixin, ModelForm):
	
	pass

# ----------------------------------------------------------------------------------------

class UloSecureModelForm(UloBaseFormMixin, PasswordRequiredMixin, ModelForm):
	"""
	Model form that requires a user to enter their password in order to change the model
	instance. Heavily based on Django's UserChangeForm.

	https://github.com/django/django/blob/master/django/contrib/auth/forms.py
	"""

	password = ReadOnlyPasswordField( label=_('Current password') )

	def __init__(self, *args, **kwargs):
		
		super(UloSecureModelForm, self).__init__(*args, **kwargs)
		
		f = self.fields.get('user_permissions')

		if f is not None:

			f.queryset = f.queryset.select_related('content_type')

# ----------------------------------------------------------------------------------------



