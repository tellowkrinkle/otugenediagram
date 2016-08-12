// Setup HTML stuff
var svg;
var svgLinkGroup;
var force;
var currentSimOtus = {};
var currentSimGenes = {};
var allLinks = {};
var allOtus = {};
var allGenes = {};
var centerNode = {}; // An undisplayed node used for the "compact" force
var genesSearched = [];
var otusSearched = [];
var searchableGenes = [];
var searchableOtus = [];
var frozen = false;
var forceNames = ["charge", "link", "compact"];
var centerForce;
var forceStrengths = {};
var displayedNodes = [];
var hiddenNodes = [];
window.onload = function() {
	loadSearchables();

	// Setup SVG
	svg = d3.select("#graph");
	svgLinkGroup = svg.append("g")
		.attr("id", "graphLinks");
	// Setup force simulation
	force = d3.forceSimulation();
	// The clientWidth of an SVG is 0 in Firefox.  Use the div around it instead.
	var width = svg.node().parentElement.clientWidth;
	var height = svg.node().parentElement.clientHeight;
	centerForce = d3.forceCenter(width / 2, height / 2);
	force.force("center", centerForce);
	force.force("charge", d3.forceManyBody());
	force.force("link", d3.forceLink().strength(function(link) {
		return 1 / Math.min(link.target.links, link.source.links / 2, 4);
	}));
	// Prevents connected components from flying away into space
	force.force("compact", d3.forceLink().strength(0.1).distance(0));

	if (width > 1000 && height > 1000) {
		document.getElementById("sizeInput").value = 125;
	}
	else if (width > 750 && height > 750) {
		document.getElementById("sizeInput").value = 100;
	}
	updateSize(document.getElementById("sizeInput").value);

	updateGenesSearched();

	// Setup interactibility on html elements
	// Setup size slider
	$("#sizeInput").on("input", function() {
		updateSize(this.value);
	});
	// Setup p-value slider
	$("#pValueInput").on("input", function() {
		document.getElementById("pValueDisplay").innerHTML = "10<sup> " + -1 * this.value + "</sup>";
		redisplay();
	});
	// Setup body site select all button
	$("#selectAllButton").on("click", function() {
		for (var siteName in bodySiteInfo) {
			bodySiteInfo[siteName].selected = true;
		}
		updateBodySiteButtonDisplay();
		redisplay();
	});
	// Setup body site select none button
	$("#selectNoneButton").on("click", function() {
		for (var siteName in bodySiteInfo) {
			bodySiteInfo[siteName].selected = false;
		}
		updateBodySiteButtonDisplay();
		redisplay();
	});

	function lockAutocomplete() {
		this.setAttribute("locked", "true");
	}
	function unlockAutocomplete() {
		this.setAttribute("locked", "false");
	}

	// Setup gene input
	$("#geneSearchInput").on("change", updateGenesSearched);
	$("#geneSearchInput").on("blur", updateGenesSearched);
	$("#geneSearchAutocomplete").on("mousedown", lockAutocomplete);
	$("#geneSearchAutocomplete").on("mouseup", unlockAutocomplete);
	$("#geneSearchInput").on("input", updateGeneAutocomplete);
	$("#geneSearchClearButton").on("click", function() {
		genesSearched = [];
		updateGenesSearchedList();
	});
	// Setup otu input
	$("#otuSearchAutocomplete").on("mouseover", lockAutocomplete);
	$("#otuSearchAutocomplete").on("mouseout", unlockAutocomplete);
	$("#otuSearchInput").on("change", updateOtusSearched);
	$("#otuSearchInput").on("blur", updateOtusSearched);
	$("#otuSearchInput").on("input", updateOtuAutocomplete);
	$("#otuSearchClearButton").on("click", function() {
		otusSearched = [];
		updateOtusSearchedList();
	});
	// Setup hidden node stuff
	$("#hideSearchAutocomplete").on("mouseover", lockAutocomplete);
	$("#hideSearchAutocomplete").on("mouseout", unlockAutocomplete);
	$("#hideInput").on("change", updateHiddenPoints);
	$("#hideInput").on("blur", updateHiddenPoints);
	$("#hideInput").on("input", updateHiddenAutocomplete);
	$("#hideSearchClearButton").on("click", function() {
		hiddenNodes = [];
		updateHiddenPointsList();
	});
	// Setup new data button
	$("#newDataButton").on("click", function() {
		if (this.className !== "button half selected") {
			this.className = "button half selected";
			document.getElementById("oldDataButton").className = "button half";
			loadSearchables();
			updateData();
		}
	});
	// Setup old data button
	$("#oldDataButton").on("click", function() {
		if (this.className !== "button half selected") {
			this.className = "button half selected";
			document.getElementById("newDataButton").className = "button half";
			loadSearchables();
			updateData();
		}
	});
	// Setup the hide/show sidebar button
	$("#sidebarHideShow").on("click", function() {
		if ($("#wrapper").hasClass("toggled")) {
			$("#wrapper").removeClass("toggled");
			$("#sidebarHideShowAnimate").attr("from", "M4 4 L11 20 L4 36").attr("to", "M11 4 L4 20 L11 36").get()[0].beginElement();
			$("#sidebarHideShowAltAnimate").attr("from", "M11 4 L4 20 L11 36").attr("to", "M4 4 L11 20 L4 36").get()[0].beginElement();
			setTimeout(updateCenter, 500);
		}
		else {
			$("#wrapper").addClass("toggled");
			$("#sidebarHideShowAnimate").attr("from", "M11 4 L4 20 L11 36").attr("to", "M4 4 L11 20 L4 36").get()[0].beginElement();
			$("#sidebarHideShowAltAnimate").attr("from", "M4 4 L11 20 L4 36").attr("to", "M11 4 L4 20 L11 36").get()[0].beginElement();
			setTimeout(updateCenter, 500);
		}
	});
	// Setup freeze button
	$("#freezeButton").on("click", toggleFreeze);
	// Setup save button
	$("#saveButton").on("click", saveGraph);
	// Setup examples
	$(".geneExample").on("click", function() {
		var exampleGenes = this.getAttribute("example").split(",").map(function(x) { return x.trim(); });
		genesSearched = exampleGenes;
		updateGenesSearchedList();
	});
	// Setup window resizing
	window.onresize = updateCenter;

	// Sometimes this runs before the sidebar loads and resizes the SVG
	setTimeout(updateCenter, 1000);
};

