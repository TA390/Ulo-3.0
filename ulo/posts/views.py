from django.contrib.auth.mixins import LoginRequiredMixin

from ulo.views import UloView


# POST UPLOAD VIEWS
# ----------------------------------------------------------------------------------------

class PostAttrsMixin(object):
	"""
	Define the class attributes common PostView and _PostUploadView.
	"""
	redirect_field_name = 'redirect_to'
	template_name = 'posts/post.html'
	# form_class = PostForm
	# option_class = PostOptionForm

# ----------------------------------------------------------------------------------------

class PostView(PostAttrsMixin, LoginRequiredMixin, UloView):
	"""
	Display the post form to the user.
	"""
	pass

# ----------------------------------------------------------------------------------------