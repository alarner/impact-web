require('./Topic');
require('./ProperNoun');
module.exports = bookshelf.model('Content', {
	tableName: 'content',
	hasTimestamps: ['createdAt', 'updatedAt', 'deletedAt'],
	topics: function() {
		return this.belongsToMany('Topic', 'contentTopics', 'contentId', 'topicId');
	},
	properNouns: function() {
		this.hasMany('ProperNoun', 'contentId');
	}
});