let React = require('react');
let d3 = require('d3');
module.exports = React.createClass({
	componentDidMount: function() {
		console.log('ForceLayout componentDidMount');
		let width = 800;
		let height = 800;

		let color = d3.scale.category20();

		let zoom = d3.behavior.zoom()
		.scaleExtent([-10, 10])
		.on('zoom', this.zoomed);

		this.force = d3.layout.force()
		.size([width, height])
		.nodes(this.props.nodes)
		.charge(function(d){
			var charge = -4000;
			if (d.index === 0) charge = 10 * charge;
			return charge;
		})
		.links(this.props.links)
		.linkDistance(15);

		let svg = d3.select(this.refs.forceLayout).append('svg')
		.attr('width', width)
		.attr('height', height)
		.append('g')
		.call(zoom);

		let rect = svg.append('rect')
		.attr('width', width)
		.attr('height', height)
		.style('fill', 'none')
		.style('pointer-events', 'all');

		this.container = svg.append('g');

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
		.attr('class', 'node')
		.on('mouseover', function(a, b, c) {
			console.log(a.name);
		});

		this.force.on('end', () => {
			console.log('end');
			let minWeight = this.props.nodes.reduce((prev, current) => {
				return Math.min(prev, current.weight);
			}, 100);
			let maxWeight = this.props.nodes.reduce((prev, current) => {
				return Math.max(prev, current.weight);
			}, 0);
			console.log(minWeight, maxWeight);

			circles.attr('r', function(d) { return Math.max(5, (d.weight-minWeight+1)/(maxWeight+1)*15); })
				.attr('cx', function(d) { return d.x; })
				.attr('cy', function(d) { return d.y; });

			node.append('text')
				.attr('x', function(d) { return d.x; })
				.attr('y', function(d) { return d.y; })
				.attr('text-anchor', 'middle')
				.attr('dy', '1.25em')
				.text(function(d) { return d.name; })
				.style("fill", "#555").style("font-family", "Arial").style("font-size", 12);

			link.attr('x1', function(d) { return d.source.x; })
				.attr('y1', function(d) { return d.source.y; })
				.attr('x2', function(d) { return d.target.x; })
				.attr('y2', function(d) { return d.target.y; });

		});

		this.force.start();
	},
	componentWillReceiveProps: function(nextProps) {
		if(this.props.nodes.length !== nextProps.nodes.length) {
			this.force.nodes(nextProps.nodes);
			this.force.links(nextProps.links);
		}
	},
	zoomed: function() {
		this.container.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
	},
	dragstarted: function() {
		console.log('dragstarted');
		d3.event.sourceEvent.stopPropagation();
  		d3.select(this).classed('dragging', true);
	},
	dragged: function() {
		console.log('dragged');
		d3.select(this).attr('cx', d.x = d3.event.x).attr('cy', d.y = d3.event.y);
	},
	dragend: function() {
		console.log('dragend');
		d3.select(this).classed('dragging', false);
	},
	render: function() {
		return (
			<div className="twelve columns force-layout" ref="forceLayout">

			</div>
		);
	}
});