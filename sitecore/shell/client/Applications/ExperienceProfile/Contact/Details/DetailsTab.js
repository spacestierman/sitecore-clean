define(["sitecore", "/-/speak/v1/experienceprofile/DataProviderHelper.js", "/-/speak/v1/experienceprofile/CintelUtl.js"], function (sc, providerHelper, cintelUtil) {
    var intelPath = "/intel",
        dataSetProperty = "dataSet";

    var getTypeValue = function (preffered, all) {
        if (preffered.Key) {
            return { Key: preffered.Key, Value: preffered.Value };
        } else if (all.length > 0) {
            return { Key: all[0].Key, Value: all[0].Value };
        }

        return null;
    };

    var app = sc.Definitions.App.extend({
        initialized: function () {
            var transformers = $.map(
                [
                    "default"
                ], function (tableName) {
                    return { urlKey: intelPath + "/" + tableName + "?", headerValue: tableName };
                });

            providerHelper.setupHeaders(transformers);
            providerHelper.addDefaultTransformerKey();

            this.setupContactDetail();
        },

        setEmail: function (textControl, email) {
            if (email && email.indexOf("@") > -1) {
                cintelUtil.setText(textControl, "", true);
                textControl.viewModel.$el.html('<a href="mailto:' + email + '">' + email + '</a>');
            } else {
                cintelUtil.setText(textControl, email, true);
            }
        },

        setupContactDetail: function () {
            var getFullAddress = function (data) {
                var addressParts = [
                    data.streetLine1,
                    data.streetLine2,
                    data.streetLine3,
                    data.streetLine4,
                    data.city,
                    data.country,
                    data.postalCode
                ];

                addressParts = $.map(addressParts, function (val) { return val ? val : null; });
                return addressParts.join(", ");
            };

            providerHelper.initProvider(this.ContactDetailsDataProvider, "", sc.Contact.baseUrl, this.DetailsTabMessageBar);
            providerHelper.getData(
                this.ContactDetailsDataProvider,
                $.proxy(function (jsonData) {
                    this.ContactDetailsDataProvider.set(dataSetProperty, jsonData);
                    var dataSet = this.ContactDetailsDataProvider.get(dataSetProperty);
                    var email = getTypeValue(jsonData.preferredEmailAddress, dataSet.emailAddresses);
                    if (jsonData.emailAddresses.length === 0 && email != null)
                        jsonData.emailAddresses.push(email);

                    var phone = getTypeValue(jsonData.preferredPhoneNumber, dataSet.phoneNumbers);
                    if (jsonData.phoneNumbers.length === 0 && phone != null)
                        jsonData.phoneNumbers.push(phone);

                    var address = getTypeValue(jsonData.preferredAddress, dataSet.addresses);
                    if (jsonData.addresses.length === 0 && address != null)
                        jsonData.addresses.push(address);

                    this.EmailColumnDataRepeater.viewModel.addData(jsonData.emailAddresses);
                    this.PhoneColumnDataRepeater.viewModel.addData(jsonData.phoneNumbers);
                    this.AddressColumnDataRepeater.viewModel.addData(jsonData.addresses);

                    cintelUtil.setText(this.FirstNameValue, jsonData.firstName, false);
                    cintelUtil.setText(this.MiddleNameValue, jsonData.middleName, false);
                    cintelUtil.setText(this.LastNameValue, jsonData.surName, false);

                    cintelUtil.setTitle(this.FirstNameValue, jsonData.firstName);
                    cintelUtil.setTitle(this.MiddleNameValue, jsonData.middleName);
                    cintelUtil.setTitle(this.LastNameValue, jsonData.surName);

                    cintelUtil.setText(this.TitleValue, jsonData.jobTitle, false);

                    cintelUtil.setText(this.GenderValue, jsonData.gender, false);
                    cintelUtil.setText(this.BirthdayValue, jsonData.formattedBirthDate, false);

                    if (email) {
                        cintelUtil.setText(this.PrimeEmailType, email.Key, true);
                        this.setEmail(this.PrimeEmailValue, email.Value.SmtpAddress);
                        cintelUtil.setTitle(this.PrimeEmailValue, email.Value.SmtpAddress);
                    }

                    if (phone) {
                        cintelUtil.setText(this.PrimePhoneType, phone.Key, true);
                        cintelUtil.setText(this.PrimePhoneValue, cintelUtil.getFullTelephone(phone.Value), true);
                    }

                    if (address) {
                        cintelUtil.setText(this.PrimeAddressType, address.Key, true);
                        cintelUtil.setText(this.PrimeAddressValue, getFullAddress(address.Value), true);
                    }
                }, this)
            );

            this.EmailColumnDataRepeater.on("subAppLoaded", function (args) {
                cintelUtil.setText(args.app.Type, args.data.Key, true);
                this.setEmail(args.app.Value, args.data.Value.SmtpAddress);
                cintelUtil.setTitle(args.app.Value, args.data.Value.SmtpAddress);
            }, this);

            this.PhoneColumnDataRepeater.on("subAppLoaded", function (args) {
                cintelUtil.setText(args.app.Type, args.data.Key, true);
                cintelUtil.setText(args.app.Value, cintelUtil.getFullTelephone(args.data.Value), true);
            }, this);

            this.AddressColumnDataRepeater.on("subAppLoaded", function (args) {
                cintelUtil.setText(args.app.Type, args.data.Key, true);
                cintelUtil.setText(args.app.Value, getFullAddress(args.data.Value), true);
            }, this);
        }
    });
    return app;
});