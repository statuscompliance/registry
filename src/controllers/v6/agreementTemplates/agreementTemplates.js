/*!
Copyright (C) 2018 ISA group
http://www.isa.us.es/
https://github.com/isa-group/governify-registry

governify-registry is an Open-source software available under the
GNU General Public License (GPL) version 2 (GPL v2) for non-profit
applications; for commercial licensing terms, please see README.md
for any inquiry.

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

const governify = require('governify-commons');
const logger = governify.getLogger().tag('agreementTemplate-manager');
const $RefParser = require('json-schema-ref-parser');
const db = require('../../../database');

const states = require('../states/states');
const ErrorModel = require('../../../errors/index.js').errorModel;

/**
 * Registry agreementTemplate module.
 * @module agreements
 * @see module:AgreementTemplateRegistry
 * @see module:AgreementTemplateRegistryService
 * @requires config
 * @requires database
 * @requires states
 * @requires StateRegistryService
 * @requires errors
 * @requires json-schema-ref-parser
 * @requires governify-agreementTemplate-manager
 * */
module.exports = {
  agreementTemplatesPOST: _agreementTemplatesPOST,
  agreementTemplatesDELETE: _agreementTemplatesDELETE,
  agreementTemplatesGET: _agreementTemplatesGET,
  agreementTemplateIdGET: _agreementTemplateIdGET,
  agreementTemplateIdDELETE: _agreementTemplateIdDELETE,
};

/**
 * Post an agreementTemplate
 * @param {Object} args {agreementTemplate: String}
 * @param {Object} res response
 * @param {Object} next next function
 * @alias module:agreementTemplate.agreementTemplatesPOST
 * */
function _agreementTemplatesPOST (args, res) {
  logger.info('New request to CREATE agreementTemplate');
  $RefParser.dereference(args.agreementTemplate.value, function (err, schema) {
    if (err) {
      logger.error(err.toString());
      res.status(500).json(new ErrorModel(500, err));
    } else {
      const agreementTemplate = new db.models.AgreementTemplateModel(schema);
      agreementTemplate.save(function (err,data) {
        if (err) {
            logger.error('Mongo error saving agreementTemplate template: ' + err.toString());
            res.status(500).json(new ErrorModel(500, {data: err, text: err.toString()}));

        } else {
          logger.info('New agreementTemplate template saved successfully!');
          res.status(200).json(data)
        }
      });
    }
  });
}

/**
 * Delete all agreements.
 * @param {Object} args {}
 * @param {Object} res response
 * @param {Object} next next function
 * @alias module:agreementTemplate.agreementsDELETE
 * */
function _agreementTemplatesDELETE (args, res) {
  logger.info('New request to DELETE all agreements');
  const AgreementTemplateModel = db.models.AgreementTemplateModel;
  AgreementTemplateModel.remove({}, function (err) {
    if (!err) {
      logger.info('Deleted all agreements');
      states.agreements.statesDELETE(args, res);
    } else {
      res.sendStatus(404);
      logger.warn("Can't delete all agreements: " + err);
    }
  });
}

/**
 * Get all agreements.
 * @param {Object} args {}
 * @param {Object} res response
 * @param {Object} next next function
 * @alias module:agreementTemplate.agreementsGET
 * */
function _agreementTemplatesGET (args, res) {
  /**
     * parameters expected in the args:
     * namespace (String)
     **/
  logger.info('New request to GET agreements agreements/agreements.js');
  const AgreementTemplateModel = db.models.AgreementTemplateModel;
  AgreementTemplateModel.find(function (err, agreements) {
    if (err) {
      logger.error(err.toString());
      res.status(500).json(new ErrorModel(500, err));
    }
    logger.info('Agreements returned');
    res.status(200).json(agreements);
  });
}

/**
 * Get an agreementTemplate by agreementTemplate ID.
 * @param {Object} args {agreementTemplate: String}
 * @param {Object} res response
 * @param {Object} next next function
 * @alias module:agreementTemplate.agreementIdGET
 * */
function _agreementTemplateIdGET (args, res) {
  console.log(Object.keys(args))
  logger.info('New request to GET agreementTemplate with id = ' + args.agreementTemplateId.value);
  const AgreementTemplateModel = db.models.AgreementTemplateModel;
  AgreementTemplateModel.findOne({
    _id: args.agreementTemplateId.value
  }, function (err, agreementTemplate) {
    if (err) {
      logger.error(err.toString());
      return res.status(500).json(new ErrorModel(500, err));
    }

    if (!agreementTemplate) {
      logger.warn('There is no agreementTemplate with id: ' + args.agreementTemplateId.value);
      return res.status(404).json(new ErrorModel(404, 'There is no agreementTemplate with id: ' + args.agreementTemplateId.value));
    }

    logger.info('agreementTemplate returned');
    res.status(200).json(agreementTemplate);
  });
}

/**
 * Delete an agreementTemplate by agreementTemplate ID.
 * @param {Object} args {agreementTemplate: String}
 * @param {Object} res response
 * @param {Object} next next function
 * @alias module:agreementTemplate.agreementIdDELETE
 * */
function _agreementTemplateIdDELETE (args, res) {
  logger.info('New request to DELETE agreementTemplate');
  const agreementId = args.agreementTemplateId.value;
  if (agreementId) {
    const AgreementTemplateModel = db.models.AgreementTemplateModel;
    AgreementTemplateModel.remove({
      _id: agreementId
    }, function (err) {
      if (!err) {
        logger.info('Deleted agreementTemplate with id ' + agreementId);
        res.sendStatus(204)
      } else {
        res.sendStatus(404);
        logger.warn("Can't delete agreementTemplate with id " + agreementId);
      }
    });
  } else {
    res.sendStatus(400);
    logger.warn("Can't delete agreementTemplate with id " + agreementId);
  }
}



