module.exports = function (grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		less: {
			dist: {
				options: {
					paths: [
						'less',
					],
					compress: true,
					cleancss: true,
					report: 'min',
				},
				files: {
					'static/style.css': 'less/main.less',
				},
			},
		},
	});

	grunt.loadNpmTasks('grunt-contrib-less');

	grunt.registerTask('default', ['less']);

};
