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
from .utils import CATEGORIES, COMMENT_SETTINGS, ENABLED, POST_ISSUES, OPTIONS
from ulo.models import UloModel

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class Post(UloModel):
	"""
	Table for user generated posts.
	"""
	
	# ------------------------------------------------------------------------------------

	def file_path(self, filename):
		"""
		Create file path for the images/video in the user's post
		"""
		
		return 'posts/%s/%s' %(timezone.now().strftime("%m-%y"), filename)

	# ------------------------------------------------------------------------------------


	# POST (REQUIRED) FIELDS
	# ------------------------------------------------------------------------------------
	
	# Video file
	file = models.FileField(
	
		_('Add video'),
		max_length=200,
		upload_to=file_path,
	
	)

	# Video thumbnail
	thumbnail = models.ImageField(
	
		_('Media thumbnail'),
		max_length=220,
		upload_to=file_path,
	
	)
	
	# Title of the post
	title = models.CharField(
	
		_('title'), 
		max_length=100,
		help_text=_('Title your post.'),
	
	)

	# END POST (REQUIRED) FIELDS
	# ------------------------------------------------------------------------------------


	# POST (OPTIONAL) FIELDS
	# ------------------------------------------------------------------------------------
	
	category = models.PositiveSmallIntegerField(
	
		_('category'), 
		choices=CATEGORIES,
		blank=True,
		null=True
	
	)
	
	# VARCHAR is faster when searching the entire contents of a field
	description = models.CharField(
	
		_('description'), 
		max_length=400,
		blank=True
	
	)

	# END POST (OPTIONAL) FIELDS
	# ------------------------------------------------------------------------------------


	# SETTINGS FIELDS
	# ------------------------------------------------------------------------------------
	
	comment_settings = models.PositiveSmallIntegerField(
	
		_('comments'),
		choices=COMMENT_SETTINGS,
		default=ENABLED
	
	)

	# END SETTINGS FIELDS
	# ------------------------------------------------------------------------------------


	# ACCESS FIELDS
	# ------------------------------------------------------------------------------------
	
	is_active = models.BooleanField(
	
		_('post status'),
		default=True,
	
	)
	
	# END ACCESS FIELDS
	# ------------------------------------------------------------------------------------


	# INFO FIELDS
	# ------------------------------------------------------------------------------------

	published = models.DateTimeField(
	
		_('published'), 
		default=timezone.now,
	
	)

	comments_count = models.PositiveIntegerField(_('Comments counter'), default=0)

	# END INFO FIELDS
	# ------------------------------------------------------------------------------------


	# VIDEO FIELDS
	# ------------------------------------------------------------------------------------

	views = models.BigIntegerField(
	
		_('views'),
		default=0,
	
	)

	duration = models.DecimalField(

		_('duration'),
		max_digits=10,
		decimal_places=6

	)

	thumbnail_time = models.DecimalField(

		_('thumbnail time'),
		max_digits=10,
		decimal_places=6

	)

	# END VIDEO FIELDS
	# ------------------------------------------------------------------------------------
	

	# DB RELATIONSHIPS
	# ------------------------------------------------------------------------------------
	
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

	### Post has a one-to-many relationship with PostReport.
	### Post has a one-to-many relationship with PostOption.
	### Post has a one-to-many relationship with Comment.

	# END DB RELATIONSHIPS
	# ------------------------------------------------------------------------------------


	class Meta:

		verbose_name = _('post')
		
		verbose_name_plural = _('posts')
		
		ordering = ['-published']


	def __str__(self):

		return self.user.username + ': ' + self.title

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class PostOption(UloModel):
	"""
	The vote options selected by the post creator for his/her post. Options are the 
	buttons which enable user's to vote on the post (e.g. love, like, dislike)
	"""

	# POSTOPTION FIELDS
	# ------------------------------------------------------------------------------------
	
	# Option text e.g. "Like", "Dislike".
	text = models.CharField(
	
		_('text'),
		max_length=20
	
	)

	# Integer value that ids the option e.g. "Like" == 2, "Free Text" == 4.
	option_type = models.PositiveSmallIntegerField(
	
		_('option type'),
		choices=OPTIONS,
	
	)

	# Hexadecimal colour value 
	colour = models.CharField(
	
		_('colour'),
		max_length=30,
		blank=True
	
	)

	# Name that represent the icon - used as a class name to render the icon.
	icon = models.CharField(
	
		_('icon'),
		max_length=30,
		blank=True
	
	)

	# Counter for the number of votes an option has.
	count = models.PositiveIntegerField(
	
		_('votes counter'),
		default=0,
	
	)

	# END POSTOPTION FIELDS
	# ------------------------------------------------------------------------------------


	# DB RELATIONSHIPS
	# ------------------------------------------------------------------------------------

	post = models.ForeignKey(Post, on_delete=models.CASCADE)

	### PostOption has a one-to-many relationship with PostVote.

	# END DB RELATIONSHIPS
	# ------------------------------------------------------------------------------------


	class Meta:

		verbose_name = _('post option')

		verbose_name_plural = _('post options')


	def __str__(self):
	
		return str(self.text)

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class PostVote(UloModel):
	"""
	Table to collect user information on the votes made for a post.
	"""

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

	post = models.ForeignKey(Post, on_delete=models.CASCADE)
	
	postoption = models.ForeignKey(PostOption, on_delete=models.CASCADE)
	
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

	# END DB RELATIONSHIPS
	# ------------------------------------------------------------------------------------


	class Meta:

		verbose_name = _('post vote')

		verbose_name_plural = _('post votes')

		unique_together = ('post', 'user')


	def __str__(self):

		return "user id: " + str(self.user_id) + " postoption id: " + \
			str(self.postoption_id) + " post id: " + str(self.post_id)

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class PostReport(UloModel):
	"""
	Report abuse found in a post.
	"""

	# POSTREPORT (REQUIRED) FIELDS
	# ------------------------------------------------------------------------------------

	issue = models.PositiveSmallIntegerField(

		_('report'),
		choices=POST_ISSUES,
		help_text=_('What is wrong with this post?')

	)

	# END POSTREPORT (REQUIRED) FIELDS
	# ------------------------------------------------------------------------------------


	# POSTREPORT (OPTIONAL) FIELDS
	# ------------------------------------------------------------------------------------

	information = models.TextField(

		_('additional information'),
		max_length=200,
		blank=True,
		help_text=_('Please provide any additional information if you think it will help '
			'us resolve the issue.')

	)

	# END POSTREPORT (OPTIONAL) FIELDS
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

	post = models.ForeignKey(Post, on_delete=models.CASCADE)

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

	# END DB RELATIONSHIPS
	# ------------------------------------------------------------------------------------


	class Meta:

		verbose_name = _('post report')

		verbose_name_plural = _('post reports')


	def __str__(self):

		return self.post.title+': '+self.issue+' (by: '+self.user.username+')'

# ----------------------------------------------------------------------------------------



