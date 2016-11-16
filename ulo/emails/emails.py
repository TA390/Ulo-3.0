# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals
from smtplib import SMTPException

# Core django imports
from django.conf import settings
from django.core.mail import get_connection
from django.core.mail.message import EmailMultiAlternatives, BadHeaderError
from django.template.loader import render_to_string
from django.utils.translation import ugettext_lazy as _

# Thrid party app imports

# Project imports
from ulo.tokens import(
	
	NotMyAccountTokenGenerator, ResetPasswordTokenGenerator, VerifyEmailTokenGenerator

)

# ----------------------------------------------------------------------------------------




# EMAIL ADDRESSES
# ----------------------------------------------------------------------------------------

INFO = 'info@ulo.com'

VERIFY = 'verify@ulo.com'

NOREPLY = 'noreply@ulo.com'

REGISTER = 'register@ulo.com'

NOTIFICATION = 'notification@ulo.com'

# END EMAIL ADDRESSES
# ----------------------------------------------------------------------------------------




# HELPERS
# ----------------------------------------------------------------------------------------

def get_string(path, context, no_lines=False):
	"""
	Return a string representation of a file. 
	@param path: full path to the file.
	@param context: context used for the template
	@param no_lines: boolean, if True remove all new lines
	"""

	string = render_to_string(path, context)

	if no_lines:

		return ''.join(string.splitlines())

	return string

# ----------------------------------------------------------------------------------------

def get_context(user, token_generators=None):
	"""
	Create email context.
	"""
	
	return {
		
		'name': user.get_short_name(),
		'tokens': [gen().make_token(user=user,salt=salt) for gen, salt in token_generators],
		'protocol': 'https',
		'domain': settings.SITE_DOMAIN,
		'site_name': settings.SITE_NAME
	
	}

# ----------------------------------------------------------------------------------------

def _email(user, from_email, subject, body, connection, use_html, token_generators=None, 
			salt=None, html_body=None ):
	"""
	Send an email to the user containing a link/token.
	@param user: instance of the User model
	@param from_email: senders email address
	@param subject: file containing the email subject (.txt)
	@param body: file containing the email body (.txt)
	@param connection: an open connection to use when sending the email
	@param use_html: boolean, if True change the content type to 'text/html'
	@param token_generator: class that generates a token, must have a make_token method
	@param salt: optional salt to namespace the signer
	@param html_body: file containing the email body as a html file (.html)
	"""
	
	try:
		
		# Establish a connection
		connection = connection or get_connection(fail_silently=False)
	
		# Create context for user
		context = get_context(user, token_generators)
		
		# Create email
		email = EmailMultiAlternatives(
		
			subject=get_string(subject, context, True), 
			body=get_string(body, context), 
			from_email=from_email,
			to=(user.email,),
			bcc=None,
			connection=connection
		
		)


		if html_body:

			# Attach html email
			email.attach_alternative(get_string(html_body, context), 'text/html')
			
			# Change content type to be 'text/html' instead of the default 'text/plain'
			if use_html:
			
				email.content_subtype = 'html'

		# Send email
		return email.send()

	except (BadHeaderError, SMTPException):
		
		return 0

# END HELPERS
# ----------------------------------------------------------------------------------------




# EMAILS
# ----------------------------------------------------------------------------------------

def verify_email(user, connection=None, use_html=False):
	"""
	Sends an email to the user with a link to confirm their email address. Return the
	number of successful emails sent.
	@param user: instance of the User model
	@param connection: an open connection to use when sending the email
	@param use_html: boolean, if True change the content type to 'text/html'
	"""

	# If the user has already verified their account return 0
	if not user or user.email_confirmed:
	
		return 0


	return _email(

		user=user,
		from_email=VERIFY,
		subject='verify_subject.txt', 
		body='verify_body.txt',
		use_html=use_html,
		connection=connection,
		token_generators=[
			(VerifyEmailTokenGenerator, 'email_verification'), 
			(NotMyAccountTokenGenerator, 'not_my_account')
		],
		html_body='verify_body.html'
	
	)

# ----------------------------------------------------------------------------------------

def reset_password_email(user, connection=None, use_html=False):
	"""
	Sends an email to the user with a token allowing them to change their password.
	Return the number of successful emails sent.
	@param user: instance of the User model
	@param connection: an open connection to use when sending the email
	@param use_html: boolean, if True change the content type to 'text/html'
	"""
	
	return _email(
	
		user=user,
		from_email=NOREPLY,
		subject='reset_subject.txt',
		body='reset_body.txt',
		connection=connection,
		use_html=use_html,
		token_generators=[(ResetPasswordTokenGenerator,'password_reset')],
		html_body='reset_body.html'
	
	)

# ----------------------------------------------------------------------------------------

def reactivation_email(user, connection=None, use_html=False):
	"""
	Sends an email to the user informing them that their account has been reactivated.
	@param user: instance of the User model
	@param connection: an open connection to use when sending the email
	@param use_html: boolean, if True change the content type to 'text/html'
	"""
	
	return _email(

		user=user,
		from_email=INFO,
		subject='reactivation_subject.txt',
		body='reactivation_body.txt',
		connection=connection,
		use_html=use_html,
		token_generators=[(NotMyAccountTokenGenerator,'not_my_account')],
		html_body='reactivation_body.html'
	
	)

# END EMAILS
# ----------------------------------------------------------------------------------------



