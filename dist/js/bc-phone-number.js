(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.bcPhoneNumber = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
angular.module("bcPhoneNumberTemplates", []).run(["$templateCache", function($templateCache) {$templateCache.put("bc-phone-number/bc-phone-number.html","<section class=\"input-group\">\n  <label for=\"{{name}}\" ng-if=\"label\">{{label}}</label>\n  <div class=\"input-group-btn\" uib-dropdown uib-keyboard-nav>\n    <button type=\"button\" class=\"btn btn-default\" type=\"button\" uib-dropdown-toggle ng-disabled=\"ngDisabled\">\n      <span class=\"glyphicon iti-flag bc-phone-number-flag\" ng-class=\"selectedCountry.iso2Code\"></span><span class=\"caret\"></span>\n      <span class=\"sr-only\">Select country: {{selectedCountry.name}}</span>\n    </button>\n    <ul class=\"uib-dropdown-menu bc-phone-number-dropdown-menu dropdown-menu\" role=\"menu\">\n      <li ng-repeat=\"country in preferredCountries\" ng-click=\"selectCountry(country)\"\n          ng-class=\"{active: country.iso2Code === selectedCountry.iso2Code}\" role=\"menuitem\">\n        <a href=\"#\" ng-click=\"$event.preventDefault()\" class=\"bc-phone-number-country-anchor\">\n          <i class=\"glyphicon iti-flag bc-phone-number-country-icon\" ng-class=\"country.iso2Code\"></i>\n          <span ng-bind=\"country.name\"></span>\n        </a>\n      </li>\n      <li role=\"separator\" class=\"divider\" ng-show=\"preferredCountries && preferredCountries.length\"></li>\n      <li ng-repeat=\"country in allCountries\" ng-click=\"selectCountry(country)\"\n          ng-class=\"{active: country.iso2Code === selectedCountry.iso2Code}\" role=\"menuitem\">\n        <a href=\"#\" ng-click=\"$event.preventDefault()\" class=\"bc-phone-number-country-anchor\">\n          <i class=\"glyphicon iti-flag bc-phone-number-country-icon\" ng-class=\"country.iso2Code\"></i>\n          <span ng-bind=\"country.name\"></span>\n        </a>\n      </li>\n    </ul>\n  </div>\n  <input type=\"tel\" name=\"{{name}}\" id=\"{{name}}\" class=\"form-control\" ng-model=\"number\" ng-disabled=\"ngDisabled\" ng-change=\"changeNumber(number)\"/>\n</section>\n");}]);
},{}],2:[function(require,module,exports){
(function (global){
'use strict';

var bcCountries = (typeof window !== "undefined" ? window['bcCountries'] : typeof global !== "undefined" ? global['bcCountries'] : null);
var angular = (typeof window !== "undefined" ? window['angular'] : typeof global !== "undefined" ? global['angular'] : null);

global.angular = angular;
require('../build/js/templates');

angular.module('bcPhoneNumber', ['bcPhoneNumberTemplates', 'ui.bootstrap'])
.service('bcPhoneNumber', function() {

  this.isValid = bcCountries.isValidNumber;
  this.format = bcCountries.formatNumber;
})
.directive('bcPhoneNumber', function() {

  if (typeof (bcCountries) === 'undefined') {
    throw new Error('bc-countries not found, did you forget to load the Javascript?');
  }

  function getPreferredCountries(preferredCodes) {
    var preferredCountries = [];

    for (var i = 0; i < preferredCodes.length; i++) {
      var country = bcCountries.getCountryByIso2Code(preferredCodes[i]);
      if (country) { preferredCountries.push(country); }
    }

    return preferredCountries;
  }

  return {
    templateUrl: 'bc-phone-number/bc-phone-number.html',
    require: 'ngModel',
    scope: {
      preferredCountriesCodes: '@preferredCountries',
      defaultCountryCode: '@defaultCountry',
      selectedCountry: '=?',
      isValid: '=?',
      ngDisabled: '=',
      name: '@',
      label: '@'
    },
    link: function(scope, element, attrs, ngModelCtrl) {
      scope.selectedCountry = bcCountries.getCountryByIso2Code(scope.defaultCountryCode || 'us');
      scope.allCountries = bcCountries.getAllCountries();

      if (scope.preferredCountriesCodes) {
        var preferredCodes = scope.preferredCountriesCodes.split(' ');
        scope.preferredCountries = getPreferredCountries(preferredCodes);
      }

      scope.selectCountry = function(country, doNotSetView) {
        scope.selectedCountry = country;
        scope.number = bcCountries.changeDialCode(scope.number, country.dialCode);
        if (!doNotSetView) {
          ngModelCtrl.$setViewValue(scope.number);
        }
      };

      var resetCountry = function() {
        if (scope.defaultCountryCode) {
          var defaultCountry = bcCountries.getCountryByIso2Code(scope.defaultCountryCode);
          // Do not set the view value right away, since that might override forthcoming ngModel
          // (wait until the user starts interacting with the input to overwrite)
          scope.selectCountry(defaultCountry, true);
        }
      };
      resetCountry();

      var isValidNumber = function(number) {
        if (!number) { // Blank numbers are valid! (unless required directive present)
          return true;
        }
        return bcCountries.isValidNumber(number);
      };

      var formatNumber = function(value) {
        return value && bcCountries.formatNumber(value);
      };

      scope.changeNumber = function(newNumber) {
        scope.number = formatNumber(newNumber);
        ngModelCtrl.$setViewValue(scope.number);
        checkForCountryUpdate();
      };

      // Translate any external ngModel changes to internal scope.number
      ngModelCtrl.$render = function updateView() {
        scope.number = formatNumber(ngModelCtrl.$viewValue || '');
        checkForCountryUpdate();
      };

      ngModelCtrl.$validators.validPhoneNumber = function(modelValue, viewValue) {
        scope.isValid = isValidNumber(modelValue || viewValue);
        return scope.isValid;
      };

      /* Any time the number changes country code, update the selector */
      var checkForCountryUpdate = function() {
        var digits = bcCountries.getDigits(scope.number);
        var countryCode = bcCountries.getIso2CodeByDigits(digits);
        if (!countryCode) {
          return;
        }

        var dialCode = bcCountries.getDialCodeByDigits(digits);
        if (dialCode !== scope.selectedCountry.dialCode) {
          scope.selectedCountry = bcCountries.getCountryByIso2Code(countryCode);
        }
      };
    }
  };
});

module.exports = 'bcPhoneNumber';

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../build/js/templates":1}]},{},[2])(2)
});