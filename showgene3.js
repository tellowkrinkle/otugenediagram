
// Setup AJAX
var xmlhttp;
var response;

if (window.XMLHttpRequest) {
	// code for IE7+, Firefox, Chrome, Opera, Safari
	xmlhttp = new XMLHttpRequest();
}
else if (window.ActiveXObject) {
	// code for IE6, IE5
	xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
}
else {
	alert("Your browser doesn't support AJAX.  Please upgrade to any recent version of IE, Firefox, Safari, Opera, or Chrome.");
}

xmlhttp.onreadystatechange = function() {
	if (xmlhttp.readyState === 4) {
		if (xmlhttp.responseText) {
			response = JSON.parse(xmlhttp.responseText);
			redisplay();
		}
	}
};

// Setup HTML stuff
var svg;
var svgLinkGroup;
var force;
window.onload = function() {
	// Setup SVG
	svg = d3.select("#graph");
	svgLinkGroup = svg.append("g")
		.attr("id", "graphLinks");
	// Setup force simulation
	force = d3.forceSimulation();
	// The clientWidth of an SVG is 0 in Firefox.  Use the div around it instead.
	var width = svg.node().parentElement.clientWidth;
	var height = svg.node().parentElement.clientHeight;
	force.force("center", d3.forceCenter(width / 2, height / 2));
	force.force("charge", d3.forceManyBody());
	force.force("link", d3.forceLink().strength(function(link) {
		return 1 / Math.min(link.target.links, link.source.links / 2, 4);
	}));

	updateSize(75);

	updateData();

};

function updateSize(size) {
	force.alpha(Math.max(0.1, force.alpha())).restart();
	force.force("charge").strength(-3 * size).distanceMax(4 * size);
	force.force("link").distance(size);
}

// Function to make sure that we have the data needed to display the requested results.
// Returns true if the required data is already cached and ready to be displayed, false if a request was made (but the current cached data isn't enough)
// If the function returns false, redisplay() will be run when the new data is received.
function updateData() {
	// TODO: Actually write this function!
	xmlhttp.open("GET", "queries.php?q=TP73,T,PLOD1,LRP8,MCTP2,CHIA,TPSG1,IMP3&s='anterior_nares','attached_keratinized_gingiva','buccal_mucosa','left_antecubital_fossa','hard_palate','left_retroauricular_crease','Palatine_Tonsils','right_retroauricular_crease','saliva','right_antecubital_fossa','stool','subgingival_plaque','Throat','supragingival_plaque','tongue_dorsum'&p=.0001&o=&sid=0.9060260635289157", true);
	xmlhttp.send();
	return false;
}

// Node class
function Node(name, type) {
	this.name = name;
	this.type = type;
	if (type === "gene") {
		this.circleSize = 7;
		this.color = "#779ECB";
	}
	else {
		this.circleSize = 5;
		this.color = "#ccc";
	}
	this.links = 0;
	this.connections = [];
	this.highlightedBy = [];
	this.hoverHighlight = null;
	this.startHover = function(hoveredNode) {
		if (hoveredNode === null) {
			hoveredNode = this;
		}
		this.hoverHighlight = hoveredNode;
	};
	this.endHover = function(hoveredNode) {
		if (hoveredNode === null || hoveredNode === this.hoverHighlight) {
			this.hoverHighlight = null;
		}
	};
	this.highlight = function(highlightedNode) {
		for (var i = 0; i < this.highlightedBy.length; i++) {
			if (highlightedNode === this.highlightedBy[i]) {
				return;
			}
		}
		this.highlightedBy.push(highlightedNode);
	};
	this.clearHighlight = function(highlightedNode) {
		for (var i = 0; i < this.highlightedBy.length; i++) {
			if (highlightedNode === this.highlightedBy[i]) {
				this.highlightedBy.splice(i, 1);
			}
		}
	};
	this.isSelfHighlighted = function() {
		for (var i = 0; i < this.highlightedBy.length; i++) {
			if (this === this.highlightedBy[i]) {
				return true;
			}
		}
		return false;
	};
	this.addConnection = function(connectedNode) {
		for (var i = 0; i < this.connections.length; i++) {
			if (connectedNode === this.connections[i]) {
				return;
			}
		}
		this.connections.push(connectedNode);
	};
	this.getClass = function() {
		if (this.hoverHighlight !== null) {
			return "node highlight hoverHighlight";
		}
		else if (this.highlightedBy.length > 0) {
			if (this.isSelfHighlighted()) {
				return "node highlight selfHighlight";
			}
			else {
				return "node highlight";
			}
		}
		else {
			return "node";
		}
	};
}

