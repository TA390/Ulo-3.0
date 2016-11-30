# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.urlresolvers import reverse
from django.db import connection, IntegrityError, OperationalError, transaction
from django.db.models import F
from django.http import Http404, JsonResponse
from django.shortcuts import redirect
from django.utils.functional import cached_property
from django.utils.translation import ugettext_lazy as _
from django.views.generic.edit import DeletionMixin

# Thrid party app imports

# Project imports
from .forms import PostForm, PostUpdateForm, PostOptionForm, PostReportForm
from .models import Post, PostOption, PostVote
from .search import post_search
from .utils import DISABLED, get_category
from comments.forms import CommentForm
from comments.models import Comment
from ulo.handlers import (
	MediaUploadHandler, MemoryMediaUploadHandler, TemporaryMediaUploadHandler
)
from ulo.sessions import LinkViewsSession
from ulo.utils import (
	dictfetchmany, get_messages_json, get_cid, get_referer_path, postfetchone, 
	validate_cid
)
from ulo.viewmixins import UloLoginRequiredMixin, UloOwnerRequiredMixin
from ulo.views import UloView, UloFormView, UloUpdateView, UloUploadView

# ----------------------------------------------------------------------------------------




# POST UPLOAD VIEWS
# ----------------------------------------------------------------------------------------

class PostAttrsMixin(object):
	"""
	Define the class attributes common to PostView and _PostUploadView.
	"""
	redirect_field_name = 'redirect_to'
	template_name = 'posts/post.html'
	form_class = PostForm
	option_class = PostOptionForm

# ----------------------------------------------------------------------------------------

class PostView(PostAttrsMixin, LoginRequiredMixin, UloView):
	"""
	Render the post form. See below for upload handler.
	"""

	def post(self, request, *args, **kwargs):

		messages.info(request, _('Enable javascript to make a post.'))
		
		return self.get(request, *args, **kwargs)


	def get_context_data(self, **kwargs):
		
		context = super(PostView, self).get_context_data(**kwargs)
		
		context.update({
		
			'form': self.form_class(), 
			'option0': self.option_class(prefix='option0'),
			'option1': self.option_class(prefix='option1', selected=2)
		
		})
		
		return context

# ----------------------------------------------------------------------------------------

class _PostUploadView(PostAttrsMixin, LoginRequiredMixin, UloFormView):
	"""
	Handle the post request of an image or video. Post requests are first sent to 
	PostImageView or PostVideoView. Once the upload handlers have been set the request 
	is passed to this view for processing.
	"""

	# ID of the new post.
	pid = None


	def get_success_url(self):
		"""
		Redirect to the post detail page.
		"""

		return reverse('posts:detail', args=(self.pid,))


	def get_form_kwargs(self):
		"""
		Make the request object available in the forms.
		"""

		kwargs = super(_PostUploadView, self).get_form_kwargs()
		
		if self.request.method in ('POST', 'PUT'):
		
			kwargs.update({
		
				'request': self.request
		
			})
		
		return kwargs


	@cached_property
	def get_options(self):
		"""
		Return all option forms.
		"""

		return (

			self.option_class(prefix='option0', data=self.request.POST),
			self.option_class(prefix='option1', data=self.request.POST, empty_permitted=True)

		)


	def option_errors(self):
		"""
		Return a dictionary containing the first error found for each option field.
		
		E.g. {'option0': [error], 'option1': [error]}
		"""
		
		errors = {}
		
		messages = []

		for opt in self.get_options:
			
			for item in opt.errors.items():
				
				field, msg = item
				
				messages += msg
				
				break
		
			errors.update({opt.prefix: messages})

		return errors


	def ajax_invalid(self, form):
		"""
		Add the error messages for the option forms to the response.
		"""
		
		data = super(_PostUploadView, self).ajax_invalid(form)
		
		data['errors'].update(self.option_errors())
		
		return data


	def form_valid(self, form):
		"""
		Save the new post and its options.
		"""

		# Get the option forms.
		option0, option1 = self.get_options

		# If the option forms are valid save all components of the post.
		if option0.is_valid() and option1.is_valid():	
			
			try:

				with transaction.atomic():
				
					post = form.save()
					
					option0.save(post=post)
					
					option1.save(post=post)
				

					# Increment the counter that records the number of posts a user has.
					self.request.user.posts_count = F('posts_count')+1
				
					self.request.user.save()


					# Index the post to make it searchable.
					post_search.index_instance(post)


				# Set pid for get_success_url()
				self.pid = post.id
				
				return super(_PostUploadView, self).form_valid(form)

			except Exception as e:

				print(e)

				form.add_post_creation_error()


		# Else display the option form errors to the user.
		return self.form_invalid(form)

