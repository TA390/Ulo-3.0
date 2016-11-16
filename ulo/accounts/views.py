# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals
import re

# Core django imports
from django.contrib import messages
from django.contrib.auth import get_user_model, login, logout
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.exceptions import PermissionDenied
from django.core.urlresolvers import reverse
from django.http import Http404, JsonResponse
from django.shortcuts import render, redirect
from django.utils.decorators import method_decorator
from django.utils.functional import cached_property
from django.utils.safestring import mark_safe
from django.utils.translation import ugettext_lazy as _
from django.views.decorators.cache import never_cache

# Thrid party app imports

#Project imports
from .forms import *
from .viewmixins import *
from emails.emails import verify_email, reset_password_email
from users.utils import NOT_MY_ACCOUNT
from ulo.sessions import LinkViewsSession
from ulo.tokens import(
	InvalidToken, NotMyAccountTokenGenerator, ResetPasswordTokenGenerator, 
	VerifyEmailTokenGenerator
)
from ulo.utils import get_referer_path, get_messages_json
from ulo.views import UloView, UloFormView, UloUpdateView
from ulo.viewmixins import UloLogoutRequiredMixin

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

def redirect_to_expired():

	return redirect(reverse('accounts:token_expired'))

# ----------------------------------------------------------------------------------------

def censor_email(email):

	return re.sub(
	
		r'^([^@]{1,2})[^@]*(@[^.]{1,2}).*(\.[^.]*)$', r'\1******\2******\3', email
	
	)

# ----------------------------------------------------------------------------------------

class TokenExpiredView(UloView):

	template_name = 'accounts/token_expired.html'
	

	def get(self, request, *args, **kwargs):

		return render(request, self.template_name, {})

# ----------------------------------------------------------------------------------------

class DeactivateAccountView(LoginRequiredMixin, UloFormView):

	redirect_field_name = 'redirect_to'
	template_name = 'accounts/deactivate.html'
	form_class = DeactivateAccountForm


	def get_form_kwargs(self):
		
		kwargs = super(DeactivateAccountView, self).get_form_kwargs()
		
		kwargs.update({'instance': self.request.user })
		
		return kwargs


	def form_valid(self, form):

		self.request.user.deactivate_account()
		
		logout(self.request)
		
		LinkViewsSession(self.request).set('deactivate_account', True)
		
		return redirect(reverse('accounts:deactivated'))

# ----------------------------------------------------------------------------------------

class DeactivatedAccountView(UloLogoutRequiredMixin, UloView):
	"""
	Display page informing the user that their account has been deactivated.
	"""

	template_name = 'accounts/deactivated.html'


	def get(self, request, *args, **kwargs):
		
		if LinkViewsSession(request).get('deactivate_account'):
		
			return super(DeactivatedAccountView, self).get(request, *args, **kwargs)
		
		raise Http404()

# ----------------------------------------------------------------------------------------

class NotMyAccountView(TokenValidationMixin, UloUpdateView):
	"""
	Render the form that suspends the account/email address.
	"""

	form_class = NotMyAccountForm
	template_name = 'accounts/not_my_account.html'


	def get_success_url(self):
		
		return reverse('accounts:not_my_account_confirmed')


	def get(self, request, *args, **kwargs):

		try:

			user = self.get_object()

			# The logged in user is claiming that this is not their account.
			if request.user.id == user.id:
				
				messages.error(
				
					request,
					_('You can deactivate your account from the settings page.')
				
				)

				return redirect(get_referer_path(request, error_path=reverse('home')))


			# Account already verified.
			if user.email_confirmed:

				raise PermissionDenied()


			# Account already suspended.
			if user.block == NOT_MY_ACCOUNT:

				raise PermissionDenied()

			
		# The email address is no longer associated with an account.
		except get_user_model().DoesNotExist:

			LinkViewsSession(request).set('not_my_account_no_user', True)

			return redirect(reverse('accounts:not_my_account_no_user'))


		except (InvalidToken, PermissionDenied):

			return redirect_to_expired()


		return super(NotMyAccountView, self).get(request, *args, **kwargs)


	def get_context_data(self, **kwargs):
		"""
		"""		

		context = super(NotMyAccountView, self).get_context_data(**kwargs)

		user = self.get_object()

		context.update({

			'username': user.username, 
			'email': censor_email(user.email)

		})
		
		return context


	@cached_property
	def validate_token(self):

		return NotMyAccountTokenGenerator().check_token(

			token=self.kwargs.get('token'), salt='not_my_account', 
			fail_silently=False, max_age=172800 # 2 days

		)


	def form_valid(self, form):
		
		form.save()
		
		LinkViewsSession(self.request).set('not_my_account', True)
		
		return super(NotMyAccountView, self).form_valid(form)


# ----------------------------------------------------------------------------------------

class NotMyAccountConfirmedView(UloView):
	"""
	Confirm that the account/email address have been suspended.
	"""

	template_name = 'accounts/not_my_account_confirmed.html'


	def get(self, request, *args, **kwargs):

		if LinkViewsSession(request).get('not_my_account'):
		
			return super(NotMyAccountConfirmedView, self).get(request, *args, **kwargs)
		
		raise Http404()

# ----------------------------------------------------------------------------------------

