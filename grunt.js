/*jshint node: true */
/*global module:false */
module.exports = function(grunt) {

    'use strict';

    grunt.loadNpmTasks('grunt-requirejs');

    /* Project config */

    grunt.initConfig({
        requirejs: {
            modules: {
                out:'lib/snap.js',
                baseUrl: 'src',
                paths: {
                    jquery: 'https://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min'
                },
                pragmas: {
                    doExclude: true
                },
                optimize: 'none',
                skipModuleInsertion: false,
                optimizeAllPluginResources: true,
                findNestedDependencies: true,
                /* Bend the module array into a require.js-pleasing shape */
                modules: (function(){ return modules.map(function(name) { return {name:name,excludeShallow:nonmodules}; }); }())
            }
        }

    });

    grunt.registerTask('default', 'notest test summarize');
};
