/*

	Post detail javascript file

	Dependencies: JQuery, Base.js, Users.js

*/


/* ------------------------------------------------------------------------------------ */

(function () {

"use strict";


	/* -------------------------------------------------------------------------------- */
	/*
		Base class for video slider controls.

		@param settings: Object of settings. See Draggable class.
		@param selector: Query selector to return the slider button.
		@param media_class: Class name set on the container when the slider is in use.
	*/
	function VideoControl(settings, selector, media_class){

		/* Slider button's margin */
		settings.marginOffset = settings.marginOffset || 0;

		/* Slider container's position offset */
		settings.positionOffset = settings.positionOffset || 0;

		/* Slider button's query selector. E.g. "button.slider" */
		this.selector = selector;

		/* Class set on the container while the slider is in use */
		this.media_class = media_class;


		/* Run base class constructor */

		window.Draggable.call(this, null, settings);

	}

	/* -------------------------------------------------------------------------------- */

	VideoControl.prototype = Ulo.inherit(window.Draggable.prototype);

	/* -------------------------------------------------------------------------------- */

	VideoControl.prototype.constructor = VideoControl;

	/* -------------------------------------------------------------------------------- */
	/*
		Register start events on the slider button and its container.

		@param container: Media container (An element that contains the video and controls).
		@param selector: Query selector to return the element that can be click to move the slider.
	*/
	VideoControl.prototype.register = function(container, selector){

		/* Get the slider button */

		var slider = container.querySelector(this.selector);

		/* Store the container as a property on the slider button */

		slider.container = container;


		/* Get the element that can be clicked to move the position of the slider */

		var element = container.querySelector(selector);

		/* Register the element to move the slider when clicked */

		$(element).on(this.start_events, {self: this}, this.moveSlider);


		/* Register the slider button */

		window.Draggable.prototype.register.call(this, slider);

	};

	/* -------------------------------------------------------------------------------- */
	/*
		Set this.element and add this.media_class to the container.
	*/
	VideoControl.prototype.startHandler = function(e){

		var self = e.data.self;

		self.element = e.target;

		Ulo.addClass(e.target.container, self.media_class);

		window.Draggable.prototype.startHandler.call(this, e);

	};

	/* -------------------------------------------------------------------------------- */
	/*
		Remove this.media_class from the container.
	*/
	VideoControl.prototype.endHandler = function(e){

		var self = e.data.self;

		if(self.element){

			Ulo.removeClass(self.element.container, self.media_class);

		}

		window.Draggable.prototype.endHandler.call(this, e);

	};

	/* -------------------------------------------------------------------------------- */

	VideoControl.prototype.getClickPosition = function(e){

		var keys = this.settings.horizontal ? ["X", "left"] : ["Y", "top"];

		return (

			this.getPosition(e)[keys[0]] - 
			this.settings.positionOffset - 
			e.currentTarget.getBoundingClientRect()[keys[1]]

		);

	};

	/* -------------------------------------------------------------------------------- */
	/*
		Return the video element.
	*/
	VideoControl.prototype.getVideo = function(){

		return this.element.container.querySelector("video");

	};

	/* -------------------------------------------------------------------------------- */
	/*
		Update the position of the slider element.
	*/
	VideoControl.prototype.moveSlider = function(e){

		var self = e.data.self,

		args = [self.getClickPosition(e)];


		if(self.settings.horizontal){

			args.push("left", "right");

		} else{

			args.push("top", "bottom");

		}


		self.element = e.target = e.currentTarget.querySelector(self.selector);
		
		self.calcPosition.apply(self, args);

		self.startHandler.call(this, e);

	};

	/* -------------------------------------------------------------------------------- */
	/*
		Return the position of the slider as a percentage.
	*/
	VideoControl.prototype.calcPosition = function(pos, p1, p2){

		pos += this.settings.marginOffset;


		if(pos < this.settings[p1]){ 
		
			pos = this.settings[p1]; 
		
		} else if(pos > this.settings[p2]){ 
		
			pos = this.settings[p2]; 
		
		}


		return this.pixelToPercent(pos, this.settings[p2]);

	};

	/* -------------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */

	function TrackControl(){

		/*
			marginOffset: Slider's left margin (-10px) as a positive value.
			positionOffset: Slider's width (20px) minus the slider's left margin (-10px).
		*/
		var settings = {vertical: false, marginOffset: 10, positionOffset: 30};

		VideoControl.call(this, settings, "button.track_slider", "track_controls");

	}

	/* -------------------------------------------------------------------------------- */

	TrackControl.prototype = Ulo.inherit(VideoControl.prototype);

	/* -------------------------------------------------------------------------------- */

	TrackControl.prototype.constructor = TrackControl;

	/* -------------------------------------------------------------------------------- */

	TrackControl.prototype.calcPosition = function(pos, p1, p2){

		/* Set the max width */

		this.settings[p2] = this.element.parentNode.clientWidth;

		/* Set the position of the slider */

		pos = VideoControl.prototype.calcPosition.call(this, pos, p1, p2);

		var progress = this.element.container.querySelector("span.track_progress");

		progress.style.width = this.element.style[p1] = pos + "%";

		/* Set the time of the video */

		var video = this.getVideo();

		video.currentTime = video.duration * pos * 0.01;

	};

	/* -------------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */

	function VolumeControl(){
		
		/*
			marginOffset: Slider's top margin (-6px) as a positive value.
			positionOffset: Slider's height (12px) minus the slider's top margin (-6px).
		*/
		var settings = { horizontal: false, bottom: 74, marginOffset: 6, positionOffset: 18 };

		VideoControl.call(this, settings, "button.volume_slider", "volume_controls");

	}

	/* -------------------------------------------------------------------------------- */

	VolumeControl.prototype = Ulo.inherit(VideoControl.prototype);

	/* -------------------------------------------------------------------------------- */

	VolumeControl.prototype.constructor = VolumeControl;

	/* -------------------------------------------------------------------------------- */

	VolumeControl.prototype.calcPosition = function(pos, p1, p2){

		/* Set the position of the slider (Invert the percentage: 100 - percentage) */

		pos = 100 - VideoControl.prototype.calcPosition.call(this, pos, p1, p2);

		this.element.style[p2] = pos + "%";

		/* Set the volume of the video */

		var video = this.getVideo();

		video.muted = video.volume === 0;

		video.volume = pos * 0.01;

	};

	/* -------------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */

	function FragmentControl(){
		
		/*
			marginOffset: Slider's left margin (-10px) as a positive value.
			positionOffset: Slider's width (20px) minus the slider's left margin (-10px).
		*/
		var settings = { vertical: false, marginOffset: 10, positionOffset: 30 };

		/* Run base class constructor */

		window.Draggable.call(this, null, settings);


		this.element = Ulo.get(Ulo.getMainID(), "button.track_start");

		this.element_two = Ulo.get(Ulo.getMainID(), "button.track_end");


		this.register(this.element);

	}

	/* -------------------------------------------------------------------------------- */

	FragmentControl.prototype = Ulo.inherit(window.Draggable.prototype);

	/* -------------------------------------------------------------------------------- */

	FragmentControl.prototype.constructor = FragmentControl;

	/* -------------------------------------------------------------------------------- */

	FragmentControl.prototype.calcPosition = function(pos, p1, p2){

		pos += this.settings.marginOffset;


		if(pos < this.settings[p1]){ 
		
			pos = this.settings[p1]; 
		
		} else if(pos > this.settings[p2]){ 
		
			pos = this.settings[p2]; 
		
		}


		this.element.style.left = this.pixelToPercent(pos, this.settings[p2]) + "%";

	};

	new FragmentControl();

	/* -------------------------------------------------------------------------------- */



	/* -------------------------------------------------------------------------------- */

	function PostVideo(){

		var video = document.createElement("video");

		var videoSupported = !!video.canPlayType;


		if (videoSupported){

			var fullScreenSupported = !!(

				document.fullscreenEnabled || 
				document.mozFullScreenEnabled || 
				document.msFullscreenEnabled || 
				document.webkitSupportsFullscreen || 
				document.webkitFullscreenEnabled || 
				video.webkitRequestFullScreen

			);


			if(fullScreenSupported){

				Element.prototype.requestFullscreen =

					Element.prototype.requestFullscreen || 
					Element.prototype.webkitRequestFullscreen ||
					Element.prototype.mozRequestFullScreen ||
					Element.prototype.msRequestFullscreen;


				document.onfullscreenchange =
				document.onwebkitfullscreenchange =
				document.onmozfullscreenchange =
				document.onmsfullscreenchange =
					
					this.fullscreenChange.bind(this);


				document.exitFullscreen =

					document.exitFullscreen || 
					document.webkitExitFullscreen || 
					document.mozCancelFullScreen || 
					document.msExitFullscreen;

			}


			this.Track = new TrackControl();

			this.Volume = new VolumeControl();

			this.register();


		} else{

			this.register = function(){}

		}

	}

	PostVideo.prototype = {

		constructor: PostVideo,

		/* ---------------------------------------------------------------------------- */

		register: function(context){

			var containers = $("div.media_container", context);

			for(var i=0, video, preload; i<containers.length; ++i){

				video = containers[i].querySelector("video");

				var data = { container: containers[i], video: video, self: this };

				$(video).on("error", data, this.error);


				preload = video.getAttribute("preload");

				if(preload === "" || preload === null || preload === "none"){

					$(containers[i]).on(Ulo.evts.click, data, this.load);

				} else if(video.readyState < video.HAVE_ENOUGH_DATA){

					$(video).on("canplay", data, this.setup);

				} else{

					this.setup({ data: data });

				}

			}

		},

		/* ---------------------------------------------------------------------------- */

		unregister: function(data){

			$(data.container.getElementsByTagName("button")).off();

			$(data.video).off().on("error", data, this.error);

			$(data.container).off();

		},

		/* ---------------------------------------------------------------------------- */
		
		load: function(e){

			$(e.currentTarget).off(e.type, e.data.self.load);

			var video = e.data.video;

			$(video).on("canplay", e.data, e.data.self.setup);

			video.setAttribute("autoplay", "autoplay");

			video.setAttribute("preload", "metadata");

			video.load();

			Ulo.remove(e.data.container.querySelector("div.video_error"));

		},

		/* ---------------------------------------------------------------------------- */

		setup: function(e){

			$(e.currentTarget).off(e.type, e.data.self.setup);


			var container = e.data.container,

			video = e.data.video,

			self = e.data.self,

			elem;


			/* Play / pause button */

			elem = container.querySelector("button.play");

			$(elem).on(Ulo.evts.click, e.data, self.togglePlay);


			/* Loop button */

			elem = container.querySelector("button.loop");

			$(elem).on(Ulo.evts.click, e.data, self.loop);


			/* Volume button (mute / unmute) */

			elem = container.querySelector("button.volume");

			$(elem).on(Ulo.evts.click, e.data, self.mute);


			/* Video duration text */

			if(video.duration){

				self.durationchange({ data: e.data });

			} else{

				$(video).one("durationchange", e.data, self.durationchange);

			}


			/* Video buffer indicator */

			if(video.buffered.length > 0){

				self.progress({ data: e.data });

			}


			/* Update the volume slider position */

			self.volumechange({ data: e.data });


			/* Video events */

			$(video)

				.on(Ulo.evts.click, e.data, self.togglePlay)

				.on("volumechange", e.data, self.volumechange)

				.on("timeupdate", e.data, self.timeupdate)

				.on("progress", e.data, self.progress)

				.on("ended", e.data, self.ended);


			/* Detect hovering */

			$(container)

				.on("mousemove mousedown", e.data, self.showControls)
				
				.on("mouseleave", e.data, self.hideControls)


			/* Display the video's controls */

			self.showControls({ data: e.data });


			/* Fullscreen button */

			elem = container.querySelector("button.fullscreen");

			if(video.requestFullscreen){

				$(elem).on(Ulo.evts.click, e.data, self.fullscreen);

			} else{

				Ulo.remove(elem);

			}


			/* Media track controls */

			self.Track.register(container, "div.track");				

			/* Volume slider controls */

			self.Volume.register(container, "div.volume_range");


		},

		/* ---------------------------------------------------------------------------- */

		secondsToTime: function(secs){

			secs = Math.round(secs);

			/* Minutes divisor */
			var md = secs % 3600;

			var h = Math.floor(secs / 3600);

			var m = Math.floor(md / 60);
			
			var s = Math.ceil(md % 60);


			return (h === 0 ? "" : h + ":") + m + ":" + (s < 10 ? "0" + s : s);

		},

		/* ---------------------------------------------------------------------------- */

		durationchange: function(e){

			var duration = e.data.container.querySelector("span.duration");

			Ulo.empty(duration)

				.appendChild(

					document.createTextNode(

						e.data.self.secondsToTime(e.data.video.duration || 0)

					)

			);

		},

		/* ---------------------------------------------------------------------------- */

		changeIcon: function(element, icon){

			Ulo.replaceClass(element, /(icon_[\w]+)/, "icon_" + icon);

		},

		/* ---------------------------------------------------------------------------- */

		togglePlay: function(e){

			var self = e.data.self,

			video = e.data.video,

			icon = e.data.container.querySelector("span.play");

			
			if(video.paused || video.ended){

				self.changeIcon(icon, "pause");

				var promise = video.play();

				if(promise){

					promise["catch"](function(evt){ self.error(evt) });

				}

			}else{

				self.changeIcon(icon, "play");

				video.pause();

			}

		},

		/* ---------------------------------------------------------------------------- */

		loop: function(e){

			var video = e.data.video;

			video.loop = !video.loop;

			(video.loop ? Ulo.addClass : Ulo.removeClass)(e.currentTarget, "selected");

		},

		/* ---------------------------------------------------------------------------- */

		mute: function(e){

			e.data.video.muted = !e.data.video.muted;

		},

		/* ---------------------------------------------------------------------------- */

		volumechange: function(e){

			var self = e.data.self,

			video = e.data.video,

			icon = e.data.container.querySelector("span.volume"),

			value = e.data.container.querySelector("span.volume_value"),

			slider = e.data.container.querySelector("button.volume_slider");


			if(video.muted){

				slider.style.bottom = value.style.height = "0%";

				self.changeIcon(icon, "mute");

			} else{

				slider.style.bottom = value.style.height = (video.volume * 100) + "%";

				self.changeIcon(icon, "volume");

			}

		},

		/* ---------------------------------------------------------------------------- */

		timeupdate: function(e){

			var container = e.data.container;


			container.querySelector("span.track_progress").style.width = 

			container.querySelector("button.track_slider").style.left = (

				((e.currentTarget.currentTime / e.currentTarget.duration) * 100) + "%"

			);


			Ulo.empty(container.querySelector("span.current_time"))

				.appendChild(

					document.createTextNode(

						e.data.self.secondsToTime(e.data.video.currentTime)

					)

			);

		},

		/* ---------------------------------------------------------------------------- */

		progress: function(e){

			var video = e.data.video;

			if(video.duration > 0){

				var buffered = video.buffered,

				range = e.data.container.querySelector("span.track_buffer");

				range.style.width = 

					Math.round(

						(buffered.end(buffered.length - 1) / video.duration) * 100

					) + "%";

			}

		},

		/* ---------------------------------------------------------------------------- */

		showControls: function(e){

			var self = e.data.self;

			clearTimeout(self.timeout_id);

			self.toggleControls(e.data.container, true);

			self.timeout_id = setTimeout(self.hideControls.bind(this, e), 3000);

		},

		/* ---------------------------------------------------------------------------- */

		hideControls: function(e){

			var self = e.data.self;

			clearTimeout(self.timeout_id);


			if(e.data.video.paused === false){

				var track = e.data.container.querySelector("div.video_track");

				if(Ulo.isDescendant(track, e.target, 5) === false){

					self.toggleControls(e.data.container, false);

				}

			}

		},

		/* ---------------------------------------------------------------------------- */

		toggleControls: function(container, show){

			var controls = container.querySelector("div.video_actions");

			(show ? Ulo.removeClass : Ulo.addClass)(controls, "cloak");

		},

		/* ---------------------------------------------------------------------------- */

		hasFullScreen: function(){

			return !!(

				document.fullscreenElement || 
				document.webkitFullscreenElement|| 
				document.mozFullScreenElement || 
				document.msFullscreenElement

			);

		},

		/* ---------------------------------------------------------------------------- */

		fullscreen: function(e){

			if(e.data.self.hasFullScreen()){

				if(document.exitFullscreen){
					
					document.exitFullscreen(); 
				
				}
			
			} else{

				e.data.container.requestFullscreen();

			}

		},

		/* ---------------------------------------------------------------------------- */

		fullscreenChange: function(e){

			(this.hasFullScreen() ? Ulo.addClass : Ulo.removeClass)(document.body, "fullscreen");

		},

		/* ---------------------------------------------------------------------------- */

		ended: function(e){

			if(e.currentTarget.loop === false){

				var icon = e.data.container.querySelector("span.play");

				e.data.self.changeIcon(icon, "repeat");

			}

		},

		/* ---------------------------------------------------------------------------- */

		error: function(e){

			console.log("VIDEO ERROR");

			e.data.self.unregister(e.data);


			var error = e.data.container.appendChild(

				Ulo.create("div", {"class": "video_error"})

			);

			error = error.appendChild(

					Ulo.create("div", {"class": "table"})

				)

				.appendChild(

					Ulo.create("div", {"class": "cell"})

			);

			error.appendChild(

				Ulo.create("p", {"class": "centre"}, "This video has stopped working. Please try again.")

			);

			var button = error.appendChild(

				Ulo.create("button", { "class": "centre", "type": "button" })

			);

			button.appendChild(

				Ulo.create("span", { "class": "icon icon_repeat" })

			);

			$(button).on(Ulo.evts.click, e.data, e.data.self.load);

		},

		/* ---------------------------------------------------------------------------- */

	}

	/* -------------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */
	/*
		Manage all interactions with a post whether on the timeline or the post detail 
		page.
	*/
	function PostDetail(){


		Ulo.checkDependencies("Session", "Pip");


		/* Toggle the description */
		
		var description = Ulo.get("toggle_post_description", "button");

		if(description !== null){

			Ulo.menus(description, "height", "open", false, this.descriptionIcon);

		}

	}

	PostDetail.prototype = {

		constructor: PostDetail,

		/* ---------------------------------------------------------------------------- */
		/*
			Update the arrow icon on the button that toggles the description.

			@params *: See Menu class callback function.
		*/
		descriptionIcon: function(isClosed, button, menu, target){

			var icon = button.querySelector(".icon");

			if(icon !== null){

				icon.className = "icon icon_" + (isClosed ? "down" : "up") + "_arrow";

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Register post actions common to the detail page and the timeline within the 
			context.

			@param context: Optional context to narrow the scope.
		*/
		
	}

	/* -------------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */
	/* DOCUMENT READY FUNCTION */
	/* -------------------------------------------------------------------------------- */

	$(function(){

		Ulo.newClass(PostDetail, "PostDetail", true);

		Ulo.newClass(PostVideo, "PostVideo", true);
		
	});

	/* -------------------------------------------------------------------------------- */

}());



