"""
WSGI config for ulo project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/1.10/howto/deployment/wsgi/
"""

# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
import os

# Core django imports
from django.core.wsgi import get_wsgi_application

# Thrid party app imports

# Project imports

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

application = get_wsgi_application()

# ----------------------------------------------------------------------------------------



