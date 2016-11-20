# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.contrib import messages
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.urlresolvers import reverse
from django.db import connection, IntegrityError, transaction
from django.db.models import F
from django.http import Http404, HttpResponse, HttpResponseForbidden, JsonResponse
from django.shortcuts import redirect
from django.utils.http import urlquote_plus, urlunquote_plus
from django.utils.translation import ugettext_lazy as _

# Thrid party app imports

# Project imports
from .forms import LoginForm, ProfileUpdateForm, ProfileUpdateImageForm, SignUpForm
from .models import Connection
from .search import user_search
from emails.emails import reactivation_email
from ulo.formmixins import DeleteFileMixin
from ulo.handlers import (

	MediaUploadHandler, MemoryMediaUploadHandler, TemporaryMediaUploadHandler

)
from ulo.utils import (

	dictfetchmany, get_cid, get_messages_json, get_referer_path, reserved_usernames, 
	validate_cid

)
from ulo.views import UloView, UloFormView, UloRedirectView, UloUpdateView, UloOwnerUploadView
from ulo.viewmixins import UloLogoutRequiredMixin, UloOwnerRequiredMixin

# ----------------------------------------------------------------------------------------




# SIGNUP, LOGIN, LOGOUT
# ----------------------------------------------------------------------------------------

class SignUpView(UloLogoutRequiredMixin, UloFormView):
	"""
	Display sign up form and create new user account. Log the user in after successfully
	creating the account and send them an email to verify their address.
	"""

	template_name = 'users/signup.html'

	form_class = SignUpForm


	def form_valid(self, form):
		"""
		Save the user to the database and log them into their account.
		"""

		try:

			user = form.save()

		except Exception:

			form.add_account_creation_error()

			return super(SignUpView, self).form_invalid(form)

	
		# Use the non hashed version of the password from the submitted form data.
		user = authenticate(

			email=user.email, 
			password=form.cleaned_data.get('password')

		)

		# Log the new user in.
		if user:
			
			 login(self.request, user)

			 return redirect( user.get_absolute_url() )
		
		# Redirect to the login page if user authentication failed.
		else:
			
			return redirect(reverse('login'))

# ----------------------------------------------------------------------------------------

# TODO: Handle cookie error in better way (i.e. if user does not allow cookies)
class LoginView(UloLogoutRequiredMixin, UloFormView):

	template_name = 'users/login.html'
	
	redirect_name = 'redirect_to'
	
	form_class = LoginForm


	def get_redirect_url(self):
		"""
		UloLogoutRequiredMixin. Path to redirect a logged in user to.
		"""

		if self.request.method in ('POST', 'PUT'):
			
			return self.get_success_url()

		return reverse('home')


	def get(self, request, redirect_to, *args, **kwargs):
		"""
		Initialise form data with the redirect path if one is given.
		"""

		name = self.redirect_name
		
		path = self.request.GET.get(name, '')

		# Initialise hidden form field with the redirect path.
		self.initial.update({name: path})
		
		# Add context variable to append the redirect path to the forms url.
		kwargs.update({name: path and '?'+name+'='+urlquote_plus(path)})

		return super(LoginView, self).get(request, *args, **kwargs)


	def get_success_url(self):
		"""
		Return the url to redirect to after a successful post.
		"""

		return self.request.POST.get('redirect_to') or reverse('home')


	def form_invalid(self, form, msg=None):
		"""
		Add single non field error to the form.
		"""

		form.add_login_error(msg=msg)

		return super(LoginView, self).form_invalid(form)


	def form_valid(self, form):
		"""
		Log the user in. Have the session expire when the browser is closed if the user
		did not select remember me. Return the redirect page as html if the login form
		has been rendered within another page.
		"""

		# LOGIN VALIDATION

		email = form.cleaned_data.get('email')

		password = form.cleaned_data.get('password')

		user = authenticate(email=email, password=password)
				
		if user == None:

			return self.form_invalid(form)

		if user.is_blocked():

			return self.form_invalid(form, user.block_message()) 
		

		# ACCOUNT ACTIVATION

		if user.is_active == False:

			user.is_active = True

			user.save()
			
			reactivation_email(user)

		
		login(self.request, user)

		if form.cleaned_data.get('remember') == None:
			
			# Expire session when the browser window is closed
			self.request.session.set_expiry(0)
			

		self.force_html = form.cleaned_data.get('pip', False)

		return super(LoginView, self).form_valid(form)

