# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports

# Core django imports
from django.middleware.csrf import get_token

# Thrid party app imports

# Project imports

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class AjaxRequestMiddleware(object):

	def __init__(self, get_response):

		self.get_response = get_response
		# One-time configuration and initialization.


	def __call__(self, request):

		# Code to be executed for each request before
		# the view (and later middleware) are called.

		response = self.get_response(request)

		# Code to be executed for each request/response after
		# the view is called.

		if not response.streaming and not response.has_header('Content-Length'):

			response['Content-Length'] = str(len(response.content))


		response['token-id'] = request.META.get('CSRF_TOKEN', get_token(request))

		response['auth-id'] = request.user.id

		return response

# ----------------------------------------------------------------------------------------

