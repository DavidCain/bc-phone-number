(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
angular.module("bcPhoneNumberTemplates", []).run(["$templateCache", function($templateCache) {$templateCache.put("bc-phone-number/bc-phone-number.html","<section class=\"input-group\">\n  <div class=\"input-group-btn\">\n    <button type=\"button\" class=\"btn btn-default\" type=\"button\" ng-click=\"resetCountry()\">\n      <span class=\"glyphicon iti-flag\" ng-class=\"selectedCountry.iso2Code\"></span>\n    </button>\n    <button type=\"button\" class=\"btn btn-default dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\"\n            aria-expanded=\"false\">\n      <span class=\"caret\"></span>\n      <span class=\"sr-only\">Toggle Dropdown</span>\n    </button>\n    <ul class=\"dropdown-menu bc-phone-number-dropdown-menu\">\n      <li ng-repeat=\"country in preferredCountries\" ng-click=\"selectCountry(country)\"\n          ng-class=\"{active: isCountrySelected(country)}\">\n        <a href=\"#\" target=\"_self\" class=\"bc-phone-number-country-anchor\">\n          <i class=\"glyphicon iti-flag bc-phone-number-country-icon\" ng-class=\"country.iso2Code\"></i>\n          <span ng-bind=\"country.name\"></span>\n        </a>\n      </li>\n      <li role=\"separator\" class=\"divider\" ng-show=\"preferredCountries && preferredCountries.length\"></li>\n      <li ng-repeat=\"country in allCountries\" ng-click=\"selectCountry(country)\"\n          ng-class=\"{active: isCountrySelected(country)}\">\n        <a href=\"#\" target=\"_self\" class=\"bc-phone-number-country-anchor\">\n          <i class=\"glyphicon iti-flag bc-phone-number-country-icon\" ng-class=\"country.iso2Code\"></i>\n          <span ng-bind=\"country.name\"></span>\n        </a>\n      </li>\n    </ul>\n  </div>\n  <input type=\"tel\" class=\"form-control\" ng-model=\"number\"/>\n</section>\n");}]);
},{}],2:[function(require,module,exports){
(function (global){
'use strict';

global.jQuery = (typeof window !== "undefined" ? window['jQuery'] : typeof global !== "undefined" ? global['jQuery'] : null);
(typeof window !== "undefined" ? window['bootstrap'] : typeof global !== "undefined" ? global['bootstrap'] : null);

var bcCountries = (typeof window !== "undefined" ? window['bcCountries'] : typeof global !== "undefined" ? global['bcCountries'] : null);
var angular = (typeof window !== "undefined" ? window['angular'] : typeof global !== "undefined" ? global['angular'] : null);

global.angular = angular;
require('../build/js/templates');

angular.module('bcPhoneNumber', ['bcPhoneNumberTemplates']).directive('bcPhoneNumber', function() {

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
      isValid: '=',
      ngModel: '='
    },
    link: function(scope, element, attrs, ctrl) {
      scope.selectedCountry = bcCountries.getCountryByIso2Code(scope.defaultCountryCode || 'us');
      scope.allCountries = bcCountries.getAllCountries();
      scope.number = scope.ngModel;

      if (scope.preferredCountriesCodes) {
        var preferredCodes = scope.preferredCountriesCodes.split(' ');
        scope.preferredCountries = getPreferredCountries(preferredCodes);
      }

      scope.selectCountry = function(country) {
        scope.selectedCountry = country;
        scope.number = scope.ngModel = bcCountries.changeDialCode(scope.number, country.dialCode);
      };

      scope.isCountrySelected = function(country) {
        return country.iso2Code == scope.selectedCountry.iso2Code;
      };

      scope.resetCountry = function() {
        var defaultCountryCode = scope.defaultCountryCode;

        if (defaultCountryCode) {
          scope.selectedCountry = bcCountries.getCountryByIso2Code(defaultCountryCode);
          scope.ngModel = '';
          scope.number = '';
        }
      };

      scope.$watch('number', function(newValue) {
        ctrl.$setValidity('phoneNumber', bcCountries.isValidNumber(newValue));
        scope.isValid = bcCountries.isValidNumber(newValue);
      });

      scope.$watch('number', function(newValue) {
        if (newValue === '') { scope.ngModel = ''; }
        else if (newValue) {
          var digits = bcCountries.getDigits(newValue);
          var countryCode = bcCountries.getIso2CodeByDigits(digits);

          if (countryCode) {
            var dialCode = bcCountries.getDialCodeByDigits(digits);
            var number = bcCountries.formatNumber(newValue);

            if (dialCode !== scope.selectedCountry.dialCode) {
              scope.selectedCountry = bcCountries.getCountryByIso2Code(countryCode);
            }

            scope.ngModel = number;
            scope.number = number;
          }
          else { scope.ngModel = newValue; }
        }
      });
    }
  };
});

module.exports = 'bcPhoneNumber';

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../build/js/templates":1}]},{},[2]);