# ----------------------------------------------------------------------------------------

class PostMediaAttrsMixin(object):
	"""
	Define the class attributes common to PostImageView and PostVideoView.
	"""

	template_name = 'posts/post.html'
	view_handler = _PostUploadView
	form_class = PostForm


	def get_redirect_url(self):

		return reverse('posts:post')


	def get(self, request, *args, **kwargs):

		if request.is_ajax():

			return JsonResponse(

				{'messages': get_messages_json(request)}, status = 403

			)

		return redirect( self.get_redirect_url() )
	
# ----------------------------------------------------------------------------------------

class PostImageView(PostMediaAttrsMixin, UloUploadView):
	"""
	NOTE: Make sure Django processes the files LAST by making it the last element in the 
	QueryDict. Now if an error is raised because of the file the form data for all other
	fields will remain in the request object.
	"""

	def set_handlers(self, request):

		request.upload_handlers = [
			
			MediaUploadHandler(request=request, images=('file',)),
			MemoryMediaUploadHandler(request=request, images=('file',)),
			TemporaryMediaUploadHandler(request=request, images=('file',))

		]

# ----------------------------------------------------------------------------------------

class PostVideoView(PostMediaAttrsMixin, UloUploadView):
	"""
	NOTE: Make sure Django processes the files LAST by making it the last element in the 
	QueryDict. Now if an error is raised because of the file the form data for all other
	fields will remain in the request object.
	"""

	def set_handlers(self, request):

		request.upload_handlers = [
			
			MediaUploadHandler(request=request, videos=('file',), images=('thumbnail',)),
			MemoryMediaUploadHandler(request=request, videos=('file',), images=('thumbnail',)),
			TemporaryMediaUploadHandler(request=request, videos=('file',), images=('thumbnail',))

		]


# END POST UPLOAD VIEWS
# ----------------------------------------------------------------------------------------




# POST VIEWS
# ----------------------------------------------------------------------------------------

class PostDetailView(UloView):
	"""
	Render a post adding user specific information to the context for a logged in user.
	"""

	template_name = 'posts/post_detail.html'


	def __init__(self, *args, **kwargs):
		"""
		Create a direct connection to the database to perform raw SQL queries.
		"""

		self.cursor = connection.cursor()
		
		return super(PostDetailView, self).__init__(*args, **kwargs)


	def get(self, request, pk, *args, **kwargs):
		"""
		Create a direct connection to the database to perform raw SQL queries.
		"""

		try:

			is_authenticated = request.user.is_authenticated()

			if is_authenticated:

				offset = 6

				self.cursor.execute(
					
					 '''SELECT

							posts_postvote.postoption_id AS vote_id,
					 		post.*

					 	FROM (

						 	SELECT

						 		posts_postoption.id AS option_id,
						 		posts_postoption.colour,
								posts_postoption.text,
								posts_postoption.icon,
								posts_postoption.count,
								post.*

						 	FROM (

							 	SELECT
									
									post.*,
									users_connection.id AS is_following
								
								FROM (

									SELECT

										posts_post.*,
										users_user.name,
										users_user.username,
										users_user.thumbnail AS user_thumbnail,
										users_user.followers_count
									
									FROM posts_post
									
									INNER JOIN users_user 
									
									ON posts_post.user_id=users_user.id
									
									WHERE posts_post.is_active=%s 
									
									AND posts_post.id=%s

								) AS post 

								LEFT JOIN users_connection

								ON post.user_id=users_connection.to_user_id 	
								
								AND users_connection.from_user_id=%s

							) AS post

							LEFT JOIN posts_postoption

							ON post.id=posts_postoption.post_id

						) AS post

						LEFT JOIN posts_postvote

						ON posts_postvote.postoption_id=post.option_id
						
						AND posts_postvote.user_id=%s
						
					''', [True, pk, request.user.id, request.user.id]
				
				)
			
			else:

				offset = 5

				self.cursor.execute(

					 '''SELECT

					 		posts_postoption.id AS option_id,
							posts_postoption.colour,
							posts_postoption.text,
							posts_postoption.icon,
							posts_postoption.count,
							post.*

					 	FROM (
		
							SELECT

								posts_post.*,
								users_user.name,
								users_user.username,
								users_user.thumbnail AS user_thumbnail,
								users_user.followers_count
							
							FROM posts_post
							
							INNER JOIN users_user 
							
							ON posts_post.user_id=users_user.id
							
							WHERE posts_post.is_active=%s 
							
							AND posts_post.id=%s

						) AS post

						LEFT JOIN posts_postoption

						ON post.id=posts_postoption.post_id
					
					''', [True, pk]
				
				)


			post = postfetchone(cursor=self.cursor, offset=offset)
		
			if post == None:

				raise Post.DoesNotExist()	


			post['category'] = get_category(post)


		except Post.DoesNotExist:
			
			raise Http404()
			

		kwargs.update({

			'post': post,
			'form': CommentForm(post_id=pk),
			'comments_disabled': post['comment_settings'] == DISABLED,
			'timeline': request.is_ajax() and request.GET.get('timeline', False),
			'is_owner': is_authenticated and post['user_id'] == request.user.id
		
		})

		return super(PostDetailView, self).get(request, pk, *args, **kwargs)

