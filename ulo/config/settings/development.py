"""

Development settings.

Quick-start development settings - unsuitable for production
See https://docs.djangoproject.com/en/1.10/howto/deployment/checklist/

"""

# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports

# Core django imports

# Thrid party app imports

# Project imports
from .base import * 

# ----------------------------------------------------------------------------------------




# APPLICATION SETTINGS
# ----------------------------------------------------------------------------------------

ALLOWED_HOSTS = []

INSTALLED_APPS += ('debug_toolbar',)

# ----------------------------------------------------------------------------------------




# DEBUG SETTINGS
# ----------------------------------------------------------------------------------------

DEBUG = True

# Display detailed report for any exception raised during template rendering
TEMPLATES[0]['OPTIONS']['debug'] = DEBUG

# ----------------------------------------------------------------------------------------




# DEBUG TOOLBAR
# ----------------------------------------------------------------------------------------

# django-debug-toolbar

DEBUG_TOOLBAR_CONFIG = {

    'DISABLE_PANELS': [

        'debug_toolbar.panels.redirects.RedirectsPanel',

    ],

    'SHOW_TEMPLATE_CONTEXT': True,

}

MIDDLEWARE += ('debug_toolbar.middleware.DebugToolbarMiddleware',)

# ----------------------------------------------------------------------------------------




# CACHE SETTINGS
# ----------------------------------------------------------------------------------------

CACHES = {

    'default': {

        'BACKEND': 'django.core.cache.backends.memcached.PyLibMCCache',
        'LOCATION': '127.0.0.1:11211',

    },

    'fallback': {

        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',

    }
}

# ----------------------------------------------------------------------------------------




# DATABASE
# ----------------------------------------------------------------------------------------

# https://docs.djangoproject.com/en/1.10/ref/settings/#databases

DATABASES = {

    'default': {

        'ENGINE': 'django.db.backends.mysql', 
        'NAME': 'ulo3_db', 
        'USER': 'root', 
        'PASSWORD': '', 
        'HOST': '', 
        'PORT': '',      
    
    }

}

# ----------------------------------------------------------------------------------------




# SESSION SETTINGS
# ----------------------------------------------------------------------------------------

SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'

# ----------------------------------------------------------------------------------------




# EMAIL SETTINGS
# ----------------------------------------------------------------------------------------

DEFAULT_FROM_EMAIL = 'noreply@ulo.com'


# SMTP host and port

EMAIL_HOST = 'localhost'

EMAIL_PORT = 1025


# SMPT server authentication

#EMAIL_HOST_USER

#EMAIL_HOST_PASSWORD


# Secure connection settings

#EMAIL_USE_TLS

#EMAIL_USE_SSL

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# ----------------------------------------------------------------------------------------




# SECRET KEY SETTINGS - SECURITY WARNING: keep the secret key used in production secret!
# ----------------------------------------------------------------------------------------

SECRET_KEY = get_env_variable('DEV_SK')

# ----------------------------------------------------------------------------------------




# PRODUCTION SETTINGS
# ----------------------------------------------------------------------------------------

# STATIC_ROOT = BASE_DIR.child('media')

# STATICFILES_STORAGE = 'whitenoise.django.GzipManifestStaticFilesStorage'

# import dj_database_url

# DATABASES = {

#     'default': dj_database_url.config()

# }

# SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# ALLOWED_HOSTS = ['*']

# DEBUG = False

# ----------------------------------------------------------------------------------------



