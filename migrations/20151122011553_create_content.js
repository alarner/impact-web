exports.up = function(knex, Promise) {
	return knex.schema.createTable('content', function(t) {
		t.increments('id').unsigned().primary();
		t.text('raw').nullable();
		t.text('scrubbed').nullable();
		t.text('url').notNull().unique();
		t.string('host').notNull();
		t.string('error').nullable();
		t.dateTime('publishedAt').notNull();
		t.dateTime('createdAt').notNull();
		t.dateTime('updatedAt').nullable();
		t.dateTime('deletedAt').nullable();
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTable('content');
};