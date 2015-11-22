let React = require('react');
let TopicList = require('./TopicList');
let $ = require('jquery');
module.exports = React.createClass({
	getInitialState: function() {
		return {
			topics: [],
			disabled: false,
			key: this.props.searchKey
		};
	},
	render: function() {
		return (
			<div>
				<nav></nav>
				<TopicList topics={this.state.topics} onAddTopic={this.addTopic} disabled={this.state.disabled} />
				<section className="output container">
				</section>
			</div>
		);
	},
	addTopic: function(topic) {
		this.state.topics.push(topic);
		if(!this.state.key) {
			this.state.disabled = true;
			$.post('/api/v1/search', {
				topics: this.state.topics,
				name: this.state.topics[0]
			}).then((search) => {
				this.setState({disabled: false, key: search.key});
				document.getElementById('topic').focus();
				this.props.router.navigate('search/'+search.key);
			});
		}
		else {
			$.post('/api/v1/search/'+this.state.key+'/topic', {
				topic: topic
			});
		}
		this.setState(this.state);
	}
});