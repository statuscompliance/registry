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
const moment = require('moment-timezone');
const RRule = require('rrule').RRule
const RRuleSet = require('rrule').RRuleSet
const rrulestr = require('rrule').rrulestr

/**
 * Utils module.
 * @module utils.promises
 * @requires config
 * */

module.exports = {
  getPeriods: _getPeriods,
  periods: periods,
  convertPeriod: _convertPeriod
};

function getFreq (Wperiod) {
  switch(Wperiod){
      case "yearly" : return RRule.YEARLY
      case "monthly" : return RRule.MONTHLY
      case "weekly" : return RRule.WEEKLY
      case "daily" : return RRule.DAILY
      case "hourly" : return RRule.HOURLY
  }
}

/** Get the difference of an UTC date and the same date in a time zone
*  @param date, a date in UTC
*  @param timeZone, a timeZone supported by Intl
*  @return an integer that represents the difference in hours of a date in UTC and
*  the same date in a time zone
* */
function getTimeZoneOffset(date, timeZone) {

  // Abuse the Intl API to get a local ISO 8601 string for a given time zone.
  const options = {timeZone, calendar: 'iso8601', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false};
  const dateTimeFormat = new Intl.DateTimeFormat(undefined, options);
  const parts = dateTimeFormat.formatToParts(date);
  const map = new Map(parts.map(x => [x.type, x.value]));
  const year = map.get('year');
  const month = map.get('month');
  const day = map.get('day');
  const hour = map.get('hour');
  const minute = map.get('minute');
  const second = map.get('second');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}.${ms}`;

  // Lie to the Date object constructor that it's a UTC time.
  const lie = new Date(iso + 'Z');

  // Return the difference in timestamps, as hours
  // Positive values are West of GMT, opposite of ISO 8601
  // this matches the output of `Date.getTimeZoneOffset`
  return -(lie - date) / 60 / 1000 / 60;
}

/**
 * Check if an array contains a given object
 * @param {AgreementModel} agreement object to search for
 * @param {WindowModel} window array to search into
 * @alias module:utils.getPeriodsFrom
 * */
function _getPeriods (agreement, window) {
  var dates;
  var periods = [];
  const periodTypes = ['yearly','monthly','weekly','daily','hourly']

  var from = new Date(window.initial);
  var to = new Date();

  var Wfrom = new Date(window.from);
  var Wto = window.end ? new Date(window.end) : new Date();

  

  if(periodTypes.indexOf(window.period) >= 0){
      var rruleInit = new RRule({
          freq: getFreq(window.period),
          dtstart: from,
          until: to
      })
      var rruleFin = new RRule({
          freq: getFreq(window.period),
          dtstart: from,
          until: to,
          bysecond: -1
      })

      var rruleSet = new RRuleSet();
      rruleSet.rrule(rruleInit);
      rruleSet.rrule(rruleFin);
      dates = rruleSet.all();
  }else{
      rule = rrulestr(window.period)
      dates = rule.between(new Date(from), new Date(to));
  }

  //Sorting dates
  dates.sort(function(a,b){
      return a - b;
  });

  for (var i = 0 ; i<dates.length-1;i+=2){
      dates[i+1].setMilliseconds(999)
      dates[i].setUTCHours(dates[i].getUTCHours()+getTimeZoneOffset(dates[i], agreement.context.validity.timeZone))
      dates[i+1].setUTCHours(dates[i+1].getUTCHours()+getTimeZoneOffset(dates[i+1], agreement.context.validity.timeZone))
 
      if(dates[i+1]> Wfrom && dates[i+1]<= Wto){
        periods.push({
            from: moment.utc(dates[i]),
            to: moment.utc(dates[i+1])
        });
      }
  }

  return periods;
}

var slots = {
  quarterly: {
    count: 3,
    unit: 'months'
  },
  monthly: {
    count: 1,
    unit: 'months'
  },
  daily: {
    count: 1,
    unit: 'day'
  },
  hourly: {
    count: 1,
    unit: 'hour'
  },
  minutely: {
    count: 1,
    unit: 'minute'
  },
  secondly: {
    count: 1,
    unit: 'second'
  },
  weekly: {
    count: 1,
    unit: 'week'
  },
  biweekly: {
    count: 2,
    unit: 'week'
  },
  yearly: {
    count: 1,
    unit: 'years'
  }
};

/**
 * Periods in milliseconds
 * @alias module:utils.periods
 * */
var periods = {
  secondly: 1000,
  minutely: 60000,
  hourly: 3600000,
  daily: 86400000,
  weekly: 604800000,
  monthly: 2628000000,
  quarterly: 7884000000,
  yearly: 31540000000
};

/**
 * Convert a given billing cycle into a period string
 * @param {Object} billingCycle object billing cycle to convert
 * @alias module:utils.convertPeriod
 * */
function _convertPeriod (billingCycle) {
  switch (billingCycle) {
    case 'yearly':
      return 'years';
    case 'monthly':
      return 'months';
    case 'daily':
      return 'days';
  }
}
