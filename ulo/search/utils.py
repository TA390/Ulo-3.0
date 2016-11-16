# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals
from collections import deque
import inspect, re, requests

# Core django imports
from django.db import DatabaseError, transaction

# Thrid party app imports

# Project imports
from .serialisers import serialiser

# ----------------------------------------------------------------------------------------




# ELASTICSEARCH EXCEPTIONS
# ----------------------------------------------------------------------------------------

class EsException(Exception):

	pass


class EsDoesNotExist(EsException):

	pass

class EsRequestFailed(EsException):

	pass


class EsVersionConflict(EsException):

	pass


class EsBulkProcessing(EsException):

	pass

# ----------------------------------------------------------------------------------------




# INDEX API MIXIN
# ----------------------------------------------------------------------------------------

class IndexAPIMixin(object):

	# ------------------------------------------------------------------------------------
	# CRUD
	# ------------------------------------------------------------------------------------

	def create_index(self, index, **kwargs):
		"""

		Create a new index.

		NOTE: Static settings can only be set on a new or closed index. Dynamic settings 
		can be changed on a live index via the update-index-settings API.

		@param index: Index name.
		
		"""

		data = {

			'settings': {
		
				'index': {

					# Static Settings
					'number_of_shards': kwargs.get('number_of_shards', 5),

					# Dynamic Settings
					'number_of_replicas':  kwargs.get('number_of_replicas', 1),
					'max_result_window': kwargs.get('max_result_window', 10000),

					'analysis': {

						**kwargs.get('custom_analyzers', {}),

						'filter': kwargs.get('filter', {}),

						'tokenizer': kwargs.get('tokenizer', {}),

						'analyzer': kwargs.get('analyzer', {})

					}
				
				},

				'similarity': kwargs.get('similarity', {})
			
			},

			'aliases': kwargs.get('aliases', {}),

			'mappings': kwargs.get('mappings', {}),
			
			'timeout': kwargs.get('timeout', '30s')
		
		}

		return self.request_response(
			
			requests.put(self.get_url(index), data=serialiser.dumps(data)),
			
			**kwargs

		)

	# ------------------------------------------------------------------------------------

	def get_indices(self, indices, filters=None, **kwargs):
		"""

		Return the indices.

		@param indices: Comma separated string of indices or '*' or '_all'. No spaces.
		@param filters: Optional comma separated string of filters. No spaces.
			E.g. '_settings,_mappings'
		
		"""

		return self.request_response(

			requests.get(self.get_url(indices, filters)),

			**kwargs

		)

	# ------------------------------------------------------------------------------------

	def indices_exists(self, indices):
		"""

		Return True if the indices exist and False if they do not.
		
		@param indices: Comma separated string of indices or '*' or '_all'. No spaces.
		
		"""

		return self.exists_response(self.get_url(indices))

	# ------------------------------------------------------------------------------------

	def delete_indices(self, indices, **kwargs):
		"""

		Delete indices.

		NOTE: In order to disable allowing to delete indices via wildcards or _all, set 
		action.destructive_requires_name setting in the config to true.

		@param indices: Comma separated string of indices or '*' or '_all'. No spaces.
		
		"""

		return self.request_response( 

			requests.delete(self.get_url(indices)),

			**kwargs

		)

	# ------------------------------------------------------------------------------------
	# CRUD
	# ------------------------------------------------------------------------------------


	# ------------------------------------------------------------------------------------
	# SETTINGS
	# ------------------------------------------------------------------------------------

	def get_indices_settings(self, indices, filter_by_name=None, **kwargs):
		"""
		
		Return the index settings for the indices.

		@param indices: Comma separated string of indices or '*' or '_all'. No spaces.
		@param filter_by_name: Optional filter or wildcard pattern. E.g. 'index.number_*'.

		"""

		params = {} if filter_by_name==None else {'name': filter_by_name}

		return self.request_response( 

			requests.get(self.get_url(indices, '_settings', params=params)),

			**kwargs

		)

	# ------------------------------------------------------------------------------------

	def update_dynamic_index_settings(self, indices, settings, **kwargs):
		"""

		Update the dynamic settings values.

		@param indices: Comma separated string of indices or '*' or '_all'. No spaces.
		@param settings: Dynamic index settings. E.g. index.number_of_replicas.

		"""

		return self.request_response( 

			requests.put( 

				self.get_url(indices, '_settings'), 

				data=serialiser.dumps({ 'index': settings }) 

			),

			**kwargs

		)

	# ------------------------------------------------------------------------------------

	def update_static_index_settings(self, indices, settings, **kwargs):
		"""

		Update the static settings values.

		@param indices: Comma separated string of indices or '*' or '_all'. No spaces.
		@param settings: Static index settings. E.g. index.number_of_shards.

		"""

		self.close_indices(indices, fail_silently=False)

		response = self.request_response( 

			requests.put( 

				self.get_url(indices, '_settings'), 

				data=serialiser.dumps({ 'index': settings }) 

			),

			**kwargs

		)

		self.open_indices(indices, fail_silently=False)

		return response



	# ------------------------------------------------------------------------------------
	# END SETTINGS
	# ------------------------------------------------------------------------------------


	# ------------------------------------------------------------------------------------
	# ALIASES
	# ------------------------------------------------------------------------------------

	def get_aliases(self, indices=None, aliases=None, **kwargs):
		"""

		Return the alias names for the indices.

		@param indices: Comma separated string of indices or '*' or '_all'. No spaces.
		@param aliases: Comma separated string of aliases or '*' or '_all'. No spaces.

		"""

		# Optional boolean argument to determine what happens if an index does not exist.
		params = self.bool_params_to_str(('ignore_unavailable',), kwargs)

		return self.request_response(
			
			requests.get( 

				self.get_url(indices, '_alias', aliases, params=params)

			),
			
			**kwargs

		)

	# ------------------------------------------------------------------------------------

	def aliases_exists(self, indices=None, aliases='*', **kwargs):
		"""

		Return True if the aliases exist and False if they do not.
		
		@param indices: Comma separated string of indices or '*' or '_all'. No spaces.
		@param aliases: Alias name, wildcard pattern or '*'.

		"""

		return self.exists_response(
			
			self.get_url(indices, '_alias', aliases, **kwargs)

		)

	# ------------------------------------------------------------------------------------

	def set_aliases(self, indices, aliases, filters={}, **kwargs):
		"""

		Set aliases for the indices.

		@param indices: Index name or array of index names.
		@param aliases: Alias name or array of alias names.
		@param filters: Optional filters.
		@param kwargs: Routing values: 'routing', 'search_routing', 'index_routing'
		
		"""

		for arg in (indices, aliases):
			if isinstance(arg, str):
				arg = [arg]


		data = {

			'actions': [{ 

				'add': { 'index':indices, 'alias':aliases, 'filter':filters } 

			}]

		}


		for key in ('routing', 'search_routing', 'index_routing'):
			if key in kwargs:
				data['actions']['add'][key] = kwargs[key]


		return self.request_response(
			
			requests.post( 

				self.get_url('_aliases', **kwargs), data=serialiser.dumps(data)

			),
			
			**kwargs

		)

	# ------------------------------------------------------------------------------------

	def delete_aliases(self, indices, aliases, **kwargs):
		"""

		Delete aliases for the indices.

		@param indices: Comma separated string of indices or '*' or '_all'. No spaces.
		@param aliases: Comma separated string of aliases or '*' or '_all'. No spaces.

		"""

		return self.request_response(
			
			requests.delete( 

				self.get_url(indices, '_alias', aliases, **kwargs)

			),
			
			**kwargs

		)

	# ------------------------------------------------------------------------------------

	def reassign_aliases(self, remove_indices, add_indices, aliases, **kwargs):
		"""

		Remove the alises from remove_indices and assign them to add_indices.

		@param remove_indices: Index name or array of index names.
		@param add_indices: Index name or array of index names.
		@param aliases: Alias name or array of alias names.

		"""
		
		for arg in (remove_indices, add_indices, aliases):
			if isinstance(arg, str):
				arg = [arg]

		data = {

			'actions': [{ 

				'remove': { 'index': remove_indices, 'alias': aliases },

				'add': { 'index': add_indices, 'alias': aliases } 

			}]

		}

		return self.request_response(
			
			requests.post( 

				self.get_url('_aliases', **kwargs), data=serialiser.dumps(data)

			),
			
			**kwargs

		)

	# ------------------------------------------------------------------------------------
	# END ALIASES
	# ------------------------------------------------------------------------------------


	# ------------------------------------------------------------------------------------
	# MAPPING
	# ------------------------------------------------------------------------------------

	def get_mapping(self, indices=None, types=None, **kwargs):
		"""
		
		Return the mapping for the indices and types.

		@param indices: Comma separated string of indices or '*' or '_all'. No spaces.
		@param types: Comma separated string of index types or '*' or '_all'. No spaces.
		
		"""
		
		return self.request_response(
			
			requests.get( 

				self.get_url(indices, types, '_mapping', **kwargs), 

			),
			
			**kwargs

		)

	# ------------------------------------------------------------------------------------

	def get_field_mapping(self, indices, fields, types=None, **kwargs):
		"""

		Return the mapping definitions for one or more fields.

		@param indices: Comma separated string of indices or '*' or '_all'. No spaces.
		@param fields: Comma separated string of field names. No spaces.
		@param types:  Comma separated string of index types or '*' or '_all'. No spaces.

		"""

		# Optional boolean parameter to determine if default values are included.
		params = self.bool_params_to_str(('include_defaults',), kwargs)

		return self.request_response(
			
			requests.get( 

				self.get_url(

					indices, '_mapping', types, 'field', fields, params=params

				), 

			),
			
			**kwargs

		)

	# ------------------------------------------------------------------------------------

	def set_mapping(self, indices, index_type, properties, **kwargs):
		"""

		Apply the mapping ('properties') to the indices with a type 'index_type'.

		NOTE: Fields in the same index with the same name in two different types must 
		have the same mapping, as they are backed by the same field internally. Trying to 
		update a mapping parameter for a field which exists in more than one type will 
		throw an exception, unless you specify the update_all_types parameter, in which 
		case it will update that parameter across all fields with the same name in the 
		same index.

		@param indices: Comma separated string of indices or '*' or '_all'. No spaces.
		@param index_type: Index type.
		@param properties: Index mapping.

		"""

		# Optional boolean parameter to determine if the mapping is applied to all types 
		# in the index.
		params = self.bool_params_to_str(('update_all_types',), kwargs)

		return self.request_response(
			
			requests.put( 

				self.get_url(indices, '_mapping', index_type, params=params), 
				
				data=serialiser.dumps({ 'properties': properties }) 

			),
			
			**kwargs

		)

	# ------------------------------------------------------------------------------------
	# END MAPPING
	# ------------------------------------------------------------------------------------


	# ------------------------------------------------------------------------------------
	# OPEN AND CLOSE
	# ------------------------------------------------------------------------------------

	def _open_close_indices(self, indices, action, **kwargs):
		"""

		Open or close the indices.

		@param action: '_open' or '_close'.
		@param indices: Comma separated string of indices or '*' or '_all'. No spaces.

		"""

		# Optional boolean argument to determine what happens if an index does not exist.
		params = self.bool_params_to_str(('ignore_unavailable',), kwargs)

		return self.request_response( 

			requests.post(self.get_url(indices, action, params=params)),

			**kwargs

		)

	# ------------------------------------------------------------------------------------

	def close_indices(self, indices, **kwargs):
		"""

		Close the indices.

		NOTE: Closed indices consume a significant amount of disk-space which can cause 
		problems issues in managed environments. Closing indices can be disabled via the 
		cluster settings API by setting cluster.indices.close.enable to false. The default 
		is true.

		@param indices: Comma separated string of indices or '*' or '_all'. No spaces.

		"""

		return self._open_close_indices(indices, '_close', **kwargs)

	# ------------------------------------------------------------------------------------

	def open_indices(self, indices, **kwargs):
		"""

		Open the indices.
		
		@param indices: Comma separated string of indices or '*' or '_all'. No spaces.

		"""

		return self._open_close_indices(indices, '_open', **kwargs)

	# ------------------------------------------------------------------------------------
	# END OPEN AND CLOSE
	# ------------------------------------------------------------------------------------


	# ------------------------------------------------------------------------------------
	# TYPES
	# ------------------------------------------------------------------------------------

	def types_exists(self, indices, types):
		"""

		Return True if the types exist and False if they do not.
		
		@param indices: Comma separated string of indices or '*' or '_all'. No spaces.
		@param types:  Comma separated string of index types. No spaces.
		
		"""

		return self.exists_response(self.get_url(indices, types))

	# ------------------------------------------------------------------------------------
	# END TYPES
	# ------------------------------------------------------------------------------------


	# ------------------------------------------------------------------------------------
	# TEMPLATES
	# ------------------------------------------------------------------------------------

	def create_template(self, name, template):
		"""

		Create a template to define properties that will be applied to new indices when 
		they are created.

		@param name: template name.
		@param template: template data.

		"""

		return self.request_response(

			requests.put(

				self.get_url('_template', name), 

				data=serialiser.dumps(template)

			)
		)

	# ------------------------------------------------------------------------------------

	def get_templates(self, *names):
		"""

		Return the templates.

		@param names: One or more template names or '*' for all templates.

		"""

		return self.request_response(

			requests.get(self.get_url('_template', ','.join(names)))

		)

	# ------------------------------------------------------------------------------------

	def templates_exists(self, *names):
		"""

		Return True if the templates exist and False if they do not.

		@param names: One or more template names or '*' for all templates.

		"""

		return self.exists_response(self.get_url('_template', ','.join(names)))

	# ------------------------------------------------------------------------------------

	def delete_template(self, name):
		"""

		Delete an existing template.

		@param name: template name.

		"""

		return self.request_response(

			requests.delete(self.get_url('_template', name))

		)

	# ------------------------------------------------------------------------------------
	# END TEMPLATES
	# ------------------------------------------------------------------------------------


	# ------------------------------------------------------------------------------------
	# ANALYSIS
	# ------------------------------------------------------------------------------------
	
	def analyse_text(self, *index, data, explain=False):
		"""
		
		Analyse the text and return the result.

		@param index: Optional index/alias name.
		@param data: Dictionary containing the text and analyzers.
		@param explain: If True include advanced information.

		"""

		data['explain'] = explain

		return self.request_response(

			requests.get(

				self.get_url(*index, '_analyze'), 

				data=serialiser.dumps(data).encode('utf-8')

			)

		)

	# ------------------------------------------------------------------------------------
	# END ANALYSIS
	# ------------------------------------------------------------------------------------


	# ------------------------------------------------------------------------------------
	# INFORMATION
	# ------------------------------------------------------------------------------------

	def get_indices_stats(self, *indices, **kwargs):
		"""

		Return statistical information for the indices.

		@param indices: One or more index/alias names or '*' for all indices.

		"""

		return self.request_response(
			
			requests.get( 

				self.get_url(','.join(indices), '_stats', **kwargs)

			),
			
			**kwargs

		)

	# ------------------------------------------------------------------------------------

	def get_indices_segments(self, *indices, **kwargs):
		"""

		Return low level segment information for the indices

		@param indices: One or more index/alias names or '*' for all indices.

		"""

		return self.request_response(
			
			requests.get( 

				self.get_url(','.join(indices), '_segments', **kwargs)

			),
			
			**kwargs

		)

	# ------------------------------------------------------------------------------------

	def get_indices_recovery_info(self, *indices, **kwargs):
		"""

		Return information on the indices shard recoveries.

		@param indices: One or more index/alias names or '*' for all indices.

		"""

		return self.request_response(
			
			requests.get( 

				self.get_url(','.join(indices), '_recovery', **kwargs)

			),
			
			**kwargs

		)

	# ------------------------------------------------------------------------------------

	def get_indices_shard_stores(self, *indices, status='red,yellow,green', **kwargs):
		"""

		Return information on which nodes shard copies exist.

		@param indices: One or more index/alias names or '*' for all indices.
		@param status: comma separated string of node health values to return data for
			nodes with one of the current health values (defaults to all).

		"""

		return self.request_response(
			
			requests.get( 

				self.get_url(

					','.join(indices), '_shard_stores', params={'status': status}

				)

			),
			
			**kwargs

		)

	# ------------------------------------------------------------------------------------
	# END INFORMATION
	# ------------------------------------------------------------------------------------

	
	# ------------------------------------------------------------------------------------
	# MAINTENANCE
	# ------------------------------------------------------------------------------------

	def clear_cache(self, *indices):
		"""

		Clear the caches associated with the indices.
		
		NOTE: The API, by default, will clear all caches. Specific caches can be cleaned 
		explicitly by setting query, fielddata or request.
		All caches relating to a specific field(s) can also be cleared by specifying 
		fields parameter with a comma delimited list of the relevant fields.

		@param indices: One or more index/alias names or '*' for all indices.

		"""

		return self.request_response(

			requests.post(

				self.get_url( ','.join(indices), '_cache', 'clear')

			)

		)

	# ------------------------------------------------------------------------------------

	def flush_indices(self, *indices, synced=False):
		"""
		
		NOTE: The flush API allows to flush one or more indices through an API. The flush 
		process of an index basically frees memory from the index by flushing data to the 
		index storage and clearing the internal transaction log. By default, 
		Elasticsearch uses memory heuristics in order to automatically trigger flush 
		operations as required in order to clear memory.

		@param indices: One or more index/alias names or '*' for all indices.
		@param synced: See https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-synced-flush.html

		Request parameters: 'wait_if_ongoing' and 'force'. See:
		https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-flush.html

		"""

		args = ('_flush',) if synced==False else ('_flush', 'synced')

		return self.request_response(

			requests.post(

				self.get_url( ','.join(indices), *args)

			)

		)

	# ------------------------------------------------------------------------------------

	def refresh_indices(self, *indices):
		"""

		Refresh the indices.

		@param indices: One or more index/alias names or '*' for all indices.

		"""

		return self.request_response(

			requests.post(

				self.get_url(','.join(indices), '_refresh')

			)

		)

	# ------------------------------------------------------------------------------------

	def force_merge(self, *indices, **params):
		"""

		Reduce the number of segments in each index by merging them together.

		@param indices: One or more index/alias names or '*' for all indices.

		URL parameters: 'max_num_segments', 'only_expunge_deletes' and 'flush'. See:
		https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-forcemerge.html

		"""

		return self.request_response(

			requests.post(

				self.get_url(','.join(indices), '_forcemerge', params=params)

			)

		)

	# ------------------------------------------------------------------------------------
	# END MAINTENANCE
	# ------------------------------------------------------------------------------------


