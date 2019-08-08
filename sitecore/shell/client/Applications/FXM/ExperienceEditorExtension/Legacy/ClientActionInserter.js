define([
        "sitecore",
        "/-/speak/v1/FXM/ExperienceEditorExtension/Legacy/LegacySitecore.js",
        "/-/speak/v1/FXM/ExperienceEditorExtension/Legacy/LegacyjQuery.js",
        "/-/speak/v1/FXM/ExperienceEditorExtension/Legacy/Fxm.js",
        "/-/speak/v1/ExperienceEditor/TranslationUtil.js",
        "/-/speak/v1/ExperienceEditor/ExperienceEditor.js",
        "/-/speak/v1/FXM/ExperienceEditorExtension/Commands/CreateClientAction.js" // used through legacy selector 
    ],
    function(_sc, _scl, $sc, _fxm, TranslationUtil, ExperienceEditor) {

        var translator = null;

        _scl.PageModes.ChromeTypes.ClientActionInserter = _scl.PageModes.ChromeTypes.PlaceholderInsertion.extend({
            constructor: function(placeholder) {
                this.base(placeholder);

                this.command = {
                    tooltip: TranslationUtil
                        .translateTextByServer("Add a click action to this component", ExperienceEditor),
                    header: TranslationUtil.translateTextByServer("Add a new action", ExperienceEditor)
                };
            },

            activate: function() {
                this.addTarget('top', this.placeholder, null);

                // Fix markup
                $sc(".scInsertionHandleCenter").css('height', 'auto');
            },

            addControl: function() {
                var path = _fxm.getChromePath(this.placeholder.element);
                var self = this;

                var callback = function(data) {
                    //Review: handle null/canceled window
                    if (data) {
                        _fxm.updateNodeToClientAction($sc(self.placeholder.element), data);
                    }
                };
                var context = { callback: callback, selector: path };
                _sc.Commands.executeCommand('Sitecore.Speak.Commands.CreateClientAction', context);
            }
        });

        return {
            initialize: function(translations) {
                translator = translations;
            }
        };
    });