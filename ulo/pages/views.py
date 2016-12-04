# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.contrib import messages
from django.db import connection
from django.http import JsonResponse

# Thrid party app imports

# Project imports
from posts.models import Post
from ulo.utils import get_cid, postfetchmany, validate_cid
from ulo.views import UloView

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class HomeUnauthView(UloView):

	template_name = 'pages/home_unauth.html'


	def get(self, request, *args, **kwargs):
		
		kwargs['posts'] = Post.objects.select_related('user').all()[:24]

		return super(HomeUnauthView, self).get(request, *args, **kwargs)

# ----------------------------------------------------------------------------------------

class HomeAuthView(UloView):

	template_name = 'pages/home_auth.html'


	def __init__(self, *args, **kwargs):
		
		self. cursor = connection.cursor()
		
		return super(HomeAuthView, self).__init__(*args, **kwargs)


	def dispatch(self, request, *args, **kwargs):

		if request.user.is_authenticated():

			return super(HomeAuthView, self).dispatch(request, *args, **kwargs)

		return HomeUnauthView.as_view(**kwargs)(request)


	def get(self, request, *args, **kwargs):
		"""
		
		# SQL QUERIES - IN TO OUT:

		# Get the users that the authenticated user if following

		# Get the posts made by these users.

		# Get the post options for each post.

		# Get the vote id for each post that the user has voted on.

		"""

		per_page = 4

		limit = per_page+1

		max_id = validate_cid(request.GET.get('max_id'))


		if max_id == None:

			self.cursor.execute(

				 '''SELECT

						posts_postvote.postoption_id AS vote_id,
						options.*

					FROM (

						SELECT

							posts_postoption.id AS option_id,
							posts_postoption.colour,
							posts_postoption.text,
							posts_postoption.icon,
							posts_postoption.count,
							posts.*

						FROM posts_postoption

						INNER JOIN (
						
							SELECT
								
								posts_post.id,
								posts_post.file,
								posts_post.thumbnail,
								posts_post.thumbnail_time,
								posts_post.duration,
								posts_post.title,
								posts_post.published,
								posts_post.views,
								posts_post.comments_count,
								users.*

							FROM posts_post

							INNER JOIN (

								SELECT 

									users_user.id AS user_id,
									users_user.name, 
									users_user.username, 
									users_user.thumbnail AS user_thumbnail
								
								FROM users_user
								
								WHERE users_user.id IN (

									SELECT 

										users_connection.to_user_id

									FROM users_connection

									WHERE users_connection.from_user_id=%s

								)

								OR users_user.id=%s

							) AS users

							ON posts_post.user_id=users.user_id

							ORDER BY posts_post.published DESC 

							LIMIT %s

						) AS posts

						ON posts_postoption.post_id=posts.id

					) AS options


					LEFT JOIN posts_postvote

					ON posts_postvote.postoption_id=options.option_id

					AND posts_postvote.user_id=%s

					# ORDER BY options.published DESC
				
				''', [request.user.pk, request.user.pk, limit, request.user.pk]

			)

		else:

			self.cursor.execute(

				 '''SELECT

						posts_postvote.postoption_id AS vote_id,
						options.*

					FROM (

						SELECT

							posts_postoption.id AS option_id,
							posts_postoption.colour,
							posts_postoption.text,
							posts_postoption.icon,
							posts_postoption.count,
							posts.*

						FROM posts_postoption

						INNER JOIN (
						
							SELECT
								
								posts_post.id,
								posts_post.file,
								posts_post.thumbnail,
								posts_post.thumbnail_time,
								posts_post.duration,
								posts_post.title,
								posts_post.published,
								posts_post.views,
								posts_post.comments_count,
								users.*

							FROM posts_post

							INNER JOIN (

								SELECT 

									users_user.id AS user_id,
									users_user.name, 
									users_user.username, 
									users_user.thumbnail AS user_thumbnail
								
								FROM users_user
								
								WHERE users_user.id IN (

									SELECT 

										users_connection.to_user_id

									FROM users_connection

									WHERE users_connection.from_user_id=%s

								)

								OR users_user.id=%s

							) AS users

							ON posts_post.user_id=users.user_id

							WHERE posts_post.id<%s

							ORDER BY posts_post.published DESC 

							LIMIT %s

						) AS posts

						ON posts_postoption.post_id=posts.id

					) AS options

					LEFT JOIN posts_postvote

					ON posts_postvote.postoption_id=options.option_id

					AND posts_postvote.user_id=%s

					# ORDER BY options.published DESC 
				
				''', [request.user.pk, request.user.pk, max_id, limit, request.user.pk]

			)
		

		posts, has_next = postfetchmany(cursor=self.cursor, offset=6, size=per_page)

		__, cid = get_cid(posts, self.cursor, per_page, 'id')


		if request.is_ajax() and request.GET.get('timeline') != None:

			return JsonResponse({
				
					'posts':posts, 
					'has_next':has_next, 
					'max_id':cid
				
				}, status=200)

		else:

			kwargs.update({
			
				'posts': posts,
				'has_next': has_next,
				'max_id': cid
			
			})

			return super(HomeAuthView, self).get(request, *args, **kwargs)

# ----------------------------------------------------------------------------------------

class NavigationView(UloView):

	template_name = 'pages/navigation.html'

# ----------------------------------------------------------------------------------------



