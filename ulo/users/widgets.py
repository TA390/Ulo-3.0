# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from __future__ import unicode_literals

# Core django imports

# Thrid party app imports

# Project imports
from ulo.widgets import UloDOBWidget

# ---------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class SignUpDOBWidget(UloDOBWidget):
    
    def wrap_select(self, select_html):
        
        return ('<span class="dob_field box_border">%s</span>' % select_html)

# ----------------------------------------------------------------------------------------

class ProfileUpdateDOBWidget(UloDOBWidget):
    
    def wrap_select(self, select_html):
        
        return ('<span class="dob_field box_border">%s</span>' % select_html)

# ----------------------------------------------------------------------------------------