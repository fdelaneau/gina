/*
 * This file is part of the geena package.
 * Copyright (c) 2014 Rhinostone <geena@rhinostone.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * ContextHelper
 *
 * @package     Geena.Utils.Helpers
 * @author      Rhinostone <geena@rhinostone.com>
 * @api public
 * */
var ContextHelper;

var os = require('os');
var EventEmitter = require('events').EventEmitter;
var merge = require('./../merge');

/**
 * ContextHelper Constructor
 * */
ContextHelper = function(contexts) {

    var _this = this;

    var init = function(contexts) {
        if ( typeof(ContextHelper.initialized) != "undefined" ) {
            return ContextHelper.instance
        } else {
            ContextHelper.initialized = true;
            ContextHelper.instance = _this
        }

        if ( typeof(contexts) == 'undefined' ) {
            var contexts = {
                paths : {}
            }
        }
        _this.contexts = contexts
    }

    joinContext = function(context) {
        merge(true, _this.contexts, context)
    }

    setContext = function(name, obj) {

        if (arguments.length > 1) {
            //console.log("Globla setter active ", name, obj);
            //if (type)
            if ( typeof(name) == 'undefined' || name == '' ) {
                var name = 'global'
            }

            if ( typeof(_this.contexts[name]) != "undefined") {
                merge(_this.contexts[name], obj)
            } else {
                _this.contexts[name] = obj
            }
        } else {
            //console.log("setting context ", arguments[0]);
            _this.contexts = arguments[0]
        }
    }

    getContext = function(name) {
        //console.log("getting ", name, _this.contexts.content[name], _this.contexts);
        if ( typeof(name) != 'undefined' ) {
            try {
                return _this.contexts[name]
            } catch (err) {
                return undefined
            }
        } else {
            return _this.contexts
        }
    }

    /**
     * Whisper
     * Convert replace constant names dictionary by its value
     *
     * @param {object} dictionary
     * @param {object} replaceable
     *
     * @return {object} revealed
     * */
    whisper = function(dictionary, replaceable, rule) {
        if ( typeof(rule) != 'undefined') {
            return replaceable.replace(rule, function(s, key) {
                return dictionary[key] || s;
            })
        } else {

            if (typeof(replaceable) != 'function') {
                replaceable = JSON.stringify(replaceable, null, 2);
                return JSON.parse(
                    replaceable.replace(/\{(\w+)\}/g, function(s, key) {
                        return dictionary[key] || s;
                    })
                )
            } else { // mixing class and object
                var rep = {};
                for (var f in replaceable) {
                    if ( typeof(replaceable[f]) != 'function') {
                        rep[f] = replaceable[f]
                    }
                }
                return merge(true, whisper(dictionary, rep, rule), replaceable)
            }

        }
    }

    isWin32 = function() {
        return (os.platform() == 'win32') ? true : false;
    }

    init(contexts)
};

module.exports = ContextHelper;