# ----------------------------------------------------------------------------------------

class PostUpdateView(UloOwnerRequiredMixin, UloUpdateView):
	"""
	"""

	redirect_field_name = 'redirect_to'
	template_name = 'posts/post_update.html'
	form_class = PostUpdateForm
	id_field = 'user_id'
	model_class = Post


	def get_object(self):

		return self.instance


	def get_context_data(self, **kwargs):

		context = super(PostUpdateView, self).get_context_data(**kwargs)

		context['pk'] = self.instance.id

		return context


	def get_success_url(self):
		
		return reverse('posts:detail', args={self.instance.id})


	def form_valid(self, form):

		if form.has_changed():

			if form.save() == None:

				return super(PostUpdateView, self).form_invalid(form)

			
			messages.success(self.request, _('Post updated.'))
		
		return super(PostUpdateView, self).form_valid(form)

# ----------------------------------------------------------------------------------------

class PostDeleteView(UloOwnerRequiredMixin, DeletionMixin, UloView):
	"""
	"""

	template_name = 'posts/post_delete.html'

	redirect_field_name = 'redirect_to'

	id_field = 'user_id'

	model_class = Post


	def get_success_url(self):

		return reverse('home')


	def get_object(self):

		return self.instance


	def get_context_data(self, **kwargs):
		
		context = super(PostDeleteView, self).get_context_data(**kwargs)
		
		context['post'] = self.get_object()

		return context


	@transaction.atomic
	def delete(self, request, *args, **kwargs):

		request.user.posts_count = F('posts_count') - 1

		request.user.save()

		doc_id = self.instance.id

		response = super(PostDeleteView, self).delete(request, *args, **kwargs)

		post_search.delete_instance(doc_id)

		# Do not return any html if this is an ajax request.
		return (JsonResponse({}, status=200) if request.is_ajax() else response)

# ----------------------------------------------------------------------------------------

