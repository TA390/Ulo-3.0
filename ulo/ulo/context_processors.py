# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.conf import settings

# Thrid party app imports

# Project imports
from search.utils import search_filters

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

SITE_NAME_KEY = 'site_name'

# ----------------------------------------------------------------------------------------

BASE_TEMPLATE_KEY = 'base_template'

BASE_TEMPLATE_NAME = 'base.html'

BASE_AJAX_TEMPLATE_NAME = 'base_ajax.html'

# ----------------------------------------------------------------------------------------

SEARCH_FILTER_KEY = 'query_filter'

SEARCH_FILTER_VALUE_KEY = 'query_filter_value'

# ----------------------------------------------------------------------------------------

def base_template(request):
	
	template = BASE_AJAX_TEMPLATE_NAME if request.is_ajax() else BASE_TEMPLATE_NAME
	
	return {

		BASE_TEMPLATE_KEY: template,
		SITE_NAME_KEY: settings.SITE_NAME,
		SEARCH_FILTER_KEY: search_filters,
		SEARCH_FILTER_VALUE_KEY: search_filters.get(request)

	}

# ----------------------------------------------------------------------------------------

