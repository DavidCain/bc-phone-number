'use strict';

var bcCountries = require('bc-countries');
var angular = require('angular');

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
