'use strict';

let gulp = require('gulp'),
	nodemon = require('gulp-nodemon'),
	ts = require('gulp-typescript'),
	sass = require('gulp-sass'),
	sourcemaps = require('gulp-sourcemaps'),
	jasmine = require('gulp-jasmine'),
	tslint = require("gulp-tslint");


var CONFIGURATION = {
	sourceDirectory: __dirname+'/src',
	sourceDirectoryAssets: __dirname+'/src/assets',
	deploymentDirectoryBase: __dirname+'/dist',
	deploymentDirectory: __dirname+'/dist/app',
	deploymentDirectoryAssets: __dirname+'/dist/app/assets',
	tsLintConfig: {
		configuration: './tslint.json'
	}
};
var STATIC_FILES = [ 'js', 'html', 'png', 'jpg', 'svg', 'css' ].map(
	(format) => CONFIGURATION.sourceDirectory+'/**/*.'+format
);


gulp.task('typescript', function() {
	return gulp.src([CONFIGURATION.sourceDirectory+'/**/*.ts'])
		.pipe(sourcemaps.init())
		.pipe(ts({module: 'commonjs'})).js
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(CONFIGURATION.deploymentDirectory));
});

gulp.task('tslint', function() {
	gulp.src([CONFIGURATION.sourceDirectory + '/**/*.ts'])
		.pipe(tslint(CONFIGURATION.tsLintConfig))
		.pipe(tslint.report());
});

gulp.task('sass', function () {
	return gulp.src(CONFIGURATION.sourceDirectoryAssets+'/**/*.scss')
		.pipe(sourcemaps.init())
		.pipe(sass().on('error', sass.logError))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(CONFIGURATION.deploymentDirectoryAssets));
});

gulp.task('watch', function() {
	gulp.watch(CONFIGURATION.sourceDirectory+'/**/*.ts', ['typescript']);
	gulp.watch(CONFIGURATION.sourceDirectoryAssets+'/**/*.scss', ['sass']);
	gulp.watch(STATIC_FILES, ['deploy static']);
});

gulp.task('deploy', ['typescript', 'sass', 'deploy static'], function() {});

gulp.task('serve', ['deploy', 'watch'], function() {
	nodemon({
		script: CONFIGURATION.deploymentDirectory+'/index.js',
		ext: 'js html'
	})
});

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