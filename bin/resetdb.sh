#!/bin/bash
dropdb test
createdb test
knex migrate:latest