<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="MessageStatistics.aspx.cs" Inherits="Sitecore.EmailCampaign.Cm.UI.sitecore.admin.MessageStatistics" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
</head>
<body>
    <form id="form1" runat="server">
    <div>
        <p>
            Message IDs: <asp:TextBox runat="server" id="txtMessageIds" /> <asp:Button runat="server" Text="Process message(s)" OnClick="Messages_Click"/><br/>
        </p>
        <p>
            <asp:Button runat="server" Text="Process messages from today" OnClick="MessagesToday_Click"/><br/>
            <asp:Button runat="server" Text="Process messages from this week" OnClick="MessagesRecent_Click"/><br/>
            <asp:Button runat="server" Text="Process messages older than a week" OnClick="MessagesOlder_Click"/><br/>
            <asp:Button runat="server" Text="Process missing messages" OnClick="MessagesMissing_Click"/><br/>
            <asp:Button runat="server" Text="Upgrade" OnClick="Upgrade_Click" /><br/>
        </p>
    </div>
    </form>
</body>
</html>
