let React = require('react');
let TopicList = require('./TopicList');
let $ = require('jquery');
let io = require('socket.io-client');

module.exports = React.createClass({
	getInitialState: function() {
		return {
			topics: [],
			disabled: false,
			key: this.props.searchKey
		};
	},
	componentWillMount: function() {
		this.socket = io();
		this.socket.on('progress', (message) => {
			let topic = this.state.topics.find((topicInfo) => {
				return topicInfo.topic === message.data.title;
			});
			if(topic) {
				topic.progress = message.progress;
				this.setState({
					topics: this.state.topics
				});
			}
		});

		this.socket.on('complete', (message) => {
			let topic = this.state.topics.find((topicInfo) => {
				return topicInfo.topic === message.data.title;
			});
			if(topic) {
				topic.progress = 100;
				this.setState({
					topics: this.state.topics
				});
			}
		});
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
		this.state.topics.push({
			topic: topic,
			progress: 0
		});
		if(!this.state.key) {
			this.state.disabled = true;
			$.ajax({
				url: '/api/v1/search',
				type: 'post',
				contentType: 'application/json',
				data: JSON.stringify({
					topics: this.state.topics.map((info) => {
						return info.topic;
					}),
					name: this.state.topics[0].topic
				})
			})
			.then((search) => {
				this.setState({disabled: false, key: search.key});
				document.getElementById('topic').focus();
				this.props.router.navigate('search/'+search.key);
			});
		}
		else {
			$.ajax({
				url: '/api/v1/search/'+this.state.key+'/topic',
				type: 'post',
				contentType: 'application/json',
				data: JSON.stringify({
					topic: topic
				})
			});
		}
		this.setState(this.state);
	}
});