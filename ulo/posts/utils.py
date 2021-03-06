# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.utils.translation import ugettext_lazy as _

# Thrid party app imports

# Project imports

# ----------------------------------------------------------------------------------------




# CATEGORY OPTIONS
# ----------------------------------------------------------------------------------------

ANIMALS = 1
ART_AND_DESIGN = 2
COMEDY = 3
EDUCATION = 4
ENTERTAINMENT = 5
FASHION = 6
FOOD = 7
GAMING = 8
MOVIES = 9
MUSIC = 10
NEWS = 11
PHOTOGRAPHY = 12
SPORTS = 13
VLOG = 14

CATEGORIES = (

	(ANIMALS, _('Animals')),
	(ART_AND_DESIGN, _('Art & Design')),
	(COMEDY, _('Comedy')),
	(EDUCATION, _('Education')),
	(ENTERTAINMENT, _('Entertainment')),
	(FASHION, _('Fashion')),
	(FOOD, _('Food')),
	(GAMING, _('Gaming')),
	(MOVIES, _('Movies')),
	(MUSIC, _('Music')),
	(NEWS, _('News')),
	(PHOTOGRAPHY, _('Photography')),
	(SPORTS, _('Sports')),
	(VLOG, _('Vlog')),

)

CATEGORIES_LIST = [None] + [name for value, name in CATEGORIES]

def get_category(post):

	if post['category'] == None:

		return None

	return CATEGORIES_LIST[post['category']]

# ----------------------------------------------------------------------------------------




# COMMENT SETTINGS
# ----------------------------------------------------------------------------------------

ENABLED = 1
DISABLED = 2
ANONYMOUS = 3

COMMENT_SETTINGS = (

	(ENABLED, _('Enabled')),
	(DISABLED, _('Disabled')),
	# (ANONYMOUS, _('Anonymous')),

)

# ----------------------------------------------------------------------------------------




# REPORT OPTIONS
# ----------------------------------------------------------------------------------------

SPAM = 1
HATE = 2
EXPLICIT = 3
ABUSIVE = 4
VIOLENT = 5
DISTASTEFUL = 6

POST_ISSUES = (

	(SPAM, _('Spam')),
	(HATE, _('Hateful or abusive')),
	(EXPLICIT, _('Sexually explicit')),
	(ABUSIVE, _('Harassment or bullying')),
	(VIOLENT, _('Violent or threatening')),

)

# ----------------------------------------------------------------------------------------




# PRIVACY SETTINGS
# ----------------------------------------------------------------------------------------

PUBLIC = 1
PRIVATE = 2
FOLLOWERS_ONLY = 3
FOLLOWING_ONLY = 4
TWO_WAY_FOLLOW = 5

PRIVACY_SETTINGS = (

	(PUBLIC, _('Public')),
	(FOLLOWERS_ONLY, _('They follow me')),
	(FOLLOWING_ONLY, _('I follow them')),
	(TWO_WAY_FOLLOW, _('We follow each other')),
	(PRIVATE, _('Only me')),

)

# ----------------------------------------------------------------------------------------




# VOTES
# ----------------------------------------------------------------------------------------

LOVE_INT = 1
LIKE_INT = 2
DISLIKE_INT = 3
TEXT_INT = 4

OPTIONS = (

	(LOVE_INT, _('Love')),
	(LIKE_INT, _('Like')),
	(DISLIKE_INT, _('Dislike')),
	(TEXT_INT, None)

)

# ----------------------------------------------------------------------------------------



