# LIBRARY IMPORTS
# ----------------------------------------------------------------------------------------

# Standard library imports
from datetime import date

# Core django imports
from django.forms import widgets
from django.utils.encoding import force_text
from django.utils.translation import ugettext_lazy as _
from django.utils.html import format_html
from django.utils.safestring import mark_safe

# Thrid party app imports

# Project imports

# ----------------------------------------------------------------------------------------




# ----------------------------------------------------------------------------------------

class UloPIPWidget(widgets.HiddenInput):
    """
    Render a hidden input field with the name 'pip' and an optional id.
    See https://docs.djangoproject.com/en/1.9/ref/forms/widgets/#multiwidget
    """
    
    def render(self, name, value, attrs=None):

        uid = self.attrs.get('id') if self.attrs != None else None

        return format_html(

            '<input{id_attr} type="hidden" name="pip" value={value}>',
            id_attr=('' if uid==None else ' id='+uid),
            value=value,
        
        )

# ----------------------------------------------------------------------------------------

class UloDOBWidget(widgets.SelectDateWidget):
    
    def wrap_select(self, select_html):
        
        return select_html


    def create_select(self, name, field, value, val, choices, none_value):

        choices.insert(0, none_value)
        
        local_attrs = self.build_attrs(id=field % name)
        
        s = self.select_widget(choices=choices)
        
        select_html = s.render(field % name, val, local_attrs)
        
        return self.wrap_select(select_html)


    def __init__(self, *args, min_age=0, **kwargs):

        this_year = date.today().year - min_age
        
        kwargs.update({

            'years': range(this_year, this_year-100, -1),

            'months': {

                1: _('Jan'), 2: _('Feb'), 3: _('Mar'), 4: _('Apr'), 5: _('May'), 
                6: _('Jun'), 7: _('Jul'), 8: _('Aug'), 9: _('Sep'), 10: _('Oct'), 
                11: _('Nov'), 12: _('Dec')
            
            },

            'empty_label': (_('Year'), _('Month'), _('Day'))

        })

        super(UloDOBWidget, self).__init__(*args, **kwargs)

# ----------------------------------------------------------------------------------------

class UloUlWidget(widgets.Widget):

    outer_html = '<ul{id_attr}{class_attr}>{heading}{content}</ul>'
    inner_html = None
    heading_html = None


    def __init__(self, attrs=None, **kwargs):
        
        self.choices = kwargs.pop('choices')
        
        self.heading = kwargs.pop('heading', None)
        
        self.heading_html = kwargs.pop('heading_html', '<div class="heading"><h3>{}</h3></div>')

        self.li_attrs = kwargs.pop('li_attrs', {})
        
        self.inner_html = self.get_inner_html(self.li_attrs)

        super(UloUlWidget, self).__init__(attrs, **kwargs)


    def get_inner_html(self, attrs):

        li = '<li{}>{}</li>'

        li_attrs = ''

        for a in attrs:
        
            li_attrs += ' {'+a+'}'

        return li.format(li_attrs, '{value}')

    
    def generate_attrs(self, i):
            
        kwargs = {}

        for a in self.li_attrs:
        
            try:
        
                val = force_text(self.li_attrs[a][i])
        
                kwargs[a] = a+'='+val if val else ''

            except (KeyError, IndexError):
        
                kwargs[a] = ''

        return kwargs


    def choice_input_class(self, choice, i):
        
        return force_text(choice), self.generate_attrs(i)


    def render(self, name, value, attrs=None, **kwargs):
        
        """
        Outputs a <ul> for this set of choice fields.
        If an id was given to the field, it is applied to the <ul> (each
        item in the list will get an id of `$id_$i`).
        """
        
        output = []
        
        for i, choice in enumerate(self.choices):

            value, attrs = self.choice_input_class(choice, i)
        
            output.append(format_html(self.inner_html, value=value, **attrs))
        

        id_ = self.attrs.get('id')

        class_ = self.attrs.get('class')

        return format_html(

            self.outer_html,
            id_attr=format_html(' id="{}"', id_ or 'id_'+name),
            class_attr=format_html(' class="{}"', class_) if class_ else '',
            heading=format_html(self.heading_html, self.heading) if self.heading else '',
            content=mark_safe('\n'.join(output)),

        )

# ----------------------------------------------------------------------------------------



