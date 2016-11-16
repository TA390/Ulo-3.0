"""
Accounts URL Configuration
"""

# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.conf.urls import include, url

# Thrid party app imports

# Project imports
from . import views

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

urlpatterns = [

	# Email verification
	url(r'^verification/(?P<token>[^<>\'"@]+)/$',
		views.EmailVerificationView.as_view(), name='verification'),
	url(r'^resend_verification/$',
		views.ResendEmailVerificationView.as_view(), name='resend_verification'),


	# Password reset
	url(r'^password_reset/$', 
		views.PasswordResetBeginView.as_view(), name='password_reset_begin'),
	url(r'^password_reset/email/$', 
		views.PasswordResetEmailView.as_view(), name='password_reset_email'),
	url(r'^password_reset/sent/$', 
		views.PasswordResetSentView.as_view(), name='password_reset_sent'),
	url(r'^password_reset/(?P<token>[^<>\'"@]+)/$', 
		views.PasswordResetView.as_view(), name='password_reset'),


	# Not my account
	url(r'^not_my_account/confirmed/$',
		views.NotMyAccountConfirmedView.as_view(), name='not_my_account_confirmed'),
	url(r'^not_my_account/$',
		views.NotMyAccountNoUserView.as_view(), name='not_my_account_no_user'),
	url(r'^not_my_account/(?P<token>[^<>\'"@]+)/$',
		views.NotMyAccountView.as_view(), name='not_my_account'),


	# Token expired
	url(r'^token_expired/$', views.TokenExpiredView.as_view(), name='token_expired'),
	

	# Account Deactivation.
	url(r'^deactivate/$', views.DeactivateAccountView.as_view(), name='deactivate'),
	url(r'^deactivated/$', views.DeactivatedAccountView.as_view(), name='deactivated')

]

# ----------------------------------------------------------------------------------------



