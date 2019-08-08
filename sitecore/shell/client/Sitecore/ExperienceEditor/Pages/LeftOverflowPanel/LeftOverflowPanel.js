define(["/-/speak/v1/ExperienceEditor/ExperienceEditor.js"], function (ExperienceEditor) {

  /**
  * Menu Constructor.
  */
  function Menu(options) {
    $.extend(this.options, options);
    this._init();
  };

  /**
 * Menu Options.
 */
  Menu.prototype.options = {
    type: 'slide-left',             // The menu type
    maskId: '#c-mask',              // The ID of the mask\
    initiatorElement: null          // The initiator element that calls the menu.
  };

  /**
   * Initialise Menu.
   */
  Menu.prototype._init = function () {
    var document = ExperienceEditor.getPageEditingWindow().document;
    this.body = document.body;
    this.mask = document.querySelector(this.options.maskId);
    this.menu = document.querySelector('#c-menu--' + this.options.type);
    this.initiatorElement = this.options.initiatorElement;
    ExperienceEditor.getPageEditingWindow().Menu = this;
  };

  /**
   * Open Menu.
   */
  Menu.prototype.open = function () {
    if (this.initiatorElement) {
      this.initiatorElement.style.pointerEvents = "none";
    }
    this.body.classList.add('has-active-menu');
    this.menu.classList.add('is-active');
    this.mask.classList.add('is-active');
  };

  /**
   * Close Menu.
   */
  Menu.prototype.close = function () {
    if (this.initiatorElement) {
      this.initiatorElement.style.pointerEvents = "none";
    }
    this.body.classList.remove('has-active-menu');
    this.menu.classList.remove('is-active');
    this.mask.classList.remove('is-active');
  };

  Menu.prototype.addOnOpenAnimationFinishedEventHandler = function (handler) {
    var menu = this.menu;
    $(menu).one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend',
      function (e) {
        //when animation is finished, check if is-active
        //if it is not active - closed
        if (menu.classList.contains('is-active')) {
          handler();
        }
      });
  }

  Menu.prototype.addOnCloseAnimationFinishedEventHandler = function (handler) {
    var menu = this.menu;
    $(menu).one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend',
      function(e) {
        //when animation is finished, check if is-active
        //if it is not active - closed
        if (!menu.classList.contains('is-active')) {
          handler();
        }
      });
  }

  return Menu;

});