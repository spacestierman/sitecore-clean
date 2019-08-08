<%@ Page Language="C#" Async="true" AutoEventWireup="true" %>

<%@ Import Namespace="Sitecore.Analytics.Aggregation.History" %>
<%@ Import Namespace="Sitecore.Analytics.Aggregation.History.Remoting" %>
<%@ Import Namespace="Sitecore.Analytics.Core.Data" %>
<%@ Import Namespace="Sitecore.Configuration" %>
<%@ Import Namespace="Sitecore.Diagnostics" %>
<%@ Import Namespace="Sitecore.Security.Accounts" %>
<%@ Import Namespace="Sitecore.Sites" %>
<%@ Import Namespace="Sitecore.Xdb.Configuration" %>
<%@ Import Namespace="Sitecore.Xml" %>
<%@ Import Namespace="System.Globalization" %>
<%@ Import Namespace="System.Threading.Tasks" %>
<%@ Import Namespace="System.Xml" %>
<%@ Import Namespace="Sitecore" %>

<script runat="server">

    /// <summary>
    /// Used to check if the session has been refresh.
    /// </summary>
    private const string CheckRefreshSessionTag = "CheckRefresh";

    /// <summary>
    /// The rebuild status.
    /// </summary>
    private RebuildStatus rebuildStatus;

    /// <summary>
    /// Indicates whether the page has been refreshed or not.
    /// </summary>
    private bool pageRefreshed;

    /// <summary>
    /// Gets or sets the reporting manager.
    /// </summary>
    /// <value>
    /// The reporting manager.
    /// </value>
    protected IReportingStorageManager ReportingManager { get; set; }

    /// <summary>
    /// Gets or sets the reporting manager supporting rebuild of slice of data.
    /// </summary>
    /// <value>
    /// The reporting manager supporting rebuild of slice of data.
    /// </value>
    protected ITimeSliceReportingStorageManager TimeSliceReportingManager { get; set; }

    /// <summary>
    /// Gets a value indicating whether current user is developer.
    /// </summary>
    /// <value>
    /// <c>true</c> if current user is developer; otherwise, <c>false</c>.
    /// </value>
    private bool IsDeveloper
    {
        get
        {
            return
                User.IsInRole("sitecore\\developer") ||
                    User.IsInRole("sitecore\\sitecore client developing");
        }
    }

    /// <summary>
    /// Raises the <see cref="E:System.Web.UI.Control.Init" /> event to initialize the page.
    /// </summary>
    /// <param name="e">An <see cref="T:System.EventArgs" /> that contains the event data.</param>
    protected override void OnInit(EventArgs e)
    {
        CheckSecurity(false);

        if (!IsXdbEnabled())
        {
            return;
        }

        var useRemoteService = false;

        XmlNode node = Factory.GetConfigNode("processing/remote");

        if (null != node)
        {
            useRemoteService = string.Equals(XmlUtil.GetAttribute("enabled", node), "true", StringComparison.InvariantCultureIgnoreCase);
        }

        string factoryPath = useRemoteService ? "processing/remote/reportingStorageManagerProxy" : "aggregation/reportingStorageManager";
        ReportingManager = Factory.CreateObject(factoryPath, true) as IReportingStorageManager;

        this.TimeSliceReportingManager = this.ReportingManager as ITimeSliceReportingStorageManager;

        Assert.IsNotNull(ReportingManager, "ReportingStorageManager must be configured in the configuration file.");
        
        if (this.TimeSliceReportingManager == null)
        {
            this.TimeSliceTextBox.Enabled = false;
            this.TimeSliceErrorLabel.Visible = true;
            this.TimeSliceErrorLabel.Text = "Time slice functionality is not available. To turn it on, make sure that ReportingManager implements ITimeSliceReportingStorageManager interface.";
        }
    }

    /// <summary>
    /// Raises the <see cref="E:System.Web.UI.Page.PreLoad" /> event after post back data is loaded into the page server controls but before the <see cref="M:System.Web.UI.Control.OnLoad(System.EventArgs)" /> event.
    /// </summary>
    /// <param name="e">An <see cref="T:System.EventArgs" /> that contains the event data.</param>
    protected override void OnPreLoad(EventArgs e)
    {
        CancelButton.Enabled = false;
    }

    /// <summary>
    /// Handles the Load event of the Page control.
    /// </summary>
    /// <param name="sender">The source of the event.</param>
    /// <param name="e">The <see cref="EventArgs" /> instance containing the event data.</param>
    protected async void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            Session[CheckRefreshSessionTag] =
                Server.UrlDecode(DateTime.UtcNow.ToString(CultureInfo.InvariantCulture));
        }

        await UpdateUiStatusAllAsync();
    }

    /// <summary>
    /// Updates the UI for all status.
    /// </summary>
    protected async Task UpdateUiStatusAllAsync()
    {
        if (!IsXdbEnabled())
        {
            return;
        }

        try
        {
            rebuildStatus = await ReportingManager.GetRebuildProcessStateAsync();
        }
        catch (EntityDoesNotExistException)
        {
            rebuildStatus = new RebuildStatus();
        }

        UpdateUiForOverallStatus();
    }

    /// <summary>
    /// Updates the UI for overall status.
    /// </summary>
    protected void UpdateUiForOverallStatus()
    {
        bool isActive = rebuildStatus.IsActive;

        AggregationStatusesTable.Rows.Clear();

        const int AmountOfCells = 5;

        var header1Row = new TableHeaderRow();
        var hStatuses = new TableHeaderCell
        {
            Text = "History Aggregation Statuses",
            ColumnSpan = AmountOfCells
        };

        header1Row.Cells.Add(hStatuses);
        AggregationStatusesTable.Rows.Add(header1Row);

        var header2Row = new TableHeaderRow();
        var hCellType = new TableHeaderCell { Text = "Type" };
        var hCellState = new TableHeaderCell { Text = "State" };
        var hCellProcessed = new TableHeaderCell { Text = "Processed" };
        var hCellTotal = new TableHeaderCell { Text = "EstimatedTotal" };
        var hCellException = new TableHeaderCell { Text = "Exception" };

        header2Row.Cells.AddRange(new TableCell[]
        {
            hCellType, hCellState, hCellProcessed, hCellTotal, hCellException
        });

        AggregationStatusesTable.Rows.Add(header2Row);

        if (rebuildStatus.AggregationStatuses != null && rebuildStatus.AggregationStatuses.Count > 0)
        {
            foreach (var aggStatus in rebuildStatus.AggregationStatuses)
            {
                TableCell[] cells = {
                    new TableCell
                    {
                        Text = aggStatus.Type
                    },
                    new TableCell
                    {
                        Text = aggStatus.State.ToString()
                    },
                    new TableCell
                    {
                        Text = aggStatus.ProcessedRecords.ToString()
                    },
                    new TableCell
                    {
                        Text = aggStatus.EstimatedTotalRecords.ToString()
                    },
                    new TableCell
                    {
                        Text = aggStatus.Exception
                    }
                };

                var row = new TableRow();
                row.Cells.AddRange(cells);
                AggregationStatusesTable.Rows.Add(row);
            }
        }
        else
        {
            TableCell[] cells = {
                new TableCell
                {
                    Text = "N/A"
                },
                new TableCell
                {
                    Text = "N/A"
                },
                new TableCell
                {
                    Text = "N/A"
                },
                new TableCell
                {
                    Text = "N/A"
                },
                new TableCell
                {
                    Text = "N/A"
                }
            };

            var row = new TableRow();

            row.Cells.AddRange(cells);
            AggregationStatusesTable.Rows.Add(row);
        }

        ProcesStateLabel.Text = rebuildStatus.Step.ToString();
        IsActiveLabel.Text = isActive ? "Yes" : "No";
        CutoffLabel.Text = ResolveTimeString(rebuildStatus.CutOffDate);
        StartedAtLabel.Text = ResolveTimeString(rebuildStatus.Started);
        LastChangedLabel.Text = ResolveTimeString(rebuildStatus.LastChanged);
        TableRowError.Visible = !string.IsNullOrEmpty(rebuildStatus.Error);
        ErrorLabel.Text = rebuildStatus.Error;
        StartButton.Enabled = !isActive;
        CancelButton.Enabled = isActive;
    }

    /// <summary>
    /// Handle click event from startOrCancel button.
    /// </summary>
    /// <param name="sender">Reference to the button.</param>
    /// <param name="e">Event arguments.</param>
    protected async void StartClick(object sender, EventArgs e)
    {
        object checkRefreshSessionTagSession = Session[CheckRefreshSessionTag];
        object checkRefreshSessionTagViewState = ViewState[CheckRefreshSessionTag];

        if (checkRefreshSessionTagSession != null && checkRefreshSessionTagViewState != null &&
            checkRefreshSessionTagSession.ToString() == checkRefreshSessionTagViewState.ToString())
        {
            Session[CheckRefreshSessionTag] = Server.UrlDecode(DateTime.UtcNow.ToString(CultureInfo.InvariantCulture));
        }
        else
        {
            pageRefreshed = true;
        }

        if (pageRefreshed)
        {
            return;
        }


        MissingConnStringMsg.Text = await ValidateReportingStorageConnectionStringAsync();
        if (MissingConnStringMsg.Text.Length > 0)
        {
            return;
        }

        try
        {
            rebuildStatus = await ReportingManager.GetRebuildProcessStateAsync();
        }
        catch (EntityDoesNotExistException)
        {
            rebuildStatus = new RebuildStatus();
        }

        try
        {
            if (!rebuildStatus.IsActive)
            {
                StartButton.Enabled = false;

                var text = this.TimeSliceTextBox.Text;

                if (this.TimeSliceReportingManager != null && !string.IsNullOrEmpty(text))
                {
                    DateTime minStartDateTime;

                    if (DateTime.TryParseExact(text, "u", CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out minStartDateTime))
                    {
                        await this.TimeSliceReportingManager.StartRebuildTimeSliceAsync(minStartDateTime, System.Threading.CancellationToken.None);
                    }
                    else
                    {
                        this.TimeSliceErrorLabel.Visible = true;
                        this.TimeSliceErrorLabel.Text = "Minimum StartDateTime string has not been recognized as a valid date in Universal sortable date/time pattern (\"yyyy-MM-dd HH:mm:ssZ\").";
                    }

                    return;
                }

                await ReportingManager.StartRebuildAsync();
            }
        }
        catch (Exception exception)
        {
            MissingConnStringMsg.Text = exception.Message;
        }
    }

    /// <summary>
    /// Handle click event from cancel button.
    /// </summary>
    /// <param name="sender">Reference to the button.</param>
    /// <param name="e">Event arguments.</param>
    protected async void CancelClick(object sender, EventArgs e)
    {
        // important note: see the limitations in the remarks of the CancelRebuild method.
        await ReportingManager.CancelRebuildAsync();
    }

    /// <summary>
    /// Raises the <see cref="E:System.Web.UI.Control.PreRender" /> event.
    /// </summary>
    /// <param name="e">An <see cref="T:System.EventArgs" /> object that contains the event data.</param>
    protected override void OnPreRender(EventArgs e)
    {
        ViewState[CheckRefreshSessionTag] = Session[CheckRefreshSessionTag];
        base.OnPreRender(e);
    }

    /// <summary>
    /// Handles the Tick event of the ProgressTimer control.
    /// </summary>
    /// <param name="sender">The source of the event.</param>
    /// <param name="e">The <see cref="EventArgs"/> instance containing the event data.</param>
    protected async void ProgressTimer_Tick(object sender, EventArgs e)
    {
        await UpdateUiStatusAllAsync();
    }

    private async Task<string> ValidateReportingStorageConnectionStringAsync()
    {
        try
        {
            var proxy = (ReportingManager as ReportingStorageManagerProxy);

            if (proxy != null)
            {
                await proxy.CheckConfigurationAsync();
            }
            else
            {
                ReportingStorageManagerHelper.VerifyConfiguration();
            }
        }
        catch (ReportingStorageManagerConfigurationException ex)
        {
            return ex.Message;
        }

        return string.Empty;
    }

    /// <summary>
    /// Resolves the time string.
    /// </summary>
    /// <param name="utcDateTime">The UTC date time.</param>
    /// <returns>The formatted date time.</returns>
    private string ResolveTimeString(DateTime utcDateTime)
    {
        string result = DateUtil.ToServerTime(utcDateTime).ToString("yyyy-MM-dd HH:mm:ss \"GMT\"zzz");
        return result;
    }

    /// <summary>
    /// Checks the security.
    /// </summary>
    /// <param name="isDeveloperAllowed">
    /// if set to <c>true</c>, developer is allowed.
    /// </param>
    private void CheckSecurity(bool isDeveloperAllowed)
    {
        User user = Sitecore.Context.User;

        if (user.IsAdministrator)
        {
            return;
        }

        if (isDeveloperAllowed && IsDeveloper)
        {
            return;
        }

        SiteContext site = Sitecore.Context.Site;

        if (site != null)
        {
            Response.Redirect(string.Format(
                "{0}?returnUrl={1}",
                site.LoginPage,
                HttpUtility.UrlEncode(Request.Url.PathAndQuery)));
        }
    }

    /// <summary>
    /// Checks the Xdb License.
    /// </summary>
    /// <returns><b>true</b>, if xdb is enabled. Otherwise, <b>false</b>.</returns>
    private bool IsXdbEnabled()
    {
        bool xdbEnabled = XdbSettings.Enabled;
        if (!xdbEnabled)
        {
            ErrorLabel.Text = "xDB is disabled. Ensure that your license supports xDB and in the SitecoreXdb.config file, set Xdb.Enabled to true.";
            StartButton.Enabled = false;
            CancelButton.Enabled = false;
        }

        return xdbEnabled;
    }

