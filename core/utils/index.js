/*
 * This file is part of the geena package.
 * Copyright (c) 2013 Rhinostone <geena@rhinostone.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Geena.Core.Utils Class
 *
 * @package    Geena.Core
 * @author     Rhinostone <geena@rhinostone.com>
 */

//Global helpers.
//var ConsoleHelper   = require('./lib/helpers').Console;
//var PathHelper = require('./lib/helpers').Path;


//By default
var utils = {
    Config  : require('./lib/config'),
    //Dev     : require('./lib/dev'),
    helpers : require('./lib/helpers'),
    //this one must move to Dev since it's dev related
    extend  : require('./lib/extend'),
    Proc    : require('./lib/proc'),
    logger  : require('./lib/logger'),
    cmd     : require('./lib/cmd')
};


//Load optionals via settings.json => utils > use.
//utils.Ssi = require('./lib/ssi');
//utils.Generator = require('./lib/generator');

/**
 * Loading framework package
 *
 * @param {string} root - Root path
 * @param {string} packacge - Pacakge.json path
 * */
utils.cmd.load = function(root, package){

    //Setting root for helpers.
    setPath('root', root);

    //Getting package.
    var p = require( _(root + package) ),
        geenaPath = _(root + package.replace('/package.json', ''));

    utils.cmd.setOption([
        {
            'name' : 'version',
            'content' : p.version
        },
        {
            'name' : 'copyright',
            'content' : p.copyright
        },
        {
            'name' : 'root',
            'content' : root
        },
        {
            'name' : 'core',
            'content' : _(geenaPath +'/core')
        }
    ]);

    //Set geena path.
    setPath('geena.core', _(geenaPath +'/core'));
    utils.cmd.onExec();
};


utils.log = function(content){
    log(content);
};


utils.refToObj = function (arr){
    var tmp = null,
        curObj = {},
        obj = {},
        count = 0,
        data = {},
        last = null;
    //console.info('arr is --------------------------\n', arr);
    for (var r in arr) {
        tmp = r.split(".");
        //console.info('len ', r,tmp);
        //Creating structure - Adding sub levels
        for (var o in tmp) {
            //console.info('ooo ', o, tmp[o], arr[r]);
            count++;
            if (last && typeof(obj[last]) == "undefined") {
                curObj[last] = {};
                //console.info("count is ", count);
                if (count >= tmp.length) {
                    //Assigning.
                    // !!! if null or undefined, it will be ignored while extending.
                    curObj[last][tmp[o]] = (arr[r]) ? arr[r] : "undefined";
                    last = null;
                    count = 0;
                    break;
                } else {
                    curObj[last][tmp[o]] = {};
                }
            } else if (tmp.length === 1) { //Just one root var
                //console.info('assigning ', arr[r], ' to ',tmp[o]);
                curObj[tmp[o]] = (arr[r]) ? arr[r] : "undefined";
                //last = null;
                //count = 0;
                obj = curObj;
                break;
            }
            obj = curObj;
            last = tmp[o];
        }
        //console.info('current obj ',obj);
        data = extend(true, data, obj);
        //console.info('merged ', data);
        obj = {};
        curObj = {};
    }
    return data;
};

/**
* Clean files on directory read
* Mac os Hack
**/
utils.cleanFiles = function(files){
    for(var f=0; f< files.length; f++){
        if(files[f].substring(0,1) == '.')
            files.splice(0,1);
    }
    return files;
};

module.exports = utils;