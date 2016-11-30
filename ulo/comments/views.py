# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.conf import settings
from django.contrib import messages
from django.contrib.auth import get_user_model
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.urlresolvers import reverse
from django.db import transaction
from django.db.models import F
from django.http import Http404, HttpResponseForbidden, JsonResponse
from django.shortcuts import get_object_or_404, render, redirect
from django.utils.functional import cached_property
from django.views.generic.edit import DeletionMixin

# Thrid party app imports

# Project imports
from .forms import CommentReportForm
from .models import Comment
from posts.models import Post
from ulo.sessions import LinkViewsSession
from ulo.utils import get_referer_path
from ulo.views import UloView, UloFormView, UloUpdateView, UloUploadView
from ulo.viewmixins import UloOwnerRequiredMixin

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class CommentReportView(LoginRequiredMixin, UloFormView):
	"""
	Render a form that allows the user to report an issue with a post.
	"""

	validate_csrf = True
	redirect_field_name = 'redirect_to'
	template_name = 'comments/comment_report.html'
	form_class = CommentReportForm


	def get_success_url(self):
		"""
		Redirect to the "report received" page.
		"""

		LinkViewsSession(self.request).set('comment_report', True)

		return reverse('comments:comment_report_complete')

		
	def get_form_kwargs(self):
		"""
		Fill the form with all the information required to render the page.
		"""

		# Get the default kwargs
		kwargs = super(CommentReportView, self).get_form_kwargs()

		try:

			comment_id = self.kwargs['pk']


			if self.request.is_ajax():
				
				# Raise an exception if the post does not exists.

				if Comment.objects.filter(id=comment_id).exists() == False:
				
					raise Comment.DoesNotExist()

			else:

				# Include the comment to render a summary.

				kwargs['comment'] = Comment.objects.select_related('user').get(id=comment_id)


		except (KeyError, Comment.DoesNotExist):

			raise Http404()


		## Set the IDs on the report instance in the form when successful.

		kwargs.update({

			'comment_id': comment_id,
			'user_id': self.request.user.id 

		})

		return kwargs


	def form_valid(self, form):
		"""
		Create the report and redirect to the complete page.
		"""
		
		form.save()
		
		self.force_html = form.cleaned_data['pip']
		
		return super(CommentReportView, self).form_valid(form)

# ----------------------------------------------------------------------------------------

class CommentReportCompleteView(LoginRequiredMixin, UloView):
	"""
	Display page informing the user that their report has been received.
	"""

	redirect_field_name = 'redirect_to'
	template_name = 'comments/comment_report_complete.html'

	def get(self, request, *args, **kwargs):
		
		if LinkViewsSession(request).get('comment_report'):
		
			return super(CommentReportCompleteView, self).get(request, *args, **kwargs)
		
		raise Http404()

# ----------------------------------------------------------------------------------------

class CommentActionsView(LoginRequiredMixin, UloView):
	"""
	Javascript Disabled.
	Rendered when a user does not have javascript enabled and tries to perform an comment
	action on a post (e.g. report an issue or delete own comment). The view renders a menu 
	with links to each actions page.
	"""
	
	redirect_field_name = 'redirect_to'
	template_name = 'comments/comment_actions.html'

	def get(self, request, pk, *args, **kwargs):

		try:
		
			comment = Comment.objects.select_related('user').get(pk=pk)
		
		except Comment.DoesNotExist:
		
			raise Http404()


		kwargs.update({

			'comment':comment,
			'is_owner': comment.user_id==request.user.pk,
			'back_url': reverse('posts:detail', args=(comment.post_id,))
		
		})

		return super(CommentActionsView, self).get(request, pk, *args, **kwargs)

# ----------------------------------------------------------------------------------------

class CommentDeleteView(UloOwnerRequiredMixin, DeletionMixin, UloView):
	"""
	
	Delete the authenticated user's comment.
	
	"""
	
	template_name = 'comments/comment_delete.html'

	redirect_field_name = 'redirect_to'

	id_field = 'user_id'

	model_class = Comment


	def get(self, request, pk, *args, **kwargs):

		raise Http404()


	@cached_property
	def comment_post(self):

		return Post.objects.get(pk=self.instance.post_id);


	def get_success_url(self):

		return reverse('posts:detail', args=(self.comment_post.id,))


	def get_object(self):

		return self.instance


	@transaction.atomic
	def delete(self, request, *args, **kwargs):

		self.comment_post.comments_count = F('comments_count') - 1

		self.comment_post.save()

		response = super(CommentDeleteView, self).delete(request, *args, **kwargs)

		# Do not return any html if the request is an ajax request.
		return (JsonResponse({}, status=200) if request.is_ajax() else response)

# ----------------------------------------------------------------------------------------



