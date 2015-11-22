module.exports = bookshelf.model('Search', {
	tableName: 'searches',
	hasTimestamps: ['createdAt', 'updatedAt', 'deletedAt']
});
