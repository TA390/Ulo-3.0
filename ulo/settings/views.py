
# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.contrib import messages
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext_lazy as _

# Thrid party app imports

# Project imports
from .forms import AccountSettingsForm, NotificationSettingsForm, PasswordSettingsForm
from ulo.views import UloUpdateView

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class AccountSettingsView(LoginRequiredMixin, UloUpdateView):

	redirect_field_name = 'redirect_to'
	form_class = AccountSettingsForm
	template_name = 'settings/account.html'
	# AjaxFormMixin (UloUpdateView): Form context name.
	form_context_name = 'account_form'

	def get_object(self):

		return self.request.user


	def get_success_url(self):

		return reverse('home')


	def form_valid(self, form):
		
		if form.has_changed():

			if form.save() == None:

				return super(AccountSettingsView, self).form_invalid(form)


			self.force_html = True

			messages.success(self.request, _('Your account has been updated.'))
		
		return super(AccountSettingsView, self).form_valid(form)

# ----------------------------------------------------------------------------------------

class PasswordSettingsView(LoginRequiredMixin, UloUpdateView):

	redirect_field_name = 'redirect_to'
	form_class = PasswordSettingsForm
	template_name = 'settings/change_password.html'
	# AjaxFormMixin (UloUpdateView): Form context name.
	form_context_name = 'password_form'


	def get_object(self):

		return self.request.user


	def get_success_url(self):

		return reverse('home')


	def form_valid(self, form):

		self.force_html = True
		
		update_session_auth_hash(self.request, form.save())
		
		messages.success(self.request, _('Your password has been changed.'))
		
		return super(PasswordSettingsView, self).form_valid(form)

# ----------------------------------------------------------------------------------------

class NotificationSettingsView(LoginRequiredMixin, UloUpdateView):

	redirect_field_name = 'redirect_to'
	form_class = NotificationSettingsForm
	template_name = 'settings/notifications.html'
	# AjaxFormMixin (UloUpdateView): Form context name.
	form_context_name = 'notifications_form'


	def get_object(self):

		return self.request.user


	def get_success_url(self):

		return reverse('settings:notifications')


	def form_valid(self, form):
		
		if form.has_changed():
			
			form.save()

			messages.success(self.request, _('Your notification settings have been updated.'))
		
		return super(NotificationSettingsView, self).form_valid(form)

# ----------------------------------------------------------------------------------------



