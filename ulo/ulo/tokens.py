# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals
from time import time

# Core django imports
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.signing import (

	BadSignature, SignatureExpired, dumps, loads

)
from django.utils.six import text_type

# Thrid party app imports

# Project imports

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class InvalidToken(Exception):
	pass

# ----------------------------------------------------------------------------------------




# All classes are based on the source code of PasswordResetTokenGenerator
# https://github.com/django/django/blob/master/django/contrib/auth/tokens.py
# ----------------------------------------------------------------------------------------

class BaseTokenGenerator(PasswordResetTokenGenerator):
	"""
	Base class to create a token that is a combination of serialised user information 
	and a TimestampSigner. The class uses dumps and loads for object serialisation and 
	user defined 'key' determines which field is used to find a model instance (default: 
	id).

	Subclasses can define the method _make_hash_value to determine the hash value of each 
	token.

	NOTE: The value of settings.PASSWORD_RESET_TIMEOUT_DAYS will determine the maximum 
	number of days that any token is valid for as the class is a subclass of Django's
	PasswordResetTokenGenerator.
	"""

	def __init__(self, *args, **kwargs):
		"""
		Set the value of 'key' which is the attribute used to find the model instant and
		determine if it exists. This defaults to the id field.
		"""
		
		self.key = kwargs.get('key', 'id')
		
		return super(BaseTokenGenerator, self).__init__()


	def make_token(self, user, salt=None):
		"""
		Return a serialised object using a TimestampSigner (through dumps)
		
		@param user: User model instance.
		@param salt: Optional salt to namespace the signer.
		"""

		# Run base class make_token
		token = super(BaseTokenGenerator, self).make_token(user)

		# Return a serialised time stamped object containing the token and id
		return dumps(obj={'token':token, 'attr':{self.key:getattr(user, self.key)}}, salt=salt)


	def check_token(self, token, user=None, salt=None, max_age=None, fail_silently=True):
		"""
		Check that the token returned by make_token is valid and return the user, else 
		return None. If fail_silently is False raise an exception.

		@param token: String returned by make_token
		@param user: User model instance.
		@param salt: Optional salt used to namespace the signer
		@param max_age: Optional time in seconds to determine how long the token is valid for.
		@param fail_silently: Boolean - If true suppress the exception.
		"""
		try:
			UserModel = get_user_model()
			
			# Unsign/unserialise the data (token, user id)
			obj = loads(token, salt=salt, max_age=max_age)
			
			# User instance attribute key/value pair
			attr = obj['attr']

			# Check user id
			if user is None:
			
				user = UserModel.objects.get(**attr)
			

			elif getattr(user, self.key) != attr[self.key]:
			
				return self.handle_failure(fail_silently)


			# Check token
			if super(BaseTokenGenerator, self).check_token(user, obj.get('token')):

				return user

			
			return self.handle_failure(fail_silently)

		except (AttributeError, BadSignature, KeyError, SignatureExpired, TypeError, UserModel.DoesNotExist) as e:

			return self.handle_failure(fail_silently, e)


	def handle_failure(self, fail_silently, e=None):
		"""
		Return None or raise an exception if fail_silently is False. The class raises 
		a DoesNotExist exception if the model instance cannot be found or an 
		InvalidToken exception for all other exceptions.
		"""

		if fail_silently==True:

			return None

		if isinstance(e, get_user_model().DoesNotExist):

			raise e

		raise InvalidToken(e)

# ----------------------------------------------------------------------------------------

class GenericTokenGenerator(BaseTokenGenerator):
	"""
	Class to create a generic token that is not linked to changing user profile
	information.
	"""
	
	def _make_hash_value(self, user, timestamp):
		"""
		Create a hash value based on the user's profile information that is unlikely to 
		change.
		"""
		
		return (
		
			user.email + 
			text_type(user.id) +
			text_type(timestamp)
		
		)

# ----------------------------------------------------------------------------------------

class ResetPasswordTokenGenerator(BaseTokenGenerator):
	"""
	Create a token that allows a user to reset their password.
	"""

	def _make_hash_value(self, user, timestamp):

		return (
		
			super(ResetPasswordTokenGenerator, self)._make_hash_value(user, timestamp) +
			text_type(user.email)
		
		)

# ----------------------------------------------------------------------------------------

class VerifyEmailTokenGenerator(BaseTokenGenerator):
	"""
	Create a token that remains valid until the user confirms their email address 
	or the token expires.
	"""

	def _make_hash_value(self, user, timestamp):
		"""
		Create a hash value based on the user's 'email_confirmed' value which will only 
		change when a user verifies their email address and the email itself should 
		a user change the email address associated with their account.
		"""
		
		return (
		
			user.email +
			text_type(user.id) +
			text_type(user.email_confirmed) +
			text_type(timestamp)
		
		)

# ----------------------------------------------------------------------------------------

class NotMyAccountTokenGenerator(GenericTokenGenerator):

	def __init__(self, *args, **kwargs):
		
		return super(NotMyAccountTokenGenerator, self).__init__(key='email', *args, **kwargs)

# ----------------------------------------------------------------------------------------



