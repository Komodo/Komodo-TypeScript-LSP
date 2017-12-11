(function() {

    const {Cc, Ci}  = require("chrome");
    const logging = require("ko/logging");
    const log = logging.getLogger("%AddonId%/mediator");
    const koFile = require("ko/file");
    const koResolve = Cc["@activestate.com/koResolve;1"].getService(Ci.koIResolve);
    const prefs = require("ko/prefs");

    var Mediator = Object.assign({}, require("codeintel/service/mediator/lsp"));

    (function()
    {

        this.start = function ()
        {
            var addonPath = koResolve.uriToPath("chrome://%AddonId%/content/js/mediator.js");
            addonPath = koFile.join(koFile.dirname(addonPath), '..');

            var binary = addonPath + "/node/node_modules/javascript-typescript-langserver/lib/language-server-stdio.js";
            binary = prefs.getString("codeintel.typescript.binary", binary);
            var args = prefs.getString("codeintel.typescript.args").match(/"[^"]+"|'[^']+'|\S+/g) || [];
            
            this.spawn(binary, args);
        };

        this.onClosePremature = function()
        {
            var response = require("ko/dialogs").confirm(
                "Could not start the language server process. Do you have Node.JS installed " +
                "and configured?",
                {
                    yes: "Configure Node.js",
                    no: "Close"
                }
            );

            if (response)
            {
                require("ko/windows").getMain().prefs_doGlobalPrefs("nodejsItem");
            }
        };

        this.normalizeSymbol = function (symbol) 
        {
            symbol.name = symbol.name.replace(/^this./, '');

            if (symbol.name.substr(0,1) == '"')
                 symbol.name = symbol.name.replace(/(?:^"|"$)/g,"");

            return symbol;
        };

    }).apply(Mediator);

    this.create = (meta) =>
    {
        var mediator = Object.assign({}, Mediator);

        mediator.create(meta);
        mediator.start();

        return mediator;
    };

}).apply(module.exports);