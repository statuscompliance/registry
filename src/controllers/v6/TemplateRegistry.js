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

const templates = require('./templates/templates.js');

/**
 * Registry template module.
 * @module TemplateRegistry
 * @see module:TemplateRegistryService
 * @see module:templates
 * @requires TemplateRegistryService
 * */
module.exports = {

  templatesGET: _templatesGET,
  templatesDELETE: _templatesDELETE,
  templatesPOST: _templatesPOST,

  templateTemplateIdGET: _templateTemplateIdGET,
  templateTemplateIdDELETE: _templateTemplateIdDELETE,

};


/**
 * templatesIdDELETE.
 * @param {Object} req request
 * @param {Object} res response
 * @param {Object} next next function
 * @alias module:TemplateRegistry.templatesIdDELETE
 * */
function _templateTemplateIdDELETE (req, res, next) {
  templates.templateTemplateIdDELETE(req.swagger.params, res, next);
}

/**
 * templatesIdGET.
 * @param {Object} req request
 * @param {Object} res response
 * @param {Object} next next function
 * @alias module:TemplateRegistry.templatesIdGET
 * */
function _templateTemplateIdGET (req, res, next) {
  templates.templateTemplateIdGET(req.swagger.params, res, next);
}

/**
 * templatesGET.
 * @param {Object} req request
 * @param {Object} res response
 * @param {Object} next next function
 * @alias module:TemplateRegistry.templatesGET
 * */
function _templatesGET (req, res, next) {
  templates.templatesGET(req.swagger.params, res, next);
}

/**
 * templatesDELETE.
 * @param {Object} req request
 * @param {Object} res response
 * @param {Object} next next function
 * @alias module:TemplateRegistry.templatesDELETE
 * */
function _templatesDELETE (req, res, next) {
  templates.templatesDELETE(req.swagger.params, res, next);
}

/**
 * templatesPOST.
 * @param {Object} req request
 * @param {Object} res response
 * @param {Object} next next function
 * @alias module:TemplateRegistry.templatesPOST
 * */
function _templatesPOST (req, res, next) {
  templates.templatesPOST(req.swagger.params, res, next);
}
