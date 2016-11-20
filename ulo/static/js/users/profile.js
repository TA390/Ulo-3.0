/* Profile Page Javascript File */
/* Dependencies: JQuery, Base.js, User.js */

/* ------------------------------------------------------------------------------------ */


(function () {
"use strict";


	/* ---------------------------------------------------------------------------- */
	/*
		Return the user id set on the page container as a data attribute.
	*/
	function getProfileID(){

		return Ulo.get("profile").getAttribute("data-user-id");

	}

	/* ---------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */
	/*

	*/
	function Tabs(){

		Ulo.checkDependencies("Session", "Pip");

		/* Check that users/utils.js has loaded */
		Ulo.checkTempDependencies("Connect");


		var tabs_container = Ulo.get("profile_tabs");

		var selected = tabs_container.querySelector("a.selected");

		if(selected !== null){

			this.selected = selected;

			this.registerLoad(selected, false);


			var tabs = tabs_container.getElementsByTagName("a");

			$(tabs).on(Ulo.evts.click, {self: this}, this.select);


			Connect.register();

		}

	}

	Tabs.prototype = {

		constructor: Tabs,

		/* ---------------------------------------------------------------------------- */
		/*
			Return the ID of the tabs content container.

			@param tab: Tab anchor element.
		*/
		getID: function(tab){

			return tab.id + "_tab"

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return the tab's content container.

			@param tab: Tab anchor element.
		*/
		getContainer: function(tab){

			return Ulo.get( this.getID(tab) );

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return the tab's content div.

			@param tab: Tab anchor element.
		*/
		getContent: function(tab){

			return this.getContainer(tab).querySelector("div.content");

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return a data attribute set on the page container.

			@param attr: Attribute name (excluding the prefix "data-").
		*/
		getProfileAttr: function(attr){

			return Ulo.get("profile").getAttribute( "data-" + attr) || "";

		},

		/* ---------------------------------------------------------------------------- */




		/* ---------------------------------------------------------------------------- */
		/*
			Unregister the load handler on the load more results (posts, followers or following)
			anchor element and remove the element from the DOM.

			@param load: Load more results anchor element.
		*/
		unregisterLoad: function(load){

			$(load).on(Ulo.evts.click, this._load);

			Ulo.remove(load.parentNode);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Register the load handler on the load more results anchor element for the tab. 

			@param tab: Tab anchor element.
			@param create: Boolean - If true create a new anchor element.
		*/
		registerLoad: function(tab, create){

			var anchor, container = this.getContainer(tab);

			if(container !== null){

				/*
					Create a new element and append it to the container.
				*/
				if(create === true){

					anchor = container.appendChild( Ulo.create("div", {"class": "load"}) );

					anchor = anchor.appendChild(

						Ulo.create("a", {

							"class": "load load_" + tab.id, 
							"href": tab.href

						}, "Next Page")
					)
					;

				}

				/*
					Else get the current element and set it's max_id value as a property
					on the anchor element.
				*/
				else{

					anchor = this.getLoad(container);

					/*
						If anchor element is null the tab has no more results to load.
					*/
					if(anchor !== null){

						var regexp = /[?]?max_id=(\d*)\s*|&|$/;

						var match = anchor.href.match(regexp);

						if(match !== null){

							anchor.max_id = match[1];

							/*
								Normalise the url by remove all url parameters.
							*/
							anchor.href = tab.href;

						}

					}

				}

				$(anchor).on(Ulo.evts.click, {self: this}, this._load);

			}

			return anchor;

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return the load more result anchor element found within the container.

			@param container: Tab's content container.
		*/
		getLoad: function(container){

			return container.querySelector("a.load");

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Set the diabled property of the load more result anchor element found within 
			the container.

			@param container: Tab's content container.
			@param disable: Boolean value to set Element.disabled to.
		*/
		setLoadDisabled: function(container, disable){

			var anchor = this.getLoad(container);

			if(anchor !== null){

				anchor.disabled = disable;

			}

		},




		/* ---------------------------------------------------------------------------- */
		/*
			Select a new tab.
		*/
		select: function(e){

			e.preventDefault();

			var self = e.data.self;

			if(Ulo.requestAvailable() && self.selected !== e.currentTarget){


				/* Class set on the selected tab */
				var cls = "selected";


				/* Deselect the current tab */

				var container = self.getContainer(self.selected);

				self.setLoadDisabled(container, true);

				Ulo.addClass(container, Ulo.cls.hide);

				Ulo.removeClass(self.selected, cls);

				/* END Deselect the current tab */


				/* Select the new tab */

				self.selected = Ulo.addClass(e.currentTarget, cls);

				container = self.getContainer(self.selected);

				/*
					If this is the first time the tab has been selected create the tab's
					container divs and make a request for its first set of results.
				*/
				if(container === null){

					container = Ulo.create("div", {

						"id": self.getID(self.selected),
						"class": Ulo.cls.hide

					});

					container.appendChild( Ulo.create("div", {"class": "content"}) );

					Ulo.get("tab_content").appendChild( container );


					self.load(self.selected, true);

				} else{

					self.setLoadDisabled(container, false);

					Ulo.removeClass(container, Ulo.cls.hide);

				}

				/* END Select the new tab */


				Ulo.Page && Ulo.Page.updateHistory(self.selected.href, true);

			}

		},
		
		/* ---------------------------------------------------------------------------- */
		/*
			Event handler for load().
		*/
		_load: function(e){

			e.preventDefault();

			e.data.self.load( e.currentTarget, false);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Make a request for the next set of results.

			@param anchor: Load more result anchor element (initial === false) OR Tab 
				anchor element (initial === true).

			@param initial: Boolean - true if this is the first set of results for the
				selected tab, else false.
		*/

		load: function(anchor, initial){

			if(Ulo.requestAvailable() && (initial === true || anchor.disabled !== true)){

				var self = this,

				request = {

					type: "GET", 
					url: anchor.href + "?max_id=" + (anchor.max_id || "") + "&profile_id=" + getProfileID()

				}


				if(initial){

					Ulo.Animate.set(0);

					request.xhr = Ulo.Animate.download;

				} else{

					Ulo.Animate.pulse(anchor, true);

				}


				Ulo.request(request)

					/* Params: server data, status code, xhr */
					.done(function(data, sc, xhr){

						if(Ulo.Session.hasChanged(xhr)){

							Ulo.Pip.updatePage();

						} else{

							var container = self.getContainer(self.selected);


							if(initial === true){

								if(data.count !== undefined){

									updateCounters(self.selected, null, data.count);

								}

								if(data.has_next){

									anchor = self.registerLoad(self.selected, true);

								}

								Ulo.removeClass(container, Ulo.cls.hide);

							}


							if(data.has_next){

								anchor.max_id = data.max_id;

							} else if(initial === false){

								self.unregisterLoad(anchor);

							}


							var id = self.selected.id;

							if(data.tab_data && data.tab_data.length > 0){

								self[id](data.tab_data);

							} else if(initial === true){

								self.empty(container);

							}

						}

					})
					
					.always(function(){

						if(initial){

							Ulo.Animate.set(100);

						} else{

							Ulo.Animate.pulse(anchor, false);

						}	
				
				});

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Html rendered in the tab's content when it has no results.
		*/
		empty: function(){

			var p,

			text,

			content = this.getContent(this.selected),

			is_owner = Ulo.Session.isOwner(getProfileID()),

			username = Ulo.get("profile_information", "span.username"),
			
			name = (username.textContent || username.innerHTML);
			

			switch(this.selected.id){

				case "posts": 

					if(is_owner){

						p = Ulo.create("p", {}, "Create your first ");

						p.appendChild( Ulo.create("a", {

								"href": "/post/", 
								"class": "bold",
								"data-apl": "true",

							}, "post.") );

						Ulo.register(p);

					} else{

						text = name + " has no posts.";

					}

					break;

				case "followers":

					text = (is_owner ? "You have" : name + " has") + " no followers."; 

					break;

				case "following":

					text = (is_owner ? "You are" : name + " is") + " not following anyone."; 

					break;

				default:

					text = "No results.";


			}

			content.appendChild( Ulo.create("div", {"class": "empty"}) )

				.appendChild( p || Ulo.create("p", {}, text) );

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Render post results.

			@param posts: Array of posts.
		*/
		posts: function(posts){

			var post, element, anchor, is_video, content = this.getContent(this.selected), now = new Date().getTime();

			for(var i in posts){

				post = Ulo.create("div", {"class": "item"});

				element = post.appendChild( Ulo.create("div", {"class": "spacing"}) );


				/* */

				anchor = element.appendChild(

					Ulo.create("a", {

						"href": Ulo.getPostURL(posts[i].cid),
						"class": "post_thumbnail",
						"data-apl": "true"

					})

				);

				anchor.appendChild(

					Ulo.create("img", { 

						"src": Ulo.getMediaURL(posts[i].thumbnail)

					})

				);


				anchor.appendChild(

						Ulo.create("div", {"class": "video_icon"})

					)

					.appendChild(

						Ulo.create("span", {"class": "icon icon_play"})

				);


				/* */
				element = element.appendChild( Ulo.create("div", {"class": "post_data"}) );

				element.appendChild(

						Ulo.create("a", {

							"class": "title bold",
							"href": Ulo.getPostURL(posts[i].cid),
							"data-apl": "true",
							"title": posts[i].title

						})

					)

					.appendChild(

						Ulo.create("span", { "class": "text" }, posts[i].title)

					);


				/* */

				element = element.appendChild( Ulo.create("div", { "class": "post_meta" }) );

				element.appendChild(

					Ulo.create("span", { "class": "published" }, elapsedTime(now, posts[i].published))

				);

				if(is_video){

					element.appendChild(

						Ulo.create("span", { "class": "views" }, posts[i].views + " views")

					);

				}


				Ulo.register( post );

				content.appendChild( post );

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Render followers.

			@param connections: Array of users.
		*/
		followers: function(connections){

			return this.connections(connections, false);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Render following.

			@param connections: Array of users.
		*/
		following: function(connections){

			var user_id = this.getProfileAttr("user-id");

			return this.connections(connections, Ulo.Session.isOwner(user_id));

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Render a connection (followers or following).

			@param connections: Array of users.
			@param unfollow: Boolean - if true force the rendering of an unfollow link.
		*/
		connections: function(connections, unfollow){

			var connection, element, anchor, type,

			content = this.getContent(this.selected),
			
			auth_id = Ulo.Session.get()[Ulo.Session.AUTH_NAME];

			for(var i in connections){

				connection = Ulo.create("div", {"class": "item"});

				element = connection.appendChild( Ulo.create("div", {"class": "spacing"}) );


				/* Render a connection link if the user is not the logged in user */
				
				if(auth_id != connections[i].id){

					type = unfollow || connections[i].is_following ? "unfollow" : "follow";

					element.appendChild(

							Ulo.create("div", {"class": "connection_actions"})

						)

						.appendChild(

							Connect.create(type, connections[i].id)

						);

				}

				/* END Render a connection link if the user is not the logged in user */


				/* User profile link */

				element = element.appendChild(

						Ulo.create("div", {"class": "connection_user"})

					)

					.appendChild(

						Ulo.create("a", {

							"href": Ulo.getUserURL(connections[i].username), 
							"data-apl": "true"

						})

					);

				Ulo.register(element.parentNode);

				/* END User profile link */


				/* User profile image */

				element.appendChild(

					Ulo.create("img", { 

						"src": Ulo.getMediaURL(connections[i].thumbnail)

					})

				);

				/* END User profile image */
				

				/* User profile names */

				element = element.appendChild(

					Ulo.create("div", { "class": "connection_names" })

				);

				element.appendChild(

					Ulo.create("h4", {}, connections[i].name)

				);

				element.appendChild(

					Ulo.create("span", {}, "@" + connections[i].username )

				);

				/* END User profile names */


				content.appendChild( connection );

			}

		},

	}

	/* -------------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */

	function Picture(){

		var menu = this.getMenu();

		/*
			If the page has rendered "picture_actions" then this is the user's own 
			profile page so add a button to toggle the actions menu.
		*/ 

		if(menu !== null){

			var button = Ulo.create("button", {

				"id": "toggle_picture_actions",
				"data-toggle": menu.id,
				"type": "button"

			});

			this.getContainer().appendChild( button )

				.appendChild(

					Ulo.create("span", {"class": "icon icon_camera_white"})

			);

			$(button).on(Ulo.evts.click, {self: this}, this.loadScript);


			if(/default\/profile.jpg$/.test(this.getImage().src)){

				Ulo.addClass(this.getDelete(), Ulo.cls.hide);

			}

		}

	}

	Picture.prototype = {

		constructor: Picture,

		/* ---------------------------------------------------------------------------- */
		/*
			Return the profile picture container.
		*/
		getContainer: function(){

			return Ulo.get("profile_picture");

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return the picture actions menu.
		*/
		getMenu: function(){

			return Ulo.get("picture_actions");

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return the profile image.
		*/
		getImage: function(){

			return this.getContainer().querySelector("img");

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return the delete picture button.
		*/
		getDelete: function(){

			return this.getContainer().querySelector("button.delete_picture");

		},

		/* ---------------------------------------------------------------------------- */

		animation: function(start){

			var element = this.getContainer().querySelector("div.animation");

			Ulo.Animate.bounce(element, start);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Set the src value of the picture and toggle the display of the delete picture
			button depending on the value of src.

			@param src: Image url.
			@param show_delete: Boolean - if true show the delete button else hide it.
		*/
		setSrc: function(src, show_delete){

			var delete_button = this.getDelete();

			(show_delete ? Ulo.removeClass : Ulo.addClass)(delete_button, Ulo.cls.hide)

			this.getImage().src = src;

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Render the error messages.

			@param xhr: XMLHttpRequest.
		*/
		error_messages: function(xhr){

			if(xhr.responseJSON !== undefined && xhr.responseJSON.errors !== undefined){

				for(var i in xhr.responseJSON.errors){

					Ulo.messages(xhr.responseJSON.errors[i], true);

				}

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Load the script for file uploads.
		*/
		loadScript: function(e){

			if(Ulo.requestAvailable()){

				Ulo.acquireRequest();

				var self = e.data.self;

				self.animation(true);


				setTimeout(function(){

					var script = Ulo.create("script", {"class": "js_file"});

					/* Modern browsers only */
					script.async = false;


					script.onload = function(){

						Ulo.releaseRequest();

						self.animation(false);

						$(e.currentTarget).off(Ulo.evts.click, self.loadScript);


						/*
							Create an instance of the File upload class and set event
							handlers on the menu button.
						*/
						if(window.FileUpload){

							var menu = self.getMenu();

							self.FileUpload = new FileUpload(menu, self.changePicture.bind(self), {});

							$(self.getDelete()).on(Ulo.evts.click, {self: self}, self.deletePicture);


							Ulo.menus(e.currentTarget, "height");

							$(e.currentTarget).trigger(Ulo.evts.click);

						}

					}

					script.onerror = function(){

						Ulo.releaseRequest();

						self.animation(false);

						Ulo.messages("Sorry, we could not load the image editor. Please try again.");

					}


					script.src = "/static/js/uploads/upload.js/";

					/* Do not use append - Old IE bug */
					document.body.insertBefore(script, document.body.lastChild);

				}, 500);

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Change the profile picture.
		*/
		changePicture: function(){

			var canvas = this.FileUpload.Editor.getCanvas(false, 320, 320);

			var user_id = getProfileID();

			this.FileUpload.close();


			/* If login is required display the form */

			if(Ulo.Pip.login() !== null){

				Ulo.Pip.open();

			} 

			else if(canvas.failed){

				Ulo.messages(

					"Sorry, we could not upload your profile picture. Please try again.",
					true

				);

			}

			else if(Ulo.requestAvailable() && Ulo.Session.isOwner(user_id)){

				var self = this;

				Ulo.acquireRequest();

				self.animation(true);


				canvas.toBlob(function(blob){

					var data = new FormData();

					data.append("photo", blob);

					var token = Ulo.Session.getToken();
					
					data.append(token.name, token.value);
					

					Ulo.request({

							type: "POST", 
							url: "/user/" + user_id + "/image/update/",
							data: data,
							cache: false,
							processData: false,
							contentType: false

						})

						/* Params: server data, status code, xhr */
						.done(function(data, sc, xhr){

							/* If the login form is returned display it. */

							if(data.html){

								Ulo.Pip.displayPage(xhr, "login");

							}

							else{

								self.setSrc(data.image_src, true);

							}

						})

						/* Params: xhr, status code, error type */
						.fail(function(xhr){
							
							self.error_messages(xhr);
						
						})
						
						.always(function(){
							
							self.animation(false);
						
					});

				}, 'image/jpeg', 95);

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Delete the profile picture.
		*/
		deletePicture: function(e){

			var self = e.data.self,

			user_id = getProfileID();


			/* If login is required display the form */

			if(Ulo.Pip.login() !== null){

				Ulo.Pip.open();

			}

			else if(

					Ulo.requestAvailable() && 

					Ulo.Session.isOwner(user_id) &&

					Ulo.hasClass(self.getDelete(), Ulo.cls.hide) === false

				){

				self.animation(true);

				var token = Ulo.Session.getToken();


				Ulo.request({

						type: "POST", 
						url: "/user/" + user_id + "/image/delete/",
						data: token.name + "=" + token.value

					})

					/* Params: server data, status code, xhr */
					.done(function(data, sc, xhr){

						/* If the login form is returned display it. */

						if(data.html){

							Ulo.Pip.displayPage(xhr, "login");

						}

						else{

							self.setSrc(data.image_src, false);

						}

					})

					/* Params: xhr, status code, error type */
					.fail(function(xhr){

						self.error_messages(xhr);

					})
					
					.always(function(){
					
						self.animation(false);

				});

			}

		},

	}


	/* DOCUMENT READY FUNCTION */
	/* -------------------------------------------------------------------------------- */

	$(function(){

		new Tabs();

		new Picture();

	})

/* ------------------------------------------------------------------------------------ */

}());



