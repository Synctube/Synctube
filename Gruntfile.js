module.exports = function (grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		watch: {
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
		nodemon: {
			dev: {
				script: 'server.js',
				options: {
					ignored: [
						'Gruntfile.js',
						'node_modules/**',
						'build/**',
						'client/**',
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
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-nodemon');

	grunt.registerTask('default', ['concurrent:dev']);

};
