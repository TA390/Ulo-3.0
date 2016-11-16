/* Profile Page Javascript File */
/* Dependencies: JQuery, Base.js, User.js */

/* ------------------------------------------------------------------------------------ */


(function () {
"use strict";


	/* ---------------------------------------------------------------------------- */
	/*
		Return the user id set on the page container as a data attribute.
	*/
	function getUserID(){

		return getElement("profile").getAttribute("data-user-id");

	}

	/* ---------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */
	/*

	*/
	function Tabs(){

		Ulo.checkDependencies("Session", "Pip");

		/* Check that users/utils.js has loaded */
		Ulo.checkTempDependencies("Connect");


		var tabs_container = getElement("profile_tabs");

		var selected = tabs_container.querySelector("a.selected");

		if(selected !== null){

			this.selected = selected;

			this.registerLoad(selected, false);


			var tabs = tabs_container.getElementsByTagName("a");

			$(tabs).on(Ulo.evts.click, {self: this}, this.select);


			Connect.register();

			this.jqxhr = null;

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

			return getElement( this.getID(tab) );

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

			return getElement("profile").getAttribute( "data-" + attr) || "";

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

			removeElements(load.parentNode);

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

					anchor = container.appendChild( makeElement("div", {"class": "load"}) );

					anchor = anchor.appendChild(

						makeElement("a", {

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

			if(self.jqxhr === null && self.selected !== e.currentTarget){


				/* Class set on the selected tab */
				var cls = "selected";


				/* Deselect the current tab */

				var container = self.getContainer(self.selected);

				self.setLoadDisabled(container, true);

				addClass(container, Ulo.cls.hide);

				removeClass(self.selected, cls);

				/* END Deselect the current tab */


				/* Select the new tab */

				self.selected = addClass(e.currentTarget, cls);

				container = self.getContainer(self.selected);

				/*
					If this is the first time the tab has been selected create the tab's
					container divs and make a request for its first set of results.
				*/
				if(container === null){

					container = makeElement("div", {

						"id": self.getID(self.selected),
						"class": Ulo.cls.hide

					});

					container.appendChild( makeElement("div", {"class": "content"}) );

					getElement("tab_content").appendChild( container );


					self.load(self.selected, true);

				} else{

					self.setLoadDisabled(container, false);

					removeClass(container, Ulo.cls.hide);

				}

				/* END Select the new tab */


				updateURL(self.selected.href, true);

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

			@param initial: Boolean - true if this is the first set of the results for the
				selected tab, else false.
		*/

		load: function(anchor, initial){

			if(this.jqxhr === null && (initial === true || anchor.disabled !== true)){

				var self = this;

				if(initial === false){

					addClass(anchor, "disabled");

				}

				var url = anchor.href + "?max_id=" + (anchor.max_id || "") + "&tab=true";

				this.jqxhr = $.ajax({

						type: "GET", 
						url: url, 
						statusCode: requestCodes

					})

					/* Params: server data, status code, xhr */
					.done(function(data, sc, xhr){

						if(Ulo.Session.hasChanged(xhr)){

							// messages("Your session has expired. Refresh the page and try again.");

							data.html = null;

							Ulo.Pip.updatePage(xhr);

							return true;

						}


						var container = self.getContainer(self.selected);


						if(initial === true){

							if(data.count !== undefined){

								updateCounters(self.selected, null, data.count);

							}

							if(data.has_next){

								anchor = self.registerLoad(self.selected, true);

							}

							removeClass(container, Ulo.cls.hide);

						}


						if(data.has_next){

							anchor.max_id = data.max_id;

						} else if(initial === false){

							self.unregisterLoad(anchor);

						}


						var id = self.selected.id;

						if(data.content && data.content.length > 0){

							self[id](data.content);

						} else if(initial === true){

							self.empty(container);

						}

					})

					/* Params: xhr, status code, error type */
					.fail(function(xhr){
						

					
					})
					
					.always(function(){
					
						self.jqxhr = null;

						if(initial === false){

							removeClass(anchor, "disabled");

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

			is_owner = Ulo.Session.isOwner( getUserID() ),

			username = getElement("profile_information").querySelector("span.username"),
			
			name = (username.textContent || username.innerHTML);
			

			switch(this.selected.id){

				case "posts": 

					if(is_owner){

						p = makeElement("p", {}, "Create your first ");

						p.appendChild( makeElement("a", {

								"href": "/post/", 
								"class": "bold",
								"data-apl": "true",

							}, "post.") );

						registerLinks(p);

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

			content.appendChild( makeElement("div", {"class": "empty"}) )

				.appendChild( p || makeElement("p", {}, text) );

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Render post results.

			@param posts: Array of posts.
		*/
		posts: function(posts){

			var post, element, anchor, is_video, content = this.getContent(this.selected), now = new Date().getTime();

			for(var i in posts){

				is_video = posts[i].media_type === Ulo.media.VIDEO;

				post = makeElement("div", {"class": "item"});

				element = post.appendChild( makeElement("div", {"class": "spacing"}) );


				/* */

				anchor = element.appendChild(

					makeElement("a", {

						"class": "post_thumbnail",
						"href": "/post/" + posts[i].cid,
						"data-apl": "true",

					})

				);

				anchor.appendChild(

					makeElement("img", { 

						"src": Ulo.MEDIA_URL + posts[i][ is_video ? "thumbnail": "file0"] 

					})

				);


				if(is_video){

					anchor.appendChild(

							makeElement("div", {"class": "video_icon"})

						)

						.appendChild(

							makeElement("span", {"class": "icon icon_play"})

					);

				}


				/* */
				element = element.appendChild( makeElement("div", {"class": "post_data"}) );

				element.appendChild(

						makeElement("a", {

							"class": "title bold",
							"href": "/post/" + posts[i].cid,
							"data-apl": "true",
							"title": posts[i].title

						})

					)

					.appendChild(

						makeElement("span", { "class": "text" }, posts[i].title)

					);


				/* */

				element = element.appendChild( makeElement("div", { "class": "post_meta" }) );

				element.appendChild(

					makeElement("span", { "class": "published" }, elapsedTime(now, posts[i].published))

				);

				if(is_video){

					element.appendChild(

						makeElement("span", { "class": "views" }, posts[i].views + " views")

					);

				}


				registerLinks( post );

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

				connection = makeElement("div", {"class": "item"});

				element = connection.appendChild( makeElement("div", {"class": "spacing"}) );


				/* Render a connection link if the user is not the logged in user */
				
				if(auth_id != connections[i].id){

					type = unfollow || connections[i].is_following ? "unfollow" : "follow";

					element.appendChild(

							makeElement("div", {"class": "connection_actions"})

						)

						.appendChild(


							Connect.create(type, connections[i].id)

						);

				}

				/* END Render a connection link if the user is not the logged in user */


				/* User profile link */

				element = element.appendChild(

						makeElement("div", {"class": "connection_user"})

					)

					.appendChild(

						makeElement("a", {

							"href": "/user/" + connections[i].username, 
							"data-apl": "true"

						})

					);

				registerLinks(element.parentNode);

				/* END User profile link */


				/* User profile image */

				element.appendChild(

					makeElement("img", { 

						"src": Ulo.MEDIA_URL + (connections[i].thumbnail || 'default/profile_thumb.jpg')

					})

				);

				/* END User profile image */
				

				/* User profile names */

				element = element.appendChild(

					makeElement("div", { "class": "connection_names" })

				);

				element.appendChild(

					makeElement("h4", {}, connections[i].name)

				);

				element.appendChild(

					makeElement("span", {}, "@" + connections[i].username )

				);

				/* END User profile names */


				content.appendChild( connection );

			}

		},

	}




	/* -------------------------------------------------------------------------------- */

	function Picture(){

		this.jqxhr = null;


		var menu = this.getMenu();

		/*
			If the page has rendered "picture_actions" then this is the user's own 
			profile page so add a button to toggle the actions menu.
		*/ 

		if(menu !== null){

			/* TO DO: ADD Ulo.cls.hide TO DELETE IF IT IS THE DEFAULT URL */

			var button = makeElement("button", {

				"id": "toggle_picture_actions",
				"data-toggle": menu.id,
				"type": "button"

			});


			this.getContainer().appendChild( button )

				.appendChild(

					makeElement("span", {"class": "icon icon_camera_white"})

				)


			if(/default\/profile.jpg$/.test(this.getImage().src)){

				addClass( this.getDelete(), Ulo.cls.hide );

			}

			$(button).on(Ulo.evts.click, {self: this}, this.loadScript);

		}

	}

	Picture.prototype = {

		constructor: Picture,

		/* ---------------------------------------------------------------------------- */
		/*
			Return the profile picture container.
		*/
		getContainer: function(){

			return getElement("profile_picture");

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return the picture actions menu.
		*/
		getMenu: function(){

			return getElement("picture_actions");

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
		/*
			Set the src value of the picture and toggle the display of the delete picture
			button depending on the value of src.

			@param src: Image url.
		*/
		setSrc: function(src){

			var delete_button = this.getDelete();

			(src ? removeClass : addClass)(delete_button, Ulo.cls.hide)

			this.getImage().src = src || Ulo.MEDIA_URL + 'default/profile.jpg'

		},




		/* ---------------------------------------------------------------------------- */
		/*
			Load the script for file uploads.
		*/
		loadScript: function(e){

			var self = e.data.self;


			if(self.jqxhr === null){

				self.jqxhr = true;


				var script = document.createElement("script");

				script.className = "js_file";

				/* Modern browsers only */
				script.async = false;


				script.onload = function(){

					self.jqxhr = null;

					$(e.currentTarget).off(Ulo.evts.click, self.loadScript);

					/*
						Create an instance of the File upload class and set event
						handlers on the menu button.
					*/
					if(window.FileUpload){

						var menu = self.getMenu();

						self.FileUpload = new FileUpload(

							menu, self.changePicture.bind(self), {}

						);

						$(menu.querySelector("button.delete_picture"))
							.on(Ulo.evts.click, {self: self}, self.deletePicture);


						menus(e.currentTarget, "height");

						$(e.currentTarget).trigger(Ulo.evts.click);

					}

				}

				script.onerror = function(){

					self.jqxhr = null;

					messages("Sorry, we could not load the image editor. Please try again.");

				}


				script.src = "/static/js/uploads/upload.js/";

				/* Do not use append - Old IE bug */
				document.body.insertBefore(script, document.body.lastChild);

			}

		},




		/* ---------------------------------------------------------------------------- */
		/*
			Change the profile picture.
		*/
		changePicture: function(){

			var canvas = this.FileUpload.Editor.getCanvas(false, 320, 320);

			var user_id = getUserID();

			this.FileUpload.close();


			/* If login is required display the form */

			if(Ulo.Pip.login() !== null){

				Ulo.Pip.open();

			} 

			else if(canvas.failed){

				messages(

					"Sorry, we could not upload your profile picture. Please try again.",
					true

				);

			}

			else if(this.jqxhr === null && Ulo.Session.isOwner(user_id)){

				var self = this;

				canvas.toBlob(function(blob){

					var data = new FormData();

					var token = Ulo.Session.get()[Ulo.Session.TOKEN_NAME];
					
					data.append(Ulo.Session.CSRF_TOKEN_NAME, token);
					
					data.append("picture", blob);


					self.jqxhr = $.ajax({

							type: "POST", 
							url: "/user/" + user_id + "/image/update/",
							data: data,
							cache: false,
							processData: false,
							contentType: false,
							statusCode: requestCodes

						})

						/* Params: server data, status code, xhr */
						.done(function(data, sc, xhr){

							console.log(data);

							/* If the login form is returned display it. */

							if(data.html){

								Ulo.Pip.displayPage(xhr, "login");

							}

							else{

								self.setSrc(data.image_src);

							}

						})

						/* Params: xhr, status code, error type */
						.fail(function(xhr){
							
							if(xhr.status == 400){

								xhrErrorMessage(xhr);

							}
						
						})
						
						.always(function(){
							
							self.jqxhr = null;
						
					});

				}, 'image/jpeg', 95);

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Delete the profile picture.
		*/
		deletePicture: function(e){

			var self = e.data.self;

			var user_id = getUserID();

			/* If login is required display the form */

			if(Ulo.Pip.login() !== null){

				Ulo.Pip.open();

			}

			else if(self.jqxhr === null && Ulo.Session.isOwner(user_id) && 
				hasClass(self.getDelete(), Ulo.cls.hide)===false){

				var token = Ulo.Session.get()[Ulo.Session.TOKEN_NAME];

				self.jqxhr = $.ajax({

						type: "POST", 
						url: "/user/" + user_id + "/image/delete/",
						data: Ulo.Session.CSRF_TOKEN_NAME + "=" + token,
						statusCode: requestCodes

					})

					/* Params: server data, status code, xhr */
					.done(function(data, sc, xhr){

						console.log(data);

						/* If the login form is returned display it. */

						if(data.html){

							Ulo.Pip.displayPage(xhr, "login");

						}

						else{

							self.setSrc(data.image_src);

						}

					})

					/* Params: xhr, status code, error type */
					.fail(function(xhr){

						if(xhr.status == 400){

							xhrErrorMessage(xhr);

						}

					})
					
					.always(function(){
					
						self.jqxhr = null

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



