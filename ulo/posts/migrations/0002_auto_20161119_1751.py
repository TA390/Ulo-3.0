# -*- coding: utf-8 -*-
# Generated by Django 1.10.3 on 2016-11-19 17:51
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('posts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='post',
            name='user',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='postoption',
            name='post',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, to='posts.Post'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='postreport',
            name='post',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, to='posts.Post'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='postreport',
            name='user',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='postvote',
            name='post',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, to='posts.Post'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='postvote',
            name='postoption',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, to='posts.PostOption'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='postvote',
            name='user',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
            preserve_default=False,
        ),
        migrations.AlterUniqueTogether(
            name='postvote',
            unique_together=set([('post', 'user')]),
        ),
    ]
