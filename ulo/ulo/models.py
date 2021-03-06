# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.contrib.auth.models import AbstractBaseUser
from django.db import models, transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.translation import ugettext_lazy as _


# Thrid party app imports


# Project imports

# ----------------------------------------------------------------------------------------

class UloModel(models.Model):

	# ------------------------------------------------------------------------------------

	# Supports values from 1 to 9223372036854775807.

	id = models.BigAutoField(primary_key=True)

	# ------------------------------------------------------------------------------------

	# String representation of the id field.

	str_id = models.CharField(
		
		_('String id'),

		max_length=20,

	)

	# ------------------------------------------------------------------------------------

	class Meta:

		abstract = True

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class UloUserModel(AbstractBaseUser):

	# ------------------------------------------------------------------------------------

	# Supports values from 1 to 9223372036854775807.

	id = models.BigAutoField(primary_key=True)

	# ------------------------------------------------------------------------------------

	# String representation of the id field.

	str_id = models.CharField(
		
		_('String id'),

		max_length=20,

	)

	# ------------------------------------------------------------------------------------

	class Meta:

		abstract = True

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

def set_str_id(sender, instance, created, **kwargs):
	
	if created == True:

		instance.str_id = str(instance.id)

		instance.save()

# ----------------------------------------------------------------------------------------



