'use strict';

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-bump');

    //config
    grunt.initConfig({
        pkg : grunt.file.readJSON('package.json'),
        src : {
            hijeckingJS : 'src/component/jquery-anti-dns-hijecking/jquery-anti-dns-hijecking.js'
        },
        dist : {
            hijeckingJS : 'dist/js/jquery-anti-dns-hijecking.js',
            hijeckingMinJS : 'dist/js/jquery-anti-dns-hijecking.min.js'
        },
        clean: {
            dist: 'dist'
        },
        copy: {
            dist: {
                files : [{
                    cwd: 'src',
                    expand: true,
                    src: ['!component/**/*', 'css/**/*', '**/*.html'],
                    dest: 'dist/'
                }, {
                    cwd: 'src/component/zepto/',
                    expand: true,
                    src: ['zepto.min.js'],
                    dest: 'dist/js'
                }]
            }
             
        },
        replace: {
            dist: {
                options: {
                    patterns: [{
                        match: /(<[a-z]+)(\s|>)/g,
                        replacement: '$1 anti-hijecking$2'
                    }, {
                        match: /<\/body>/g,
                        replacement: '<script>\n{literal}\n<%= grunt.file.read("dist/js/jquery-anti-dns-hijecking.min.js") %>\n{/literal}\n</script>\n</body>'
                    }]
                },
                files: [{
                    expand: true,
                    flatten: true,
                    src: ['src/**/*.html'],
                    dest: 'dist/'
                }]
            },
            init : {
                options: {
                    patterns: [{
                        match: /\/\/@initFn/,
                        replacement: 'var config = {selector : \':not([anti-hijecking])\', server : \'http://mstats.vip.com/v1/stats/<%= grunt.file.readJSON("config.json").name %>\'}; new AntiHijecking(config);'
                    }]
                },
                files: [{
                    flatten: true,
                    src: ['<%= src.hijeckingJS %>'],
                    dest: '<%= dist.hijeckingJS %>'
                }]
            }

        },

        uglify : {
            dist : {
                files: {
                    'dist/jquery-anti-dns-hijecking-<%= grunt.file.readJSON("package.json").version %>.min.js': ['src/jquery-anti-dns-hijecking.js']
                }
            }
        },

        bump : {
            options : {
                push : false,
                commit : false
            }
        }

    })

    grunt.registerTask('default', ['uglify:dist']);
    grunt.registerTask('publish', ['clean', 'bump', 'uglify:dist']);




}