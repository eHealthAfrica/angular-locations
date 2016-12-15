'use strict';

angular.module('eHealth.locations.services')
  .factory('locationsFactory', function($log, ml, gn, lr, lr_clans, sl, mg) {
    var map = {
      ml: ml,
      gn: gn,
      gin: gn,
      lr: lr,
      lr_clans: lr_clans,
      sl: sl,
      mg: mg
    };
    return function(countryCode) {
      if (countryCode in map) {
        var locations = map[countryCode];
        var indexes = locations.map(function(level) {
          var index = {
            id: {},
            name: {}
          };
          level.items.forEach(function(item) {
            index.id[item.id] = item;
            index.name[item.name.toLowerCase()] = item;
          });
          return index;
        });
        var withErrorHandling = function (fun) {
          return function (key, level) {
            if (typeof key === 'undefined') {
              return;
            } else {
              var index = indexes[level];
              if (index) {
                var maybeResult = fun(index, key);
                if (maybeResult) {
                  return maybeResult;
                } else {
                  var message = 'we cannot find `'+ key+ '` in locations level '+ locations[level].name;
                  $log.debug(message);
                }
              } else {
                $log.error(countryCode+' locations have only '+indexes.length+ ' levels');
              }
            }
          };
        };
        locations.decode = withErrorHandling(function(index, id) {
          var item = index.id[id];
          return item && item.name;
        });
        locations.encode = withErrorHandling(function(index, name) {
          var item = index.name[name.toLowerCase()];
          return item && item.id;
        });
        return locations;
      } else {
        var e = 'we have no location data for the country code `' +
              countryCode+'`';
        throw new Error(e);
      }
    };
  });
