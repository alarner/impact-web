let config = require('../lib/config');
let express = require('express');
let router = express.Router();
let Hashids = require('hashids');
let hashids = new Hashids(config.hashids.salt);
let Search = require('../models/Search');
let Topics = require('../collections/Topics');

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
		.then(function(topicsModels) {
			return s.topics().attach(topicsModels.map((topic) => {
				return topic.id;
			}), {transacting: t});
		})
		.then(t.commit)
		.then(function() {
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
	let s = Search.forge({id: hashids.decode(req.params.key)[0]});
	Topics
	.upsert([req.body.topic])
	.then(function(topicsModels) {
		return s.topics().attach(topicsModels.map((topic) => {
			return topic.id;
		}));
	})
	.then(function() {
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