# END INDEX API MIXIN
# ----------------------------------------------------------------------------------------





# DOCUMENT API MIXIN
# ----------------------------------------------------------------------------------------

class DocumentAPIMixin(object):

	DOC_ID_FIELD_NAME = 'id'

	# ------------------------------------------------------------------------------------

	def create_or_replace_document(self, index, index_type, document, doc_id=None, 
		response_kwargs={}, **params):
		"""

		Create a new document or replace the existing document by the id.

		@param index: Index name.
		@param index_type: Index type.
		@param document: Dictionary representing the document.
		@param doc_id: If None pop the DOC_ID_FIELD_NAME attribute from the document else 
			use its value as the document id.
		@param response_kwargs: Kwargs passed to the request_response function.
		@param params: Url parameters: routing, version, version_type, op_type, parent,
			refresh, timeout.

		"""

		if doc_id==None:

			doc_id=document.pop(self.DOC_ID_FIELD_NAME)

		return self.request_response(

			requests.put(

				self.get_url(index, index_type, str(doc_id), params=params),

				data=serialiser.dumps(document)

			),

			**response_kwargs

		)

	# ------------------------------------------------------------------------------------

	def create_document(self, index, index_type, document, doc_id=None, 
		response_kwargs={}, **params):
		"""

		Create a new document.

		@param index: Index name.
		@param index_type: Index type.
		@param document: Dictionary representing the document.
		@param doc_id: If None pop the DOC_ID_FIELD_NAME attribute from the document else 
			use its value as the document id.
		@param response_kwargs: Kwargs passed to the request_response function.
		@param params: Url parameters: routing, version, version_type, parent, refresh, 
			timeout.

		"""

		if doc_id == None:

			doc_id = document.pop(self.DOC_ID_FIELD_NAME)


		response = self.request_response(

			requests.put(

				self.get_url( 

					index, index_type, doc_id, '_create', params=params

				),

				data=serialiser.dumps(document)

			),

			**response_kwargs

		)

		if response == None or response.get('created') == False:

			if response_kwargs.get('fail_silently') == True:

				return None

			raise EsException('The document was not created')


		return response

	# ------------------------------------------------------------------------------------

	def update_document(self, index, index_type, document, doc_id=None, upsert=None, 
		detect_noop=True, doc_as_upsert=False, response_kwargs={}, **params):
		"""

		Update an existing document using a partial document.

		@param index: Index name.
		@param index_type: Index type.
		@param document: Dictionary representing the document.
		@param doc_id: If None pop the DOC_ID_FIELD_NAME attribute from the document else 
			use its value as the document id.
		@param upsert: Optional document that will be created before applying the update
			only if the document does not exist.
		@param detect_noop: If True update the document only if the _source field values 
			have changed else if False reindex the document regardless.
		@param doc_as_upsert: If True use the document as the upsert value instead of
			providing an additional document as the upsert value.
		@param response_kwargs: Kwargs passed to the request_response function.
		@param params: Url parameters: routing, retry_on_conflict, parent, timeout,  
			consistency, refresh, fields, version, version_type

		"""

		if doc_id==None:

			doc_id=document.pop(self.DOC_ID_FIELD_NAME)

		data = {

			'doc': document,

			'detect_noop': detect_noop,

			'doc_as_upsert': doc_as_upsert

		}

		if upsert!=None:

			data['upsert'] = upsert


		r = self.request_response(

			requests.post(

				self.get_url(index, index_type, doc_id, '_update', params=params),

				data=serialiser.dumps(data)

			),

			**response_kwargs

		)

	# ------------------------------------------------------------------------------------

	def update_script(self, index, index_type, script, doc_id, upsert=None, 
		scripted_upsert=False, response_kwargs={}, **params):
		"""

		Update an existing document using a script to manipulate the field values.

		NOTE: add 'script.engine.groovy.inline.update: on' to the elasticsearch.yml file if
		you must use script updates. It defaults to off for security reasons.

		@param index: Index name.
		@param index_type: Index type.
		@param script: Script to execute.
		@param doc_id: Document id.
		@param upsert: Optional document that will be created before applying the script
			only if the document does not exist.
		@param scripted_upsert: If True run the script even if the document does not 
			exist. The script will handle the initialisation.
		@param response_kwargs: Kwargs passed to the request_response function.
		@param params: Url parameters: routing, retry_on_conflict, parent, timeout,  
			consistency, refresh, fields, version, version_type

		"""

		data = {

			'script': script,

			'scripted_upsert': scripted_upsert

		}

		if upsert!=None:

			data['upsert'] = upsert

		return self.request_response(

			requests.post(

				self.get_url(index, index_type, doc_id, '_update', params=params),

				data=serialiser.dumps(data)

			),

			**response_kwargs

		)

	# ------------------------------------------------------------------------------------

	def get_document(self, index, index_type, doc_id, response_kwargs={}, **params):
		"""

		Return an existing document.

		@param index: Index name.
		@param index_type: Index type or '_all'
		@param doc_id: Document id.
		@param response_kwargs: Kwargs passed to the get_request_response function.
		@param params: Url parameters: routing, realtime, fields, _source, _source_include, 
			_source_exclude, ignore_errors_on_generated_fields, preference, refresh, version

		"""

		return self.document_request_response(

			requests.get(

				self.get_url(index, index_type, doc_id, params=params)

			),

			**response_kwargs

		)

	# ------------------------------------------------------------------------------------

	def get_documents(self, *path, data, response_kwargs={}, **params):
		"""

		Return all documents requested. Does not raise an exception if the documents are
		not found.

		@param path: Optional index name or index name, index type or '_all'.
		@param data: List of document ids or Dictionaries containing document information
			E.g. _id, _type, _source, _source: { 'include', 'exclude' }, fields.
		@param response_kwargs: Kwargs passed to the get_request_response function.
		@param params: Url parameters: _source, _source_include, _source_exclude, 
			fields, ignore_errors_on_generated_fields, routing.

		"""

		data = { 'ids' if isinstance(data[0], str) else 'docs': data }

		return self.request_response(

			requests.get(

				self.get_url(*path, '_mget', params=params),

				data=serialiser.dumps(data)

			),

			**response_kwargs

		)

	# ------------------------------------------------------------------------------------

	def document_exists(self, index, index_type, doc_id):
		"""

		Return True if the document exists and False if they do not.

		@param index: Index name.
		@param index_type: Index type.
		@param doc_id: Document id.

		"""

		return self.exists_response(self.get_url(index, index_type, doc_id))

	# ------------------------------------------------------------------------------------

	def get_source(self, index, index_type, doc_id, response_kwargs={}, **params):
		"""

		Return the _souce field of the document.

		@param index: Index name.
		@param index_type: Index type or '_all'.
		@param doc_id: Document id.
		@param response_kwargs: Kwargs passed to the request_response function.
		@param params: Url parameters: routing, _source_include, _source_exclude,
			preference, refresh, version

		"""

		response = requests.get(

			self.get_url(index, index_type, doc_id, '_source', params=params)

		)

		if response.status_code==200:
			return response.json()
		
		elif response_kwargs.get('fail_silently', False)==True:
			return None

		else:
			raise EsDoesNotExist('ElasticSearch get_source: Does Not Exists.')

	# ------------------------------------------------------------------------------------

	def source_exists(self, index, index_type, doc_id):
		"""

		Return True if the document exists and False if they do not.

		@param index: Index name.
		@param index_type: Index type.
		@param doc_id: Document id.

		"""

		return self.exists_response( 

			self.get_url(index, index_type, doc_id, '_source') 

		)

	# ------------------------------------------------------------------------------------

	def delete_document(self, index, index_type, doc_id, response_kwargs={}, **params):
		"""

		Delete an existing document.

		@param index: Index name.
		@param index_type: Index type.
		@param doc_id: Document id.
		@param response_kwargs: Kwargs passed to the request_response function.
		@param params: Url parameters: routing, version, parent, consistency, refresh,
			timeout

		"""
		return self.document_request_response(

			requests.delete(

				self.get_url(index, index_type, doc_id, params=params)

			),

			**response_kwargs

		)

	# ------------------------------------------------------------------------------------

	def delete_all_documents(self, indices, types=None, response_kwargs={}, **params):
		"""

		NOTE: EXPERIMENTAL API WHICH MAY CHANGE.

		Delete an existing document.

		@param indices: Comma separated string on indices.
		@param types: Comma separated string on index types.
		@param response_kwargs: Kwargs passed to the request_response function.

		"""

		return self.request_response(

			requests.delete(

				self.get_url(indices, types, '_delete_by_query', params=params),

				data = serialiser.dumps({ 'query': { 'match_all' : {} } })

			),

			**response_kwargs

		)

	# ------------------------------------------------------------------------------------

	def bulk_header(self, method, document, mapping=None):

		h = { method: {} }

		headers = ('_index', '_type', '_id', '_routing')

		if mapping==None:
			mapping=headers

		for i, key in enumerate(mapping):
			if key in document:
				h[method][headers[i]] = document.pop(key)

		return h

	# ------------------------------------------------------------------------------------

	def document_bulk(self, *path, method, documents, mapping=None, callback=None,
		response_kwargs={}, **params):
		"""

		Document bulk API.

		@param path: Optional index name or index name, index type.
		@param documents: Array of JSON documents including any header information.
		@param response_kwargs: Kwargs passed to the request_response function.
		@param params: Url parameters.

		"""

		documents = deque(documents)

		data = ''

		try:

			while True:
	
				document = documents.pop()

				if callback != None:
					callback(document)

				data += serialiser.dumps( 

					self.bulk_header(method, document, mapping), encode=False

				) + '\n'

				data += serialiser.dumps( 

					document.get('_source', document), encode=False 

				) + '\n'

		except IndexError:
			
			pass


		return self.bulk_request_response(

			requests.post(

				self.get_url(*path, '_bulk', params=params),

				data=data.encode('utf8')

			),

			**response_kwargs

		)

	# ------------------------------------------------------------------------------------
	# REINDEX
	# ------------------------------------------------------------------------------------

	def reindex(self, old_index, new_index, date_field, date_from, date_to, size=2, scroll='1m'):
		"""

		NOTE: The number of documents each request will be size * number_of_primary_shards

		@param size: Number or documents to get each request.
		@param scroll: Time to keep the scroll window (per request).

		"""

		response = self.request_response( 

			requests.get(

				self.get_url(old_index, '_search', params={'scroll': scroll}),

				data=serialiser.dumps({

					'query': { 

						'range': {

							date_field: {

								'gte': date_from,
								'lte': date_to

							}

						}

					},

					'sort': ['_doc'],

					'size': size

				})

			)

		)

		try:

			mapping = (None, '_type', '_id', '_routing')	

			while True:

				documents = response['hits']['hits']

				if documents==[]:
					return response

				self.document_bulk(new_index, method='index', documents=documents, mapping=mapping)

				response = self.request_response( 
					
					requests.get(

						self.get_url('_search', 'scroll'),

						data=serialiser.dumps({

							'scroll': scroll,
							'scroll_id': response['_scroll_id']

						})

					)

				)

		except IndexError:

			raise EsException('Reindex: ' + old_index + ' to ' + new_index + 'failed.')

	# ------------------------------------------------------------------------------------
	# END REINDEX
	# ------------------------------------------------------------------------------------

