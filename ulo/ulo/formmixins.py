# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals
from io import BytesIO
from PIL import Image
from sys import getsizeof

# Core django imports
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.utils.safestring import mark_safe
from django.utils.translation import ugettext_lazy as _

# Thrid party app imports

# Project imports
from .handlers import get_error
from .utils import reserved_usernames

# ----------------------------------------------------------------------------------------




# FORM MIXINS
# ----------------------------------------------------------------------------------------

class UloBaseFormMixin(object):

	def __init__(self, *args, **kwargs):

		kwargs.setdefault('auto_id', '%s')
		
		kwargs.setdefault('label_suffix', '')
		
		super(UloBaseFormMixin, self).__init__(*args, **kwargs)
		
		
	def http_referer(self):
		"""
		Add the hidden input field 'http_referer' to the form.
		"""
		
		value = self.initial.get('http_referer', '')
		
		return mark_safe('<input type="hidden" name="http_referer" value="'+value+'">')


# ----------------------------------------------------------------------------------------

class CleanUsernameMixin(object):
	"""
	Check that the 'username' form field is not a reserved username. Raise a 
	ValidationError if it is.
	"""

	def clean_username(self):

		username = self.cleaned_data.get('username', '').lower()
		
		if username in reserved_usernames:
			
			raise ValidationError(
			
				_('This username has been taken.'), code='reserved_username'
			
			)

		return username

# ----------------------------------------------------------------------------------------

class PasswordRequiredMixin(object):
	"""
	Require the user to enter their current password. If the form instance is not a User
	instance the form must define the variable 'user'.
	"""

	# Fallback user instance if self.instance is not a User instance.
	user = None

	# Check that the password entered matches the user's current password.
	def clean_password(self):
		
		password = self.cleaned_data.get('password', '')

		if password == '':

			raise ValidationError(
			
				_('Please enter your current password.'), code='required'
			
			)


		user = self.instance if hasattr(self.instance, 'check_password') else self.user

		if user.check_password(password) == False:

			raise ValidationError(

				_('Password incorrect.'), code='password_incorrect'

			)


		return self.initial.get('password', '')

# ----------------------------------------------------------------------------------------

