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


"use strict";

const logger = require('../../logger');
const Promise = require('bluebird');
const request = require('request');
const governify = require('governify-commons');
const JSONStream = require('JSONStream');
const qs = require('querystring');

const utils = require('../../utils');

const Query = utils.Query;
const promiseErrorHandler = utils.errors.promiseErrorHandler;

/**
 * Metric calculator module.
 * @module metricCalculator
 * @requires config
 * @requires bluebird
 * @requires js-yaml
 * @requires request
 * @requires JSONStream
 * @see module:calculators
 * */
module.exports = {
    process: processMetric
};


/**
 * Process all metrics.
 * @param {Object} agreement agreement
 * @param {Object} metricId metric ID
 * @param {Object} metricQuery metric query object
 * @alias module:metricCalculator.process
 * */
function processMetric(agreement, metricId, metricQuery) {
    return new Promise(async function (resolve, reject) {
        try {
            var metric = agreement.terms.metrics[metricId];
            if (!metric) {
                return reject('Metric ' + metricId + ' not found.');
            }

            var collector = metric.collector;

            /**### BUILD COMPUTER REQUEST QUERY ###**/
            var collectorQuery = {};
            collectorQuery.parameters = metricQuery.parameters;
            collectorQuery.window = metricQuery.window;

            if (metricQuery.evidences) {
                collectorQuery.evidences = metricQuery.evidences;
            }
            // //Select logs data. If metric has not log, select by default log.
            // var logDefinition, logId;
            // if (metric.log) {
            //     logId = Object.keys(metric.log)[0]; //control this potential error
            //     if (!logId) { throw new Error('The log field of metric is not well defined in the agreement'); }
            //     logDefinition = metric.log[logId];
            // } else {
            //     //Search default log
            //     var agLogs = agreement.context.definitions.logs;
            //     for (var l in agLogs) {
            //         if (agLogs[l].default) {
            //             logId = l;
            //             logDefinition = agLogs[l];
            //             break;
            //         }
            //     }
            //     if (!logDefinition) { throw new Error('Agreement is not well defined. It Must has at least a default log.'); }
            // }
            // //Build logs field on computer request body //
            // collectorQuery.logs = {};
            // collectorQuery.logs[logId] = new LogField(
            //     logDefinition.uri,
            //     logDefinition.stateUri,1
            //     logDefinition.terminator,
            //     logDefinition.structure
            // );

            // Mapping of columns names in log
            // var scope = utils.scopes.registryToComputerParser(metricQuery.scope, null);

            var scope = metricQuery.scope;


            logger.metrics('Using collector type: ' + collector.type);

            if (collector.type === 'GET-V1') {
                console.error('This registry version is not compatible with the collector type:', collector.type);
                //TODO: To add compatibility for old collector versions (like collector-pivotal,collector-github), refactor the code to allow old GET collector types
                //Old code for this implementation is available in the registry repository:
                //https://github.com/governify/registry/blob/6b530bce8cf4c4bbf86a0c43a45b64753eb6a410/src/stateManager/v6/metric-calculator.js
                return resolve({});
            } else if (collector.type === 'POST-GET-V1') {
                metric.measure.scope = Object.keys(scope).length > 0 ? scope : metricQuery.scope;
                metric.measure.window = metricQuery.window
                var compositeResponse = [];
                let requestMetric = await governify.infrastructure.getService(collector.infrastructurePath).request({
                    url: collector.endpoint,
                    method: 'POST',
                    data: { config: collector.config, metric: metric.measure }
                }
                ).catch(err => {
                    var errorString = "Error in Collector response " + err.response.status + ':' + err.response.data;
                    return promiseErrorHandler(reject, "metrics", processMetric.name, err.response.status, errorString);
                })
                let collectorResponse = requestMetric.data;
                let monthMetrics = await getComputationV2(collector.infrastructurePath, collector.endpoint + "/" + collectorResponse.computation.replace(/^\//, ""), 60000).catch(err => {
                    let errorString = 'Error obtaining computation from computer: ' + metricId + '(' + err + ')';
                    return promiseErrorHandler(reject, "metrics", processMetric.name, 500, errorString, err);
                });

                try {
                    //Check if computer response is correct
                    if (monthMetrics && Array.isArray(monthMetrics)) {
                        //For each state returned by computer map the scope
                        monthMetrics.forEach(function (metricState) {
                            if (metricState.log && metric.scope) {
                                //Getting the correct log for mapping scope
                                var logId = Object.keys(metricState.log)[0];
                                var log = agreement.context.definitions.logs[logId];
                                //doing scope mapping
                                metricState.scope = utils.scopes.computerToRegistryParser(metricState.scope, log.scopes);
                            }
                            //aggregate metrics in order to return all
                            compositeResponse.push(metricState);
                        });
                        logger.metrics('Mapping of columns names in log processed.');

                        return resolve({
                            metricId: metricId,
                            metricValues: compositeResponse
                        });
                    } else {
                        let errorString = "Error in computer response for metric: " + metricId + ". Response is not an array:  " + JSON.stringify(monthMetrics);
                        return promiseErrorHandler(reject, "metrics", processMetric.name, 500, errorString);
                    }
                } catch (err) {
                    let errorString = "Error processing computer response for metric: " + metricId;
                    return promiseErrorHandler(reject, "metrics", processMetric.name, 500, errorString, err);
                }
            } else if (collector.type === 'PPINOT-V1') { //For ppinot collector

                var metric = agreement.terms.metrics[metricId];
                if (!metric) {
                    return reject('Metric ' + metricId + ' not found.');
                }

                var metricCollectorObject = metric.collector;

                /**### BUILD COMPUTER REQUEST QUERY ###**/
                var collectorQuery = {};
                collectorQuery.parameters = metricQuery.parameters;
                collectorQuery.window = metricQuery.window;

                if (metricQuery.evidences) {
                    collectorQuery.evidences = metricQuery.evidences;
                }

                //Select logs data. If metric has not log, select by default log.
                var logDefinition, logId;
                if (metric.log) {
                    logId = Object.keys(metric.log)[0]; //control this potential error
                    if (!logId) { throw new Error('The log field of metric is not well defined in the agreement'); }
                    logDefinition = metric.log[logId];
                } else {
                    //Search default log
                    var agLogs = agreement.context.definitions.logs;
                    for (var l in agLogs) {
                        if (agLogs[l].default) {
                            logId = l;
                            logDefinition = agLogs[l];
                            break;
                        }
                    }
                    if (!logDefinition) { throw new Error('Agreement is not well defined. It Must has at least a default log.'); }
                }
                //Build logs field on computer request body //
                collectorQuery.logs = {};
                collectorQuery.logs[logId] = new LogField(
                    logDefinition.uri,
                    logDefinition.stateUri,
                    logDefinition.terminator,
                    logDefinition.structure
                );

                // Mapping of columns names in log
                var scope = utils.scopes.registryToComputerParser(metricQuery.scope, logDefinition.scopes);

                // adding computer config
                collectorQuery.config = new Config(
                    "",
                    metricCollectorObject.config.schedules,
                    metricCollectorObject.config.holidays || null,
                    agreement.context.infrastructure.internal.registry + "/states/" + agreement.id + "/guarantees/" + metricId + "/overrides",
                    metricCollectorObject.config.measures,
                );

                if (!collectorQuery.logs) {
                    return reject('Log not found for metric ' + metricId + '. ' +
                        'Please, specify metric log or default log.');
                }
                collectorQuery.scope = Object.keys(scope).length > 0 ? scope : metricQuery.scope;

                // ### PREPARE REQUEST ###
                //Build URL query that will use on computer request
                var urlParams = Query.parseToQueryParams(collectorQuery);
                console.log('URLPARAMS', JSON.stringify(urlParams))
                var compositeResponse = [];
                logger.metrics("Sending request to computer with params: %s", JSON.stringify(collectorQuery, null, 2));
                //Build and send computer request
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
                let requestMetric = await governify.infrastructure.getService(collector.infrastructurePath).request({
                    url: collector.endpoint + '/' + metricCollectorObject.name.replace(/^\//, "") + '?' + encodeURI(urlParams),
                    method: 'GET',
                    responseType: 'stream'
                }).catch(err => {
                    var errorString = "Error in PPINOT Computer response " + err.response.status + ':' + err.response.data;
                    return promiseErrorHandler(reject, "metrics", processMetric.name, err.response.status, errorString);
                })
                let requestStream = requestMetric.data;
                requestStream.pipe(JSONStream.parse()).on('data', monthMetrics => {
                    try {
                        //Check if computer response is correct
                        if (monthMetrics && Array.isArray(monthMetrics)) {
                            //For each state returned by computer map the scope
                            monthMetrics.forEach(function (metricState) {
                                if (metricState.log && metric.scope) {
                                    //Getting the correct log for mapping scope
                                    var logId = Object.keys(metricState.log)[0];
                                    var log = agreement.context.definitions.logs[logId];
                                    //doing scope mapping
                                    metricState.scope = utils.scopes.computerToRegistryParser(metricState.scope, log.scopes);
                                }
                                //aggregate metrics in order to return all
                                compositeResponse.push(metricState);
                            });
                            logger.metrics('Mapping of columns names in log processed.');

                        } else {
                            let errorString = "Error in computer response for metric: " + metricId + ". Response is not an array:  " + JSON.stringify(monthMetrics);
                            return promiseErrorHandler(reject, "metrics", processMetric.name, 500, errorString);
                        }

                    } catch (err) {
                        let errorString = "Error processing computer response for metric: " + metricId;
                        return promiseErrorHandler(reject, "metrics", processMetric.name, 500, errorString, err);
                    }

                }).on('end', function () {
                    return resolve({
                        metricId: metricId,
                        metricValues: compositeResponse
                    });
                });
            } else {
                console.error("This registry does not implement the collector type:", collector.type);
                return resolve({});
            }
        } catch (err) {
            let errorString = 'Error processing metric: ' + metricId + '(' + err + ')';
            return promiseErrorHandler(reject, "metrics", processMetric.name, 500, errorString, err);
        }
    });

}

/**
 * Obtains calculation from v2 API.
 * @param {Object} computationId computation ID
 * @param {Object} timeout Time between retrying requests in milliseconds
 * */
function getComputationV2(infrastructurePath, computationURL, ttl) {
    return new Promise((resolve, reject) => {
        try {
            if (ttl < 0)
                reject('Retries time surpased TTL.');
            let realTimeout = 1000; //Minimum = firstTimeout
            let firstTimeout = 500;
            setTimeout(async () => {
                try {
                    let computationRequest = await governify.infrastructure.getService(infrastructurePath).get(computationURL);
                    let computationResponse = computationRequest.data;
                    if (computationRequest.status === '202') {
                        logger.metrics("Computation " + computationURL.split("/").pop + " not ready jet. Retrying in " + realTimeout + " ms.");
                        setTimeout(() => {
                            resolve(getComputationV2(infrastructurePath, computationURL, ttl - realTimeout))
                        }, realTimeout - firstTimeout);
                    } else if (computationRequest.status === '200') {
                        resolve(computationResponse.computations);
                    } else {
                        throw Error('Invalid response status from collector, ', computationRequest.status)
                    }
                } catch (err) {
                    if (err?.response?.status === '400') {
                        logger.error("Failed obtaining computations from collector: " + body.errorMessage + "\nCollector used: " + infrastructurePath + "\nEndpoint: " + computationURL);
                        resolve([]);
                    } else {
                        logger.error('Error when obtaining computation response from collector: ', infrastructurePath, ' - ComputationURL: ', computationURL, '- ERROR: ', err)
                        throw err;
                    }
                }
            }, firstTimeout);
        } catch (err) {
            reject(err);
        }
    });
}


//### OBJECTS CONSTRUCTORS ###

//constructor of computer request config object
class Config {
    constructor(ptkey, schedules, holidays, overrides, measures) {
        this.measures = measures;
        this.ptkey = ptkey;
        this.schedules = schedules;
        this.holidays = holidays;
        this.overrides = overrides;
    }
}

//constructor of computer request log object
class LogField {
    constructor(uri, stateUri, terminator, structure) {
        if (!!!uri || !!!stateUri || !!!terminator || !!!structure) {
            throw new Error('The log field of metric is not well defined in the agreement, uri, stateUri, terminator and structure are required fields.');
        }
        this.uri = uri;
        this.stateUri = stateUri;
        this.terminator = terminator;
        this.structure = structure;
    }

}