# ----------------------------------------------------------------------------------------

class LogoutView(UloRedirectView):
	
	def get_redirect_url(self):
		
		# Destroy all session data for the current request / user
		logout(self.request)
		
		return reverse('home')

# END SIGNUP, LOGIN, LOGOUT
# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class UsernameAvailableView(UloView):

	def get(self, request, *args, **kwargs):

		raise Http404()


	def head(self, request, username, *args, **kwargs):

		if request.is_ajax():
			
			response = HttpResponse('')
			
			response['exists'] = (

				username.lower() in reserved_usernames or 
				get_user_model().objects.filter(username=username).exists()
			
			)

			return response

		raise Http404()

# ----------------------------------------------------------------------------------------




# PROFILE PAGE VIEWS
# ----------------------------------------------------------------------------------------

class BaseProfileView(UloView):
	"""

	Base class for profile views (post, followers, following).

	Subclasses must defined the class variables tab_name and count_name.
	
	"""

	template_name = 'users/profile.html'


	def __init__(self, *args, **kwargs):
		"""
		Create a direct connection to the database to perform raw SQL queries.
		
		See subclass implementations of get_tab_content().
		"""

		# Number or results to return per page.
		self.per_page = 2

		# Set LIMIT to per_page plus one but return per_page results. The extra result is 
		# used to determine if the rendered page should display a 'load more' button.
		self.limit = self.per_page + 1

		# Connect to the default database
		self.cursor = connection.cursor()

		return super(BaseProfileView, self).__init__(*args, **kwargs)

		
	def get_tab_data(self, max_id, profile, is_owner, is_authenticated, **kwargs):
		"""
		Return an iterable object containing the contents of the selected tab.
		
		@param max_id: Database cursor id or None.
		@param profile: User instance for this profile page.
		@param is_owner: True if 'profile' is the logged in user else False
		@param is_authenticated: True if the current user is logged in.
		"""
		raise NotImplementedError('Subclasses of BaseProfileView must define get_tab_data()')


	def set_tab_data(self, context, **kwargs):
		"""
		Return an iterable object containing the contents of the selected tab.
		
		@param max_id: Database cursor id or None.
		@param profile: User instance for this profile page.
		@param is_owner: True if 'profile' is the logged in user else False
		@param is_authenticated: True if the current user is logged in.
		"""

		tab_data = self.get_tab_data(**kwargs)

		has_next, cid = get_cid(tab_data, self.cursor, self.per_page)

		context.update({

			'tab_data': tab_data,
			'has_next': has_next,
			'max_id': cid

		})

		return context


	def get_user(self, username):
		"""
		
		Return the user instance for this profile or raise a Http404 exception
		if the user cannot be found or is inactive.
		
		"""
		try:
			
			return get_user_model().objects.only(

					"name", "username", "blurb", "location", "photo", 
					"posts_count", "followers_count", "following_count"
				
				).get(username=username, is_active=True)

		except get_user_model().DoesNotExist:
			
			raise Http404()


	def get_context_data(self, **kwargs):
		"""
		Add profile information to the template context.
		"""
		
		# Get the default template context.
		context = super(BaseProfileView, self).get_context_data(**kwargs)

		# Add the tab content to the context.
		self.set_tab_data(context, **kwargs)

		# Return the updated content.
		return context


	def get(self, request, username, *args, **kwargs):
		"""
		Return the profile page or tab content.
		"""

		max_id = validate_cid(request.GET.get('max_id'))

		is_authenticated = request.user.is_authenticated()

		is_owner = is_authenticated and request.user.username == username

		kwargs.update({

			'max_id': max_id,
			'is_owner': is_owner,
			'is_authenticated': is_authenticated

		})


		if request.is_ajax() and request.GET.get('profile_id', False):

			context = {}

			# If this is the first request for this tab add 'count' to the context
			if max_id == None:

				user = request.user if is_owner else self.get_user(username)

				context['count'] = getattr(user, self.counter)


			kwargs['profile_id'] = request.GET.get('profile_id')

			self.set_tab_data(context, **kwargs)
			
			return JsonResponse(context, status=200)


		if is_owner:

			profile = request.user

			is_following = False

		else:

			profile = self.get_user(username)

			is_following = is_authenticated and request.user.is_following(profile)


		kwargs.update({

			'tab': self.tab,
			'profile': profile,
			'profile_id': profile.id,
			'is_following': is_following,

		})


		return super(BaseProfileView, self).get(request, username, *args, **kwargs)

