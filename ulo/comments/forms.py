# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django import forms
from django.utils.translation import ugettext_lazy as _

# Thrid party app imports

# Project imports
from .models import Comment, CommentReport
from .utils import COMMENT_ISSUES
from ulo.fields import UloPIPField
from ulo.forms import UloModelForm

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class CommentForm(UloModelForm):

	class Meta:

		model = Comment
		
		fields = ('comment',)
		
		widgets = {
		
			'comment': forms.TextInput(
		
				attrs={

					'class': 'box_border',
					'placeholder': 'Leave a comment',
					'autocomplete': 'off'
		
				},
		
			),
		
		}
		
		error_messages = {
		
			'comment': {
		
				'required': _('Please enter a comment.'),
		
				'max_length': _('Please enter a comment less than %(limit_value)s characters long.')
		
			},
		
		}


	def __init__(self, *args, **kwargs):

		# Add a summary of the post for non javascript requests.
		
		self.post = kwargs.pop('post', None)

		self.user_id = kwargs.pop('user_id', None)

		self.post_id = kwargs.pop('post_id', None)

		super(CommentForm, self).__init__(*args, **kwargs)


	def save(self, commit=True):

		# Assign the user and post ids to the Comment instance.

		self.instance.user_id = self.user_id

		self.instance.post_id = self.post_id

		return super(CommentForm, self).save(commit=commit)

# ----------------------------------------------------------------------------------------	

class CommentReportForm(UloModelForm):
	"""
	Form to report an issue with a post.
	"""

	# Indicates whether the form has been loaded within another page.
	pip = UloPIPField()

	issue = forms.ChoiceField(

		widget=forms.RadioSelect(),
		choices=COMMENT_ISSUES,
		initial=0,
		help_text=_('What is wrong with this comment?'),
		error_messages={'required': _('Let us know what the issue is.')}
	
	)


	class Meta:

		model = CommentReport
		
		fields = ('issue',)


	def __init__(self, *args, **kwargs):

		kwargs['auto_id'] = 'comment_%s'

		# Add a summary of the comment/user for non javascript requests.
		self.comment = kwargs.pop('comment', None)

		self.user_id = kwargs.pop('user_id', None)

		self.comment_id = kwargs.pop('comment_id', None)

		super(CommentReportForm, self).__init__(*args, **kwargs)


	def save(self, commit=True):

		# Assign the user and comment ids to the CommentReport instance.
		self.instance.user_id = self.user_id
		
		self.instance.comment_id = self.comment_id

		return super(CommentReportForm, self).save(commit=commit)

# ----------------------------------------------------------------------------------------



