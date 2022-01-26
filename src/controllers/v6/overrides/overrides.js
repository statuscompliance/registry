/*!
governify-registry 3.0.1, built on: 2018-04-18
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
const logger = governify.getLogger().tag('overrides');
const $RefParser = require('json-schema-ref-parser');
const db = require('../../../database');
const ErrorModel = require('../../../errors/index.js').errorModel;
const bills = require('../bills/bills');
const guarantees = require('../states/guarantees/guarantees');

/**
 * Registry override module.
 * @module overrides
 * @see module:AgreementRegistry
 * @see module:AgreementRegistryService
 * @requires config
 * @requires database
 * @requires states
 * @requires StateRegistryService
 * @requires errors
 * @requires json-schema-ref-parser
 * @requires governify-agreement-manager
 * */
module.exports = {
  statesAgreementGuaranteesGuaranteeOverridesPOST: _statesAgreementGuaranteesGuaranteeOverridesPOST,
  statesAgreementGuaranteesGuaranteeOverridesDELETE: _statesAgreementGuaranteesGuaranteeOverridesDELETE,
  statesAgreementGuaranteesGuaranteeOverridesGET: _statesAgreementGuaranteesGuaranteeOverridesGET,
  statesAgreementOverridesDELETE: _statesAgreementOverridesDELETE
};

function createOverride (override, agreement, guarantee) {
  return changeOverride(override, agreement, guarantee, false);
}

function deleteOverride (override, agreement, guarantee) {
  return changeOverride(override, agreement, guarantee, true);
}

function changeOverride (override, agreement, guarantee, deleteOverride) {
  return new Promise(function (resolve, reject) {
    const billPromise = bills.getBill(agreement, override.period.from);
    billPromise.then(
      function (billFromPeriod) {
        if (!billFromPeriod || billFromPeriod.state.toUpperCase() !== 'CLOSED') {
          const OverridesModel = db.models.OverridesModel;
          OverridesModel.findOne(
            {
              agreement: agreement,
              guarantee: guarantee,
              'overrides.id': override.id,
              'overrides.scope.priority': override.scope.priority,
              'overrides.period.from': override.period.from
            },
            function (err, result) {
              if (result && !deleteOverride) {
                reject(new ErrorModel(500, 'That override already exists.'));
              } else if (!result && deleteOverride) {
                reject(new ErrorModel(404, 'That override does not exist.'));
              } else {
                OverridesModel.findOne(
                  {
                    agreement: agreement,
                    guarantee: guarantee
                  },
                  function (err, result) {
                    if (err) {
                      logger.error(err.toString());
                      reject(new ErrorModel(500, err));
                    } else {
                      let newOverrides = [];
                      if (result && result.overrides.length > 0) {
                        newOverrides = result.overrides;
                      }
                      if (!deleteOverride) {
                        newOverrides.push(override);
                      }
                      OverridesModel.update(
                        {
                          agreement: agreement,
                          guarantee: guarantee
                        },
                        deleteOverride
                          ? {
                            $pull: {
                              overrides: override
                            }
                          }
                          : {
                            overrides: newOverrides
                          },
                        {
                          upsert: true
                        },
                        function (err) {
                          if (err) {
                            logger.error(
                              'Mongo error saving override: ' + err.toString()
                            );
                            reject(new ErrorModel(500, err));
                          } else {
                            logger.info('New override saved successfully!');
                            logger.info('Initializing agreement state');
                            // Initialize state
                            const query = {
                              from: override.period.from,
                              to: override.period.to
                            };
                            guarantees
                              .getGuarantees(agreement, guarantee, query, true)
                              .then(
                                function (result) {
                                  logger.info(
                                    'State from override updated correctly-'
                                  );
                                  resolve('OK');
                                  const requestData = {
                                    periods: [{
                                      from: override.period.from,
                                      to: override.period.to
                                    }
                                    ]
                                  };
                                  const AgreementModel = db.models.AgreementModel;
                                  AgreementModel.findOne(
                                    {
                                      id: agreement
                                    },
                                    async function (err, agreementRes) {
                                      if (!err && agreementRes) {
                                        const recalculateRequest = await governify.infrastructure.getService('internal.reporter').post('/api/v4/contracts/' + agreement + '/createPointsFromPeriods', requestData).catch(err => {
                                          logger.error('Error recalculating from override:', err);
                                        });
                                        if (recalculateRequest) {
                                          logger.debug('Result of point recalculation due to an override: ', recalculateRequest.status);
                                        }
                                      }
                                    }
                                  );
                                },
                                function (err) {
                                  reject(err);
                                }
                              );
                          }
                        }
                      );
                    }
                  }
                );
              }
            }
          );
        } else {
          reject(
            new ErrorModel(
              403,
              'You cannot override periods when the bill is closed.'
            )
          );
        }
      },
      function (err) {
        logger.error(err.toString);
      }
    );
  });
}
/**
 * Post an agreement
 * @param {Object} args {agreement: String}
 * @param {Object} res response
 * @param {Object} next next function
 * @alias module:agreement.agreementsPOST
 * */
