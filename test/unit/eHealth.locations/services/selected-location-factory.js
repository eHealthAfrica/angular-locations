'use strict';

// a selected location is a stateful object created from a country
// locations. for every level in the country location, the selected
// location remembers what we selected, and it automatically updates
// locations in the contained levels

var FIRST = 0,
    SECOND = 1,
    THIRD = 2,
    FOURTH = 3;

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

  beforeEach(module('eHealth.locations.services'));

  describe('with locations for Liberia', function() {
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
    it('creates a new object in less than ten milliseconds', function() {
      runs(function() {
        setTimeout(function() {
          location = selectedLocationFactory();
        });
      });
      waitsFor(function() {
        return location;
      }, 'the selected location should be created', 10);
      runs(function() {
        expect(location).toBeDefined();
      });
    });

    var count = 0
    describe('producing a selected location with default options', function() {
      function selectFirst(depth) {
        var level = location.levels[depth];
        // here i am emulating user actions bound to Javascript
        // objects via Angular, so i use this interface even if it
        // is less convenient
        level.selected = level.items[0];
        level.update();
      }
      beforeEach(function() {
        location = selectedLocationFactory();
      });

      it('shows unfiltered options initially', function() {
        expect(location.levels[FIRST].items.length).toBe(16)
        expect(location.levels[SECOND].items.length).toBe(180)
        expect(location.levels[THIRD].items.length).toBe(850);
        expect(location.levels[FOURTH].items.length).toBe(13361);
      });
      describe('when first and second level get selected', function() {
        beforeEach(function() {
          selectFirst(FIRST);
          selectFirst(SECOND);
        });
        it('limits the number of options for the third level', function() {
          expect(location.levels[THIRD].items.length).toBe(14);
        });
        // skip test: fix not yet implemented
        xit('does limits the number for the fourth level', function () {
          expect(location.levels[FOURTH].items.length).toBe(13361);
        });
        describe('when third and fourth level get selected', function() {
          beforeEach(function() {
            selectFirst(THIRD);
            selectFirst(FOURTH);
          });
          it('still show limited options for the preceding levels', function() {
            expect(location.levels[FIRST].items.length).toBe(16);
            expect(location.levels[SECOND].items.length).toBe(8);
            expect(location.levels[THIRD].items.length).toBe(14);
          });
        });
      });
      describe('when a lower level without selecting the parent levels first', function () {
        beforeEach(function () {
          selectFirst(THIRD)
        });
        it('filters the higher level', function () {
          expect(location.levels[SECOND].items.length).toBe(8);
        });
        // skip test: fix not yet implemented
        xit('filters the current level', function () {
          expect(location.levels[THIRD].items.length).toBe(16);
        });
      })
    });
  });

  describe('with locations for Mali', function(){
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
        var level = location.levels[THIRD];
        level.selected = level.items[0];
        level.update();
        expect(location.levels[FIRST].selected.id).toBe(1);
        expect(location.levels[SECOND].selected.id).toBe(1);
        expect(location.levels[THIRD].selected.id).toBe(1);
      });
      it('supports a simpler interface', function () {
        location.select(2, 1);
        expect(location.levels[FIRST].selected.id).toBe(1);
        expect(location.levels[SECOND].selected.id).toBe(1);
        expect(location.levels[THIRD].selected.id).toBe(1);
      });
      it('restricts levels below when the topmost is selected', function() {
        var level = location.levels[FIRST];
        level.selected = level.items[0];
        level.update();
        expect(location.levels[FIRST].items.length).toBe(2);
        expect(location.levels[SECOND].items.length).toBe(1);
        expect(location.levels[SECOND].selected).toBeUndefined()
        expect(location.levels[THIRD].items.length).toBe(2);
        expect(location.levels[SECOND].selected).toBeUndefined()
      });
      it('unselects levels below if conflicting with the parent', function() {
        location.levels[SECOND].selected = { id: 2};
        location.levels[FIRST].selected = { id: 1};
        location.levels[FIRST].update();
        expect(location.levels[SECOND].selected).toBeUndefined();
      });
      it('keeps levels below if compatible with the parent', function() {
        location.levels[SECOND].selected = {id: 1};
        location.levels[FIRST].selected = {id: 1};
        location.levels[FIRST].update();
        expect(location.levels[SECOND].selected.id).toBe(1);
      });
      it('throws an error when selecting not existing ids', function() {
        expect(function() {
          location.level[SECOND].selectBy('bullshit');
        }).toThrow();
      });
      it('can clone itself and compare', function() {
        var cloned = location.clone();
        expect(cloned.compare(location)).toBe(true);
      });
      it('can clone itself and compare also selected items', function() {
        location.levels[FIRST].selected = location.levels[FIRST].items[0];
        var cloned = location.clone();
        expect(cloned.compare(location)).toBe(true);
        expect(location.levels[FIRST].selected).toEqual(cloned.levels[FIRST].selected);
      });
      it('reads admin divisions', function() {
        location.setAdminDivisions({
          adminDivision1: 1,
          adminDivision2: 1
        });
        expect(location.levels[FIRST].selected.name).toBe('zero one');
        expect(location.levels[SECOND].selected.name).toBe('one one');
        expect(location.levels[THIRD].selected).toBeUndefined();
      });
      it('ignores inconsistent parents', function() {
        location.setAdminDivisions({
          adminDivision1: 1,
          adminDivision2: 2
        });
        expect(location.levels[FIRST].selected.name).toBe('zero two');
        expect(location.levels[SECOND].selected.name).toBe('one two');
        expect(location.levels[THIRD].selected).toBeUndefined();
      });
      it('ignores undefined parents', function() {
        location.setAdminDivisions({
          adminDivision2: 2
        });
        expect(location.levels[FIRST].selected.name).toBe('zero two');
        expect(location.levels[SECOND].selected.name).toBe('one two');
        expect(location.levels[THIRD].selected).toBeUndefined();
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
            hasAllItem: true,
            allItemName: 'foo'
          });
        });
        it('has all-items on each level as first element', function() {
          expect(locsWithAll.levels[FIRST].items[0].isAll);
          expect(locsWithAll.levels[SECOND].items[0].isAll);
          expect(locsWithAll.levels[THIRD].items[0].isAll);
        });
        it('should select child-level all-items on parent change', function() {
          locsWithAll.levels[SECOND].selected = locsWithAll.levels[SECOND].items[1];
          locsWithAll.levels[FIRST].selected = locsWithAll.levels[FIRST].items[1];
          locsWithAll.levels[FIRST].update();
          expect(locsWithAll.levels[SECOND].selected.isAll);
        });
        it('should have custom text all-item name', function() {
          expect(locsWithAll.levels[FIRST].items[0].name).toBe('foo');
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
          expect(location.levels[FIRST].items.length).toBe(1);
          expect(location.levels[SECOND].items.length).toBe(0);
          expect(location.levels[THIRD].items.length).toBe(1);
          expect(location.levels[FIRST].items[0].name).toEqual(mockCurrentUser.locations[1].name);
          expect(location.levels[THIRD].items[0].name).toEqual(mockCurrentUser.locations[0].name);
        });
      });

      describe('Unrestricted', function() {
        beforeEach(function() {
          location = selectedLocationFactory({
            locationsData: testLocationData,
          });
        });

        it('should not filter locations by user restriction when not passed with restrict flag', function() {
          expect(location.levels[FIRST].items.length).toBe(2);
          expect(location.levels[SECOND].items.length).toBe(2);
          expect(location.levels[THIRD].items.length).toBe(2);
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
          location.levels[SECOND].deselect();
          expect(location.getAdminDivisions()).toEqual({
            adminDivision1 : 'B'
          });
        });
        it('can update after deselect', function() {
          location.levels[SECOND].deselect();
          location.levels[SECOND].update();
          expect(location.getAdminDivisions()).toEqual({
            adminDivision1 : 'B'
          });
        });
      });
    });
  });

  describe('in incremental mode', function(){
    /*
     * incrementally showing levels was initially used in contact
     * tracing in Liberia, in order to cope with the high number of
     * locations in the levels with more specificity, which was
     * freezing the app
     */

    // instantiate service
    var selectedLocationFactory,
        location;

    beforeEach(module(function(locationsProvider) {
      locationsProvider.setCountryCode('lr');
    }));
    beforeEach(inject(function (_selectedLocationFactory_) {
      selectedLocationFactory = _selectedLocationFactory_;
      location = selectedLocationFactory({
        incremental: true
      });
    }));
    it('initially shows just the first level', function() {
      expect(location.levels.length).toBe(1);
    });
    describe('after the first level is selected', function() {
      beforeEach(function() {
        var level = location.levels[FIRST];
        level.selected = level.items[0];
        level.update();
      });
      it('shows the second level', function() {
        expect(location.levels.length).toBe(2);
      });
      describe('the second level is selected', function(){
        beforeEach(function(){
          var level = location.levels[SECOND];
          level.selected = level.items[0];
          level.update();
        });
        it('shows the third level', function(){
          expect(location.levels.length).toBe(3);
        });
        describe('the third level is selected', function() {
          beforeEach(function(){
            var level = location.levels[THIRD];
            level.selected = level.items[0];
            level.update();
          });
          it('shows the fourth level', function() {
            expect(location.levels.length).toBe(4);
          });
          it('shows the right items in the fourth level', function() {
            expect(location.levels[FOURTH].items[0].parentId)
              .toBe('BASS : Commonwealth : Buchanan Port');
            expect(location.levels[FOURTH].items.length).toBe(1);
          });
        });
        describe('the first level is changed', function() {
          beforeEach(function(){
            var level = location.levels[FIRST];
            level.selected = level.items[2];
            level.update();
          });
          it('unselects the second level', function(){
            expect(location.levels[SECOND].selected).toBeFalsy();
          });
          it('shows the second level, not the third', function(){
            expect(location.levels.length).toBe(2);
          });
        });
      });
    });
    it('correctly filters also using the `selectBy` interface', function() {
      location.select(0, 'BASS');
      location.select(1, 'BASS : Commonwealth');
      location.select(2, 'BASS : Commonwealth : Buchanan Port');
      expect(location.levels.length).toBe(4);
      expect(location.levels[FOURTH].items.length).toBe(1);
    });
    it('does not show levels when all their items are filtered', function() {
      location.select(0, 'MONT');
      location.select(1, 'MONT : 100');
      location.select(2, 'MONT : 100 : Bong Mines Bridge');
      expect(location.levels.length).toBe(3);
    });
  });

  describe('common behaviour', function () {

    var location;

    beforeEach(module(function(locationsProvider) {
      locationsProvider.setCountryCode('lr');
    }));

    beforeEach(inject(function (selectedLocationFactory) {
      location = selectedLocationFactory();
    }));

    describe('clear()', function () {
      it('clears out all current selections', function () {
        location.select(0, 'BASS');
        location.select(1, 'BASS : Commonwealth');
        location.clear();
        expect(location.getAdminDivisions()).toEqual({});
      });
    });

    describe('getInnermost()', function () {
      it('returns null if there is no selection', function () {
        location.clear();
        expect(location.getInnermost()).toBe(null);
      });

      it('returns innermost division for multi-level selection', function () {
        location.select(0, 'BASS');
        location.select(1, 'BASS : Commonwealth');
        expect(location.getInnermost().id).toBe('BASS : Commonwealth');
      });
    });

    describe('when there is a deep selection', function () {
      var parent, level2, level3;

      beforeEach(function () {
        parent = location.levels[FIRST];
        level2 = location.levels[SECOND];
        level3 = location.levels[THIRD];
        level3.selected = level3.items[0]; // selects third level
        level3.update();
      });

      it('change parent deselects second', function () {
        parent.selected = parent.items[1];
        parent.update();

        expect(level2.selected).toBeFalsy();
      });

      it('change parent unselects the third level', function() {
        parent.selected = parent.items[1];
        parent.update();

        expect(level3.selected).toBeFalsy();
      });
    })

  });
});
