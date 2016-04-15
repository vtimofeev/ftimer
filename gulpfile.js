var gulp = require('gulp'), // Сообственно Gulp JS
    rename = require("gulp-rename"), // Переименование
    uglify = require('gulp-uglify'); // Минификация JS

gulp.task('default', function () {
    return gulp.src('./src/ft/timer.js')
        .pipe(uglify())
        .pipe(rename('ftimer.min.js'))
        .pipe(gulp.dest('./build'));
});

