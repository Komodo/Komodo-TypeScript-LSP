(function() {
    
    this.load = function() {
        require("%AddonId%/controller").load();
    };
    
    this.unload = function() {
        require("%AddonId%/controller").unload();
    };
    
    this.install = function() {};
    
    this.uninstall = function() {};
    
}).apply(module.exports);