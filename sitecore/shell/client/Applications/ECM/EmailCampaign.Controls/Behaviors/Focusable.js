define(['sitecore', 'jquery'], function (sitecore, $) {
    return sitecore.Factories.createBehavior('Focusable', {
        afterRender: function () {
            this.$el.addClass('sc-hoverable sc-focusable');
            this.$el.attr('tabindex', 0);
            this.attachHandlers();
        },

        attachHandlers: function () {
            this.$el.on('focus', _.bind(this.onFocus, this));
            this.$el.on('blur', _.bind(this.onBlur, this));
            this.$el.on('click', _.bind(this.onClick, this));
        },

        onFocus: function() {
            this.model.set('hasFocus', true);
        },

        onBlur: function() {
            this.model.set('hasFocus', false);
        },

        onClick: function() {
            this.$el.trigger('focus');
        }
    });
});