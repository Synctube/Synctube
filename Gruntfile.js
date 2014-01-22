module.exports = function (grunt) {

	var lessFiles = {
		'static/style.css': 'less/main.less',
	};

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		less: {
			options: {
				paths: [
					'less',
					'bower_components',
				],
			},
			dev: {
				files: lessFiles,
				options: {
					sourceMap: true,
					sourceMapFilename: 'static/style.css.map',
					sourceMapURL: 'style.css.map',
				},
			},
			dist: {
				options: {
					compress: true,
					cleancss: true,
					report: 'min',
				},
				files: lessFiles,
			},
		},
		watch: {
			less: {
				files: ['less/**/*.less'],
				tasks: ['less:dev'],
				options: {
					atBegin: true,
					interrupt: true,
				},
			},
			mustache: {
				files: ['template/**/*'],
				tasks: ['mustache_render:dist'],
				options: {
					atBegin: true,
					interrupt: true,
				},
			},
			static: {
				files: [
					'static/**/*',
					'template/**/*',
				],
				options: {
					livereload: true,
				},
			},
		},
		mustache_render: {
			options: {
				clear_cache: true,
				directory: 'template/',
				extension: '',
			},
			dist: {
				files: [
					{
						data: {},
						template: 'template/index.html',
						dest: 'static/index.html',
					},
				],
			},
		},
		nodemon: {
			dev: {
				script: 'server.js',
				options: {
					ignored: [
						'Gruntfile.js',
						'node_modules/**',
					],
					watchedExtensions: ['js'],
				},
			},
		},
		concurrent: {
			dev: {
				tasks: ['watch', 'nodemon:dev'],
				options: {
					logConcurrentOutput: true
				},
			},
		},
	});

	grunt.loadNpmTasks('grunt-concurrent');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-mustache-render');
	grunt.loadNpmTasks('grunt-nodemon');

	grunt.registerTask('default', ['less:dist', 'mustache_render:dist']);
	grunt.registerTask('dev', ['concurrent:dev']);

};
