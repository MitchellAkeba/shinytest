// The content of this file gets injected into the Shiny application that is
// in the iframe. This is the application for which interactions are being
// recorded.

window.shinyRecorder = (function() {
    var shinyrecorder = {
        initialized: false,
        token: null        // Gets set by parent frame
    };

    // Store previous values for each input. Use JSON so that we can compare
    // non-primitive objects like arrays.
    var previousInputValues = {};

    $(document).on("shiny:inputchanged", function(event) {
        // Check if value has changed from last time.
        var valueJSON = JSON.stringify(event.value);
        if (valueJSON === previousInputValues[event.name])
            return;
        previousInputValues[event.name] = valueJSON;

        var hasBinding = !!event.binding;
        sendInputEventToParent(event.inputType, event.name, event.value, hasBinding);
    });

    $(document).on("shiny:filedownload", function(event) {
        sendFileDownloadEventToParent(event.name);
    });

    // Ctrl-click or Cmd-click (Mac) to record an output value
    $(document).on("click", ".shiny-bound-output", function(e) {
        if (!(e.ctrlKey || e.metaKey))
            return;

        var id = e.target.id;
        var value = Shiny.shinyapp.$values[id];

        sendOutputValueToParent(id, value);
    });


    function sendInputEventToParent(inputType, name, value, hasBinding) {
        parent.postMessage({
            token: shinyrecorder.token,
            inputEvent: {
                inputType: inputType,
                name: name,
                value: value,
                hasBinding: hasBinding
             }
        }, "*");
    }

    function sendFileDownloadEventToParent(name, url) {
        parent.postMessage({
            token: shinyrecorder.token,
            fileDownload: { name: name }
        }, "*");
    }

    function sendOutputValueToParent(name, value) {
        parent.postMessage({
            token: shinyrecorder.token,
            outputValue: { name: name, value: value }
        }, "*");
    }


    // ------------------------------------------------------------------------
    // Initialization
    // ------------------------------------------------------------------------
    function initialize() {
        if (shinyrecorder.initialized)
            return;

        // Save initial values so we can check for changes.
        for (var name in Shiny.shinyapp.$inputValues) {
            previousInputValues[name] = JSON.stringify(Shiny.shinyapp.$inputValues[name]);
        }

        shinyrecorder.initialized = true;
    }
    if (Shiny && Shiny.shinyapp && Shiny.shinyapp.isConnected()) {
        initialize();
    } else {
        $(document).on("shiny:connected", initialize);
    }


    return shinyrecorder;
})();
