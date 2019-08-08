<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="ConfigurationDiffSideBySide.aspx.cs" Inherits="Sitecore.Update.sitecore.admin.Wizard.ConfigurationDiffSideBySide" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>

    <link href="/sitecore/admin/Wizard/Lib/jsdifflib/diffview.css" rel="Stylesheet" />
    <link href="/sitecore/admin/Wizard/Lib/jquery.ui.1.7.3/jquery-ui.css" rel="Stylesheet" />
    <link href="/sitecore/admin/Wizard/ResolveConfigFileConflicts.css" rel="Stylesheet" />

    <script type="text/javascript" src="/sitecore/shell/Controls/lib/jQuery/jquery.js"></script>
    <script type="text/javascript" src="/sitecore/shell/controls/webframework/webframework.js"></script>
</head>
<body>
    <form runat="server">
        <asp:ScriptManager ID="ScriptManager" runat="server">
        </asp:ScriptManager>
        <img src="/sitecore/admin/Wizard/Images/ajax-loader.gif" style="position: absolute; top: -1000px;" />
        <div id="header">
            <asp:Label runat="server" ID="HeaderText"></asp:Label>
        </div>
        <div class="expandable">
            <div class="expandable-header">
                <a href="#">Display options</a>
            </div>
            <div class="expandable-content">
                <div>
                    <input type="radio" name="DisplayOptions" checked="checked" id="ContextSizeRadio" class="expandable-content-number" value="false" />
                    <label for="ContextSizeRadio" class="expandable-content-label">Show 5 rows before and after changes.</label>
                </div>
                <div>
                    <input type="radio" name="DisplayOptions" id="ShowFullFileRadio" class="expandable-content-checkbox" value="true" />
                    <label for="ShowFullFileRadio" class="expandable-content-label">Show all file.</label>
                </div>
            </div>
        </div>
        <asp:Panel runat="server" ID="ConflictDetailsPanel">
            <div class="difftitle">Differences between the original file and the customized file</div>
            <div class="diff-wrapper">
                <div class="diff-progress"></div>
                <div id="diffcontainer" class="xmlContainer">
                </div>
            </div>
            <div class="legend-wrapper">
                <table class="difflegend">
                    <tr>
                        <td class="color">
                            <div class="original"></div>
                        </td>
                        <td class="description">Removed fragment</td>
                        <td class="color">
                            <div class="custom"></div>
                        </td>
                        <td class="description">Added fragment</td>
                        <td class="color">
                            <div class="modified"></div>
                        </td>
                        <td class="description">Modified fragment</td>
                    </tr>
                </table>
            </div>
        </asp:Panel>
        <asp:HiddenField ID="SourceFile" runat="server" />
        <asp:HiddenField ID="TargetFile" runat="server" />
        <script src="/sitecore/admin/Wizard/Lib/jsdifflib/diffview.js" type="text/javascript"></script>
        <script src="/sitecore/admin/Wizard/Lib/jsdifflib/difflib.js" type="text/javascript"></script>
        <script src="/sitecore/admin/Wizard/Lib/jquery.ui.1.7.3/jquery-ui.min.js" type="text/javascript"></script>
        <script src="/sitecore/admin/Wizard/ResolveConfigFileConflicts.js" type="text/javascript"></script>
        <script type="text/javascript">
            $('.expandable .expandable-header').click(function () {
                $('.expandable .expandable-content').slideToggle('slow');
            });


            $('input:radio[name="DisplayOptions"]').change(
                function () {
                    $("#diffcontainer").empty();
                    var defaultDiffContextSize = 5;
                    var contextLength = $(this).val() === 'true' ? undefined : defaultDiffContextSize;
                    showConflict(contextLength, 0);
                }
            );
        </script>
    </form>
</body>
</html>
