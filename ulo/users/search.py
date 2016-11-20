# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports
from django.contrib.auth import get_user_model
from django.db.models.fields.files import ImageFieldFile
from django.utils.translation import ugettext_lazy as _

# Thrid party app imports

# Project imports
from search.utils import es
from search.viewmixins import SearchMixin

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class UserSearchVersion0(SearchMixin):

	filters = {

		'username_delimiter' : {

			'type': 'word_delimiter',
			'preserve_original': True

		},

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
		
				'username_delimiter',
				'icu_normalizer',
				'unique',
				'token_limit16_filter'
			
			]

		},

		'name_analyser': {

			'type': 'custom',

			'char_filter': [

				'icu_normalizer'

			],

			'tokenizer': 'icu_tokenizer',
		
			'filter': [

				'unique',
				'token_limit16_filter'
			
			]
		
		},

		'username_analyser': {

			'type': 'custom',
		
			'tokenizer': 'keyword',

			'filter': [
		
				'username_delimiter',
				'icu_normalizer',
				'unique',
				'token_limit16_filter'
			
			]
		
		},

		'name_folding_analyser': {
			
			# Split words on word boundaries - Unicode aware.
			'tokenizer': 'icu_tokenizer',

			'filter': [

				# Unicode folding - icu_folding performs character normalisation so no 
				# need to use icu_normalizer as a character or token filter.
				'icu_folding'

			]

		}

	}

	analysis = {

		'char_filter': {

			'quotes': {
			
				'type': 'mapping',
				
				'mappings': [ 
				
					'\\u0091=>\\u0027',
					'\\u0092=>\\u0027',
					'\\u2018=>\\u0027',
					'\\u2019=>\\u0027',
					'\\u201B=>\\u0027'
				
				]

			}

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

		'user': {

			'properties': {

				'name': {

					'type': 'string',
					'analyzer': 'name_analyser',

					'fields': {

						'folded': {
							
							'type': 'string',
							'analyzer': 'name_folding_analyser'

						}
					}

				},

				'username': {

					'type': 'string',
					'analyzer': 'username_analyser'

				},

				'thumbnail': {

					'type': 'string',
					'index': 'no',
					'doc_values': False

				},

				'date_joined': {

					'type': 'date',
					'index': 'not_analyzed',
					'format': 'strict_date_optional_time'

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

			'suggestions': [

				{
					'input': document['name'],
					'weight': 4
				},
				{
					'input': document['username'],
					'weight': 2
				},

			]

		})

	# ------------------------------------------------------------------------------------

	def get_fields(self, extra=()):

		return ('name', 'username', 'thumbnail', 'date_joined', *extra)

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

		users = get_user_model().objects.values( *self.get_fields(extra=('id')) ).all()

		es.document_bulk(

			self.get_index_name(), self.get_index_types(), method='index', 
			documents=users, mapping=('_index', '_type', 'id', '_routing'), 
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

# ----------------------------------------------------------------------------------------

user_search = UserSearchVersion0(

	model='users', 
	version=0, 
	types=('user',), 
	max_result_window=1000

)

# ----------------------------------------------------------------------------------------



