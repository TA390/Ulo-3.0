"""ulo URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.10/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""

# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports

# Core django imports
from django.conf import settings
from django.conf.urls import include, url
from django.contrib import admin

# Thrid party app imports

# Project imports
from pages.views import HomeAuthView, NavigationView
from users.views import SignUpView, LoginView, LogoutView

# ----------------------------------------------------------------------------------------


# TO SERVE MEDIA FILES IN DEVELOPMENT ONLY
from django.conf.urls.static import static

# ----------------------------------------------------------------------------------------

urlpatterns = [

	# PAGES APP

	url(r'^$', HomeAuthView.as_view(), name='home'),

	# Site navigation when js is disabled.
	url(r'^navigation/$', NavigationView.as_view(), name='navigation'),


	# POSTS APP

	url(r'^post/', include('posts.urls', namespace='posts')),


	# USERS APP

	url(r'^user/', include('users.urls', namespace='users')),

	url(r'^signup/$', SignUpView.as_view(), name='signup'),

	url(r'^login/(\?redirect_to=(?P<redirect_to>[^<>\'"@]*/))?$', LoginView.as_view(), name='login'),
	
	url(r'^logout/$', LogoutView.as_view(), name='logout'),


	# COMMENTS APP

	url(r'^comment/', include('comments.urls', namespace='comments')),


	# ACCOUNTS APP
	
	url(r'^accounts/', include('accounts.urls', namespace='accounts')),


	# SETTINGS APP

	url(r'^settings/', include('settings.urls', namespace='settings')),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# ----------------------------------------------------------------------------------------



