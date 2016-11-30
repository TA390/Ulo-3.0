# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals
import re, requests

# Core django imports
from django.contrib.auth import get_user_model
from django.db import DatabaseError, IntegrityError, transaction
from django.db.models.fields.files import ImageFieldFile
from django.utils.translation import ugettext_lazy as _

# Thrid party app imports

# Project imports
from search.utils import es
from search.viewmixins import SearchMixin

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class PostSearchVersion0(SearchMixin):

	filters = {

		'token_limit16_filter': {
		
			'type': 'limit',
			'max_token_count': 16
		
		},
		
		'token_limit32_filter': {
		
			'type': 'limit',
			'max_token_count': 32
		
		},

		'bigram_shingle_filter': {

			'type': 'shingle',

			'min_shingle_size': 2, 
			
			'max_shingle_size': 2, 
			
			'output_unigrams':  False   
		
		}

	}

	analyzers = {

		'suggestions_analyser': {

			'type': 'custom',

			'tokenizer': 'icu_tokenizer',

			'filter': [
		
				'icu_normalizer',
				'token_limit32_filter'
			
			]

		},

		'title_analyser': {

			'type': 'custom',

			'char_filter': [

				'icu_normalizer'

			],

			'tokenizer': 'icu_tokenizer',
		
			'filter': [

				'bigram_shingle_filter',
				'token_limit32_filter'
			
			]
		
		},

		'title_shingles_analyser': {
			
			'type': 'custom',

			'char_filter': [

				'icu_normalizer'

			],

			# Split words on word boundaries - Unicode aware.
			'tokenizer': 'icu_tokenizer',

			'filter': [

				# Unicode folding - icu_folding performs character normalisation so no 
				# need to use icu_normalizer as a character or token filter.
				'bigram_shingle_filter'

			]

		},

		'title_folding_analyser': {

			'type': 'custom',
			
			# Split words on word boundaries - Unicode aware.
			'tokenizer': 'icu_tokenizer',

			'filter': [

				# Unicode folding - icu_folding performs character normalisation so no 
				# need to use icu_normalizer as a character or token filter.
				'icu_folding'

			]

		}

	}

	mappings = {

		# Default settings for all types in this index.
		'_default_': {

			# If a new string field contains a date it is automatically converted to a 
			# date field ('type': 'date'). Disable this behaviour and set all date fields 
			# explicitly.
			'date_detection': False,

			# Remove the '_all' field which is a single field that has a value which 
			# is the concatenation of all fields. 
			'_all': {

				'enabled': False

			}

		},

		'post': {

			'properties': {

				'title': {

					'type': 'string',
					'index_options': 'freqs',

					'fields': {

						'shingles': {

							'type': 'string',
							'analyzer': 'title_shingles_analyser'

						},

						'folded': {

							'type': 'string',
							'analyzer': 'title_folding_analyser'

						}

					}

				},

				'thumbnail': {

					'type': 'string',
					'index': 'no',
					'doc_values': False

				},

				'published': {

					'type': 'date',
					'index': 'not_analyzed',
					'format': 'strict_date_optional_time'

				},

				'category': {
				
					'type':'string',
					'index' : 'not_analyzed'
				
				},

				'suggestions' : {

					'type': 'completion',
					'analyzer': 'suggestions_analyser',
					'search_analyzer': 'suggestions_analyser',

				}

			}

		}

	}

	# ------------------------------------------------------------------------------------

	def suggestions(self, document):

		document.update({

			'suggestions': {

				'input': [document['title']]

			}

		})

	# ------------------------------------------------------------------------------------

	def get_fields(self, extra=()):

		return ('title', 'thumbnail', 'published', 'category', *extra)

	# ------------------------------------------------------------------------------------

	def create_index(self):

		index = self.get_index_name()

		es.create_index(

			index=index, max_result_window=self.max_result_window, 
			aliases=self.get_index_aliases(), mappings=self.mappings, filter=self.filters, 
			analyzer=self.analyzers

		)

		es.reassign_aliases(

			remove_indices='_all', add_indices=index, aliases=self.get_live_alias()

		)

		return es.get_aliases()

	# ------------------------------------------------------------------------------------

	def delete_index(self):

		return es.delete_indices(self.get_index_name(), fail_silently=False)	

	# ------------------------------------------------------------------------------------

	def index_model(self):

		from .models import Post

		posts = Post.objects.values( *self.get_fields('id') ).all()

		es.document_bulk(

			self.get_index_name(), self.get_index_types(), method='index', 
			documents=posts, mapping=('_index', '_type', 'id', '_routing'), 
			callback=self.suggestions

		)

	# ------------------------------------------------------------------------------------

	def index_instance(self, instance):

		# Create the document.
		document = { 'id': str(instance.id) }

		for f in self.get_fields():

			v = getattr(instance, f);

			document[f] = v.name if isinstance(v, ImageFieldFile) else v


		# Add autocomplete field
		self.suggestions( document )


		# Index the document
		es.create_document(

			self.get_live_alias(), self.get_index_types(), document=document

		)

	# ------------------------------------------------------------------------------------

	def update_instance(self, instance):

		# Create the document.
		document = { 'id': str(instance.id) }

		for f in self.get_fields():

			v = getattr(instance, f);

			document[f] = v.name if isinstance(v, ImageFieldFile) else v


		# Add autocomplete field
		self.suggestions( document )


		# Update the document
		es.update_document(

			self.get_all_alias(), self.get_index_types(), document=document,
			doc_as_upsert=True

		)


	# ------------------------------------------------------------------------------------

	def delete_instance(self, doc_id):

		# Delete the document
		es.delete_document(

			self.get_all_alias(), self.get_index_types(), doc_id=str(doc_id)

		)

# ----------------------------------------------------------------------------------------

post_search = PostSearchVersion0(

	model='posts', 
	version=0, 
	types=('post',), 
	max_result_window=1000

)

# ----------------------------------------------------------------------------------------



