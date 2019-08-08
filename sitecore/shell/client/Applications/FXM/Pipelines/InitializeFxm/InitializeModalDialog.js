define([], function () {
    return {
        execute: function () {
            // Experience Editorinitializes jQueryModalDialog lazily on the first document click. FXM could hook document clicks in order to suggest to insert placeholder.
            // In such cases dialog is not initialized at the moment the Add Placeholder dialog should appear and nothing is displayed.
            // This code initializes JQueryModelDialog as soon as FXM is loaded, so later pop-up dialogs are displayed correctly.
            if (typeof window.top.initModalDialog !== "undefined") {
                window.top.initModalDialog();
            }
        }
    }
});