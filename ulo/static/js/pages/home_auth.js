/* Post Detail Page Javascript File */
/* Dependencies: JQuery, Base.js, Users.js */


/* ------------------------------------------------------------------------------------ */

(function (){


"use strict";


	/* -------------------------------------------------------------------------------- */

	function Timeline(){

		Ulo.checkDependencies("Session", "Pip");

		Ulo.checkTempDependencies("PostDetail", "PostVideo", "shortDate");


		this.registerLoad();

	}

	Timeline.prototype = {

		constructor: Timeline,

		/* ---------------------------------------------------------------------------- */

		registerLoad: function(){

			$(this.getLoad()).on(Ulo.evts.click, {self: this}, this.load);

		},

		/* ---------------------------------------------------------------------------- */

		unregisterLoad: function(anchor){

			$(anchor).off(Ulo.evts.click, this.load);

			Ulo.remove(anchor);

		},

		/* ---------------------------------------------------------------------------- */

		getPage: function(){

			return Ulo.get("home_auth");

		},

		/* ---------------------------------------------------------------------------- */

		getTimeline: function(){

			return Ulo.get("timeline");

		},

		/* ---------------------------------------------------------------------------- */

		getLoad: function(){

			return Ulo.get("load_posts");

		},

		/* ---------------------------------------------------------------------------- */

		setMaxID: function(max_id, anchor){

			if(anchor === undefined){

				anchor = this.getLoad();

			}

			anchor.href = anchor.href.replace(

				/(max_id=)(\d*)(\s*|&|$)/, "$1" + (max_id || "") + "$3"

			);

		},

		/* ---------------------------------------------------------------------------- */

		load: function(e){

			e.preventDefault();

			var self = e.data.self;

			if(Ulo.Pip.login() !== null){

				Ulo.Pip.open();

			}

			else if(Ulo.requestAvailable()){

				Ulo.acquireRequest();

				Ulo.Animate.pulse(e.currentTarget, true);


				setTimeout(function(){

					Ulo.request({

							type: "GET",
							url: e.currentTarget.href + "&timeline=true",

						})

						/* Params: server data, status code, xhr */
						.done(function(data, sc, xhr){


							/* If the session has changed update the entire page.  */
						
							if(Ulo.Session.hasChanged(xhr)){

								Ulo.Pip.updatePage(xhr);

							}

							/* If the login form is returned display it. */

							else if(data.html){

								Ulo.Pip.displayPage(xhr, "login");

							}

							else{

								/* Update href */
								self.setMaxID(data.max_id, e.currentTarget);

								/* Either there are more posts to get or unregister the anchor */
								data.has_next || self.unregisterLoad(e.currentTarget);

								/* Render the posts */
								self.renderPosts(data.posts);

							}

						})

						/* Params: xhr, status code, error type */
						.fail(function(xhr, sc, type){

							console.log(xhr);
						
						})

						.always(function(){

							Ulo.Animate.pulse(e.currentTarget, false);
					
					});

				}, 500);

			}

		},

		/* ---------------------------------------------------------------------------- */

		renderPosts: function(posts){

			var timeline = this.getTimeline();

			if(timeline !== null && posts !== undefined){


				var now = new Date().getTime(),

				post, parent, child, elem, form, option, button, icon, is_owner;


				for(var i in posts){

					is_owner = Ulo.Session.isOwner(posts[i].user_id);


					/* POST CONTAINER */

					post = Ulo.create("div", {

						"class": "post", 
						"data-id": posts[i].id,
						"data-user": posts[i].user_id

					});
					
					/* END POST CONTAINER */




					/* MEDIA CONTAINER */

					elem = post.appendChild(Ulo.create("div", {"class": "post_media"}))

						.appendChild(Ulo.create("div", {"class": "media_container"}));

					/* END MEDIA CONTAINER */




					/* VIDEO ELEMENT */

					elem.appendChild(Ulo.create("div", {"class": "video_player"}))

						.appendChild(Ulo.create("video", {

							"preload": "none", 
							"poster": Ulo.getMediaURL(posts[i].thumbnail)
						
						}))

						.appendChild(Ulo.create("source", {

							"src": Ulo.getMediaURL(posts[i].file),
							"type": "video/mp4"

						}, "Your browser does not support video playback.")

					);

					/* END VIDEO ELEMENT */




					/* VIDEO CONTROLS */

					/* -- fragments -- */

					elem = elem.appendChild(Ulo.create("div", {"class": "video_actions cloak"}));

					parent = elem.appendChild(Ulo.create("div", {"class": "video_track"}));

					child = parent.appendChild(Ulo.create("div", {"class": "fragment hide"}))

						.appendChild(Ulo.create("div", {"class": "track_fragment"}));


					option = ["track_start", "track_end"];

					for(var j in option){

						child.appendChild(Ulo.create("button", {

								"class": option[j],
								"data-selector": option[j],
								"type": "button"

							}))

							.appendChild(Ulo.create("span", {

								"class": "pin"

						}));

					}

					/* -- END fragments -- */


					/* -- track -- */

					parent = parent.appendChild(Ulo.create("div", {"class": "track"}))

						.appendChild(Ulo.create("div", {"class": "track_bar"}));

					child = parent.appendChild(Ulo.create("div", {"class": "track_range"}));

					option = ["track_buffer", "track_progress", "track_start", "track_end"];

					for(var j in option){

						child.appendChild(Ulo.create("span", {"class": option[j]}));

					}

					child.appendChild(Ulo.create("span", {

						"class": "track_thumbnail",
						"data-src": posts[i].thumbnail,
						"style": "left: " + (posts[i].thumbnail_time / posts[i].duration) * 100

					}));


					parent.appendChild(Ulo.create("button", {"class": "track_slider", "type": "button"}));

					/* -- END track -- */


					/* -- buttons -- */

					elem = elem.appendChild(Ulo.create("div", {"class": "video_controls cf"}));

					parent = elem.appendChild(Ulo.create("div", {"class": "left"}));

					parent.appendChild(Ulo.create("button", {"class": "play", "type": "button"}))

						.appendChild(Ulo.create("span", {"class": "play icon icon_play_white"}));

					parent.appendChild(Ulo.create("button", {"class": "loop", "type": "button", "title": "Loop"}))

						.appendChild(Ulo.create("span", {"class": "loop icon icon_loop"}));


					parent = elem.appendChild(Ulo.create("div", {"class": "video_time"}));

					parent.appendChild(Ulo.create("span", {"class": "current_time"}, "0:00"));

					parent.appendChild(document.createTextNode(" / "));

					parent.appendChild(Ulo.create("span", {"class": "duration"}, "0:00"));


					elem = elem.appendChild(Ulo.create("div", {"class": "right"}));

					parent = elem.appendChild(Ulo.create("div", {"class": "volume_container"}));

					child = parent.appendChild(Ulo.create("div", {"class": "volume_bar"}))

						.appendChild(Ulo.create("div", {"class": "volume_range"}))

						.appendChild(Ulo.create("div", {"class": "volume_level"}));


					child.appendChild(Ulo.create("span", {"class": "volume_value"}));

					child.appendChild(Ulo.create("button", {"class": "volume_slider", "type": "button"}));


					parent.appendChild(Ulo.create("button", {"class": "volume", "type": "button"}))

						.appendChild(Ulo.create("span", {"class": "volume icon icon_volume_white"}));


					elem.appendChild(Ulo.create("button", {"class": "fullscreen", "type": "button"}))

						.appendChild(Ulo.create("span", {"class": "icon icon_expand_white"}));
					
					/* -- END buttons -- */

					/* END VIDEO CONTROLS */




					/* POST DATA */

					elem = post.appendChild(Ulo.create("div", {"class": "post_data cf"}));

					parent = elem.appendChild(Ulo.create("a", {

							"class": "title",
							"href": Ulo.getPostURL(posts[i].id),
							"title": posts[i].title,
							"data-apl": "true"

						}))

						.appendChild(Ulo.create("h1", {

								"class": "post_title thin"

							}, posts[i].title)

					);


					parent = elem.appendChild(Ulo.create("div", {"class": "post_actions"}))

					form = parent.appendChild(Ulo.create("form", {

						"class": "post_vote_form",
						"action": "/post/" + posts[i].id + "/vote/",
						"method": "get"

					}));

					for(var j in posts[i].options){

						option = posts[i].options[j];

						child = form.appendChild(Ulo.create("div", {"class": "vote"}));

						button = Ulo.create("button", {

							"class": "vote", 
							"name": "vote",
							"type": "submit",
							"value": option.option_id,
							"title": option.text

						});

						icon = child.appendChild(button).appendChild(Ulo.create("span", {"class": "vote_icon"}));


						if(option.vote_id !== null){

							Ulo.addClass(button, "selected");

							child.appendChild(Ulo.create("input", {

								"name": "voted",
								"type": "hidden",
								"value": option.vote_id

							}));

						}

						if(option.icon){

							Ulo.addClass(icon, "font_icon " + option.icon);

						}

						if(option.colour){

							icon.style.backgroundColor = option.colour;

						}

						
						child = button.appendChild(Ulo.create("div", {"class": "vote_data"}));

						child.appendChild(Ulo.create("span", {"class": "vote_text bold ellipsis"}, option.text));

						child.appendChild(Ulo.create("span", {"class": "abbr_count ellipsis"}, window.abbreviate(option.count)));

						child.appendChild(Ulo.create("span", {"class": "full_count"}, option.count));

					}


					parent = elem.appendChild(Ulo.create("div", {"class": "post_user"}));

					child = parent.appendChild(Ulo.create("div", {"class": "user_actions"}))

						.appendChild(Ulo.create("a", {

							"class": "toggle_actions_menu",
							"href": "/post/" + posts[i].id + "/actions/",
							"title": "Post actions",
							"data-toggle": "post_menu",
							"data-id": posts[i].id,
							"data-is-owner": is_owner

					}));

					child.appendChild(Ulo.create("span", {"class": "icon icon_menu"}));

					child.appendChild(Ulo.create("span", {"class": "hide"}, "Post actions"));

					// <div class="user_profile">

					// 	<a href="{% url 'users:profile' post.username %}" class="profile" data-apl="true" title="{{ post.name }}">
						
					// 		<img class="user_thumbnail" src="{{ MEDIA_URL }}{{ post.user_thumbnail }}">

					// 		<div class="user_names">
									
					// 			<span class="name bold ellipsis">{{ post.name }}</span>
					// 			<span class="username ellipsis">@{{ post.username }}</span>
									
					// 		</div>

					// 	</a>

					// </div>

					child = parent.appendChild(Ulo.create("div", {"class": "user_profile"}))

						.appendChild(Ulo.create("a", {

							"href": Ulo.getUserURL(posts[i].username),
							"class": "profile",
							"data-apl": "true",
							"title": posts[i].name

					}));

					child.appendChild(Ulo.create("img", {

						"class": "user_thumbnail", 
						"src": Ulo.getMediaURL(posts[i].user_thumbnail)

					}));

					child = child.appendChild(Ulo.create("div", {"class": "user_names"}));

					child.appendChild(Ulo.create("span", {"class": "name bold ellipsis"}, posts[i].name));

					child.appendChild(Ulo.create("span", {"class": "username ellipsis"}, "@"+posts[i].username));

					/* END POST DATA */


				
					Ulo.register(post);
				
					Ulo.Temp.PostDetail.register(post);

					Ulo.Temp.PostVideo.register(post);


					timeline.appendChild(post);

				}

			}

		}

	}

	/* -------------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */
	/* DOCUMENT READY FUNCTION */
	/* -------------------------------------------------------------------------------- */

	$(function(){

		Ulo.newClass(Timeline, "Timeline", true);

	});

	/* -------------------------------------------------------------------------------- */

}());



