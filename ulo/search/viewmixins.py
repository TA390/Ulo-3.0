# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports

# Core django imports

# Thrid party app imports

# Project imports

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class SearchMixin(object):

	# ------------------------------------------------------------------------------------

	def __init__(self, model, version, types, max_result_window):

		self.index = '%s_index_%d' %(model, version)

		self.version = version

		self.types = types

		self.aliases = {

			'live': 'live_%s_index' % model,

			'all': '%s_indices' % model

		}

		self.max_result_window = max_result_window

	# ------------------------------------------------------------------------------------

	def get_index_aliases(self):

		return { self.aliases['all']: {} }

	# ------------------------------------------------------------------------------------

	def get_all_alias(self):
		
		return self.aliases['all']

	# ------------------------------------------------------------------------------------

	def get_live_alias(self):
		
		return self.aliases['live']

	# ------------------------------------------------------------------------------------

	def get_index_name(self):
		
		return self.index

	# ------------------------------------------------------------------------------------

	def get_index_types(self):
		
		return ','.join(self.types)

	# ------------------------------------------------------------------------------------

	def search(self):
		
		raise NotImplemented('Subclasses of UserSearchMixin must define search()')

	# ------------------------------------------------------------------------------------

	def autocomplete(self):
		
		raise NotImplemented('Subclasses of UserSearchMixin must define autocomplete()')

# ----------------------------------------------------------------------------------------



