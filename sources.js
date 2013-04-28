#!/usr/bin/env node

var _ = require('underscore');
var Q = require('q');
var FS = require('q-io/fs');
var path = require('path');
var fs = require('fs');
var parents = require('parents');
var request = require('request');
var unzip = require('unzip');

var deleteArchives = false;

// Underscore mixins for working with promises.
_.mixin({
    // Chains a list of values (optionally promises) to each other
    // resulting in a new promise for a single value.
    // As the promises are reduced, the iterator is called with the
    // resolved value of the previous promise (the memo) and the
    // current promise. The iterator can return a value or a new promise.
    reducePromises: function(list, iterator, memo) {
        return _.reduce(list, function(promise, value) {
            return promise.then(function(memo) {
                return iterator(memo, value);
            });
        }, Q.resolve(memo));
    },

    // Chains a list of values (optionally promises) to each other
    // resulting in a new promise for a list of the resolved values
    // from the original list.
    // If iterator is defined, it can map the value into another
    // value or promise.
    promiseEach: function(list, iterator) {
        return _.reducePromises(list, function(results, value) {
            return Q.when(
                iterator ? iterator(value) : value,
                results.concat.bind(results));
        }, []);
    },

    // Returns a new promise for all the values in list.
    // If iterator is defined, it will be used to map each value
    // into another value or a promise.
    promiseAll: function(list, iterator) {
        return Q.all(iterator ? _.map(list, iterator) : list);
    },

    // Returns a promise for the value (which may already be a
    // promise).
    // Useful for ending an Underscore chain and starting a promise
    // chain without `.value()`.
    then: function(value, fulfilled, rejected, progressed) {
        return Q.when(value, fulfilled, rejected, progressed);
    }
});

function getRegistry(file, start) {
    var extras = _.rest(arguments, 2);
    return _
        .chain(parents(start))
        .concat(extras)
        .unique()
        .map(function(dir) {
            return path.join(dir, file);
        })
        .promiseEach(toObject)
        .then(_.compact)
        .then(function(sources) {
            return _.reduce(sources, _.defaults, {});
        })
    ;

    function toObject(path) {
        return FS
            .exists(path)
            .then(function(exists) {
                if (exists) {
                    console.log('loading: ' + path);
                    return FS
                        .read(path)
                        .then(JSON.parse)
                    ;
                }
            })
        ;
    }
}

function fetchPackages(registry, names) {
    var packages = names.map(makePackage);

    var fetched = {};

    return _.promiseAll(packages, fetch);

    function makePackage(name) {
        var sources = registry[name] || [];
        return {
            name: name,
            sources: Array.isArray(sources) ? sources : [ sources ]
        };
    }

    function fetch(pkg) {
        if (fetched[pkg.name]) { return; }

        fetched[pkg.name] = true;

        if (!pkg.sources.length) {
            console.log('undefined: ' + pkg.name);
            return;
        }

        console.log('fetching: ' + pkg.name);

        return _
            .chain(pkg.sources)
            .promiseAll(down)
        ;

        function down(source) {
            if (registry[source]) {
                return fetch(makePackage(source));
            } else {
                var destination = path.basename(source);

                if (!fs.existsSync(destination)) {
                    var deferred = Q.defer();
                    console.log('copying: ' + source);
                    request(source)
                        .pipe(fs.createWriteStream(destination))
                        .on('close', function() {
                            console.log('copied: ' + destination);
                            Q.when(extract(destination), deferred.resolve);
                        })
                    ;
                    return deferred.promise;
                } else {
                    console.log('exists: ' + destination);
                    return extract(destination);
                }
            }
        }
    }
}

function extract(destination) {
    if (path.extname(destination) === '.zip') {
        var deferred = Q.defer();
        console.log('extracting: ' + destination);
        fs
            .createReadStream(destination)
            .pipe(unzip.Extract({ path: '.' }))
            .on('close', function() {
                if (deleteArchives) {
                    console.log('deleting: ' + destination);
                    fs.unlinkSync(destination);
                }
                deferred.resolve();
            })
        ;
        return deferred.promise;
    }
}

if (require.main === module) {
    var argv = require('optimist')
        .usage('Usage: $0 package...')
        .demand(1)
        .argv
    ;

    Q
        .when(getRegistry('sources.json', process.cwd(), process.env.HOME, __dirname))
        .then(function(registry) {
            return fetchPackages(registry, argv._);
        })
        .done()
    ;
}
