# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.views.generic import TemplateView

# Thrid party app imports

# Project imports
from ulo.views import UloView

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class HomeView(UloView):

	template_name = 'pages/home.html'

# ----------------------------------------------------------------------------------------

class NavigationView(UloView):

	template_name = 'pages/navigation.html'

# ----------------------------------------------------------------------------------------



