exports.up = function(knex, Promise) {
	return knex.schema.createTable('searchTopics', function(t) {
		t.increments('id').unsigned().primary();
		t.integer('searchId')
			.unsigned()
			.nullable()
			.references('id')
			.inTable('searches')
			.onDelete('CASCADE');
		t.integer('topicId')
			.unsigned()
			.nullable()
			.references('id')
			.inTable('topics')
			.onDelete('CASCADE');
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTable('searchTopics');
};