class FileUploadMixin(object):
	"""
	Validate the uploaded file against the custom upload handlers and generate a thumbnail 
	if needed. The name of the thumbnail will be the name of the uploaded file with the 
	suffix '_thumb'.
	"""

	file_upload_errors = {

		'error': _('We could not process your file.')

	}

	def __init__(self, *args, **kwargs):
		"""

		"""

		self.request = kwargs.pop('request', None)

		# File field name.
		self.file_field = kwargs.pop('file_field', None)
		
		# Thumbnail field name.
		self.thumbnail_field = kwargs.pop('thumbnail_field', None)


		# Set True if the image is being changed to force a thumbnail change.
		self.change = kwargs.pop('change_image', False)

		# If True create a thumbnail with a 1:1 aspect ratio.
		self.square = kwargs.pop('square', True)
		
		# Maximum width and height of the thumbnail.
		self.size = kwargs.pop('thumbnail_size', (60,60))

		# Error display when no files were uploaded.
		self.file_upload_errors['upload'] = _(kwargs.pop('upload_error', 'Please upload a file.'))
			
		
		super(FileUploadMixin, self).__init__(*args, **kwargs)


	def delete_errors(self, field_name):
		"""

		Delete all form errors for a given field.
		
		@param field_name: Form field name.
		
		"""

		try: 
		
			del self.errors[field_name] 
		
		except KeyError: 
		
			pass


	def clean(self):
		"""
		
		Add a thumbnail image to the form's data.
		
		"""
		cleaned_data = super(FileUploadMixin, self).clean()
		
		self.add_thumbnail(cleaned_data)
		
		return cleaned_data


	def is_valid(self):
		"""
		
		Validate the files uploaded and add error messages to the form for failed
		uploads. Add a thumbnail to the form if one was not uploaded.
		
		"""

		# Get any errors set on the request object by the custom upload handlers.
		upload_error = get_error(self.request)

		# If the upload handler set an error or no files have been uploaded 
		# set an error on the form.
		if upload_error!=None or self.files=={}:
			
			# Delete all errors currently associated with the file field.
			self.delete_errors(self.file_field)
			
			# Add the upload error to the file field.
			self.add_error(

				self.file_field, 
				upload_error or self.file_upload_errors['upload']

			)

		# If the file field is valid but he thumbnail field is not, set a generic upload
		# error message on the file field to inform the user of the issue.
		if self.has_error(self.file_field)==False and self.has_error(self.thumbnail_field)==True:

				self.add_error(self.file_field, self.file_upload_errors['error'])


		return super(FileUploadMixin, self).is_valid()


	def square_image(self, img):
		"""
		
		Return the image Cropped to a 1:1 aspect ratio.

		@param img: PIL image file.
		
		"""

		if img.width != img.height:

			# Save the current format to restore it after the crop.
			format = img.format
							
			if img.width > img.height:

				diff = img.width-img.height
				
				# Calculate the left, top, bottom and right offsets.
				l, t, b = round(diff*0.5), 0, img.height
				r = img.width-(diff-l)

			else:

				diff = img.height-img.width
				
				# Calculate the left, top, right and bottom offsets.
				l, t, r = 0, round(diff*0.5), img.width
				b = img.height-(diff-t)

			
			img = img.crop((l,t,r,b))
			
			# Restore the original image format.
			img.format = format


		return img


	def img_to_mem(self, img, ufile, field_name, name=None):
		"""

		Return the PIL image file as an in memory file.

		@param img: PIL image file.
		@param ufile: Uploaded image file.
		@param field_name: Uploaded file's form field name.
		@param name: Optional name to give the new file - defaults to ufile's name.

		"""
		io = BytesIO()
		
		img.save(io, img.format)
		
		io.seek(0)

		return InMemoryUploadedFile(
					
			file=io,
			field_name=field_name,
			name= ufile.name if name==None else name,
			size=getsizeof(io),
			charset=ufile.charset,
			content_type=ufile.content_type
					
		)

	def add_thumbnail(self, cleaned_data):
		"""
		
		Create a thumbnail from the image file and add it to the form.

		NOTE: PIL's thumbnail function preserves the aspect ratio.

		@param cleaned_data: The form's cleaned_data dictionary.
		
		"""
		try:

			ufile = None

			# Do nothing if the uploaded file field has an error.
			if self.has_error(self.file_field)==False:

				# Get the uploaded file.
				ufile = cleaned_data.get(self.file_field)

				if ufile != None:

					# Get the thumbnail image
					thumb = cleaned_data.get(self.thumbnail_field)


					# Normalise the thumnail image name ('ufile_name'_thumb).
					name, dot, ext = ufile.name.rpartition('.')
					name = name+'_thumb'+dot+ 'jpg'

					# If there is an existing thumbnail update the name.
					if self.change==False and thumb!=None:
							
						ufile.seek(0)

						thumb.name = name

					# Create the thumbnail from the uploaded file.
					else:

						img = Image.open(ufile)

						if self.square:
		
							img = self.square_image(img)


						# Create a thumbnail image.
						img.thumbnail(self.size, Image.BICUBIC)

						# Add it to the form.
						cleaned_data[self.thumbnail_field] = self.img_to_mem(

							img, ufile, self.thumbnail_field, name

						)
						
						# Delete any errors associated with the thumbnail field.
						self.delete_errors(self.thumbnail_field)


		# Raised by Image.open() or Image.save() or seek()
		except (KeyError, IOError, ValueError) as e:
			
			# NOTE: If e is an empty string img.format is probably None or ''

			if ufile: 
				ufile.close()

			# Add the generic error message to the file field.
			self.add_error(self.file_field, self.file_upload_errors['error'])

# ----------------------------------------------------------------------------------------

class DeleteFileMixin(object):


	_file_data = []


	def clear_paths(self):

		self._file_data = []


	def store_paths(self, instance, *fields):

		if instance:

			self.clear_paths()

			for field in fields:

				file_field = getattr(instance, field)

				if file_field != file_field.field.get_default():

					self._file_data.append( (field, file_field.path) )


	def delete_files(self, instance):

		if instance:

			for field, path in self._file_data:

				if getattr(instance, field).path != path:

					try:

						getattr(instance, field).storage.delete(path)

					except Exception:

						pass

		self.clear_paths()

