/*jshint node: true */
/*global module:false */
module.exports = function(grunt) {

    'use strict';

    grunt.loadNpmTasks('grunt-requirejs');
    grunt.loadNpmTasks('grunt-closure-tools');
    grunt.loadNpmTasks('grunt-contrib-copy');

    /* Project config */

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true
            },
            build: {
                options:{devel:false,browser:true},
                globals:{}
            }
        },
        lint: {
            build:  ['grunt.js', 'src/**/*.js']
        },
        requirejs: {
            snaps: {
                out:'tmp/snaps.js',
                baseUrl: 'src',
                optimize: 'none',
                name: 'snaps'
            }
        },
        copy: {
            lib: {
                files: {
                    "lib/snaps-<%= pkg.version %>.js": "tmp/snaps.js"
                }
            }
        },
        closureCompiler:  {

            options: {
                closureCompiler: './bin/closure-compiler/compiler.jar',

                compilerOpts: {
                    compilation_level: 'SIMPLE_OPTIMIZATIONS',
                    warning_level: 'verbose',
                    summary_detail_level: 3
                },
                js: 'tmp/snaps.js',
                output_file: 'lib/snaps-<%= pkg.version %>.min.js'
            }
        }
    });

    grunt.registerTask('default', 'lint:build requirejs:snaps copy:lib closureCompiler');
    grunt.registerTask('test', 'default'); /* TODO: Testing. */
};
