# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from datetime import datetime

# Core django imports
from django import template
from django.utils import timezone
from django.utils.dateparse import parse_datetime

# Thrid party app imports

# Project imports

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

register = template.Library()

# ----------------------------------------------------------------------------------------

months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

# ----------------------------------------------------------------------------------------

def natural_date(value, duration):
	"""
	Return 'value' and 'duration' as an elapsed time string. E.g. 10 days ago.
	"""

	return str(value) + ' ' + duration + ('' if value==1 else 's')+ ' ago'

# ----------------------------------------------------------------------------------------

@register.filter(is_safe=True, needs_autoescape=False, expects_localtime=False)
def short_date(date_time):
	"""
	Return a DateTimeField in the format 'Month Day, Year'.
	"""
	
	try:

		if isinstance(date_time, str):
			
			date_time = parse_datetime(date_time)

		return months[date_time.month] +' '+ str(date_time.day) + ', ' + str(date_time.year)
	
	except Exception:
		
		return ''

# ----------------------------------------------------------------------------------------

@register.filter(is_safe=True, needs_autoescape=False, expects_localtime=False)
def elapsed_time(date_time):
	"""
	Return 'date_time' in the format 'Nt' where N is an integer and t is a letter 
	representing a period of time. y - years, w - weeks, d - days, h - hours, m - minutes, 
	s - seconds.

	@param date_time: DateTimeField

	"""
	try:

		if isinstance(date_time, str):

			date_time = parse_datetime(date_time)


		now = date_time.now() if date_time.tzinfo is None else timezone.now()

		delta = now - date_time

		days = delta.days


		# Years
		if days > 364:

			return str(int(days//365))+"y"

		# Weeks
		if days > 27:

			return str(int(days//7))+"w"

		# Days
		if days > 0:
			
			return str(days)+"d"


		secs = delta.seconds

		# Hours
		t = secs//3600
		
		if t > 0:
		
			return str(int(t))+"h"


		# Minutes
		t = (secs % 3600) // 60
		
		if t > 0:
		
			return str(int(t))+"m"


		# Seconds
		t = secs % 60
		
		if t > 0:
		
			return str(int(t))+"s"


		return 'now'

	except Exception as e:

		print(e)

		return ''

# ----------------------------------------------------------------------------------------

@register.filter(is_safe=True, needs_autoescape=False, expects_localtime=False)
def elapsed_datetime(date_time):
	"""
	Return 'date_time' in the format 'N (days or minutes or seconds) ago' if less than 30
	days old. Else return the date in the format 'Month Day, Year'.
	
	@param date_time: DateTimeField
	"""
	try:

		if isinstance(date_time, str):

			date_time = parse_datetime(date_time)


		now = date_time.now() if date_time.tzinfo is None else timezone.now()

		delta = date_time.now() - date_time

		days = delta.days


		# Date - e.g. Jan 25, 2016
		
		if days > 30:

			return short_date(date_time)


		# Days
		
		if days > 0:
			
			return natural_date(days, 'day')

		secs = delta.seconds


		# Hours

		t = secs // 3600

		if t > 0:

			return natural_date(t, 'hour')


		# Minutes
		
		t = (secs % 3600) // 60
		
		if t > 0:
		
			return natural_date(t, 'minute')


		# Seconds
		
		t = secs % 60
		
		if t > 0:
		
			return natural_date(t, 'second')


		return 'now'

	except Exception as e:

		return ''

# ----------------------------------------------------------------------------------------

@register.filter(is_safe=True, needs_autoescape=False, expects_localtime=False)
def abbreviate(value):
	"""
	Return the abbreviation of 'value' as a string in the format 'Ns' where 'N' is a 
	value between 0 - 100 and 's' is the symbol that represents the value.

	@param value: int or float < 10^18 (Q, Quintillion)

	SYMBOLS TABLE:

		10^3 	'K, Thousand'
		10^6 	'M, Million'
		10^9 	'B, Billion'
		10^12 	't, Trillion'
		10^15 	'q, Quadrillion'
		10^18 	'Q, Quintillion'
		...

	"""
	try:

		unit = 1
		
		mult = 1000
		
		max_value = 1000


		for abbr in ('', 'K', 'M', 'B', 'T', 'Q'):

			if value < max_value:
				
				return str(int(value//unit))+abbr

			unit *= mult
			
			max_value *= mult


		raise ValueError('The number is too large')

	except Exception:
		
		return ''

# ----------------------------------------------------------------------------------------

@register.filter(is_safe=True, needs_autoescape=False, expects_localtime=False)
def percent(value, total):
	"""
	Return 'value' as a percentage of 'total'.
	"""

	try:
	
		return 100*value/total
	
	except (TypeError, ZeroDivisionError):
	
		pass

	return 0

# ----------------------------------------------------------------------------------------

@register.filter(is_safe=True, needs_autoescape=False, expects_localtime=False)
def index(array, index):
	"""
	Return the element in the array at 'index'
	"""

	try:
	
		return array[index]
	
	except (IndexError, TypeError):
	
		pass

	return ''

# ----------------------------------------------------------------------------------------



