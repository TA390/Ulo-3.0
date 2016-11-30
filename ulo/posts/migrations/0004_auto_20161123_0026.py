# -*- coding: utf-8 -*-
# Generated by Django 1.10.3 on 2016-11-23 00:26
from __future__ import unicode_literals

from django.db import migrations, models
import posts.models


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0003_auto_20161120_1734'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='postoption',
            name='option_type',
        ),
        migrations.AddField(
            model_name='postoption',
            name='type',
            field=models.PositiveSmallIntegerField(choices=[(1, 'Love'), (2, 'Like'), (3, 'Dislike'), (4, None)], default=1, verbose_name='type'),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='post',
            name='comment_settings',
            field=models.PositiveSmallIntegerField(choices=[(1, 'Enabled'), (2, 'Disabled')], default=1, verbose_name='comments'),
        ),
        migrations.AlterField(
            model_name='post',
            name='comments_count',
            field=models.PositiveIntegerField(default=0, verbose_name='comments counter'),
        ),
        migrations.AlterField(
            model_name='post',
            name='file',
            field=models.FileField(help_text='Add video.', max_length=200, upload_to=posts.models.Post.file_path, verbose_name='file'),
        ),
        migrations.AlterField(
            model_name='post',
            name='thumbnail',
            field=models.ImageField(max_length=220, upload_to=posts.models.Post.file_path, verbose_name='thumbnail'),
        ),
    ]