class NotMyAccountNoUserView(UloView):
	"""
	Rendered when the email address is no longer associated to an account.
	"""

	template_name = 'accounts/not_my_account_no_user.html'


	def get(self, request, *args, **kwargs):
		
		if LinkViewsSession(request).get('not_my_account_no_user'):
		
			return super(NotMyAccountNoUserView, self).get(request, *args, **kwargs)
		
		raise Http404()

# ----------------------------------------------------------------------------------------

@method_decorator(never_cache, name='get')
class EmailVerificationView(LoginRequiredMixin, UloView):
	"""
	Set user.email_confirmed=True if the token is valid.
	"""

	redirect_field_name = 'redirect_to'
	

	def get(self, request, token, *args, **kwargs):

		user = VerifyEmailTokenGenerator().check_token(
		
			token=token, salt='email_verification', max_age=604800 # 7 days
		
		)

		if user != None:

			if request.user != user:
				
				messages.info(request, 
					
					mark_safe(
						_(					
							
							'Please sign is as <b class="bold">@%(username)s</b> to \
								confirm your email address.'

						) % {'username':user.username}
					)
				)
			
			else:
			
				user.email_confirmed = True;

				user.save()
			
				messages.success(request, 
			
					_('Thank you for confirming your email address!')
			
				)


			return redirect(get_referer_path(request))

		
		return redirect_to_expired()

# ----------------------------------------------------------------------------------------

class ResendEmailVerificationView(LoginRequiredMixin, UloView):
	"""
	Send the user a confirmation email to confirm their email address.
	"""

	def get(self, request, *args, **kwargs):

		if verify_email(request.user):
			
			messages.success(request, 
			
				_('We have sent you a confirmation email.')
			
			)

			status = 200
		
		else:
		
			messages.error(request, 
		
				_('We failed to send you a confirmation email. Please try again later.')
		
			)

			status = 500


		if request.is_ajax():

			return JsonResponse({'messages': get_messages_json(request)}, status=status)

		return redirect( get_referer_path(request) )

# ----------------------------------------------------------------------------------------

class PasswordResetBeginView(PasswordResetMixin, UloLogoutRequiredMixin, UloFormView):
	"""
	"""

	template_name = 'accounts/password_reset_begin.html'
	form_class = PasswordResetBeginForm


	def get_success_url(self):

		return reverse('accounts:password_reset_email')


	def get(self, request, *args, **kwargs):

		self.delSession()

		return super(PasswordResetBeginView, self).get(request, *args, **kwargs)


	def form_valid(self, form):

		self.setSession(form.get_email())
		
		return super(PasswordResetBeginView, self).form_valid(form)

# ----------------------------------------------------------------------------------------

@method_decorator(never_cache, name='get')
class PasswordResetEmailView(PasswordResetMixin, UloLogoutRequiredMixin, UloView):
	"""

	"""

	template_name = 'accounts/password_reset_email.html'


	def get_success_url(self):

		return reverse('accounts:password_reset_sent')


	def get(self, request, *args, **kwargs):
		
		email = self.getSession()

		if email==None:
			return self.redirect_to_start()

		kwargs['email'] = censor_email(email)

		return super(PasswordResetEmailView, self).get(request, *args, **kwargs)


	def post(self, request, *args, **kwargs):

		email = self.getSession()

		try:

			UserModel = get_user_model()

			user = UserModel.objects.get(email=email)

			if reset_password_email(user=user) == 0:
				raise UserModel.DoesNotExist

		except UserModel.DoesNotExist:

			msg = _(

				'Your session expired. Please try again.' if email==None \
				else 'We failed to send your password reset link. Please try again.'

			)

			messages.error(request, msg)
			
			return self.redirect_to_start()

		return redirect( self.get_success_url() )

# ----------------------------------------------------------------------------------------

class PasswordResetSentView(PasswordResetMixin, UloLogoutRequiredMixin, UloView):
	"""
	End the password reset process and display a page informing the user that an email
	has been sent to them.
	"""
	template_name = 'accounts/password_reset_sent.html'

	def get(self, request, *args, **kwargs):

		if self.getSession() != None:
			
			self.delSession()
			
			return super(PasswordResetSentView, self).get(request, *args, **kwargs)


		return redirect( reverse('home') )

# ----------------------------------------------------------------------------------------

class PasswordResetView(UloLogoutRequiredMixin, TokenValidationMixin, UloFormView):
	"""
	Check the password reset token and diplay a change password form to the user.
	"""

	success_url_str = 'home'
	form_class = PasswordResetForm
	template_name = 'accounts/password_reset.html'


	def get_success_url(self):
		
		return reverse(self.success_url_str)


	def get_redirect_url(self):
		
		return reverse('settings:password')


	def get(self, request, *args, **kwargs):

		try:

			self.validate_token;

		except (InvalidToken, get_user_model().DoesNotExist):
			
			return redirect_to_expired()

		return super(PasswordResetView, self).get(request, *args, **kwargs)


	def get_form(self):

		return self.get_form_class()(self.get_object(), **self.get_form_kwargs())


	@cached_property
	def validate_token(self):
		
		return ResetPasswordTokenGenerator().check_token(

			token=self.kwargs.get('token'), salt='password_reset', 
			fail_silently=False, max_age=86400
	
		)


	def form_valid(self, form):

		user, password = form.save()

		user = authenticate(email=user.email, password=password)

		if user:

			login(self.request, user)

		else:

			self.success_url_str = 'login'

		return super(PasswordResetView, self).form_valid(form)

# ----------------------------------------------------------------------------------------



