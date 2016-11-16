# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports

# Core django imports
from django import template

# Thrid party app imports

# Project imports

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

register = template.Library()

# ----------------------------------------------------------------------------------------

@register.filter(is_safe=True, needs_autoescape=False, expects_localtime=False)
def get_id(result):
	
	return result['_id']

# ----------------------------------------------------------------------------------------

@register.filter(is_safe=True, needs_autoescape=False, expects_localtime=False)
def get_source(result):

	return result['_source']

# ----------------------------------------------------------------------------------------

@register.filter(is_safe=True, needs_autoescape=False, expects_localtime=False)
def index_source(result, key):

	return result['_source'][key]

# ----------------------------------------------------------------------------------------



