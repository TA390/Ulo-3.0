"""
Posts URL Configuration
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

	# Post form
	url(r'^$', views.PostView.as_view(), name='post'),

	# Post detail page
	url(r'^(?P<pk>[\d]+)/$', views.PostDetailView.as_view(), name='detail'),

	# Post vote
	url(r'^(?P<pk>[\d]+)/vote/$', views.PostVoteView.as_view(), name='vote'),

	# Image post handler
	url(r'^image/$', views.PostImageView.as_view(), name='image'),
	
	# Video post handler
	url(r'^video/$', views.PostVideoView.as_view(), name='video'),

	# Comment
	url(r'^(?P<pk>[\d]+)/comment/$', views.PostCommentView.as_view(), name='comment'),
	url(r'^(?P<pk>[\d]+)/comment/load/$', views.PostCommentLoadView.as_view(), name='comment_load'),

	# Update post
	url(r'^(?P<pk>[\d]+)/update/$', views.PostUpdateView.as_view(), name='update'),
	
	# Delete post
	url(r'^(?P<pk>[\d]+)/delete/$', views.PostDeleteView.as_view(), name='delete'),

	# Report post
	url(r'^(?P<pk>[\d]+)/report/$', views.PostReportView.as_view(), name='report'),
	url(r'^report/complete/$', views.PostReportCompleteView.as_view(), name='report_complete'),

	# Post actions menu (JS disabled)
	url(r'^(?P<pk>[\d]+)/actions/$', views.PostActionsView.as_view(), name='actions'),

]

# ----------------------------------------------------------------------------------------