</script>
<!DOCTYPE html>

<html>
<head runat="server">
    <title>Rebuild Reporting Database</title>
    <link rel="shortcut icon" href="/sitecore/images/favicon.ico" />
    <link rel="Stylesheet" type="text/css" href="/sitecore/shell/themes/standard/default/WebFramework.css" />
    <style type="text/css">
        .wf-container {
            display: inline-block;
            min-width: 950px;
        }

        .wf-content {
            padding: 2em 2em;
        }

        #wf-dropshadow-right {
            display: none;
        }

        table {
            width: 100%;
            max-width: 950px;
        }

            table.main {
                border: 1px solid #ccc;
                border-collapse: collapse;
                font-family: Tahoma;
                font-size: 14pt;
                padding: 1em 1em;
            }

                table.main td {
                    border: 1px solid #ccc;
                    font-family: Tahoma;
                    font-size: 14pt;
                    padding: 5px;
                }

                table.main th {
                    border: 1px solid #ccc;
                    font-family: Tahoma;
                    font-size: 14pt;
                    font-weight: normal;
                    padding: 5px;
                    text-align: center;
                }

        .wf-configsection table th {
            background-color: #ccc;
        }

        td.datacell {
            text-align: right;
            white-space: nowrap;
        }

        table.main th.dataheader {
            text-align: center;
        }

        tr.groupheader {
            background-color: #bbb;
        }

        .top1 {
            background-image: url(/sitecore/shell/themes/Standard/Images/PipelineProfiling/font_char49_red_16.png);
            background-position: 5px 5px;
            background-repeat: no-repeat;
        }

        .top2 {
            background-image: url(/sitecore/shell/themes/Standard/Images/PipelineProfiling/font_char50_orange_16.png);
            background-position: 5px 5px;
            background-repeat: no-repeat;
        }

        .top3 {
            background-image: url(/sitecore/shell/themes/Standard/Images/PipelineProfiling/font_char51_yellow_16.png);
            background-position: 5px 5px;
            background-repeat: no-repeat;
        }

        table.main td.processor {
            padding-left: 30px;
        }
    </style>
