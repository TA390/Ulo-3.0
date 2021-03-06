"""
Django settings for ulo project.

Generated by 'django-admin startproject' using Django 1.10.2.

For more information on this file, see
https://docs.djangoproject.com/en/1.10/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.10/ref/settings/
"""

# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from os import environ

# Core django imports
from django.core.exceptions import ImproperlyConfigured

# Thrid party app imports
from unipath import Path

# Project imports

# ----------------------------------------------------------------------------------------




# GET ENVIRONMENT VARIABLES
# ----------------------------------------------------------------------------------------

def get_env_variable(key):
    """

    See: Two Scoops of Django 1.8 - Chapter 5, pg 52.

    Return the environment variable 'key' or raise an ImproperlyConfigured exception.
    @param key: name of the environment variable.

    """
    try:
    
        return environ[key]
    
    except KeyError:
    
        raise ImproperlyConfigured(
        
            'The environment variable {} does not exist.'.format(key)
        
        )

# ----------------------------------------------------------------------------------------




# CONFIGURATION SETTINGS
# ----------------------------------------------------------------------------------------

ROOT_URLCONF = 'config.urls'

WSGI_APPLICATION = 'config.wsgi.application'

# ----------------------------------------------------------------------------------------




# DIRECTORIES
# ----------------------------------------------------------------------------------------

# Path to ulo/ relative to the position of this file: ulo/config/settings/base.py
BASE_DIR = Path(__file__).ancestor(3)

MEDIA_ROOT = BASE_DIR.child('media')

STATICFILES_DIRS = (BASE_DIR.child('static'),)

# ----------------------------------------------------------------------------------------




# URLS
# ----------------------------------------------------------------------------------------

MEDIA_URL = '/media/'

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.10/howto/static-files/
STATIC_URL = '/static/'

LOGIN_URL = '/login/'

LOGIN_REDIRECT_URL = '/'

LOGOUT_URL = '/logout/'

# ----------------------------------------------------------------------------------------




# APPLICATIONS
# ----------------------------------------------------------------------------------------

INSTALLED_APPS = [

    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'comments',
    'emails',
    'posts',
    'search',
    'ulo',
    'users'

]

# ----------------------------------------------------------------------------------------




# MIDDLEWARE
# ----------------------------------------------------------------------------------------

MIDDLEWARE = [

    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'ulo.middleware.AjaxRequestMiddleware',

]

# ----------------------------------------------------------------------------------------




# TEMPLATES
# ----------------------------------------------------------------------------------------

TEMPLATES = [
    {
    
        'BACKEND': 'django.template.backends.django.DjangoTemplates',

        'DIRS': (BASE_DIR.child('templates'),),
        
        # Email templates are served from the app itself so set to True
        'APP_DIRS': True,
        
        'OPTIONS': {
        
            'context_processors': [
        
                'django.template.context_processors.debug',
                'django.template.context_processors.media',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'ulo.context_processors.base_template',
        
            ],
        
        },
    
    },
]

# ----------------------------------------------------------------------------------------




# PASSWORD
# ----------------------------------------------------------------------------------------

# Custom settings variable listing the fields to check passwords against
USER_ATTRIBUTES = ('name', 'email',)

# Custom settings variable to file with a list of common alpha numeric passwords
COMMON_PASSWORDS_FILE = BASE_DIR.child('ulo', 'common_alnum.txt')

PASSWORD_HASHERS = [

    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    'django.contrib.auth.hashers.BCryptPasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.SHA1PasswordHasher',
    'django.contrib.auth.hashers.MD5PasswordHasher',
    'django.contrib.auth.hashers.CryptPasswordHasher',

]

# https://docs.djangoproject.com/en/1.10/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {

        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',

        'OPTIONS': {

            'user_attributes': USER_ATTRIBUTES

        }

    },
]

# See: https://docs.djangoproject.com/en/1.9/ref/settings/#password-reset-timeout-days
# See NOTE in ulo/tokens.py BaseTokenGenerator before changing this value.
PASSWORD_RESET_TIMEOUT_DAYS = 30

# ----------------------------------------------------------------------------------------




# INTERNATIONALISATION
# ----------------------------------------------------------------------------------------

# https://docs.djangoproject.com/en/1.10/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

# Enable django's translation system
USE_I18N = True

# Enable localised formatting of data.
USE_L10N = True

# Enable timezone aware datetimes.
USE_TZ = True

# ----------------------------------------------------------------------------------------




# FILE UPLOADS
# ----------------------------------------------------------------------------------------
# For maximum performance the chunk sizes (in bytes) should be divisible by 4 and not
# exceed 2GB (2^31 bytes)
# FILE_UPLOAD_MAX_MEMORY_SIZE = 2621440

FILE_UPLOAD_TEMP_DIR = MEDIA_ROOT.child('tmp')

# ----------------------------------------------------------------------------------------




# FORMAT SETTINGS
# ----------------------------------------------------------------------------------------

USE_THOUSAND_SEPARATOR = True

# ----------------------------------------------------------------------------------------




# CSRF SETTINGS
# ----------------------------------------------------------------------------------------
# The view to render when the csrf middleware validation fails.
CSRF_FAILURE_VIEW = 'ulo.views.csrf_failure'

# https://docs.djangoproject.com/en/1.10/ref/settings/#csrf-cookie-httponly
# The hidden csrf token must be sent with all js/ajax requests as this prevents js from
# accessing the CSRF cookie
CSRF_COOKIE_HTTPONLY = True

# ----------------------------------------------------------------------------------------




# USER MODEL
# ----------------------------------------------------------------------------------------

AUTHENTICATION_BACKENDS = ('users.models.UserModelBackend',)

AUTH_USER_MODEL = 'users.User'

# ----------------------------------------------------------------------------------------



# CUSTOM SETTINGS
# ----------------------------------------------------------------------------------------

SITE_DOMAIN = 'Ulo.com'

SITE_NAME = 'Ulo'

# ----------------------------------------------------------------------------------------



