/*
 * This file is part of the geena package.
 * Copyright (c) 2014 Rhinostone <geena@rhinostone.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * @class Config
 *
 *
 * @package     Geena
 * @namespace
 * @author      Rhinostone <geena@rhinostone.com>
 * @api         Public
 *
 * TODO - split Config.Env & Config.Host
 */

var Config;

//Imports.
var fs              = require('fs');
var util            = require('util');
var Events          = require('events');
var EventEmitter    = require('events').EventEmitter;
var utils           = require("./utils");
var merge           = utils.merge;
var console         = utils.logger;

/**
 * Config Constructor
 * @constructor
 * */
Config  = function(opt) {

    var self = this;
    this.bundles = [];
    this.allBundles = [];

    var init =  function(opt) {
        if ( typeof(Config.initialized) == 'undefined' ) {
            Config.initialized = true;
            Config.instance = self
        }
        var env = opt.env;
        self.startingApp = opt.startingApp;
        self.executionPath = opt.executionPath;
        self.task = opt.task || 'run'; // to be aible to filter later on non run task

        //logger.debug('geena', 'CONFIG:DEBUG:1', 'Initalizing config ', __stack);
        console.debug('Initalizing config ', __stack);

        self.userConf = false;
        var path = _(self.executionPath + '/env.json');

        if ( fs.existsSync(path) ) {

            self.userConf = require(path);

//            logger.debug(
//                'geena',
//                'CONFIG:DEBUG:6',
//                'Applicaiton config file loaded ['
//                    + _(self.executionPath + '/env.json') + ']',
//                __stack
//            );
            console.debug('Applicaiton config file loaded ['
                    + _(self.executionPath + '/env.json') + ']',
                __stack);
        }

        self.Env.parent = self;
        if (env != 'undefined') self.Env.set(env);

        self.Host.parent = self;

        //Do some checking please.. like already has a PID ?.
        //if yes, join in case of standalone.. or create a new thread.
        self.Host.setMaster(self.startingApp);
        getConf()
    }

    var getConf = function() {

        //logger.debug('geena', 'CONFIG:DEBUG:2', 'Loading conf', __stack);
        console.debug('Loading conf', __stack);

        self.Env.load( function(err, envConf) {
            //logger.debug('geena', 'CONFIG:DEBUG:42', 'CONF LOADED 42', __stack);
            //logger.info('geena', 'CORE:INFO:42','on this Env LOAD!', __stack);

            if ( typeof(self.Env.loaded) == "undefined") {
                //Need to globalize some of them.
                self.env = Config.instance.env = env;
                self.envConf = Config.instance.envconf = envConf;
                loadBundlesConfiguration( function(err) {
                    //logger.debug('geena', 'CONFIG:DEBUG:42', 'CONF LOADED 43', __stack);
                    self.bundlesConfiguration = {
                        env             : self.Env.get(),
                        conf            : self.getInstance(),
                        bundles         : self.getBundles(),
                        allBundles      : self.getAllBundles(),
                        isStandalone    : self.Host.isStandalone()
                    };

                    //console.error("found bundles ", self.bundlesConfiguration.bundles);

                    //TODO - Don't override if syntax is ok - no mixed paths.
                    //Set paths for utils. Override for now.
                    //To reset it, just delete the hidden folder.
                    var geenaPath = opt.geenaPath;
                    var utilsConfig = new utils.Config();
                    setContext('geena.utils.config', utilsConfig);

                    utilsConfig.set('geena', 'locals.json', {
                        project : utilsConfig.getProjectName(),
                        paths : {
                            geena   : geenaPath,
                            utils   : utilsConfig.__dirname,
                            root    : opt.executionPath,
                            env     : opt.executionPath + '/env.json',
                            tmp     : opt.executionPath + '/tmp'
                        },
                        //TODO - Replace property by bundle.
                        bundles : self.bundlesConfiguration.allBundles,
                        //envs :
                    }, function(err) {
                        self.Env.loaded = true;
                        self.emit('complete', err, self.bundlesConfiguration)
                    })

                }, self.startingApp);//by default.
            }
        });
    }

    /**
     * Get Instance
     *
     * @param {string} [bundle]
     * @return {object|undefined} configuration|"undefined"
     * */

     this.getInstance = function(bundle) {

         self = Config.instance;
         var configuration = self.envConf;
         var env = self.env;

        self.Env.parent = self;
        if (env != 'undefined')
            self.Env.set(self.env);

        self.Host.parent = self;

        //Do some checking please.. like already has a PID ?.
        //if yes, join in case of standalone.. or create a new thread.
        self.Host.setMaster(bundle);
        if ( typeof(bundle) != 'undefined' && typeof(configuration) != 'undefined' ) {

            try {
                return configuration[bundle][self.Env.get()];
            } catch (err) {
                //logger.error('geena', 'CONFIG:ERR:1', err, __stack);
                console.error(err.stack||err.message);
                return undefined
            }
        } else if ( typeof(configuration) != 'undefined' ) {
            return configuration
        } else {
            return undefined
        }
    }

    /**
     * @class Env Sub class
     *
     *
     * @package     Geena.Config
     * @namespace   Geena.Config.Env
     * @author      Rhinostone <geena@rhinostone.com>
     */
    this.Env = {
        template : require('./template/conf/env.json'),
        load : function(callback) {
            try {

                var envConf = "";
                //console.error("loading once ", this.parent.userConf);

                //require(this.executionPath + '/env.json');

                if (this.parent.userConf) {

                    loadWithTemplate(this.parent.userConf, this.template, function(err, envConf) {
                        self.envConf = envConf;
                        //logger.warn('geena', 'CONFIG:WARN:10', 'envConf LOADED !!' + JSON.stringify(envConf, null, '\t') );
                        callback(false, envConf);
                    });
                } else {

                    envConf = this.template;
                    self.envConf = envConf;
                    //logger.warn('geena', 'CONFIG:WARN:10', 'envConf LOADED !!' + JSON.stringify(envConf, null, '\t'));
                    callback(false, envConf);
                }

            } catch(err) {
                //logger.warn('geena', 'CONF:ENV:WARN:1', err, __stack);
                console.warn(err.stack||err.message);
                callback(err);
            }
        },

        set : function(env) {
            var found = false;
            //logger.debug('geena', 'CONFIG:ENV:DEBUG:1', 'Setting Env',  __stack);
            console.debug('Setting Env',  __stack);
            var registeredEnvs = this.template.registeredEnvs;
            for (var e=0; e<registeredEnvs.length; ++e) {
                if (registeredEnvs[e] == env) {
                    this.current = env;
                    found = true;
                    break;
                }
            }

            if (typeof(found) == "undefined") {
                if (typeof(env) == "undefined") {
                    this.current = this.template.defEnv;
                } else {
                    //logger.error('geena', 'CONFIG:ENV:ERR:1', 'Env: ' + env + '] not found');
                    console.error(new Error('Env: ' + env + '] not found'));
                    process.exit(1);
                }
            }
        },

        /**
         * Get active env
         * @return {String} env
         **/
        get : function() {
            return this.current
        },

        /**
         * Get env config
         * @return {Object} json conf
         **/
        getConf : function(bundle, env) {
            //console.log("get from ....", appName, env);
            if ( typeof(bundle) != 'undefined' && typeof(env) != 'undefined' )
                return ( typeof(self.envConf) != "undefined" ) ? self.envConf[bundle][env] : null;
            else
                return ( typeof(self.envConf) != "undefined" ) ? self.envConf : null;
        },
        getDefault : function() {
            return {
                "env" : this.template.defEnv,
                "ext" : this.template.defExt,
                "registeredEnvs" : this.template.registeredEnvs
            }
        }
    }
    /**
     * Host Class
     *
     * @package    Geena.Config
     * @author     Rhinostone <geena@rhinostone.com>
     */
    this.Host = {
        //By default.
        standaloneMode : true,
        /**
         * Set Master instance
         * @param {String} appName Application name
         * @return {Object} instance Instance of the master node
         * */
        setMaster : function(appName) {
            if(typeof(this.master) == "undefined" && this.master !== "") {
                this.master = appName
            }
        },
        /**
         * Get Master instance
         * @return {Object} instance Instance of the master node
         * */
        getMaster : function() {
            return this.master
        },
        isStandalone : function() {
            return this.standaloneMode
        }
    }

    /**
     * Load config according to specific template
     * @param {String} filename  Path of source config file
     * @param {String} template Path of the template to merge with
     * @return {Oject} JSON of the merged config
     **/
    var loadWithTemplate = function(userConf, template, callback) {

        var content = userConf,
        //if nothing to merge.
            newContent = content;

        var isStandalone = true,
            env = self.Env.get(),
            appsPath = "",
            modelsPath = "";


        //Pushing default app first.
        self.bundles.push(self.startingApp);//This is a JSON.push.
        //console.log(" CONTENT TO BE SURE ", app, JSON.stringify(content, null, 4));
        //console.log("bundle list ", self.bundles);
        var root = new _(self.executionPath).toUnixStyle();
        try {
            var pkg = require(_(root + '/project.json')).bundles;
        } catch (err) {
            callback(err);
        } //bundlesPath will be default.


        //For each app.
        for (var app in content) {
            //Checking if genuine app.
//            logger.debug(
//                'geena',
//                'CONFIG:DEBUG:4',
//                'Checking if application is registered ' + app,
//                __stack
//            );
            console.debug('Checking if application is registered ' + app, __stack);

            //Now check if you have a description for each bundle.
//            if ( typeof(pkg[app]) == 'undefined' ) {
//                throw new Error('No definition found for bundle ['+ app +']in project.json');
//                //Sorry, can't work without... fix your shit.
//                process.kill(process.pid, 'SIGINT');
//            }
                //callback(new Error('No definition found for bundle ['+ app +']in project.json'));


            if ( typeof(content[app][env]) != "undefined" ) {

                if (
                    pkg[app] != 'undefined' && pkg[app]['src'] != 'undefined' && env == 'dev'
                    || pkg[app] != 'undefined' && pkg[app]['src'] != 'undefined' && env == 'debug'
                    ) {
                    var p = _(pkg[app].src);
                    content[app][env]['bundlesPath'] = "{executionPath}/"+ p.replace('/' + app, '');
                    //content[app][env]['bundlesPath'] = root + "/"+ p.replace('/' + app, '');
                } else {
                    var p = ( typeof(pkg[app].release.link) != 'undefined' ) ? _(pkg[app].release.link) : _(pkg[app].release.target);
                    content[app][env]['bundlesPath'] = "{executionPath}/"+ p.replace('/' + app, '');
                }

                appsPath = (typeof(content[app][env]['bundlesPath']) != "undefined")
                    ? content[app][env].bundlesPath
                    : template["{bundle}"]["{env}"].bundlesPath;



                modelsPath = (typeof(content[app][env]['modelsPath']) != "undefined")
                    ?  content[app][env].modelsPath
                    :  template["{bundle}"]["{env}"].modelsPath;

                //I had to for this one...
                appsPath = appsPath.replace(/\{executionPath\}/g, root);
                //modelsPath = modelsPath.replace(/\{executionPath\}/g, mPath);

                //console.log("My env ", env, self.executionPath, JSON.stringify(template, null, '\t') );
                //Existing app and port sharing => != standalone.
                if ( fs.existsSync(appsPath) ) {
                    var masterPort = content[self.startingApp][env].port.http;
                    //Check if standalone or shared instance
                    if (content[app][env].port.http != masterPort) {
                        //console.log("should be ok !!");
                        isStandalone = false;
                        self.Host.standaloneMode = isStandalone
                    } else if (app != self.startingApp) {
                        self.bundles.push(app)
                    }
                    self.allBundles.push(app);

//                    console.log(
//                        "\nenv                  => " + env,
//                        "\napp parsed           => " + app,
//                        "\napp is Standalone    => " + self.Host.isStandalone(),
//                        "\nstarting app         => " + self.startingApp,
//                        "\napp port             => " + content[app][env].port.http,
//                        "\nmaster port          => " + masterPort + '  ' + content[self.startingApp][env].port.http,
//                        "\nRegisterd bundles    => " + self.bundles
//                    );
                    //console.log("Merging..."+ app, "\n", content[app][env], "\n AND \n", template[app][env]);
                    //Mergin user's & template.
                    newContent[app][env] = merge(
                        content[app][env],
                        template["{bundle}"]["{env}"]
                    );


                    //Variables replace. Compare with geena/core/template/conf/env.json.
                    var reps = {
                        "executionPath" : root,
                        "bundlesPath" : appsPath,
                        "modelsPath" : modelsPath,
                        "env" : env,
                        "bundle" : app
                    };


                    //console.error("reps ", reps);
                    newContent = whisper(reps, newContent);
                } else {
//                    logger.warn(
//                        'geena',
//                        'CONFIG:WARN:1',
//                        'Server won\'t load [' +app + '] app or apps path does not exists: ' + _(appsPath),
//                        __stack
//                    );
                    console.warn( 'Server won\'t load [' +app + '] app or apps path does not exists: ' + _(appsPath),
                        __stack);
                    callback('Server won\'t load [' +app + '] app or apps path does not exists: ' + _(appsPath) )
                }

            }
            //Else not in the scenario.

        }//EO for.


//        logger.debug(
//            'geena',
//            'CONFIG:DEBUG:7',
//            'Env configuration loaded \n ' + newContent,
//            __stack
//        );
        console.debug('Env configuration loaded \n ' + newContent,
            __stack);

        //Means all apps sharing the same process.
        if (!isStandalone) self.Host.standaloneMode = isStandalone;

//        logger.debug(
//            'geena',
//            'CONFIG:DEBUG:3',
//            'Is server running as a standalone instance ? ' + isStandalone,
//            __stack
//        );

        console.debug('Is server running as a standalone instance ? ' + isStandalone,
            __stack);
        //return newContent;
        callback(false, newContent)
    }

    var isFileInProject = function(file) {

        try {
            var usrConf = require(self.executionPath +'/'+ file +'.json');
            return true
        } catch(err) {
            //logger.warn('geena', 'CONF:HOST:WARN:1', err, __stack);
            console.warn(err.stack||err.message);
            return false
        }
    }

    /**
     * Get Registered bundles sharing the same port #
     *
     * @return {array} bundles
     * */
    this.getBundles = function() {

        //Registered apps only.
//        logger.debug(
//            'geena',
//            'CONFIG:DEBUG:4',
//            'Pushing apps ' + JSON.stringify(self.bundles, null, '\t'),
//            __stack
//        );
        console.debug('Pushing apps ' + JSON.stringify(self.bundles, null, '\t'), __stack);
        return self.bundles
    }

    this.getAllBundles = function() {
        //Registered apps only.
//        logger.debug(
//            'geena',
//            'CONFIG:DEBUG:5',
//            'Pushing ALL apps ' + JSON.stringify(self.allBundles, null, '\t'),
//            __stack
//        );
        console.debug('Pushing ALL apps ' + JSON.stringify(self.allBundles, null, '\t'), __stack);
        return self.allBundles
    }

    var loadBundleConfig = function(bundle, callback, reload) {
        if ( typeof(bundle) == "undefined") {
            var bundle = self.startingApp
        }
        var bundles     = self.getBundles();
        var cacheless   = self.isCacheless();
        var conf        = self.envConf;
        var env         = self.Env.get();
        var routing     = {
            "geena-doc": {
                "url": "/@doc",
                "param": {
                    "namespace" : "framework",
                    "action": "doc"
                }
            }
        };
        var tmp         = '';
        //var tmpName     = '';
        var filename    = '';
        var err         = false;

        conf[bundle][env].bundles = bundles;
        conf[bundle].cacheless = cacheless;
        conf[bundle][env].executionPath = getContext("paths").root;

//        if (
//            self.task != 'run' && env == 'prod' ||
//            self.task == 'build' && env != 'dev'
//        ) { // like for build
//            //getting src path instead
//            var appPath = _(conf[bundle][env].sources + '/' + bundle)
//        } else {
//            var appPath = _(conf[bundle][env].bundlesPath + '/' + bundle)
//        }
        if ( self.task == 'run' && env != 'dev' ) {
            var appPath = _(conf[bundle][env].bundlesPath + '/' + bundle)
        } else { //getting src path instead
            var appPath = _(conf[bundle][env].sources + '/' + bundle)
        }

        var files = {};
        for (var name in  conf[bundle][env].files) {
            //Server only because of the shared mode VS the standalone mode.
            if (name == 'routing' && cacheless && typeof(reload) != 'undefined') {
                tmp = conf[bundle][env].files[name].replace(/.json/, '.' +env + '.json');
                filename = _(appPath + '/config/' + tmp);
                if ( fs.existsSync(filename) ) {
                    delete require.cache[_(filename, true)];
                    try {
                        routing = merge( true, routing, require(filename) );
                        routing = merge( true, files[name], require(filename) )
                    } catch (err) {
                        console.log(err.stack);
                        process.exit(1)
                    }

                } else {
                    filename = appPath + '/config/' + conf[bundle][env].files[name];
                    delete require.cache[_(filename, true)];
                    routing = merge( true, routing, require(filename) );
                }
                //setting app param
                if ( typeof(conf[bundle][env].content['views']) != 'undefined' ) {
                    for (var rule in routing) {
                        routing[rule].param.file = routing[rule].param.action;
                        var tmpRouting = [];
                        for (var i = 0, len = routing[rule].param.file.length; i < len; ++i) {
                            if (/[A-Z]/.test(routing[rule].param.file.charAt(i))) {
                                tmpRouting[0] = routing[rule].param.file.substring(0, i);
                                tmpRouting[1] = '-' + (routing[rule].param.file.charAt(i)).toLocaleLowerCase();
                                tmpRouting[2] = routing[rule].param.file.substring(i + 1);
                                routing[rule].param.file = tmpRouting[0] + tmpRouting[1] + tmpRouting[2];
                                ++i;
                            }
                        }
                    }
                }

            } else if (name == 'routing') {
                continue;
            }

            if (cacheless) {
                tmp = conf[bundle][env].files[name].replace(/.json/, '.' +env + '.json');
                filename = _(appPath + '/config/' + tmp);
                if (!fs.existsSync(filename) ) {
                    filename = _(appPath +'/config/'+ conf[bundle][env].files[name])
                }
                delete require.cache[_(filename, true)];
                tmp = '';
            } else {
                filename = _(appPath +'/config/'+ conf[bundle][env].files[name])
            }

            //Can't do a thing without.
            try {
                var main = _(appPath +'/config/'+ conf[bundle][env].files[name]);
                if (cacheless) {
                    tmp = conf[bundle][env].files[name].replace(/.json/, '.' +env + '.json');
                    filename = _(appPath + '/config/' + tmp);
                    if (!fs.existsSync(filename) ) {
                        filename = _(appPath +'/config/'+ conf[bundle][env].files[name]);

                    }
                    delete require.cache[_(filename, true)];
                    files[name] = require(filename);
                    tmp = '';
                } else {
                    filename = main
                }

                if ( fs.existsSync(main) ) {
                    files[name] = merge(true, files[name], require(main));
                }
            } catch (_err) {

                if ( fs.existsSync(filename) ) {
                    console.emerg("[ " +filename + " ] is malformed !!");
                    process.exit(1)
                } else {
                    files[name] = undefined
                }
                //console.error(_err.stack);
                //logger.warn('geena', 'SERVER:WARN:1', filename + _err, __stack);
                //logger.debug('geena', 'SERVER:DEBUG:5', filename +err, __stack)
            }

        }//EO for (name

        var hasViews = (typeof(files['views']) != 'undefined' && typeof(files['views']['default']) != 'undefined') ? true : false;
        //Set default keys/values for views
        if ( hasViews &&  typeof(files['views'].default.views) == 'undefined' ) {
            files['views'].default.views =  _(appPath +'/views')
        }

        if ( hasViews && typeof(files['views'].default.html) == 'undefined' ) {
            files['views'].default.html =  _(appPath +'/views/html')
        }

        if ( hasViews && typeof(files['views'].default.theme) == 'undefined' ) {
            files['views'].default.theme =  'default_theme'
        }


        //Constants to be exposed in configuration files.
        var reps = {
            "root"          : conf[bundle][env].executionPath,
            "env"           : env,
            "executionPath" : conf[bundle][env].executionPath,
            "bundlesPath"   : conf[bundle][env].bundlesPath,
            "mountPath"     : conf[bundle][env].mountPath,
            "bundlePath"    : conf[bundle][env].bundlePath,
            "modelsPath"    : conf[bundle][env].modelsPath,
            "logsPath"      : conf[bundle][env].logsPath,
            "tmpPath"       : conf[bundle][env].tmpPath,
            "env"           : env,
            "bundle"        : bundle,
            "host"          : conf[bundle][env].host
        };

        if (hasViews && typeof(files['views'].default) != 'undefined') {
            reps["views"] = files['views'].default.views;
            reps["html"] = files['views'].default.html;
            reps["theme"] = files['views'].default.theme;
        }

        var ports = conf[bundle][env].port;
        for (var p in ports) {
            reps[p+'Port'] = ports[p]
        }

        var localEnv = conf[bundle][env].executionPath + '/env.local.json';
        if ( env == 'dev' && fs.existsSync(localEnv) ) {
            conf[bundle][env] = merge(true, require(localEnv), conf[bundle][env]);
        }
        var envKeys = conf[bundle][env];
        for (var k in envKeys) {
            if ( typeof(envKeys[k]) != 'object' && typeof(envKeys[k]) != 'array' ) {
                reps[k] = envKeys[k]
            }
        }

        if (hasViews && typeof(files['statics']) == 'undefined') {
            files['statics'] = require(getPath('geena.core') +'/template/conf/statics.json')
        } else if ( typeof(files['statics']) != 'undefined' ) {
            var defaultAliases = require(getPath('geena.core') +'/template/conf/statics.json');
            files['statics'] = merge(true, files['statics'], defaultAliases)
        }

        files = whisper(reps, files);

        conf[bundle][env].content   = files;
        conf[bundle][env].bundle    = bundle;
        conf[bundle][env].env       = env;

        callback(err, files, routing)
    }

    /**
     * Load Apps Configuration
     *
     * TODO - simplify / optimize
     * */
     var loadBundlesConfiguration = function(callback) {

        var bundles = self.getBundles();
        var count = bundles.length;
        var bundle = undefined;
        //For each bundles.
        for (var i=0; i<bundles.length; ++i) {
            bundle = bundles[i];
            loadBundleConfig(bundle, function() {
                --count;
                if (count == 0) {
                    //We always return something.
                    callback(false)
                }
            })
        }//EO for each app
    }

    /**
     * Check is cache is disabled
     *
     * @return {boolean} isUsingCache
     * */
    this.isCacheless = function() {
        var env = Config.instance.Env.get();
        //Also defined in core/gna.
        return (env == "dev" || env == "debug") ? true : false
    }
    /**
     * Refresh for cachless mode
     *
     * @param {string} bundle
     *
     * @callback callback
     * @param {boolean|string} err
     * */
    this.refresh = function(bundle, callback) {
        var env = self.Env.get();
        var conf = self.envConf;

        //Reload models.
        var modelsPath = _(conf[bundle][env].modelsPath);
        var path;
        fs.exists(modelsPath, function(exists) {

            if (exists) {
                var files = fs.readdirSync(modelsPath);
                if ( typeof(files) == 'object' && files.count() > 0 ) {
                    for (var f=0; f<files.length; ++f) {
                        path = _(modelsPath + '/' + files[f], true);
                        delete require.cache[path]
                    }

                    var Model   = require('./model');
                    for (var m in conf[bundle][env].content.connectors) {
                        setContext(m+'Model',  new Model(conf[bundle][env].bundle + "/" + m))
                    }
                }
            }

            //Reload conf.
            loadBundleConfig( bundle, function(err, files, routing) {
                if (!err) {
                    callback(false, routing)
                } else {
                    callback(err)
                }
            }, true)
        })

    }//EO refresh.


    if (!opt) {
        //Interface
        return {
            getInstance : function(bundle) {
                return self.getInstance(bundle)
            },
            isCacheless : function() {
                //logger.info('geena', 'CORE:INFO:42','ninja conf  !!!!' + this.envConf, __stack);
                return self.isCacheless()
            },
            refresh : function(bundle, callback) {
                self.refresh(bundle, function(err, routing) {
                    callback(err, routing)
                })
            },
            Env : self.Env,
            Host : self.Host,
            setBundles : function(bundles) {
                self.bundles = bundles
            }
        }

    } else {

        //Defined before init.
        var env = opt.env, _ready = {err:'not ready', val: null};
        //logger.info('geena', 'CORE:INFO:42','about to init !!!! ', __stack);

        this.env = opt.env;
        init(opt);

        return {
            onReady : function(callback) {
                self.once('complete', function(err, config) {
                    callback(err, config)
                })
            },
            getInstance : function(bundle) {
                return self.getInstance(bundle)
            }
        }
    }


};

util.inherits(Config, EventEmitter);
module.exports = Config