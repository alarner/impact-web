exports.up = function(knex, Promise) {
	return knex.schema.createTable('searches', function(t) {
		t.increments('id').unsigned().primary();
		t.string('key').notNull();
		t.string('name').nullable();
		t.dateTime('createdAt').notNull();
		t.dateTime('updatedAt').nullable();
		t.dateTime('deletedAt').nullable();

		t.integer('userId')
			.unsigned()
			.nullable()
			.references('id')
			.inTable('users')
			.onDelete('CASCADE');
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTable('searches');
};
