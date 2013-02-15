/*jshint node: true */
/*global module:false */
module.exports = function(grunt) {

    'use strict';

    grunt.loadNpmTasks('grunt-requirejs');
    grunt.loadNpmTasks('grunt-closure-tools');

    /* Project config */

    grunt.initConfig({
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
                out:'lib/snaps.js',
                baseUrl: 'src',
                paths: {
                    jquery: 'https://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min'
                },
                optimize: 'none',
                name: 'snaps/main'
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
                js: 'lib/snaps.js',
                output_file: 'lib/snaps.min.js'
            }
        }
    });

    grunt.registerTask('default', 'lint:build requirejs:snaps closureCompiler');
};
