# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.utils.translation import ugettext_lazy as _

# thrid party app imports

# Project imports

# ----------------------------------------------------------------------------------------




# COMMENT REPORT OPTIONS
# ----------------------------------------------------------------------------------------

SPAM = 1
HATE = 2
EXPLICIT = 3
ABUSIVE = 4
VIOLENT = 5

COMMENT_ISSUES = (

	(SPAM, _('Spam')),
	(HATE, _('Hate speech')),
	(EXPLICIT, _('Sexually explicit')),
	(ABUSIVE, _('Harassment or bullying')),
	(VIOLENT, _('Violent or threatening')),

)

# ----------------------------------------------------------------------------------------



