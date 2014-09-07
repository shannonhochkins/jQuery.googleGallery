/*
 * debouncedresize: special jQuery event that happens once after a window resize
 *
 * latest version and complete README available on Github:
 * https://github.com/louisremi/jquery-smartresize/blob/master/jquery.debouncedresize.js
 *
 * Copyright 2011 @louis_remi
 * Licensed under the MIT license.
 */
var $event = $.event,
	$special,
	resizeTimeout;

$special = $event.special.debouncedresize = {
	setup: function() {
		$(this).on("resize", $special.handler);
	},
	teardown: function() {
		$(this).off("resize", $special.handler);
	},
	handler: function(event, execAsap) {
		// Save the context
		var context = this,
			args = arguments,
			dispatch = function() {
				// set correct event type
				event.type = "debouncedresize";
				$event.dispatch.apply(context, args);
			};

		if (resizeTimeout) {
			clearTimeout(resizeTimeout);
		}

		execAsap ?
			dispatch() :
			resizeTimeout = setTimeout(dispatch, $special.threshold);
	},
	threshold: 250
};

// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;
(function($, window, document, undefined) {

	// undefined is used here as the undefined global variable in ECMAScript 3 is
	// mutable (ie. it can be changed by someone else). undefined isn't really being
	// passed in so we can ensure the value of it is truly undefined. In ES5, undefined
	// can no longer be modified.

	// window and document are passed through as local variable rather than global
	// as this (slightly) quickens the resolution process and can be more efficiently
	// minified (especially when both are regularly referenced in your plugin).

	// Create the defaults once
	var pluginName = "googleGallery";
	var defaults = {
		minHeight: 500,
		speed: 350,
		easing: 'ease',
		automaticallyGetHTML: true,
		childrenSelector: 'div'
	};

	// The actual plugin constructor
	function Plugin(element, options) {

		// jQuery has an extend method which merges the contents of two or
		// more objects, storing the result in the first object. The first object
		// is generally empty as we don't want to alter the default options for
		// future instances of the plugin

		this.settings = $.extend({}, defaults, options);
		if ($(element).length) {
			this.settings.element = $(element);
			this.init();
		}
	}

	// Avoid Plugin.prototype conflicts
	$.extend(Plugin.prototype, {
		init: function() {
			var self = this;
			// list of items
			self.$grid = this.settings.element;
			// the items
			self.$items = self.$grid.children(this.settings.childrenSelector);
			// current expanded item's index
			self.current = -1;
			// position (top) of the expanded item
			// used to know if the preview will expand in a different row
			self.previewPos = -1;
			// extra amount of pixels to scroll the window
			self.scrollExtra = 0;
			// extra margin when expanded (between preview overlay and the next items)
			self.marginExpanded = 10;
			self.$window = $(window);
			self.winsize;
			self.$body = $('html, body');
			// transitionend events
			self.transEndEventNames = {
				'WebkitTransition': 'webkitTransitionEnd',
				'MozTransition': 'transitionend',
				'OTransition': 'oTransitionEnd',
				'msTransition': 'MSTransitionEnd',
				'transition': 'transitionend'
			};
			self.transEndEventName = self.transEndEventNames[Modernizr.prefixed('transition')];
			// support for csstransitions
			self.support = Modernizr.csstransitions;
			self.preload();
		},
		preload: function() {
			var self = this;
			self.$grid.imagesLoaded(function() {

				// save item´s size and offset
				self.saveItemInfo(true);
				// get window´s size
				self.getWinSize();
				// initialize some events
				self.initEvents();

			});
		},
		saveItemInfo: function(saveheight) {
			var self = this;
			self.$items.each(function() {
				var $item = $(this);
				$item.data('offsetTop', $item.offset().top);
				if (saveheight) {
					$item.data('height', $item.height());
				}
			});
		},
		getWinSize: function() {
			var self = this;
			self.winsize = {
				width: self.$window.width(),
				height: self.$window.height()
			};
		},
		initEvents: function() {
			var self = this;
			// when clicking an item, show the preview with the item´s info and large image.
			// close the item if already expanded.
			// also close if clicking on the item´s cross
			self.initItemsEvents(self.$items);

			// on window resize get the window´s size again
			// reset some values..
			self.$window.on('debouncedresize', function() {

				self.scrollExtra = 0;
				self.previewPos = -1;
				// save item´s offset
				self.saveItemInfo();
				self.getWinSize();
				var preview = $.data(this, 'preview');
				if (typeof preview != 'undefined') {
					self.hidePreview();
				}

			});

		},
		initItemsEvents: function($items) {
			var self = this;
			$items.on('click', 'span.og-close', function() {
				self.hidePreview();
				return false;
			}).children('a').on('click', function(e) {

				var $item = $(this).parent();
				// check if item already opened
				self.current === $item.index() ? self.hidePreview() : self.showPreview($item);
				return false;

			});
		},
		showPreview: function($item) {
			var self = this;
			var preview = $.data(this, 'preview'),
				// item´s offset top
				position = $item.data('offsetTop');

			self.scrollExtra = 0;

			// if a preview exists and previewPos is different (different row) from item´s top then close it
			if (typeof preview != 'undefined') {

				// not in the same row
				if (self.previewPos !== position) {
					// if position > previewPos then we need to take te current preview´s height in consideration when scrolling the window
					if (position > self.previewPos) {
						self.scrollExtra = preview.height;
					}
					self.hidePreview();
				}
				// same row
				else {
					preview.update($item);
					return false;
				}

			}

			// update previewPos
			self.previewPos = position;
			// initialize new preview for the clicked item
			preview = $.data(this, 'preview', new Preview(self, $item));
			// expand preview overlay
			preview.open();

			console.log(preview);

		},

		hidePreview: function() {
			var self = this;
			self.current = -1;
			var preview = $.data(this, 'preview');
			preview.close();
			$.removeData(this, 'preview');
		}


	});

	function Preview(self, $item) {
		this.self = self;
		this.$item = $item;
		this.expandedIdx = this.$item.index();
		this.create();
		this.update();
	}

	Preview.prototype = {
		create: function() {
			// create Preview structure:
			this.$closePreview = $('<span class="og-close"></span>');
			this.$previewInner = $('<div class="og-expander-inner"></div>').append();
			this.$previewEl = $('<div class="og-expander"></div>').append(this.$previewInner, this.$closePreview);
			// append preview element to the item
			this.$item.append(this.getEl());
			// set the transitions for the preview and the item
			if (this.self.support) {
				this.setTransition();
			}
		},
		update: function($item) {

			if ($item) {
				this.$item = $item;
			}

			// if already expanded remove class "og-expanded" from current item and add it to new item
			if (this.self.current !== -1) {
				var $currentItem = this.self.$items.eq(this.self.current);
				$currentItem.removeClass('og-expanded');
				this.$item.addClass('og-expanded');
				// position the preview correctly
				this.positionPreview();
			}

			// update current value
			this.self.current = this.$item.index();

			// update preview´s content
			var $itemEl = this.$item.children('a');

			if (this.self.settings.automaticallyGetHTML === true) {
				var clone = $($itemEl.data('get-content-from'));
				if (clone.length) {
					clone = clone.clone();
					this.$previewInner.empty().append(clone);
				}

			}
			if (typeof(this.self.settings.onItemClick) == 'function') {
				this.self.settings.onItemClick.apply(this, [$itemEl]);
			}



		},
		open: function() {
			setTimeout($.proxy(function() {
				// set the height for the preview and the item
				this.setHeights();
				// scroll to position the preview in the right place
				this.positionPreview();
			}, this), 25);
		},
		close: function() {

			var self = this,
				onEndFn = function() {
					if (self.self.support) {
						$(this).off(self.self.transEndEventName);
					}
					self.$item.removeClass('og-expanded');
					self.$previewEl.remove();
				};

			setTimeout($.proxy(function() {

				if (typeof this.$largeImg !== 'undefined') {
					this.$largeImg.fadeOut('fast');
				}
				this.$previewEl.css('height', 0);
				// the current expanded item (might be different from this.$item)
				var $expandedItem = self.self.$items.eq(this.expandedIdx);
				$expandedItem.css('height', $expandedItem.data('height')).on(self.self.transEndEventName, onEndFn);

				if (!self.self.support) {
					onEndFn.call();
				}

			}, this), 25);

			return false;

		},
		calcHeight: function() {

			var heightPreview = this.self.winsize.height - this.$item.data('height') - this.self.marginExpanded,
				itemHeight = this.self.winsize.height;

			if (heightPreview < this.self.settings.minHeight) {
				heightPreview = this.self.settings.minHeight;
				itemHeight = settings.minHeight + this.$item.data('height') + this.self.marginExpanded;
			}

			this.height = heightPreview;
			this.itemHeight = itemHeight;

		},
		setHeights: function() {

			var self = this,
				onEndFn = function() {
					if (self.self.support) {
						self.$item.off(self.self.transEndEventName);
					}
					self.$item.addClass('og-expanded');
				};

			this.calcHeight();
			this.$previewEl.css('height', this.height);
			this.$item.css('height', this.itemHeight).on(self.self.transEndEventName, onEndFn);

			if (!self.self.support) {
				onEndFn.call();
			}

		},
		positionPreview: function() {

			// scroll page
			// case 1 : preview height + item height fits in window´s height
			// case 2 : preview height + item height does not fit in window´s height and preview height is smaller than window´s height
			// case 3 : preview height + item height does not fit in window´s height and preview height is bigger than window´s height
			var position = this.$item.data('offsetTop'),
				previewOffsetT = this.$previewEl.offset().top - this.self.scrollExtra,
				scrollVal = this.height + this.$item.data('height') + this.self.marginExpanded <= this.self.winsize.height ? position : this.height < this.self.winsize.height ? previewOffsetT - (this.self.winsize.height - this.height) : previewOffsetT;

			this.self.$body.animate({
				scrollTop: scrollVal
			}, this.self.settings.speed);

		},
		setTransition: function() {
			this.$previewEl.css('transition', 'height ' + this.self.settings.speed + 'ms ' + this.self.settings.easing);
			this.$item.css('transition', 'height ' + this.self.settings.speed + 'ms ' + this.self.settings.easing);
		},
		getEl: function() {
			return this.$previewEl;
		}
	}



	// A really lightweight plugin wrapper around the constructor,
	$.fn[pluginName] = function(options) {
		this.each(function() {
			$.data(this, "plugin_" + pluginName, new Plugin(this, options));
		});
		return this;
	};

})(jQuery, window, document);