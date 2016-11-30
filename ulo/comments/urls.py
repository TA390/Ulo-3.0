"""
Comments URL Configuration
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

	# Report this comment.
	url(r'^report/complete/$', views.CommentReportCompleteView.as_view(), name='comment_report_complete'),
	
	url(r'^(?P<pk>[\d]+)/report/$', views.CommentReportView.as_view(), name='comment_report'),


	# Delete this comment
	url(r'^(?P<pk>[\d]+)/delete/$', views.CommentDeleteView.as_view(), name='comment_delete'),


	# Comment actions menu when JS is disabled
	url(r'^(?P<pk>[\d]+)/actions/$', views.CommentActionsView.as_view(), name='comment_actions')

]

# ----------------------------------------------------------------------------------------



