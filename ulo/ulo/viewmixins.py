# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.contrib.auth.mixins import AccessMixin, LoginRequiredMixin
from django.contrib.auth.views import redirect_to_login
from django.core.exceptions import PermissionDenied
from django.core.urlresolvers import reverse
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.template.loader import render_to_string
from django.utils.decorators import method_decorator
from django.utils.functional import cached_property
from django.utils.http import urlquote
from django.views.decorators.cache import cache_control
from django.views.decorators.debug import sensitive_post_parameters
from django.views.decorators.vary import vary_on_headers

# Thrid party app imports

# Project imports
from ulo.utils import get_messages_json, get_referer_path

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class AjaxRequestMixin(object):
	"""
	Mixin to add Ajax support to get requests. Relies on template_name to render the page.
	"""

	# Prevents the history API from rendering JSON on cached pages when the user navigates 
	# the site using the browser's back/forward buttons
	@method_decorator(vary_on_headers('X-Requested-With'))
	def dispatch(self, request, *args, **kwargs):
		
		return super(AjaxRequestMixin, self).dispatch(request, *args, **kwargs)
		

	def get(self, request, *args, **kwargs):
		
		if request.is_ajax():

			data = {
				
				'html': render_to_string(

					template_name=self.template_name, 
					context=self.get_context_data(**kwargs),
					request=request
				
				),

				'messages': get_messages_json(request),
				
				'url': urlquote(request.get_full_path(), safe="?&/=")
			
			}

			return JsonResponse(data, status=200)

		return render(request, self.template_name, self.get_context_data(**kwargs))

# ----------------------------------------------------------------------------------------

@method_decorator(sensitive_post_parameters(), name='dispatch')
class AjaxFormMixin(object):
	"""
	Mixin to add Ajax support to forms.
	Must be used with an object-based FormView
	"""

	# Specifies if form_valid should return the html of the redirect page
	force_html = False
	
	# Template context variable name of the form.
	form_context_name = 'form'


	def dispatch(self, *args, **kwargs):
	
		return super(AjaxFormMixin, self).dispatch(*args, **kwargs)


	def get_initial(self):

		initial = self.initial.copy()

		initial.update({'http_referer': self.request.path_info or ""})

		return initial


	def ajax_invalid(self, form):

		return {

			'errors': form.errors, 
			'messages': get_messages_json(self.request)

		}


	def form_invalid(self, form):

		if self.request.is_ajax():

			return JsonResponse(self.ajax_invalid(form), status=400)

		else:

			# Call render_to_response directly to pass form using the form_context_name
			return self.render_to_response(
			
				self.get_context_data( **{ self.form_context_name: form } )
			
			)


	def ajax_valid(self, form):

		return {

			'url': self.get_success_url(), 
			'messages': get_messages_json(self.request)

		}


	def form_valid(self, form):

		if self.request.is_ajax() and self.force_html==False:

			return JsonResponse(self.ajax_valid(form), status=200)

		return super(AjaxFormMixin, self).form_valid(form)


	def get_context_data(self, **kwargs):
		
		# Alter FormMixin's behaviour to specify the name of the form.
		# https://github.com/django/django/blob/master/django/views/generic/edit.py
		if self.form_context_name not in kwargs:
		
			kwargs[self.form_context_name] = self.get_form()
		
		# Copy of ContentMixin's behaviour.
		# https://github.com/django/django/blob/master/django/views/generic/base.py
		if 'view' not in kwargs:
		
			kwargs['view'] = self
		
		# Return kwargs without calling super to prevent duplicate forms being added to
		# the context when form_context_name is not the default 'form'.
		return kwargs
		
# ----------------------------------------------------------------------------------------

class UloLoginRequiredMixin(LoginRequiredMixin):
	"""
	Wrapper around Django's LoginRequiredMixin to allow classes to defined the redirect
	path.
	https://github.com/django/django/blob/master/django/contrib/auth/mixins.py
	"""

	def get_redirect_path(self):
		
		return get_referer_path(
		
			self.request,
			redirect=True,
			error_path=self.request.get_full_path()
		
		)


	def handle_no_permission(self):
		
		if self.raise_exception:

			raise PermissionDenied(self.get_permission_denied_message())
		
		return redirect_to_login(
		
			self.get_redirect_path(), 
			self.get_login_url(), 
			self.get_redirect_field_name()
		
		)

# ----------------------------------------------------------------------------------------

@method_decorator(
	(cache_control(no_cache=True, must_revalidate=True, no_store=True, max_age=0, private=True),
	 vary_on_headers('User-Agent', 'Cookie'),), 
	 name='dispatch'
)
class UloLogoutRequiredMixin(object):
	"""
	Mixin that ensures the view is only rendered if the user is logged out. Used for
	sign up and login views.
	"""

	# Should the view raise an exception if the user is not logged in.
	raise_exception = False
	
	def get_redirect_url(self):
		
		return get_referer_path(self.request, error_path=reverse('home'))


	def get_permission_denied_message(self):
		
		return ''


	def dispatch(self, request, *args, **kwargs):

		if request.user.is_authenticated():

			return self.handle_no_permission()

		return super(UloLogoutRequiredMixin, self).dispatch(request, *args, **kwargs)


	def handle_no_permission(self):

		if self.raise_exception:

			raise PermissionDenied(self.get_permission_denied_message())

		return redirect(self.get_redirect_url())

# ----------------------------------------------------------------------------------------

class UloOwnerRequiredMixin(AccessMixin):
	"""

	"""

	id_field = 'id'
	model_class = None


	@cached_property
	def instance(self):

		return self.model_class.objects.get(pk=self.kwargs.get('pk'))


	def dispatch(self, request, *args, **kwargs):
		
		if request.user.is_authenticated():

			try:
				
				if getattr(self.instance, self.id_field) == request.user.id:
				
					return super(UloOwnerRequiredMixin, self).dispatch(request, *args, **kwargs)

				raise PermissionDenied()

			except (self.model_class.DoesNotExist, PermissionDenied):
				
				raise PermissionDenied(self.get_permission_denied_message())
        
		return self.handle_no_permission()
        

# ----------------------------------------------------------------------------------------



