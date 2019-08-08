(function (speak) {
    speak.pageCode([
        "/-/speak/v1/formsbuilder/assets/formservices.js"
    ],
    function(formServices) {
        return {
            initialized: function () { 

                this.on({
                    "creategoal:Submit": this.createGoal,
                    "creategoal:Cancel": this.cancel
                }, this);

                this.CreateGoalDialogWindow.on({
                    "hide": this.hide,
                    "show": this.show
                },
                this);

                var $textboxes = $(this.CreateGoalForm.el).find('input');
                $textboxes.on("input", this.enableOKButton.bind(this, $textboxes));
            },

            enableOKButton: function ($textboxes) {
                this.CreateGoalOKButton.IsEnabled = $textboxes[1].value !== "" && !isNaN($textboxes[1].value) && $textboxes[0].value !== "";
            },

            show: function () {
                this.resetForm();
                setTimeout(function () {
                    if (document.activeElement.classList.contains("sc-frame") || document.activeElement.classList.contains("modal")) {
                        $(this.CreateGoalForm.GoalLabel.el)[0].focus();
                    }
                }.bind(this), 1000);
            },

            createGoal: function () {
                formServices.createGoal(this.goalOptions, this.CreateGoalForm.getFormData())
                    .then(this.createGoalCompleted.bind(this))
                    .fail(this.createGoalError.bind(this));
            },

            createGoalError: function () {
                this.MessageBar.IsVisible = true;
                this.MessageBar.reset(this.MessageBar.DynamicData);
            },

            createGoalCompleted: function (data) {
                if (data.result && data.result.items && data.result.items.length) {
                    this.newItemId = data.result.items[0].ID;
                    this.hide();
                } else {
                    this.createGoalError();
                }
            },

            resetForm: function() {
                this.CreateGoalForm.setFormData({
                    Description: "",
                    EngagementValue: "100",
                    GoalLabel: ""
                });

                this.CreateGoalOKButton.IsEnabled = false;
                this.MessageBar.IsVisible = false;
            },

            hide: function () {
                this.CreateGoalDialogWindow.off("hide");
                this.parent.EditActionSubAppRenderer.EditActionDialogWindow.show();
                this.CreateGoalDialogWindow.on("hide", this.hide, this);
            },

            cancel: function () {
                this.hide();
            }
        };
    }, "CreateGoalSubAppRenderer");
})(Sitecore.Speak);