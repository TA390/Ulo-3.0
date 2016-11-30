# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django import forms
from django.db import transaction
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.utils.translation import ugettext_lazy as _

# Thrid party app imports

# Project imports
from .models import Post, PostOption, PostReport
from .search import post_search
from .utils import (

	CATEGORIES, COMMENT_SETTINGS, POST_ISSUES, LOVE_INT, LIKE_INT, DISLIKE_INT, TEXT_INT

)
from .widgets import ContentEditable, List
from ulo.fields import UloPIPField
from ulo.forms import UloModelForm, UloSecureModelForm
from ulo.formmixins import UploadFileMixin

# ----------------------------------------------------------------------------------------




# POST FORMS
# ----------------------------------------------------------------------------------------

class PostForm(UploadFileMixin, UloModelForm):
	"""
	Render a form to create a post.
	"""

	# Add an extra file input field to the form for editor uploads.
	editor_file = forms.FileField(
	
		required=False,
		
		widget=forms.ClearableFileInput(

			attrs={
			
				'accept': 'video/mp4,video/ogg,video/webm',
				'multiple': 'multiple',
				'capture': 'capture',
				'class': 'file'
			
			}
		
		)
	
	)


	class Meta:

		model = Post
		
		fields = (

			'title', 'category', 'description', 'comment_settings', 'file', 'thumbnail',
			'duration', 'thumbnail_time'

		)
		
		widgets = {

			# 'title': ContentEditable(attrs={
			#
			# 	'autofocus':'autofocus', 
			# 	'placeholder':'Title',
			# 	'class': 'text_input'
			#
			# }),

			'title': forms.TextInput(attrs={
			
				'autofocus':'autofocus', 
				'class': 'box_border',
				'placeholder':'Title',
				'autocomplete':'off'
			
			}),

			'file': forms.ClearableFileInput(attrs={
			
				'accept': 'video/mp4, video/ogg, video/webm',
				'multiple': 'multiple',
				'class': 'box_border',
				'capture': 'capture',
				'class': 'file box_border'
			
			}),
			
			'category': List(choices=CATEGORIES),
			
			'comment_settings': List(choices=COMMENT_SETTINGS),
			
			'description': forms.Textarea(attrs={
			
				'class': 'box_border',
				'placeholder': _("What's your post about?")
			
			}),

		}

		error_messages = {

			'file': {

				'missing': _('Please upload a video.'),
				'required': _('Please upload a video.')

			}

		}
		

	def __init__(self, *args, **kwargs):
		"""
		Set the dimension of the thumbnail.
		"""

		kwargs['usize'] = (144, 144)
		
		super(PostForm, self).__init__(*args, **kwargs)


	def add_post_creation_error(self):
		"""
		Default error message.
		"""
		self.add_error(

			None,
			_('Sorry, it looks like we failed to create your post. Please try again.')

		)


	def save(self, commit=True):
		"""
		Set the post owner to the logged in user.
		"""
		
		self.instance.user = self.request.user

		return super(PostForm, self).save(commit)

# ----------------------------------------------------------------------------------------