# ----------------------------------------------------------------------------------------

class ProfileView(BaseProfileView):
	"""
	Default profile view. Render the profile page with the 'posts' tab selected.
	"""


	# Name of the selected tab.
	tab = 'posts'

	# Counter field name.
	counter = 'posts_count'


	def get_tab_data(self, max_id, profile_id, is_owner, is_authenticated, **kwargs):
		"""
		Return the next set of posts.
		"""

		# Run the query without an offset if max_id is None
		if max_id == None:

			self.cursor.execute(

				 '''SELECT
						
						id AS cid,
						title,
						file,
						thumbnail,
						published,
						views
					
					FROM posts_post

					WHERE user_id=%s AND is_active=True

					ORDER BY published DESC LIMIT %s

				''', [profile_id, self.limit]
			)


		# Run the query starting from the offset context['max_id']
		else:

			self.cursor.execute(

				 '''SELECT
						
						id AS cid,
						title,
						file,
						thumbnail,
						published,
						views
					
					FROM posts_post
					
					WHERE user_id=%s AND is_active=True AND id < %s
					
					ORDER BY published DESC LIMIT %s

				''', [profile_id, max_id, self.limit]
			)

		return dictfetchmany(self.cursor, self.per_page)

# ----------------------------------------------------------------------------------------

class ProfileFollowersView(BaseProfileView):
	"""
	Render the profile page with the 'followers' tab selected.
	"""
	

	# Name of the selected tab.
	tab = 'followers'
	
	# Counter field name.
	counter = 'followers_count'


	def get_tab_data(self, max_id, profile_id, is_owner, is_authenticated, **kwargs):
		"""
		Return the next set of followers.
		"""


		# Add the column is_following to indicate whether the logged in used is following
		# each user returned by the query.
		if is_authenticated:

			# Run the query without an offset if max_id is None
			if max_id == None:
				
				self.cursor.execute(
				
					 '''SELECT
							
							followers.id,
							followers.cid,
							followers.name, 
							followers.username, 
							followers.thumbnail,
							following.id AS is_following
						
						FROM (

							SELECT
								
								users_connection.id AS cid,
								users_connection.from_user_id, 
								users_connection.to_user_id,
								users_user.id, 
								users_user.name, 
								users_user.username, 
								users_user.thumbnail

							FROM users_connection
							INNER JOIN users_user 
							ON users_connection.from_user_id=users_user.id
							WHERE users_connection.to_user_id=%s
							ORDER BY users_connection.id DESC LIMIT %s

						) AS followers LEFT JOIN users_connection AS following

							ON followers.from_user_id=following.to_user_id 
							AND following.from_user_id=%s 
							
					''', [profile_id, self.limit, self.request.user.pk]
				)

			# Run the query starting from the offset context['max_id']
			else:

				self.cursor.execute(

					 '''SELECT
							
							followers.id,
							followers.cid,
							followers.name, 
							followers.username, 
							followers.thumbnail,
							following.id AS is_following
						
						FROM (

							SELECT

								users_connection.id AS cid,
								users_connection.from_user_id, 
								users_connection.to_user_id,
								users_user.id,
								users_user.name, 
								users_user.username, 
								users_user.thumbnail
							
							FROM users_connection
							INNER JOIN users_user 
							ON users_connection.from_user_id=users_user.id
							WHERE users_connection.to_user_id=%s AND users_connection.id < %s
							ORDER BY users_connection.id DESC LIMIT %s

						) AS followers LEFT JOIN users_connection AS following

							ON followers.from_user_id=following.to_user_id 
							AND following.from_user_id=%s 
							
					''', [profile_id, max_id, self.limit, self.request.user.pk]
				)


		# Run the query without the extra join when the user is not logged in.
		else:
			
			# Run the query without an offset if max_id is None
			if max_id == None:
				
				self.cursor.execute(
					
					'''SELECT 

							users_connection.id AS cid,
							users_connection.from_user_id, 
							users_connection.to_user_id,
							users_user.id,
							users_user.name, 
							users_user.username, 
							users_user.thumbnail
						
						FROM users_connection
						INNER JOIN users_user 
						ON users_connection.from_user_id=users_user.id
						WHERE users_connection.to_user_id=%s
						ORDER BY users_connection.id DESC LIMIT %s

					''', [profile_id, self.limit]
				)

			# Run the query starting from the offset context['max_id']
			else:
				
				self.cursor.execute(
					
					'''SELECT 

							users_connection.id AS cid,
							users_connection.from_user_id, 
							users_connection.to_user_id,
							users_user.id,
							users_user.name, 
							users_user.username, 
							users_user.thumbnail
						
						FROM users_connection
						INNER JOIN users_user 
						ON users_connection.from_user_id=users_user.id
						WHERE users_connection.to_user_id=%s AND users_connection.id<%s
						ORDER BY users_connection.id DESC LIMIT %s

					''', [profile_id, max_id, self.limit]
				)

		return dictfetchmany(self.cursor, self.per_page)

