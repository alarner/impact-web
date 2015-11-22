exports.up = function(knex, Promise) {
	return knex.schema.createTable('content', function(t) {
		t.increments('id').unsigned().primary();
		t.text('raw').notNull();
		t.string('url').notNull().unique();
		t.string('host').notNull();
		t.dateTime('publishedAt').notNull();
		t.dateTime('createdAt').notNull();
		t.dateTime('updatedAt').nullable();
		t.dateTime('deletedAt').nullable();
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTable('content');
};