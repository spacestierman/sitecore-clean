/**
Andrea Bellagamba - Sitecore
added new public properties:
		tileWidth:200,
		tileHeight:150,	
		showOnlyEntireTiles:true,
        tilePadding:5
added possibility to show any kind of content (not just images)
removed ImagesLoaded function
**/
/**
 * jquery.elastislide.js v1.1.0
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2012, Codrops
 * http://www.codrops.com
 */

;( function( $, window, undefined ) {
	
	'use strict';

	var $event = $.event,
	$special,
	resizeTimeout;

	$special = $event.special.debouncedresize = {
		setup: function() {
			$( this ).on( "resize", $special.handler );
		},
		teardown: function() {
			$( this ).off( "resize", $special.handler );
		},
		handler: function( event, execAsap ) {
			// Save the context
			var context = this,
				args = arguments,
				dispatch = function() {
					// set correct event type
					event.type = "debouncedresize";
					$event.dispatch.apply( context, args );
				};

			if ( resizeTimeout ) {
				clearTimeout( resizeTimeout );
			}

			execAsap ?
				dispatch() :
				resizeTimeout = setTimeout( dispatch, $special.threshold );
		},
		threshold: 150
	};

	// global
	var $window = $( window ),
		Modernizr = window.Modernizr;

	$.Elastislide = function( options, element ) {
		
		this.$el = $( element );
		this._init( options );		
	};

	$.Elastislide.defaults = {
		// orientation 'horizontal' || 'vertical'
		orientation : 'horizontal',
		// sliding speed
		speed : 500,
		// sliding easing
		easing : 'ease-in-out',
		// the minimum number of items to show. 
		// when we resize the window, this will make sure minimumTiles are always shown 
		// (unless of course minimumTiles is higher than the total number of elements)
		minimumTiles : 3,
		// index of the current item (left most item of the carousel)
		start : 0,		
		// tile size
		tileWidth:200,
		tileHeight:150,
        // tiles padding
        tilePadding:0,
		// when resizing the control limit the new size to discrete values, so that only entire tiles are displayed		
		onlyEntireTiles:true,	
		// click item callback
		onClick : function( el, position, evt ) { return false; },
		onReady : function() { return false; },
		onBeforeSlide : function() { return false; },
		onAfterSlide : function() { return false; }		
	};

	$.Elastislide.prototype = {

	    _init : function( options ) {			
	        // options
	        this.options = $.extend( true, {}, $.Elastislide.defaults, options );
	        // https://github.com/twitter/bootstrap/issues/2870
	        var self = this,
				transEndEventNames = {
				    'WebkitTransition' : 'webkitTransitionEnd',
				    'MozTransition' : 'transitionend',
				    'OTransition' : 'oTransitionEnd',
				    'msTransition' : 'MSTransitionEnd',
				    'transition' : 'transitionend'
				};
			
	        this.transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ];			
	        // suport for css transforms and css transitions
	        this.support = Modernizr.csstransitions && Modernizr.csstransforms;
	        // current item's index
	        this.current = this.options.start;
	        // control if it's sliding
	        this.isSliding = false;
	        this.$items = this.$el.children( 'li' );
	        // total number of items
	        this.itemsCount = this.$items.length;
	        if( this.itemsCount === 0 ) {
	            return false;
	        }
	        this._validate();
	        // remove white space
	        this.$items.detach();
	        this.$el.empty();
	        this.$el.append( this.$items );
	        // main wrapper
	        this.$el.wrap( '<div class="elastislide-wrapper elastislide-loading elastislide-' + this.options.orientation + '"></div>' );
	        // check if we applied a transition to the <ul>
	        this.hasTransition = false;			
	        // add transition for the <ul>
	        this.hasTransitionTimeout = setTimeout( function() {				
	            self._addTransition();
	        }, 100 );

	        // preload the images
	        self.$el.show();
	        self._layout();
	        self._configure();				
	        if( self.hasTransition ) {
	            // slide to current's position
	            self._removeTransition();
	            self._slideToItem( self.current );
	            self.$el.on( self.transEndEventName, function() {
	                self.$el.off( self.transEndEventName );
	                self._setWrapperSize();
	                // add transition for the <ul>
	                self._addTransition();
	                self._initEvents();
	            } );
	        }
	        else {
	            clearTimeout( self.hasTransitionTimeout );
	            self._setWrapperSize();
	            self._initEvents();
	            // slide to current's position
	            self._slideToItem( self.current );
	            setTimeout( function() { self._addTransition(); }, 25 );
	        }
	        self.options.onReady();				
	    },
	    _validate : function() {
	        if( this.options.speed < 0 ) {
	            this.options.speed = 500;
	        }
	        if( this.options.minimumTiles < 1 || this.options.minimumTiles > this.itemsCount ) {
	            this.options.minimumTiles = 1;
	        }
	        if( this.options.start < 0 || this.options.start > this.itemsCount - 1 ) {
	            this.options.start = 0;
	        }
	        if( this.options.orientation != 'horizontal' && this.options.orientation != 'vertical' ) {
	            this.options.orientation = 'horizontal';
	        }				
	    },
	    _layout : function() {
	        this.$el.wrap( '<div class="elastislide-carousel"></div>' );
	        this.$carousel = this.$el.parent();
	        this.$wrapper = this.$carousel.parent().removeClass( 'elastislide-loading' );
			
	        // save original image sizes
	        if (this.options.tileWidth!=0 && this.options.tileHeight!=0)
	        {
	            this.tileSize = { width : this.options.tileWidth, height : this.options.tileHeight };
	        }
	        else
	        {
	            var $tile = this.$items.find( 'img:first' );
	            this.tileSize = { width : $tile.outerWidth( true ), height : $tile.outerHeight( true ) };				
	        } 
	        this._setItemsSize();
	        this.options.orientation === 'horizontal' ? this.$el.css( 'max-height', this.tileSize.height ) : this.$el.css( 'height', this.options.minimumTiles * this.tileSize.height );
	        // add the controls
	        this._addControls();
	    },
	    _addTransition : function() {
	        if( this.support ) {
	            this.$el.css( 'transition', 'all ' + this.options.speed + 'ms ' + this.options.easing );				
	        }
	        this.hasTransition = true;
	    },
	    _removeTransition : function() {
	        if( this.support ) {
	            this.$el.css( 'transition', 'all 0s' );
	        }
	        this.hasTransition = false;			
	    },
	    _addControls : function() {
	        var self = this;
	        // add navigation elements
	        this.$navigation = $( '<nav><span class="elastislide-prev">Previous</span><span class="elastislide-next">Next</span></nav>' )
				.appendTo( this.$wrapper );

	        this.$navPrev = this.$navigation.find( 'span.elastislide-prev' ).on( 'mousedown.elastislide', function( event ) {
	            self._slide( 'prev' );
	            return false;
	        } );

	        this.$navNext = this.$navigation.find( 'span.elastislide-next' ).on( 'mousedown.elastislide', function( event ) {
	            self._slide( 'next' );
	            return false;
	        } );
	    },
		
	    _setItemsSize : function() {
	        // width for the items (%)
	        var w = this.options.orientation === 'horizontal' ? (  (this.$carousel.width() / this.options.minimumTiles ) * 100 ) / this.$carousel.width() : 100;
				
	        this.$items.css( {
	            'width' : w + '%',
	            'max-width' : this.tileSize.width,
	            'max-height' : this.tileSize.height
	        } );

	        if( this.options.orientation === 'vertical') {			
	            this.$wrapper.css( 'max-width', this.tileSize.width );	
	        }
						
	        if( this.options.orientation === 'horizontal' && this.options.onlyEntireTiles ) {
	            var wrapperWidth = this.$el.closest(".sc-carousel").width() - parseInt(this.$wrapper.css('padding-left')) - parseInt(this.$wrapper.css('padding-right'));
	            if (!(wrapperWidth < this.options.minimumTiles * this.tileSize.width)) {
	                var w2 = Math.floor(wrapperWidth / this.tileSize.width) * this.tileSize.width;
	                this.$wrapper.css('width', w2 == 0 ? wrapperWidth : w2);
	            } else {
	                this.$wrapper.css('width', wrapperWidth);
	            }
	        }

	        this.$el.find(".elastislide-tile").css('width', this.tileSize.width).css('height', this.tileSize.height);	

	        var tilePaddingHorizontal = this.options.tilePadding;
	        var tilePaddingVertical = this.options.tilePadding;
		    
	        if (this.options.orientation === 'horizontal')
	        {
	            if (this._isHorizontalSquezeed()) {
	                tilePaddingHorizontal = 0;
	            }
	        }
	        else
	        {
	            if (this._isVerticalSquezeed()) {
	                tilePaddingVertical = 0;
	            }
	        }
		    
	        this.$el.find(".elastislide-tile-content").css('top', tilePaddingVertical).css('bottom', tilePaddingVertical).css('left', tilePaddingHorizontal).css('right', tilePaddingHorizontal);
	        var firstConententELement = this.$el.find(".elastislide-tile-content").children(0);
	        if (firstConententELement.is("img"))
	        {
	            firstConententELement.css('width', this.tileSize.width - 2 * (tilePaddingHorizontal)).css('height', this.tileSize.height - 2 * (tilePaddingVertical));
	        }
      
	    },
		
	    _isHorizontalSquezeed: function()
		{
		    return (this.$carousel.width() < this.options.minimumTiles * this.tileSize.width);
	    },

	    _isVerticalSquezeed: function()
	    {
	        return (this.$carousel.height() < this.options.minimumTiles * this.tileSize.height);
	    },
	    
		_setWrapperSize : function() {

			if( this.options.orientation === 'vertical' && !this.options.onlyEntireTiles) {
				this.$wrapper.css( {
					'height' : this.options.minimumTiles * this.tileSize.height + parseInt( this.$wrapper.css( 'padding-top' ) ) + parseInt( this.$wrapper.css( 'padding-bottom' ) )
				} );
			}	

			if( this.options.orientation === 'vertical' &&  this.options.onlyEntireTiles) {
			    var wrapperHeight = this.$el.closest(".sc-carousel").height() - parseInt(this.$wrapper.css('padding-top')) - parseInt(this.$wrapper.css('padding-bottom'));
				var w2 = Math.floor(wrapperHeight / this.tileSize.height) * this.tileSize.height;
				this.$wrapper.css( 'height', w2 );
			}				
		},
		_configure : function() {
			// check how many items fit in the carousel (visible area -> this.$carousel.width() )
			this.fitCount = this.options.orientation === 'horizontal' ? 
								this._isHorizontalSquezeed() ? this.options.minimumTiles : Math.floor(this.$carousel.width() / this.tileSize.width) :
								this._isVerticalSquezeed() ? this.options.minimumTiles : Math.floor(this.$carousel.height() / this.tileSize.height);
		},
		_initEvents : function() {
			var self = this;
			$window.on( 'debouncedresize.elastislide', function() {
				self._setItemsSize();
				self._configure();
				self._slideToItem( self.current );
			} );

			this.$el.on( this.transEndEventName, function() {
				self._onEndTransition();
			} );

			if( this.options.orientation === 'horizontal' ) {
				this.$el.on( {
					swipeleft : function() {
						self._slide( 'next' );					
					},
					swiperight : function() {
						self._slide( 'prev' );					
					}
				} );
			}
			else {
				this.$el.on( {
					swipeup : function() {
						self._slide( 'next' );					
					},
					swipedown : function() {
						self._slide( 'prev' );					
					}
				} );
			}

			// item click event
			this.$el.on( 'click.elastislide', 'li', function( event ) {
				var $item = $( this );
				self.options.onClick( $item, $item.index(), event );				
			});
		},
		_destroy : function( callback ) {			
			this.$el.off( this.transEndEventName ).off( 'swipeleft swiperight swipeup swipedown .elastislide' );
			$window.off( '.elastislide' );			
			this.$el.css( {
				'max-height' : 'none',
				'transition' : 'none'
			} ).unwrap( this.$carousel ).unwrap( this.$wrapper );

			this.$items.css( {
				'width' : 'auto',
				'max-width' : 'none',
				'max-height' : 'none'
			} );
			this.$navigation.remove();
			this.$wrapper.remove();
			if( callback ) {
				callback.call();
			}
		},
		_toggleControls : function( dir, display ) {
			if( display ) {
				( dir === 'next' ) ? this.$navNext.show() : this.$navPrev.show();
			}
			else {
				( dir === 'next' ) ? this.$navNext.hide() : this.$navPrev.hide();
			}			
		},
		_slide : function( dir, tvalue ) {
			if( this.isSliding ) {
				return false;
			}			
			this.options.onBeforeSlide();
			this.isSliding = true;
			var self = this,
				translation = this.translation || 0,
				// width/height of an item ( <li> )
				itemSpace = this.options.orientation === 'horizontal' ? this.$items.outerWidth( true ) : this.$items.outerHeight( true ),
				// total width/height of the <ul>
				totalSpace = this.itemsCount * itemSpace,
				// visible width/height
				visibleSpace = this.options.orientation === 'horizontal' ? this.$carousel.width() : this.$carousel.height();
			
			if( tvalue === undefined ) {				
				var amount = this.fitCount * itemSpace;
				if( amount < 0 ) {
					return false;
				}

				if( dir === 'next' && totalSpace - ( Math.abs( translation ) + amount ) < visibleSpace ) {
					amount = totalSpace - ( Math.abs( translation ) + visibleSpace );
					// show / hide navigation buttons
					this._toggleControls( 'next', false );
					this._toggleControls( 'prev', true );
				}
				else if( dir === 'prev' && Math.abs( translation ) - amount < 0 ) {
					amount = Math.abs( translation );
					// show / hide navigation buttons
					this._toggleControls( 'next', true );
					this._toggleControls( 'prev', false );
				}
				else {					
					// future translation value
					var ftv = dir === 'next' ? Math.abs( translation ) + Math.abs( amount ) : Math.abs( translation ) - Math.abs( amount );
					
					// show / hide navigation buttons
					ftv > 0 ? this._toggleControls( 'prev', true ) : this._toggleControls( 'prev', false );
					ftv < totalSpace - visibleSpace ? this._toggleControls( 'next', true ) : this._toggleControls( 'next', false );
				}				
				tvalue = dir === 'next' ? translation - amount : translation + amount;
			}
			else {
				var amount = Math.abs( tvalue );
				if( Math.max( totalSpace, visibleSpace ) - amount < visibleSpace ) {
					tvalue	= - ( Math.max( totalSpace, visibleSpace ) - visibleSpace );				
				}

				// show / hide navigation buttons
				amount > 0 ? this._toggleControls( 'prev', true ) : this._toggleControls( 'prev', false );
				Math.max( totalSpace, visibleSpace ) - visibleSpace > amount ? this._toggleControls( 'next', true ) : this._toggleControls( 'next', false );
			}
			
			this.translation = tvalue;
			if( translation === tvalue ) {				
				this._onEndTransition();
				return false;
			}

			if( this.support ) {				
				this.options.orientation === 'horizontal' ? this.$el.css( 'transform', 'translateX(' + tvalue + 'px)' ) : this.$el.css( 'transform', 'translateY(' + tvalue + 'px)' );
			}
			else {
				$.fn.applyStyle = this.hasTransition ? $.fn.animate : $.fn.css;
				var styleCSS = this.options.orientation === 'horizontal' ? { left : tvalue } : { top : tvalue };				
				this.$el.stop().applyStyle( styleCSS, $.extend( true, [], { duration : this.options.speed, complete : function() {
					self._onEndTransition();
				} } ) );
			}
			
			if( !this.hasTransition ) {
				this._onEndTransition();
			}
		},
		_onEndTransition : function() {
			this.isSliding = false;
			this.options.onAfterSlide();
		},
		_slideTo : function( pos ) {
			var pos = pos || this.current,
				translation = Math.abs( this.translation ) || 0,
				itemSpace = this.options.orientation === 'horizontal' ? this.$items.outerWidth( true ) : this.$items.outerHeight( true ),
				posR = translation + this.$carousel.width(),
				ftv = Math.abs( pos * itemSpace );
			if( ftv + itemSpace > posR || ftv < translation ) {
				this._slideToItem( pos );			
			}
		},
		_slideToItem : function( pos ) {

			// how much to slide?
			var amount	= this.options.orientation === 'horizontal' ? pos * this.$items.outerWidth( true ) : pos * this.$items.outerHeight( true );
			this._slide( '', -amount );
			
		},
		// public method: adds new items to the carousel
		/*
		
		how to use:
		var carouselEl = $( '#carousel' ),
			carousel = carouselEl.elastislide();
		...
		
		// append or prepend new items:
		carouselEl.prepend('<li><a href="#"><img src="images/large/2.jpg" alt="image02" /></a></li>');

		// call the add method:
		es.add();
		
		*/
		add : function( callback ) {			
			var self = this,
				oldcurrent = this.current,
				$currentItem = this.$items.eq( this.current );
			
			// adds new items to the carousel
			this.$items = this.$el.children( 'li' );
			this.itemsCount = this.$items.length;
			this.current = $currentItem.index();
			this._setItemsSize();
			this._configure();
			this._removeTransition();
			oldcurrent < this.current ? this._slideToItem( this.current ) : this._slide( 'next', this.translation );
			setTimeout( function() { self._addTransition(); }, 25 );			
			if ( callback ) {
				callback.call();
			}			
		},
		// public method: sets a new element as the current. slides to that position
		setCurrent : function( idx, callback ) {			
			this.current = idx;
			this._slideTo();			
			if ( callback ) {
				callback.call();
			}			
		},
		// public method: slides to the next set of items
		next : function() {
			self._slide( 'next' );
		},
		// public method: slides to the previous set of items
		previous : function() {
			self._slide( 'prev' );
		},
		// public method: slides to the first item
		slideStart : function() {
			this._slideTo( 0 );
		},
		// public method: slides to the last item
		slideEnd : function() {
			this._slideTo( this.itemsCount - 1 );
		},
		// public method: destroys the elastislide instance
		destroy : function( callback ) {
			this._destroy( callback );		
		}
	};
	
	var logError = function( message ) {
		if ( window.console ) {
			window.console.error( message );		
		}
	};
	
	$.fn.elastislide = function( options ) {
		var self = $.data( this, 'elastislide' );		
		if ( typeof options === 'string' ) {			
			var args = Array.prototype.slice.call( arguments, 1 );			
			this.each(function() {			
				if ( !self ) {
					logError( "cannot call methods on elastislide prior to initialization; " +
					"attempted to call method '" + options + "'" );
					return;				
				}				
				if ( !$.isFunction( self[options] ) || options.charAt(0) === "_" ) {
					logError( "no such method '" + options + "' for elastislide self" );
					return;				
				}				
				self[ options ].apply( self, args );			
			});		
		} 
		else {		
			this.each(function() {
				
				if ( self ) {
					self._init();				
				}
				else {
					self = $.data( this, 'elastislide', new $.Elastislide( options, this ) );				
				}
			});		
		}		
		return self;		
	};
	
} )( jQuery, window );