function addToArrayIfUnique(array, item) {
	if (array.indexOf(item) === -1) {
		array.push(item);
	}
}

// Body Site class
function BodySite(name, color) {
	this.name = name;
	this.color = color;
	this.selected = true;
	// For sorting
	this.compareTo = function(otherSite) {
		if (this.name > otherSite.name) {
			return 1;
		}
		else if (this.name < otherSite.name) {
			return -1;
		}
		else {
			return 0;
		}
	};
	// Get the string for the corresponding button's class
	this.getClassString = function() {
		if (this.selected) {
			return "button selected";
		}
		else {
			return "button";
		}
	};
}

// Info for displaying body sites
var bodySiteInfo = {
	"anterior_nares": new BodySite("Anterior Nares", "71c9AC"),
	"attached_keratinized_gingiva": new BodySite("Attached Keratinized Gingiva", "FE8D5C"),
	"buccal_mucosa": new BodySite("Buccal Mucosa", "8C9FCD"),
	"hard_palate": new BodySite("Hard Palate", "F5C9E4"),
	"left_antecubital_fossa": new BodySite("Left Antecubital Fossa", "A5DA4A"),
	"left_retroauricular_crease": new BodySite("Left Retroauricular Crease", "E6C591"),
	"palatine_tonsils": new BodySite("Palatine Tonsils", "B3B3B3"),
	"right_antecubital_fossa": new BodySite("Right Antecubital Fossa", "A5CEE4"),
	"right_retroauricular_crease": new BodySite("Right Retroauricular Crease", "B1E086"),
	"saliva": new BodySite("Saliva", "F681C2"),
	"stool": new BodySite("Stool", "FEC068"),
	"subgingival_plaque": new BodySite("Subgingival Plaque", "CAB1D7"),
	"supragingival_plaque": new BodySite("Supragingival Plaque", "B3591F"),
	"throat": new BodySite("Throat", "BA55D3"),
	"tongue_dorsum": new BodySite("Tongue Dorsum", "1F792A"),
	"other": new BodySite("Other", "000000")
};

