require('./Search');
module.exports = bookshelf.model('Topic', {
	tableName: 'topics',
	hasTimestamps: ['createdAt', 'updatedAt', 'deletedAt'],
	searches: function() {
		return this.belongsToMany('Search', 'searchTopics', 'topicId', 'searchId');
	}
});