class PostVoteView(UloLoginRequiredMixin, UloView):
	"""
	Add or remove a user's vote from PostVote.
	"""

	def get_success_url(self):
		"""
		Redirect to the page that the user came from
		"""
		return get_referer_path(

			self.request, 
			error_path=reverse('posts:detail', args=(self.kwargs['pk'],))
		
		)


	def get(self, request, pk, *args, **kwargs):
		"""
		"""

		vote, voted, status = request.GET.get('vote'), request.GET.get('voted', ''), 200

		print(vote, voted)

		try:

			with transaction.atomic():

				if vote == voted:

					if PostOption.objects.filter(id=vote, post_id=pk).update(count=F('count')-1) != 1:
				
						raise PostOption.DoesNotExist()

					PostVote.objects.get(postoption_id=voted, user_id=request.user.pk).delete()


				elif voted != '':

					if PostOption.objects.filter(id=vote, post_id=pk).update(count=F('count')+1) != 1 or \
						PostOption.objects.filter(id=voted, post_id=pk).update(count=F('count')-1) != 1:
						
						raise PostOption.DoesNotExist()

					if PostVote.objects.filter(postoption_id=voted, user_id=request.user.pk).update(postoption_id=vote) != 1:

						raise PostVote.DoesNotExist()


				else:

					if PostOption.objects.filter(id=vote, post_id=pk).update(count=F('count')+1) != 1:
						
						raise PostOption.DoesNotExist()

					PostVote.objects.create(postoption_id=vote, user_id=request.user.pk, post_id=pk)


		except (IntegrityError, OperationalError, PostOption.DoesNotExist, PostVote.DoesNotExist, Exception) as e:

			# PostVote.DoesNotExists is thrown if vote==voted but the autheticated
			# user logged out and then in as a different user on a differenct tab.

			msg = 'Sorry, we cannot register your vote. Refresh the page and try again.'
			
			messages.error(self.request, _(msg))
			
			status = 403


		if request.is_ajax():

			return JsonResponse({'messages':get_messages_json(request)}, status=status)

		return redirect(self.get_success_url())

# END POST VIEWS
# ----------------------------------------------------------------------------------------




# POST ACTION VIEWS
# ----------------------------------------------------------------------------------------

class PostActionsView(LoginRequiredMixin, UloView):
	"""
	Javascript Disabled.
	Rendered when a user does not have javascript enabled and tries to perform an action
	on a post (e.g. report an issue or share). The view renders a menu with links to each
	actions page.
	"""
	
	redirect_field_name = 'redirect_to'
	template_name = 'posts/post_actions.html'


	def get(self, request, pk, *args, **kwargs):

		try:
			
			post = Post.objects.only('title', 'thumbnail', 'user_id').get(pk=pk)
		
		except Post.DoesNotExist:
		
			raise Http404()


		kwargs.update({

			'post':post,
			'is_owner': post.user_id==request.user.id,
			'back_url': reverse('posts:detail', args=(pk,))
		
		})
		
		return super(PostActionsView, self).get(request, pk, *args, **kwargs)

# ----------------------------------------------------------------------------------------

class PostReportView(LoginRequiredMixin, UloFormView):
	"""
	Render a form that allows the user to report an issue with a post.
	"""

	redirect_field_name = 'redirect_to'
	template_name = 'posts/post_report.html'
	form_class = PostReportForm


	def get_success_url(self):
		"""
		Redirect to the "report received" page.
		"""
		
		LinkViewsSession(self.request).set('post_report', True)

		return reverse('posts:report_complete')
	

	def get_form_kwargs(self):
		"""
		Fill the form with all the information required to render the page.
		"""
		
		kwargs = super(PostReportView, self).get_form_kwargs()

		try:

			post_id = self.kwargs['pk']


			if self.request.is_ajax():

				# Raise an exception if the post does not exists.

				if Post.objects.filter(id=post_id).exists() == False:

					raise Post.DoesNotExist()

			else:

				# Include the post to render a summary.

				kwargs['post'] = Post.objects.only('thumbnail', 'title', 'id').get(id=post_id)


			# Set the IDs on the report instance in the form when successful.

			kwargs.update({

				'post_id': post_id,
				'user_id': self.request.user.id 

			})

		except (KeyError, Post.DoesNotExist) as e:
			
			raise Http404()


		return kwargs


	def form_valid(self, form):
		"""
		Create the report and redirect to the complete page.
		"""
		
		form.save()
		
		self.force_html = form.cleaned_data['pip']
		
		return super(PostReportView, self).form_valid(form)

# ----------------------------------------------------------------------------------------

