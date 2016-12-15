[![Build Status](https://travis-ci.org/eHealthAfrica/angular-locations.svg?branch=master)](https://travis-ci.org/eHealthAfrica/angular-locations)

# eHealth.locations

To run the tests and build, run:

    $ grunt

Make sure to have updated versions of your Bower dependencies,
otherwise your older versions will get into the built files. You can
update running `bower update`.

To add a new country:

* update `bower.json` to the new version of eHealthAfrica/locations containing the country.
* add the country to the `ngconstant` task of the `Gruntfile`.
* add the country to `src/services/locationsFactory.js`.
* build
* release the new version.

On new releases, update the version in [the
changelog](/blob/master/CHANGELOG.md) and in `bower.json` and and add
a new tag.
