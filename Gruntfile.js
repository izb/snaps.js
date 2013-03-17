/*jshint node: true */
/*global module:false */
module.exports = function(grunt) {

    'use strict';

    grunt.loadNpmTasks('grunt-requirejs');
    grunt.loadNpmTasks('grunt-closure-tools');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            build:  ['Gruntfile.js', 'src/**/*.js']
        },
        requirejs: {
            snaps: {
                options: {
                    out:'tmp/snaps.js',
                    baseUrl: 'src',
                    optimize: 'none',
                    name: 'snaps'
                }
            }
        },
        copy: {
            lib: {
                files: {
                    "lib/snaps-<%= pkg.version %>.js": "tmp/snaps.js"
                }
            }
        },
        closureCompiler: {

            options: {
                compilerFile: './bin/closure-compiler/compiler.jar',

                compilerOpts: {
                    compilation_level: 'SIMPLE_OPTIMIZATIONS',
                    warning_level: 'DEFAULT',
                    summary_detail_level: 3,
                    externs: ['externs.js']
                }
            },
            lib: {
                src: 'tmp/snaps.js',
                dest: 'lib/snaps-<%= pkg.version %>.min.js'
            }
        },
        watch: {
            js: {
                files: ['src/**/*.js'],
                tasks: 'fast'
            }
        }
    });

    grunt.registerTask('fast', ['jshint:build','requirejs:snaps','copy:lib']);
    grunt.registerTask('default', ['fast','closureCompiler:lib']);
    grunt.registerTask('test', ['default']); /* TODO: Testing. */
};
