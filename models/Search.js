require('./User');
require('./Topic');
module.exports = bookshelf.model('Search', {
	tableName: 'searches',
	hasTimestamps: ['createdAt', 'updatedAt', 'deletedAt'],
	user: function() {
		return this.belongsTo('User', 'userId');
	},
	topics: function() {
		return this.belongsToMany('Topic', 'searchTopics', 'searchId', 'topicId');
	}
});