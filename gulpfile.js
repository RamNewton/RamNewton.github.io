import gulp from 'gulp';
import browserSync from 'browser-sync';
import gulpSass from 'gulp-sass';
import * as dartSass from 'sass';
import rename from 'gulp-rename'
import cssnano from 'gulp-cssnano';
import prefix from 'gulp-autoprefixer';
import concat from 'gulp-concat';
import cp from 'child_process';

const sass = gulpSass(dartSass);

function styles() {
  return gulp
    .src([ '_sass/*.scss' ])
    .pipe(
      sass({
        includePaths: [ 'scss' ],
        onError: browserSync.notify
      })
    )
    .pipe(prefix([ 'last 3 versions', '> 1%', 'ie 8' ], { cascade: true }))
    .pipe(rename('main.min.css'))
    .pipe(cssnano())
    .pipe(gulp.dest('_site/assets/css/'))
    .pipe(browserSync.reload({ stream: true }))
    .pipe(gulp.dest('assets/css'));
}

function stylesVendors() {
  return gulp
    .src([ '_sass/vendors/*.css' ])
    .pipe(concat('vendors.min.css'))
    .pipe(cssnano())
    .pipe(gulp.dest('_site/assets/css/'))
    .pipe(gulp.dest('assets/css'));
}

/**
 * Server functionality handled by BrowserSync
 */
function browserSyncServe(done) {
  browserSync.init({
    server: '_site',
    port: 4000
  });
  done();
}

function browserSyncReload(done) {
  browserSync.reload();
  done();
}


function jekyll(done) {
  return cp
    .spawn(
      'bundle',
      [
        'exec',
        'jekyll',
        'build',
        '--incremental',
        '--config=_config.yml'
      ],
      {
        stdio: 'inherit'
      }
    )
    .on('close', done);
}

/**
 * Watch source files for changes & recompile
 * Watch html/md files, run Jekyll & reload BrowserSync
 */
function watchData() {
  gulp.watch(
    [ '_data/*.yml', '_config.yml', 'assets/*.json' ],
    gulp.series(jekyll, browserSyncReload)
  );
}

function watchMarkup() {
  gulp.watch(
    [ 'index.html', '_includes/*.html', '_layouts/*.html' ],
    gulp.series(jekyll, browserSyncReload)
  );
}

function watchStyles() {
  gulp.watch([ '_sass/*.scss' ], styles);
}

var compile = gulp.parallel(styles, stylesVendors);
var serve = gulp.series(compile, jekyll, browserSyncServe);
var watch = gulp.parallel(watchData, watchMarkup, watchStyles);


/**
 * Default task, running just `gulp` will compile the sass,
 * compile the Jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', gulp.parallel(serve, watch));