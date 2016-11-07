"""

Production settings.

"""

# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports

# Core django imports

# Thrid party app imports

# Project imports
from .base import * 

# ----------------------------------------------------------------------------------------




# ADMIN/MANAGER SETTINGS
# ----------------------------------------------------------------------------------------

# See: https://docs.djangoproject.com/en/1.10/ref/settings/#admins
# List of individuals that receive error notifications when DEBUG=False
ADMINS = (('IT', 'ENTER EMAIL'),)

MANAGERS = (('IT', 'ENTER EMAIL'),)


# See: https://docs.djangoproject.com/en/1.10/ref/settings/#server-email
# The email address that error messages will be sent from
SERVER_EMAIL = 'error@ulo.com'


# ADMIN_URL = get_env_variable('ADMIN_URL')

# ----------------------------------------------------------------------------------------




# APPLICATION SETTINGS
# ----------------------------------------------------------------------------------------

# See: https://docs.djangoproject.com/en/1.10/ref/settings/#allowed-hosts
# Access request.META via get_host() only! to not bypass django's security check 
ALLOWED_HOSTS = []

# ----------------------------------------------------------------------------------------




# CACHE SETTINGS
# ----------------------------------------------------------------------------------------

# MEMCACHE!!!!!!!!

# ----------------------------------------------------------------------------------------




# DATABASE SETTINGS
# ----------------------------------------------------------------------------------------

# Keep database connection open for N seconds (None==unlimited persistent connection)
CONN_MAX_AGE = 600

DATABASES = {

    'default': {

        'ENGINE':   get_env_variable('DB_ENGINE'),
        'NAME':     get_env_variable('DB_NAME'),
        'USER':     get_env_variable('DB_USER'),
        'PASSWORD': get_env_variable('DB_PASSWORD'),
        'HOST':     get_env_variable('DB_HOST'),
        'PORT':     get_env_variable('DB_PORT'),
        'CONN_MAX_AGE': CONN_MAX_AGE

    }

}

# ----------------------------------------------------------------------------------------




# DEBUG SETTINGS
# ----------------------------------------------------------------------------------------

# Suppress error messages
DEBUG = False

TEMPLATES[0]['OPTIONS']['debug'] = DEBUG

# ----------------------------------------------------------------------------------------




# EMAIL SETTINGS
# ----------------------------------------------------------------------------------------

DEFAULT_FROM_EMAIL = 'noreply@ulo.com'


# SMTP host and port

EMAIL_HOST = 'localhost'

EMAIL_PORT = 1025


# SMPT server authentication

#EMAIL_HOST_USER = get_env_variable('EMAIL_USER')

#EMAIL_HOST_PASSWORD = get_env_variable('EMAIL_PASSWORD')


# Secure connection settings

#EMAIL_USE_TLS

#EMAIL_USE_SSL

#EMAIL_TIMEOUT

#EMAIL_SSL_KEYFILE

#EMAIL_SSL_CERTFILE

#EMAIL_BACKEND

# ----------------------------------------------------------------------------------------




# SECRET KEY SETTINGS - SECURITY WARNING: keep the secret key used in production secret!
# ----------------------------------------------------------------------------------------

SECRET_KEY = get_env_variable('DEV_SK')

# ----------------------------------------------------------------------------------------




# SECURITY SETTINGS
# ----------------------------------------------------------------------------------------

# See: https://docs.djangoproject.com/en/1.10/ref/settings/#csrf-cookie-secure
# Only send csrf tokens if the connection is HTTPS
CSRF_COOKIE_SECURE = True

# See: https://docs.djangoproject.com/en/1.10/ref/settings/#secure-browser-xss-filter
SECURE_BROWSER_XSS_FILTER = True

# See: https://docs.djangoproject.com/en/1.10/ref/settings/#secure-content-type-nosniff
SECURE_CONTENT_TYPE_NOSNIFF = True

# See: https://docs.djangoproject.com/en/1.10/ref/settings/#secure-hsts-include-subdomains
# Make sure all SSL cetificates are up to date and all subdomains of the site use HTTPS
SECURE_HSTS_INCLUDE_SUBDOMAINS = True

# See: https://docs.djangoproject.com/en/1.10/ref/settings/#secure-hsts-seconds
SECURE_HSTS_SECONDS = 31536000 # 1 year

# See: https://docs.djangoproject.com/en/1.10/ref/settings/#secure-ssl-redirect
# Redirect non-HTTPS requests to HTTPS
SECURE_SSL_REDIRECT = True

# See: https://docs.djangoproject.com/en/1.10/ref/settings/#session-cookie-secure
# Only accept a session cookie sent over a HTTPS connection
SESSION_COOKIE_SECURE = True

# ----------------------------------------------------------------------------------------




# SECTIONS TO REREAD/IMPLEMENT BEFORE GOING LIVE
# ----------------------------------------------------------------------------------------

# https://docs.djangoproject.com/en/1.10/ref/settings/#allowed-hosts
# https://docs.djangoproject.com/en/1.10/ref/settings/#disallowed-user-agents
# https://docs.djangoproject.com/en/1.10/ref/settings/#default-from-email
# https://docs.djangoproject.com/en/1.10/ref/settings/#csrf-trusted-origins
# https://docs.djangoproject.com/en/1.10/ref/settings/#file-upload-max-memory-size
# https://docs.djangoproject.com/en/1.10/ref/settings/#file-upload-directory-permissions
# https://docs.djangoproject.com/en/1.10/ref/settings/#file-upload-permissions
# https://docs.djangoproject.com/en/1.10/ref/settings/#ignorable-404-urls
# https://docs.djangoproject.com/en/1.10/ref/settings/#prepend-www
# https://docs.djangoproject.com/en/1.10/ref/settings/#secure-proxy-ssl-header
# https://docs.djangoproject.com/en/1.10/ref/settings/#use-etags
# https://docs.djangoproject.com/en/1.10/ref/settings/#session-cookie-domain
# https://docs.djangoproject.com/en/1.10/ref/clickjacking/
# https://docs.djangoproject.com/en/1.10/topics/security/#user-uploaded-content-security
# https://docs.djangoproject.com/en/1.10/howto/deployment/checklist/

# CHANGE THE MANAGE.PY FILE TO POINT TO THIS SETTINGS FILE

# ----------------------------------------------------------------------------------------



