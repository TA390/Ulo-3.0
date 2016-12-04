"""
Users URL Configuration
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

	url(r'^available/(?P<username>[\w]+)/$', views.UsernameAvailableView.as_view(), name='available'),
		
	# Follow user
	url(r'^follow/(?P<pk>[\d]+)/$', views.FollowUserView.as_view(), name='follow'),
	
	# UnFollow user
	url(r'^unfollow/(?P<pk>[\d]+)/$', views.UnFollowUserView.as_view(), name='unfollow'),


	# Update profile information
	url(r'^update/$', views.ProfileUpdateView.as_view(), name='profile_update'),

	# Update profile picture
	url(r'^(?P<pk>[\d]+)/image/update/$', views.ProfileUpdateImageView.as_view(), name='profile_update_image'),

	# Delete profile picture
	url(r'^(?P<pk>[\d]+)/image/delete/$', views.ProfileDeleteImageView.as_view(), name='profile_delete_image'),


	# Profile page - posts tab
	url(r'^(?P<username>[\w]+)/$', views.ProfileView.as_view(), name='profile'),

	# Profile page - followers tab
	url(r'^(?P<username>[\w]+)/followers/$', views.ProfileFollowersView.as_view(), name='followers'),
	
	# Profile page - following tab
	url(r'^(?P<username>[\w]+)/following/$', views.ProfileFollowingView.as_view(), name='following'),

]

# ----------------------------------------------------------------------------------------