# ----------------------------------------------------------------------------------------

class ProfileFollowingView(BaseProfileView):
	"""
	Render the profile page with the 'following' tab selected.
	"""

	
	# Name of the selected tab.
	tab = 'following'

	# Counter field name.
	counter = 'following_count'


	def get_tab_data(self, max_id, profile_id, is_owner, is_authenticated, **kwargs):
		"""
		Return the next set of users following this user.
		"""

		# Run the query without the extra join when the user is on their own page or not
		# logged in.
		if is_owner or is_authenticated == False:

			# Run the query without an offset if max_id is None
			if max_id == None:
			
				self.cursor.execute(
			
					'''SELECT 

							users_connection.id AS cid,
							users_connection.from_user_id, 
							users_connection.to_user_id,
							users_user.id,
							users_user.name, 
							users_user.username, 
							users_user.thumbnail
						
						FROM users_connection
						INNER JOIN users_user 
						ON users_connection.to_user_id=users_user.id
						WHERE users_connection.from_user_id = %s 
						ORDER BY users_connection.id DESC LIMIT %s

					''', [profile_id, self.limit]
				)

			# Run the query starting from the offset context['max_id']
			else:
				
				self.cursor.execute(
					
					'''SELECT 

							users_connection.id AS cid,
							users_connection.from_user_id, 
							users_connection.to_user_id,
							users_user.id,
							users_user.name, 
							users_user.username, 
							users_user.thumbnail
						
						FROM users_connection
						INNER JOIN users_user 
						ON users_connection.to_user_id=users_user.id
						WHERE users_connection.from_user_id=%s AND users_connection.id < %s
						ORDER BY users_connection.id DESC LIMIT %s

					''', [profile_id, max_id, self.limit]
				)
				
		
		# Add the column is_following to indicate whether the logged in used is following
		# each user returned by the query.
		else:

			# Run the query without an offset if max_id is None
			if max_id == None:
				
				self.cursor.execute(
					
					 '''SELECT

							followers.id,
							followers.cid,
							followers.name,
							followers.username, 
							followers.thumbnail,
							following.id AS is_following
						
						FROM (

							SELECT 
								users_connection.id AS cid,
								users_connection.from_user_id, 
								users_connection.to_user_id,
								users_user.id,
								users_user.name, 
								users_user.username, 
								users_user.thumbnail
							FROM users_connection
							INNER JOIN users_user 
							ON users_connection.to_user_id=users_user.id
							WHERE users_connection.from_user_id = %s 
							ORDER BY users_connection.id DESC LIMIT %s

						) AS followers LEFT JOIN users_connection AS following

							ON followers.to_user_id=following.to_user_id 
							AND following.from_user_id=%s 
							
					''', [profile_id, self.limit, self.request.user.pk]
				)
			
			# Run the query starting from the offset context['max_id']
			else:
				
				self.cursor.execute(
				
					 '''SELECT

							followers.id,
							followers.cid,
							followers.name,
							followers.username, 
							followers.thumbnail,
							following.id AS is_following
						
						FROM (

							SELECT 
								users_connection.id AS cid,
								users_connection.from_user_id, 
								users_connection.to_user_id,
								users_user.id,
								users_user.name, 
								users_user.username, 
								users_user.thumbnail
							FROM users_connection
							INNER JOIN users_user 
							ON users_connection.to_user_id=users_user.id
							WHERE users_connection.from_user_id = %s AND users_connection.id < %s
							ORDER BY users_connection.id DESC LIMIT %s

						) AS followers LEFT JOIN users_connection AS following

							ON followers.to_user_id=following.to_user_id 
							AND following.from_user_id=%s 
							
					''', [profile_id, self.limit, max_id, self.request.user.pk]
				)

		return dictfetchmany(self.cursor, self.per_page)