// Setup AJAX
var linkXmlHttp, searchablesXmlHttp;
var response;

if (window.XMLHttpRequest) {
	// code for IE7+, Firefox, Chrome, Opera, Safari
	linkXmlHttp = new XMLHttpRequest();
	searchablesXmlHttp = new XMLHttpRequest();
}
else if (window.ActiveXObject) {
	// code for IE6, IE5
	linkXmlHttp = new ActiveXObject("Microsoft.linkXmlHttp");
	searchablesXmlHttp = new ActiveXObject("Microsoft.linkXmlHttp");
}
else {
	alert("Your browser doesn't support AJAX.  Please upgrade to any recent version of IE, Firefox, Safari, Opera, or Chrome.");
}

linkXmlHttp.onreadystatechange = function() {
	if (linkXmlHttp.readyState === 4) {
		if (linkXmlHttp.responseText) {
			parseLinkResponse(linkXmlHttp.responseText);
			redisplay();
			document.getElementById("loadIndicator").style.display = "none";
		}
	}
};

searchablesXmlHttp.onreadystatechange = function() {
	if (searchablesXmlHttp.readyState === 4) {
		if (searchablesXmlHttp.responseText) {
			parseSearchables(searchablesXmlHttp.responseText);
		}
	}
};

function parseLinkResponse(responseText) {
	response = JSON.parse(responseText).map(function(link) {
		return {source: link[0], target: link[1], site: link[2], pValue: link[3]};
	});
	var oldGenes = allGenes;
	allGenes = {};
	var oldOtus = allOtus;
	allOtus = {};
	var oldLinks = allLinks;
	allLinks = {};
	response.forEach(function(link) {
		if (allGenes[link.source] === undefined) {
			if (oldGenes[link.source] === undefined) {
				allGenes[link.source] = new Node(link.source, "gene");
			}
			else {
				allGenes[link.source] = oldGenes[link.source];
			}
		}

		if (allOtus[link.target] === undefined) {
			if (oldOtus[link.target] === undefined) {
				allOtus[link.target] = new Node(link.target, "otu");
			}
			else {
				allOtus[link.target] = oldOtus[link.target];
			}
		}

		// Remove duplicate links
		var linkString = getLinkString(link);
		if (allLinks[linkString] === undefined) {
			if (oldLinks[linkString] === undefined) {
				allLinks[linkString] = {id: "link_" + linkString, source: allGenes[link.source], target: allOtus[link.target], site: link.site};
			}
			else {
				allLinks[linkString] = oldLinks[linkString];
			}
		}
	});
}

function loadSearchables() {
	var queryURL = "getoptions.php";
	if (document.getElementById("newDataButton").className === "button half selected") {
		queryURL += "?table=new";
	}
	searchablesXmlHttp.open("GET", queryURL, true);
	searchablesXmlHttp.send();
}

function parseSearchables(responseText) {
	searchableGenes = [];
	searchableOtus = [];
	var searchables = JSON.parse(responseText);
	searchableGenes = searchables.genes.sort();
	searchableOtus = searchables.microbes.sort();
}

function getLinkString(link) {
	return link.source + "__" + link.target + "__" + link.site.toLowerCase();
}

function updateBodySiteButtonDisplay(sites) {
	if (sites === undefined) {
		sites = d3.select("#bodySiteButtons").selectAll(".button");
	}
	sites.attr("class", function(site) { return site.getClassString(); });
	sites.style("color", function(site) {
		if (site.selected) {
			return "#" + site.color;
		}
		else {
			return "inherit";
		}
	});
}

function updateGenesSearched() {
	var searchBox = document.getElementById("geneSearchInput");
	var d3Array = genesSearched;
	var buttonContainer = d3.select("#genesSearched");
	var listUpdateFunction = updateGenesSearchedList;
	var dataUpdateFunction = updateData;
	var autocompleteList = document.getElementById("geneSearchAutocomplete");
	updateSearched(searchBox, d3Array, buttonContainer, listUpdateFunction, dataUpdateFunction, autocompleteList);
}

