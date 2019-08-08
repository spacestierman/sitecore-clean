<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="ExpEditor.aspx.cs" Inherits="Sitecore.ExperienceExplorer.Web.Controls.ExpEditor1" %>
<%@ Import Namespace="Sitecore.ExperienceExplorer.Core" %>
<%@ Import Namespace="Sitecore.Data.Items" %>


<%@ Register Src="~/sitecore modules/Web/ExperienceExplorer/Controls/ExpHeader.ascx" TagPrefix="expExplorer" TagName="ExpHeader" %>
<%@ Register Src="~/sitecore modules/Web/ExperienceExplorer/Controls/ExpFooter.ascx" TagPrefix="expExplorer" TagName="ExpFooter" %>

<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
  
<head runat="server">
  <title>Experience Editor</title>
  <expExplorer:ExpHeader runat="server" ID="expHeader" />
  <link rel="stylesheet" type="text/css" href="/sitecore modules/Web/ExperienceExplorer/Assets/css/experience-explorer-iframe-editor.css" />
  <script type="text/javascript">
      var SettingsPanelTranslations = {
          applyText: "<%= ApplyText %>",
          resetText: "<%= ResetText %>",
          waitText: "<%= WaitText %>"
      };
  </script>
</head>
<body data-spy="scroll" data-target=".bs-docs-sidebar" class="sc ">
  <form id="form1" runat="server">
    <div class="experience-explorer-iframe experience-explorer-iframe-editor">
      <div id="frame-header">
        <table class="mode-table table border-bottom">
          <tbody>
            <tr>
              <td style="display: none;">
                <div class="page-editor-place"></div>
              </td>
              <td>
                <div class="mode">
                  <span id="ExperienceJourneyMode">
                    <input id="JournayBtn" runat="server" type="button" class="btn icon-journey" data-val="Journey" />
                    <input id="FixedBtn" runat="server" type="button" class="btn icon-fixed" data-val="Fixed" />
                  </span>
                  <asp:Label ID="lblModeFixed" CssClass="mode-title hidden" for="FixedBtn" runat="server"></asp:Label>
                  <asp:Label ID="lblModeJournay" CssClass="mode-title hidden" for="JournayBtn" runat="server"></asp:Label>
                </div>
              </td>
              <td class="text-right">
                <span id="litEditorSpan" class="font-xlarge hidden light">
                  <asp:Literal ID="litEditor" runat="server" /></span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div id="accordions-editor">
        <asp:Repeater runat="server" ID="rpAccordion" OnItemDataBound="rpAccordion_OnItemDataBound">

          <ItemTemplate>
            <div id="accordion" class="sc-advancedExpander accordion-group" runat="server">
              <div class="sc-advancedExpander-header accordion-heading">
                <a data-parent="#accordions-editor" data-toggle="collapse" class="sc-advancedExpander-header-title accordion-toggle" id="accordionLink" runat="server">
                  <asp:Literal ID="litAccordionName" runat="server" />
                    <div class="sc-expander-chevron chevron"></div>
                </a>
              </div>

              <!-- tabs start -->
              <div id="accordions_body" class="sc-advancedExpander-body accordion-body" runat="server">
                <div class="accordion-inner">
                  <div class="sc-tabcontrol tabbable">
                    <asp:Repeater runat="server" ID="rpTabs" OnItemDataBound="tabs_OnItemDataBound">
                      <HeaderTemplate>
                        <ul class="sc-tabcontrol-navigation nav nav-tabs">
                      </HeaderTemplate>
                      <ItemTemplate>
                        <li id="liItem" runat="server">
                          <a data-toggle="tab" id="tabLink" runat="server">
                            <asp:Literal runat="server" ID="litTabName" />
                          </a>
                        </li>
                      </ItemTemplate>
                      <FooterTemplate></ul></FooterTemplate>
                    </asp:Repeater>


                    <!-- controls -->
                    <asp:Repeater runat="server" ID="rpControls">
                      <HeaderTemplate>
                        <div class="tab-content">
                      </HeaderTemplate>
                      <ItemTemplate>
                        <div id="<%# ((Item) Container.DataItem).ID.ToShortID().ToString() %>" data-input-model-name="<%# ((Item) Container.DataItem).Name %>" class="tab-pane"></div>
                      </ItemTemplate>
                      <FooterTemplate>
                        </div>
                      </FooterTemplate>
                    </asp:Repeater>
                    <!-- controls end -->

                  </div>
                </div>
              </div>
              <!-- tabs end -->

            </div>
          </ItemTemplate>

        </asp:Repeater>
      </div>

      <div class="footer-panel" id="footer-panel">
        <table class="table border-none">
          <tbody>
            <tr>
              <td style="text-align: right;">
                <button class="btn sc-button btn-primary tile-teal" id="btn_apply">
                  <asp:Literal runat="server" ID="btnApply" />
                </button>
                <button class="btn sc-button btn-default tile-teal" id="btn_reset">
                  <asp:Literal runat="server" ID="btnReset" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </form>

  <!-- *****************EDITOR********************* -->

  <!-- PRESET -->
  <script id="B9888CAF0CB34C4C8B8445D1A365D2AB_view" type="text/x-jsrender">
        <fieldset class="tab-fieldset">
            {{include tmpl="#HeaderTmpl" ~Title="<%= Translate(Texts.PresetEditorTitle) %>" ~Description="<%= Translate(Texts.PresetEditorDescription) %>" ~QuestionMark="<%= Translate(Texts.PresetEditorQuestionMark) %>" /}}

            <ul id="ExperienceExplorerPresets" class="jcarousel-skin-tango">
                {{for itemData.Source}}
                    <li class="item">{{if Selected}}
                            <a class="item-inner selected" data-id="{{:ID}}" href="#" title="{{:Name}}">
                                <img src="/sitecore modules/Web/ExperienceExplorer/Assets/images/con-tick.png" class="tick" width="15" height="15" />
                                <img alt="{{:Name}}" src="{{:Icon}}" width="75" />
                                <span class="name">{{:Name}}</span>
                            </a>
                        {{else}}
                            <a class="item-inner" href="#" data-id="{{:ID}}" title="{{:Name}}">
                                <img src="/sitecore modules/Web/ExperienceExplorer/Assets/images/con-tick.png" class="tick" width="15" height="15" />
                                <img alt="{{:Name}}" src="{{:Icon}}" width="75" />
                                <span class="name">{{:Name}}</span>
                            </a>
                        {{/if}}
                    </li>
                {{/for}}
            </ul>
        </fieldset>
  </script>

  <!-- PROFILES -->
  <script id="C8D760A27CA9405C8869CC1BD221CC28_view" type="text/x-jsrender">
        <fieldset class="tab-fieldset">
            {{include tmpl="#HeaderTmpl" ~Description="<%= Translate(Texts.ProfileEditorDescription) %>" ~QuestionMark="<%= Translate(Texts.ProfileEditorQuestionMark) %>" /}}

            {{for itemData.Source}}
                <div class="profile-block" data-name="{{:Name}}">
                    <legend class="font-large no-margin">{{:Name}}</legend>
                    <table class="table border-none table-condensed no-margin">
                        <tbody>
                            {{for ProfileKeys}}
                                <tr>
                                    <td>
                                        <label class="profile-block-title">{{:Key}}:</label></td>
                                    <td>
                                        <input class="sc-textbox  form-control input-tiny no-margin input-shallow" type="text" value="{{:Value}}" data-name="{{:Key}}" /></td>
                                </tr>
                            {{/for}}
                        </tbody>
                    </table>
                </div>
            {{/for}}

        </fieldset>
  </script>

  <!-- GOALS -->
  <script id="F634E7D68F2A4DB094C73F817A00731E_view" type="text/x-jsrender">
        <fieldset class="tab-fieldset">
            {{include tmpl="#HeaderTmpl" ~Description="<%= Translate(Texts.GoalEditorDescription) %>" ~QuestionMark="<%= Translate(Texts.GoalEditorQuestionMark) %>" /}}
            
            <input data-toggle="goals-autocomplete" placeholder="<%= Translate(Texts.GoalEditorWaterMark) %>" class="sc-textbox  form-control" type="text" />
            <ul data-autocomplete="goals-autocomplete" class="unstyled">
                {{for itemData.Source}}
                <li>
                    <label class="control" id="Goal_{{:#index}}">
                        {{if Selected}}
                            <input value="{{:Id}}" type="checkbox" checked="checked" />
                        {{else}}
                            <input value="{{:Id}}" type="checkbox" />
                        {{/if}}
                        <small><span class="listitem-name">{{:Name}}</span></small>
                    </label>
                </li>
                {{/for}}
            </ul>

        </fieldset>
  </script>

  <!-- PageEvents -->
  <script id="1C9D09BB75A34573BA209EFC0A296152_view" type="text/x-jsrender">
        <fieldset class="tab-fieldset">
            {{include tmpl="#HeaderTmpl" ~Description="<%= Translate(Texts.PageEventEditorDescription) %>" ~QuestionMark="<%= Translate(Texts.PageEventEditorQuestionMark) %>" /}}
            
            <input data-toggle="events-autocomplete" placeholder="<%= Translate(Texts.PageEventEditorSearchWaterMark) %>" class="sc-textbox  form-control" type="text" />
            <ul data-autocomplete="events-autocomplete" class="unstyled" style="margin-top: 10px;">
                {{for itemData.Source}}
                <li>
                    <label class="control" id="Event_{{:#index}}">
                        {{if Selected}}
                            <input value="{{:Id}}" type="checkbox" checked="checked" />
                        {{else}}
                            <input value="{{:Id}}" type="checkbox" />
                        {{/if}}
                        <small><span class="listitem-name">{{:Name}}</span></small>
                    </label>
                </li>
                {{/for}}
            </ul>

        </fieldset>
  </script>

  <!-- DEVICE -->
  <script id="FD59DF075B0F4DACB13293CB217C2393_view" type="text/x-jsrender">
        <fieldset class="tab-fieldset">
            {{include tmpl="#HeaderTmpl" ~Description="<%= Translate(Texts.DeviceEditorDescription) %>" ~QuestionMark="<%= Translate(Texts.DeviceEditorQuestionMark) %>" /}}
            
            <select class="form-control sc-combobox input-xlarge device-dropdown" id="ExperinceExplorerDevices">
                {{for itemData.Source}}
                    {{if Selected}}
                        <option value="{{:Id}}" selected="selected">{{:Name}}</option>
                {{else}}
                        <option value="{{:Id}}">{{:Name}}</option>
                {{/if}}
                {{/for}}

            </select>
        </fieldset>
  </script>

  <!-- GEO -->
  <script id="A504C987889C431394E218B21A5588A8_view" type="text/x-jsrender">
        <fieldset class="tab-fieldset">
            {{include tmpl="#HeaderTmpl" ~Description="<%= Translate(Texts.GeoEditorDescription) %>" ~QuestionMark="<%= Translate(Texts.GeoEditorQuestionMark) %>" /}}
            
            <div class="geo-ip">
                <p><a id="link_testgeo" class="link_testgeo" href="#GeoResult"><%= Translate(Texts.GeoTestMaxmind) %></a></p>
                <div class="test-result" id="GeoResult"></div>

                {{for itemData.Source}}
                    <div class="type-switch">
                        <div class="links">
                            <a href="#" data-source="#MapArea" class="btn" data-toggle="geo-type"><%= Translate(Texts.MapTabTitle) %></a>
                            <a href="#" data-source="#CountryArea" class="btn" data-toggle="geo-type"><%= Translate(Texts.CountryTabTitle) %></a>
                            <a href="#" data-source="#IpArea" class="btn" data-toggle="geo-type"><%= Translate(Texts.IpTabTitle) %></a>
                        </div>
                        <div class="type-switch-data">
                            <div id="MapArea" class="geo-ip-data collpase-geo">
                                
                                {{if MapProvider}}
                                    <div id="Map" class="map" data-name="{{:MapProvider.Name}}" data-api-key="{{:MapProvider.ApiKey}}" data-draggable="true"></div>
                                {{/if}}

                                <label for="GeoLatitude"><%= Translate(Texts.Latitude) %></label>
                                <input type="text" class="form-control sc-textbox input-large input-shallow" id="GeoLatitude" value="{{:GeoIp.Latitude}}" />

                                <label for="GeoLongitude"><%= Translate(Texts.Longitude) %></label>
                                <input type="text" class="form-control sc-textbox input-large input-shallow" id="GeoLongitude" value="{{:GeoIp.Longitude}}" />
                            </div>
                            <div id="CountryArea" class="geo-ip-data collpase-geo">
                                <label for="GeoCountryName"><%= Translate(Texts.Country) %></label>
                                <select id="GeoCountryName" class="form-control sc-combobox input-xlarge">
                                    {{for Countries}}
                                        {{if Selected}}
                                            <option value="{{:CountryCode}}" selected="selected">{{:Name}}</option>
                                    {{else}}
                                            <option value="{{:CountryCode}}">{{:Name}}</option>
                                    {{/if}}
                                    {{/for}}
                                </select>
                            </div>
                            <div id="IpArea" class="geo-ip-data collpase-geo">
                                <label for="GeoIp"><%= Translate(Texts.Ip) %></label>
                                <input type="text" class="form-control sc-textbox input-large input-shallow" id="GeoIp" value="{{:GeoIp.Ip}}" />

                                <label for="GeoCountry"><%= Translate(Texts.CountryCode) %></label>
                                <input type="text" class="form-control sc-textbox input-large input-shallow uneditable-input" id="GeoCountry" value="{{:GeoIp.Country}}" readonly="true" />

                                <label for="GeoAreaCode"><%= Translate(Texts.AreaCode) %></label>
                                <input type="text" class="form-control sc-textbox input-large input-shallow uneditable-input" id="GeoAreaCode" value="{{:GeoIp.AreaCode}}" readonly="true" />

                                <label for="GeoCity"><%= Translate(Texts.City) %></label>
                                <input type="text" class="form-control sc-textbox input-large input-shallow uneditable-input" id="GeoCity" value="{{:GeoIp.City}}" readonly="true" />

                                <label for="GeoPostalCode"><%= Translate(Texts.PostalCode) %></label>
                                <input type="text" class="form-control sc-textbox input-large input-shallow uneditable-input" id="GeoPostalCode" value="{{:GeoIp.PostalCode}}" readonly="true" />

                                <label for="GeoBusinessname"><%= Translate(Texts.BusinessName) %></label>
                                <input type="text" class="form-control sc-textbox input-large input-shallow uneditable-input" id="GeoBusinessname" value="{{:GeoIp.BusinessName}}" readonly="true" />

                                <label for="GeoMetroCode"><%= Translate(Texts.MetroCode) %></label>
                                <input type="text" class="form-control sc-textbox input-large input-shallow uneditable-input" id="GeoMetroCode" value="{{:GeoIp.MetroCode}}" readonly="true" />

                                <label for="GeoIspName"><%= Translate(Texts.ISP) %></label>
                                <input type="text" class="form-control sc-textbox input-large input-shallow uneditable-input" id="GeoIspName" value="{{:GeoIp.IspName}}" readonly="true" />
                            </div>
                        </div>
                    </div>
                {{/for}}
            </div>

        </fieldset>
  </script>

  <!-- CAMPAIGNS -->
  <script id="23B8BA9DF3164FC9B6B81A8AF701506D_view" type="text/x-jsrender">
        <fieldset class="tab-fieldset">
            {{include tmpl="#HeaderTmpl" ~Description="<%= Translate(Texts.CampaignsEditorDescription) %>" ~QuestionMark="<%= Translate(Texts.CampaignsEditorQuestionMark) %>" /}}
            <input data-toggle="campaigns-autocomplete" placeholder="<%= Translate(Texts.CampaignsEditorSearchWaterMark) %>" class="campaign-search sc-textbox  form-control" type="text" />
            <ul data-autocomplete="campaigns-autocomplete" class="unstyled">
                {{for itemData.Source}}
                <li>
                    <label class="control" id="Campaign_{{:#index}}">
                      <table>
                        <tbody>
                          <tr>
                            <td style="width: 15px;">
                              {{if Selected}}
                                  <input value="{{:Id}}" name="campaign-value" type="radio" checked="checked" />
                              {{else}}
                                  <input value="{{:Id}}" name="campaign-value" type="radio" />
                              {{/if}}
                            </td>
                            <td>
                              <small><span class="listitem-name">{{:Name}}</span></small>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </label>
                </li>
                {{/for}}
            </ul>

        </fieldset>
  </script>

  <!-- REFERRALS -->
  <script id="953F06891F2545EF87F8376D9D07702B_view" type="text/x-jsrender">
        <fieldset class="tab-fieldset">
            {{include tmpl="#HeaderTmpl" ~Description="<%= Translate(Texts.ReferralEditorDescription) %>" ~QuestionMark="<%= Translate(Texts.ReferralEditorQuestionMark) %>" /}}
            
            <input type="text" placeholder="<%= Translate(Texts.ReferralEditorWaterMark) %>" class="form-control sc-textbox input-large" id="Referral" value="{{:itemData.Source}}" />
        </fieldset>
  </script>

  <expExplorer:ExpFooter runat="server" ID="expFooter" />
</body>
</html>