class PostReportCompleteView(LoginRequiredMixin, UloView):
	"""
	Display page informing the user that their report has been received.
	"""

	redirect_field_name = 'redirect_to'
	template_name = 'posts/post_report_complete.html'


	def get(self, request, *args, **kwargs):

		if LinkViewsSession(request).get('post_report'):
		
			return super(PostReportCompleteView, self).get(request, *args, **kwargs)
		
		raise Http404()

# ----------------------------------------------------------------------------------------

class PostCommentView(LoginRequiredMixin, UloFormView):
	"""
	Comment on a post.
	"""
	
	redirect_field_name = 'redirect_to'
	template_name = 'posts/post_comment.html'
	form_class = CommentForm


	def get_success_url(self):
		"""
		Return to the post.
		"""
	
		return reverse('posts:detail', args=(self.kwargs['pk'],))
	

	def get_form_kwargs(self):

		kwargs = super(PostCommentView, self).get_form_kwargs()

		try:

			post_id = self.kwargs['pk']


			if self.request.is_ajax():
				
				# Raise an exception if the post does not exists.

				if Post.objects.filter(id=post_id).exists() == False:
					
					raise Post.DoesNotExist()

			else:

				# Include the post to render a summary.

				kwargs['post'] = Post.objects.only('thumbnail', 'title').get(id=post_id)


			kwargs.update({

				'post_id': post_id,
				'user_id': self.request.user.id

			})

		except (KeyError, Post.DoesNotExist):

			raise Http404()


		return kwargs


	def form_valid(self, form):

		with transaction.atomic():

			# Create the comment.
			
			comment = form.save()


			# Update the comments counter.

			if form.post == None:

				Post.objects.filter(id=comment.post_id).update(comments_count=F('comments_count')+1)
			
			else:
			
				form.post.comments_count = F('comments_count')+1
			
				form.post.save()


		if self.request.is_ajax():

			return JsonResponse(
				{	
					'comments': [{
						
						'id': comment.id,
						'comment': comment.comment,
						'user_id': self.request.user.id,
						'name': self.request.user.name,
						'username': self.request.user.username,
						'thumbnail': self.request.user.thumbnail.name,
					
					}]

				}, status=200)
		
		return super(PostCommentView, self).form_valid(form)

# ----------------------------------------------------------------------------------------

class PostCommentLoadView(UloView):
	"""
	Load the next set of comments for a post.
	"""

	def __init__(self, *args, **kwargs):

		self.cursor = connection.cursor()
		
		return super(PostCommentLoadView, self).__init__(*args, **kwargs)


	def get(self, request, pk, *args, **kwargs):

		if request.is_ajax():

			per_page = 12

			limit = per_page + 1
			
			max_id = validate_cid(request.GET.get('max_id'))


			# Run the query without an offset if max_id is None
		
			if max_id == None:

				self.cursor.execute(

					 '''SELECT

					 		users_user.name,
					 		users_user.username,
							users_user.thumbnail,
							comments_comment.id,
							comments_comment.comment,
							comments_comment.user_id
						
						FROM comments_comment
						
						INNER JOIN users_user 
						
						ON comments_comment.user_id=users_user.id
						
						WHERE comments_comment.is_active=%s
						
						AND comments_comment.post_id=%s
						
						ORDER BY published DESC LIMIT %s
					
					''', [True, pk, limit]

				)


			# Run the query starting from the offset max_id

			else:
				
				self.cursor.execute(

					 '''SELECT

					 		users_user.name,
					 		users_user.username,
							users_user.thumbnail,
							comments_comment.id,
							comments_comment.comment,
							comments_comment.user_id
					
						FROM comments_comment
					
						INNER JOIN users_user 
					
						ON comments_comment.user_id=users_user.id
					
						WHERE comments_comment.is_active=%s
					
						AND comments_comment.post_id=%s
					
						AND comments_comment.id<%s
					
						ORDER BY published DESC LIMIT %s
					
					''', [True, pk, max_id, limit]

				)


			comments = dictfetchmany(self.cursor, per_page)

			has_next, cid = get_cid(comments, self.cursor, per_page, 'id')


			return JsonResponse({
				
				'comments':comments, 
				'has_next':has_next, 
				'max_id':cid
			
			}, status=200)


		raise Http404()

# END POST ACTION VIEWS
# ----------------------------------------------------------------------------------------



