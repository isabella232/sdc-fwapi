/*
 * Copyright 2013 Joyent, Inc.  All rights reserved.
 *
 * Restify handlers for listing rules applied to vms
 */

var common = require('../common');
var mod_err = require('../../errors');
var restify = require('restify');
var util = require('util');
var validators = require('fwrule/lib/validators');



// --- Internal helpers



/**
 * restify 'before' handler for validating request parameters
 * for getVMrules below
 */
function validateParams(req, res, next) {
  if (!validators.validateUUID(req.params.uuid)) {
    return next(new mod_err.InvalidParamsError(mod_err.INVALID_MSG,
      [ mod_err.invalidParam('uuid', 'Invalid UUID') ]));
  }

  if (req.params.hasOwnProperty('owner_uuid')
    && !validators.validateUUID(req.params.owner_uuid)) {
    return next(new mod_err.InvalidParamsError(mod_err.INVALID_MSG,
      [ mod_err.invalidParam('owner_uuid', 'Invalid UUID') ]));
  }

  return next();
}



// --- Restify handlers



/**
 * GET /firewalls/vms/:uuid
 */
function getVMrules(req, res, next) {
  req._vmapi.getVm(req.params, function (err, vm) {
    if (err) {
      return next(err);
    }
    var filter = {
      tags: vm.tags,
      vms: [ vm.uuid ]
    };

    req.log.debug(filter, 'filtering UFDS rules');
    common.filterUFDSrules(filter, req._app, req.log, function (err, rules) {
      if (err) {
        return next(err);
      }

      res.send(200, rules.map(function (r) {
        return r.serialize();
      }));

      return next();
    });
  });
}



// --- Exports



/**
 * Registers endpoints with a restify server
 */
function register(server, before) {
  server.get({ path: '/firewalls/vms/:uuid', name: 'getVMrules' },
    before.concat(validateParams), getVMrules);
}



module.exports = {
  register: register
};