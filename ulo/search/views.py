# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.http import Http404, JsonResponse
from django.utils.http import urlunquote_plus
from django.utils.translation import ugettext_lazy as _

# Thrid party app imports

# Project imports
from .utils import es, search_filters
from posts.search import post_search
from users.models import User
from users.search import user_search
from ulo.utils import get_messages_json
from ulo.views import UloView

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class SearchView(UloView):
	"""
	"""

	template_name = 'search/search.html'


	def get_results(self, response):
		"""
		
		Return the hits (array) and total (integer) for a search request response.
		
		@param response: search request response.

		"""

		if response != None:

			try:

				return response['hits']['hits'], response['hits']['total']

			except KeyError:

				pass


		return [], 0


	def get_index(self, array, index):
		"""
		
		Return the element in the array at position 'index' or None.
		
		@param array: list.
		@param index: integer.

		"""

		try:
			
			return array[index]

		except IndexError:
			
			return None


	def next_page(self, page, size, total, max_total):
		"""
		
		Return the next page number if there are more results else return None.
		
		@param page: current page number.
		@param total: total number of search results.
		@param max_total: maximum number or results that the search API can serve 
		(max_result_window).

		"""

		next_page = page + 1
		
		if next_page*size > max_total or page*size >= total:

			return None

		return next_page


	def get_page(self, request, size, max_total):
		"""
		
		Return the page number as an integer or None if the page number exceeds the max.
		Default to 1 for invalid page numbers.
		
		@param request: request.
		@param size: number of results to fetch per page.
		@param max_total: maximum number or results that the search API can serve 
		(max_result_window).

		"""

		try:

			page = int(request.GET.get('page', 1))

			if page < 1:

				raise ValueError

			if page*size > max_total:
				
				return None

		except ValueError:

			return 1

		return page


	def get(self, request, *args, **kwargs):
		"""
		
		NOTE: psize and usize must be multiples of post_search.max_result_window and
		user_search.max_result_window respectively. If not revise the logic in 
		next_page() and get_page().

		"""

		status = 200

		# Parse the query string.
		q = urlunquote_plus(request.GET.get('q', ''))

		# Results information. 
		results = {'posts_total': 0, 'users_total': 0}


		if q != '':

			# Number of posts to return per search.
			psize = 20

			# Number of users to return per search.
			usize = 6

			# Number of users to return when displaying users and posts together.
			min_usize = 1


			# Get the search filter.
			fltr = search_filters.get(request)


			if fltr == search_filters.VIDEO:

				page = self.get_page(request, psize, post_search.max_result_window)


				if page==None:

					status = 400

				else:

					posts, ptotal = self.get_results( 

						es.post_search(

							q,
							size=psize,
							start=(page-1)*psize
						
						)

					)

					results.update({

						'posts': posts,
						'posts_total': ptotal,
						'posts_next_page': self.next_page(

							page, psize, ptotal, post_search.max_result_window

						)

					})


			elif fltr == search_filters.ACCOUNT:

				page = self.get_page(request, usize, user_search.max_result_window)


				if page==None:

					status = 400

				else:

					users, utotal = self.get_results( 

						es.user_search(
							
							q,
							size=usize,
							start=(page-1) * usize

						) 

					)

					results.update({

						'users': users,
						'users_total': utotal,
						'users_next_page': self.next_page(

							page, usize, utotal, user_search.max_result_window

						),
						'users_only': True

					})


			# If there is no filter search posts and users together.
			else:

				# Get the first set or results for posts and users when there is no filter.
				responses = es.search(q, start=0, posts_size=psize, users_size=min_usize)


				if responses != None:

					responses = responses['responses']

					posts, ptotal = self.get_results( self.get_index(responses, 0) )
					users, utotal = self.get_results( self.get_index(responses, 1) )

					results.update({

						'posts': posts,
						'posts_total': ptotal,
						'posts_next_page': self.next_page(

							1, psize, ptotal, post_search.max_result_window

						),

						'users': users,
						'users_total': utotal,
						'users_next_page': 1 if utotal > min_usize else None

					})				


		if status == 400:

			messages.error(request, _('Search requests are limited to 1000 results.'))


		if request.is_ajax() and request.GET.get('load') == 'true':
			
			results['messages'] = get_messages_json(request)

			return JsonResponse(results, status=status)


		kwargs.update({

			'q': q,
			'results': results

		})


		return super(SearchView, self).get(request, *args, **kwargs)

# ----------------------------------------------------------------------------------------

class AutocompleteView(UloView):

	def get_results(self, key, response):

		if response != None:
			
			try:

				return response['suggest'][key][0]['options']

			except KeyError:

				pass

		return []


	def get(self, request, *args, **kwargs):

		if request.is_ajax():

			results = {}

			q = request.GET.get('q', '')

			if q != '':

				fltr = request.GET.get(search_filters.FILTER_KEY)

				print(fltr == search_filters.ACCOUNT, fltr, search_filters.ACCOUNT)

				if fltr == search_filters.VIDEO:

					results['posts'] = self.get_results(

						'post_suggestions', 
						es.post_autocomplete(q)

					)

				elif fltr == search_filters.ACCOUNT:

					results['users'] = self.get_results(

						'user_suggestions', 
						es.user_autocomplete(q)

					)

				else:

					responses = es.autocomplete(q)

					if responses != None:

						responses = responses.get('responses')

						results.update({

							'posts': self.get_results('post_suggestions', responses[0]),
							'users': self.get_results('user_suggestions', responses[1])

						})


			return JsonResponse(results, status=200)

		raise Http404()

# ----------------------------------------------------------------------------------------



