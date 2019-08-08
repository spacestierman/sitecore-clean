var ExpApp = function () {

  var self = this;
  self.model = {};

  self.getModel = function () {
    jQuery.getJSON("/eeapi/experienceexplorer/get", function (data) {
      self.model = data;
      self.bindModel();
    });
  };

  self.updateModel = function () {

    function getParameterByName(name, url) {
      name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
      var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(url);
      return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    if (self.model.PresetId == undefined) {
      var presetId = getParameterByName("presetId", location.search);;
      self.model.PresetId = presetId;
    }

    var antiForgeryToken = $('input[name=__RequestVerificationToken]', window.parent.document).val();

    jQuery.ajax({
      url: "/sitecore/api/ssc/experienceexplorer/updateservice/model/update",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(self.model),
      headers: {
          'X-RequestVerificationToken': antiForgeryToken
      }
    })
    .success(function () {
      console.log("update model: done");
      window.parent.location.reload();
    })
    .fail(function (data) {
      alert(data.responseJSON.ExceptionMessage);
      var btn = jQuery('#btn_apply');
      btn.removeAttr('disabled');
      btn.html(SettingsPanelTranslations.applyText);
    });
  };
};