(function (speak) {
    var parentApp = window.parent.Sitecore.Speak.app.findApplication('EditActionSubAppRenderer');
    var createGoalSubApp = window.parent.Sitecore.Speak.app.findApplication('CreateGoalSubAppRenderer');
    var goalTemplateId = "{475E9026-333F-432D-A4DC-52E03B75CB6B}",
        goalWorkflowState = "{EDCBB550-BED3-490F-82B8-7B2F14CCD26E}";

    speak.pageCode([], function () {
        return {
            initialized: function () {
                this.on({
                    "loaded": this.loadDone,
                    "triggergoal:CreateNewGoal": this.openCreateGoalDialog
                }, this);

                this.ItemTreeView.on("change:SelectedItem", this.changedSelectedItemId, this);

                if (parentApp) {
                    parentApp.loadDone(this, this.HeaderTitle.Text, this.HeaderSubtitle.Text);
                }
            },

            changedSelectedItemId: function () {
                var isSelectable = this.ItemTreeView.SelectedItem.$templateId === goalTemplateId;
                parentApp.setSelectability(this, isSelectable, this.ItemTreeView.SelectedItemId);
            },

            loadDone: function (parameters) {
                this.Parameters = parameters || {};
                this.ItemTreeView.SelectedItemId = createGoalSubApp.newItemId || this.Parameters.referenceId;
                createGoalSubApp.newItemId = "";
                this.CreateGoalButton.IsEnabled = true;
            },

            getData: function () {
                this.Parameters.referenceId = this.ItemTreeView.SelectedItemId;
                return this.Parameters;
            },

            openCreateGoalDialog: function () {
                var parentId = this.ItemTreeView.SelectedItemId;

                if (!parentId) {
                    parentId = this.ItemTreeView.RootItemId;
                } else if (this.ItemTreeView.SelectedItem.$templateId === goalTemplateId) {
                    parentId = this.ItemTreeView.getActiveNode().parent.data.key;
                }

                createGoalSubApp.goalOptions = {
                    ParentId: parentId,
                    TemplateId: goalTemplateId,
                    Database: this.ItemTreeView.Database,
                    Fields: { "__Workflow state": goalWorkflowState }
                }

                setTimeout(function () {
                    createGoalSubApp.CreateGoalDialogWindow.show();
                }.bind(this), 0);
            }
        };
    });
})(Sitecore.Speak);