function updateOtusSearched() {
	var searchBox = document.getElementById("otuSearchInput");
	var d3Array = otusSearched;
	var buttonContainer = d3.select("#otusSearched");
	var listUpdateFunction = updateOtusSearchedList;
	var dataUpdateFunction = updateData;
	var autocompleteList = document.getElementById("otuSearchAutocomplete");
	updateSearched(searchBox, d3Array, buttonContainer, listUpdateFunction, dataUpdateFunction, autocompleteList);
}

function updateHiddenPoints() {
	var searchBox = document.getElementById("hideInput");
	var d3Array = hiddenNodes;
	var buttonContainer = d3.select("#currentlyHidden");
	var listUpdateFunction = updateHiddenPointsList;
	var dataUpdateFunction = redisplay;
	var autocompleteList = document.getElementById("hideSearchAutocomplete");
	updateSearched(searchBox, d3Array, buttonContainer, listUpdateFunction, dataUpdateFunction, autocompleteList);
}

function updateSearched(searchBox, d3Array, buttonContainer, listUpdateFunction, dataUpdateFunction,  autocompleteList) {
	// Add any new genes
	var newThingsToSearch = searchBox.value.split(",").map(function(x) { return x.trim(); });
	// Don't input if they clicked an autocomplete (Not the best way of doing it, but I've got nothing better)
	if (autocompleteList.getAttribute("locked") === "true") {
		return;
	}

	newThingsToSearch.forEach(function(gene) {
		if (gene === "") {
			return;
		}
		for (var i = 0; i < d3Array.length; i++) {
			if (gene === d3Array[i]) {
				return;
			}
		}
		d3Array.push(gene);
	});
	searchBox.value = "";
	autocompleteList.style.visibility = "hidden";
	updateSearchedList(d3Array, buttonContainer, listUpdateFunction, dataUpdateFunction);
}

function updateGenesSearchedList() {
	var d3Array = genesSearched;
	var buttonContainer = d3.select("#genesSearched");
	var listUpdateFunction = updateGenesSearchedList;
	var dataUpdateFunction = updateData;
	updateSearchedList(d3Array, buttonContainer, listUpdateFunction, dataUpdateFunction);
}

function updateOtusSearchedList() {
	var d3Array = otusSearched;
	var buttonContainer = d3.select("#otusSearched");
	var listUpdateFunction = updateOtusSearchedList;
	var dataUpdateFunction = updateData;
	updateSearchedList(d3Array, buttonContainer, listUpdateFunction, dataUpdateFunction);
}

function updateHiddenPointsList() {
	var d3Array = hiddenNodes;
	var buttonContainer = d3.select("#currentlyHidden");
	var listUpdateFunction = updateHiddenPointsList;
	var dataUpdateFunction = redisplay;
	updateSearchedList(d3Array, buttonContainer, listUpdateFunction, dataUpdateFunction);
}

function updateSearchedList(d3Array, buttonContainer, listUpdateFunction, dataUpdateFunction) {
	var thingsSearchedDisplay = buttonContainer.selectAll(".button").data(d3Array, function(gene) { return gene; });
	thingsSearchedDisplay.exit().remove();
	thingsSearchedDisplay.enter().append("div")
		.attr("class", "button selected")
		.text(function(gene) { return gene; })
		.on("click", function(gene) {
			for (var i = 0; i < d3Array.length; i++) {
				if (gene === d3Array[i]) {
					d3Array.splice(i, 1);
					break;
				}
			}
			listUpdateFunction();
		});
	dataUpdateFunction();
}

function updateGeneAutocomplete() {
	var inputBox = document.getElementById("geneSearchInput");
	var autocompleteBox = document.getElementById("geneSearchAutocomplete");
	var itemsSearched = genesSearched;
	var searchables = searchableGenes;
	var updateFunction = updateGenesSearchedList;
	updateAutocomplete(inputBox, autocompleteBox, itemsSearched, searchables, updateFunction);
}

function updateOtuAutocomplete() {
	var inputBox = document.getElementById("otuSearchInput");
	var autocompleteBox = document.getElementById("otuSearchAutocomplete");
	var itemsSearched = otusSearched;
	var searchables = searchableOtus;
	var updateFunction = updateOtusSearchedList;
	updateAutocomplete(inputBox, autocompleteBox, itemsSearched, searchables, updateFunction);
}

