<%@ Control Language="C#" Inherits="System.Web.UI.UserControl" %>
<%@ Import Namespace="Sitecore.ExperienceExplorer.Web.Controls" %>

<link rel="stylesheet" type="text/css" href="/sitecore modules/Web/ExperienceExplorer/Assets/css/experience-explorer.css" />

<div class="experience-explorer">
  <div class="panel editor">
    <span id="pageEditorHeader"></span>
    <button type="button" class="page-editor-button" onclick="javascript:window.top.location.href = <%= ExpExplorerExtender.BuildExperienceEditorUrl() %>';"><%= ExpExplorerExtender.GoToExperienceEditorText %></button>
    <a class="trigger" href="#"></a>
    <iframe scrolling="no" src="<%= ExpExplorerExtender.BuildEditorUrl() %>" id="IframeExperienceExplorerEditor" class="ee-iframe"></iframe>
  </div>
  <div class="panel viewer">
    <a class="trigger" href="#"></a>
    <iframe scrolling="no" src="<%= ExpExplorerExtender.BuildViewerUrl() %>" id="IframeExperienceExplorerViewer" class="ee-iframe"></iframe>
  </div>
</div>

<script src="/sitecore modules/Web/ExperienceExplorer/Assets/experience-explorer.min.js">
</script>
