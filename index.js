/*!
governify-registry 3.0.1, built on: 2018-04-18
Copyright (C) 2017 ISA Group
http://www.isa.us.es/
http://registry.governify.io/

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';
const oasTelemetry = require('@oas-tools/oas-telemetry');
const fs = require('fs');
// Telemetry middleware ===================================
const oasDoc = fs.readFileSync('./src/api/swaggerV6.yaml', 'utf8');
const oasTelemetryMiddleware = oasTelemetry({ spec: oasDoc });
//= ======================================================

const governify = require('governify-commons');
const logger = governify.getLogger().tag('initialization');

logger.info('Deploy request received');

governify.init({
  configurations: [{
    name: 'main',
    location: './configurations/config.' + (process.env.NODE_ENV || 'development') + '.yaml',
    default: true
  }
  ]
}).then(commonsMiddleware => {
  const registry = require('./server.js');
  registry.deploy(null, [commonsMiddleware, oasTelemetryMiddleware], function () {
    logger.info('Deploy successfully done');
  });
});
