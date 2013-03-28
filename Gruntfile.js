/*jshint node: true */
/*global module:false */
module.exports = function(grunt) {

    'use strict';

    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-closurecompiler');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                jshintrc: ".jshintrc"
            },
            build:  ['Gruntfile.js', 'src/**/*.js']
        },
        requirejs: {
            snaps: {
                options: {
                    dir:'tmp/',
                    logLevel:2,
                    baseUrl: 'src',
                    optimize: 'none',
                    modules: [{ name: "snaps" }]
                }
            }
        },
        clean: ["tmp", "dist"],
        copy: {
            dist: {
                files: {
                    "dist/snaps-<%= pkg.version %>.js": "tmp/snaps.js"
                }
            },
            testable: {
                files: {
                    "tmp/snaps-edge.min.js": 'dist/snaps-<%= pkg.version %>.min.js'
                }
            }
        },
        closurecompiler: {
            options: {
                compilation_level: "SIMPLE_OPTIMIZATIONS",
                warning_level: 'DEFAULT',
                summary_detail_level: 3
            },
            dist: {
                src:'tmp/snaps.js',
                dest:'dist/snaps-<%= pkg.version %>.min.js'
            }
        },
        mocha: {
            options: {
                mocha: {
                    ignoreLeaks: false
                },
                reporter:'Spec',
                run: false
            },
            all: {
                src: ["test/*.html"]
            }
        },
        watch: {
            js: {
                files: ['src/**/*.js'],
                tasks: 'fast'
            }
        }
    });

    grunt.registerTask('dev', ['jshint:build','requirejs:snaps','copy:dist']);
    grunt.registerTask('production', ['dev','closurecompiler:dist']);
    grunt.registerTask('default', ['production']);
    grunt.registerTask('test', ['copy:testable', 'mocha:all']);
};
