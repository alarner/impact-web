let kue = require('kue');
let queue = kue.createQueue();
let Bottleneck = require('bottleneck');
let limiter = new Bottleneck(1, 1000);
let async = require('async');
let request = require('request');
var Topic = require('../models/Topic');
var Content = require('../models/Content');
let _ = require('lodash');
let url = require('url');

const URL = 'https://ajax.googleapis.com/ajax/services/search/news?v=1.0&q=';
const TOTAL_STEPS = 100;

queue.process('topic', 1, function(job, cb) {
	job.data.topic = Topic.forge(job.data.topic);
	console.log('Starting topic', job.data.topic.get('name'));
	job.log('Fetching data', job.data.topic.get('name'));
	job.progress(1, TOTAL_STEPS);
	request(URL+'"'+job.data.topic.get('name')+'"', {timeout: 6000}, function(error, response, body) {
		if(error || response.statusCode !== 200) {
			return cb('Could not load results from google news... '+error);
		}

		let json = JSON.parse(body);

		if(!json || !json.responseData || !json.responseData.results) {
			return cb('Bad body response from google news...');
		}

		job.log('Got number of results', job.data.topic.get('name'), json.responseData.cursor.estimatedResultCount);
		let pages = [];
		job.data.totalArticles = Math.min(70, parseInt(json.responseData.cursor.estimatedResultCount));
		job.data.numArticles = 0;
		for(let i=0; i<job.data.totalArticles/4; i++) {
			pages.push(i);
		}

		async.each(
			pages,
			function(page, cb) {
				job.log('Start loading page', job.data.topic.get('name'), page);
				loadResultsPage.call(job, page, cb);
			},
			function(err) {
				cb(null, job.data.numArticles);
			}
		);
	});
});

function loadResultsPage(page, cb) {
	limiter.submit(request, URL+'"'+this.data.topic.get('name')+'"&start='+page*4, {timeout: 2000}, (error, response, body) => {
		if(error || response.statusCode !== 200) {
			return cb(null, false);
		}

		let json = JSON.parse(body);

		if(!json || !json.responseData || !json.responseData.results) {
			return cb(null, false);
		}

		let uniqueResults = _.uniq(json.responseData.results, (result) => {
			return result.unescapedUrl;
		});

		let urls = uniqueResults.map((result) => {
			return result.unescapedUrl;
		});

		knex('content')
		.whereIn('url', urls)
		.select('id', 'url')
		.then((existingContent) => {
			// Associate existing content with topic
			this.data.topic.content().attach(existingContent.map((content) => {
				return content.id;
			}))
			.then(() => {
				this.data.numArticles += existingContent.length;
				this.progress(this.data.numArticles, this.data.totalArticles);
			});
			return existingContent;
		})
		.then((existingContent) => {
			let keyed = _.indexBy(existingContent, 'url');
			let newResults = _.filter(uniqueResults, (result) => {
				return !keyed.hasOwnProperty(result.unescapedUrl);
			});

			// Fetch new content
			async.each(
				newResults,
				loadNewsPage.bind({job: this, page: page}),
				(err, data) => {
					this.log('Finish loading page', page);
					cb(err, data);
				}
			);
		});
	});
};

function loadNewsPage(article, cb) {
	let parsedUrl = url.parse(article.unescapedUrl);
	let date = new Date(article.publishedDate);
	request({
		uri: article.unescapedUrl,
		maxRedirects: 3,
		timeout: 2000
	}, (error, response, body) => {
		this.job.log('Loaded news page', article.unescapedUrl);
		let contentData = {
			url: article.unescapedUrl,
			publishedAt: date,
			host: parsedUrl.host
		};
		if(error || response.statusCode !== 200) {
			// this.job.progress(this.job.data.numArticles, --this.job.data.totalArticles);
			contentData.error = error ? error.toString() : response.statusCode;
			// return cb(null, false);
		}
		else {
			contentData.raw = body.replace(/\0/g, '');
		}
		let c = new Content(contentData);
		c.save().then((content) => {
			return this.job.data.topic.content().attach(content.id);
		})
		.then(() => {
			this.job.progress(++this.job.data.numArticles, this.job.data.totalArticles);
			cb(null, true);
		})
		.error((err) => {
			if(err.code !== '23505') {
				console.log(err);
				cb(null, false);
			}
			
			// If we get here the content is already in the database.
			// We need to find its id and associate it with this topic.

			new Content({'url': article.unescapedUrl})
			.fetch()
			.then((c) => {
				console.log('FOUND DUPLICATE CONTENT!!!', article.unescapedUrl);
				this.job.data.topic.content().attach(c.id)
				.then(() => {
					this.job.progress(++this.job.data.numArticles, this.job.data.totalArticles);
					cb(null, true);
				});
			});
		});
	});
}


module.exports = {
	init: function(io) {
		this.io = io;
		this.io.on('connection', function(socket, msg){
			console.log('a user connected', socket.handshake.sessionID);
			socket.emit('my message', 'test message');
		});
	},
	addJob: function(type, data, sessionId) {
		return queue
			.create(type, data)
			.on('progress', (progress, data) => {
				console.log('progress', progress, data);
			})
			.on('complete', (result) => {
				console.log(type);
				if(type === 'topic') {
					console.log(data.topic.get('name'));
				}
				console.log('job completed with result', result);
			})
			.save();
	}

};

// module.exports = queue;