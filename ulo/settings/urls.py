"""
Settings URL Configuration
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

	url(r'^account/$', views.AccountSettingsView.as_view(), name='account'),

	url(r'^password/$', views.PasswordSettingsView.as_view(), name='password'),

	# url(r'^notifications/$',
	# 	views.NotificationSettingsView.as_view(), name='notifications'),
]

# ----------------------------------------------------------------------------------------



