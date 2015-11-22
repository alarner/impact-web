exports.up = function(knex, Promise) {
	return knex.schema.createTable('contentTopics', function(t) {
		t.increments('id').unsigned().primary();
		t.integer('contentId')
			.unsigned()
			.nullable()
			.references('id')
			.inTable('content')
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
	return knex.schema.dropTable('contentTopics');
};