</head>
<body>
    <form id="mainForm" runat="server" class="wf-container">
        <div class="wf-content">
            <h1>Rebuild Reporting Database</h1>
            <asp:ScriptManager runat="server"></asp:ScriptManager>
            <asp:Timer ID="ProgressTimer" Interval="4000" runat="server" OnTick="ProgressTimer_Tick"></asp:Timer>

            <p />
            <p />
            <asp:Table ID="TimeSliceTable" runat="server">
                <asp:TableHeaderRow ID="TimeSliceTableHeaderRow" runat="server">
                    <asp:TableHeaderCell ID="TimeSliceTableHeaderCell" runat="server" ColumnSpan="2" HorizontalAlign="Left">
                        Time slice Aggregation
                    </asp:TableHeaderCell>
                </asp:TableHeaderRow>
                <asp:TableRow ID="TimeSliceRow" runat="server">
                    <asp:TableCell ID="TimeSliceKey" runat="server">
                        Minimum StartDateTime*:
                    </asp:TableCell>
                    <asp:TableCell ID="TimeSliceCell" runat="server" HorizontalAlign="Right">
                        <asp:TextBox runat="server" Width="250" placeholder="yyyy-MM-dd HH:mm:ssZ" ID="TimeSliceTextBox" />
                    </asp:TableCell>
                </asp:TableRow>
                <asp:TableRow ID="TimeSliceDescriptionRow" runat="server">
                    <asp:TableCell ID="TimeSliceDescriptionCell" ColumnSpan="2" runat="server">
                        *Minimum StartDateTime value defines lower boundary required for data to be included into rebuild. Interactions started before minimum StartDateTime value will not be processed during rebuild. Universal sortable date/time pattern ("yyyy-MM-dd HH:mm:ssZ", e.g. 2017-10-03 09:43:10Z) must be used.
                    </asp:TableCell>
                </asp:TableRow>
            </asp:Table>
            <p />
            <asp:UpdatePanel runat="server">
                <ContentTemplate>
                    <asp:Label runat="server" ID="TimeSliceErrorLabel" ForeColor="red" Visible="false"></asp:Label>
                    <p />
                    <asp:Button runat="server" ID="StartButton" OnClick="StartClick" Text="Start" />
                    <asp:Button runat="server" ID="CancelButton" OnClick="CancelClick" Text="Cancel" />
                    <p />
                    <asp:Label runat="server" ID="MissingConnStringMsg" ForeColor="red"></asp:Label>
                    <p />
                    <p />

                    <asp:Table ID="TableOverallStatus" runat="server">
                        <asp:TableHeaderRow ID="TableHeaderOverallStatus" runat="server">
                            <asp:TableHeaderCell style="min-width: 250px;" ID="TableHeaderCellOverallStatus" runat="server" HorizontalAlign="Left">
                    Overall Status
                            </asp:TableHeaderCell>
                        </asp:TableHeaderRow>

                        <asp:TableRow ID="TableRowOverallState" runat="server">
                            <asp:TableCell ID="TableCellOverallStateKey" runat="server">
                    Process State:
                            </asp:TableCell>
                            <asp:TableCell ID="TableCellOverallStateValue" runat="server" HorizontalAlign="Right">
                                <asp:Label runat="server" ID="ProcesStateLabel" />
                            </asp:TableCell>
                        </asp:TableRow>

                        <asp:TableRow ID="TableRowError" runat="server">
                            <asp:TableCell ID="TableCell1" runat="server">
                    Last stored error:
                            </asp:TableCell>
                            <asp:TableCell ID="TableCell2" runat="server" HorizontalAlign="Right">
                                <asp:Label runat="server" ID="ErrorLabel" />
                            </asp:TableCell>
                        </asp:TableRow>

                        <asp:TableRow ID="TableRowIsActive" runat="server" Visible="False">
                            <asp:TableCell ID="TableCellIsActiveKey" runat="server">
                    Is Active:
                            </asp:TableCell>
                            <asp:TableCell ID="TableCellIsActiveValue" runat="server" HorizontalAlign="Right">
                                <asp:Label runat="server" ID="IsActiveLabel" />
                            </asp:TableCell>
                        </asp:TableRow>

                        <asp:TableRow ID="TableRowCutoff" runat="server" Visible="False">
                            <asp:TableCell ID="TableCellCutoffKey" runat="server">
                    Cutoff Time (Server Time):
                            </asp:TableCell>
                            <asp:TableCell ID="TableCellCutoffValue" runat="server" HorizontalAlign="Right">
                                <asp:Label runat="server" ID="CutoffLabel" />
                            </asp:TableCell>
                        </asp:TableRow>
                        <asp:TableRow ID="TableRowStartedAt" runat="server">
                            <asp:TableCell ID="TableCellStartedAtKey" runat="server">
                    Started at (Server Time):
                            </asp:TableCell>
                            <asp:TableCell ID="TableCellStartedAtValue" runat="server" HorizontalAlign="Right">
                                <asp:Label runat="server" ID="StartedAtLabel" />
                            </asp:TableCell>
                        </asp:TableRow>
                        <asp:TableRow ID="TableRowFinishedAt" runat="server">
                            <asp:TableCell ID="TableCellFinishedAtKey" runat="server">
                    Last Process State Change At (Server Time):
                            </asp:TableCell>
                            <asp:TableCell ID="TableCellFinishedAtValue" runat="server" HorizontalAlign="Right">
                                <asp:Label runat="server" ID="LastChangedLabel" />
                            </asp:TableCell>
                        </asp:TableRow>
                    </asp:Table>
                    <asp:Table ID="AggregationStatusesTable" runat="server"></asp:Table>
                </ContentTemplate>
                <Triggers>
                    <asp:AsyncPostBackTrigger ControlID="ProgressTimer" EventName="Tick" />
                </Triggers>
            </asp:UpdatePanel>
        </div>
    </form>
</body>
</html>
