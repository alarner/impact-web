let config = require('../lib/config');
let express = require('express');
let router = express.Router();
let Hashids = require('hashids');
let hashids = new Hashids(config.hashids.salt);
let Search = require('../models/Search');
let Topics = require('../collections/Topics');
let Content = require('../models/Content');
let queue = require('../lib/kue');
let scrub = require('../lib/scrub');
let condense = require('../lib/condense');


router.get('/content/analyze/:id', function(req, res, next) {
	Content.forge({id: req.params.id}).fetch().then(function(content) {
		let scrubbed = scrub(content.get('raw'));
		let words = condense(scrubbed);
		// res.end(scrubbed);
		res.json(words);
	});
});

router.get('/content/analyze', function(req, res, next) {
	knex('content')
	.whereNotNull('raw')
	.select('*')
	.then((content) => {

		let numErrors = 0;

		let contentModels = content.map((c) => {
			let newData = {error: null};
			let scrubbed = scrub(c.raw);
			if(scrubbed) {
				// let sorted = articleCandidates.sort((candidate) => {
				// 	return -1*candidate.trim().length;
				// });
				// newData.scrubbed = sorted.pop().trim();
				newData.scrubbed = scrubbed;
				// console.log('MULTIPLE: ', c.id, newData.scrubbed.length, articleCandidates.length);
			}
			else {
				console.log('NO CANDIDATES: ', c.id);
				numErrors++;
				newData.error = 'Scrub returned no candidates';
			}

			return Content.forge(c).save(newData).then(() => {
				
			});
		});

		Promise.all(contentModels)
		.then(function() {
			res.end('OK '+numErrors);
		});
	});
});

router.post('/search', function(req, res, next) {
	req.body.topics = req.body.topics || [];

	if(!req.body.name) {
		return res.status(400).json({
			message: 'Must specify a name to save a search.',
			status: 400
		});
	}

	if(!Array.isArray(req.body.topics)) {
		return res.status(400).json({
			message: 'Topics must be an array.',
			status: 400
		});
	}

	let topicModels = null;
	bookshelf.transaction(function(t) {
		let s = new Search({
			name: req.body.name,
			key: '',
			createdAt: new Date()
		});
		s.save(null, {transacting: t})
		.then(function(search) {
			return s.save({key: hashids.encode(search.id)}, {transacting: t});
		})
		.then(function(search) {
			return Topics.upsert(req.body.topics, t);
		})
		.then(function(tm) {
			topicModels = tm;
			return s.topics().attach(tm.map((topic) => {
				return topic.id;
			}), {transacting: t});
		})
		.then(t.commit)
		.then(function() {
			topicModels.forEach(function(model) {
				queue.addJob('topic', {
					title: model.get('name'),
					topic: model
				}, req.sessionID);
			});
			res.json(s.toJSON());
		})
		.catch(function(err) {
			t.rollback();
			res.status(500).json({
				message: err.toString(),
				status: 400
			});
		});
	});
});

router.post('/search/:key/topic', function(req, res, next) {
	let topicModel = null;
	let s = Search.forge({id: hashids.decode(req.params.key)[0]});
	Topics
	.upsert([req.body.topic])
	.then(function(models) {
		topicModel = models.at(0);
		return s.topics().attach(models.map((topic) => {
			return topic.id;
		}));
	})
	.then(function() {
		queue.addJob('topic', {
			title: topicModel.get('name'),
			topic: topicModel
		}, req.sessionID);
		res.json(s.toJSON());
	})
	.catch(function(err) {
		res.status(500).json({
			message: err.toString(),
			status: 400
		});
	});
});

module.exports = router;
