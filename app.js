/*eslint strict: [0]*/
let config = require('./lib/config');

global.knex = require('knex')(config.database);
global.bookshelf = require('bookshelf')(global.knex);
bookshelf.plugin('registry');

let express = require('express');
let path = require('path');
let knexLogger = require('knex-logger');
// let favicon = require('serve-favicon');
// let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let session = require('express-session');
let RedisStore = require('connect-redis')(session);
let _ = require('lodash');
let flash = require('./lib/middleware/flash-messages');

let passportSetup = require('./lib/auth/passport-setup');
let index = require('./routes/index');
let api1 = require('./routes/api1');
let auth = require('./routes/auth');

let app = express();

let io = require('socket.io');
let ios = require('socket.io-express-session');

app.io = io();


let sessionConfig = _.extend({}, config.session, {store: new RedisStore()});
let sess = session(sessionConfig);
app.use(sess);
app.io.use(ios(sess));
// app.storedSession = sess;
require('./lib/kue').init(app.io, sessionConfig);

let apiMiddleware = require('./lib/bookshelf-api')({
	path: path.join(__dirname, 'models')
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// app.use(logger('dev'));
// app.use(knexLogger(knex));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash);
passportSetup(app);

app.use('/api/v1/', api1, apiMiddleware);
app.use('/auth', auth);
app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	let err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});


module.exports = app;
