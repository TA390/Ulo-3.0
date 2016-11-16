"""
Accounts URL Configuration
The `urlpatterns` list routes URLs to views.
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


	url(r'^$', views.SearchView.as_view(), name='search'),

	url(r'^autocomplete/$', views.AutocompleteView.as_view(), name='autocomplete')

]

# ----------------------------------------------------------------------------------------