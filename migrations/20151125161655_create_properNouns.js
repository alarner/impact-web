exports.up = function(knex, Promise) {
	return knex.schema.createTable('properNouns', function(t) {
		t.increments('id').unsigned().primary();
		t.string('text').notNull();
		t.integer('count').notNull();
		t.dateTime('createdAt').notNull();
		t.dateTime('updatedAt').nullable();
		t.dateTime('deletedAt').nullable();
		t.integer('contentId')
			.unsigned()
			.nullable()
			.references('id')
			.inTable('content')
			.onDelete('CASCADE');
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTable('properNouns');
};