// Function to update the visual display using the currently cached data and the current filter options
function redisplay() {
	// Find Unique Nodes
	var bacteria = {}; // Stores all the bacteria nodes
	var genes = {}; // Stores all the gene nodes
	var nodes = []; // D3 readable storage of both types of node
	var linkDic = {}; // For removal of duplicate links
	var links = []; // D3 readable storage of links
	response.forEach(function(link) {
		if (genes[link.source] === undefined) {
			var gene = new Node(link.source, "gene");
			genes[link.source] = gene;
			nodes.push(gene);
		}

		if (bacteria[link.target] === undefined) {
			var bac = new Node(link.target, "bacteria");
			bacteria[link.target] = bac;
			nodes.push(bac);
		}

		// Remove duplicate links
		var linkString = link.source + "__" + link.target + "__" + link.type;
		if (linkDic[linkString] === undefined) {
			genes[link.source].links++;
			genes[link.source].addConnection(bacteria[link.target]);
			bacteria[link.target].links++;
			bacteria[link.target].addConnection(genes[link.source]);
			linkObject = {source: genes[link.source], target: bacteria[link.target], site: link.type};
			linkDic[linkString] = linkObject;
			links.push(linkObject);
		}
	});

	// Get SVG Width and height
	var width = svg.node().clientWidth;
	var height = svg.node().clientHeight;

	// Add nodes to force simulation
	force.nodes(nodes)
		.on("tick", tick);
	// Add links to force simulation
	force.force("link").links(links);

	// D3 joins info: bost.ocks.org/mike/join/
	// Setup display of nodes
	var svgNodes = svg.selectAll(".node")
		.data(nodes);
	// Remove old data by removing the group
	svgNodes.exit().remove();
	// Add new data by adding an SVG group...
	var svgNodeGroups = svgNodes.enter().append("g");
	// Setup hover
	svgNodeGroups.on("mouseover", function(node) {
		node.connections.forEach(function(connectedNode) {
			connectedNode.startHover(node);
		});
		node.startHover(node);
		svgNodeGroups.attr("class", function(node) { return node.getClass(); });
	});
	svgNodeGroups.on("mouseout", function(node) {
		node.connections.forEach(function(connectedNode) {
			connectedNode.endHover(node);
		});
		node.endHover(node);
		svgNodeGroups.attr("class", function(node) { return node.getClass(); });
	});
	svgNodeGroups.on("click", function(node) {
		if (node.isSelfHighlighted()) {
			node.connections.forEach(function(connectedNode) {
				connectedNode.clearHighlight(node);
			});
			node.clearHighlight(node);
		}
		else {
			node.connections.forEach(function(connectedNode) {
				connectedNode.highlight(node);
			});
			node.highlight(node);
		}
		svgNodeGroups.attr("class", function(node) { return node.getClass(); });
	});
	// Set the class, name, and allow dragging
	svgNodeGroups.attr("class", function(node) { return node.getClass(); })
		.attr("id", function(node) { return node.name; })
		.call(d3.drag()
			.on("start", dragstarted)
			.on("drag", dragged)
			.on("end", dragended)
		);
	// Add a circle to the group (to represent the node)
	svgNodeGroups.append("circle")
		.attr("r", function(node) { return node.circleSize; })
		.attr("fill", function(node) { return node.color; });
	// Add the label
	svgNodeGroups.append("text")
		.attr("x", 12)
		.attr("dy", ".35em")
		.attr("class", function(node) { return "node" + node.type; })
		.text(function(node) { return node.name; });

	// Setup display of links
	var svgLinks = svgLinkGroup.selectAll("line")
		.data(links);
	// Remove old links by removing the path
	svgLinks.exit().remove();
	// Add new data by adding a new path
	svgLinks.enter().append("line")
		.attr("class", function(link) { return "link " + link.site; });

	// Setup tick function
	function tick() {
		svgLinkGroup.selectAll("line")
			.attr("x1", function(link) { return link.source.x; })
			.attr("y1", function(link) { return link.source.y; })
			.attr("x2", function(link) { return link.target.x; })
			.attr("y2", function(link) { return link.target.y; });

		svg.selectAll(".node")
			.attr("transform", function(node) { 
				return "translate(" + node.x + "," + node.y + ")";
			});
	}

	// Functions for node dragging
	function dragstarted(node) {
		if (!d3.event.active) force.alphaTarget(0.3);
		node.fx = node.x;
		node.fy = node.y;
	}

	function dragged(node) {
		force.restart();
		node.fx = d3.event.x;
		node.fy = d3.event.y;
	}

	function dragended(node) {
		if (!d3.event.active) force.alphaTarget(0);
		node.fx = null;
		node.fy = null;
	}
}