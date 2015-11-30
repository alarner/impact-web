let React = require('react');
let TopicList = require('./TopicList');
let ForceLayout = require('./ForceLayout');
let $ = require('jquery');
let io = require('socket.io-client');

module.exports = React.createClass({
	getInitialState: function() {
		return {
			topics: [],
			disabled: false,
			data: false
		};
	},
	componentWillMount: function() {
		this.socket = io();
		if(this.props.searchKey) {
			$.get('/api/v1/search/'+this.props.searchKey)
			.then((result) => {
				result.topics.forEach((topic) => {
					topic.progress = 100;
				});
				this.setState({
					topics: result.topics
				});
			});
			$.get('/api/v1/force-layout/'+this.props.searchKey)
			.then((result) => {
				this.setState({data: result});
			});
		}
		this.socket.on('progress', (message) => {
			let topic = this.state.topics.find((topicInfo) => {
				return topicInfo.name === message.data.title;
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
				return topicInfo.name === message.data.title;
			});
			if(topic) {
				topic.progress = 100;
				this.setState({
					topics: this.state.topics
				});
			}
			$.get('/api/v1/force-layout/'+this.props.searchKey)
			.then((result) => {
				this.setState({data: result});
			});
		});

		this.links = [
			{ source: 0, target: 1 }
		];
		this.nodes = [
			{ name: 'red' },
			{ name: 'blue' }
		];
	},
	render: function() {
		return (
			<div>
				<nav></nav>
				<TopicList topics={this.state.topics} onAddTopic={this.addTopic} disabled={this.state.disabled} />
				<section className="output container">
					{this.state.data ? <ForceLayout nodes={this.state.data.nodes} links={this.state.data.links} /> : null }
				</section>
			</div>
		);
	},
	addTopic: function(name) {
		let topic = this.state.topics.find((topicInfo) => {
			return topicInfo.name === name;
		});
		if(topic) {
			return;
		}
		this.state.topics.push({
			name: name,
			progress: 0
		});
		if(!this.props.searchKey) {
			this.state.disabled = true;
			$.ajax({
				url: '/api/v1/search',
				type: 'post',
				contentType: 'application/json',
				data: JSON.stringify({
					topics: this.state.topics.map((info) => {
						return info.name;
					}),
					name: this.state.topics[0].name
				})
			})
			.then((search) => {
				this.setState({disabled: false});
				document.getElementById('topic').focus();
				this.props.router.navigate('search/'+search.key, {trigger: true});
			});
		}
		else {
			$.ajax({
				url: '/api/v1/search/'+this.props.searchKey+'/topic',
				type: 'post',
				contentType: 'application/json',
				data: JSON.stringify({
					topic: name
				})
			});
		}
		this.setState(this.state);
	}
});