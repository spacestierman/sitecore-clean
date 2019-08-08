(function (speak) {
    define(["jquery"], function ($) {
            var formServices = {
                paths: {
                    loadForm: "/formbuilder/load",
                    renderField: "/sitecore/api/forms/client/formfield/renderfield",
                    reloadField: "/sitecore/api/forms/client/formfield/reloadfield",
                    reloadDatasource: "/sitecore/api/forms/client/formfield/reloaddatasource",
                    reloadListItems: "/sitecore/api/forms/client/formfield/reloadlistitems",
                    saveForm: "/sitecore/api/ssc/forms/formdesign/formdesign/save",
                    renameForm: "/sitecore/api/ssc/forms/formdesign/formdesign/rename",
                    deleteForms: "/sitecore/api/ssc/forms/formdesign/formdesign/delete",
                    getFormDetails: "/sitecore/api/ssc/forms/formdesign/formdesign/details",
                    getSubmitActions: "/sitecore/api/ssc/forms/submitactions/submitactions",
                    getSubmitActionDefinition: "/sitecore/api/ssc/forms/submitactions/submitactions/definition",
                    getFormStatistics: "/sitecore/api/ssc/forms/reports/reports/formstatistics",
                    getFieldStatistics: "/sitecore/api/ssc/forms/reports/reports/fieldstatistics",
                    createGoal: "/-/item/v1/sitecore/shell"
                },

                addCsrfToken: function (options) {
                    var csrfToken = speak.utils.security.antiForgery.getAntiForgeryToken();

                    options.beforeSend = function(request) {
                        request.setRequestHeader(csrfToken.headerKey, csrfToken.value);
                    };
                },

                loadForm: function (id, mode, language) {
                    var options = {
                        id: id || "",
                        sc_formmode: mode || "",
                        sc_formlang: language
                    },
                        url = speak.Helpers.url.addQueryParameters(this.paths.loadForm, options);

                    var ajaxOptions = {
                        dataType: "html",
                        type: "GET",
                        cache: false
                    };

                    return $.ajax(url, ajaxOptions);
                },

                saveForm: function (items, mode, language) {
                    var options = {
                        sc_formmode: mode,
                        sc_formlang: language
                    },
                        url = speak.Helpers.url.addQueryParameters(this.paths.saveForm, options);

                    var ajaxOptions = {
                        dataType: "json",
                        contentType: "application/json; charset=utf-8",
                        type: "POST",
                        data: JSON.stringify(items),
                        cache: false
                    };
                    this.addCsrfToken(ajaxOptions);

                    return $.ajax(url, ajaxOptions);
                },

                renameForm: function (id, newName) {
                    var options = {
                        formId: id,
                        sc_formmode: "edit"
                    },
                        url = speak.Helpers.url.addQueryParameters(this.paths.renameForm, options);

                    var ajaxOptions = {
                        type: "POST",
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        data: JSON.stringify(newName)
                    };
                    this.addCsrfToken(ajaxOptions);

                    return $.ajax(url, ajaxOptions);
                },

                deleteForms: function (itemIds) {
                    var options = {
                        sc_formmode: "delete"
                    },
                        url = speak.Helpers.url.addQueryParameters(this.paths.deleteForms, options);

                    var ajaxOptions = {
                        type: "DELETE",
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        data: JSON.stringify(itemIds)
                    };
                    this.addCsrfToken(ajaxOptions);

                    return $.ajax(url, ajaxOptions);
                },

                renderField: function (fieldType, fieldTemplate, language) {
                    var options = {
                        fieldTypeId: fieldType,
                        templateId: fieldTemplate,
                        sc_formmode: "new",
                        sc_formlang: language
                    },
                        url = speak.Helpers.url.addQueryParameters(this.paths.renderField, options);

                    var ajaxOptions = {
                        dataType: "html",
                        type: "GET",
                        cache: false
                    };

                    return $.ajax(url, ajaxOptions);
                },

                reloadField: function (fieldData, language) {
                    var options = {
                        sc_formmode: "edit",
                        sc_formlang: language
                    },
                        url = speak.Helpers.url.addQueryParameters(this.paths.reloadField, options);

                    var ajaxOptions = {
                        dataType: "html",
                        contentType: "application/json; charset=utf-8",
                        type: "POST",
                        data: fieldData,
                        cache: false
                    };

                    return $.ajax(url, ajaxOptions);
                },

                reloadDatasource: function (dataOptions, language) {
                    var options = $.extend(true, {
                        sc_formmode: "edit",
                        sc_formlang: language
                    }, dataOptions),
                        url = speak.Helpers.url.addQueryParameters(this.paths.reloadDatasource, options);

                    var ajaxOptions = {
                        dataType: "json",
                        contentType: "application/json; charset=utf-8",
                        type: "GET",
                        cache: false
                    };

                    return $.ajax(url, ajaxOptions);
                },

                reloadListItems: function (dataOptions, language) {
                    var options = $.extend(true, {
                                sc_formmode: "edit",
                                sc_formlang: language
                            }, dataOptions),
                        url = speak.Helpers.url.addQueryParameters(this.paths.reloadListItems, options);

                    var ajaxOptions = {
                        dataType: "json",
                        contentType: "application/json; charset=utf-8",
                        type: "GET",
                        cache: false
                    };

                    return $.ajax(url, ajaxOptions);
                },

                getSubmitActions: function () {
                    var options = {
                        sc_formmode: "edit",
                        sc_formlang: speak.Context.current().language
                    },
                        url = speak.Helpers.url.addQueryParameters(this.paths.getSubmitActions, options);

                    var ajaxOptions = {
                        dataType: "json",
                        contentType: "application/json; charset=utf-8",
                        type: "GET",
                        cache: false
                    };
                    this.addCsrfToken(ajaxOptions);

                    return $.ajax(url, ajaxOptions);
                },

                getSubmitActionDefinition: function (dataOptions) {
                    var options = $.extend(true, {
                                sc_formmode: "edit",
                                sc_formlang: speak.Context.current().language
                            }, dataOptions),
                        url = speak.Helpers.url.addQueryParameters(this.paths.getSubmitActionDefinition, options);

                    var ajaxOptions = {
                        dataType: "json",
                        contentType: "application/json; charset=utf-8",
                        type: "GET",
                        cache: false
                    };
                    this.addCsrfToken(ajaxOptions);

                    return $.ajax(url, ajaxOptions);
                },

                getFormDetails: function (formId) {
                    var options = {
                        formId: formId,
                        sc_formmode: "edit",
                        sc_formlang: speak.Context.current().language
                    },
                        url = speak.Helpers.url.addQueryParameters(this.paths.getFormDetails, options);

                    var ajaxOptions = {
                        dataType: "json",
                        contentType: "application/json; charset=utf-8",
                        type: "GET",
                        cache: false
                    };

                    this.addCsrfToken(ajaxOptions);

                    return $.ajax(url, ajaxOptions);
                },

                getFormStatistics: function (formId, startDate, endDate) {
                    var options = {
                        formId: formId,
                        startDate: startDate,
                        endDate: endDate,
                        utcOffset: new Date().getTimezoneOffset(),
                        sc_formmode: "edit",
                        sc_formlang: speak.Context.current().language
                    },
                        url = speak.Helpers.url.addQueryParameters(this.paths.getFormStatistics, options);

                    var ajaxOptions = {
                        dataType: "json",
                        contentType: "application/json; charset=utf-8",
                        type: "GET",
                        cache: false
                    };
                    this.addCsrfToken(ajaxOptions);

                    return $.ajax(url, ajaxOptions);
                },

                getFieldStatistics: function (formId, fieldId, startDate, endDate) {
                    var options = {
                        formId: formId,
                        fieldId: fieldId,
                        startDate: startDate,
                        endDate: endDate,
                        utcOffset: new Date().getTimezoneOffset(),
                        sc_formmode: "edit",
                        sc_formlang: speak.Context.current().language
                    },
                        url = speak.Helpers.url.addQueryParameters(this.paths.getFieldStatistics, options);

                    var ajaxOptions = {
                        dataType: "json",
                        contentType: "application/json; charset=utf-8",
                        type: "GET",
                        cache: false
                    };
                    this.addCsrfToken(ajaxOptions);

                    return $.ajax(url, ajaxOptions);
                },

                createGoal: function (baseOptions, fields) {
                    var goal = $.extend(true, baseOptions.Fields || {}, {
                        Name: fields.GoalLabel,
                        Points: fields.EngagementValue,
                        Description: fields.Description
                    }),
                    options = {
                        sc_itemid: baseOptions.ParentId,
                        sc_database: baseOptions.Database,
                        template: baseOptions.TemplateId,
                        name: fields.GoalLabel
                    },
                    url = speak.Helpers.url.addQueryParameters(this.paths.createGoal, options);

                    var ajaxOptions = {
                        type: "POST",
                        dataType: "json",
                        data: goal
                    };
                    this.addCsrfToken(ajaxOptions);

                    return $.ajax(url, ajaxOptions);
                }
            };

            return formServices;
        });
})(Sitecore.Speak);