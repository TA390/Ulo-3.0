# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals
from io import BytesIO
from PIL import Image
from sys import getsizeof
from uuid import uuid4
import re, magic

# Core django imports
from django.core.files.uploadhandler import (

	FileUploadHandler, MemoryFileUploadHandler, TemporaryFileUploadHandler, 
	UploadFileException

)
from django.core.files.uploadedfile import TemporaryUploadedFile
from django.template.defaultfilters import filesizeformat
from django.utils.translation import ugettext_lazy as _

# Thrid party app imports

# Project imports

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

# Store error messages on the request so that they can be accessed in the view or form.

# Add an error to the request object.
def add_error(request, error):
	
	request.upload_error = error


# Retrieve an error added to the request object
def get_error(request):

	if hasattr(request, 'upload_error'):

		return request.upload_error

	return None

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class MediaUploadException(UploadFileException):
	
	pass

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class BaseMediaUploadMixin(object):

	def __init__(self, *args, **kwargs):
		"""
		"""

		self.type_name = None

		# Field names for each type.
		self.images = kwargs.pop('images', ())
		self.videos = kwargs.pop('videos', ())

		super(BaseMediaUploadMixin, self).__init__(*args, **kwargs)

	# ------------------------------------------------------------------------------------

	def new_file(self, field_name, file_name, content_type, content_length, charset=None, 
		content_type_extra=None):
		"""
		"""

		self.type_name = self.get_type_name(field_name)

		super(BaseMediaUploadMixin, self).new_file(

			field_name, file_name, content_type, content_length, charset, 
			content_type_extra
		
		)

	# ------------------------------------------------------------------------------------

	def is_image(self):

		return self.type_name == 'image'

	# ------------------------------------------------------------------------------------

	def is_video(self):

		return self.type_name == 'video'

	# ------------------------------------------------------------------------------------

	def get_type_suffix(self, mime_type, default=''):

		try:

			return mime_type.split('/', 1)[1]

		except Exception:

			return default

	# ------------------------------------------------------------------------------------

	def get_type_name(self, field_name):

		if field_name in self.images:

			return 'image'

		elif field_name in self.videos:

			return 'video'


		return None

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class MultiMediaUploadMixin(object):

	def __init__(self, *args, **kwargs):
		"""
		"""

		# Max file resolution calculated as: self.res x self.res
		self.res = int(kwargs.pop('resolution', 2048))
		
		# Set MAX_IMAGE_PIXELS so that PIL can check for a decompression bomb
		Image.MAX_IMAGE_PIXELS = self.res*self.res + 1
		Image.warnings.simplefilter('error', Image.DecompressionBombWarning)


		super(MultiMediaUploadMixin, self).__init__(*args, **kwargs)

	# ------------------------------------------------------------------------------------

	def file_conversion(self, image, file_size, quality):
		"""
		Return a new file converted to the desired format.
		"""

		raise NotImplementedError(
			
			'Subclasses of MultiMediaUploadMixin must define file_conversion'
		
		)

	# ------------------------------------------------------------------------------------

	def file_complete(self, file_size):
		"""
		
		NOTE: Image compression/conversion is based on:
			http://dustindavis.me/django-custom-upload-handler-to-compress-image-files/

		"""
		try:

			# Check that the previous handler returned a file
			if hasattr(self, 'file') == False:

				return None


			# Generate a unique file name.
			name = uuid4().hex


			# If video set the file name.
			if self.is_video():

				file_ = super(MultiMediaUploadMixin, self).file_complete(file_size)

				file_.name = name + '.' + self.get_type_suffix(self.request.mime_type)

				return file_

			# Else compress and convert the image to a jpeg.
			else:

				# Go to the start of the file
				self.file.seek(0)
				
				# Set file name
				self.file_name = name + '.jpg'
				
				# Update the content type
				self.content_type = 'image/jpeg'

				# Verify that the file is a valid image. See Django's ImageField
				# https://github.com/django/django/blob/master/django/forms/fields.py
				Image.open(self.file).verify()
				
				# Reopen the image after running verify() to continue
				image = Image.open(self.file)
			
				# Convert to RGB so the file is ready for jpeg conversion
				if image.mode != 'RGB': 
					
					image = image.convert('RGB')
				
				# Compress and convert the file to jpeg
				self.file = self.file_conversion(image, file_size, 90)

				return super(MultiMediaUploadMixin, self).file_complete(file_size)
		

		# If an exception is raised add the error to the request and close the file so 
		# that an empty MultiValueDict is returned to the view.
		except IOError:
			
			add_error(
			
				self.request,
				_('We cannot process the image, it may be corrupted.')
			
			)

		except Image.DecompressionBombWarning:
			
			add_error(
			
				self.request,
				_('Please upload an image less than %s by %s.') %(self.res, self.res)
			
			)
		
		except (UploadFileException, Exception) as e:
		
			add_error(
		
				self.request,
				_('Something has gone wrong. Please try again later.')
		
			)


		self.file.close()

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class MediaUploadHandler(BaseMediaUploadMixin, FileUploadHandler):
	"""

	Validate the file type and size of the uploaded file.

	NOTE: MediaUploadException's will be displayed to the user if the connection has not
	been lost.

	"""

	def __init__(self, *args, **kwargs):
		"""
		"""

		# Max number of bytes per file for each type.
		# THE VALUES MUST BE GTE THE JAVASCRIPT FILEUPLOAD CLASS.
		# See class FileUpload - configure().
		self.max_size = {

			'image': kwargs.pop('max_image', 10485760),	# 10MB
			'video': kwargs.pop('max_video', 104857600)	# 100MB
		
		}


		# Run BaseMediaUploadMixin's __init__ function before setting max_content_length
		super(MediaUploadHandler, self).__init__(*args, **kwargs)


		# Max upload size determined by the type and number of files.
		self.max_content_length = (

			len(self.images) * self.max_size['image'] +
			len(self.videos) * self.max_size['video']
		
		)

	# ------------------------------------------------------------------------------------

	def new_file(self, field_name, file_name, content_type, content_length, charset=None, 
		content_type_extra=None):
		"""
		"""

		# Count the number of bytes uploaded for each file.
		self.bytes = 0

		# Set file type ('image' or 'video') - This is also set by BaseMediaUploadMixin
		self.type_name = self.get_type_name(field_name)


		if self.type_name == None:

			raise UploadFileException('Unknown field name: ', field_name)


		if content_length == None:

			content_length = int(self.request.META.get('CONTENT_LENGTH', 0))
		
		if content_length > self.max_content_length:

			raise MediaUploadException( self.file_size_error() )


		if charset == None:

			charset = 'binary'

		elif charset != 'binary':

			raise MediaUploadException(_('Please upload a media file.'))


		# Raises a MediaUploadException if the mime type is not supported.
		self.validate_type(content_type)


		super(MediaUploadHandler, self).new_file(

			field_name, file_name, content_type, content_length, charset, 
			content_type_extra

		)

	# ------------------------------------------------------------------------------------

	def receive_data_chunk(self, raw_data, start):
		"""
		"""

		if self.bytes == 0:

			with magic.Magic(flags=magic.MAGIC_MIME_TYPE) as m:

				mime = m.id_buffer(raw_data)

				# Raises a MediaUploadException if the mime type is not supported.
				self.validate_type( mime )

				self.request.mime_type = mime


		# Count of the number of bytes uploaded.
		self.bytes += getsizeof(raw_data)

		# Raise an exception to abort the upload if 'bytes' exceeds the max size.
		if self.bytes > self.max_size[self.type_name]:

			raise MediaUploadException( self.file_size_error() )


		return raw_data

	# ------------------------------------------------------------------------------------

	def file_complete(self, file_size):

		return None

	# ------------------------------------------------------------------------------------

	def file_size_error(self):

		return (

			_('Please upload %s %s less than %s.')
				
			%(
				'a' if self.is_video() else 'an', 
				self.type_name, 
				filesizeformat(self.max_size[self.type_name])

			)

		)

	# ------------------------------------------------------------------------------------

	def validate_type(self, mime_type):

		regexp = None

		if isinstance(mime_type, str):

			# THE REGEXP MUST MATCH THE JAVASCRIPT FILEUPLOAD CLASS.
			# See class FileUpload - configure().
		
			if self.is_image():

				regexp =  r'^image/(jpeg|pjpeg|png|gif|tiff)$'

			elif self.is_video():

				regexp =  r'^video/(mp4|ogg|webm)$'				


		if regexp == None or re.search(regexp, mime_type) == None:

			s = self.get_type_suffix(mime_type)

			raise MediaUploadException(

				_('We do not support the file type%s.') %( " '"+s+"'" if s else '' )

			)

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class MemoryMediaUploadHandler(BaseMediaUploadMixin, MultiMediaUploadMixin, MemoryFileUploadHandler):

	def file_conversion(self, image, file_size, quality):
		"""
		Use a temporary file in memory.
		"""

		tmp = BytesIO()
		
		image.save(tmp, 'JPEG', quality=quality)
		
		return tmp

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class TemporaryMediaUploadHandler(BaseMediaUploadMixin, MultiMediaUploadMixin, TemporaryFileUploadHandler):

	def file_conversion(self, image, file_size, quality):
		"""
		Use a temporary file on disk.
		"""

		tmp = TemporaryUploadedFile(self.file_name, 'image/jpeg', file_size, 'binary')
		image.save(tmp.temporary_file_path(), 'JPEG', quality=quality)
		
		return tmp

# ----------------------------------------------------------------------------------------



