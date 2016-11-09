'use strict';

let Gulp = require('gulp'),
	TSC = require('gulp-typescript'),
	SourceMaps = require('gulp-sourcemaps'),
	Jasmine = require('gulp-jasmine'),
	TsLint = require("gulp-tslint");


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


var tsProject = TSC.createProject('tsconfig.json');
Gulp.task('typescript', function() {
	var compilerOptions = JSON.parse(JSON.stringify(tsProject.config.compilerOptions));
	delete compilerOptions.outDir;

	var tsResult = Gulp.src(tsProject.config.include)
		.pipe(TSC(compilerOptions));

    return tsResult.js.pipe(Gulp.dest(tsProject.config.compilerOptions.outDir));
});

Gulp.task('tslint', function() {
	Gulp.src([CONFIGURATION.sourceDirectory + '/**/*.ts'])
			.pipe(TsLint(CONFIGURATION.tsLintConfig))
			.pipe(TsLint.report());
});

Gulp.task('watch', function() {
	Gulp.watch(CONFIGURATION.sourceDirectory+'/**/*.ts', ['typescript']);
	Gulp.watch(STATIC_FILES, ['deploy static']);
});

Gulp.task('deploy', ['typescript', 'deploy static'], function() {});

Gulp.task('test', ['typescript', 'tslint'], function() {
	return Gulp.src([CONFIGURATION.deploymentDirectory+'/**/*.spec.js'])
		.pipe(Jasmine({
			spec_dir: CONFIGURATION.deploymentDirectory,
			includeStackTrace: true
		}));
});

Gulp.task('deploy static', [], function() {
	return Gulp.src(STATIC_FILES, {
			base: CONFIGURATION.sourceDirectory
		})
		.pipe(Gulp.dest(CONFIGURATION.deploymentDirectory));
});

Gulp.task('default', ['test']);