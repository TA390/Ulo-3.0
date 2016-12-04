/* Search page javascript file */
/* Dependencies: jQuery, Base.js */


/* ------------------------------------------------------------------------------------ */
(function () {
"use strict";
/* ------------------------------------------------------------------------------------ */

	/* SEARCH */
	/* -------------------------------------------------------------------------------- */

	function Search(){

		/* Check that users/utils.js has loaded */
		Ulo.checkTempDependencies("elapsedTime");

		this.first_post_request = this.first_user_request = true;

		$(Ulo.get("search_posts_form")).on("submit", {name: "posts", self: this}, this.submit);

		$(Ulo.get("search_users_form")).on("submit", {name: "users", self: this}, this.submit);

	}

	Search.prototype = {

		constructor: Search,

		/* ---------------------------------------------------------------------------- */

		getContainer: function(name){

			return Ulo.get(name + "_results");

		},

		/* ---------------------------------------------------------------------------- */

		getResults: function(name){

			return this.getContainer(name).querySelector("div.results");

		},

		/* ---------------------------------------------------------------------------- */

		getLoad: function(name){

			return this.getContainer(name).querySelector("button.load");

		},

		/* ---------------------------------------------------------------------------- */

		next_page: function(data, name){

			return data[name + "_next_page"];

		},

		/* ---------------------------------------------------------------------------- */

		submit: function(e){

			e.preventDefault();

			if(Ulo.requestAvailable()){

				var form = this;

				Ulo.request({

						type: "GET",
						cache: false,
						data: $(this).serialize(),
						url: this.getAttribute("action") + "?load=true"
					
					})
				
					.done(function(data, sc, xhr){

						var self = e.data.self, 

						name = e.data.name,

						next_page = self.next_page(data, name);

						if(next_page){

							form.querySelector("input[name='page']").value = next_page;

						} else{

							Ulo.remove(form);

						}

						self[name](data);

				});

			}

		},

		/* ---------------------------------------------------------------------------- */

		posts: function(data){

			if(data.posts){

				var results = this.getResults("posts"),

				now = new Date().getTime(),

				source, 

				parent, 

				child;


				if(this.first_post_request){

					this.first_post_request = false;

				}


				for(var i in data.posts){

					source = data.posts[i]._source;


					parent = Ulo.create("div", {"class": "result box_border"});


					child = parent.appendChild(

						Ulo.create("a", {

							"class": "thumbnail",
							"href": "/posts/" + data.posts[i]._id + "/",
							"data-apl": "true"
						
						})

					)

					child.appendChild( 

						Ulo.create("img", {"src": Ulo.getMediaURL(source.thumbnail)})

					);


					child = parent.appendChild(

						Ulo.create("div", {"class": "content"})
					
					);

					child.appendChild( 

						Ulo.create("a", {

							"class": "title bold",
							"href": "/posts/" + data.posts[i]._id + "/",
							"data-apl": "true"
						
						}, source.title)

					);

					child.appendChild(

						Ulo.create("a", {

							"href": "#",
							"class": "username ellipsis"

						}, "@<username>")

					);

					child.appendChild(

						Ulo.create("span", {"class": "published"}, elapsedTime(now, source.published))
					
					);


					Ulo.register(parent);

					results.appendChild(parent);


				}

			}

		},

		/* ---------------------------------------------------------------------------- */

		users: function(data){

			if(data.users){

				var results = this.getResults("users"), 

				source, 

				parent, 

				child;


				if(this.first_user_request){

					this.first_user_request = false;


					Ulo.empty(results);


					Ulo.remove(this.getContainer("posts"));


					Ulo.remove(this.getContainer("users"), "minify");


					var load_button = this.getLoad("users");

					if(load_button !== null){

						Ulo.empty(load_button)

							.appendChild(

								document.createTextNode("Load accounts")

						);

					}

				}


				for(var i in data.users){

					source = data.users[i]._source;


					parent = Ulo.create("div", {"class": "result"});


					child = parent.appendChild(

						Ulo.create("a", {

							"class": "box_border",
							"href": "/user/" + source.username + "/",
							"data-apl": "true"

						})

					);

					Ulo.register(parent);


					child.appendChild( 

						Ulo.create("img", {"src": Ulo.MEDIA_URL + source.thumbnail + "/"})

					);

					child.appendChild( 

						Ulo.create(

							"span", {"class": "bold ellipsis"}, source.name
						
						)

					);

					child.appendChild( 

						Ulo.create(

							"span", {"class": "ellipsis"}, source.username
						
						)

					);


					results.appendChild(parent);
					

				}

			}

		}

	}

	/* DOCUMENT READY FUNCTION */
	/* -------------------------------------------------------------------------------- */
	$(function(){

		try{

			new Search();

		} catch(e){

			debug(e);
		
		}

	});

/* ------------------------------------------------------------------------------------ */
}());
