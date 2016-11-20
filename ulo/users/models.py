# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.hashers import check_password
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core import validators
from django.core.urlresolvers import reverse
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.utils.crypto import salted_hmac
from django.utils.translation import ugettext_lazy as _

# Thrid party app imports

# Project imports
from .search import user_search
from .utils import (

	BLOCKS, BLOCK_LEVELS, DEFAULT_PROFILE_PICTURE, DEFAULT_PROFILE_THUMBNAIL, GENDERS, 
	NO_BLOCK

)
from ulo.models import UloModel, UloUserModel, set_str_id

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class UserModelBackend(ModelBackend):
	"""
	User authentication backend.
	https://docs.djangoproject.com/en/1.9/topics/auth/customizing/#auth-custom-user
	
	If a backend raises a PermissionDenied exception, authentication will immediately 
	fail. Django will not check the backends that follow.
	"""

	def authenticate(self, email=None, password=None, **kwargs):

		UserModel = get_user_model()

		
		if email == None:

			email = kwargs.get(UserModel.USERNAME_FIELD)


		try:
		
			# Natural key will be the field defined by the 'USERNAME_FIELD'
			user = UserModel._default_manager.get_by_natural_key(email)

			if user.check_password(password):

				return user

		except UserModel.DoesNotExist:
		
			# Run the default password hasher to reduce the timing difference between 
			# an existing and a non-existing user (#20760).
			UserModel().set_password(password)

# ----------------------------------------------------------------------------------------

