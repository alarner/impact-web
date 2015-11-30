let React = require('react');
let d3 = require('d3');
module.exports = React.createClass({
	componentDidMount: function() {
		let width = 800;
		let height = 800;

		let color = d3.scale.category20();

		let zoom = d3.behavior.zoom()
		.scaleExtent([-10, 10])
		.on('zoom', this.zoomed);

		let force = d3.layout.force()
		.size([width, height])
		.nodes(this.props.nodes)
		.charge(function(d){
			var charge = -50;
			if (d.index === 0) charge = 10 * charge;
			return charge;
		})
		.links(this.props.links);

		// let drag = d3.behavior.drag()
		// .origin(function(d) { return d; })
		// .on('dragstart', this.dragstarted)
		// .on('drag', this.dragged)
		// .on('dragend', this.dragended);

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

		// force
		// 	.nodes(this.props.nodes)
		// 	.links(this.props.graph.links)
		// 	.start();

		// // force.linkDistance(width/2);

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
		.enter().append('circle')
		.style('fill', function(node) { return color(node.type); })
		.attr('class', 'node')
		.on('mouseover', function(a, b, c) {
			console.log(a.name);
		});

		// let label = node.append('text')
		// .attr('dy', '.35em')
		// .text(function(d) { return d.name; });
		// .on('mouseover', function() {
		// 	console.log(this);
		// })
		// .on('mouseout', mouseout);

		force.on('end', function() {
			console.log('end');
			// When this function executes, the force layout
			// calculations have concluded. The layout will
			// have set various properties in our nodes and
			// links objects that we can use to position them
			// within the SVG container.

			// First let's reposition the nodes. As the force
			// layout runs it updates the `x` and `y` properties
			// that define where the node should be centered.
			// To move the node, we set the appropriate SVG
			// attributes to their new values. We also have to
			// give the node a non-zero radius so that it's visible
			// in the container.

			node.attr('r', 5)
				.attr('cx', function(d) { return d.x; })
				.attr('cy', function(d) { return d.y; });

			// We also need to update positions of the links.
			// For those elements, the force layout sets the
			// `source` and `target` properties, specifying
			// `x` and `y` values in each case.

			link.attr('x1', function(d) { return d.source.x; })
				.attr('y1', function(d) { return d.source.y; })
				.attr('x2', function(d) { return d.target.x; })
				.attr('y2', function(d) { return d.target.y; });

			// label
			// 	.attr('x', function(d) { return d.x + 8; })
			// 	.attr('y', function(d) { return d.y; });

		});

		force.start();
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