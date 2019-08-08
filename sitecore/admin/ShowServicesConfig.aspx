<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="ShowServicesConfig.aspx.cs" Inherits="Sitecore.sitecore.admin.ShowServicesConfig" %>
<!DOCTYPE html>
<html>
<head runat="server">
  <title>Services configuration</title>
  <link rel="shortcut icon" href="/sitecore/images/favicon.ico" />
  <link rel="Stylesheet" type="text/css" href="/sitecore/shell/themes/standard/default/WebFramework.css" />
</head>
<body>
  <form runat="server" class="wf-container" id="ServicesForm" style="width: 100%">
    <div class="wf-content" style="padding: 10px">
      <h2>Dependency Injection Configuration</h2>
      <p class="ws-subtitle">Shows the configured services. For detailed information use details=1 query.</p>
      <asp:Repeater id="FinalConfigurationRepeater" runat="server">
            <HeaderTemplate>
              <h2>Final configuration:</h2>
               <table width="100%" border="1">
                 <caption></caption>
                  <tr>
                     <td><b>Service Type</b></td>
                     <td><b>Service Implementation</b></td>
                     <td><b>Lifetime</b></td>
                  </tr>
            </HeaderTemplate>
        <ItemTemplate>
        <tr>
          <td><%#DataBinder.Eval(Container.DataItem, "ServiceType")%></td>
          <td><%#DataBinder.Eval(Container.DataItem, "ServiceImplementation")%></td>
          <td><%#DataBinder.Eval(Container.DataItem, "Lifetime")%></td>
        </tr>
        </ItemTemplate>
        <FooterTemplate>
          </table>
        </FooterTemplate>
      </asp:Repeater>

      <asp:Repeater id="DetailedConfigurationRepeater" runat="server" Visible="False">
            <HeaderTemplate>
               <h2>Detailed configuration:</h2>
               <table width="100%" border="1">
                  <tr>
                     <td><b>Service Type</b></td>
                     <td><b>Service Implementaion</b></td>
                     <td><b>Lifetime</b></td>
                     <td><b>Source</b></td>
                     <td><b>Operation</b></td>
                  </tr>
            </HeaderTemplate>
        <ItemTemplate>
        <tr>
          <td><%#DataBinder.Eval(Container.DataItem, "ServiceType")%></td>
          <td><%#DataBinder.Eval(Container.DataItem, "ServiceImplementation")%></td>
          <td><%#DataBinder.Eval(Container.DataItem, "Lifetime")%></td>
          <td><%#DataBinder.Eval(Container.DataItem, "Source")%></td>
          <td><%#DataBinder.Eval(Container.DataItem, "Operation")%></td>
        </tr>
        </ItemTemplate>
        <FooterTemplate>
          </table>
        </FooterTemplate>
      </asp:Repeater>
    </div>
  </form>
</body>
</html>
