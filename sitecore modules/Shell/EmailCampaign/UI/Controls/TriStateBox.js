function trion_mouseover(id)
{
    var obj = document.getElementById(id);
    obj.src = obj.src.replace(/allow_disabled.gif/, 'allow_disabled_h.gif');
}

function trion_mouseout(id)
{
    var obj = document.getElementById(id);
    obj.src = obj.src.replace(/allow_disabled_h.gif/, 'allow_disabled.gif');
}

function trioff_mouseover(id)
{
    var obj = document.getElementById(id);
    obj.src = obj.src.replace(/deny_disabled.gif/, 'deny_disabled_h.gif');
}

function trioff_mouseout(id)
{
    var obj = document.getElementById(id);
    obj.src = obj.src.replace(/deny_disabled_h.gif/, 'deny_disabled.gif');
}

function trion_set(id)
{
    var obj = document.getElementById(id + '_on');
    var src = obj.src.replace(/allow_disabled_h.gif/, 'allow_enabled.gif');
    obj.src = src;
    obj = document.getElementById(id + '_off');
    obj.src = src.replace(/allow_enabled.gif/, 'deny_disabled.gif');
}

function trioff_set(id)
{
    var obj = document.getElementById(id + '_off');
    var src = obj.src.replace(/deny_disabled_h.gif/, 'deny_enabled.gif');
    obj.src = src;
    obj = document.getElementById(id + '_on');
    obj.src = src.replace(/deny_enabled.gif/, 'allow_disabled.gif');
}

function trion_unset(id)
{
    var obj = document.getElementById(id + '_on');
    obj.src = obj.src.replace(/allow_enabled.gif/, 'allow_disabled.gif');
}

function trioff_unset(id)
{
    var obj = document.getElementById(id + '_off');
    obj.src = obj.src.replace(/deny_enabled.gif/, 'deny_disabled.gif');
}

function trion_click(id)
{
    var obj = document.getElementById(id + '_data');
    var data = obj.value;
    var state = data.charAt(0);
    if (state != 3)
    {
        if (state == 4)
        {
            state = 2;
            trion_unset(id);
        }
        else
        {
            state = 4;
            trion_set(id);
        }

        obj.value = state + data.substring(1, data.length);
        doPostBack(id);
    }
}

function trioff_click(id)
{
    var obj = document.getElementById(id + '_data');
    var data = obj.value;
    var state = data.charAt(0);
    if (state != 1)
    {
        if (state == 0)
        {
            state = 2;
            trioff_unset(id);
        }
        else
        {
            state = 0;
            trioff_set(id);
        }

        obj.value = state + data.substring(1, data.length);
        doPostBack(id);
    }
}

function doPostBack(id)
{
    if (document.getElementById(id).attributes['autopostback'].nodeValue == 'True')
        __doPostBack(id, '');
}