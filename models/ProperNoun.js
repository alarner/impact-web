require('./Content');
module.exports = bookshelf.model('ProperNoun', {
	tableName: 'properNouns',
	hasTimestamps: ['createdAt', 'updatedAt', 'deletedAt'],
	content: function() {
		return this.belongsTo('Content', 'contentId');
	}
});