(function(speak) {
    define(["jquery", "underscore"],
        function($, _) {
            var formEditorUtils = {
                settings: {
                    flattenSeparator: "_"
                },

                iterateObject: function(obj, callbackFn) {
                    if (obj == null || typeof callbackFn !== "function")
                        return;

                    if (typeof obj === "object") {
                        var keys = _.keys(obj);
                        for (var index = 0; index < keys.length; ++index) {
                            var key = keys[index],
                                value = obj[key];
                            callbackFn.call(this, value, key, obj);
                        }
                    }
                },

                flattenObject: function(obj, skipKeys) {
                    if (obj == null || typeof obj === "string") return obj;

                    var result = {};

                    this.iterateObject(obj,
                        function(value, key) {
                            if (typeof value === "object" && (!skipKeys || skipKeys.indexOf(key) === -1)) {
                                var flattenValue = this.flattenObject(value);

                                this.iterateObject(flattenValue,
                                    function(flatValue, subKey) {
                                        result[key + this.settings.flattenSeparator + subKey] = flatValue;
                                    });
                            } else {
                                result[key] = value;
                            }
                        });

                    return result;
                },

                unflattenObject: function(obj) {
                    if (obj == null || typeof obj === "string") return obj;

                    var result = {},
                        iterObj = result,
                        keys = _.keys(obj);
                    var numRegex = /^\d+$/;

                    keys.forEach(function(key) {
                            var subKeys = key.split(this.settings.flattenSeparator),
                                last = subKeys.pop();

                            for (var index = 0; index < subKeys.length; ++index) {
                                var subKey = subKeys[index];
                                var nextKey = subKeys[index + 1];

                                var nextIsIndex = nextKey && numRegex.test(nextKey);
                                if (nextIsIndex) {
                                    subKeys[index + 1] = parseInt(nextKey);
                                }

                                if (iterObj[subKey] == undefined) {
                                    iterObj[subKey] = nextIsIndex ? [] : {};
                                }

                                iterObj = iterObj[subKey];
                            };

                            iterObj[last] = obj[key];
                            iterObj = result;
                        },
                        this);

                    return result;
                },

                getFormControl: function(formComponent, key) {
                    var field = formComponent.bindingConfigObject[key];
                    var componentName = field ? field.split(".")[0] : "";
                    return componentName ? formComponent[componentName] : null;
                },

                getFormData: function(formComponent) {
                    var formData = formComponent.getFormData();

                    var keys = _.keys(formData);
                    keys.forEach(function(propKey) {
                        if (formData[propKey] == null) {
                            formData[propKey] = "";
                        }
                    });

                    return formData;
                },

                getFormBindingTarget: function (initialFormData, contextItem, skipKeys) {
                    var clone = $.extend(true, {}, contextItem);
                    var flattenData = this.flattenObject(clone, skipKeys);
                    var formData = $.extend(true, {}, initialFormData);

                    var keys = _.keys(formData);
                    keys.forEach(function(key) {
                            formData[key] = this.getValue(formData[key], flattenData[key]);
                        },
                        this);

                    return formData;
                },

                getFormErrors: function(formComponent, formData, requiredFieldErrorText) {
                    var errors;

                    var keys = _.keys(formData);
                    keys.forEach(function(key) {
                            var value = formData[key];
                            var isEmpty = this.isEmptyValue(value) || (typeof (value) === "string" && !value.trim());
                            if (!isEmpty) {
                                return;
                            }

                            var control = this.getFormControl(formComponent, key);
                            if (!control)
                                return;

                            var $requiredEl = $(control.el)
                                .closest(".sc-formcomponent")
                                .find(".sc-global-isrequired");
                            if ($requiredEl.length === 1 && $requiredEl[0].innerText === "*") {
                                errors = errors || {};
                                errors[key] = requiredFieldErrorText;
                            }

                        },
                        this);

                    return errors;
                },

                updateProperties: function(contextItem, flatFormData, immutableFieldProperties) {

                    var formData = this.unflattenObject(flatFormData);
                    var allowUpdate;

                    _.keys(formData)
                        .forEach(function(propKey) {
                                allowUpdate = contextItem.hasOwnProperty(propKey) &&
                                    immutableFieldProperties.indexOf(propKey) === -1;
                                if (!allowUpdate) {
                                    return;
                                }

                                contextItem[propKey] = this.getValue(contextItem[propKey], formData[propKey]);
                            },
                            this);
                },

                hasChanged: function(contextItem, flatFormData, immutableFieldProperties) {
                    var clone = $.extend(true, {}, contextItem);

                    var formData = this.unflattenObject(flatFormData);
                    var allowUpdate;

                    var hasChanged = _.keys(formData)
                        .some(function(propKey) {
                                allowUpdate = clone.hasOwnProperty(propKey) &&
                                    immutableFieldProperties.indexOf(propKey) === -1;
                                if (!allowUpdate) {
                                    return false;
                                }
                                var newValue = this.getValue(clone[propKey], formData[propKey]),
                                    currentValue = clone[propKey];

                                var result = (!this.isEmptyValue(currentValue) || !this.isEmptyValue(newValue)) &&
                                    !_.isEqual(clone[propKey], newValue);
                                return result;
                            },
                            this);

                    return hasChanged;
                },

                isEmptyValue: function(value) {
                    var valueType = this.getValueType(value);
                    switch (valueType) {
                    case "number":
                        return isNaN(value);
                    case "boolean":
                        return false;
                    case "object":
                    case "string":
                    case "array":
                    default:
                        return _.isEmpty(value);
                    }
                },

                getValue: function(propValue, newPropValue) {
                    if (propValue === newPropValue) {
                        return propValue;
                    }

                    var valueType = this.getValueType(propValue),
                        newValueType = this.getValueType(newPropValue);

                    if (valueType === newValueType && valueType !== "object" && valueType !== "array") {
                        return newPropValue;
                    } else {
                        switch (valueType) {
                        case "object":
                            var cleanValue = this.getCleanObject(newPropValue);
                            return $.extend(true, propValue, cleanValue);
                        case "number":
                            var numberValue = parseFloat(newPropValue);
                            return !isNaN(numberValue) ? numberValue : undefined;
                        case "boolean":
                            return (newPropValue != null &&
                                    (newPropValue.toLowerCase() === "true" || newPropValue === "1")
                            );
                        case "string":
                            return (newPropValue != null && newPropValue.toString) ? newPropValue.toString() : "";
                        case "array":
                            var cleanArrayValue = [];
                            if (newPropValue && newPropValue.length) {
                                for (var idx = 0; idx < newPropValue.length; ++idx) {
                                    cleanArrayValue.push(this.getCleanObject(newPropValue[idx]));
                                }
                            }
                            return cleanArrayValue;
                        default:
                            return newPropValue;
                        }
                    }
                },

                getValueType: function(propValue) {
                    if (propValue == null) {
                        return "";
                    }

                    if (Array.isArray(propValue)) {
                        return "array";
                    }

                    return typeof propValue;
                },

                getCleanObject: function(obj) {
                    if (obj && obj.__parameterTemplates) {
                        var cleanObj = {};
                        _.keys(obj.__parameterTemplates)
                            .forEach(function(key) {
                                cleanObj[key] = obj[key];
                            });

                        return cleanObj;
                    }

                    return obj;
                }
            };
            return formEditorUtils;
        });
})(Sitecore.Speak);