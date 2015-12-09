let React = require('react');
let d3 = require('d3');
module.exports = React.createClass({
	getInitialState: function() {
		return {
			loading: false
		};
	},
	componentDidMount: function() {
		this.buildForceLayout();
	},
	componentWillReceiveProps: function(nextProps) {
		if(this.props.nodes.length !== nextProps.nodes.length) {
			this.force.nodes(nextProps.nodes);
			this.force.links(nextProps.links);
		}
	},
	buildForceLayout: function() {
		let width = 800;
		let height = 800;
		let color = d3.scale.category20();

		this.refs.forceLayout.innerHTML = '';

		this.zoom = d3.behavior.zoom()
		.scaleExtent([-10, 10])
		.on('zoom', this.zoomed);

		this.force = d3.layout.force()
		.size([width, height])
		.nodes(this.props.nodes)
		.charge(function(d){
			let charge = -4000;
			if (d.index === 0) charge = 10 * charge;
			return charge;
		})
		.links(this.props.links)
		.linkDistance(15);

		this.svg = d3.select(this.refs.forceLayout).append('svg')
		.attr('width', '100%')
		.attr('height', height)
		.append('g');

		let rect = this.svg.append('rect')
		.attr('width', width)
		.attr('height', height)
		.style('fill', 'none')
		.style('pointer-events', 'all');

		this.container = this.svg.append('g');

		let link = this.container.append('g')
		.attr('class', 'links')
		.selectAll('.link')
		.data(this.props.links)
		.enter()
		.append('line')
		.attr('class', 'link');

		let node = this.container.append('g')
		.attr('class', 'nodes')
		.selectAll('.node')
		.data(this.props.nodes)
		.enter();

		let circles = node.append('circle')
		.style('fill', function(node) { return color(node.type); })
		.attr('class', 'node');

		this.force.on('end', () => {
			this.setState({ loading: false });
			let minWeight = this.props.nodes.reduce((prev, current) => {
				return Math.min(prev, current.weight);
			}, 100);
			let maxWeight = this.props.nodes.reduce((prev, current) => {
				return Math.max(prev, current.weight);
			}, 0);

			this.svg.call(this.zoom);

			circles.attr('r', function(d) { return Math.max(5, (d.weight-minWeight+1)/(maxWeight+1)*15); })
				.attr('cx', function(d) { return d.x; })
				.attr('cy', function(d) { return d.y; });

			node.append('text')
				.attr('x', function(d) { return d.x; })
				.attr('y', function(d) { return d.y; })
				.attr('text-anchor', 'middle')
				.attr('dy', '1.25em')
				.text(function(d) { return d.name; })
				.style('fill', '#555').style('font-family', 'Arial').style('font-size', 12);

			link.attr('x1', function(d) { return d.source.x; })
				.attr('y1', function(d) { return d.source.y; })
				.attr('x2', function(d) { return d.target.x; })
				.attr('y2', function(d) { return d.target.y; });

			this.zoomFit();

		});

		this.setState({ loading: true });
		this.force.start();
	},
	zoomFit: function() {
		let bounds = this.container.node().getBBox();
		let fullWidth = this.force.size()[0];
		let fullHeight = this.force.size()[1];
		let width = bounds.width,
		    height = bounds.height;
		let midX = bounds.x + width / 2,
		    midY = bounds.y + height / 2;
		if (width == 0 || height == 0) return; // nothing to fit
		let scale = 0.85 / Math.max(width / fullWidth, height / fullHeight);
		let translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

		this.container
		    .transition()
		    .duration(0) // milliseconds
		    .call(this.zoom.translate(translate).scale(scale).event);
	},
	zoomed: function() {
		this.container.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
	},
	render: function() {
		return (
			<div>
				{this.state.loading ? <div>LOADING...</div> : null}
				<div className="twelve columns force-layout" ref="forceLayout" style={{ display: this.state.loading ? 'none' : 'block' }}></div>
			</div>
		);
	}
});