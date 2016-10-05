'use strict';

let gulp = require('gulp'),
	ts = require('gulp-typescript'),
	sourcemaps = require('gulp-sourcemaps'),
	jasmine = require('gulp-jasmine'),
	tslint = require("gulp-tslint");


var CONFIGURATION = {
	sourceDirectory: __dirname+'/src',
	deploymentDirectory: __dirname+'/app',
	tsLintConfig: {
		configuration: './tslint.json'
	}
};
var STATIC_FILES = [ 'js', 'html', 'png', 'jpg', 'svg', 'css' ].map(
	(format) => CONFIGURATION.sourceDirectory+'/**/*.'+format
);


var tsProject = ts.createProject('tsconfig.json');
gulp.task('typescript', function() {
	var reporter = ts.reporter.defaultReporter();
	var tsResult = tsProject.src().pipe(ts(tsProject(reporter)));
	return tsResult.js.pipe(gulp.dest(tsProject.config.compilerOptions.outDir));
});

gulp.task('tslint', function() {
	gulp.src([CONFIGURATION.sourceDirectory + '/**/*.ts'])
		.pipe(tslint(CONFIGURATION.tsLintConfig))
		.pipe(tslint.report());
});

gulp.task('deploy', ['typescript', 'deploy static'], function() {});

gulp.task('test', ['typescript', 'tslint'], function() {
	return gulp.src([CONFIGURATION.deploymentDirectoryBase+'/**/*.spec.js'])
		.pipe(jasmine({
			spec_dir: CONFIGURATION.deploymentDirectoryBase
		}));
});

gulp.task('deploy static', [], function() {
	return gulp.src(STATIC_FILES, {
			base: CONFIGURATION.sourceDirectory
		})
		.pipe(gulp.dest(CONFIGURATION.deploymentDirectory));
});

gulp.task('default', ['serve']);