class UserManager(BaseUserManager):

	def _create_user(self, email, username, name, password, **extra_fields):
		"""
		Create a new user.
		"""
		
		# Check that all required fields are present.
		if not email or not username or not name or not password:
			
			raise ValueError('Required fields missing. User was not created')
		

		# Create user instance.
		user = self.model(

			email=email.strip().lower(), 
			username=username.strip().lower(), 
			name=name.strip(),
 			**extra_fields
		
		)
		
		# Hash password
		user.set_password(password)

		# Save user to database
		user.save(using=self._db)
		
		return user


	# Must list all required fields as parameters for this function.
	def create_user(self, email, username, name, password, **extra_fields):
		"""
		Create a new user.
		"""
		
		extra_fields.setdefault('is_staff', False)
		
		extra_fields.setdefault('is_superuser', False)
		
		return self._create_user(email, username, name, password, **extra_fields)


	# Must list all required fields as parameters for this function.
	def create_superuser(self, email, username, name, password, **extra_fields):
		"""
		Create a new super user.
		"""
		
		extra_fields.setdefault('is_staff', True)
		
		extra_fields.setdefault('is_superuser', True)


		if extra_fields.get('is_staff') is not True:
		
			raise ValueError('Superuser must have is_staff=True.')

		
		if extra_fields.get('is_superuser') is not True:
		
			raise ValueError('Superuser must have is_superuser=True.')


		return self._create_user(email, username, name, password, **extra_fields)

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class User(UloUserModel, PermissionsMixin):
	
	# ------------------------------------------------------------------------------------

	def file_path(instance, filename):
		"""
		Create file path for the uploaded image
		"""
		
		return 'profile/%s/%s' %(timezone.now().strftime("%m-%y"), filename)

	# ------------------------------------------------------------------------------------


	# USER (REQUIRED) FIELDS
	# ------------------------------------------------------------------------------------

	# password is defined in AbstractBaseUser as:
	### password = models.CharField(_('password'), max_length=128)
	
	email = models.EmailField(
		
		_('email address'),
		max_length=255,
		unique=True,
		error_messages={
		
			'unique': _('This email address has already been registered.'),
		
		},
		help_text=_(
		
			'Please enter your email address.'
		
		),

	)

	username = models.CharField(

		_('username'),
		max_length=30,
		unique=True,
		validators=[
		
			validators.RegexValidator(
		
				r'^\w+$',
				_('Your username can only contain letters, numbers and underscores.'),
		
			),

		],
		error_messages={
		
			'unique': _('This username has been taken.'),
		
		},
		help_text=_(
		
			'Please choose a username. This can be changed later.'
		
		),
	
	)

	name = models.CharField(

		_('name'), 
		max_length=30,
		validators=[
	
			validators.RegexValidator(
	
				r'^[^<>\[\](){}="`\\/+_?!@#^*]+$',
				_('Your name cannot contain special characters.')
	
			),
	
		],
		help_text=_(
	
			'The name displayed on your profile page.'
	
		),

	)
	
	dob = models.DateField(

		_('birthday'),
		help_text=_("Your date of birth."),

	)

	# END USER (REQUIRED) FIELDS
	# ------------------------------------------------------------------------------------


	# USER (NOT REQUIRED) FIELDS
	# ------------------------------------------------------------------------------------
	
	photo = models.ImageField(
	
		_('photo'),
		max_length=200,
		upload_to=file_path,
		default=DEFAULT_PROFILE_PICTURE
	
	)
	
	thumbnail = models.ImageField(
	
		_('thumbnail'),
		max_length=220,
		upload_to=file_path,
		default=DEFAULT_PROFILE_THUMBNAIL

	)
	
	location = models.CharField(
	
		_('location'),
		blank=True,
		max_length=200,
		help_text=_("Your current location.")
	
	)
	
	blurb = models.CharField(
	
		_('blurb'),
		blank=True,
		max_length=180,
		help_text=_(
		
			'Short description about you, your page, or anything you wish to promote.'
		
		)
	
	)

	gender = models.CharField(

		_('gender'),
		blank=True,
		max_length=1,
		choices=GENDERS

	)
	
	# END USER (NOT REQUIRED) FIELDS
	# ------------------------------------------------------------------------------------
	

	# ACCESS FIELDS
	# ------------------------------------------------------------------------------------
	
	is_staff = models.BooleanField(
	
		_('staff status'),
		default=False,
		help_text=_('Designates whether the user can log into this admin site.'),
	
	)
	
	is_active = models.BooleanField(
	
		_('user status'),
		default=True,
		help_text=_(

			'Designates whether this user should be treated as active. '
			'Unselect this instead of deleting accounts.'
		
		),
	
	)
	
	is_verified = models.PositiveSmallIntegerField(
	
		_('email verified'),
		default=0,
		help_text=_(
		
			'Designates whether this user has had their email address verified so that '
			'they are who they claim to be.'
		
		),
	
	)
	
	email_confirmed = models.BooleanField(
	
		_('email confirmation'),
		default=False,
		help_text=_(
		
			'Designates whether this user has confirmed thier email address.'
		
		),
	
	)

	block = models.CharField(
	
		_('account suspended'),
		max_length=2,
		choices=BLOCKS,
		default=NO_BLOCK,
		help_text=_(
		
			'Designates whether this user has had their account suspended'
		
		),
	
	)
	
	# END ACCESS FIELDS
	# ------------------------------------------------------------------------------------


	# INFO FIELDS
	# ------------------------------------------------------------------------------------
	
	# last_login is defined in AbstractBaseUser as:
	### last_login = models.DateTimeField(_('last login'), blank=True, null=True)

	date_joined = models.DateTimeField(
	
		_('date joined'), 
		default=timezone.now,
	
	)

	# Counters
	
	posts_count 	= models.PositiveIntegerField(_('Posts counter'), default=0)
	followers_count = models.PositiveIntegerField(_('Followers counter'), default=0)
	following_count = models.PositiveIntegerField(_('Following counter'), default=0)
	
	# END Counters

	# END INFO FIELDS
	# ------------------------------------------------------------------------------------


	# DB RELATIONSHIPS
	# ------------------------------------------------------------------------------------

	connections = models.ManyToManyField(
	
		'self', 
		symmetrical=False,
		through='Connection',
		through_fields=('from_user', 'to_user')
	
	)

	### User has a one-to-many relationship with Post.
	### User has a one-to-many relationship with PostVote.
	### User has a one-to-many relationship with PostReport.
	### User has a one-to-many relationship with Comment.

	# END DB RELATIONSHIPS
	# ------------------------------------------------------------------------------------


	objects = UserManager()

	# The name of the field used as the unique identifier
	USERNAME_FIELD = 'email'

	# Must contain all required fields and is used only when creating a super user.
	# These will be the fields that the user must enter (plus USERNAME_FIELD)
	REQUIRED_FIELDS = ['username', 'name']


	class Meta:

		verbose_name = _('user')

		verbose_name_plural = _('users')


	def __str__(self):

		return self.email + ": @" + self.username


	# HELPER FUNCTIONS
	# ------------------------------------------------------------------------------------

	def get_full_name(self):

		return self.name


	def get_short_name(self):

		return self.name.partition(' ')[0]

	# ------------------------------------------------------------------------------------

	def is_blocked(self):

		return self.block != NO_BLOCK


	def set_block(self, block, save=False):

		if BLOCK_LEVELS.get(block, 0) > BLOCK_LEVELS.get(self.block, 0):

			self.block = block

		if save==True: 

			self.save()


	def block_message(self):
	
		return next(
	
			(desc for code, desc in BLOCKS if code==self.block), None
	
		)

	# ------------------------------------------------------------------------------------

	def deactivate_account(self):

		self.is_active = False

		self.save()


	def get_absolute_url(self):

		return reverse('users:profile', args=(self.username,))


	def is_following(self, user):
		
		return Connection.objects.filter(from_user=self, to_user=user).exists()

	# ------------------------------------------------------------------------------------

	@property
	def is_staff(self):
		"""
		Is the user a member of staff?
		"""

		return self.is_admin


	def get_session_auth_hash(self):
		"""
		Return a HMAC of the password and block field. 
		
		This is a copy of Django's implementation with the addition of block to 
		invalidate sessions when users have been blocked.

		https://github.com/django/django/blob/master/django/contrib/auth/base_user.py
		"""
		
		key_salt = 'users.models.User.get_session_auth_hash'
		
		return salted_hmac(key_salt, self.password + self.block).hexdigest()


	# END HELPER FUNCTIONS
	# ------------------------------------------------------------------------------------

# ----------------------------------------------------------------------------------------

post_save.connect(set_str_id, sender=User)

# ----------------------------------------------------------------------------------------

class Connection(UloModel):
	
	# on_delete will become a required argument in Django 2.0. Older versions default 
	# to CASCADE. https://docs.djangoproject.com/en/1.9/ref/models/fields/#arguments
	
	from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='from_user')
	
	to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='to_user')
	
	#mirrored = models.BooleanField( _('we follow each other.'), default=False, )

	class Meta:
	
		unique_together = ('from_user', 'to_user')


	def __str__(self):

		return 'from: '+self.from_user.username+', to: '+self.to_user.username

# ----------------------------------------------------------------------------------------

post_save.connect(set_str_id, sender=Connection)

# ----------------------------------------------------------------------------------------


