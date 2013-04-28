sources
=======

sources is a simple command-line tool that can fetch resources from the web and
save them to your local file system.

It's a poor man's package manager in that it can download and extract packages
for me when creating a new project.

If you prefer a real package manager, please see any of the following:

- [Bower](http://twitter.github.com/bower/)
- [Component](https://github.com/component/component)
- [Jam](http://jamjs.org/)
- [Volo](http://volojs.org/)

Those all seem very useful, but I like being in control of exactly what files I
add to my projects and I don't like not being able to use a package manager
because the project I need doesn't have the magic JSON file in its repository.

With sources, I can define the sources for packages on my machine. I don't have
to wait for a project to adopt any conventions and I can select the exact files
I need.

Sources are defined in a file called sources.json:

    {
        "jquery": "http://code.jquery.com/jquery.js",
        "bootstrap": [
            "jquery",
            "http://twitter.github.com/bootstrap/assets/bootstrap.zip"
        ],
        "qunit": [
            "http://code.jquery.com/qunit/qunit-1.11.0.js",
            "http://code.jquery.com/qunit/qunit-1.11.0.css"
        ]
    }

With something like that in my current or home directory I can type:

    sources bootstrap

and the latest jQuery and Bootstrap files will be fetched and extracted into
the current directory.

Later on, if I decide I need to write some tests, I can type:

    sources qunit

to fetch the QUnit files.

That's really all there is to it.

Yes, it kind of resolves dependencies for me, but only if I define those
dependencies myself.

Yes, it fetches the latest versions of jQuery and Bootstrap, but only because
URLs exist for the latest versions. If a new version of QUnit is released, I
won't get that because I don't know of a URL for the latest version of QUnit.

Finding Sources
---------------

The sources for packages are defined in files named sources.json.

sources will look in the following locations for sources.json files:

- the current directory
- all parent directories of the current directory
- the home directory
- the sources script's directory

Locations higher on that list override locations lower on that list.

The contents of sources.json files are a JSON object like this:

    {
        "jquery": "http://code.jquery.com/jquery.js",
        "bootstrap": [
            "jquery",
            "http://twitter.github.com/bootstrap/assets/bootstrap.zip"
        ],
        "qunit": [
            "http://code.jquery.com/qunit/qunit-1.11.0.js",
            "http://code.jquery.com/qunit/qunit-1.11.0.css"
        ]
    }

The keys in those objects are the names of the packages as I've defined them.

The values can be URLs or arrays of URLs to fetch from.

If a URL references an archive, that archive is extracted into the current
directory and then the archive is deleted.

If a URL is the name of another package, that other package is fetched, too.

TODO:

- write to lib folder?
- look for sources.json inside lib folders, too?
- look for lib folder up path?
- caching?
- other archive formats?
- extract specific files from archives? (to exclude minified files, docs, tests, etc)

    "bootstrap": [
        "jquery",
        {
            "http://twitter.github.com/bootstrap/assets/bootstrap.zip": [
                "css/bootstrap.css",
                "css/bootstrap-responsive.css",
                "img/*",
                "js/bootstrap.js"
            ]
        }
    ]

- rename files?

    "qunit": [
        "http://code.jquery.com/qunit/qunit-1.11.0.js => qunit.js",
        "http://code.jquery.com/qunit/qunit-1.11.0.css => qunit.css"
    ]
