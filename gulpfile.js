const path      = require('path');
const fs        = require('fs');
const gulp      = require("gulp");
const gutil     = require('gulp-util');
const flatmap   = require("gulp-flatmap");
const file      = require("gulp-file");
const replace   = require('gulp-replace');
const zip       = require('gulp-zip');
const del       = require('del');
const meta      = require('./meta.json');

require('events').EventEmitter.prototype._maxListeners = -1;

// Generate Mozilla ID from given ID plus author name
meta.mozId = meta.id + '@' + meta.author.replace(/\W+/g, "") + ".org";

// id needs to be lowercase for consistency
meta.id = meta.id.toLowerCase();

// Helper function to inject meta values into files
var injectMeta = function(stream)
{
    for (let k in meta)
    {
        let _k = k.substr(0,1).toUpperCase() + k.substr(1, k.length);
        _k = "Addon" + _k;
        let re = new RegExp("%"+_k+"%", "g");
        stream.pipe(replace(re, meta[k]));
    }
};

/*** Clean up build/stage ***/
gulp.task('clean:build-stage', function (cb)
{
    del.sync('build/stage/**/*');
    cb();
});

/*** Clean up build/releases ***/
gulp.task('clean:build-releases', function (cb)
{
    del.sync('build/releases/**/*');
    cb();
});

/*** Clean up build ***/
gulp.task('clean:build-all', function (cb)
{
    del.sync('build/**/*');
    cb();
});

/*** Compile src files ***/
gulp.task('build:compile-src', function (cb)
{
    // Helper function that copies a folder from src to given directory
    // and injects meta variables
    var copy = function(from, to, preserveFolderName, inject=true) {
        var stream = gulp.src('src/'+from+'/**/*');

        if (inject)
            injectMeta(stream);
        
        if (preserveFolderName)
            to = to + '/' + from;
            
        stream.pipe(gulp.dest('build/stage/'+to));
    };
    
    // Perform the actual copy+injections
    copy('xul', 'content', true);
    copy('js', 'content', true);
    copy('node', 'content', true, false);
    copy('less', 'skin', true);
    copy('py', 'pylib');
    
    // Localization files are a bit more complicated as we perform some
    // mapping based on the filename.
    // These files do not support (or need) meta variable injection.
    gulp.src(['src/locale/*.json']).pipe(flatmap(function (stream, f) {
        // Retrieve the locale name (eg. en-US)
        var locale = path.basename(f.path, '.json');
        
        // Convert JSON data to the format mozilla expects
        var data = JSON.parse(f.contents.toString());
        var dtd = "", properties = "";
        for (let k in data)
        {
            let value = data[k].replace(/&/g, '&amp;')
                                .replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;')
                                .replace(/"/g, '&quot;')
                                .replace(/'/g, '&apos;');
            dtd += '<!ENTITY '+k+' "'+value+'">' + "\n";
            properties += k + "=" + data[k] + "\n";
        }
         
        // Save files   
        file(meta.id+'.properties', properties, {src: true})
                     .pipe(gulp.dest("./build/stage/locale/"+locale));
        file(meta.id+'.dtd', dtd, {src: true})
                     .pipe(gulp.dest("./build/stage/locale/"+locale));
                      
        return stream; // flatmap needs this
    }));
    
    cb();
});

/*** Compile meta files ***/
gulp.task('build:compile-meta', function (cb)
{
    var stream;
    
    /*-- Bootstrap --*/
    stream = gulp.src(['templates/bootstrap.js']);
    injectMeta(stream);
    stream.pipe(gulp.dest('build/stage'));
    
    /*-- Manifest --*/
    stream = gulp.src(['templates/chrome.manifest']);
    injectMeta(stream);
    
    var files = fs.readdirSync('./src/locale');
    var locale = '';
    for (let file of files)
    {
        if (path.extname(file) != '.json')
            continue;
        
        let name = path.basename(file, '.json');
        locale += 'locale '+meta.id+' '+name+' locale/'+name+'/';
    }
    
    stream.pipe(replace("%locale%", locale));
    stream.pipe(gulp.dest('build/stage'));
    
    /*-- Install.rdf --*/
    stream = gulp.src(['templates/install.rdf']);
    injectMeta(stream);
    
    var platforms = "";
    if (meta.platform)
    {
        platforms = meta.platform.split(",");
        if (platforms == "any")
            platforms = ["WINNT","Linux","Darwin"];
            
        platforms = platforms.map(function(platform)
        {
            return "<em:targetPlatform>"+platform+"</em:targetPlatform>";
        }).join("");
    }
    
    stream.pipe(replace("<em:targetPlatforms/>", platforms));
    stream.pipe(gulp.dest('build/stage'));
    
    cb();
});

/*** Build everything ***/
gulp.task('build', ['clean:build-stage', 'build:compile-src', 'build:compile-meta']);

/*** Package as XPI ***/
gulp.task('package', function(cb)
{
    let name = meta.id+'-'+meta.version+'.xpi';
    let target = 'build/releases';
	gulp.src('build/stage/**/*')
		.pipe(zip(name))
		.pipe(gulp.dest(target));
        
    gutil.log(name + ' has been saved to ' + target);
        
    cb();
});

/*** Build and package ***/
// Disabled because build isn't properly async atm
//gulp.task('build-and-package', ['build', 'package']);

/**
 * Install Tasks
 * this gets a bit complicated as we need to detect what profiles are available
 **/

var p;
var profileParentDirs = [];
var homeDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

// Detect profile parent paths on windows
if (process.platform == 'win32')
{
    let parentDir = path.join(parentDir, "AppData", "Local", "ActiveState");
    
    p = path.join(parentDir, "KomodoIDE");
    if (fs.existsSync(p)) profileParentDirs.push(p);
        
    p = path.join(parentDir, "KomodoEdit");
    if (fs.existsSync(p)) profileParentDirs.push(p);
}

// Detect profile parent paths on mac
else if (process.platform == 'darwin')
{
    let parentDir = path.join(parentDir, "Library", "Application Support");
    
    p = path.join(parentDir, "KomodoIDE");
    if (fs.existsSync(p)) profileParentDirs.push(p);
        
    p = path.join(parentDir, "KomodoEdit");
    if (fs.existsSync(p)) profileParentDirs.push(p);
}

// Detect profile parent paths on linux
else if (process.platform == 'linux')
{
    p = path.join(homeDir, ".komodoide");
    if (fs.existsSync(p)) profileParentDirs.push(p);
        
    p = path.join(homeDir, ".komodoedit");
    if (fs.existsSync(p)) profileParentDirs.push(p);
}

// Iterate over parent path and check for profile dirs (eg. 10.0)
for (let profileParentDir of profileParentDirs)
{
    var files = fs.readdirSync(profileParentDir);
    
    // Remove anything that doesn't match our profile folder pattern (digits.digits)
    files = files.filter(function(f) {
        return f.match(/^\d+\.\d+$/); 
    }).sort();
    
    // Sort the newest on top
    files.sort(function(a,b) {
        return parseFloat(b) - parseFloat(a);
    });
    
    // Iterate over the first 3 entries (the list could be far too long otherwise)
    for (let f of files.slice(0,3))
    {
        // Now register the task
        let basename = path.basename(profileParentDir);
        gulp.task('install-to-'+basename.replace(/^\./, '')+'/'+f, function(p)
        {
            p = path.join(p, 'XRE', 'extensions', meta.mozId);
            fs.writeFileSync(p, path.join(__dirname, 'build', 'stage'));
            
            gutil.log('Installed a dev link to ' + p);
        }.bind(null, path.join(profileParentDir, f)));
    }
    
}