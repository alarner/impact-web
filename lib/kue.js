let kue = require('kue');
let queue = kue.createQueue();
let Bottleneck = require('bottleneck');
let limiter = new Bottleneck(1, 1000);
let async = require('async');
let request = require('request');
let Topic = require('../models/Topic');
let Content = require('../models/Content');
let ProperNouns = require('../collections/ProperNouns');
let _ = require('lodash');
let url = require('url');
let scrub = require('./scrub');
let condense = require('./condense');

const URL = 'https://api.datamarket.azure.com/Bing/Search/v1/News?$format=json&Query=';
const ACCOUNT_KEY = 'mnEdTUAWPjLe3a+S9DKt52MK1qwGFlhhF/Se5DsQstA';
const TOTAL_STEPS = 100;

queue.process('topic', 1, function(job, cb) {
	job.data.topic = Topic.forge(job.data.topic);
	job.log('Fetching data', job.data.topic.get('name'));
	job.progress(1, TOTAL_STEPS);

	let pages = [];
	job.data.totalArticles = 100;
	job.data.numArticles = 0;
	for(let i=0; i<job.data.totalArticles/15; i++) {
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

function loadResultsPage(page, cb) {
	let resultsUrl = URL+encodeURIComponent('\''+this.data.topic.get('name')+'\'')+'&$skip='+page*15;
	let requestOptions = {
		uri: resultsUrl,
		timeout: 2000,
		auth: {
			user: ACCOUNT_KEY,
			pass: ACCOUNT_KEY
		}
	};

	limiter.submit(request, requestOptions, (error, response, body) => {
		if(error || response.statusCode !== 200) {
			this.log('Error loading page:', this.data.topic.get('name'), page, body, resultsUrl);
			return cb(null, false);
		}

		let json = JSON.parse(body);

		if(!json || !json.d || !json.d.results) {
			this.log('Error loading page: bad format', body);
			return cb(null, false);
		}

		this.log('Finished loading page', this.data.topic.get('name'), page);

		let uniqueResults = _.uniq(json.d.results, (result) => {
			return result.Url;
		});

		let urls = uniqueResults.map((result) => {
			return result.Url;
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
				return !keyed.hasOwnProperty(result.Url);
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
	let parsedUrl = url.parse(article.Url);
	let date = new Date(article.Date);
	request({
		uri: article.Url,
		maxRedirects: 3,
		timeout: 2000
	}, (error, response, body) => {
		this.job.log('Loaded news page', article.Url);
		let contentData = {
			url: article.Url,
			publishedAt: date,
			host: parsedUrl.host
		};
		if(error || response.statusCode !== 200) {
			contentData.error = error ? error.toString() : response.statusCode;
		}
		else {
			contentData.raw = body.replace(/\0/g, '');
			contentData.scrubbed = scrub(contentData.raw);
			if(contentData.scrubbed === null) {
				contentData.error = 'Unable to scrub content';
			}
		}
		let c = new Content(contentData);
		c.save().then((content) => {
			let promises = [];
			if(contentData.scrubbed) {
				let nouns = condense(contentData.scrubbed);
				let nounModels = ProperNouns.forge(nouns.map((noun) => {
					noun.createdAt = new Date();
					noun.contentId = c.id;
					return noun;
				}));
				promises = nounModels.invoke('save');
			}
			promises.push(this.job.data.topic.content().attach(content.id));
			return Promise.all(promises);
		})
		.then(() => {
			this.job.progress(++this.job.data.numArticles, this.job.data.totalArticles);
			cb(null, true);
		})
		.error((err) => {
			if(err.code !== '23505') {
				console.log(err);
				return cb(null, false);
			}
			
			// If we get here the content is already in the database.
			// We need to find its id and associate it with this topic.

			new Content({'url': article.Url})
			.fetch()
			.then((c) => {
				console.log('FOUND DUPLICATE CONTENT!!!', article.Url);
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
	sessions: {},
	init: function(io, sessionConfig) {
		this.io = io;
		this.io.on('connection', (socket, msg) => {
			this.sessions[socket.handshake.sessionID] = socket;
		});
	},
	addJob: function(type, data, sessionId) {
		let sessions = this.sessions;
		return queue
			.create(type, data)
			.on('progress', function(progress, data) {
				if(sessions.hasOwnProperty(sessionId)) {
					sessions[sessionId].emit('progress', {
						progress: progress,
						type: this.type,
						data: this.data
					});
				}
			})
			.on('complete', function(result) {
				if(sessions.hasOwnProperty(sessionId)) {
					sessions[sessionId].emit('complete', {
						type: this.type,
						data: this.data
					});
				}
			})
			.save();
	}

};

// module.exports = queue;