<%@ Control Language="C#" AutoEventWireup="true" Codebehind="ProcessUpdatePackage.ascx.cs"
Inherits="Sitecore.Update.Wizard.ProcessUpdatePackage" %>
   
<style type="text/css">
    #updatingItem {
        width: 350px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 5px;
    }

    #detailInfo{
        display:none;
    }
	
    @media screen {
        div#preloader {
            position: absolute;
            left: -9999px;
            top:  -9999px;
        }
        div#preloader img {
            display: block;
        }
    }
	
    @media print {
        div#preloader, 
        div#preloader img {
            visibility: hidden;
            display: none;
        }
    }
</style>
   
<script type="text/javascript">

    var showInstallationLog = function () {
        $("#progressDetailsPanel").slideDown("slow");
        $(".wf-more a img").attr('src', $("#preloader img").eq(2).attr('src'));
        $(".wf-more a span").text('Less information');
    }

    var hideInstallationLog = function () {
        $("#progressDetailsPanel").slideUp();
        $(".wf-more a img").attr('src', $("#preloader img").eq(1).attr('src'));
        $(".wf-more a span").text('More information');
    }

    var showHideInstallationLog = function () {
        if ($("#progressDetailsPanel").is(":hidden")) {
            showInstallationLog();
        }
        else {
            hideInstallationLog();
        }
    }

    //function called after installation when no posibility to start domain
    var handleDomainFail = function () {
        $("#lblHeader").text = "Installation failed";
        $('#progressBarContainer').addClass(".wf-state-error .wf-progress-filler");
        $("#progressBar").css("background-image", 'url(' + $("#preloader img").eq(0).attr('src') + ')');
        //display iframe with exception message
        $('#detailInfo').css('display', 'block');
        $("#logArea").src = window.location.href;
        showInstallationLog();
    };

    $(document)
        .ready(function () {

            var microsoftBrowser = !!document.documentMode || !!window.StyleMedia;

            $(".wf-more a").bind("click", showHideInstallationLog);


            var numberOfReloads = 0;
            var maxReloadCount = 10;


            $(".wf-progress-details")
                .load(function () {
                    if (numberOfReloads >= maxReloadCount) {
                        handleDomainFail();
                        return;
                    }
                    var timer = setInterval(function () {
                        if ($(".wf-progress-details")[0].contentWindow.document.readyState != 'complete') {
                            return;
                        }

                        //check frame url + search for control if not - ping with interval
                        if ($(".wf-progress-details")[0].src.indexOf("/InstallPackage.aspx?") > 0) {

                            if (!microsoftBrowser && $(".wf-progress-details")[0]
                                .contentWindow.document.getElementsByClassName("install-package-form").length === 0 ||
                                microsoftBrowser && $(".wf-progress-details")[0]
                                .contentWindow.document.getElementById("InstallPackageForm") == null) {

                                var src = $(".wf-progress-details")[0].src;
                                if (src.indexOf("recover=1") < 0) {
                                    src = src + "&recover=1";
                                }

                                numberOfReloads++;
                                clearInterval(timer);

                                setTimeout(function () {
                                        $(".wf-progress-details")[0].src = src;
                                    },
                                    3000);
                                return;
                            }
                        }
                        clearInterval(timer);
                    }, 5000);
                });
        });
</script>

<input type="hidden" id="HistoryPath" runat="server" />
<input type="hidden" id="HasError" runat="server" />

<!-- chache progress bar error background-image in case domain run failed -->
<div id="preloader">
    <img src="/sitecore/shell/themes/standard/images/progress/filler_error.png"/>
    <img src="/sitecore/shell/Themes/Standard/Images/Progress/more_collapsed.png"/>
    <img src="/sitecore/shell/Themes/Standard/Images/Progress/more_expanded.png">
</div>

<div class="wf-progress" style="padding: 2em 0">
    <div class="wf-progress-bar" id="progressBarContainer">
        <p id="updatingText">
            Processing ...</p>
        <div id="updatingItem">
           
        </div>
        <div class="wf-progress-background">
            <div style="width: 353px;position:relative;">
                <div class="wf-progress-filler" id="progressBar">
                </div>
            </div>
        </div>
    </div>
    <p class="wf-more" id="detailInfo">
        <a>
            <img src="/sitecore/shell/Themes/Standard/Images/Progress/more_collapsed.png" alt="More Information"
                 border="0" /><span style="padding-left: 3px;padding-bottom:5px;">More information</span></a></p>
    <div style="display: none;" id="progressDetailsPanel">
        <div style="border: solid 1px #ccc;">
            <iframe id="logArea" runat="server" scrolling="" src="" class="wf-progress-details" onerror="javascript:alert('error here');">
            </iframe>
        </div>
        <div>
            <a id="downloadLogLink" style="padding-top: 5px;float: right;" runat="server" href="" target="_blank">Download as file</a>
        </div>
        <div style="margin:0;padding:0;clear:both;height:0px;">&nbsp</div>
    </div>
</div>
