# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

import json, uuid
from datetime import date, datetime
from decimal import Decimal

# Core django imports

# Thrid party app imports

# Project imports

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class JSONSerializer(object):
	"""
	Taken from:
	https://github.com/elastic/elasticsearch-py/blob/master/elasticsearch/serializer.py
	"""

	def default(self, data):

		if isinstance(data, (date, datetime)):
		
			return data.isoformat()
		
		elif isinstance(data, Decimal):
		
			return float(data)
		
		elif isinstance(data, uuid.UUID):
		
			return str(data)
		
		raise TypeError("Unable to serialize %r (type: %s)" % (data, type(data)))


	def dumps(self, data, encode=True):

		# Do not serialise strings
		if isinstance(data, (str, bytes)) == False:

			data = json.dumps(data, default=self.default, ensure_ascii=False)

		return data.encode('utf8') if encode == True else data


	def loads(self, s):

		return json.loads(s)

# ----------------------------------------------------------------------------------------

serialiser = JSONSerializer()

# ----------------------------------------------------------------------------------------