# ----------------------------------------------------------------------------------------

class UploadFileMixin(object):


	def __init__(self, *args, **kwargs):
		"""

		"""

		self.request = kwargs.pop('request', None)

		# File field name.
		self.ufile = kwargs.pop('ufile', 'file')
		
		# Thumbnail field name.
		self.uthumbnail = kwargs.pop('uthumbnail', 'thumbnail')

		# Maximum (width, height) of the thumbnail.
		self.usize = kwargs.pop('usize', (60, 60))

		# Fallback error message.
		self.uerror = kwargs.pop('uerror', _('We could not process your file.'))
		

		super(UploadFileMixin, self).__init__(*args, **kwargs)


	def delete_errors(self, field_name):
		"""

		Delete all errors for a given field.
		
		@param field_name: Form field name.
		
		"""

		try: 
		
			del self.errors[field_name] 
		
		except KeyError: 
		
			pass


	def clean(self):
		"""
		"""
		
		error = get_error(self.request)

		if error != None:

			self.add_error(self.ufile, error)


		field = self.fields[self.ufile]

		if self.ufile not in self.files and field.required:

			self.add_error(

				self.ufile, 
				field.error_messages.get('missing', _('Please upload a file.'))

			)


		cleaned_data = super(UploadFileMixin, self).clean()

		if self.has_error(self.ufile) == False:
			
			self.add_thumbnail(cleaned_data)


		return cleaned_data


	def is_valid(self):
		"""
		
		
		"""

		if self.has_error(self.ufile) == False and self.has_error(self.uthumbnail):

			self.add_error(self.ufile, self.uerror)


		return super(UploadFileMixin, self).is_valid()


	def img_to_mem(self, img, ufile, field_name, name=None):
		"""

		Return the PIL image file as an in memory file.

		@param img: PIL image file.
		@param ufile: Uploaded image file.
		@param field_name: Uploaded file's form field name.
		@param name: Optional name to give the new file - defaults to ufile's name.

		"""
		io = BytesIO()
		
		img.save(io, img.format)
		
		io.seek(0)

		return InMemoryUploadedFile(
					
			file = io,
			field_name = field_name,
			name = ufile.name if name == None else name,
			size = getsizeof(io),
			charset = ufile.charset,
			content_type = ufile.content_type
					
		)


	def add_thumbnail(self, cleaned_data):
		"""
		
		Create a thumbnail from the image file and add it to the form.

		NOTE: PIL's thumbnail function preserves the aspect ratio.

		@param cleaned_data: The form's cleaned_data dictionary.
		
		"""
		try:

			# Get the uploaded file.
			ufile = self.files.get(self.ufile)


			if ufile != None:

				# Get the thumbnail image
				thumbnail = self.files.get(self.uthumbnail)


				# Normalise the thumbnail image name.
				name, dot, ext = ufile.name.rpartition('.')
				
				name = name + '_thumb' + dot + 'jpg'


				# If there is an existing thumbnail update the name.
				if thumbnail != None:
	
					#ufile.seek(0)

					thumbnail.name = name

					if self.has_error(self.uthumbnail):

						raise ValueError

				# Else create the thumbnail from the uploaded file.
				else:

					img = Image.open(ufile)

					# Create a thumbnail image.
					img.thumbnail(self.usize, Image.BICUBIC)

					# Convert it to an InMemoryUploadedFile instance.
					thumbnail = self.img_to_mem(img, ufile, self.uthumbnail, name)

					# Set the new thumbnail images.
					cleaned_data[self.uthumbnail], self.files[self.uthumbnail] = thumbnail, thumbnail


					# Delete any errors associated with the thumbnail field.
					self.delete_errors(self.uthumbnail)


		# Raised by Image.open() or Image.save() or seek()
		except (KeyError, IOError, ValueError) as e:
			
			# NOTE: If e is an empty string img.format is probably None or ''

			if ufile: 
				
				ufile.close()


			# Add the generic error message to the file field.
			self.add_error(self.ufile, self.uerror)


# ----------------------------------------------------------------------------------------



