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

		is_authenticated = request.user.id


		# Call view.

		response = self.get_response(request)


		# Code to be executed for each request/response after
		# the view is called.

		if request.is_ajax():

			if not response.streaming and not response.has_header('Content-Length'):

				response['Content-Length'] = str(len(response.content))


			response['auth-id'] = request.user.id

			response['token-id'] = get_token(request)					


			# print( request.META.get('CSRF_COOKIE') ) 

			# token = request.META.get('CSRF_COOKIE')

			# if token != None:

			# 	response['token-id'] = token

			# if request.user.is_authenticated:

			# 	response['auth-id'] = request.user.id


		return response

# ----------------------------------------------------------------------------------------

