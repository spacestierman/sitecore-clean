<%@ Control Language="C#" AutoEventWireup="true" CodeBehind="GlobalHeader.ascx.cs" Inherits="Sitecore.ExperienceExplorer.Web.Controls.GlobalHeader" %>

<link type="text/css" rel="stylesheet" href="/sitecore/shell/Themes/Standard/Default/GlobalHeader.css" />
<link type="text/css" rel="stylesheet" href="/sitecore modules/Web/ExperienceExplorer/Assets/css/experience-explorer-global-header.css" />

<% = AntiForgeryHtml %>
<div id="scCrossPiece"></div>
<header class="sc-globalHeader">
  <div class="sc-globalHeader-content">
    <div class="col2">
      <div class="sc-globalHeader-startButton">
        <a class="sc-global-logo" href="#" onclick='javascript:$.get("/?sc_mode=edit", function() { window.location = "/sitecore/shell/sitecore/client/Applications/LaunchPad"; });'></a>
          <div class="sc-globalheader-appName"><%= ApplicationNameText %></div>
      </div>
    </div>
    <div class="col2">
      <div class="sc-globalHeader-loginInfo">
        <ul class="sc-accountInformation">
          <li>
            <span class="logout" onclick='javascript:$.post("/sitecore/shell/api/sitecore/Authentication/Logout?sc_database=master", $("[name=__RequestVerificationToken]"), function() { window.location.reload(); });'>
              <%= LogoutText %>
            </span>
          </li>
          <li>
            <%= RealUserName %>
            <img src="<%= UserPortraitUrl %>" />
          </li>
        </ul>
      </div>
    </div>
  </div>
</header>
