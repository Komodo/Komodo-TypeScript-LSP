const { classes: Cc, interfaces: Ci, utils: Cu } = Components;
Cu.import('resource://gre/modules/Services.jsm');

var startupData;

function registerOnWindow(window) {
    window.require.setRequirePath("%AddonId%/", "chrome://%AddonId%/content/js/");
}

function loadIntoWindow(window) {
    try {
        window.require.setRequirePath("%AddonId%/", "chrome://%AddonId%/content/js/");
        window.setTimeout(function() {
            window.require("%AddonId%/bootstrap").load();
        }, 0);
    } catch (e) {
        Cu.reportError("Exception while loading addon '%AddonId%'");
        Cu.reportError(e);
        Cu.reportError(e.stack);
    }
}

function unloadFromWindow(window) {
    if (!window) return;
    window.require("%AddonId%/bootstrap").unload();
}

var windowListener = {
    onOpenWindow: function(aWindow) {
        // Wait for the window to finish loading
        let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
        domWindow.addEventListener("komodo-ui-started", function onLoad() {
            domWindow.removeEventListener("komodo-ui-started", onLoad, false);
            registerOnWindow(domWindow);
            loadIntoWindow(domWindow);
        }, false);
    },

    onCloseWindow: function(aWindow) {},
    onWindowTitleChange: function(aWindow, aTitle) {}
};

function startup(data, reason) {
    startupData = data;

    // Load into any existing windows
    let windows = Services.wm.getEnumerator("Komodo");
    while (windows.hasMoreElements()) {
        let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
        registerOnWindow(domWindow);
        loadIntoWindow(domWindow);
    }

    // Load into any new windows
    Services.wm.addListener(windowListener);
}

function shutdown(data, reason) {
    // When the application is shutting down we normally don't have to clean
    // up any UI changes made
    if (reason == APP_SHUTDOWN) return;

    // Stop listening for new windows
    Services.wm.removeListener(windowListener);

    // Unload from any existing windows
    let windows = Services.wm.getEnumerator("Komodo");
    while (windows.hasMoreElements()) {
        let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
        unloadFromWindow(domWindow);
    }
}

function install(data, reason) {
    let windows = Services.wm.getEnumerator("Komodo");
    while (windows.hasMoreElements()) {
        let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
        registerOnWindow(domWindow);
        domWindow.setTimeout(function() {
            domWindow.require("%AddonId%/bootstrap").install();
        }, 0);
    }
}

function uninstall(data, reason) {
    let windows = Services.wm.getEnumerator("Komodo");
    while (windows.hasMoreElements()) {
        let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
        unloadFromWindow(domWindow);
        domWindow.require("%AddonId%/bootstrap").uninstall();
    }
}