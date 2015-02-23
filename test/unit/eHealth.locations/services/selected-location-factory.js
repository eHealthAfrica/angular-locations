'use strict';

// a selected location is a stateful object created from a country
// locations. for every level in the country location, the selected
// location remembers what we selected, and it automatically updates
// locations in the contained levels

var testLocationData = [{
  depth: 0,
  name: 'Zero',
  items: [{
    name: 'zero one',
    id: 1
  }, {
    name: 'zero two',
    id: 2
  }]
}, {
  depth: 1,
  name: 'One',
  items: [{
    name: 'one one',
    id: 1,
    parentId: 1
  }, {
    name: 'one two',
    id: 2,
    parentId: 2
  }]
}, {
  depth: 2,
  items: [{
    name: 'two one',
    id: 1,
    parentId: 1
  }, {
    name: 'two two',
    id: 2,
    parentId: 2
  }]
}];

var mockCurrentUser = {
  "name": "matt-test-gin",
  "roles": ["dispatcher", "gin_call_user_role"],
  "details": {
    "fullName": "Matt Test (Guinea)",
    "role": "Suivi",
    "app": "Guinea Call Centre"
  },
  "locations": [
    {
      "name": "two one",
      "id": 1,
      "level": 2
    },
    {
      "name": "zero one",
      "id": 1,
      "level": 0,
      "default": true
    }
  ]
};

