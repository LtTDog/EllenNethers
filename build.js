#!/usr/bin/env node

/*
Metalsmith build file
Build site with `node ./build.js` or `npm start`
Build production site with `npm run production`
*/

'use strict';

var
// defaults
  consoleLog = false, // set true for metalsmith file and meta content logging
  devBuild = false,
  pkg = require('./package.json'),

  // main directories
  dir = {
    base: __dirname + '/',
    lib: __dirname + '/lib/',
    source: './src/',
    dest: './docs/'
  },

  // modules
  metalsmith = require('metalsmith'),
  markdown = require('metalsmith-markdown'),
  permalinks = require('metalsmith-permalinks'),
  collections = require('metalsmith-collections'),
  inplace = require('metalsmith-in-place'),
  layouts = require('metalsmith-layouts'),
  assets = require('metalsmith-assets'),
  htmlmin = devBuild ? null : require('metalsmith-html-minifier'),
  browsersync = devBuild ? require('metalsmith-browser-sync') : null,

  // custom plugins
  debug = consoleLog ? require(dir.lib + 'metalsmith-debug') : null,

  siteMeta = {
    devBuild: devBuild,
    version: pkg.version,
    name: 'Ellen Nethers (1938 - 2016)',
    desc: 'Tribute to Ellen Nethers',
    author: 'Terrence Drumm',
    contact: 'https://twitter.com/lttdog',
    domain: devBuild ? 'http://127.0.0.1' : 'https://lttdog.github.io', // set domain
    rootpath: devBuild ? '/' : '/EllenNethers/' // set absolute path (null for relative)
  },

  templateConfig = {
    engine: 'handlebars',
    directory: dir.source + 'template/',
    partials: dir.source + 'partials/',
    default: 'page.html'
  };

console.log((devBuild ? 'Development' : 'Production'), 'build, version', pkg.version);


var ms = metalsmith(dir.base)
  .clean(true) // clean folder before a production build
  .source(dir.source + 'html/') // source folder (src/html/)
  .destination(dir.dest) // build folder (build/)
  .metadata(siteMeta) // add meta data to every page
  .use(collections({ // determine page collection/taxonomy
    page: {
      pattern: '**/index.*',
      sortBy: 'priority',
      reverse: true,
      refer: false
    },
    stories: {
      pattern: 'stories/**/*',
      sortBy: 'title',
      reverse: false,
      refer: true,
      limit: 50,
      metadata: {
        layout: 'story.html'
      }
    }
  }))
  .use(markdown()) // convert markdown
  .use(permalinks({ // generate permalinks
    pattern: ':mainCollection/:title'
  }))
  .use(inplace(templateConfig)) // in-page templating
  .use(layouts(templateConfig)); // layout templating

if (htmlmin) ms.use(htmlmin()); // minify production HTML

if (debug) ms.use(debug()); // output page debugging information

if (browsersync) ms.use(browsersync({ // start test server
  server: dir.dest,
  files: [dir.source + '**/*']
}));

ms
  .use(assets({ // copy assets: CSS, images etc.
    source: dir.source + 'assets/',
    destination: './'
  }))
  .build(function(err) { // build
    if (err) throw err;
  });
