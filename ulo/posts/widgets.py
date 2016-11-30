# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals
import copy

# Core django imports
from django.forms import TextInput, Widget
from django.forms.utils import flatatt
from django.utils.encoding import force_text
from django.utils.html import format_html, format_html_join
from django.utils.safestring import mark_safe

# Thrid party app imports

# Project imports

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class List(Widget):

	allow_multiple_selected = False


	def __init__(self, attrs=None, choices=()):

		super(List, self).__init__(attrs)
		
		# choices can be any iterable, but we may need to render this widget
		# multiple times. Thus, collapse it into a list so it can be consumed
		# more than once.
		self.choices = list(choices)


	def __deepcopy__(self, memo):

		obj = copy.copy(self)
		
		obj.attrs = self.attrs.copy()
		
		obj.choices = copy.copy(self.choices)
		
		memo[id(self)] = obj
		
		return obj


	def render(self, name, value, attrs=None):

		if value is None:

			value = ''

		final_attrs = self.build_attrs(attrs, name=name)

		output = [format_html('<ul{}>', flatatt(final_attrs))]

		options = self.render_options([value])

		if options:

			output.append(options)

		output.append('</ul>')

		return mark_safe('\n'.join(output))


	def render_option(self, selected_choices, option_value, option_label):
		
		if option_value is None:
		
			option_value = ''
		
		option_value = force_text(option_value)
		
		if option_value in selected_choices:
		
			selected_html = mark_safe(' class="selected"')
		
			if not self.allow_multiple_selected:
				
				# Only allow for a single selection.
				selected_choices.remove(option_value)
		
		else:

			selected_html = ''
		
		return format_html('<li value="{}"{}>{}</li>', option_value, selected_html, force_text(option_label))


	def render_options(self, selected_choices):
		
		# Normalize to strings.
		selected_choices = set(force_text(v) for v in selected_choices)
		
		output = []
		
		for option_value, option_label in self.choices:
			
			output.append(self.render_option(selected_choices, option_value, option_label))

		return '\n'.join(output)

# ----------------------------------------------------------------------------------------

class ContentEditable(TextInput):
	"""
	Render input[type="text] as a contenteditable div with the class "text_input".
	Widget source code: See class Widget and class Select for reference.
	https://github.com/django/django/blob/master/django/forms/widgets.py
	"""

	def __init__(self, attrs=None):
		
		# Run base class __init__
		super(ContentEditable, self).__init__(attrs)


	def render(self, name, value, attrs=None):
		
		# Normalise attrs to a dict
		if attrs is None:
			
			attrs = {}


		# If a value was given add it to the dict
		if value is not None:
			
			self.attrs['value'] = value


		# Remove class from the attrs to prevent it being prefixed with 'data-'
		try:
			
			class_names = 'class=' + self.attrs.pop('class')
		except KeyError:
			
			class_names = ''
		

		# Convert self.attrs to a string - prefix each attribute name with 'data-'
		attributes = self.flatatt_prefixed(self.attrs, 'data-')
		
		# Set all attributes on the div
		output = [

			format_html(
				
				'<div{} {}{} contenteditable="true">', 
				flatatt(attrs),
				class_names,
				attributes
			
			),

			'</div>'

		]

		return mark_safe('\n'.join(output))


	def flatatt_prefixed(self, attrs, prefix=None):
		"""
		SEE: https://github.com/django/django/blob/master/django/forms/utils.py.
		
		Convert a dictionary of attributes to a single string.
		
		@param prefix: optional prefix given to each key.

		"""

		# Build an array of tuples (key, value)
		key_value_attrs = []
		
		# Build an array of tuples without any values (key,)
		boolean_attrs = []

		# Normalise prefix to a string
		if prefix is None: 

			prefix = ''


		# Append each key (attr), value pair to the corrent array
		for attr, value in attrs.items():
		
			if isinstance(value, bool):

				if value:
				
					boolean_attrs.append((attr,))
			
			else:
			
				key_value_attrs.append((prefix+attr, value))


		return (

			format_html_join('', ' {}="{}"', key_value_attrs) +
			format_html_join('', ' {}', boolean_attrs)
		
		)

# ----------------------------------------------------------------------------------------



