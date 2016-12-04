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
		@param selector: Query selector that returns the slider button.
		@param media_class: Class name set on the container when the slider is in use.
	*/
	function VideoControl(settings, selector, media_class){

		/* Slider button's negative margin .*/

		settings.marginOffset = settings.marginOffset || 0;

		/* Slider button's query selector. E.g. "button.slider". */
		
		this.selector = selector;

		/* Class name set on the container while the slider is in use. */
		
		this.media_class = media_class;


		/* Run base class constructor. */

		window.Draggable.call(this, null, settings);

	}

	/* -------------------------------------------------------------------------------- */

	VideoControl.prototype = Ulo.inherit(window.Draggable.prototype);

	/* -------------------------------------------------------------------------------- */

	VideoControl.prototype.constructor = VideoControl;

	/* -------------------------------------------------------------------------------- */
	/*
		Register start events on the target element.

		@param container: Media container.
		@param selector: Query selector that returns the element to attach start events to.
	*/
	VideoControl.prototype.register = function(container, selector){

		/* Slider button or an element that contains the slider button. */

		var target = container.querySelector(selector);

		/* Register the element. */

		$(target)

			.off(this.start_events, this.startHandler)

			.on(this.start_events, {self: this, container: container}, this.startHandler);

	};

	/* -------------------------------------------------------------------------------- */
	/*
		Unregister start events on the target element.

		@param container: Media container.
		@param selector: Query selector that returns the element to attach start events to.
	*/
	VideoControl.prototype.unregister = function(container, selector){

		/* Remove the media class set on the container */

		Ulo.removeClass(container, this.media_class);

		/* Get the registered element */

		var target = container.querySelector(selector);

		/* Unregister the element */

		window.Draggable.prototype.unregister.call(this, target);
	
	},

	/* -------------------------------------------------------------------------------- */
	/*
		Assign values to this.element and this.target before setting the move and end
		handlers.
	*/
	VideoControl.prototype.startHandler = function(e){

		var self = e.data.self;

		/* Set this.target to the media container. */

		self.target = e.data.container;

		/* Set this.media_class on the media container. */

		Ulo.addClass(self.target, self.media_class);

		/* Set this.element and e.currentTarget to the slider button. */

		self.element = e.currentTarget = self.target.querySelector(self.selector);

		/* Move the slider to the current position and set the move and end handlers. */

		window.Draggable.prototype.startHandler.call(this, e);

	};

	/* -------------------------------------------------------------------------------- */
	/*
		Reverse the actions performed by startHandler().
	*/
	VideoControl.prototype.endHandler = function(e){

		var self = e.data.self;

		/* Remove this.media_class from the media container. */

		Ulo.removeClass(self.target, self.media_class);

		/* Unregister the move and end handlers. */

		window.Draggable.prototype.endHandler.call(this, e);

		/* Unassign this.element and this.target. */

		self.element = self.target = null;

	};

	/* -------------------------------------------------------------------------------- */
	/*
		Return the video element found in the media container.
	*/
	VideoControl.prototype.getVideo = function(){

		return this.target.querySelector("video");

	};

	/* -------------------------------------------------------------------------------- */
	/*
		Return the position of the slider as a percentage.
	*/
	VideoControl.prototype.calcPosition = function(pos, p1, p2){

		/* Apply the button's negative margin. */

		pos += this.settings.marginOffset;


		/* Constrain the position to its boundaries */

		if(pos < this.settings[p1]){ 
		
			pos = this.settings[p1]; 
		
		} else if(pos > this.settings[p2]){ 
		
			pos = this.settings[p2]; 
		
		}


		/* Return the position as a percentage. */

		return this.pixelToPercent(pos, this.settings[p2]);

	};

	/* -------------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */

	function TrackControl(){

		/*
			vertical: Disable vertical movement.
			marginOffset: Slider's left margin (-10px) as a positive value.
		*/
		var settings = { vertical: false, marginOffset: 10 };

		VideoControl.call(this, settings, "button.track_slider", "track_controls");

	}

	/* -------------------------------------------------------------------------------- */

	TrackControl.prototype = Ulo.inherit(VideoControl.prototype);

	/* -------------------------------------------------------------------------------- */

	TrackControl.prototype.constructor = TrackControl;

	/* -------------------------------------------------------------------------------- */

	TrackControl.prototype.calcPosition = function(pos, p1, p2){

		/* Dynamically set the max width. */

		this.settings[p2] = this.element.parentNode.clientWidth;


		/* Get the new position of the slider as a percentage. */

		pos = VideoControl.prototype.calcPosition.call(this, pos, p1, p2);

		
		/* Set the time of the video. */

		var video = this.getVideo();

		video.currentTime = video.duration * pos * 0.01;


		/* Update the decorative progress bar. */

		var progress = this.target.querySelector("span.track_progress");

		progress.style.width = this.element.style[p1] = pos + "%";


		/*
			Video elements are given the property "looped". If true the video will be
			looped between video.startFragment and video.endFragment.
		*/
		if(video.looped === true){

			/* Set the position of the loop fragments */

			if(video.startFragment > video.currentTime){
				
				/* Update video.startFragment */

				video.startFragment = video.currentTime;

				/* Set the position of the slider and the decorative element. */

				var slider = this.target.querySelector("button.track_start"),

				span = this.target.querySelector("span.track_start");

				slider.style.left = span.style.width = progress.style.width;


			} else if(video.endFragment < video.currentTime){

				/* Update video.endFragment */

				video.endFragment = video.currentTime;

				/* Set the position of the slider and the decorative element. */

				var slider = this.target.querySelector("button.track_end"),

				span = this.target.querySelector("span.track_end");

				slider.style.left = progress.style.width;

				span.style.width = (100 - pos) + "%";

			}

		}

	};

	/* -------------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */

	function FragmentControl(){
		
		/*	
			vertical: Disable vertical movement.
			marginOffset: Slider's left margin (-7px) as a positive value.
			minLoop: Minimum loop value in seconds.
		*/
		var settings = { vertical: false, marginOffset: 7, minLoop: 5 };

		/* Run base class constructor */

		VideoControl.call(this, settings, "", "track_controls");

	}

	/* -------------------------------------------------------------------------------- */

	FragmentControl.prototype = Ulo.inherit(VideoControl.prototype);

	/* -------------------------------------------------------------------------------- */

	FragmentControl.prototype.constructor = FragmentControl;

	/* -------------------------------------------------------------------------------- */
	/*
		Return true if the video's duration exceeds minLoop else return false.
	*/
	FragmentControl.prototype.hasFragment = function(video){

		return video.duration > this.settings.minLoop;

	};

	/* -------------------------------------------------------------------------------- */
	/*
		Assign values to this.element and this.target before setting the move and end
		handlers.
	*/
	FragmentControl.prototype.startHandler = function(e){

		var self = e.data.self;

		/* Set this.target to the media container. */

		self.target = e.data.container;

		/* Set this.media_class on the media container. */

		Ulo.addClass(self.target, self.media_class);

		/* Set this.element to the slider button. */

		self.element = e.currentTarget;

		/* Move the slider to the current position and set the move and end handlers. */

		window.Draggable.prototype.startHandler.call(this, e);

	};

	/* -------------------------------------------------------------------------------- */
	/*
		Register start events on the slider buttons.

		@param container: Media container.
	*/
	FragmentControl.prototype.register = function(container){

		/* Get the slider buttons. */

		var start = container.querySelector("button.track_start"),

		end = container.querySelector("button.track_end");

		start.isStartFragment = true;


		/* Reset the fragment values. */

		var video = container.querySelector("video");		

		video.startFragment = 0;

		start.style.left = "0%";

		video.endFragment = video.duration;

		end.style.left = "100%";


		/* Register the slider buttons. */

		var data = {self: this, container: container};

		$(start)
			
			.off(this.start_events, this.startHandler)

			.on(this.start_events, data, this.startHandler);

		$(end)

			.off(this.start_events, this.startHandler)
			
			.on(this.start_events, data, this.startHandler);

	};

	/* -------------------------------------------------------------------------------- */
	/*
		Unregister start events on the slider buttons.

		@param container: Media container.
	*/
	FragmentControl.prototype.unregister = function(container){

		
		Ulo.removeClass(container, this.media_class);


		/* Reset the decorative elements. */

		var start = container.querySelector("span.track_start"),

		end = container.querySelector("span.track_end");

		start.style.width = end.style.width = "0%";


		/* Unregister the slider button. */

		start = container.querySelector("button.track_start"),

		end = container.querySelector("button.track_end");

		window.Draggable.prototype.unregister.call(this, start);

		window.Draggable.prototype.unregister.call(this, end);

	}

	/* -------------------------------------------------------------------------------- */
	/*
		Update the slider and progress element for the TrackControl class.

		@param pos: Position as a percentage.
		@param time: Time to set the video to.
		@param video: Video element.
	*/
	FragmentControl.prototype.setTrackSlider = function(pos, time, video){

		var progress = this.target.querySelector("span.track_progress"),

		button = this.target.querySelector("button.track_slider");

		progress.style.width = button.style.left = pos + "%";

		video.currentTime = time;

	};

	/* -------------------------------------------------------------------------------- */

	FragmentControl.prototype.calcPosition = function(pos, p1, p2){

		/* Dynamically set the max width. */

		this.settings[p2] = this.element.parentNode.clientWidth;


		/* Get the new position of the slider as a percentage. */

		pos = VideoControl.prototype.calcPosition.call(this, pos, p1, p2);


		/* Get the time of the video. */

		var video = this.getVideo(),

		time = video.duration * pos * 0.01;


		if(this.element.isStartFragment === true){

			if(time < video.endFragment - this.settings.minLoop){

				/* Update video.startFragment */

				video.startFragment = time;


				/* Set the position of the slider and the decorative element. */

				var span = this.target.querySelector("span.track_start");

				this.element.style.left = span.style.width = pos + "%";


				/* Update the TrackControl elements. */

				if(video.currentTime < time){

					this.setTrackSlider(pos, time, video);

				}

			}

		} else if(time > video.startFragment + this.settings.minLoop){

			/* Update video.endFragment */

			video.endFragment = time;


			/* Set the position of the slider and the decorative element. */

			var span = this.target.querySelector("span.track_end");

			span.style.width = (100 - pos) + "%";

			this.element.style.left = pos + "%";


			/* Update the TrackControl elements. */

			if(video.currentTime > time){

				this.setTrackSlider(pos, time, video);

			}			

		}

	};

	/* -------------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */

	function VolumeControl(){
		
		/*
			horizontal: Disable horizontal movement.
			bottom: Height of the volume range element.
			marginOffset: Slider's top margin (-6px) as a positive value.
		*/
		var settings = { horizontal: false, bottom: 74, marginOffset: 6 };

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

		video.volume = pos * 0.01;

		/* Set muted after setting the volume. */

		video.muted = video.volume === 0;

	};

	/* -------------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */

	function PostVideo(){

		var video = document.createElement("video"),

		videoSupported = !!video.canPlayType;


		if(videoSupported){

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

			this.Fragment = new FragmentControl();

			this.Volume = new VolumeControl();

			this.register();


		} else{

			this.register = function(){}

		}

	}

	PostVideo.prototype = {

		constructor: PostVideo,

		/* ---------------------------------------------------------------------------- */
		/*
			Register events on all videos found within "context".

			@param conext: Optional context to narrow the scrope.
		*/
		register: function(context){

			/* Get all media containers. */

			var containers = $("div.media_container", context);


			for(var i=0, video, preload; i<containers.length; ++i){

				/* Get the video element */

				video = containers[i].querySelector("video");


				/* Create the data object that is attached to all events for this video. */

				var data = { container: containers[i], video: video, self: this };


				/* Set the error handler. */

				$(video).on("error", data, this.error);


				preload = video.getAttribute("preload");

				/* 
					If the file has not been preloaded add a click event to trigger
					loading of the file.
				*/
				if(preload === "" || preload === null || preload === "none"){

					$(containers[i]).on(Ulo.evts.click, data, this.load);

				}

				/* 
					If the file is not ready attach an event to call this.setup() when 
					it is.
				*/
				else if(video.readyState < video.HAVE_ENOUGH_DATA){

					$(video).on("canplay", data, this.setup);

				}

				/*
					Else the file is ready so call this.setup().
				*/
				else{

					this.setup({ data: data });

				}

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Unregister video events.

			@param data: Video file's data object. See register().
		*/
		unregister: function(data){

			/* Detach all events set on the buttons. See this.setup() */

			$(data.container.getElementsByTagName("button")).off();

			/* Detach all events set on the video - Excluding the error handler. */

			$(data.video).off().on("error", data, this.error);

			/* Detach all events set on the container. */

			$(data.container).off();


			/* Unregister Track controls. */

			this.Track.unregister(data.container, "div.track");				

			/* Unregister Volume controls. */

			this.Volume.unregister(data.container, "div.volume_range");

			/* Unregister Fragment controls. */

			this.loop(data, false);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Load / reload the video file.
		*/
		load: function(e){

			/* Remove the error div from the element */

			Ulo.remove(e.data.container.querySelector("div.video_error"));

			/* Unregister this event */

			$(e.currentTarget).off(e.type, e.data.self.load);


			/* Load / reload the video. */

			var video = e.data.video;

			$(video).on("canplay", e.data, e.data.self.setup);

			video.setAttribute("data-autoplay", "true");

			video.setAttribute("preload", "metadata");

			video.load();

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Attach all events to control video playback.
		*/
		setup: function(e){

			/* Unregister this event */

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

			$(elem).on(Ulo.evts.click, e.data, self.toggleLoop);


			/* Volume button (mute / unmute) */

			elem = container.querySelector("button.volume");

			$(elem).on(Ulo.evts.click, e.data, self.toggleMute);


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


			/* Detect hovering to toggle the controls */

			$(container)

				.on("mousemove mousedown", e.data, self.showControls)
				
				.on("mouseleave", e.data, self.hideControls);

			/* Display the video's controls */

			self.showControls({ data: e.data });


			/* Toggle thumbnail */

			elem = container.querySelector("span.track_thumbnail");

			$(elem)

				.on("mouseenter", e.data, self.showThumbnail)
			
				.on("mouseleave", e.data, self.hideThumbnail);


			/* Fullscreen button */

			elem = container.querySelector("button.fullscreen");

			if(video.requestFullscreen){

				$(elem).on(Ulo.evts.click, e.data, self.toggleFullscreen);

			} else{

				Ulo.remove(elem);

			}


			/* Media track controls */

			self.Track.register(container, "div.track");				

			/* Volume slider controls */

			self.Volume.register(container, "div.volume_range");


			/* Play the video */

			if(video.getAttribute("data-autoplay") === "true"){

				self.togglePlay({ data: e.data });

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return the thumbnail container or null.
		*/
		getThumbnail: function(e){

			return e.data.container.querySelector("div.video_thumbnail");

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Display the thumbnail.
		*/
		showThumbnail: function(e){

			/* Get or create the thumbnail element. */

			var thumbnail = e.data.self.getThumbnail(e);

			if(thumbnail === null){

				thumbnail = e.data.container.appendChild(

					Ulo.create("div", {"class": "video_thumbnail"})

				);

				thumbnail.appendChild(

					Ulo.create("img", {

						"src": Ulo.getMediaURL(e.currentTarget.getAttribute("data-src"))

					})

				);

			} else{

				Ulo.removeClass(thumbnail, Ulo.cls.hide);

			}

			/* Calculate the position of the thumbnail */

			var spacing = 20, /* Left margin */

			max_width = e.data.container.clientWidth - spacing,

			left = (e.currentTarget.offsetLeft + spacing) - thumbnail.clientWidth * 0.5;


			left = Math.min(Math.max(left, spacing), max_width - thumbnail.clientWidth);

			thumbnail.style.left = left + "px";

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Hide the thumbnail.
		*/
		hideThumbnail: function(e){

			Ulo.addClass(e.data.self.getThumbnail(e), Ulo.cls.hide);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return "secs" in the format hh:mm:ss.

			@param secs: Time in seconds.
		*/
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
		/*
			Set the duration text.
		*/
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
		/*
			Toggle video playback.
		*/
		togglePlay: function(e){

			var self = e.data.self,

			video = e.data.video,

			icon = e.data.container.querySelector("span.play");

			
			/* Play the video. */

			if(video.paused || video.ended){

				Ulo.replaceIcon(icon, "pause_white");

				var promise = video.play();

				if(promise){

					promise["catch"](function(evt){ self.error(evt) });

				}

			}

			/* Else pause the video. */

			else{

				Ulo.replaceIcon(icon, "play_white");

				video.pause();

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Toggle mute.
		*/
		toggleMute: function(e){

			e.data.video.muted = !e.data.video.muted;

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Update styling for the volume controls.
		*/
		volumechange: function(e){

			var self = e.data.self,

			video = e.data.video,

			icon = e.data.container.querySelector("span.volume"),

			value = e.data.container.querySelector("span.volume_value"),

			slider = e.data.container.querySelector("button.volume_slider");


			if(video.muted){

				slider.style.bottom = value.style.height = "0%";

				Ulo.replaceIcon(icon, "mute_white");

			} else{

				slider.style.bottom = value.style.height = (video.volume * 100) + "%";

				Ulo.replaceIcon(icon, "volume_white");

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Toggle loop (Set as the property video.looped for custom loop handling).
		*/
		toggleLoop: function(e){

			e.data.self.loop(e.data);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Update all elements that control looping of a video.
			
			@param data: Video file's data object. See register().
			@param loop: Optional boolean - if undefined the current loop value is toggled.
		*/
		loop: function(data, loop){

			/* Set video.looped */

			data.video.looped = (loop === undefined ? !data.video.looped : loop);

			/* Get the loop icon */

			var icon = data.container.querySelector("span.loop");

			/* Update the loop icon. */

			Ulo.replaceIcon(icon, (data.video.looped ? "loop_white" : "loop"));


			var keys = (this.Fragment.hasFragment(data.video) && data.video.looped) ?

				["on", "register", "removeClass"] 

				: 

				["off", "unregister", "addClass"];

			/* Toggle the events that loop fragments of the video. */

			$(data.video)[ keys[0] ]("timeupdate", this.loopupdate);

			this.Fragment[ keys[1] ](data.container);

			/* Toggle the display of the slider buttons */

			Ulo[ keys[2] ](data.container.querySelector("div.fragment"), Ulo.cls.hide);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Timeupdate event handler to loop a video between video.startFragment and 
			video.endFragment.
		*/
		loopupdate: function(e){

			var video = e.currentTarget;

			if(video.currentTime > video.endFragment){

				video.currentTime = video.startFragment;

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Update styling for the video track controls.
		*/
		timeupdate: function(e){

			var container = e.data.container,

			video = e.data.video;


			/* Update the slider and progress elements. */

			container.querySelector("span.track_progress").style.width = 

			container.querySelector("button.track_slider").style.left = (

				((e.currentTarget.currentTime / e.currentTarget.duration) * 100) + "%"

			);


			/* Update elapsed time. */

			Ulo.empty(container.querySelector("span.current_time"))

				.appendChild(

					document.createTextNode(

						e.data.self.secondsToTime(video.currentTime)

					)

			);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Update styling for the buffered track.
		*/
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
		/*
			Show the video controls panel.
		*/
		showControls: function(e){

			var self = e.data.self;

			clearTimeout(self.timeout_id);

			self.toggleControls(e.data.container, true);

			self.timeout_id = setTimeout(self.hideControls.bind(this, e), 3000);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Hide the video controls panel.
		*/
		hideControls: function(e){

			var self = e.data.self;

			clearTimeout(self.timeout_id);


			if(e.data.video.paused === false){

				var track = e.data.container.querySelector("div.video_track");

				if(e.target === undefined || Ulo.isDescendant(track, e.target, 5) === false){

					self.toggleControls(e.data.container, false);

				}

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Toggle the class that shows / hides the video controls panel.
		*/
		toggleControls: function(container, show){

			var controls = container.querySelector("div.video_actions");

			(show ? Ulo.removeClass : Ulo.addClass)(controls, "cloak");

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return true if the browser is in full screen mode, else return false.
		*/
		isFullscreen: function(){

			return !!(

				document.fullscreenElement || 
				document.webkitFullscreenElement|| 
				document.mozFullScreenElement || 
				document.msFullscreenElement

			);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Toggle full screen mode.
		*/
		toggleFullscreen: function(e){

			if(e.data.self.isFullscreen()){

				if(document.exitFullscreen){
					
					document.exitFullscreen(); 
				
				}
			
			} else{

				e.data.container.requestFullscreen();

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Full screen change event handler.

			Add or remove the class "fullscreen" from the body element depending on the
			current mode of the browser.
		*/
		fullscreenChange: function(e){

			(this.isFullscreen() ? Ulo.addClass : Ulo.removeClass)(document.body, "fullscreen");

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Video ended playback event handler.
		*/
		ended: function(e){

			/*
				If the video has been looped restart the video from video.startFragment.
			*/
			if(e.currentTarget.looped === true){

				e.data.self.togglePlay.call(this, e);

				e.currentTarget.currentTime = e.currentTarget.startFragment || 0;

			}

			/*
				Else change the play button icon to repeat.
			*/
			else{

				var icon = e.data.container.querySelector("span.play");

				Ulo.replaceIcon(icon, "repeat_white");

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Video error event handler.

			Unregister all events and display an error to the user.
		*/
		error: function(e){

			console.log("VIDEO ERROR");

			/* Unregister video events. */

			e.data.self.unregister(e.data);


			/* Create the error message */

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


			/* Add a button to reload the video. */

			var button = error.appendChild(

				Ulo.create("button", { "class": "centre", "type": "button" })

			);

			button.appendChild(

				Ulo.create("span", { "class": "icon icon_repeat_white" })

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


		/*
			Register post menu actions - MUST REGISTER BEFORE moveActionsMenu.
		*/
		var menu = Ulo.get("post_menu");

		if(menu !== null){

			$(menu.querySelector("button.edit_post")).on(Ulo.evts.click, this.editPost);

			$(menu.querySelector("button.delete_post")).on(Ulo.evts.click, {self: this}, this.deletePost);

			$(menu.querySelector("button.report_post")).on(Ulo.evts.click, {self: this, name: "post"}, this.reportForm);

		}
		

		/*
			Register comment menu actions - MUST REGISTER BEFORE moveActionsMenu.
		*/
		menu = Ulo.get("comment_menu");

		if(menu !== null){

			$(menu.querySelector("button.delete_comment")).on(Ulo.evts.click, {self: this}, this.deleteComment);

			$(menu.querySelector("button.report_comment")).on(Ulo.evts.click, {self: this, name: "comment"}, this.reportForm);

		}


		this.registerAll();

	}

	PostDetail.prototype = {

		constructor: PostDetail,




		/* ---------------------------------------------------------------------------- */
		/*
			Register post actions common to the detail page and the timeline within the 
			context.

			@param context: Optional context to narrow the scope.
		*/
		register: function(context){

			/*
				Check that utils.js has loaded.
			*/
			if(window.Connect){

				Connect.register(context);

			}

			this.registerVote(context);

			/*
				Register after all post_menu and comment_menu actions.
			*/
			this.registerMoveActionsMenu(context);

		},	

		/* ---------------------------------------------------------------------------- */
		/*
			Register all post actions.

			@param context: Optional context to narrow the scope.
		*/
		registerAll: function(context){

			this.register(context);

			this.registerComment(context);

			this.registerLoadComments(context);

			this.registerToggleDescription(context);

		},

		/* ---------------------------------------------------------------------------- */




		/* ---------------------------------------------------------------------------- */
		/* DESCRIPTION */
		/* ---------------------------------------------------------------------------- */
		/*
			Register the button that toggles the post description.
		*/
		registerToggleDescription: function(){

			var description = Ulo.get("toggle_post_description", "button");

			if(description !== null){

				Ulo.menus(description, "height", "open", false, this.descriptionIcon);

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Update the arrow icon on the button that toggles the description.

			@params *: See Menu class callback function.
		*/
		descriptionIcon: function(isClosed, button, menu, target){

			var icon = button.querySelector(".icon");

			if(icon !== null){

				var cls = "icon_" + (isClosed ? "down" : "up") + "_arrow";

				Ulo.replaceClass(icon, /icon_[\w]+/, cls);

			}

		},

		/* ---------------------------------------------------------------------------- */
		/* END DESCRIPTION */
		/* ---------------------------------------------------------------------------- */




		/* ---------------------------------------------------------------------------- */
		/* ACTION MENUS */
		/* ---------------------------------------------------------------------------- */
		/*
			Register all links that toggle the post actions menus (post_menu or 
			comment_menu).

			@param context: Optional context to narrow the scope.
		*/
		registerMoveActionsMenu: function(context){

			var links = $("a.toggle_actions_menu", context);

			for(var i=0; i<links.length; ++i){

				Ulo.menus(links[i], "height", false, false, this.moveActionsMenu, true);

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Callback function executed each time an actions menu is opened or closed. The
			function moves the menu to the required position.
			
			@param *: See base.js Menu Class.
		*/
		moveActionsMenu: function(isClosed, button, menu, target){

			/*
				Attribute that stores the post or comment id.
			*/
			var attr = "data-id";

			/*
				The action menu (post_menu or comment_menu) buttons.
			*/
			var buttons = menu.getElementsByTagName("button");

			/*
				Keep the menu open if the menu is being closed but the target element is
				another link that also toggles this particular menu.
			*/
			var keep_open = target.getAttribute("data-toggle")===menu.id && target!==button;


			/*
				If closing the menu strip each button of the "data-id" attribute and place 
				the menu at the foot of the container.
			*/
			if(isClosed && keep_open === false){

				Ulo.getMain().appendChild(menu);

				for(var i=0; i<buttons.length; ++i){

					buttons[i].removeAttribute(attr);

				}

			}

			/*
				If opening the menu set the post or comment id on each of the buttons
				and place the menu above the link.
			*/
			else{

				if(isClosed && keep_open){

					button = target;

					/* Force the menu open */
					$(button).trigger(Ulo.evts.click);

				}

				button.parentNode.insertBefore(menu, button);

				for(var i=0; i<buttons.length; ++i){

					buttons[i].setAttribute(attr, button.getAttribute(attr));

				}

				/* Toggle the class "owner" to display the relevant menu options */

				var isOwner = button.getAttribute("data-is-owner") === "true";

				(isOwner ? Ulo.addClass : Ulo.removeClass)(menu, "owner");

				menu.style.height = "auto";

			}

		},

		/* ---------------------------------------------------------------------------- */
		/* END ACTION MENUS */
		/* ---------------------------------------------------------------------------- */




		/* ---------------------------------------------------------------------------- */
		/* VOTES */
		/* ---------------------------------------------------------------------------- */
		/*
			Register the post vote buttons.

			@param context: Optional context to narrow the scrope.
		*/
		registerVote: function(context){

			if(window.updateCounters){

				var forms = $("form.post_vote_form", context);


				for(var i=0, buttons, voted; i<forms.length; ++i){

					voted = forms[i].querySelector("input[name='voted']");

					/*
						If the user has not voted on a post it will not have the input
						element input[name='voted'].

						Add the element to normalise the forms.
					*/
					if(voted === null){

						forms[i].appendChild(

							Ulo.create("input", {"type": "hidden", "name": "voted"})

						)

					}

					/*
						NOTE: All button in the form are assumed to be vote buttons.
					*/
					buttons = forms[i].getElementsByTagName("button");

					$(buttons).on(Ulo.evts.click, {self: this}, this.vote);

				}

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Style the icon to appear selected or unselected.

			@param button: Vote button.
			@param select: Boolean - if true add "selected" to the button, else remove it.
		*/
		selectVote: function(button, select){

			if(button !== null){

				var toggle = (select ? Ulo.addClass : Ulo.removeClass)(button, "selected");

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Vote on a post.
		*/
		vote: function(e){

			e.preventDefault();

			var self = e.data.self;

			if(Ulo.Pip.login() !== null){

				Ulo.Pip.open();

			}

			else if(Ulo.requestAvailable()){

				Ulo.acquireRequest();

				Ulo.addClass(e.currentTarget, Ulo.cls.disabled);


				setTimeout(function(){

					/* Get the form relative to the vote button */
					var form = e.currentTarget.parentNode.parentNode,

					vote = e.currentTarget.value,

					voted = form.querySelector("input[name='voted']"),

					data = "vote=" + vote + "&voted=" + voted.value;


					Ulo.request({

							type:"GET",
							data: data,
							url: form.getAttribute("action")

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

								/* Update the counter values for the votes */

								var current_vote = form.querySelector("button[value='"+ voted.value +"']");

								if(current_vote !== e.currentTarget){

									self.selectVote(e.currentTarget, true);

									if(current_vote !== null){

										updateCounters(current_vote.parentNode, false);

									}

								}

								self.selectVote(current_vote, false);

								voted.value = vote !== voted.value ? vote : "";

								updateCounters(e.currentTarget.parentNode, !!voted.value);


								/* Update the sparklines */

								var sparkbar = Ulo.get("sparkbar");

								if(sparkbar !== null){

									var total = 0,

									counters = $("span.vote_count", form);


									for(var i=0; i<counters.length; ++i){

										total += parseInt(counters[i].innerHTML);

									}


									if(total === total){

										var lines = sparkbar.getElementsByTagName("span");

										for(var i=0, value; i<counters.length && i<lines.length; ++i){

											value = parseInt(counters[i].innerHTML);

											if(value===value){

												lines[i].style.width = (total===0 ? 0 : 100*value/total)+"%";

											}

										}

									}

								}

							}

						})

						/* Params: xhr, status code, error type */
						.fail(function(xhr, sc, type){

							if(Ulo.Session.hasChanged(xhr)){

								Ulo.messages("Your session has expired. Refresh the page and try again.");

							}
							
						})

						.always(function(){

							Ulo.removeClass(e.currentTarget, Ulo.cls.disabled);

					});

				}, 500);

			}

		},

		/* ---------------------------------------------------------------------------- */
		/* END VOTES */
		/* ---------------------------------------------------------------------------- */




		/* ---------------------------------------------------------------------------- */
		/* REPORTING */
		/* ---------------------------------------------------------------------------- */
		/*
			Display the post or comment report form.
		*/
		reportForm: function(e){

			var self = e.data.self,

			name = e.data.name,

			page_id = name + "_report",

			id = this.getAttribute("data-id");


			if(id){

				var page = Ulo.get(page_id),

				url = "/" + name + "/" + id + "/report/";


				/*
					Get the page if it has not been rendered.
				*/
				if(page === null){

					Ulo.Pip.getPage(url, page_id);
				
				}

				/*
					Else reset the form before displaying it.
				*/
				else{

					var radios = page.getElementsByTagName("input");

					for(var i=0; i<radios.length; ++i){

						radios[i].checked = false;

					}


					var text = page.getElementsByTagName("textarea");

					for(var i=0; i<text.length; ++i){

						text[i].value = "";

					}


					var form = page.getElementsByTagName("form")[0];

					/* Update the url for this particular post */
					form.setAttribute("action", url);


					var submit = Ulo.get(name + "_report_submit");

					if(submit !== null){

						Ulo.addClass(submit, Ulo.cls.disabled);
					
						submit.disabled = true;

					}

					Ulo.Pip.open(page);

				}
				
			}

		},

		/* ---------------------------------------------------------------------------- */
		/* END REPORTING */
		/* ---------------------------------------------------------------------------- */
	

		/* ---------------------------------------------------------------------------- */
		/* POST ACTIONS
		/* ---------------------------------------------------------------------------- */
		/*
			Navigate to the post update view.
		*/
		editPost: function(e){

			var post_id = this.getAttribute("data-id");

			if(post_id){

				var url = "/post/" + post_id + "/update/";

				if(Ulo.Page !== undefined){

					Ulo.Page.getPage(url, true);

				} else{

					window.location.assign(url);

				}

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Return a post or null.

			@param post_id: Post ID.
		*/
		getPost: function(post_id){

			return Ulo.get(Ulo.getMainID(), "div.post[data-id='" + post_id + "']");

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Display a dialog box that gives the user a button to delete the post.
		*/
		deletePost: function(e){

			var self = e.data.self,

			post_id = this.getAttribute("data-id"),

			post = self.getPost(post_id);


			/*
				Determine if the post belongs to the user.
			*/
			if(post !== null && Ulo.Session.isOwner(post.getAttribute("data-user"))){


				var elem = Ulo.create("div", {"class": "delete_dialog"});


				var content = elem.appendChild(

						Ulo.create("div", {

							"class": "centre", "data-close-pip": "true"

						}) 

					)

					.appendChild( Ulo.create("div", {"class": "content"}) );

				content.appendChild(

					Ulo.create("h3", {}, "Are you sure you want to delete this post?") 

				);

				content.appendChild(

					Ulo.create("button", {

						"type": "button", "data-close-pip": "true"

					}, "Cancel")

				);


				var button = e.currentTarget.cloneNode();

				button.setAttribute("data-close-pip", "true");

				button.appendChild(document.createTextNode("Delete"));


				$(button).on(Ulo.evts.click, {self: self}, self._deletePost);


				content.appendChild(button);


				Ulo.Pip.open(elem, true);

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Delete the post.
		*/
		_deletePost: function(e){

			var self = e.data.self;


			if(Ulo.Pip.login() !== null){

				Ulo.Pip.open();

			}

			else if(Ulo.requestAvailable()){

				var post_id = this.getAttribute("data-id"),

				csrf_token = Ulo.Session.getToken();


				Ulo.request({

						type: "POST",
						data: csrf_token.name + "=" + csrf_token.value,
						url: "/post/" + post_id + "/delete/"

					})

					/* Params: server data, status code, xhr */
					.done(function(data, sc, xhr){

						/* If the login form is returned display it. */

						if(data.html){

							Ulo.Pip.displayPage(xhr, "login");

						} else{

							var page = e.currentTarget.getAttribute("data-page");

							/*
								Redirect to the homepage if the post was deleted from the
								post detail page.
							*/
							if(page === "detail"){

								Ulo.replacePage("/");

							}

							/*
								Delete the post from the timeline
							*/
							else if(page === "timeline"){

								/* Delete the post from the timeline and the Pip */

								Ulo.remove(self.getPost(post_id), Ulo.get("post_detail"));

								Ulo.messages("Your post has been deleted.");

							}

							else{

								/* Error */

							}

						}

				});

			}

		},
		
		/* ---------------------------------------------------------------------------- */
		/* END POST ACTIONS
		/* ---------------------------------------------------------------------------- */




		/* ---------------------------------------------------------------------------- */
		/* COMMENT ACTIONS */
		/* ---------------------------------------------------------------------------- */
		/*
			Delete a comment.
		*/
		deleteComment: function(e){

			e.preventDefault();

			
			var self = e.data.self,

			comment_id = this.getAttribute("data-id");

			/*
				Determine if the logged in user owns this comment. IDs are only given to 
				comments that belongs to the logged in user. See renderComments().
			*/
			var comment = Ulo.get("comment_" + comment_id);


			if(Ulo.Pip.login() !== null){

				Ulo.Pip.open();

			}

			else if(Ulo.requestAvailable() && comment !== null){

				var csrf_token = Ulo.Session.getToken();

				Ulo.request({

						type:"POST",
						data: csrf_token.name + "=" + csrf_token.value,
						url: "/comment/" + comment_id + "/delete/"

					})

					/* Params: server data, status code, xhr */
					.done(function(data, sc, xhr){

						/* If the login form is returned display it. */

						if(data.html){

							Ulo.Pip.displayPage(xhr, "login");

						}

						/* Else remove the comment */

						else{

							Ulo.remove(comment);

							Ulo.messages("Comment deleted");

						}

					})

					/* Params: xhr, status code, error type */
					.fail(function(xhr, sc, type){

						if(Ulo.Session.hasChanged(xhr)){

							Ulo.addClass(e.currentTarget, Ulo.cls.disabled).disabled = true;

						}
					
				});

			}

		},

		/* ---------------------------------------------------------------------------- */
		/* END COMMENT ACTIONS */
		/* ---------------------------------------------------------------------------- */




		/* ---------------------------------------------------------------------------- */
		/* COMMENT */
		/* ---------------------------------------------------------------------------- */
		/*
			Register the comments form.
		*/
		registerComment: function(){

			$(Ulo.get("comment_form")).on("submit", {self: this}, this.comment);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Register the button that fetches the next set of comments.
		*/
		registerLoadComments: function(){

			$(Ulo.get("load_comments")).on(Ulo.evts.click, {self: this}, this.loadComments);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Unregister the button that fetches the next set of comments.
		*/
		unregisterLoadComments: function(){

			var button = Ulo.get("load_comments");

			$(button).off(Ulo.evts.click, this.loadComments);

			Ulo.remove(button);

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Create the html for the comments and add them to the container.

			@param comments: Array of comments:
			@param append: Boolean - if true append each comment to the container else prepend.
		*/
		renderComments: function(comments, append){

			var container = Ulo.get("comments_container"),

			comment, element, attrs;


			for(var i in comments){

				comment = Ulo.create("div", {"class": "comment_container"});


				/* Comment actions link */

				element = comment.appendChild(

					Ulo.create("div", {"class": "user_actions"})

				);

				attrs = {

					"class": "toggle_actions_menu",
					"href": "/comment/" + comments[i].id + "/actions/",
					"title": "Comment actions",
					"data-toggle": "comment_menu",
					"data-id": comments[i].id

				}

				/*
					Give the comment an id if it belongs to the logged in user and give
					the link the attribute "data-is-owner".
				*/
				if(Ulo.Session.isOwner(comments[i].user_id)){

					comment.setAttribute("id", "comment_" + comments[i].id);

					attrs["data-is-owner"] = "true";

				}

				element = element.appendChild(Ulo.create("a", attrs));

				element.appendChild(Ulo.create("span", {"class": "icon icon_menu"}));

				element.appendChild(Ulo.create("span", {"class": "hide"}, "Comment actions"));

				this.registerMoveActionsMenu(comment);

				/* END Comment actions link */


				/* Profile of the user that made the comment */

				element = comment.appendChild(

						Ulo.create("div", {"class": "user_profile"})

					)

					.appendChild(

						Ulo.create("a", {

							"href": Ulo.getUserURL(comments[i].username),
							"class": "profile",
							"data-apl": "true",
							"title": comments[i].name

						})

					);

				Ulo.register(comment);

				element.appendChild( Ulo.create("img", {

					"class": "user_thumbnail", 
					"src": Ulo.getMediaURL(comments[i].thumbnail)

				}));

				element = element.appendChild( 

					Ulo.create("div", {"class": "user_names"})

				);

				element.appendChild(

					Ulo.create("h3", {"class": "name thin ellipsis"}, comments[i].name) 

				);

				element.appendChild( 

					Ulo.create("span", {"class": "username ellipsis"}, "@" + comments[i].username) 

				);

				/* END Profile of the user that made the comment */


				/* Comment text */

				comment.appendChild(

					Ulo.create("div", {"class": "comment_text"}, comments[i].comment)

				);

				/* END comment text */


				if(append){

					container.appendChild(comment);

				} else{

					container.insertBefore(comment, container.firstChild);

				}

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Update max_id to the id of the last comment rendered. Each request uses this
			values as the database cursor.

			@param comments: Array of comments.
		*/
		setMaxID: function(comments){

			if(comments !== undefined && comments.length > 0){

				this.max_id = comments[comments.length-1].id;
					
			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Get the next set of comments and render them.
		*/
		loadComments: function(e){

			e.preventDefault();
			
			var self = e.data.self;

			if(Ulo.requestAvailable()){

				Ulo.request({

						type: "GET",
						data: {"max_id": self.max_id},
						url: this.getAttribute("data-action")

					})

					/* Params: server data, status code, xhr */
					.done(function(data){

						self.setMaxID(data.comments);

						self.renderComments(data.comments, true);

						/* Either there are more comments to get or unregister the button */
						data.has_next || self.unregisterLoadComments();

				});

			}

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Remove all validation errors within the context.

			@param context: Optional context to narrow the scope.
		*/
		removeText: function(context){

			$("p.validation", context).remove();

		},

		/* ---------------------------------------------------------------------------- */
		/*
			Submit a comment for this post.
		*/
		comment: function(e){

			e.preventDefault();

			var self = e.data.self, 

			form = this;


			if(Ulo.Pip.login() !== null){

				Ulo.Pip.open();

			}

			else if(Ulo.requestAvailable() && form.disabled !== true){

				/* Comment input field */

				var comment = Ulo.get("comment");


				if(/^\s*$/.test(comment.value) === false){

					Ulo.request({

							type: "POST",
							data: $(form).serialize(),
							url: form.getAttribute("action")

						})

						/* Params: server data, status code, xhr */
						.done(function(data, sc, xhr){


							/* If the login form is returned display it. */

							if(data.html){

								Ulo.Pip.displayPage(xhr, "login");

							}

							/* Else render the comment. */

							else{

								comment.value = "";

								self.removeText(form);

								self.renderComments(data.comments, false);

								if(self.max_id === undefined){

									self.setMaxID(data.comments);

								}

							}

						})

						/* Params: xhr, status code, error type */
						.fail(function(xhr, sc, type){

							self.removeText(form);

							if(xhr.responseJSON !== undefined && 
								xhr.responseJSON.errors !== undefined){

								var errors = xhr.responseJSON.errors;

								for(var n in errors){

									for(var i=0; i<errors[n].length; ++i){

										form.insertBefore( 

											Ulo.create(

												"p", 
												{"class": "validation error"}, 
												errors[n][i]

											),

											form.firstChild

										);

									}

								}

							} else if(Ulo.Session.hasChanged(xhr)){

								Ulo.addClass(form, Ulo.cls.disabled).disabled = true;

							}
							
					});

				}

			}

		},

		/* ---------------------------------------------------------------------------- */
		/* END COMMENT */
		/* ---------------------------------------------------------------------------- */

	}

	/* -------------------------------------------------------------------------------- */




	/* -------------------------------------------------------------------------------- */
	/* DOCUMENT READY FUNCTION */
	/* -------------------------------------------------------------------------------- */

	$(function(){

		Ulo.newClass(PostVideo, "PostVideo", true);

		Ulo.newClass(PostDetail, "PostDetail", true);
		
	});

	/* -------------------------------------------------------------------------------- */

}());