# END PROFILE PAGE VIEWS
# ----------------------------------------------------------------------------------------




# UPDATE PROFILE VIEWS
# ----------------------------------------------------------------------------------------

class ProfileUpdateView(LoginRequiredMixin, UloUpdateView):
	"""
	Update user fields.
	"""

	redirect_field_name = 'redirect_to'
	
	template_name = 'users/profile_update.html'
	
	form_class = ProfileUpdateForm


	def get_object(self):

		return self.request.user


	def get_success_url(self):

		return reverse('users:profile', args=(self.request.user.username,))


	def form_valid(self, form):

		if form.has_changed():
		
			try:

				form.save()

				messages.success(self.request, _('Your profile has been updated.'))

			except Exception:

				form.add_account_update_error()

				return super(ProfileUpdateView, self).form_invalid(form)
					
		
		return super(ProfileUpdateView, self).form_valid(form)

# ----------------------------------------------------------------------------------------

class _ProfileUpdateImageView(UloFormView):
	

	form_class = ProfileUpdateImageForm


	def get_success_url(self):

		return reverse('users:profile', args=(self.request.user.username,))


	def get_form_kwargs(self):
		
		kwargs = super(_ProfileUpdateImageView, self).get_form_kwargs()
		
		if self.request.method in ('POST', 'PUT'):
		
			kwargs.update({
				
				'instance': self.request.user,
				'request': self.request

			})

		return kwargs


	def ajax_valid(self, form):
		"""
		Add the new image url to the context data.
		"""

		data = super(_ProfileUpdateImageView, self).ajax_invalid(form)
		
		data['image_src'] = self.request.user.photo.url
		
		return data


	def form_valid(self, form):
		"""
		Save the new profile image.
		"""

		try:

			form.save()

		except Exception:

			form.add_account_photo_error()

			return super(_ProfileUpdateImageView, self).form_invalid(form)


		return super(_ProfileUpdateImageView, self).form_valid(form)
		
# ----------------------------------------------------------------------------------------

class ProfileUpdateImageView(UloOwnerUploadView):
	"""
	Set the image upload handlers.
	"""

	view_handler = _ProfileUpdateImageView
	
	form_class = ProfileUpdateImageForm
	
	model_class = get_user_model()


	def set_handlers(self, request):
		
		request.upload_handlers = [
			
			MediaUploadHandler(request=request, images=('photo',)),
			MemoryMediaUploadHandler(request=request, images=('photo',)),
			TemporaryMediaUploadHandler(request=request, images=('photo',))

		]

# ----------------------------------------------------------------------------------------

class ProfileDeleteImageView(UloOwnerRequiredMixin, DeleteFileMixin, UloView):
	"""

	"""

	model_class = get_user_model()


	def post(self, request, pk, *args, **kwargs):

		if request.is_ajax():

			# Store the paths of the files to remove before changing their values.
			
			self.store_paths(request.user, 'photo', 'thumbnail')
			

			try:

				with transaction.atomic():

					# Set the images to their default values.

					setattr(request.user, 'photo', request.user.photo.field.get_default())

					setattr(request.user, 'thumbnail', request.user.thumbnail.field.get_default())

					request.user.save()


					# Update the search document.

					user_search.update_instance( request.user )


			except Exception as e:

				status = 400

				messages.error(

					request, 
					_('Sorry, it looks like we failed to delete your photo. Please try again.')

				)

			else:

				status = 200

				# Delete the old files

				self.delete_files(request.user)


			return JsonResponse({

					'image_src': request.user.photo.url,
					'messages': get_messages_json(request)
				},

				status=status
			)


		return HttpResponseForbidden();

