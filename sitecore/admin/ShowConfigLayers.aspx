<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="ShowConfigLayers.aspx.cs" Inherits="Sitecore.sitecore.admin.ShowConfigLayers" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title>Configuration layers</title>

    <style type="text/css">
        #ConfigPage
        {
            width: 100%;
        }

        h1
        {
            color: #0033BC;
            font-size: 18px;
            font-weight: normal;
        }

        #roles-list-wrapper {
            margin-bottom: 10px;
            
        }

        .layer-list {
            list-style-type: none;
            padding-left: 25px;
        }

        .layer-name
        {
            text-decoration: none;
            color: black;
            font-size: 13pt;
        }

            .layer-name:hover
            {
                cursor: pointer;
                text-decoration: underline;
            }
    </style>

    <script type="text/javascript">
        function setIframeHeight(iframe) {
            if (iframe) {
                var iframeWindow = iframe.contentWindow || iframe.contentDocument.parentWindow;
                if (iframeWindow.document.body) {
                    iframe.height = iframeWindow.document.body.scrollHeight + 20;
                    return;
                }

                if (iframeWindow.document.documentElement) {
                    iframe.height = iframeWindow.document.documentElement.scrollHeight + 20;
                }
            }
        }
    </script>
</head>
<body>
    <form runat="server">
        <h1>Configuration layers</h1>
        <asp:Repeater ID="LayersRepeater" runat="server" OnItemDataBound="LayersRepeater_OnItemDataBound" EnableViewState="True">
            <ItemTemplate>
                <div>
                    <asp:CheckBox runat="server" ID="LayerCheckBox" OnCheckedChanged="LayerCheckBox_OnCheckedChanged" AutoPostBack="True" />
                    <asp:LinkButton runat="server" ID="LayerName" CssClass="layer-name" OnClick="LayerLabel_OnClick" ToolTip="Click to show layer details"></asp:LinkButton>
                    <asp:BulletedList runat="server" ID="FilesList" CssClass="layer-list" Visible="False" />
                </div>
            </ItemTemplate>
        </asp:Repeater>

        <h1>Configuration roles</h1>
        <div id="roles-list-wrapper">
            <asp:ListBox runat="server" ID="RolesList" Rows="5" Width="200px" SelectionMode="Multiple" AutoPostBack="True" OnSelectedIndexChanged="RolesList_OnSelectedIndexChanged">
                <asp:ListItem>Standalone</asp:ListItem>
                <asp:ListItem>ContentManagement</asp:ListItem>
                <asp:ListItem>ContentDelivery</asp:ListItem>
                <asp:ListItem>Processing</asp:ListItem>
                <asp:ListItem>Reporting</asp:ListItem>
            </asp:ListBox>
        </div>
        <asp:TextBox runat="server" ID="RoleTextBox" Width="195px"></asp:TextBox>
        <asp:Button runat="server" ID="AddRoleButton" Text="Add role" OnClick="AddRoleButton_OnClick" />

        <h1>Configuration result</h1>
        <div id="ConfigPageWrapper">
            <iframe runat="server" clientidmode="Static" id="ConfigPage" scrolling="no"></iframe>
        </div>

        <asp:HyperLink Text="Click to see result configuration" runat="server" ID="ConfigPageLink" Target="_blank" Visible="False"></asp:HyperLink>
    </form>
</body>
</html>