# END DOCUMENT API MIXIN
# ----------------------------------------------------------------------------------------




# SEARCH API MIXIN
# ----------------------------------------------------------------------------------------

class SearchAPIMixin(object):

	# ------------------------------------------------------------------------------------

	indices = {

		'posts': 'posts_indices',
		'users': 'users_indices'

	}

	suggestions = 'suggestions'

	# ------------------------------------------------------------------------------------

	def post_autocomplete_query(self, query, media_type):

		return {
			
			'size': 0, 
			
			'suggest':{
			
				'text': query,	
			
				'post_suggestions' : {
			
					'completion': {	
			
						# Name of the field to run the query against.
						'field': 'suggestions',

						# Number of suggestions returned.
						'size': '5',

						# Use the default fuzzy settings.
						'fuzzy': {

							# Do not fuzzy match the first 3 characters.
							'prefix_length': '3',

							# Max number of fuzzy options.
							'max_expansions': '10'

						},

						'context': {

							'media': media_type

						}
		
					}
		
				}
		
			}
		
		}

	# ------------------------------------------------------------------------------------

	def post_autocomplete(self, query, media_type='null', types=None, fail_silently=True, 
		**param_kwargs):

		return self.request_response(

			requests.get(

				self.get_url(self.indices['posts'], types, '_search', params=param_kwargs),

				data=serialiser.dumps( self.post_autocomplete_query(query, media_type) )
		
			),

			fail_silently=fail_silently

		)

	# ------------------------------------------------------------------------------------

	def user_autocomplete_query(self, query):

		return {
			
			'size': 0,
			
			'suggest':{
			
				'text': query,	
			
				'user_suggestions' : {
			
					'completion': {	
			
						# Name of the field to run the query against.
						'field': 'suggestions',

						# Number of suggestions returned.
						'size': '5',

						# Use the default fuzzy settings.
						'fuzzy': {

							# Do not fuzzy match the first 3 characters.
							'prefix_length': '3',

							# Max number of fuzzy options.
							'max_expansions': '10'

						}
		
					}
		
				}
		
			}
		
		}

	# ------------------------------------------------------------------------------------

	def user_autocomplete(self, query, types=None, fail_silently=True, **param_kwargs):

		return self.request_response(

			requests.get(

				self.get_url(self.indices['users'], types, '_search', params=param_kwargs),

				data=serialiser.dumps( self.user_autocomplete_query(query) )
		
			),

			fail_silently=fail_silently

		)

	# ------------------------------------------------------------------------------------

	def autocomplete(self, query, media_type='null', fail_silently=True, **param_kwargs):

		data =  '{ "index": "%s" }\n' %(self.indices['posts'])
		data += serialiser.dumps( 

			self.post_autocomplete_query(query, media_type), encode=False 

		) + '\n'
		
		data += '{ "index": "%s" }\n' %(self.indices['users'])
		data += serialiser.dumps( 

			self.user_autocomplete_query(query), encode=False 

		) + '\n'

		return self.request_response(

			requests.get(

				self.get_url('_msearch', params=param_kwargs),

				data=data.encode('utf8')
		
			),

			fail_silently=fail_silently

		)

	# # ------------------------------------------------------------------------------------

	# def autocomplete(self, query, indices=None, types=None, fail_silently=True, **param_kwargs):

	# 	data = {

	# 		'text': query,

	# 		'suggestions': {

	# 			'completion': {

	# 				# Nmae of the field to run the query against.
	# 				'field': 'suggestions',

	# 				# Number of suggestions returned.
	# 				'size': '10',

	# 				# Use the default fuzzy settings.
	# 				'fuzzy': {

	# 					# Do not fuzzy match the first 3 characters.
	# 					'prefix_length': '3',

	# 					# Max number of fuzzy options.
	# 					'max_expansions': '10'

	# 				}

	# 			}

	# 		}

	# 	}

	# 	return self.request_response(

	# 		requests.get(

	# 			self.get_url(indices, types, '_suggest', params=param_kwargs),

	# 			data=serialiser.dumps( data )
		
	# 		),

	# 		fail_silently=fail_silently

	# 	)

	# ------------------------------------------------------------------------------------

	def post_query(self, query, start, size):

		return {

			'from': start,

			'size': size,

			'_source': ['title', 'thumbnail', 'media_type', 'published'],

			'query': {

				'bool': {

					'must': {

						'multi_match' : {

							'query': query,

							# Take the score from the best matching field (plus any
							# tie_breaker generated score if defined).
							'type': 'best_fields',

							'fields': ['title^2', 'title.folded'],

							# Multiply tie_breaker by all other matching fields (i.e. not
							# including the best match). This value is added to the final   
							# score before normalisation.
							'tie_breaker': 0.3,

							# Give less weight to terms that appear in more that N% of
							# documents (high frequency terms). E.g. 0.01 == 1%
							'cutoff_frequency': 0.01,

							# If using 'cutoff_frequency' this will only apply to the low
							# frequency terms.
							'minimum_should_match': "60%"

						}

					},

					'should': {

						'match': {

							'title.shingles': query

						}

					}

				}
			
			}
		
		}


	# 'dis_max': {

	# 	'queries':  [

	# 		{

	# 			'match': {
					
	# 				'name': {
					
	# 					'query': 'Taha',
					
	# 					'minimum_should_match': '50%'
				
	# 				}
	# 			}

	# 		},

	# 		{

	# 			'match': {

	# 				'username': {
						
	# 					'query': 'Taha',
					
	# 					'minimum_should_match': '50%'
				
	# 				}
				
	# 			}

	# 		},
	# 	],

	# 	'tie_breaker': '0.3'
	
	# }

	# # dis_max - Take the best matching field and use its score as the
	# # overall score (plus any tie_breaker scores).
	# 'dis_max': {

	# 	'queries': [

	# 		{ 'match': { 'name': 'Taha' } },
	# 		{ 'match': { 'username': 'Taha' } }

	# 	],

	# 	# tie_breaker - Multiply the score of each matching clause 
	# 	# excluding the best match with tie_breaker.
	# 	'tie_breaker': 0.3

	# }

	# 'match': {
	
	# 	'name': {

	# 		'query': 'TFHA',
	# 		'minimum_should_match': '2<75%'
	# 	}

	# }

	# 'constant_score': {

	# 	'filter': {

	# 		'term': {

	# 			'date_joined': '2016-04-04' 

	# 		}

	# 	}

	# }

	# ------------------------------------------------------------------------------------

	def post_search(self, query, start=0, size=10, media_type=None, fail_silently=False, 
		**param_kwargs):
		"""
		"""

		data = self.post_query(query, start, size)

		if media_type != None:

			data.update({

				'filter': {

					'term': {

						'media_type': media_type

					}

				}

			})

		# Return the _source only in each hit.
		param_kwargs['filter_path'] = 'hits.hits, hits.total'

		return self.request_response(

			requests.get(

				self.get_url(self.indices['posts'], '_search', params=param_kwargs),

				data=serialiser.dumps( data )

			),

			fail_silently=fail_silently

		)

	# ------------------------------------------------------------------------------------

	def user_query(self, query, start, size):

		return {

			'from': start,

			'size': size,

			'_source': ['name', 'username', 'thumbnail'],

			'query': {

				'multi_match' : {

					'query': query,

					# Take the score from the best matching field (plus any
					# tie_breaker generated score if defined).
					'type': 'best_fields',

					'fields': ['name^2', 'username'],

					# Multiply tie_breaker by all other matching fields (i.e. not
					# including the best match). This value is added to the final   
					# score before normalisation.
					'tie_breaker': '0.3',

					'minimum_should_match': '60%',

				}

			}

		}

	# ------------------------------------------------------------------------------------

	def user_search(self, query, start=0, size=10, fail_silently=True, **param_kwargs):

		# Return the _source only in each hit.
		param_kwargs['filter_path'] = 'hits.hits, hits.total'

		return self.request_response(

			requests.get(

				self.get_url(self.indices['users'], '_search', params=param_kwargs),

				data=serialiser.dumps( self.user_query(query, start, size) )

			),

			fail_silently=fail_silently

		)

	# ------------------------------------------------------------------------------------

	def search(self, query, start=0, posts_size=10, users_size=10, fail_silently=True, **param_kwargs):
		"""

		@param params: Url parameters: search_type, request_cache

		"""
		
		data =  '{ "index": "%s" }\n' %(self.indices['posts'])
		data += serialiser.dumps( 

			self.post_query(query, start, posts_size), encode=False 

		) + '\n'

		data += '{ "index": "%s" }\n' %(self.indices['users'])
		data += serialiser.dumps( 

			self.user_query(query, start, users_size), encode=False 

		) + '\n'

		# Return the _source only in each hit.
		#param_kwargs['filter_path'] = 'responses.hits.hits, responses.hits.total'

		return self.request_response(

			requests.get(

				self.get_url('_msearch', params=param_kwargs),

				data=data.encode('utf8')

			),

			fail_silently=fail_silently

		)

	# ------------------------------------------------------------------------------------

	def search_all(self, indices=None, types=None, start=0, size=10, fail_silently=True, **param_kwargs):
		"""

		@param params: Url parameters: search_type, request_cache

		"""

		return self.request_response(

			requests.get(

				self.get_url(indices, types, '_search', params=param_kwargs),

				data={

					'from': start,

					'size': size,

					'query': { 'match_all' : {} }

				}

			),

			fail_silently=fail_silently

		)

	# ------------------------------------------------------------------------------------

	def search_exists(self, query={}, indices=None, types=None, start=0, **param_kwargs):
		"""

		@param params: Url parameters: search_type, request_cache

		"""

		terminate_after = 1

		return self.request_response(

			requests.get(

				self.get_url(indices, types, '_search', params=param_kwargs),

				data=serialiser.dumps({

					'from': start,

					'size': 0,

					'query': {

						'term': { 'title': 'We' }

					}

				})

			)

		)

	# ------------------------------------------------------------------------------------

	def multi_search(self, query, indices=None, types=None):
		"""

		Execute several search requests within the same API.

		@param indices: Optional comma separated string of indices or '*' or '_all'. No spaces.
		@param types: Optional comma separated string of index types. No spaces.

		"""

		return self.request_response(

			requests.get(

				self.get_url(indices, types, '_msearch'),

				data=serialiser.dumps(query)

			)

		)

	# ------------------------------------------------------------------------------------

	def count(self, query=None, indices=None, types=None, response_kwargs={}, **param_kwargs):
		"""

		Execute several search requests within the same API.

		@param query: Optional query, defaults to match_all.
		@param indices: Optional comma separated string of indices or '*' or '_all'. No spaces.
		@param types: Optional comma separated string of index types. No spaces.
		

		URL Parameters (param_kwargs): df, analyzer, default_operator, lenient, 
			lowercase_expanded_terms, analyze_wildcard, terminate_after.

		"""

		query = {} if query==None else { 'query': query }

		response = self.request_response(

			requests.get(

				self.get_url(indices, types, '_count', param=param_kwargs),

				data=serialiser.dumps(query)

			),

			**response_kwargs

		)

		return None if response==None else response.get('count')

	# ------------------------------------------------------------------------------------

	def validate(self, query, indices, types=None, response_kwargs={}, **param_kwargs):
		"""

		Validate a potentially expensive query without executing it.

		@param query: Query to validate.
		@param indices: Optional comma separated string of indices or '*' or '_all'. No spaces.
		@param types: Optional comma separated string of index types. No spaces.

		URL Parameters (param_kwargs): df, analyzer, default_operator, lenient, 
			lowercase_expanded_terms, analyze_wildcard, explain

		"""

		return self.request_response(

			requests.get(

				self.get_url(indices, types, '_validate', 'query', param=param_kwargs),

				data=serialiser.dumps({ 'query': query })

			),

			**response_kwargs

		)

	# ------------------------------------------------------------------------------------

	def explain(self, query, index, index_type, doc_id, response_kwargs={}, **param_kwargs):
		"""

		Validate a potentially expensive query without executing it.

		@param query: Query to validate.
		@param index: Index name.
		@param index_type: Index type.

		URL Parameters (param_kwargs): _source, fields, routing, parent, preference, 
			source, df, analyzer, analyze_wildcard, lowercase_expanded_terms, lenient, 
			default_operator

		"""

		return self.request_response(

			requests.get(

				self.get_url(index, index_type, doc_id, '_explain', param=param_kwargs),

				data=serialiser.dumps({ 'query': query })

			),

			**response_kwargs

		)

	# ------------------------------------------------------------------------------------

	def get_search_shard(self, indices, types=None, response_kwargs={}, **param_kwargs):
		"""

		Return the indices and shards that a search request would be executed against.

		@param indices: Comma separated string of indices or '*' or '_all'. No spaces.
		@param types:  Optional comma separated string of index types. No spaces.

		URL Parameters (param_kwargs): routing, preference, local.

		"""

		return self.request_response(

			requests.get(

				self.get_url(indices, types, '_search_shards', params=param_kwargs)

			),

			**response_kwargs

		)

	# ------------------------------------------------------------------------------------

	def get_tokens(self, indices, field, query=None, size=10, **param_kwargs):
		"""
		Return all the tokens generated for a field by its index analyzer.
		@param indices: one or more indices (field must exist on all indices).
		@param field: field name.
		@param query: search query.
		@param size: max number of results to return.
		"""
		data = {

			'query': query or { 'match_all': {} },

			'script_fields': {

				'terms': {
			
					'script': {
						
						'file': 'get_tokens',
						
						'lang': 'groovy',
						
						'params': {
						
							'field_name': field,
						
						}
					
					}
				
				}
			
			},
			
			'size': size,
		
		}

		return requests.post(

			self.get_url(indices, '_search', param=param_kwargs), 

			data=serialiser.dumps(data)

		).json()


