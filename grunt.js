/*jshint node: true */
/*global module:false */
module.exports = function(grunt) {

    'use strict';

    grunt.loadNpmTasks('grunt-requirejs');

    /* Project config */

    grunt.initConfig({
        requirejs: {
            snaps: {
                out:'lib/snap.js',
                baseUrl: 'src',
                paths: {
                    jquery: 'https://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min'
                },
                //pragmas: {
                //    doExclude: true
                //},
                //optimize: 'none',
                //skipModuleInsertion: false,
                optimizeAllPluginResources: true,
                findNestedDependencies: true,
                //dir:'src',
                name: 'snaps/main'
            },
            snaps2: {
                baseUrl:'src',
                name:'snaps/main',
                out: 'lib/snaps'
            }
        }

    });

    grunt.registerTask('default', 'requirejs:snaps2');
};
