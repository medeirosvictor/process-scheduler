'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var minify = require('gulp-minify');

sass.compiler = require('node-sass');

gulp.task('sass', function () {
    return gulp.src('./static/sass/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(concat('index.css'))
        .pipe(minify())
        .pipe(gulp.dest('./static/css'));
});

gulp.task('watch', function(){
    return gulp.watch('./static/sass/**/*.scss', gulp.series('sass'));
});
