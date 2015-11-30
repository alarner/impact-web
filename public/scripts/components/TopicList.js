let React = require('react');
module.exports = React.createClass({
	render: function() {
		let empty = this.props.topics.length === 0;
		let topics = this.props.topics.map((topicInfo) => {
			let width = Math.floor(topicInfo.progress);
			return (
				<li key={topicInfo.name}>
					<div className="progress" style={{width: width+'%'}} />
					<div className="topic">{topicInfo.name}</div>
				</li>
			);
		});
		return (
			<section className={'topic-list'+ (empty ? ' empty' : '')}>
				<input
					type="text"
					ref="topic"
					id="topic"
					onKeyUp={this.keyUp}
					placeholder="Enter a Topic"
					disabled={this.props.disabled}
					autofocus
				/>
				<ul>
					{topics}
				</ul>
			</section>
		);
	},

	keyUp: function(e) {
		if(e.which === 13) {
			if(this.props.topics.indexOf(this.refs.topic.value) === -1) {
				if(this.props.onAddTopic) {
					this.props.onAddTopic(this.refs.topic.value);
				}
				this.refs.topic.value = '';
			}
		}
	}
});