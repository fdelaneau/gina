/* Geena.Utils.Config
 *
 * This file is part of the geena package.
 * Copyright (c) 2014 Rhinostone <geena@rhinostone.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

var Config;
//Imports.

var fs  = require('fs');
var EventEmitter = require('events').EventEmitter;

/**
 * Config constructor
 * @contructor
 * */
Config = function() {

    var self = this, mainConfig;
    //this.value = getContext("utils.config.value");
    try {
        this.paths = getContext("paths");
    } catch (err) {
        this.paths = {};
    }

    var path = new _(__dirname).toUnixStyle();
    this.__dirname =  _( path.substring(0, (path.length - 4)) );


    /**
     * Init Utils config
     *
     * @private
     * */
    var init = function(){

        //getting context path thru path helper.
        console.log("asking for dirname ", __dirname);
        var path = new _(__dirname).toUnixStyle();
        self.__dirname =  _( path.substring(0, (path.length - 4)) );

        if ( self.paths.utils == undefined)
            self.paths.utils = self.__dirname

        //if (self.paths == "undefined") {

        //}


        self.get('geena', 'locals.json', function(err, obj){

            if( !err ) {
                //console.log("LINSTING path ", obj.paths);
                mainConfig = require(obj.paths.geena + '/config')();
            } else {
                console.log(err.stack);
            }

        });
    };

    /**
     * Set config file if !exists
     *
     * @param {string} app - App name
     * @param {string} file - File to save
     * @param {object} content - JSON content to save
     * */
    this.set = function(app, file, content, callback){
        switch (app) {
            case 'geena':
            case 'geena.utils':
                setFile(app, file, content, function(err){
                    callback(err);
                });
                break;
        }
    };

    /**
     * Get config file if exists
     *
     * @param {string} project - Project name
     * @param {strins} key - File name to save + .ext
     *
     * @callback callback
     * @param {string|boolean} err
     * @param {object} config - Bundle Configuration
     * */
    this.get = function(project, file, callback){

        var config = null, err = false;

        switch (project) {
            case 'geena':
            case 'geena.utils':
                try {

                    //You are under geena.utils/lib/...
                    //console.log("getting in this value ?? ", project, file, self.value);
                    if ( typeof(self.value) != "undefined" ) {

                        try {
                            config = self.value;//????
                        } catch (err) {
                            err = 'Utils.Config.get(...) : self.value['+file+'] : key not found.\n' + err;
                        }

                    } else {
                        //Getting paths.
                        if ( typeof(self.paths.root) != "undefined" ) {
                            //console.error("requiring :=> ",  self.paths.root + '/.gna/locals.json');
                            try {
                                config = require(self.paths.root  + '/.gna/' + file);
                                self.value = config;
                                self.paths = config["paths"];

                            } catch (err) {
                                //Means that the file was not found..
                                err = self.__dirname  + '/.gna/locals.json: project configuration file not found. \n' + err;
                            }
                        }
                    }

                    callback(false, config);

                } catch (err) {
                    var err = '.gna/locals.json: project configuration file not found. \n' + err;
                    logger.error('geena', 'UTILS:CONFIG:ERR:3', err, __stack);
                    callback(err);
                }
                break;

            default :
                callback('Config.get('+project+'): case not found');
        }
    };

    /**
     * Get sync config file if exists
     *
     * @param {string} app - App name
     * @return {object} config - App Configuration
     *
     * @private
     * */
    this.getSync = function(project, file){
        if (typeof(file) == 'undefined') {
            var file = 'local.json'
        }

        if ( typeof(self.value) != "undefined" ) {
            return self.value;
        } else {
            var filename = self.paths.root +'/.gna/'+ file;
            try {
                if ( fs.existsSync(filename) ) {
                    return require(filename);
                } else {
                    return undefined
                }

            } catch (err) {
                //logger.error('geena', 'UTILS:CONFIG:ERR:6', err, __stack);
                console.error(err.stack)
                return null;
            }
        }
    };

    /**
     * Create a config file
     *
     * @param {string} app - Targeted application
     * @param {string} file - File save
     * @param {string} content - Content fo the file to save
     *
     *
     * TOTO - Avoid systematics file override.
     * @private
     * */
    var setFile = function(app, file, content, callback){


        var paths = {
            root : content.paths.root,
            utils : content.paths.utils
        };
        console.error("blabla conf..", file, content);
        var gnaFolder = content.paths.root + '/.gna';

        self.project = content.project;

        self.paths = paths;

        //Create path.
        try {

            var createFolder = function(){
                if ( fs.existsSync(gnaFolder) ) {
                    callback(false);
                } else {
                    fs.mkdir(gnaFolder, 0777, function(err){
                        if (err) {
                            console.error(err.stack);
                            callback(err);
                        } else {
                            //Creating content.
                            createContent(gnaFolder+ '/' +file, gnaFolder, content, function(err){
                                callback(err);
                            });
                        }
                    });
                }

            };
            fs.exists(gnaFolder, function(exists){
                //console.log("file exists ? ", gnaFolder, exists);

                if (exists) {
                    var folder = new _(gnaFolder).rm( function(err){
                        if (!err) {
                            createFolder();
                        } else {
                            callback(err);
                        }

                    });
                } else {
                    createFolder();
                }
            //logger.error('geena', 'UTILS:CONFIG:ERR:1', err, __stack);
//                    console.warn("waah ", gnaFolder+ '/' +file, gnaFolder, content);
//                    fs.mkdir(gnaFolder, 0777, function(err){
//                        if (err) logger.error('geena', 'UTILS:CONFIG:ERR:1', err, __stack);
//
//                        //Creating content.
//                        createContent(gnaFolder+ '/' +file, gnaFolder, content, function(err){
//                            callback(err);
//                        });
//                    });

//                } else {
//                    //Means that folder was found.
//                    if ( typeof(callback) != 'undefined') {
//                        callback(false);
//                    }
//                }

//                    //Means that folder was found.
//                    /************************************************************
//                    * Will remove this row once the project generator is ready. *
//                    ************************************************************/
//                    //Remove all: start with symlink. in order to replace it.
//                    var path = self.paths.utils + '/.gna';
//
//                    removeSymlink(path, function(err){
//                        if (err) logger.error('geena', 'UTILS:CONFIG:ERR:10', err, __stack);
//
//                        Fs.mkdir(gnaFolder, 0777, function(err){
//                            if (err) logger.error('geena', 'UTILS:CONFIG:ERR:1', err, __stack);
//
//                            //Creating content.
//                            createContent(gnaFolder+ '/' +file, gnaFolder, content, function(err){
//                                callback(err);
//                            });
//                        });
//                    });
//                }//EO if (!exists) {
            });



        } catch (err) {
            //log it.
            console.error(err);
        }
    };

    /**
     * Remove symbolic link
     *
     * @param {string} path
     * @callback callback
     *
     * @private
     * */
    var removeSymlink = function(path, callback){

        fs.exists(path, function(exists){
            if (exists) {
                fs.lstat(path, function(err, stats){
                    if (err) console.error(err.stack);

                    if ( stats.isSymbolicLink() ) fs.unlink(path, function(err){
                        if (err) {
                            console.error(err.stack);
                            callback(err);
                        } else {
                            //Trigger.
                            onSymlinkRemoved(self.paths, function(err){
                                if (err) console.error(err.stack);

                                callback(false);
                            });
                        }
                    });
                });
            } else {
                //log & ignore. This is not a real issue.
                logger.warn('geena', 'UTILS:CONFIG:WARN:1', 'Path not found: ' + path, __stack);

                onSymlinkRemoved(self.paths, function(err){
                    if (err) logger.error('geena', 'UTILS:CONFIG:ERR:9', err, __stack);

                    callback(false);
                });
            }
        });
    };

    /**
     * Symbolic link remove event
     *
     * @param {string} [err]
     * @callback callback
     *
     * @private
     * */
    var onSymlinkRemoved = function(paths, callback){
        //Remove original.
        var p = new _(paths.root + '/.gna');
        var path = p.toString();

        //Remove folers.
        fs.exists(path, function(exists){
            //delete when exists.
            if (exists) {
                //console.log("yeah about to delete main folder: ", p.toString());
                //Delete ans die here..
                p.rm(function(err, path){
                    //console.log("receives ", err, path);
                    if (err) {
                        logger.error('geena', 'UTILS:CONFIG:ERR:8', err, __stack);
                        callback(err);
                    } else {
                        logger.info('geena', 'UTILS:CONFIG:INFO:1', path +': deleted with success !');
                        callback(false);
                    }
                });
            }
        });
    };

    /**
     * Create content
     *
     * @param {string} filename - Fullpath
     * @content {string} content
     *
     * @private
     * */
    var createContent = function(filename, gnaFolder, content, callback){

        fs.appendFile(
            filename,
            JSON.stringify(content, null, '\t'),
            null,
            function(err){
                if (err) {
                    logger.error('geena', 'UTILS:CONFIG:ERR:2', err, __stack);
                    callback(err);
                } else {
                    callback(false);
                }
//                } else {
//                    /** doesn't work on windows */
//                    var target = content.paths.utils + '/.gna';
//                    //You never know.. could be a manual delete on one side..
//                    fs.exists(target, function(exists){
//                        if (exists) {
//                            fs.unlink(target, function(err){
//                                if (!err) Fs.symlinkSync(gnaFolder, target);
//
//                                callback(err);
//                            });
//                        } else {
//                            //Need administrator credentials on Windows. Like try to start webstorm as Administrator.
//                            try {
//                                fs.symlinkSync(gnaFolder, target);
//
//                            } catch (err) {
//                                logger.error('geena', 'UTILS:CONFIG:ERR:12', err, __stack);
//                            }
//
//                            callback(err);
//                            //process.exit(42);
//                        }
//                    });
//                }
            }//EO function
        );//EO fs.appendFile
    };

    /**
     * Get var value by namespace
     *
     * @param {string} namespace
     * @param {object} [config ] - Config object
     * @return {*} value - Can be String or Array
     *
     * @private
     * */
    var getVar = function(namespace, config) {
        if ( typeof(config) == "undefined" )
            var config = self.getSync(app);

        if (config != null) {
            var split = namespace.split('.'), k=0;
            while (k<split.length) {
                config = config[split[k++]];
            }
            return config;
        } else {
            return null;
        }
    };

    /**
     * Get path by app & namespance
     *
     * @param {string} app
     * @param {string} namespace
     *
     * @callback callback
     * @param {string} err
     * @param {string} path
     *
     * @private
     * */
    var getPath = function(app, namespace, callback){

        self.get(app, function(err, config){
            if (err) {
                logger.error('geena', 'UTILS:CONFIG:ERR:4', err, __stack);
                callback(err + 'Utils.Config.get(...)');
            }

            try {
                callback( false, getVar('paths.' + namespace, config) );

            } catch (err) {
                var err = 'Config.getPath(app, cat, callback): cat not found';
                logger.error('geena', 'UTILS:CONFIG:ERR:5', err, __stack);
                callback(err);
            }
        });
    };


    /**
     * Get project name
     *
     * @return {string} projectName
     *
     * */
    this.getProjectName = function(){
        if ( this.paths != undefined && this.paths.root != undefined ) {
            var arr = this.paths.root.split("/");
            return arr[arr.length-1];
        } else {
            return null;
        }
    }
};

module.exports = Config