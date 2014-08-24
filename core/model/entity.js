/*
 * This file is part of the geena package.
 * Copyright (c) 2014 Rhinostone <geena@rhinostone.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var utils = require('geena').utils;
var console = utils.logger;
var helpers = utils.helpers;
var inherits = utils.inherits;
var modelHelper = new utils.Model();
//var Config = require('../config');
//var config = new Config();

/**
 * @class Model.{Model}.EntitySuper class
 *
 *
 * @package     Geena
 * @namespace   Geena.Model.{Model}
 * @author      Rhinostone <geena@rhinostone.com>
 * @api         Public
 */
function EntitySuper(conn) {

    var self = this;

    var init = function() {
        if (!EntitySuper[self.name]) {
            EntitySuper[self.name] = {}
        }
        if ( !EntitySuper[self.name].instance ) {
            setListeners();
            EntitySuper[self.name].instance = self;
            return self
        } else {
            return EntitySuper[self.name].instance;
        }
    }

    /**
     * Set all main listenners at once
     * */
    var setListeners = function() {
        if ( !EntitySuper[self.name].hasOwnEvents ) {
            EntitySuper[self.name].hasOwnEvents = true;
            // get entity objet
            var entity = self.getEntity(self.name);
            // use this property inside your entity to disable listeners
            if (entity.hasOwnEvents) return false;

            var shortName = self.name.replace(/Entity/, '').toLocaleLowerCase();
            var events = [], i = 0;

            for (var f in entity) {
                if (
                    typeof(entity[f]) == 'function' &&
                    !self[f] &&
                    f != 'onComplete' &&
                    f.substr(f.length-4) !== 'Sync' &&
                    f.substr(f.length-5) !== '_sync'&&
                    f.substr(f.length-5) !== '-sync'
                ) {
                    events[i] = shortName +'#'+ f;
                    ++i;

                    entity[f] = (function() {
                        var cached = entity[f];
                        return function() {
                            cached.apply(this, arguments);
                            return this // chaining event & method
                        }
                    }());
                    console.debug('setting listener for: [ '+self.model+' ]' + f);
                }
            }

            entity.onComplete = function(cb) {
                // Loop on registered events
                for (var i=0; i<events.length; ++i) {
                    entity.once(events[i], function(err, data) {
                        cb(err, data)
                    })
                }
            };
            // now merge with the current entity object
            modelHelper.updateEntityObject(self.model, shortName+'Entity', entity)
        }
    }

    this.getConnection = function() {
        return ( typeof(conn) != 'undefined' ) ? conn : null;
    }

    this.getEntity = function(entity) {
        entity = entity.substr(0,1).toUpperCase() + entity.substr(1);
        if (entity.substr(entity.length-6) != 'Entity') {
            entity = entity + 'Entity'
        }

        try {
            return getModelEntity(self.model, entity, conn)
        } catch (err) {
            throw new Error(err.stack);
            return null
        }
    }

    // self.trigger might be useless because of the existing self.emit(evt, err, data)
    ///**
    // * Trigger callback
    // *
    // * */
    //this.trigger = function(err, data, evt) {
    //    // eg.: evt = 'user#set';
    //    self.emit(evt, err, data);
    //};

    return init()
};

EntitySuper = inherits(EntitySuper, EventEmitter);
module.exports = EntitySuper