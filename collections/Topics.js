let _ = require('lodash');
let Topic = require('../models/Topic');
module.exports = bookshelf.Collection.extend({
	model: Topic
}, {
	upsert: function(topicNames, transacting) {
		return new Promise((resolve, reject) => {
			knex('topics', {transacting: transacting})
			.whereIn('name', topicNames)
			.select('*')
			.then((existingTopics) => {
				let keyed = _.indexBy(existingTopics, 'name');
				topicNames = _.remove(topicNames, (name) => {
					return !keyed.hasOwnProperty(name);
				});

				let topicModels = this.forge(topicNames.map((name) => {
					return { name: name, createdAt: new Date() };
				}));

				Promise.all(topicModels.invoke('save', null, {transacting: transacting}))
				.then(function() {
					topicModels.add(existingTopics);
					resolve(topicModels);
				});
			});
		});
	}
});