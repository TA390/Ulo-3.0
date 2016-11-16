# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.files.uploadhandler import UploadFileException
from django.http import HttpResponseForbidden, JsonResponse
from django.shortcuts import render
from django.utils.decorators import method_decorator
from django.utils.translation import ugettext_lazy as _
from django.views.decorators.cache import cache_control
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.views.decorators.debug import sensitive_post_parameters
from django.views.generic import FormView, RedirectView, View
from django.views.generic.base import ContextMixin

# Thrid party app imports

# Project imports
from .handlers import MediaUploadException
from .utils import get_messages_json
from .viewmixins import AjaxRequestMixin, AjaxFormMixin, UloOwnerRequiredMixin

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

def csrf_failure(request, reason=""):

	messages.error(

		request, 
		_('Your session has expired. Refresh the page and try again.'),
		extra_tags = "persist"

	)

	if request.is_ajax():
		
		return JsonResponse({

			'csrf_error': True, 
			'messages': get_messages_json(request)

		}, status=403)

	return render(request, '403.html', {})

# ----------------------------------------------------------------------------------------

class UloView(AjaxRequestMixin, ContextMixin, View):
	"""
	Minimal view to display a page and handle ajax get requests.
	"""
	
	pass

# ----------------------------------------------------------------------------------------

@method_decorator((sensitive_post_parameters(),), name='dispatch')
@method_decorator((cache_control(no_cache=True, must_revalidate=True, no_store=True, private=True),), name='get')
class UloRedirectView(RedirectView):
	"""
	"""
	
	permanent = False;
	
	query_string = True

# ----------------------------------------------------------------------------------------

@method_decorator(csrf_protect, name='dispatch')
@method_decorator((sensitive_post_parameters(),), name='post')
class UloFormView(AjaxRequestMixin, AjaxFormMixin, FormView):
	"""
	Django's FormView with added ajax support.
	"""
	
	pass

# ----------------------------------------------------------------------------------------

@method_decorator(csrf_protect, name='dispatch')
class UloUpdateView(AjaxRequestMixin, AjaxFormMixin, FormView):
	"""
	Django's FormView with added ajax support / instance for updating a model.
	"""

	def get_object(self):
		
		raise NotImplementedError(
		
			'Subclasses of UloUpdateView must define get_object()'
		
		)


	def get_form_kwargs(self):

		kwargs = super(UloUpdateView, self).get_form_kwargs()

		kwargs.update({'instance': self.get_object()})

		return kwargs	

# ----------------------------------------------------------------------------------------

class UloUploadMixin(object):

	redirect_field_name = 'redirect_to'

	view_handler = None
	view_args = {}

	form_name = 'form'
	form_class = None


	def set_handlers(self):
		pass


	def get_context_data(self, **kwargs):
		
		if self.form_name not in kwargs:
		
			kwargs[self.form_name] = self.form_class()
		
		return kwargs


	def post(self, request, *args, **kwargs):
		
		msg = None

		try:

			# Only accept post requests made via ajax.
			if request.is_ajax():
				
				self.set_handlers(request)
				
				return self.view_handler.as_view(**self.view_args)(request)


		except MediaUploadException as e:

			# Display any MediaUploadException error messages to the user.
			msg = e

		except UploadFileException as e:

			# Debug
			#print(e)

			# Do not display UploadFileException error messages to the user.
			pass


		# If you land here the request object will be empty and a network error is 
		# likely to have occurred, but add an error message just in case.	
		messages.error(

			request, 
			msg or _('Sorry, we cannot process your request at the moment.')

		)
		
		return self.get(request, *args, **kwargs)

# ----------------------------------------------------------------------------------------

@method_decorator(csrf_exempt, name='dispatch')
class UloUploadView(LoginRequiredMixin, UloUploadMixin, UloView):
	"""
	A csrf exempt view to change the default upload handlers and then call the 
	'view_handler' to process the request. File uploads are restricted to js/ajax uploads. 
	Subclasses must define 'form_class' and 'view_handler' which must be a csrf_protected 
	view that will handle the post and get requests once the upload handlers have run.
	media is the value to set media_type
	"""

	pass

# ----------------------------------------------------------------------------------------

@method_decorator(csrf_exempt, name='dispatch')
class UloOwnerUploadView(UloOwnerRequiredMixin, UloUploadMixin, UloView):
	"""
	An Exact copy of UloUploadView with LoginRequiredMixin replaced for 
	UloOwnerRequiredMixin
	"""

	pass

# ----------------------------------------------------------------------------------------



