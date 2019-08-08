var exp;
var page;
var debugging = false; // or true 
var validationSucceeded = true;
var validationErrorMessage = "";

//init
jQuery(document).ready(function () {
    exp = new ExpApp();
    page = new PageModel();
    page.initialize();
});

var PageModel = function () {
  var self = this;

    self.initialize = function () {
        self.setupUi();
        self.bindModel();
    };

    self.getPreset = function () {
        var presetId = jQuery("#ExperienceExplorerPresets .item-inner.selected").attr("data-id");
        exp.model.PresetId = presetId;
    };

    self.getCurrentSelectedMode = function () {
      return jQuery('#ExperienceJourneyMode > .active').attr("data-val");
    };

    var selectedMode = self.getCurrentSelectedMode();

    self.setupUi = function () {
        // Setup buttons
        jQuery(".experience-explorer-iframe-editor .btn")
            .button()
            .click(function (event) {
                event.preventDefault();
            });

        jQuery('#btn_apply').children(":first").html('Wait...');

        jQuery('#btn_apply').click(function () {

            var btn = jQuery(this);
            btn.attr('disabled', 'disabled');
            btn.html(SettingsPanelTranslations.waitText );
            jQuery(document).trigger('eeEditClick');

            exp.updateModel();
        });

        jQuery('#btn_reset').click(function () {
            self.getPreset();
            exp.model.JourneyMode = selectedMode;
            exp.model.Reset = true;
            exp.updateModel();
        });

    };

    self.bindModel = function () {
        //Presets
      jQuery(document).bind('eeEditClick', function () {
            self.getPreset();
        });

        //Mode
      jQuery(document).bind('eeEditClick', function () {
            var selected = jQuery('#ExperienceJourneyMode > .active').attr("data-val");
            exp.model.JourneyMode = selected;
        });

        //Profiles
      jQuery(document).bind('eeEditClick', function () {
          var profiles = [];

          var jqProfiles = jQuery('.profile-block');

          if (jqProfiles.length > 0) {

            jQuery.each(jqProfiles, function (jqProfileIndex, jqProfileItem) {
              var profileKeys = [];

              var name = jQuery(jqProfileItem).attr("data-name");

              var jqProfilesValues = jQuery(jqProfileItem).find("input");

              jQuery.each(jqProfilesValues, function (jqProfileValueIndex, jqProfileValueItem) {

                var profileKey = jQuery(jqProfileValueItem).attr("data-name");
                var profileValue = jQuery(jqProfileValueItem).val();

                if (!isNaN(profileValue)) {
                  if (profileValue.length == 0) {
                    profileValue = "0";
                  }

                  profileKeys.push({
                    key: profileKey,
                    value: profileValue
                  });
                }
              });

              profiles.push(
                  {
                    name: name,
                    profileKeys: profileKeys
                  });
            });

            exp.model.Profiles = profiles;
          }
        });

        //Goals
        jQuery(document).bind('eeEditClick', function () {
            if (debugging && typeof console !== "undefined")
                console.log("experience explorer: goals - apply");

            var selectedGoals = [];
            var goals = jQuery('[data-autocomplete="goals-autocomplete"] input');

            if (goals.length > 0) {
                exp.model.Goals = [];
                jQuery(goals).each(function () {
                    if (this.checked) {
                        selectedGoals.push(this.value);
                    }
                });

                exp.model.Goals = selectedGoals;
                if (debugging && typeof console !== "undefined")
                    console.log('experience explorer: goals - completed');

            } else {
                if (debugging && typeof console !== "undefined")
                    console.log('experience explorer: goals - no elements found');
            }
        });

        //Events    
        jQuery(document).bind('eeEditClick', function () {
            var selectedEvents = [];
            var events = jQuery('[data-autocomplete="events-autocomplete"] input');

            if (events.length > 0) {
                exp.model.PageEvents = [];
                jQuery(events).each(function () {
                    if (this.checked) {
                        selectedEvents.push(this.value);
                    } 
                });

                exp.model.PageEvents = selectedEvents;
            }
        });

        //Device
        jQuery(document).bind('eeEditClick', function () {
            if (debugging && typeof console !== "undefined")
                console.log("experience explorer: device - apply");

            var selected = jQuery("#ExperinceExplorerDevices option:selected");
            if (selected.length > 0) {
                exp.model.Device = selected.val();

                if (debugging && typeof console !== "undefined")
                    console.log("experience explorer: device - completed");
            }
            else {
                if (debugging && typeof console !== "undefined")
                    console.log('experience explorer: device - no elements found');
            }
        });

        //GeoIP
        jQuery(document).bind('eeEditClick', function () {
            var selectedType = jQuery('.active[data-toggle=geo-type]').attr("data-source");

            switch (selectedType) {
                case "#MapArea": geoIpMap(); break;
                case "#CountryArea": geoIpCountry(); break;
                case "#IpArea": geoIpIp(); break;
                default: setIpOnApply(); break;
            }

            function geoIpMap() {

                var geoIpMap = jQuery();
                var geoLatitude = jQuery('#GeoLatitude');
                var geoLongitude = jQuery('#GeoLongitude');

              if (geoLatitude.length > 0 && geoLatitude.val() != "") {
                var latitude = geoLatitude.val();
                if (!isNaN(latitude)) {
                  geoIpMap.latitude = latitude.replace(",", ".");
                }
              }

              if (geoLongitude.length > 0 && geoLongitude.val() != "") {
                var longitude = geoLongitude.val();
                if (!isNaN(longitude)) {
                  geoIpMap.longitude = longitude.replace(",", ".");
                }
              }

              exp.model.GeoIp = geoIpMap;
            }

            function geoIpCountry() {

                var geoIpCountry = jQuery();
                var geoCountry = jQuery('#GeoCountryName option:selected');

                if (geoCountry.length > 0 && geoCountry.val() != "")
                    geoIpCountry.country = geoCountry.val();

                exp.model.GeoIp = geoIpCountry;
            }

            function geoIpIp() {
                var geoIpIp = jQuery();
                var geoIpCode = jQuery('#GeoIp');

                if (geoIpCode.length > 0 && geoIpCode.val() != "")
                  geoIpIp.ip = geoIpCode.val();

                exp.model.GeoIp = geoIpIp;
            }

            function getParameterByName(name, url) {
              name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
              var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                  results = regex.exec(url);
              return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
            }

            function SetCurrentPresetIp() {
              var self = this;
              var url = "/sitecore/api/ssc/experienceexplorer/contentservice/content/getcontent";
              var itemUri = getParameterByName("itemUri", location.search);
              var deviceId = getParameterByName("deviceId", location.search);
              var visitPageCount = getParameterByName("visitPageCount", location.search);
              var antiForgeryToken = $('input[name=__RequestVerificationToken]', window.parent.document).val();

              $.ajax({
                url: url + "/?controlId=A504C987889C431394E218B21A5588A8&deviceId=" + deviceId + "&itemUri=" + encodeURIComponent(itemUri) + "&visitPageCount=" + visitPageCount,
                type: "GET",
                dataType: "json",
                contentType: "application/json",
                headers: {
                    'X-RequestVerificationToken': antiForgeryToken
                }
              })
				.success(function (data) {
                  if (self.id != null) {

                    var template = $.templates("#" + "A504C987889C431394E218B21A5588A8" + "_view");
                    var object = { itemData: data };

                    template.link("#" + "A504C987889C431394E218B21A5588A8", object);

                    var geoIp = jQuery();
                    geoIp.ip = data.Ip;
                    geoIp.latitude = data.Latitude;
                    geoIp.longitude = data.Longitude;

                    exp.model.GeoIp = geoIp;
                  }
                });
            };

            function setIpOnApply() {
                SetCurrentPresetIp();
            }
        });

        //Campaigns 
        jQuery(document).bind('eeEditClick', function (e) {
            if (debugging && typeof console !== "undefined")
                console.log("experience explorer: campaigns - apply");

            var campaigns = [];

            var selectedCampaigns = jQuery('[data-autocomplete="campaigns-autocomplete"] input:checked');
            if (selectedCampaigns.length > 0) {
                jQuery(selectedCampaigns).each(function () {
                    campaigns.push(this.value);
                });

                exp.model.Campaigns = campaigns;
                if (debugging && typeof console !== "undefined")
                    console.log('experience explorer: campaigns - completed');
            }
            else {
                if (debugging && typeof console !== "undefined")
                    console.log('experience explorer: campaigns - no elements found');
            }

        });

        //Referral
        jQuery(document).bind('eeEditClick', function (e) {
            if (debugging && typeof console !== "undefined")
                console.log("experience explorer: referrals - apply");

            var tbReferrer = jQuery('#Referral');

            if (tbReferrer.length > 0) {

                if (tbReferrer.val() != "") {
                    exp.model.Referrer = tbReferrer.val();
                }
                if (debugging && typeof console !== "undefined")
                    console.log('experience explorer: referrals - completed');

            } else {
                if (debugging && typeof console !== "undefined")
                    console.log('experience explorer: referrals - no elements found');
            }
        });
    };

};
