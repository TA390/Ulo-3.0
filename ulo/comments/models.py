# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _


# Thrid party app imports

# Project imports
from .utils import COMMENT_ISSUES
from posts.models import Post
from ulo.models import UloModel

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class Comment(UloModel):
	"""
	Comment on a post.
	"""

	# COMMENT (REQUIRED) FIELDS
	# ------------------------------------------------------------------------------------
	
	comment = models.CharField(
	
		_('comment'),
		max_length=200,
	
	)
	
	# END COMMENT (REQUIRED) FIELDS
	# ------------------------------------------------------------------------------------


	# INFO FIELDS
	# ------------------------------------------------------------------------------------
	
	published = models.DateTimeField(
	
		_('published'), 
		default=timezone.now,
	
	)
	
	# END INFO FIELDS
	# ------------------------------------------------------------------------------------


	# ACCESS FIELDS
	# ------------------------------------------------------------------------------------
	
	is_active = models.BooleanField(

		_('comment status'),
		default=True,

	)
	
	# END ACCESS FIELDS
	# ------------------------------------------------------------------------------------


	# DB RELATIONSHIPS
	# ------------------------------------------------------------------------------------

	post = models.ForeignKey(Post, on_delete=models.CASCADE)
	
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

	# END DB RELATIONSHIPS
	# ------------------------------------------------------------------------------------


	class Meta:
	
		verbose_name = _('comment')
	
		verbose_name_plural = _('comments')
	
		ordering = ['-published']


	def __str__(self):

		return self.comment + ': (by: ' + self.user.username + ')'

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class CommentReport(UloModel):
	"""
	Report abuse found in a comment.
	"""

	# COMMENTREPORT (REQUIRED) FIELDS
	# ------------------------------------------------------------------------------------
	
	issue = models.PositiveSmallIntegerField(
	
		_('report'),
		choices=COMMENT_ISSUES,
		help_text=_('What is wrong with this comment?')
	
	)
	
	# END COMMENTREPORT (REQUIRED) FIELDS
	# ------------------------------------------------------------------------------------


	# INFO FIELDS
	# ------------------------------------------------------------------------------------
	
	published = models.DateTimeField(
	
		_('published'), 
		default=timezone.now,
	
	)
	
	# END INFO FIELDS
	# ------------------------------------------------------------------------------------


	# DB RELATIONSHIPS
	# ------------------------------------------------------------------------------------

	comment = models.ForeignKey(Comment, on_delete=models.CASCADE)
	
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

	# END DB RELATIONSHIPS
	# ------------------------------------------------------------------------------------


	class Meta:
	
		verbose_name = _('comment report')
	
		verbose_name_plural = _('comment reports')


	def __str__(self):

		return self.issue+' (by: '+self.user.username+')'

# ----------------------------------------------------------------------------------------



