# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals
from itertools import islice
import re

# Core django imports
from django.contrib.messages import get_messages
from django.core.exceptions import DisallowedHost
from django.core.urlresolvers import reverse
from django.utils.encoding import force_text

# Thrid party app imports

# Project imports

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

reserved_usernames = (

	'anonymous', 'help', 'post', 'support', 'ulo', 'user', 'username', 'users', 'upload'

)

# ----------------------------------------------------------------------------------------

def get_messages_json(request):
	"""
	Return a json object containing the stored messages. Useful when returning an ajax
	response as it clears the stored messages.
	"""

	storage = get_messages(request)
	
	messages = []

	for m in storage:
		
		messages.append({ 'message': force_text(m.message), 'tags': m.tags })

	return messages

# ----------------------------------------------------------------------------------------

def postfetchmany(cursor, offset, size):
	"""
	Python Database API
	https://www.python.org/dev/peps/pep-0249/
	
	Django Database API
	https://docs.djangoproject.com/en/1.9/topics/db/sql/

	Return N rows from a cursor after it has performed an execute command as a 
	dictionary and boolean that's True if there are more results and False if not.
	
	@param cursor: cursor object
	@param offset: ...
	@para size: number of results to return
	"""

	start = -1

	posts, idx = [], start

	cols = [col[0] for col in cursor.description]

	
	for row in cursor.fetchall():

		if idx!=start and posts[idx]['id']==row[offset]:

			posts[idx]['options'].append(dict(zip(cols[:offset], row)))

		else:

			idx = idx + 1

			if idx==size:

				return posts, True

			tuples = zip(cols, row)
			
			posts.append( dict(tuples, options=[dict(islice(tuples, offset))]) )


	return posts, False

# ----------------------------------------------------------------------------------------

def postfetchone(cursor, offset):
	"""
	Python Database API
	https://www.python.org/dev/peps/pep-0249/
	
	Django Database API
	https://docs.djangoproject.com/en/1.9/topics/db/sql/

	Return the first result or None from a cursor after it has performed an execute 
	command as a dictionary.
	
	@param cursor: cursor object
	@param offset: ...
	"""

	post = None

	cols = [col[0] for col in cursor.description]
		
	for count, row in enumerate(cursor.fetchall()):

		if count == 0:

			tuples = zip(cols, row)
			post = dict(tuples, options=[dict(islice(tuples, offset))])

		else:

			post['options'].append(dict(zip(cols[:offset], row)))


	return post

# ----------------------------------------------------------------------------------------

def dictfetchall(cursor):
	"""
	Python Database API
	https://www.python.org/dev/peps/pep-0249/
	
	Django Database API
	https://docs.djangoproject.com/en/1.9/topics/db/sql/

	Return all rows from a cursor after it has performed an execute command as a 
	dictionary.
	
	@param cursor: cursor object
	"""
	
	columns = [col[0] for col in cursor.description]
	
	return [ dict(zip(columns, row)) for row in cursor.fetchall() ]

# ----------------------------------------------------------------------------------------

def dictfetchmany(cursor, size):
	"""
	Python Database API
	https://www.python.org/dev/peps/pep-0249/
	
	Django Database API
	https://docs.djangoproject.com/en/1.9/topics/db/sql/

	Return the first N rows from a cursor after it has performed an execute command as a 
	dictionary.
	
	@param cursor: cursor object
	"""
	
	columns = [col[0] for col in cursor.description]
	
	return [ dict(zip(columns, row)) for row in cursor.fetchmany(size) ]

# ----------------------------------------------------------------------------------------

def dictfetchone(cursor):
	"""
	Python Database API
	https://www.python.org/dev/peps/pep-0249/
	
	Django Database API
	https://docs.djangoproject.com/en/1.9/topics/db/sql/

	Return the first result or None from a cursor after it has performed an execute 
	command as a dictionary.
	
	@param cursor: cursor object
	"""

	row = cursor.fetchone()
	
	return None if row==None else dict(zip([col[0] for col in cursor.description], row))

# ----------------------------------------------------------------------------------------

def validate_cid(cid):
	"""
	Return cid as an integer or None if the value is an invalid pk.
	
	@param cid: database id.
	"""

	try:
	
		cid = int(cid)
	
		if cid < 0:

			raise ValueError
	
	except (TypeError, ValueError):
	
		cid = None

	return cid

# ----------------------------------------------------------------------------------------

def get_cid(result, cursor, limit, col='cid'):
	"""
	Return a tuple containing a boolean to indicate if there is a more content an the 
	id of the last result.
	
	@param result: results returned by dictfetchall or dictfetchmany
	@param cursor: database cursor that executed the SQL query
	@param limit: max number of results expected
	@param col: column name of the field to use as a cursor
	"""
	
	try:
	
		cid = result[-1][col]
	
	except (KeyError, IndexError):
	
		cid=''

	return cursor.rowcount>limit, cid

# ----------------------------------------------------------------------------------------

def get_referer_path(request, redirect=False, error_path=None):
	"""
	Return the previous path. Form data submitted via a GET request can define an
	input element with the name 'http_referer' as a fallback path if 'HTTP_REFERER' is 
	not defined.
	
	@param request: request object.
	@param redirect: if True redirect the url to the login page.
	@param error_path: url to navigate to if the http referrer cannot be found.
	"""
	
	try:
		
		# Check if the url can be found by the header HTTP_REFERER
		referer = request.META.get('HTTP_REFERER')
		
		if referer is not None:
		
			host, path = re.sub('^https?:\/\/', '', referer).split('/', 1)
		
			if host != request.get_host():
		
				raise ValueError('Host and Referer are not equal.')
		

		# Else check the request object to see if GET defined a 'http_referer' path
		else:
		
			path = request.GET.get('http_referer', '')[1:]
		
			if path is '':
		
				raise ValueError('Http Referer not found.')


		# Return the url with the optional redirect
		return (reverse('login')+'?redirect_to=/' if redirect else '/')+path

	# If all attempts fail return to the home page.
	except (AttributeError, DisallowedHost, ValueError):
		
		return reverse('home') if error_path is None else error_path

# ----------------------------------------------------------------------------------------