# END UPDATE PROFILE VIEWS
# ----------------------------------------------------------------------------------------




# FOLLOW/UNFOLLOW
# ----------------------------------------------------------------------------------------

class SameUserExpection(Exception):

	pass

# ----------------------------------------------------------------------------------------

class BaseConnectView(LoginRequiredMixin, UloView):
	"""
	Base class for follwing/unfollowing a user.
	"""


	redirect_field_name = 'redirect_to'


	def connect(self, user, pk):
		"""
		Hook for subclasses to make a database entry or delete.
		"""

		raise NotImplementedError('Subclasses of BaseConnectView must define connect()')


	def reverse_url(self):
		"""
		Returns the url to give to the link if the request is successful. E.g. if the user
		makes a follow request return the unfollow url.
		"""

		raise NotImplementedError('Subclasses of BaseConnectView must define reverse_url()')


	def _counters(self, from_user, pk, value):
		"""
		Internal helper function to change the follower and following counter values.
		See inc_counters() and dec_counters().
		"""
		
		# update the counter value for the user being followed/unfollowed.
		if get_user_model().objects.filter(id=pk).update(followers_count=F('followers_count')-value) != 1:
			
			raise get_user_model().DoesNotExist
		
		# Update the counter value for the user doing the following/unfollowing.
		from_user.following_count = F('following_count') - value
		
		from_user.save()


	def inc_counters(self, from_user, to_user):
		"""
		Increment the followers_count value for the user being followed ('pk') and the 
		following_count value for the user doing the following ('user').
		"""

		self._counters(from_user, to_user, -1)


	def dec_counters(self, from_user, to_user):
		"""
		Decrement the followers_count value for the user being unfollowed ('pk') and the 
		following_count value for the user doing the unfollowing ('user').
		"""

		self._counters(from_user, to_user, 1)


	def get(self, request, pk, *args, **kwargs):
		"""
		Handle the request to follow or unfollow a user.
		"""

		# Redirect the user if they are not logged in
		if request.user.is_authenticated() == False:

			return redirect(get_referer_path(request, redirect=True))


		status = 200

		try:

			# Execute the database query
			self.connect(request.user, pk)

		except (Connection.DoesNotExist, get_user_model().DoesNotExist, Exception) as e:

			status = 403


		if request.is_ajax():

			return JsonResponse({

					'url': self.reverse_url(),
					'messages': get_messages_json(request)
				
				},
				
				status=status
			)

		# Return the user to the page they came from
		return redirect(get_referer_path(request))


	def post(self, request, pk, *args, **kwargs):
		
		raise Http404()

# ----------------------------------------------------------------------------------------

class FollowUserView(BaseConnectView):
	"""
	Add a database entry for a new follow.
	"""

	def reverse_url(self):
		"""
		Return the url that performs the reverse action (unfollow).
		"""

		return reverse('users:unfollow', args=(self.request.user.pk,))


	@transaction.atomic
	def connect(self, from_user, pk):
		"""
		@param from_user: user doing the following
		@param pk: id of the user being followed
		"""

		if from_user.str_id == pk:

			raise SameUserExpection()

		Connection.objects.create(from_user=from_user, to_user_id=pk)

		# Increment the counters
		self.inc_counters(from_user, pk)

# ----------------------------------------------------------------------------------------

class UnFollowUserView(BaseConnectView):
	"""
	Delete a database entry for an unfollow.
	"""

	def reverse_url(self):
		"""
		Return the url that performs the reverse action (follow).
		"""

		return reverse('users:follow', args=(self.request.user.pk,))


	@transaction.atomic
	def connect(self, from_user, pk):
		"""
		@param from_user: user doing the unfollowing
		@param pk: id of the user being unfollowed
		"""

		Connection.objects.get(from_user=from_user, to_user_id=pk).delete()

		# Decrement the counters
		self.dec_counters(from_user, pk)

# END FOLLOW/UNFOLLOW
# ----------------------------------------------------------------------------------------