function updateHiddenAutocomplete() {
	var inputBox = document.getElementById("hideInput");
	var autocompleteBox = document.getElementById("hideSearchAutocomplete");
	var itemsSearched = hiddenNodes;
	var searchables = displayedNodes;
	var updateFunction = updateHiddenPointsList;
	updateAutocomplete(inputBox, autocompleteBox, itemsSearched, searchables, updateFunction);
}

function updateAutocomplete(inputBox, autocompleteBox, itemsSearched, searchables, updateFunction) {
	var currentInput = inputBox.value.toLowerCase();
	if (currentInput.length > 0) {
		autocompleteBox.style.visibility = "visible";
		var lowerCaseSearched = itemsSearched.map(function(x) { return x.toLowerCase(); });
		var matchedItems = searchables.filter(function(name) {
			name = name.toLowerCase();
			if (name.indexOf(currentInput) != -1) {
				if (lowerCaseSearched.indexOf(name) != -1) {
					return false;
				}
				return true;
			}
			return false;
		});
		var autocompleteList = d3.select(autocompleteBox).selectAll(".button").data(matchedItems, function(name) { return name; });
		autocompleteList.exit().remove();
		autocompleteList.enter().append("div")
			.attr("class", "button nontoggle")
			.text(function(name) { return name; })
			.on("click", function(name) {
				itemsSearched.push(name);
				updateFunction();
				autocompleteBox.style.visibility = "hidden";
				inputBox.value = "";
			});
	}
	else {
		autocompleteBox.style.visibility = "hidden";
	}
}

function updateSize(size) {
	unfreezeGraph();
	force.alpha(Math.max(0.1, force.alpha())).restart();
	force.force("charge").strength(-3 * size).distanceMax(4 * size);
	force.force("link").distance(size);
	force.force("compact").strength(1/Math.sqrt(size));
}

function updateCenter() {
	force.alpha(Math.max(0.1, force.alpha())).restart();
	var width = svg.node().parentElement.clientWidth;
	var height = svg.node().parentElement.clientHeight;
	centerForce.x(width / 2);
	centerForce.y(height / 2);
}

// Send a request for new data based on the current gene selection
function updateData() {
	var queryURL = "getgene.php?genes=" + genesSearched.join(",");
	queryURL += "&otus=" + otusSearched.join(",");
	if (document.getElementById("newDataButton").className === "button half selected") {
		queryURL += "&table=new";
	}
	queryURL += "&uniqueID=" + Math.random(); // Prevent getting cached data

	linkXmlHttp.open("GET", queryURL, true);
	linkXmlHttp.send();
	document.getElementById("loadIndicator").style.display = "initial";
}

function freezeGraph() {
	if (frozen === false) {
		frozen = true;
		document.getElementById("freezeButton").innerHTML = "Unfreeze Graph";
		forceNames.forEach(function(forceName) {
			forceStrengths[forceName] = force.force(forceName).strength();
			force.force(forceName).strength(0);
		});
		force.force("center", null);
	}
}

function unfreezeGraph() {
	if (frozen === true) {
		force.alpha(Math.max(0.1, force.alpha())).restart();
		frozen = false;
		document.getElementById("freezeButton").innerHTML = "Freeze Graph";
		forceNames.forEach(function(forceName) {
			force.force(forceName).strength(forceStrengths[forceName]);
		});
		force.force("center", centerForce);
	}
}

function toggleFreeze() {
	if (frozen) {
		unfreezeGraph();
	}
	else {
		freezeGraph();
	}
}

function saveGraph() {
	var width = svg.node().parentElement.clientWidth;
	var height = svg.node().parentElement.clientHeight;
	var image = "<svg width=\"" + width + "px\" height=\"" + height + "px\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\">" + svg.node().innerHTML + "</svg>";
	var imageURL = "data:image/svg+xml;base64," + btoa(image);
	window.open(imageURL);
}

