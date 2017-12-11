window.addEventListener("load", () =>
{
    const $ = require("ko/dom").window(window);
    const prefs = require("ko/prefs");

    var elems = {};
 
    var init = () =>
    {
        elems.binary = require("ko/ui/filepath").create({
            value: prefs.getString("codeintel.typescript.binary"),
            type: "autocomplete",
            placeholder: "Leave empty to use built-in version",
            filetype: "file",
            flex: 1
        });

        elems.args = require("ko/ui/textbox").create({
            label: "Arguments:",
            value: prefs.getString("codeintel.typescript.args"),
            flex: 1
        });

        var groupbox = require("ko/ui/groupbox").create({caption: "Executable" });

        var description = require("ko/ui/description").create(
            "Please configure the binary used to run the Language Server for TypeScript. This binary is installed using\
            \"npm install javascript-typescript-langserver\". The binary is called \"language-server-stdio.js\" and is\
            located in your global Node.js module folder."
        );
        
        groupbox.addRow(description, { align: "center", orient: "vertical" });
        groupbox.addRow(require("ko/ui/spacer").create({ height: 15 }), { align: "center" });

        groupbox.addRow(require("ko/ui/label").create("Language Server Binary (IO):"));
        groupbox.addRow(elems.binary);

        groupbox.addRow(require("ko/ui/label").create("Arguments:"));
        groupbox.addRow(elems.args);

        $("#codeintel-prefs-vbox").append(groupbox.element);

    };


    window.OnPreferencePageOK = (prefset) =>
    {
        if (elems.binary.value())
            parent.hPrefWindow.prefset.setString('codeintel.typescript.binary', elems.binary.value());
        else
            parent.hPrefWindow.prefset.deletePref('codeintel.typescript.binary');

        if (elems.args.value())
            parent.hPrefWindow.prefset.setString('codeintel.typescript.args', elems.args.value());
        else
            parent.hPrefWindow.prefset.deletePref('codeintel.typescript.args');

        return true;
    };

    init();

});