describe('Service: SelectedLocationFactory', function () {
  describe('with locations for Liberia', function() {
    // load the service's module
    beforeEach(module('eHealth.locations.services'));

    // instantiate service
    var selectedLocationFactory,
        location;
    beforeEach(module(function(locationsProvider) {
      locationsProvider.setCountryCode('lr');
    }));
    beforeEach(inject(function (_selectedLocationFactory_) {
      selectedLocationFactory = _selectedLocationFactory_;
    }));

    // i tried to test performances here. actually before this test
    // could even fail, demanding computation caused the Karma runner
    // to lose connection with PhantomJS, either ways the test failed
    it('creates a new object in less than half a second', function() {
      runs(function() {
        setTimeout(function() {
          location = selectedLocationFactory();
        });
      });
      waitsFor(function() {
      return location;
      }, 'the selected location should be created', 500);
    });
  });
  describe('with locations for Mali', function(){

    // load the service's module
    beforeEach(module('eHealth.locations.services'));

    // instantiate service
    var selectedLocationFactory;
    beforeEach(module(function(locationsProvider) {
      locationsProvider.setCountryCode('ml');
    }));
    beforeEach(inject(function (_selectedLocationFactory_) {
      selectedLocationFactory = _selectedLocationFactory_;
    }));

    describe('a location', function() {
      var location;
      beforeEach(function() {
        location = selectedLocationFactory({
          locationsData: testLocationData
        });
      });
      it('provides iterable levels', function() {
        expect(location.levels.forEach).toBeDefined();
        expect(location.levels.length).toBe(3);
      });
      it('selects levels above when the deeper one is selected', function () {
        // this funny interface in actually convenient in the templates,
        // in order to bind `selected` with a model and `update` with an
        // `ngChange` directive
        var level = location.levels[2];
        level.selected = level.items[0];
        level.update();
        expect(location.levels[0].selected.id).toBe(1);
        expect(location.levels[1].selected.id).toBe(1);
        expect(location.levels[2].selected.id).toBe(1);
      });
      it('supports a simpler interface', function () {
        location.select(2, 1);
        expect(location.levels[0].selected.id).toBe(1);
        expect(location.levels[1].selected.id).toBe(1);
        expect(location.levels[2].selected.id).toBe(1);
      });
      it('restricts levels below when the topmost is selected', function() {
        var level = location.levels[0];
        level.selected = level.items[0];
        level.update();
        expect(location.levels[0].items.length).toBe(2);
        expect(location.levels[1].items.length).toBe(1);
        expect(location.levels[1].selected).toBeUndefined()
        expect(location.levels[2].items.length).toBe(1);
        expect(location.levels[1].selected).toBeUndefined()
      });
      it('unselects levels below if conflicting with the parent', function() {
        location.levels[1].selected = { id: 2};
        location.levels[0].selected = { id: 1};
        location.levels[0].update();
        expect(location.levels[1].selected).toBeUndefined();
      });
      it('keeps levels below if compatible with the parent', function() {
        location.levels[1].selected = {id: 1};
        location.levels[0].selected = {id: 1};
        location.levels[0].update();
        expect(location.levels[1].selected.id).toBe(1);
      });
      it('throws an error when selecting not existing ids', function() {
        expect(function() {
          location.level[1].selectBy('bullshit');
        }).toThrow();
      });
      it('can clone itself and compare', function() {
        var cloned = location.clone();
        expect(cloned.compare(location)).toBe(true);
      });
      it('can clone itself and compare also selected items', function() {
        location.levels[0].selected = location.levels[0].items[0];
        var cloned = location.clone();
        expect(cloned.compare(location)).toBe(true);
        expect(location.levels[0].selected).toEqual(cloned.levels[0].selected);
      });
      it('reads admin divisions', function() {
        location.setAdminDivisions({
          adminDivision1: 1,
          adminDivision2: 1
        });
        expect(location.levels[0].selected.name).toBe('zero one');
        expect(location.levels[1].selected.name).toBe('one one');
        expect(location.levels[2].selected).toBeUndefined();
      });
      it('ignores inconsistent parents', function() {
        location.setAdminDivisions({
          adminDivision1: 1,
          adminDivision2: 2
        });
        expect(location.levels[0].selected.name).toBe('zero two');
        expect(location.levels[1].selected.name).toBe('one two');
        expect(location.levels[2].selected).toBeUndefined();
      });
      it('ignores undefined parents', function() {
        location.setAdminDivisions({
          adminDivision2: 2
        });
        expect(location.levels[0].selected.name).toBe('zero two');
        expect(location.levels[1].selected.name).toBe('one two');
        expect(location.levels[2].selected).toBeUndefined();
      });
      it('ignores missing codes, check issue #2', function() {
        expect(function() {
          location.setAdminDivisions({
            adminDivision2: 'jumping troll'
          });
        }).not.toThrow();
      });
      it('ignores missing objects as well!', function() {
        expect(function() {
          location.setAdminDivisions();
        }).not.toThrow();
      });
      it('gives admin divisions', function() {
        location.select(1, 2);
        expect(location.getAdminDivisions()).toEqual({
          adminDivision1: 2,
          adminDivision2: 2
        });
      });
      it('adds admin divisions to existing objects', function() {
        var person = {
          name: 'Francesco'
        };
        location.select(1, 1);
        expect(location.getAdminDivisions(person)).toEqual({
          name: 'Francesco',
          adminDivision1: 1,
          adminDivision2: 1
        });
        expect(person.adminDivision1).toBe(1);
      });

      describe('with all-items', function() {
        var locsWithAll;

        beforeEach(function() {
          locsWithAll = selectedLocationFactory({
            locationsData: testLocationData,
            hasAllItem: true
          });
        });
        it('has all-items on each level as first element', function() {
          expect(locsWithAll.levels[0].items[0].isAll);
          expect(locsWithAll.levels[1].items[0].isAll);
          expect(locsWithAll.levels[2].items[0].isAll);
        });
        it('should select child-level all-items on parent change', function() {
          locsWithAll.levels[1].selected = locsWithAll.levels[1].items[1];
          locsWithAll.levels[0].selected = locsWithAll.levels[0].items[1];
          locsWithAll.levels[0].update();
          expect(locsWithAll.levels[1].selected.isAll);
        });
      });
    });

    describe('Filtering / Restrictions', function () {
      var location;

      describe('Restricted', function () {

        beforeEach(function() {
          location = selectedLocationFactory({
            locationsData: testLocationData,
            restrictByLocations: mockCurrentUser.locations
          });
        });

        it('should filter locations by user restriction when passed with restrict flag', function () {
          expect(location.levels[0].items.length).toBe(1);
          expect(location.levels[1].items.length).toBe(0);
          expect(location.levels[2].items.length).toBe(1);
          expect(location.levels[0].items[0].name).toEqual(mockCurrentUser.locations[1].name);
          expect(location.levels[2].items[0].name).toEqual(mockCurrentUser.locations[0].name);
        });
      });

      describe('Unrestricted', function() {
        beforeEach(function() {
          location = selectedLocationFactory({
            locationsData: testLocationData,
          });
        });

        it('should not filter locations by user restriction when not passed with restrict flag', function() {
          expect(location.levels[0].items.length).toBe(2);
          expect(location.levels[1].items.length).toBe(2);
          expect(location.levels[2].items.length).toBe(2);
        });
      });
    });
    describe('a location without options', function(){
      var location;
      beforeEach(function(){
        location = selectedLocationFactory();
      });
      it('runs without errors', function(){
        expect(function(){
          location = selectedLocationFactory();
        }).not.toThrow();
      });
      it('has the expected properties', function(){
        expect(location.levels).toBeDefined();
        expect(location.select).toBeDefined();
      });
      it('gets country location data from the `locations` service', function(){
        expect(location.levels.length).toBe(3);
      });
      describe('with levels selected', function() {
        beforeEach(function() {
          location.select(2, 1);
        });
        it('has levels selected', function() {
          expect(location.getAdminDivisions()).toEqual({
            adminDivision1 : 'B',
            adminDivision2 : 'BB',
            adminDivision3 : 1
          });
        });
        it('allows to deselect a level and all the levels below', function() {
          location.levels[1].deselect();
          expect(location.getAdminDivisions()).toEqual({
            adminDivision1 : 'B'
          });
        });
        it('can update after deselect', function() {
          location.levels[1].deselect();
          location.levels[1].update();
          expect(location.getAdminDivisions()).toEqual({
            adminDivision1 : 'B'
          });
        });
      });
    });
  });
});
