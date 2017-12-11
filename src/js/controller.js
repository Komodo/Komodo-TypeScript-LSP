var storage = require("ko/session-storage").get("%AddonId%").storage;
if (storage.instance)
{
    module.exports = storage.instance;
}
else
{

(function()
{
    const codeintel = require("codeintel/codeintel");
    const mediator = require("codeintel/service/mediator");

    storage.instance = this;

    this.load = () =>
    {
        var meta = {
            "supports": [codeintel.FEATURE_COMPLETIONS, codeintel.FEATURE_SYMBOLBROWSER,
                         codeintel.FEATURE_SYMBOLLIST, /*codeintel.FEATURE_SYMBOLSCOPE,
                         codeintel.FEATURE_GOTODEF*/],
            "extrapaths": null,
            "completion_prefixes": {},
            "completion_suffixes": {},
            "completion_word_characters": "\\w_\\-",
            "completion_query_characters": null,
            "completion_trigger_blacklist": "\\s,",
            "completion_trigger_empty_lines": false,
            "api": "lsp"
        };

        mediator.register("%AddonId%/mediator", "LSP: TypeScript", "TypeScript", meta);
        mediator.register("%AddonId%/mediator", "LSP: JavaScript", "JavaScript", meta);
        mediator.register("%AddonId%/mediator", "LSP: Node.js", "Node.js", meta);

        require("ko/prefs").registerCategory(
           "LSP: TypeScript/JavaScript",
           "chrome://%AddonId%/content/xul/prefs.xul",
           "Code_Intelligence",
           "child"
        );
    };
    
    this.unload = () =>
    {
        mediator.unregister("%AddonId%/mediator", "TypeScript");
        mediator.unregister("%AddonId%/mediator", "JavaScript");
        mediator.unregister("%AddonId%/mediator", "Node.js");
    };
    
}).apply(module.exports);

}