# END SEARCH API MIXIN
# ----------------------------------------------------------------------------------------




# ELASTICSEARCH INSTANCE
# ----------------------------------------------------------------------------------------

class ElasticSearch(IndexAPIMixin, DocumentAPIMixin, SearchAPIMixin):

	# ------------------------------------------------------------------------------------

	def __init__(self, url, *args, **kwargs):
		"""
		
		Initialise the mixin with the request url.

		@param url: Request url.
		
		"""

		if re.search(r'^https?:\/\/', url)==None:

			raise ValueError(
			
				'ElasticSearchMixin must be initialised with a url that includes the \
				HTTP protocol. E.g. https://domain.com'
			
			)

		self.base_url=url

		super(ElasticSearch, self).__init__(*args, **kwargs)
	
	# ------------------------------------------------------------------------------------

	def get_url(self, *args, params={}, **kwargs):
		"""
		
		Return the request url.

		@param args: Path names
		@param params: Dictionary of url parameters as name value pairs.

		E.g. get_url('a', 'b', params={ 'c': '0' }) would return 'base_url/a/b?c=0'

		"""

		url = self.base_url + '/'.join(arg for arg in args if arg!=None)

		if params!={}:
			url += '?' + '&'.join(n + '=' + params[n] for n in params)

		return url

	# ------------------------------------------------------------------------------------

	def bool_params_to_str(self, keys, kwargs):
		"""

		If value is a boolean then return the params dictionary with the boolean values
		converted to url string values.

		@param keys: Tuple or keys
		@param kwargs: Dictionary.

		"""

		params, value = kwargs.get('params', {}), None

		for key in keys:

			value = params.get(key)

			if isinstance(value, bool):
				params[key] = str(value).lower()

		return params

	# ------------------------------------------------------------------------------------

	def request_response(self, response, fail_silently=False, **kwargs):
		"""
		
		Normalise the response.

		@param response: Request response.
		@param fail_silently: If False raise an exception else if True return False
		
		"""

		data = response.json()

		if response.status_code in (200, 201):

			return data


		if fail_silently==True:
			
			return None

		else:

			error = data.get('error')

			print('ES ERROR: ', error)

			RaiseException = EsException

			if error != None:

				error_type = error.get('type')

				if error_type in ('index_not_found_exception', 'aliases_not_found_exception'):

					RaiseException = EsDoesNotExist

				elif error_type in ('version_conflict_engine_exception',):

					RaiseException = EsVersionConflict


			raise RaiseException(
			
				'ElasticSearch ' + inspect.stack()[1][3] + ': ' +
				error.get('reason', 'Error')
			
			)

	# ------------------------------------------------------------------------------------

	def document_request_response(self, response, fail_silently=False, **kwargs):
		"""
		
		Normalise the response.

		@param response: Request response.
		@param fail_silently: If False raise an exception else if True return False
		
		"""

		data = response.json()

		if data['found']==False:

			if fail_silently==True:
			
				return None

			else:

				raise EsDoesNotExist(
				
					'ElasticSearch ' + inspect.stack()[1][3] + ': ' + 'Does Not Exist.'
				
				)

		return data

	# ------------------------------------------------------------------------------------

	def bulk_request_response(self, response, fail_silently=False, **kwargs):
		"""
		
		Normalise the response.

		@param response: Request response.
		@param fail_silently: If False raise an exception else if True return False
		
		"""

		data = response.json()

		if data['errors']==True:
			
			if fail_silently==True:
			
				return None

			else:

				print(data)

				raise EsBulkProcessing(
				
					'ElasticSearch ' + inspect.stack()[1][3]
				
				)

		return data

	# ------------------------------------------------------------------------------------

	def pop_response_kwargs(self, kwargs):
		
		return kwargs.pop('fail_silently', False)

	# ------------------------------------------------------------------------------------

	def exists_response(self, url):
		"""

		Normalise the response for HEAD requests returning a boolean to indicate the
		success (True) or failure (False) or the request.

		@param url: Request url.

		"""

		response = requests.head( url )
		return hasattr(response, 'status_code') and response.status_code==200

# ----------------------------------------------------------------------------------------

es = ElasticSearch(url='http://localhost:9200/')

# ----------------------------------------------------------------------------------------



