(function() {
    // The trick to test in node and in browser.
    var dependencies = (typeof window !== "undefined")
        ? [
            "/-/speak/v1/listmanager/commonPagesDefinition.js",
            "/-/speak/v1/listmanager/urlParser.js",
            "/-/speak/v1/listmanager/storageMediator.js",
            "/-/speak/v1/listmanager/dialogs.js"
        ]
        : ["../commonPagesDefinition", "../urlParser", "../storageMediator", null];

    define(dependencies,
        function(commonPagesDefinition, urlParser, storageMediator, dialogs) {
            var self,
                global = {},
                fakeLocation = {
                    replace: function(path) {
                    }
                },
                fakeDocument = {
                    title: ""
                },

                addNewContactActionIds = ["965403EDD7524808913E0B69D55C8EA0"],
                setEntireDatabaseActionIds = ["EDE8F210CC444DC48AFDBC6CE5D5BAFC"],
                removeSourceIds = ["2870D2EA7E0040DA904FAB12ED7B03B6", "CDA1E30B5AE54D128B6B7021E9DDFB93"],
                removeAllContactsActionIds = ["715CC24E7AA846A2B5878C5D2AD9B400"],
                removeContactActionIds = ["12119562B43845DA9B79A65EF90909AD"],
                viewContactCardActionIds = ["A29930F63F5E4A5197F69A69882AE651", "8620AD7021BB43BC95F5BE7CAF182F64"],
                replaceAllListsWithEntireDatabaseSource =
                    "This option will replace all lists that are currently selected as sources. Do you want to continue?",
                convertListNotification = "The list has been converted to a Contact list.",
                deleteAllContactsConfirmation =
                    "All the contacts will be removed from this list. The contacts will still be available in your Contacts database. Do you want to continue?",
                deleteContactConfirmation =
                    "This contact will be removed from this list. The contact will still be available in your Contact database. Do you want to continue?",
                deleteAllContactsNotification = "All the contacts associated with this list have been removed.",
                deleteContactNotification = "The contact will be removed from the list once the indexing has finished.",
                contactsWereNotRemoved = "The contacts were not removed.",
                contactWasNotRemoved = "The contact was not removed.",
                lockedContactsCannotBeChanged =
                    "Changes cannot be made to this contact as it is locked or currently active. Please try again later.",
                deleteListConfirmationHeader = "Delete list.",
                deleteListConfirmationMessage =
                    "The list will be deleted and all the associations to the list will be removed. This cannot be undone. Do you want to continue?",
                duplicatesRemovedNotification = "duplicate contacts have been removed from this list.",
                duplicateContactsWereNotRemoved =
                    "The duplicate contacts were not removed because an error occurred. Please contact your System Administrator.",
                saveListNotification = "The list has been saved.",
                listWasNotRemoved = "The list was not removed.",
                listIdKey = "listId",
                filterKey = "filter",
                keyUpKeyCode = 13,
                fromExisting = "fromexisting";

            if (typeof window !== "undefined") {
                global = window;
            } else {
                global.location = fakeLocation;
                global.document = fakeDocument;
            }

            var extensionObject = {
                listType: "ContactList",
                location: {},
                initialized: function() {
                    self = this;
                    this.dialogs = dialogs;
                    this.location = global.location;
                    this.document = global.document;
                    this.UrlParser = urlParser;
                    this.StorageMediator = storageMediator;
                    this.initializeDataSources();
                    this.initializeActions();
                    this.initializeSpecificControls();
                    this.SaveButton.on("click", this.saveButtonClick, this);
                    this.ContactsSearchButtonTextBox.viewModel.$el.keyup(this.contactSearchTextBoxKeyUp);
                    this.ListOwnerDataSource.on("change:hasResponse", this.initializeList, this);
                    this.ListEntityDataSource.on("change:entity", this.updateUiForList, this);
                    this.initializeChangeTracking();
                    this.performUrlAction();
                    this.initializeAdditionalFields();
                    this.dialogs.init(this.DialogsLoadOnDemandPanel);
                },
                saveButtonClick: function() {
                    this.save();
                },
                save: function() {
                    this.saveList();
                },
                initializeDataSources: function() {
                    this.refreshDeferredDataSource(this.ListEntityDataSource);
                    this.ListOwnerDataSource.refresh();
                },
                refreshDeferredDataSource: function(dataSource) {
                    dataSource.IsDeferred = true;
                    dataSource.refresh();
                    dataSource.IsDeferred = false;
                },
                initializeSpecificControls: function() {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    current.baseStructures = [
                        {
                            control: current.ContactsList,
                            dataSource: current.ContactsDataSource,
                            accordion: current.ContactsAccordion
                        }
                    ];
                    current.ContactsDataSource.on("itemsChanged",
                        function(items) {
                            current.updateEmbededList(items, current.baseStructures[0]);
                        },
                        current);
                    current.ContactsList.on("change:selectedItemId", current.updateContactActionsStatus);
                    current.ExcludedSourcesListControl.on("change:selectedItem",
                        function() { current.selectSourceItem(current.ExcludedSourcesListControl); },
                        current);
                    current.IncludedSourcesListControl.on("change:selectedItem",
                        function() { current.selectSourceItem(current.IncludedSourcesListControl); },
                        current);
                },
                initializeActions: function() {
                    $.each(this.ListSourceActionControl.get("actions"),
                        function() {
                            if (removeSourceIds.indexOf(this.id()) > -1) {
                                this.disable();
                            }
                        });
                    this.on("view:contact", this.onViewContact, this);
                    this.on("remove:contacts", this.onRemoveAllContacts, this);
                    this.on("remove:contact", this.onRemoveContact, this);
                    this.on("taskpage:add:source", this.addInclusion, this);
                    this.on("taskpage:remove:source", this.removeSource, this);
                    this.on("taskpage:add:exclusion", this.addExclusion, this);
                    this.on("taskpage:remove:duplicates", this.onRemoveDuplicates, this);
                    this.on("taskpage:set:entireDatabase", this.setEntireDatabase, this);
                    this.on("taskpage:export:csv", this.onExportToCsv, this);
                    this.initializeListActions();
                },
                performUrlAction: function() {
                    var actionFromUrl = this.UrlParser.getParameterFromLocationSearchByName("action");
                    if (actionFromUrl === "convert") {
                        this.showNotification(convertListNotification, this.ContactListMessageBar);
                        urlParser.removeQueryParameter("action");
                    } else if (actionFromUrl === fromExisting) {
                        var items = this.StorageMediator.getFromStorage("items");
                        if (items !== null) {
                            this.IncludedSourcesListControl.set("items", items);
                        }
                        this.StorageMediator.removeFromStorage("items");
                    }
                },
                initializeListActions: function() {
                    this.on("taskpage:add:contact", this.onAddContact, this);
                    this.on("taskpage:delete:list", this.onDeleteList, this);
                    this.initializeSpecificListActions();
                    var entityId = this.UrlParser.getParameterFromLocationSearchByName("id");
                    if (entityId === "") {
                        this.ListActions.set("isVisible", false);
                    }
                },
                initializeSpecificListActions: function() {
                },
                setActionEnabledStatus: function(list, actionIds, value) {
                    Array.prototype.forEach.call(list.get("actions"),
                        function(el) {
                            if (actionIds.indexOf(el.id()) >= 0) {
                                if (value) {
                                    el.enable();
                                } else {
                                    el.disable();
                                }
                            }
                        });
                },
                initializeList: function() {
                    this.updateOwner();
                    var entityId = this.UrlParser.getParameterFromLocationSearchByName("id");
                    if (entityId === "") {
                        this.updateContactActionsStatus();
                        this.GeneralInformationNameValue.viewModel.focus();
                    } else {
                        this.ListEntityDataSource.set("entityID", entityId);

                        var actionFromUrl = this.UrlParser.getParameterFromLocationSearchByName("action");
                        if (actionFromUrl === "convert") {
                            this.showNotification(this.StringDictionary.get(convertListNotification),
                                this.ContactListMessageBar);
                        }
                    }
                },
                initializeContacts: function(entityId) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    var baseStructure = current.baseStructures[0];

                    baseStructure.dataSource.unset(listIdKey);
                    baseStructure.dataSource.set(listIdKey, entityId);
                },
                executeAction: function(parameters,
                    methodName,
                    callback,
                    isConfirm,
                    confirmationText,
                    showProgress,
                    errorMessage,
                    httpMethod) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    var listId = current.ListEntityDataSource.get("entityID");
                    if (listId !== "") {
                        if (isConfirm === true) {
                            if (!current.executeActionConfirm(current.StringDictionary.get(confirmationText))) {
                                return;
                            }
                        }

                        if (showProgress === true) {
                            current.showContactsProgressBar();
                        }

                        current.callController(
                            parameters,
                            "/" + listId + "/" + methodName,
                            callback,
                            function(status, statusText) {
                                current.defaultErrorCallback(status, statusText, errorMessage);
                            },
                            httpMethod);
                    }
                },
                defaultErrorCallback: function(status, statusText, errorMessage) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    current.showDefaultError(status,
                        statusText,
                        current.StringDictionary.get(errorMessage),
                        current.ContactListMessageBar);
                },
                executeActionConfirm: function (message) {
                    return confirm(message);
                },
                reloadEmbededList: function(baseStructure) {
                    baseStructure.dataSource.refresh();
                },
                updateEmbededList: function(items, baseStructure) {
                    if (items.length == 0) {
                        this.setHeader(baseStructure, 0);
                    }
                    if (items.length > 0) {
                        this.setHeader(baseStructure, items[0].Count);
                    }
                    this.updateContactActionsStatus();
                },
                showContactsProgressBar: function() {
                    this.ContactsProgressIndicator.set("isBusy", true);
                },
                hideContactsProgressBar: function() {
                    this.ContactsProgressIndicator.set("isBusy", false);
                },
                showDialogsProgressIndicator: function () {
                    this.DialogsProgressIndicator.set("isBusy", true);
                },
                hideDialogsProgressIndicator: function () {
                    this.DialogsProgressIndicator.set("isBusy", false);
                },
                setHeader: function(baseStructure, count) {
                    var header = baseStructure.accordion.get("origHeader");
                    if (typeof header === "undefined") {
                        header = baseStructure.accordion.get("header");
                        baseStructure.accordion.set("origHeader", header);
                    }
                    baseStructure.accordion.set("header", header + " " + count);

                    // next code was created for cases when all rows are empty and there is a need in scrollbar
                    // author knows that this solution is lame, but it works, business effort is ok and let's hope
                    // for better 3rd party libraries that enables the scrollbar by items' count, not by height
                    var items = baseStructure.control.get("items");

                    if (baseStructure.dataSource.get("hasMoreItems")) {

                        // Found by an empirical way (change and see is it works)
                        var magicalHeightDifference = 50;
                        var height = parseInt(baseStructure.control.viewModel.$el.height());
                        if (height !== NaN && height > magicalHeightDifference) {
                            // setting of maxHeight less than height forces drawing logic to think that a scrollbar is needed
                            baseStructure.control.set("maxHeight", height - magicalHeightDifference);

                            // twitching of items causes redrawing of the grid
                            // must be replaced by calling some redrawing API of SPEAK (in bright future)
                            baseStructure.control.unset("items");
                            baseStructure.control.set("items", items);
                        }
                    }
                },
                onViewContact: function() {
                    var contactId = this.ContactsList.get("selectedItemId");
                    if (contactId == "") {
                        return;
                    }

                    var url = "/sitecore/client/Applications/ExperienceProfile/contact?cid={" +
                        encodeURI(contactId) +
                        "}";
                    this.showContactCard(url);
                },
                onAddContact: function() {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    var dialogParams = { save: current.onRealAddContact };

                    current.dialogs.showDialog(current.dialogs.Ids.AddNewContactDialog, dialogParams);
                },
                onRealAddContact: function(dialog, model) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    var listId = current.ListEntityDataSource.get("entityID");
                    var url = "/sitecore/api/lists/" + encodeURI(listId) + "/contacts";
                    var data = JSON.stringify(model);
                    var contentType = "application/json; charset=utf-8";
                    current.callControllerDirectly(url, data, current.addSuccess, current.addError, contentType);
                },
                addSuccess: function(t, current, state, obj) {
                    current.showNotification(obj.statusText, current.ContactListMessageBar);
                    current.ListEntityDataSource.refresh();
                },
                addError: function(status, message) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    current.showError(message, current.ContactListMessageBar);
                },
                onDeleteList: function(parameters, isConfirm) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);

                    var dialogParams = {
                        dialogHeader: current.StringDictionary.get(deleteListConfirmationHeader),
                        message: current.StringDictionary.get(deleteListConfirmationMessage),
                        success: function() {
                            var model = current.ListEntityDataSource.get("entity");
                            var headers = { "X-Requested-With": "XMLHttpRequest" };
                            var csrfToken = current.getAntiForgeryToken();
                            headers[csrfToken.headerKey] = csrfToken.value;
                            model.options.headers = headers;
                            model.destroy().then(current.onDeleteListFinished,
                                function(error) {
                                    current.defaultErrorCallback(500, null, listWasNotRemoved);
                                });
                        }
                    }
                    if (this.getIsConfirm(isConfirm) === true) {
                        this.dialogs.showDialog(this.dialogs.Ids.OkCancelDialog, dialogParams);
                    } else {
                        dialogParams.success();
                    }
                },
                onDeleteListFinished: function() {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    current.location.href = current.Breadcrumb.get("prevPage");
                },
                onRemoveAllContacts: function(parameters, isConfirm) {
                    this.executeAction(parameters,
                        "RemoveAllContactAssociationsAndSources",
                        this.onRemoveAllContactsFinished,
                        this.getIsConfirm(isConfirm),
                        deleteAllContactsConfirmation,
                        true,
                        contactsWereNotRemoved);
                },
                onRemoveContact: function(parameters, isConfirm) {
                    var contactId = this.ContactsList.get("selectedItemId");
                    if (contactId == "") {
                        return;
                    }

                    this.executeAction(parameters,
                        "contacts/" + encodeURI(contactId),
                        this.onRemoveContactFinished,
                        this.getIsConfirm(isConfirm),
                        deleteContactConfirmation,
                        true,
                        contactWasNotRemoved,
                        "DELETE");
                },
                onRemoveAllContactsFinished: function() {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    current.showNotification(current.StringDictionary.get(deleteAllContactsNotification),
                        current.ContactListMessageBar);
                    current.ContactsList.set('items', []);
                    current.IncludedSourcesListControl.set('items', []);
                    current.ExcludedSourcesListControl.set('items', []);
                    current.setHeader(current.baseStructures[0], 0);
                    current.updateContactActionsStatus();
                    current.hideContactsProgressBar();
                },
                onRemoveContactFinished: function(data, sender, state, xnrResponse) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);

                    if (xnrResponse.status >= 200 && xnrResponse.status <= 299) {
                        current.updateContactActionsStatus();
                        current.hideContactsProgressBar();

                        current.showNotification(current.StringDictionary.get(deleteContactNotification),
                            current.ContactListMessageBar);
                    } else {
                        current.showWarning(current.StringDictionary.get(lockedContactsCannotBeChanged),
                            current.ContactListMessageBar);
                    }
                },
                onRemoveDuplicates: function (parameters) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    current.showDialogsProgressIndicator();
                    
                    this.executeAction(parameters,
                        "RemoveDuplicates",
                        this.onRemoveDuplicatesFinished,
                        false,
                        "",
                        false,
                        duplicateContactsWereNotRemoved);
                },
                onRemoveDuplicatesFinished: function(data) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    var message = current.StringDictionary.get(duplicatesRemovedNotification);
                    current.reloadEmbededList(current.baseStructures[0]);
                    current.showNotification(data + " " + message, current.ContactListMessageBar);
                    current.hideDialogsProgressIndicator();
                },
                onExportToCsv: function(parameters) {
                    var entityId = this.UrlParser.getParameterFromLocationSearchByName("id");
                    var targetDataSource = this[parameters.actionsDataSource];
                    var actionUrl = targetDataSource.get("url") + "/" + encodeURI(entityId) + "/export";

                    this.downloadFile(actionUrl, this.onExportToCsvError);
                },
                onExportToCsvError: function(message) {
                    self.showError(message, self.ContactListMessageBar);
                },
                showContactCard: function(url) {
                    window.open(url, '_blank');
                },
                resetListControl: function(listControl) {
                    listControl.unset("items");
                    listControl.set("items", []);
                },
                updateUiForList: function(dataSource, model) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);

                    this.setTitle(model.Name);
                    this.GeneralInformationNameValue.set("text", model.Name);
                    this.GeneralInformationDescriptionValue.set("text", model.Description);
                    this.InfoSpotTypeText.set("text", model.TypeName);
                    this.InfoSpotCreatedText.set("text", current.parseIsoDate(model.Created).toLocaleDateString());
                    if (commonPagesDefinition.defaultIfValueIsUndefinedOrNull(model.Owner, "") !== "") {
                        var items = this.GeneralInformationOwnerComboBox.get("items");
                        var itemsToSelect = Array.prototype.filter
                            .call(items, function(i) { return i.itemId == model.Owner; });
                        if (itemsToSelect.length > 0) {
                            this.GeneralInformationOwnerComboBox.set("selectedItems", itemsToSelect);
                        }
                    }
                    this.updateUiForAdditionalFields(model);
                    this.updateUiForSources(model);

                    if (model.Notification) {
                        current.showWarning(model.Notification, current.ContactListMessageBar, 0, true);
                    }


                    current.initializeContacts(model.Id);
                    this.SaveButton.set("isEnabled", false);
                },
                updateContactActionsStatus: function() {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    var contacts = current.ContactsList.get("items"),
                        contactsLength = 0;
                    if (typeof contacts !== "undefined" && contacts !== null && "length" in contacts) {
                        contactsLength = contacts.length;
                    }

                    var isNewlyCreatedList = commonPagesDefinition
                        .defaultIfValueIsUndefinedOrNull(current.ListEntityDataSource.get("entityID"), "") ===
                        "";
                    current.setActionEnabledStatus(current.ContactsActionControl,
                        removeAllContactsActionIds,
                        (contactsLength > 0) && (current.PredefinedText === ""));
                    current.setActionEnabledStatus(current.ContactsActionControl,
                        removeContactActionIds,
                        (contactsLength > 0) &&
                        (commonPagesDefinition
                            .defaultIfValueIsUndefinedOrNull(current.ContactsList.get("selectedItemId"), "") !==
                            ""));
                    current.setActionEnabledStatus(current.ContactsActionControl,
                        addNewContactActionIds,
                        !isNewlyCreatedList);
                    current.setActionEnabledStatus(current.ContactsActionControl,
                        viewContactCardActionIds,
                        (!isNewlyCreatedList) &&
                        (contactsLength > 0) &&
                        (commonPagesDefinition
                            .defaultIfValueIsUndefinedOrNull(current.ContactsList.get("selectedItemId"), "") !==
                            ""));
                },
                updateUiForSources: function(model) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);

                    var source = JSON.parse(model.Source);

                    current.PredefinedText = commonPagesDefinition
                        .defaultIfValueIsUndefinedOrNull(source.PredefinedText, "");
                    current.PredefinedSourceType = commonPagesDefinition
                        .defaultIfValueIsUndefinedOrNull(source.PredefinedSourceType, "");
                    current.PredefinedParameters = commonPagesDefinition
                        .defaultIfValueIsUndefinedOrNull(source.PredefinedParameters, []);

                    if (current.PredefinedText !== "") {
                        current.PredefinedSourceLabel.set("text", source.PredefinedText);
                        current.IncludedSourcesListControl.set("isVisible", false);
                        current.ExcludedSourcesListControl.set("isVisible", false);
                        current.ListSourceActionControl.set("isVisible", false);
                    }

                    current.updateContactActionsStatus();
                    current.resetListControl(current.IncludedSourcesListControl);

                    current.IncludedSourcesListControl.set("items", source.IncludedLists);

                    current.setActionEnabledStatus(current.ListSourceActionControl,
                        setEntireDatabaseActionIds,
                        !!source.IncludedLists.length);
                    current.ExcludedSourcesListControl.set("items", source.ExcludedLists);

                    if (source.ExcludedLists.length > 0) {
                        current.ExcludeSourceAccordion.set("isVisible", true);
                    }
                },
                initializeAdditionalFields: function() {
                },
                updateUiForAdditionalFields: function(model) {
                },
                initializeChangeTracking: function() {
                    this.GeneralInformationNameValue.viewModel.$el
                        .keyup(function() {
                            self.updateSaveButtonUi(self.updateSaveButtonUi,
                                self.GeneralInformationNameValue.viewModel.$el.val(),
                                "Name");
                        });
                    this.GeneralInformationDescriptionValue.viewModel.$el
                        .keyup(function() {
                            self.updateSaveButtonUi(self.GeneralInformationDescriptionValue,
                                self.GeneralInformationDescriptionValue.viewModel.$el.val(),
                                "Description");
                        });
                    this.GeneralInformationOwnerComboBox.on("change:selectedItemId",
                        function(control, value) { this.updateSaveButtonUi(control, value, "Owner"); },
                        this);
                },
                setTitle: function(title) {
                    this.document.title = title;
                    this.HeaderTitle.set("text", title);
                },
                updateSaveButtonUi: function(control, value, property) {
                    var model = this.ListEntityDataSource.get("entity"),
                        enabled = true;
                    if (model !== null) {
                        if (property === "Source") {
                            this.refreshRequired = true;
                        }
                        if (property === "Query") {
                            this.refreshRequired = true;
                        } else {
                            enabled = model[property] !== value ||
                                this.GeneralInformationNameValue.viewModel.$el.val() !== model["Name"] ||
                                this.GeneralInformationDescriptionValue.viewModel.$el.val() !== model["Description"] ||
                                this.GeneralInformationOwnerComboBox.get("selectedItemId") !== model["Owner"] ||
                                this.refreshRequired;
                        }
                    }
                    enabled = enabled && this.GeneralInformationNameValue.viewModel.$el.val().trim().length > 0;
                    this.SaveButton.set("isEnabled", enabled);
                },
                updateOwner: function() {
                    if (this.ListOwnerDataSource.get("hasResponse") === true) {
                        var response = this.ListOwnerDataSource.get("response");
                        var data = JSON.parse(response);
                        var items = Array.prototype.map
                            .call(data, function(i) { return { "$displayName": i, "itemId": i }; });
                        this.GeneralInformationOwnerComboBox.set("items", items);
                        if (items.length > 0) {
                            this.GeneralInformationOwnerComboBox
                                .set("selectedItems", Array.prototype.slice.call(items, 0, 1));
                        }
                    }
                },
                contactSearchTextBoxKeyUp: function(e) {
                    if (e.keyCode == keyUpKeyCode) {
                        var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                        current.findContacts();
                    }
                },
                findContacts: function() {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    var baseStructure = current.baseStructures[0];

                    var searchText = current.ContactsSearchButtonTextBox.get("text");
                    baseStructure.dataSource.set(filterKey, searchText);
                },
                saveList: function() {
                    this.SaveButton.set("isEnabled", false);

                    var listName = this.GeneralInformationNameValue.get("text");
                    if (listName !== "") {
                        var model,
                            owner = this.GeneralInformationOwnerComboBox.get("selectedItemId"),
                            description = this.GeneralInformationDescriptionValue.get("text"),
                            entityId = this.ListEntityDataSource.get("entityID");
                        if (entityId === "") {
                            model = {};
                        } else {
                            model = this.ListEntityDataSource.get("entity");
                        }

                        model.Name = listName;
                        model.Owner = owner;
                        model.Description = description;
                        model = this.saveListType(model);
                        model = this.saveAdditionalFields(model);
                        model.Source = this.getContactListSource();

                        var headers = { "X-Requested-With": "XMLHttpRequest" };
                        var csrfToken = this.getAntiForgeryToken();
                        headers[csrfToken.headerKey] = csrfToken.value;

                        if (entityId === "") {
                            var id = this.ListEntityDataSource.Service.constructor.utils.guid.generate();
                            model.Id = id;
                            var query = this.ListEntityDataSource.Service.create(model, { headers: headers });
                            var promise = query.execute();
                            promise.then(this.updateEntityAndNotify, this.notifyAboutError);
                        } else {
                            model.options.headers = headers;
                            model.save().then(this.notify, this.notifyAboutError);
                        }
                    } else {
                        this.GeneralInformationNameValue.viewModel.focus();
                        this.showError(this.StringDictionary.get("The 'List name' field should be specified."),
                            this.ContactListMessageBar);
                    }
                },
                saveListType: function(model) {
                    model.Type = this.listType;
                    return model;
                },
                saveAdditionalFields: function(model) {
                    return model;
                },
                notify: function(model) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    current.showNotification(current.StringDictionary.get(saveListNotification),
                        current.ContactListMessageBar);
                    if (current.refreshRequired === true) {
                        current.initializeContacts(model.Id);
                        current.refreshRequired = false;
                    }
                    current.updateUiForSources(model);
                    current.setTitle(model.Name);
                },
                updateEntityAndNotify: function(model) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    current.ListEntityDataSource.set("entityID", model.Id);
                    current
                        .showNotificationWithPreviousMessage(current.StringDictionary.get(saveListNotification),
                            current.ContactListMessageBar);
                    current.ListActions.set("isVisible", true);

                    current.UrlParser.appendQueryParameter("id", model.Id);
                    current.setTitle(model.Name);
                },
                notifyAboutError: function(error) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    var message;
                    try {
                        var errorResponse = JSON.parse(error.message);
                        if (errorResponse.ModelState) {
                            message = [];
                            for (var key in errorResponse.ModelState) {
                                for (var i = 0; i < errorResponse.ModelState[key].length; i++) {
                                    message.push(errorResponse.ModelState[key][i]);
                                }
                            }
                        } else {
                            message = errorResponse.Message;
                        }
                    } catch (e) {
                        message = error.message;
                    }

                    if (message == "Authorization has been denied for this request.") {
                        current.location.reload();
                    } else {
                        current.showError(message, current.ContactListMessageBar);
                    }
                },
                getContactListSource: function() {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);

                    var includedLists = current.IncludedSourcesListControl.get("items");
                    var excludedLists = current.ExcludedSourcesListControl.get("items");

                    return JSON.stringify({
                        IncludedLists: includedLists,
                        ExcludedLists: excludedLists,
                        PredefinedText: current.PredefinedText,
                        PredefinedSourceType: current.PredefinedSourceType,
                        PredefinedParameters: current.PredefinedParameters
                    });
                },
                selectSourceItem: function(control) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    current.toggleRemoveAction();
                    current.IncludedSourcesListControl.off("change:selectedItem");
                    current.ExcludedSourcesListControl.off("change:selectedItem");
                    if (control === current.ExcludedSourcesListControl) {
                        current.resetSourceControl(current.IncludedSourcesListControl);
                    } else {
                        current.resetSourceControl(current.ExcludedSourcesListControl);
                    }
                    current.IncludedSourcesListControl.on("change:selectedItem",
                        function() { current.selectSourceItem(current.IncludedSourcesListControl); },
                        current);
                    current.ExcludedSourcesListControl.on("change:selectedItem",
                        function() { current.selectSourceItem(current.ExcludedSourcesListControl); },
                        current);
                },
                resetSourceControl: function(sourceControl) {
                    if (sourceControl.get("selectedItem") != "") {
                        sourceControl.set("selectedItem", null);
                        sourceControl.set("selectedItemId", null);
                        sourceControl.set("defaultSelectedItemId", null);
                    }
                },
                addInclusion: function() {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    current.addSource(current.IncludedSourcesListControl,
                        function() {
                            current.setActionEnabledStatus(current.ListSourceActionControl,
                                setEntireDatabaseActionIds,
                                true);
                        });
                },
                addExclusion: function() {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    current.addSource(current.ExcludedSourcesListControl,
                        function(items) {
                            if (items.length > 0) {
                                current.ExcludeSourceAccordion.set("isVisible", true);
                            }
                        });
                },
                pendingSources: [],
                addSource: function(sourcesListControl, additionalActions) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    var callback = function(itemId, item) {
                        if (typeof item != "undefined" && item != null) {
                            var currentItems = sourcesListControl.get("items");
                            var newItems = [];
                            newItems.push(item);
                            var items;
                            if (currentItems.length > 0) {
                                items = Array.prototype.concat.call(currentItems, newItems);
                            } else {
                                items = newItems;
                            }

                            sourcesListControl.set("items", items);
                            if (additionalActions) {
                                additionalActions(items);
                            }
                            current.updateSaveButtonUi(current.IncludedSourcesListControl,
                                current.getContactListSource(),
                                "Source");
                            current.pendingSources.push(itemId);
                        }
                    };

                    var includeItems = current.IncludedSourcesListControl.get("items");
                    var excludeItem = current.ExcludedSourcesListControl.get("items");

                    var allExcludeItems = Array.prototype.concat.call(includeItems, excludeItem);

                    var allExcludeItemsIds = [];
                    for (var i = 0; i < allExcludeItems.length; i++) {
                        allExcludeItemsIds.push(allExcludeItems[i].Id);
                    }

                    var listId = this.UrlParser.getParameterFromLocationSearchByName("id");

                    if (listId !== "") {
                        listId = this.ListEntityDataSource.get("entity").Id;
                    }

                    var dialogParams = {
                        callback: callback,
                        excludelists: allExcludeItemsIds,
                        currentListId: listId,
                        filter: "getContactLists"
                    };

                    current.dialogs.showDialog(current.dialogs.Ids.SelectListDialog, dialogParams);
                },
                setEntireDatabase: function() {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);

                    if (current.IncludedSourcesListControl.get("items").length > 0) {
                        if (!confirm(this.StringDictionary.get(replaceAllListsWithEntireDatabaseSource))) {
                            return;
                        }
                    }

                    current.IncludedSourcesListControl.set("items", []);
                    current.updateUiForSources({ Source: current.getContactListSource() });
                    current.updateSaveButtonUi(current.IncludedSourcesListControl,
                        current.getContactListSource(),
                        "Source");
                },
                toggleRemoveAction: function() {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    if (current.IncludedSourcesListControl.get("selectedItem") != "" ||
                        current.ExcludedSourcesListControl.get("selectedItem") != "") {
                        $.each(this.ListSourceActionControl.get("actions"),
                            function() {
                                if (removeSourceIds.indexOf(this.id()) > -1) {
                                    this.enable();
                                }
                            });
                    } else {
                        $.each(this.ListSourceActionControl.get("actions"),
                            function() {
                                if (removeSourceIds.indexOf(this.id()) > -1) {
                                    this.disable();
                                }
                            });
                    }
                },
                removeSource: function() {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    current.removeSourceFromControl(current.IncludedSourcesListControl, current);
                    var newExcludedItems = current.removeSourceFromControl(current.ExcludedSourcesListControl, current);
                    if (newExcludedItems.length == 0) {
                        current.ExcludeSourceAccordion.set("isVisible", false);
                    }

                    current.updateSaveButtonUi(current.IncludedSourcesListControl,
                        current.getContactListSource(),
                        "Source");
                    current.updateUiForSources({ Source: current.getContactListSource() });
                },
                removeSourceFromControl: function(sourceControl, current) {
                    var oldItems;
                    var newItems = [];
                    var index;

                    var selectedItemId = sourceControl.get("selectedItemId");
                    if (selectedItemId !== "") {
                        oldItems = sourceControl.get("items");

                        for (index = 0; index < oldItems.length; ++index) {
                            if (oldItems[index].Id != selectedItemId) {
                                newItems.push(oldItems[index]);
                            }
                        }

                        current.pendingSources = current.pendingSources.filter(function(id) {
                            return id != selectedItemId;
                        });

                        sourceControl.off("change:selectedItem");
                        sourceControl.set("selectedItem", null);
                        sourceControl.set("selectedItemId", null);
                        sourceControl.set("defaultSelectedItemId", null);
                        sourceControl.set("items", newItems);
                        sourceControl.on("change:selectedItem",
                            function() { current.selectSourceItem(sourceControl); },
                            current);
                        current.toggleRemoveAction();
                    }

                    return newItems;
                }
            };
            return commonPagesDefinition.mergeListPages(commonPagesDefinition, extensionObject);
        });
})();