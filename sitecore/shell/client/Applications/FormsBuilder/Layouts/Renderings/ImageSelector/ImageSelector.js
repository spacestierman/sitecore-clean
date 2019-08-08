(function(speak) {
    speak.component(["itemJS", "bclImageHelper"],
        function(itemManager, imageHelper) {

            var getItem = function (guid, callBack, options) {
                if (!guid) {
                    callBack(null);
                    return;
                }

                options = options || {};
                options.language = speak.Context.current().Language;
                options.database = speak.Context.current().contentDatabase;

                itemManager.fetch(guid,
                    options,
                    function(data, result) {
                        if (result.statusCode === 401) {
                            speak.module("bclSession").unauthorized();
                            return;
                        }
                        callBack(data);
                    });
            };

            var getImage = function(mediaId, database, width, height) {
                if (!mediaId || !database) {
                    return undefined;
                }

                var url = "/sitecore/shell/~/media/" +
                    speak.Helpers.id.toShortId(mediaId) +
                    ".ashx?h=" +
                    height +
                    "&w=" +
                    width +
                    "&db=" +
                    database;
                return url;
            };

            return speak.extend({},
            {
                clickHandler: function(e) {
                    var invocation = this.ButtonTextBoxClick;

                    if (!this.IsEnabled) {
                        e.preventDefault();
                        return;
                    }

                    if (invocation) {
                        var i = invocation.indexOf(":");
                        if (i <= 0) {
                            throw "Invocation is malformed (missing 'handler:')";
                        }

                        speak.module("pipelines")
                            .get("Invoke")
                            .execute({
                                control: this,
                                app: this.app,
                                handler: invocation.substr(0, i),
                                target: invocation.substr(i + 1)
                            });
                    }

                    this.trigger("click", this.el);
                },

                updatedImageSource: function() {
                    this.IsDirty = true;
                    this.ImageGuid = imageHelper.getId(this.ImageSource) || "";
                    this.IsDirty = false;
                },

                updatedImageGuid: function() {
                    if (!this.IsDirty) {
                        this.ImageSource = this.ImageGuid ? "<image mediaid=\"" + this.ImageGuid + "\" />" : "";
                    }

                    var imageUrl = getImage(this.ImageGuid,
                        speak.Context.current().contentDatabase,
                        this.ThumbnailImage.Width,
                        this.ThumbnailImage.Height);
                    this.ThumbnailImage.ImageUrl = imageUrl;

                    getItem(this.ImageGuid,
                        function(item) {
                            this.Path = item ? item.$path.replace("/sitecore/media library", "") : "";
                        }.bind(this));
                },

                clearImage: function() {
                    this.ImageGuid = this.defaultImageGuid;
                },

                initialized: function() {
                    this.$el = $(this.el);

                    this.defaultImageGuid = this.ImageGuid;
                    this.ImageGuid = "";

                    this.on({
                            "change:ImageSource": this.updatedImageSource,
                            "change:ImageGuid": this.updatedImageGuid
                        },
                        this);
                }
            });
        },
        "ImageSelector");
})(Sitecore.Speak);