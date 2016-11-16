# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports

# Thrid party app imports

# Project imports

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class LinkViewsSession(object):
	"""
	Use sessions to link requests between views by first settings a variable in one view
	and retrieving it in another.
	"""

	def __init__(self, request):

		self.session = request.session


	def set(self, key, value):

		self.session[key] = value


	def get(self, key):
		
		try:
		
			value = self.session[key]
		
			del self.session[key]
		
			return value
		
		except KeyError:
		
			return None 

# ----------------------------------------------------------------------------------------



