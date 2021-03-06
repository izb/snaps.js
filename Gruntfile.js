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
    grunt.loadNpmTasks('grunt-mocha');
    grunt.loadNpmTasks('grunt-jsdoc');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                jshintrc: ".jshintrc"
            },
            production:  ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
            dev: {
                options: {
                    devel:true
                },
                src:  ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js']
            }
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
                    "dist/snaps.js": "tmp/snaps.js"
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
                dest:'dist/snaps.min.js'
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
        jsdoc : {
            dist : {
                src: ['src/**/*.js'],
                options: {
                    destination: 'dist/doc',
                    private: false,
                    template: "./doc_template",
                    configure: './jsdoc.json'
                }
            }
        },
        watch: {
            js: {
                files: ['src/**/*.js'],
                tasks: ['dev']
            },
            test: {
                files: ['test/**/*.js','test/**/*.html'],
                tasks: ['jshint:dev', 'test']
            }
        }
    });

    grunt.registerTask('dev', ['jshint:dev','requirejs:snaps','copy:dist']);
    grunt.registerTask('production', ['jshint:production','requirejs:snaps','copy:dist','closurecompiler:dist']);
    grunt.registerTask('default', ['production']);
    grunt.registerTask('test', ['mocha:all']);
    grunt.registerTask('doc', ['jsdoc:dist']);

    grunt.registerTask('start', ['clean', 'dev', 'watch']);
    grunt.registerTask('dist', ['clean', 'production', 'test', 'dev', 'doc']);
};
