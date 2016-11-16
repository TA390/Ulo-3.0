# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.core.urlresolvers import reverse
from django.db import connection, IntegrityError, transaction
from django.db.models import F
from django.http import Http404, HttpResponse, HttpResponseForbidden, JsonResponse
from django.shortcuts import redirect
from django.utils.http import urlquote_plus, urlunquote_plus
from django.utils.translation import ugettext_lazy as _

# Thrid party app imports

# Project imports
from .forms import LoginForm, SignUpForm
from .search import user_search
from ulo.views import UloView, UloFormView, UloRedirectView
from ulo.viewmixins import UloLogoutRequiredMixin

# ----------------------------------------------------------------------------------------




# SIGNUP, LOGIN, LOGOUT
# ----------------------------------------------------------------------------------------

class SignUpView(UloLogoutRequiredMixin, UloFormView):
	"""
	Display sign up form and create new user account. Log the user in after successfully
	creating the account and send them an email to verify their address.
	"""

	template_name = 'users/signup.html'

	form_class = SignUpForm


	def form_valid(self, form):
		"""
		Save the user to the database and log them into their account.
		"""

		try:

			user = form.save()

		except Exception:

			form.add_account_creation_error()

			return self.form_invalid(form)

	
		# Use the non hashed version of the password from the submitted form data.
		user = authenticate(

			email=user.email, 
			password=form.cleaned_data.get('password')

		)

		# Log the new user in.
		if user:
			
			 login(self.request, user)

			 return redirect('home')
			 # return redirect( user.get_absolute_url() )
		
		# Redirect to the login page if user authentication failed.
		else:
			
			return redirect(reverse('login'))

# ----------------------------------------------------------------------------------------

# TODO: Handle cookie error in better way (i.e. if user does not allow cookies)
class LoginView(UloLogoutRequiredMixin, UloFormView):

	template_name = 'users/login.html'
	
	redirect_name = 'redirect_to'
	
	form_class = LoginForm


	def get_redirect_url(self):
		"""
		UloLogoutRequiredMixin. Path to redirect a logged in user to.
		"""

		if self.request.method in ('POST', 'PUT'):
			
			return self.get_success_url()

		return reverse('home')


	def get(self, request, redirect_to, *args, **kwargs):
		"""
		Initialise form data with the redirect path if one is given.
		"""

		name = self.redirect_name
		
		path = self.request.GET.get(name, '')

		# Initialise hidden form field with the redirect path.
		self.initial.update({name: path})
		
		# Add context variable to append the redirect path to the forms url.
		kwargs.update({name: path and '?'+name+'='+urlquote_plus(path)})

		return super(LoginView, self).get(request, *args, **kwargs)


	def get_success_url(self):
		"""
		Return the url to redirect to after a successful post.
		"""

		return self.request.POST.get('redirect_to') or reverse('home')


	def form_invalid(self, form, msg=None):
		"""
		Add single non field error to the form.
		"""

		form.add_login_error(msg=msg)

		return super(LoginView, self).form_invalid(form)


	def form_valid(self, form):
		"""
		Log the user in. Have the session expire when the browser is closed if the user
		did not select remember me. Return the redirect page as html if the login form
		has been rendered within another page.
		"""

		# LOGIN VALIDATION

		email = form.cleaned_data.get('email')

		password = form.cleaned_data.get('password')

		user = authenticate(email=email, password=password)
				
		if user == None:

			return self.form_invalid(form)

		if user.is_blocked():

			return self.form_invalid(form, user.block_message()) 
		

		# ACCOUNT ACTIVATION

		if user.is_active == False:

			user.is_active = True

			user.save()
			
			reactivation_email(user)

		
		login(self.request, user)

		if form.cleaned_data.get('remember') == None:
			
			# Expire session when the browser window is closed
			self.request.session.set_expiry(0)
			

		self.force_html = form.cleaned_data.get('pip', False)

		return super(LoginView, self).form_valid(form)

# ----------------------------------------------------------------------------------------

class LogoutView(UloRedirectView):
	
	def get_redirect_url(self):
		
		# Destroy all session data for the current request / user
		logout(self.request)
		
		return reverse('home')

# END SIGNUP, LOGIN, LOGOUT
# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class UsernameAvailableView(UloView):

	def get(self, request, *args, **kwargs):

		raise Http404()


	def head(self, request, username, *args, **kwargs):

		if request.is_ajax():
			
			response = HttpResponse('')
			
			response['exists'] = (

				username.lower() in reserved_usernames or 
				get_user_model().objects.filter(username=username).exists()
			
			)

			return response

		raise Http404()

# ----------------------------------------------------------------------------------------




class ProfileView(UloView):
	"""
	Default profile view. Render the profile page with the 'posts' tab selected.
	"""

	template_name = 'users/profile.html'