class PostOptionForm(UloModelForm):
	"""
	Render the option fields as a single li element with data attributes representing the 
	individual field values.
	"""

	options = (

		(LOVE_INT, _('Love'), 'icon_love'),
		
		(LIKE_INT, _('Like'), 'icon_like'),

		(DISLIKE_INT, _('Dislike'), 'icon_dislike')

	)

	option_icons = (

		'icon_love',
		
		'icon_like',
		
		'icon_dislike',
		
		'icon_no',

		'icon_yes',

		'icon_smile',

		'icon_sad',
		
		'icon_tongue',
		
		'icon_angry',
		
		'icon_sick',
		
		'icon_star',

	)

	option_colours = (

		'#0A7DE3',
		
		'#418F1A',

		'#CF2BA4',

		'#EE5728',

		'#E8D427',

		'#FFFFFF',

		'#000000'

	)


	class Meta:

		model = PostOption
		
		fields = ('text', 'icon', 'colour', 'type')
		
		widgets = {
			
			'text': forms.TextInput(
			
				attrs={

					'autocomplete':'off',
					'placeholder': 'Text',
					'class': 'box_border'
			
				}
			
			),
		
		}


	def __init__(self, *args, prefix, **kwargs):
		"""
		Set love to the default selection.
		"""

		self.selected = kwargs.pop('selected', LOVE_INT)

		super(PostOptionForm, self).__init__(*args, prefix=prefix, **kwargs)


	def __str__(self):
		"""
		Render options as a list.
		"""
		return self.as_ul()


	def icons_id(self):
		"""
		Return icon menu id.
		"""
		return self.prefix + '_icons'


	def as_ul(self):
		"""
		Render options drop down menu.
		"""

		output = [format_html('<ul id="{}" name="{}", class="options">', self.prefix, self.prefix)]


		for type_id, text, icon in self.options:


			li_class = 'table selected' if type_id == self.selected else 'table'


			output.append( 

				format_html(

					"""
					<li class="{}" data-type="{}">

						<div class="cell option">

							<span class="selected font_icon {}"></span>

						</div>

						<div class="cell content">

							<span class="text ellipsis">{}</span>

						</div>

					</li>
					""", 

					li_class, type_id, icon, text

				) 

			)


		output.append( 

			format_html(

				"""
				<li class="table" data-type="{}">

					<div class="cell option">

						<button class="toggle_icons" type="button" data-toggle="{}">
						
							<span class="selected font_icon icon_smile"></span>

						</button>

					</div>

					<div class="cell content">

						<input type="text" class="text box_border" name="{}" placeholder="Text" autocomplete="off">

					</div>

				</li>
				""",

				TEXT_INT, self.icons_id(), self.prefix

			) 

		)


		output.append('</ul>')

		return mark_safe('\n'.join(output))


	def icons(self):
		"""
		Render icon menu.
		"""

		output = [format_html('<ul id="{}" class="icons">', self.icons_id())]


		for icon in self.option_icons:

			output.append(

				format_html(

					'<li class="icon_class{}"><span class="selected font_icon {}"></span></li>', 
					(' default' if icon == 'icon_smile' else ''), icon

				)
			
			)


		for colour in self.option_colours:

			output.append(

				format_html(

					'<li class="colour"><span class="colour" style="background-color: {}"></span></li>', 
					colour

				)
			
			)


		output.append(

			'<li class="colour picker"><span class="icon icon_colour_picker"></span></li>'
			
		)


		output.append('</ul>')

		return mark_safe('\n'.join(output))


	def save(self, post, commit=True):
		"""
		Attempt to save the form if the option is required or it has changed.
		"""

		if self.empty_permitted == False or self.has_changed():
			
			self.instance.post = post

			return super(PostOptionForm, self).save(commit)

# ----------------------------------------------------------------------------------------

class PostUpdateForm(UloSecureModelForm):

	class Meta:
		
		model = Post
		
		fields = ('title', 'category', 'description', 'comment_settings')

		widgets = {

			'description': forms.Textarea()

		}

	def __init__(self, *arg, **kwargs):
		
		super(PostUpdateForm, self).__init__(*arg, **kwargs)
		
		# UloSecureModelForm requires self.instance to be a user object or self.user to be 
		# explicitly set to the user instance so it can check the user's password.
		self.user = self.instance.user

		for name, field in self.fields.items():

			field.widget.attrs.update({

				'class':'box_border',
				'autocomplete': 'off'

			})
		
		self.fields['password'].widget.attrs.update({'placeholder': 'Current password'})


	def add_post_update_error(self):

		self.add_error(

			None,
			_('Sorry, it looks like we failed to update your post. Please try again later.')

		)


	def save(self, commit=True):
		"""
		"""

		try:

			with transaction.atomic():

				post =  super(PostUpdateForm, self).save(commit=commit)

				if commit:

					post_search.update_instance( post )

		except Exception:

			self.add_post_update_error()

			post = None


		return post


# ----------------------------------------------------------------------------------------

class PostReportForm(UloModelForm):
	"""
	Form to report an issue with a post.
	"""

	# Indicates whether the form has been loaded within another page.
	pip = UloPIPField()

	issue = forms.ChoiceField(

		widget=forms.RadioSelect(),
		choices=POST_ISSUES,
		initial=0,
		help_text=_('What is wrong with this post?'),
		error_messages={'required': _('Let us know what the issue is.')}
	
	)


	class Meta:
		
		model = PostReport
		
		fields = ('issue', 'information')

		widgets = {
		
			'information': forms.Textarea(
				attrs={ 'class': 'box_border' }
			),
		}
		
		error_messages = {
		
			'information': {
				'max_length': _('Please explain the issue in %(limit_value)s characters or less.')
			},
		
		}


	def __init__(self, *args, **kwargs):

		# Add a summary of the post for non javascript requests.
		self.post = kwargs.pop('post', None)

		self.user_id = kwargs.pop('user_id', None)

		self.post_id = kwargs.pop('post_id', None)

		super(PostReportForm, self).__init__(*args, **kwargs)


	def save(self, commit=True):

		# Assign the user and post ids to the PostReport instance.
		self.instance.user_id = self.user_id
		
		self.instance.post_id = self.post_id
		
		return super(PostReportForm, self).save(commit=commit)

# ----------------------------------------------------------------------------------------