// Node class
function Node(name, type) {
	this.name = name;
	this.type = type;
	if (type === "gene") {
		this.id = "gene_" + name;
		this.circleSize = 7;
		this.color = "#779ECB";
	}
	else {
		this.id = "otu_" + name;
		this.circleSize = 5;
		this.color = "#ccc";
	}
	this.links = 0; // Number of links
	this.connections = []; // All the nodes linked to this one
	this.highlightedBy = []; // All the connected nodes that have been clicked (and should therefore be highlighting this node)
	this.hoverHighlight = null; // If this node is being highlighted because a connected node (or this node) is under the mouse, store that node here

	// Clears all info about connections and links
	this.clearLinkInfo = function() {
		this.links = 0;
		this.connections = [];
		this.highlightedBy = [];
		this.hoverHighlight = null;
	};

	// Adds a node to the connections list if it's not already there
	this.addConnection = function(connectedNode) {
		for (var i = 0; i < this.connections.length; i++) {
			if (connectedNode === this.connections[i]) {
				return;
			}
		}
		this.connections.push(connectedNode);
	};
	// Sets the hoverHighlight to the given node
	this.startHover = function(hoveredNode) {
		this.hoverHighlight = hoveredNode;
	};
	// If the passed node is the one that started hover highlighting (or the passed node is null), will set hoverHighlight to null
	this.endHover = function(hoveredNode) {
		if (hoveredNode === null || hoveredNode === this.hoverHighlight) {
			this.hoverHighlight = null;
		}
	};
	// Adds a new node to the highlightedBy list if it's not already there
	this.highlight = function(highlightedNode) {
		for (var i = 0; i < this.highlightedBy.length; i++) {
			if (highlightedNode === this.highlightedBy[i]) {
				return;
			}
		}
		this.highlightedBy.push(highlightedNode);
	};
	// Removes a node from the highlightedBy list if it's there
	this.clearHighlight = function(highlightedNode) {
		for (var i = 0; i < this.highlightedBy.length; i++) {
			if (highlightedNode === this.highlightedBy[i]) {
				this.highlightedBy.splice(i, 1);
			}
		}
	};
	// Returns true if this node is highlighting itself (is in its own highlightedBy list)
	this.isSelfHighlighted = function() {
		for (var i = 0; i < this.highlightedBy.length; i++) {
			if (this === this.highlightedBy[i]) {
				return true;
			}
		}
		return false;
	};
	// Returns the string that represents the node's current classes.
	// Use D3 with this function to update classes if you want any highlighting changes to take effect
	this.getClassString = function() {
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
	unfreezeGraph();
	// Find Unique Nodes
	var otus = {}; // Stores all the otu nodes
	var genes = {}; // Stores all the gene nodes
	var nodes = []; // D3 readable storage of both types of node
	var linkDic = {}; // For removal of duplicate links
	var bodySitesDic = {}; // Body sites available
	var links = []; // D3 readable storage of links
	var bodySites = []; // D3 readable storage of body sites

	// Get a list of the body sites that came up in the search
	response.forEach(function(link) {
		var siteName = link.site.toLowerCase();
		if (bodySiteInfo[siteName] === undefined) {
			siteName = "other";
		}
		if (bodySitesDic[siteName] === undefined) {
			var bodySite = bodySiteInfo[siteName];
			bodySitesDic[siteName] = bodySite;
			bodySites.push(bodySite);
		}
	});
	bodySites.sort(function(site1, site2) { return site1.compareTo(site2); });

	if (bodySites.length > 0) {
		document.getElementById("bodySiteSelection").style.display = "initial";
	}
	else {
		document.getElementById("bodySiteSelection").style.display = "none";
	}

	// Setup body site chooser
	var siteListDisplay = d3.select("#bodySiteButtons").selectAll(".button").data(bodySites, function(site) { return site.name; });

	siteListDisplay.exit().remove();
	siteListDisplay.enter().append("div")
		.attr("class", function(site) { return site.getClassString(); })
		.text(function(site) { return site.name; })
		.on("click", function(site) {
			site.selected = !site.selected;
			updateBodySiteButtonDisplay(d3.select(this));
			redisplay();
		});

	updateBodySiteButtonDisplay();

	var pValueCutoff = Math.pow(10, -1 * document.getElementById("pValueInput").value);

	var lcHiddenNodes = hiddenNodes.map(function(x) { return x.toLowerCase(); });

	var filteredResponses = response.filter(function(link) {
		var bodySite = bodySiteInfo[link.site.toLowerCase()];
		if (bodySite === undefined) {
			bodySite = bodySiteInfo.other;
		}
		if (bodySite.selected) {
			if (link.pValue <= pValueCutoff) {
				return lcHiddenNodes.indexOf(link.source.toLowerCase()) === -1 && lcHiddenNodes.indexOf(link.target.toLowerCase()) === -1;
			}
			return false;
		}
		else {
			return false;
		}
	});

	filteredResponses.forEach(function(link) {
		if (genes[link.source] === undefined) {
			var gene = allGenes[link.source];
			gene.clearLinkInfo();
			genes[link.source] = gene;
			nodes.push(gene);
		}

		if (otus[link.target] === undefined) {
			var otu = allOtus[link.target];
			otu.clearLinkInfo();
			otus[link.target] = otu;
			nodes.push(otu);
		}

		// Remove duplicate links
		var linkString = getLinkString(link);
		if (linkDic[linkString] === undefined) {
			genes[link.source].links++;
			genes[link.source].addConnection(otus[link.target]);
			otus[link.target].links++;
			otus[link.target].addConnection(genes[link.source]);
			linkObject = allLinks[linkString];
			linkDic[linkString] = linkObject;
			links.push(linkObject);
		}
	});

	displayedNodes = nodes.map(function(node) { return node.name; });

	currentSimGenes = genes;
	currentSimOtus = otus;

	// Restart the simulation
	force.alpha(1).restart();

	updateGraphNodes(nodes);
	updateGraphLinks(links);

	// Calculate which nodes to pull together
	var compactForceLinks = [];
	var numGenes = 0, numOtus = 0;
	nodes.forEach(function(node) {
		if (node.type === "gene") {
			numGenes++;
		}
		else {
			numOtus++;
		}
	});
	var lesserType = "gene";
	if (numOtus < numGenes) {
		lesserType = "otu";
	}
	nodes.forEach(function(node) {
		if (node.type == lesserType) {
			compactForceLinks.push({source: centerNode, target: node});
		}
	});

	force.force("compact").links(compactForceLinks);
}

function updateGraphLinks(links) {
	// Add links to force simulation
	force.force("link").links(links);

	// Setup display of links
	var svgLinks = svgLinkGroup.selectAll("line")
		.data(links, function(link) { return link.id; });
	// Remove old links by removing the path
	svgLinks.exit().remove();
	// Add new data by adding a new path
	svgLinks.enter().append("line")
		.attr("class", function(link) { return "link " + link.site.toLowerCase(); })
		.style("stroke", function(link) {
			var bodySite = bodySiteInfo[link.site.toLowerCase()];
			if (bodySite === undefined) {
				bodySite = bodySiteInfo.other;
			}
			return "#" + bodySite.color;
		});
}

function updateGraphNodes(nodes) {
	// Add nodes to force simulation
	var forceGraphNodes = nodes.slice();
	forceGraphNodes.push(centerNode);
	force.nodes(forceGraphNodes)
		.on("tick", tick);

	// D3 joins info: bost.ocks.org/mike/join/
	// Setup display of nodes
	var svgNodes = svg.selectAll(".node")
		.data(nodes, function(node) { return node.id; });
	// Remove old data by removing the group
	svgNodes.exit().remove();
	// Add new data by adding an SVG group...
	var svgNodeGroups = svgNodes.enter().append("g");
	// Function to update classes after highlighting changes
	function updateNodeStyling() {
		svg.selectAll(".node").attr("class", function(node) { return node.getClassString(); });
	}
	// Setup hover
	svgNodeGroups.on("mouseover", function(node) {
		node.connections.forEach(function(connectedNode) {
			connectedNode.startHover(node);
		});
		node.startHover(node);
		updateNodeStyling();
	});
	svgNodeGroups.on("mouseout", function(node) {
		node.connections.forEach(function(connectedNode) {
			connectedNode.endHover(node);
		});
		node.endHover(node);
		updateNodeStyling();
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
		updateNodeStyling();
	});
	// Set the class, name, and allow dragging
	svgNodeGroups.attr("class", function(node) { return node.getClassString(); })
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