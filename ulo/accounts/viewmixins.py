# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.core.signing import BadSignature, SignatureExpired, dumps, loads
from django.core.urlresolvers import reverse
from django.shortcuts import render, redirect
from django.utils.functional import cached_property

# Thrid party app imports

# Project imports

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class TokenValidationMixin(object):

	def get_initial(self):

		return {'token': self.kwargs.get('token', '')}


	def get_object(self):
		"""
		Return a user instance. 
		"""

		return self.validate_token

	@cached_property
	def validate_token(self):
		"""
		Validate the token and return a user instance.
		"""

		raise NotImplemented('Subclasses of TokenValidationMixin must define user().')


# ----------------------------------------------------------------------------------------

class PasswordResetMixin(object):

	salt = 'pre'
	max_age = 60 * 5
	key = 'password_reset_email'


	def setSession(self, email):
		
		self.request.session[self.key] = dumps(email, salt=self.salt)


	def getSession(self, fail_silently=True):
		
		try:
			
			return loads(
		
				self.request.session[self.key],
				salt=self.salt,
				max_age=self.max_age
		
			)
		
		except (BadSignature, KeyError, SignatureExpired) as e:

			if fail_silently==True:

				return None

			raise e


	def delSession(self):

		try:

			del self.request.session[self.key]

		except KeyError:

			pass


	def redirect_to_start(self):

		return redirect( reverse('accounts:password_reset_begin') )


	def get_redirect_url(self):

		return reverse('settings:password')

# ----------------------------------------------------------------------------------------



