# -*- coding: utf-8 -*-
# Generated by Django 1.10.3 on 2016-11-19 17:50
from __future__ import unicode_literals

from django.db import migrations, models
import django.utils.timezone
import posts.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Post',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('str_id', models.CharField(max_length=20, verbose_name='String id')),
                ('file', models.FileField(max_length=200, upload_to=posts.models.Post.file_path, verbose_name='Add video')),
                ('thumbnail', models.ImageField(max_length=220, upload_to=posts.models.Post.file_path, verbose_name='Media thumbnail')),
                ('title', models.CharField(help_text='Title your post.', max_length=100, verbose_name='title')),
                ('category', models.PositiveSmallIntegerField(blank=True, choices=[(1, 'Animals'), (2, 'Art & Design'), (3, 'Comedy'), (4, 'Education'), (5, 'Entertainment'), (6, 'Fashion'), (7, 'Food'), (8, 'Gaming'), (9, 'Movies'), (10, 'Music'), (11, 'News'), (12, 'Photography'), (13, 'Sports'), (14, 'Vlog')], help_text='Categorise your post for better search results.', null=True, verbose_name='category')),
                ('description', models.CharField(blank=True, help_text='Tell others what your post is about.', max_length=400, verbose_name='description')),
                ('comment_settings', models.PositiveSmallIntegerField(choices=[(1, 'Enabled'), (3, 'Disabled')], default=1, verbose_name='comments')),
                ('is_active', models.BooleanField(default=True, verbose_name='post status')),
                ('published', models.DateTimeField(default=django.utils.timezone.now, verbose_name='published')),
                ('comments_count', models.PositiveIntegerField(default=0, verbose_name='Comments counter')),
                ('views', models.BigIntegerField(blank=True, null=True, verbose_name='views')),
                ('duration', models.DecimalField(blank=True, decimal_places=6, max_digits=10, null=True, verbose_name='duration')),
                ('thumbnail_time', models.DecimalField(blank=True, decimal_places=6, max_digits=10, null=True, verbose_name='thumbnail time')),
            ],
            options={
                'verbose_name_plural': 'posts',
                'ordering': ['-published'],
                'verbose_name': 'post',
            },
        ),
        migrations.CreateModel(
            name='PostOption',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('str_id', models.CharField(max_length=20, verbose_name='String id')),
                ('text', models.CharField(max_length=20, verbose_name='text')),
                ('option_type', models.PositiveSmallIntegerField(choices=[(1, 'Love'), (2, 'Like'), (3, 'Dislike'), (4, None)], verbose_name='option type')),
                ('colour', models.CharField(blank=True, max_length=30, verbose_name='colour')),
                ('icon', models.CharField(blank=True, max_length=30, verbose_name='icon')),
                ('count', models.PositiveIntegerField(default=0, verbose_name='votes counter')),
            ],
            options={
                'verbose_name_plural': 'post options',
                'verbose_name': 'post option',
            },
        ),
        migrations.CreateModel(
            name='PostReport',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('str_id', models.CharField(max_length=20, verbose_name='String id')),
                ('issue', models.PositiveSmallIntegerField(choices=[(1, 'Spam'), (2, 'Hateful or abusive'), (3, 'Sexually explicit'), (4, 'Harassment or bullying'), (5, 'Violent or threatening')], help_text='What is wrong with this post?', verbose_name='report')),
                ('information', models.TextField(blank=True, help_text='Please provide any additional information if you think it will help us resolve the issue.', max_length=200, verbose_name='additional information')),
                ('published', models.DateTimeField(default=django.utils.timezone.now, verbose_name='published')),
            ],
            options={
                'verbose_name_plural': 'post reports',
                'verbose_name': 'post report',
            },
        ),
        migrations.CreateModel(
            name='PostVote',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('str_id', models.CharField(max_length=20, verbose_name='String id')),
                ('published', models.DateTimeField(default=django.utils.timezone.now, verbose_name='published')),
            ],
            options={
                'verbose_name_plural': 'post votes',
                'verbose_name': 'post vote',
            },
        ),
    ]
