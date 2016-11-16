# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.utils.translation import ugettext_lazy as _

# Thrid party app imports

# Project imports

# ----------------------------------------------------------------------------------------




# DEFAULT IMAGE PATHS WHEN A USER HAS NO PROFILE PICTURE
# ----------------------------------------------------------------------------------------

DEFAULT_PROFILE_PICTURE = 'default/profile.jpg'

DEFAULT_PROFILE_THUMBNAIL = 'default/profile_thumb.jpg'

# ----------------------------------------------------------------------------------------




# ACCOUNT BLOCKS
# ----------------------------------------------------------------------------------------

NO_BLOCK = ''

ABUSE = '1'

NOT_MY_ACCOUNT = '2'


BLOCKS = (

	(NO_BLOCK, ''),
	(ABUSE, _('Your account has been suspended due to misconduct.')),
	(NOT_MY_ACCOUNT, _('This account has been reported as belonging to another user.')),

)

BLOCK_LEVELS = {
	
	NO_BLOCK: 0,
	ABUSE: 10,
	NOT_MY_ACCOUNT: 20

}

# ----------------------------------------------------------------------------------------




# GENDER
# ----------------------------------------------------------------------------------------

MALE = 'M'

FEMALE = 'F'

NO_GENDER = None


GENDERS = (

	(NO_GENDER, '---'),
	(MALE, _('Male')),
	(FEMALE, _('Female')),

)

# ----------------------------------------------------------------------------------------



