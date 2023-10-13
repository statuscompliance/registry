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

const agreementTemplates = require('./agreementTemplates/agreementTemplates.js');

/**
 * Registry agreement module.
 * @module AgreementTemplateRegistry
 * @see module:AgreementTemplateRegistryService
 * @see module:agreementTemplates
 * @requires AgreementTemplateRegistryService
 * */
module.exports = {

  agreementTemplatesGET: _agreementTemplatesGET,
  agreementTemplatesDELETE: _agreementTemplatesDELETE,
  agreementTemplatesPOST: _agreementTemplatesPOST,

  agreementTemplateIdGET: _agreementTemplateIdGET,
  agreementTemplateIdDELETE: _agreementTemplateIdDELETE,

};


/**
 * agreementTemplatesIdDELETE.
 * @param {Object} req request
 * @param {Object} res response
 * @param {Object} next next function
 * @alias module:AgreementTemplateRegistry.agreementTemplatesIdDELETE
 * */
function _agreementTemplateIdDELETE (req, res, next) {
  agreementTemplates.agreementTemplateIdDELETE(req.swagger.params, res, next);
}

/**
 * agreementTemplatesIdGET.
 * @param {Object} req request
 * @param {Object} res response
 * @param {Object} next next function
 * @alias module:AgreementTemplateRegistry.agreementTemplatesIdGET
 * */
function _agreementTemplateIdGET (req, res, next) {
  agreementTemplates.agreementTemplateIdGET(req.swagger.params, res, next);
}

/**
 * agreementTemplatesGET.
 * @param {Object} req request
 * @param {Object} res response
 * @param {Object} next next function
 * @alias module:AgreementTemplateRegistry.agreementTemplatesGET
 * */
function _agreementTemplatesGET (req, res, next) {
  agreementTemplates.agreementTemplatesGET(req.swagger.params, res, next);
}

/**
 * agreementTemplatesDELETE.
 * @param {Object} req request
 * @param {Object} res response
 * @param {Object} next next function
 * @alias module:AgreementTemplateRegistry.agreementTemplatesDELETE
 * */
function _agreementTemplatesDELETE (req, res, next) {
  agreementTemplates.agreementTemplatesDELETE(req.swagger.params, res, next);
}

/**
 * agreementTemplatesPOST.
 * @param {Object} req request
 * @param {Object} res response
 * @param {Object} next next function
 * @alias module:AgreementTemplateRegistry.agreementTemplatesPOST
 * */
function _agreementTemplatesPOST (req, res, next) {
  agreementTemplates.agreementTemplatesPOST(req.swagger.params, res, next);
}
