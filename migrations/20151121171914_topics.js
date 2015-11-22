exports.up = function(knex, Promise) {
	return knex.schema.createTable('topics', function(t) {
		t.increments('id').unsigned().primary();
		t.string('name').notNull();
		t.dateTime('createdAt').notNull();
		t.dateTime('updatedAt').nullable();
		t.dateTime('deletedAt').nullable();
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTable('topics');
};
