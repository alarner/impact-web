let React = require('react');
let ReactDOM = require('react-dom');
let App = require('./components/App');
let Backbone = require('backbone');

let Router = Backbone.Router.extend({
	routes: {
		'': 'search',
		'search/:key': 'search'
	},
	search: function(key) {
		ReactDOM.render(
			<App router={this} searchKey={key} />,
			document.getElementById('app')
		);
	}
});
let r = new Router();
Backbone.history.start();