function _statesAgreementGuaranteesGuaranteeOverridesPOST (args, res) {
  logger.info('New request to CREATE override');
  $RefParser.dereference(args.override.value, function (err, schema) {
    if (err) {
      logger.error(err.toString());
      res.status(500).json(new ErrorModel(500, err));
    } else {
      const overridePromise = createOverride(args.override.value, args.agreement.value, args.guarantee.value);
      overridePromise.then(function (result) {
        res.status(200).send(result);
      },
      function (error) {
        res.status(error.code).json(error);
      });
    }
  });
}

/**
 * Delete override.
 * @param {Object} args {}
 * @param {Object} res response
 * @param {Object} next next function
 * @alias module:override.overrideDELETE
 * */
function _statesAgreementGuaranteesGuaranteeOverridesDELETE (args, res) {
  logger.info('New request to DELETE override');
  $RefParser.dereference(args.override.value, function (err, schema) {
    if (err) {
      logger.error(err.toString());
      res.status(500).json(new ErrorModel(500, err));
    } else {
      deleteOverride(args.override.value, args.agreement.value, args.guarantee.value).then(function (result) {
        res.status(200).send(result);
      },
      function (error) {
        res.status(error.code).json(error);
      });
    }
  });
}

/**
 * Get all agreements.
 * @param {Object} args {}
 * @param {Object} res response
 * @param {Object} next next function
 * @alias module:agreement.agreementsGET
 * */
function _statesAgreementGuaranteesGuaranteeOverridesGET (args, res) {
  /**
   * parameters expected in the args:
   * namespace (String)
   **/
  logger.info('New request to GET overrides overrides/overrides.js');
  const OverridesModel = db.models.OverridesModel;
  OverridesModel.findOne({
    agreement: args.agreement.value,
    guarantee: args.guarantee.value
  }, function (err, overrides) {
    if (err) {
      logger.error(err.toString());
      res.status(500).json(new ErrorModel(500, err));
    }
    if (!overrides || overrides === '') {
      res.status(200).json([]);
    } else {
      logger.info('Overrides returned');
      res.status(200).json(overrides.overrides);
    }
  });
}

/**
 * Delete override.
 * @param {Object} args {}
 * @param {Object} res response
 * @param {Object} next next function
 * @alias module:override.overrideDELETE
 * */
function _statesAgreementOverridesDELETE (args, res) {
  logger.info('New request to DELETE all overrides for agreement');

  const OverridesModel = db.models.OverridesModel;
  OverridesModel.deleteMany({
    agreement: args.agreement.value
  }, function (err, result) {
    if (err) {
      logger.error(err.toString());
      res.status(500).json(new ErrorModel(500, err));
    } else {
      logger.info('Deleted all overrides for agreement ' + args.agreement.value);
      res.status(200).send('OK');
    }
  });
}
