// --------------------------------------------------------------
// Hande diaplying of exon information in the table
// --------------------------------------------------------------

var xmlhttp;

// show information for the gene name passed as parameter, or for the current string in 'gene'


function showGene3(str) {
	str = document.getElementById('gene2').value;
	if (str == "") {
		alert("Please enter a gene to search");
		return;
	}
	if (str.length >= 90) {
		alert("You are attempting to search too many genes")
		return;
	}
	var sub = $('input:checkbox[name="subsite2[]"]:checked').map(function () {
		return this.value;
	}).get();
	if (sub == "") {
		alert("Please select at least one subsite to search")
		return;
	}
	pval = document.getElementById('P-value2').value;
	bac = document.getElementById('otu').value;
	console.log(bac);
	document.getElementById('chart').style.display = 'inline';
	document.getElementById('forcecontain').style.display = 'block';
	document.getElementById('otusearch').style.display = 'inline';
	document.getElementById('stop').style.display = 'inline';
	xmlhttp=GetXmlHttpObject();
	if (xmlhttp==null) {
		alert ("Browser does not support HTTP Request");
		return;
	}
	var url="queries.php";
	url=url+"?q="+str + "&s="+ sub + "&p=" + pval + "&o=" + bac;
	if (document.getElementById("datasetNew").checked) {
		url += "&table=new";
	}
	url=url+"&sid="+Math.random();
	console.log("URL: " + url);
	xmlhttp.onreadystatechange=stateChanged;
	xmlhttp.open("GET",url,true);
	xmlhttp.send(null);
//	document.getElementById('autosuggest_results').style.display = "none";
//	alert(str);
}

function geneKeyUp2(e) {
//	alert("enter1");
	var characterCode //literal character code will be stored in this variable
	if(e && e.which){ //if which property of event object is supported (NN4)
		e = e
		characterCode = e.which //character code is contained in NN4's which property
	}
	else{
		e = event
		characterCode = e.keyCode //character code is contained in IE's keyCode property
	}

	if(characterCode == 13){ //if generated character code is equal to ascii 13 (if enter key)
		showGene3('');
		return false;
	}
}
function stateChanged() {
	if (xmlhttp.readyState==4) {
		//	document.getElementById("txtHint").innerHTML=xmlhttp.responseText;
		console.log(xmlhttp.status)
		console.log(xmlhttp.responseText)
		var jsonencoded = JSON.parse(xmlhttp.responseText);	
		if (jsonencoded == "") {
			alert("No results were found for these parameters");
			return;
		}
		$(".link").remove();
		$(".node").remove();
		document.getElementById('otu').value = "";
		graph(jsonencoded);
		console.log('working')
	}
}

function selectall() {
	document.getElementById("'anterior_nares'").checked = true;
	document.getElementById("'attached_keratinized_gingiva'").checked = true;
	document.getElementById("'buccal_mucosa'").checked = true;
	document.getElementById("'hard_palate'").checked = true;
	document.getElementById("'left_antecubital_fossa'").checked = true;
	document.getElementById("'left_retroauricular_crease'").checked = true;
	document.getElementById("'Palatine_Tonsils'").checked = true;
	document.getElementById("'right_retroauricular_crease'").checked = true;
	document.getElementById("'right_antecubital_fossa'").checked = true;
	document.getElementById("'saliva'").checked = true;
	document.getElementById("'stool'").checked = true;
	document.getElementById("'subgingival_plaque'").checked = true;
	document.getElementById("'supragingival_plaque'").checked = true;
	document.getElementById("'Throat'").checked = true;
	document.getElementById("'tongue_dorsum'").checked = true;
}

function deselectall() {
	document.getElementById("'anterior_nares'").checked = false;
	document.getElementById("'attached_keratinized_gingiva'").checked = false;
	document.getElementById("'buccal_mucosa'").checked = false;
	document.getElementById("'hard_palate'").checked = false;
	document.getElementById("'left_antecubital_fossa'").checked = false;
	document.getElementById("'left_retroauricular_crease'").checked = false;
	document.getElementById("'Palatine_Tonsils'").checked = false;
	document.getElementById("'right_retroauricular_crease'").checked = false;
	document.getElementById("'right_antecubital_fossa'").checked = false;
	document.getElementById("'saliva'").checked = false;
	document.getElementById("'stool'").checked = false;
	document.getElementById("'subgingival_plaque'").checked = false;
	document.getElementById("'supragingival_plaque'").checked = false;
	document.getElementById("'Throat'").checked = false;
	document.getElementById("'tongue_dorsum'").checked = false;
}

function graph(links){
	/* var svg = d3.select("#salvation").append("svg").attr("width", 840).attr("height", 600); */
	var nodes = {};

	var svg = d3.select("#chart");

	// Compute the distinct nodes from the links.
	links.forEach(function(link) {
		link.source = nodes[link.source] || 
		(nodes[link.source] = {name: link.source, value: '7', color: '#779ECB', kind: 'gene' });
		link.target = nodes[link.target] || 
		(nodes[link.target] = {name: link.target, value: '5', color: '#ccc', kind: 'OTU'});
		link.value = +link.value;
	});
	var width = 940,
		height = 600;

	var force = self.force =  d3.layout.force()
		.nodes(d3.values(nodes))
		.links(links)
		.size([width, height])
		.linkDistance(75)
		.charge(-300)
		.on("tick", tick)
		.start();

	// add the links and the arrows
	var path = svg.append("svg:g").selectAll("path")
		.data(force.links())
		.enter().append("svg:path")
		.attr("class", function(d) { return "link " + d.type.toLowerCase(); })
		.attr("marker-end", function(d) { return "url(#" + d.type + ")"; });

	// define the nodes
	var node = svg.selectAll(".node")
		.data(force.nodes())
		.enter().append("g")
		.attr("class", "node")
		.on("dblclick", click)
		.attr("id", function(d) { return d.name; });
	node.call(force.drag);

	// add the nodes
	node.append("circle")
		.attr("r", function(d) {return d.value;})
		.attr("fill",function(d) {return d.color;})
		/* .attr("onclick", "circleclick()"); */


	// add the text 
	node.append("text")
		.attr("x", 12)
		.attr("dy", ".35em")
		.text(function(d) { return d.name; })
		.attr("class", function(d) {return "node" + d.kind;})


	// add the curvy lines
	function tick() {
		path.attr("d", function(d) {
			var dx = d.target.x - d.source.x,
				dy = d.target.y - d.source.y,
				dr = (2500);
			return "M" + 
				d.source.x + "," + 
				d.source.y + "A" + 
				dr + "," + dr + " 0 0,1 " + 
				d.target.x + "," + 
				d.target.y;
		});

		node
			.attr("transform", function(d) { 
				return "translate(" + d.x + "," + d.y + ")";
			});

	}
	d3.select("#stop").on("click", function(){
		force.stop();
	});

	d3.select("#save").on("click", function(){

		el = document.getElementById("overlay");
		el.style.visibility = (el.style.visibility == "visible") ? "hidden" : "visible";	
		jQuery('#buttons').html('');	
		var html = d3.select("svg")
			.attr("version", 1.1)
			.attr("xmlns", "http://www.w3.org/2000/svg")
			.node().parentNode.innerHTML;

		//console.log(html);
		var imgsrc = 'data:image/svg+xml;base64,'+ btoa(html);
		var img = '<h2>Image Preview</h2><br><br><img src="'+imgsrc+'">'; 
		d3.select("#svgdataurl")
			.html(img)



		d3.select("svg")
			.attr("version", 1.1)
			.attr("xmlns", "http://www.w3.org/2000/svg")
			.node().parentNode.innerHTML;
		d3.select("#buttons").append("a")
			.attr("title", "file.svg")
			.attr("href-lang", "image/svg+xml")
			.attr("href", "data:image/svg+xml;base64,\n"+btoa(html))
			.attr("download", "networkdiagram.svg")
			.html('<input type=button value="Download Static Image" /><br>');

		d3.select("#buttons").append("input")
			.attr("type", "button")
			.attr("value", "Exit Image Preview")
			.attr("id", "back");
				
		d3.select("#back").on("click", function(){
			document.getElementById("overlay").style.visibility = 'hidden';
		});

	});

	function click() {
		nodeName = this.id;
		console.log(nodeName);
		document.getElementById('otu').value= document.getElementById('otu').value + nodeName + ",";	
		d3.select(this).select("text").transition()
			.duration(750)
			.attr("x", 22)
			.style("stroke", "lightsteelblue")
		d3.select(this).select("circle").transition()
			.duration(750)
			.style("fill", "deeppink");
	} 

};





function GetXmlHttpObject() {
	if (window.XMLHttpRequest){
		// code for IE7+, Firefox, Chrome, Opera, Safari
		return new XMLHttpRequest();
	}
	if (window.ActiveXObject){
		// code for IE6, IE5
		return new ActiveXObject("Microsoft.XMLHTTP");
	}
	return null;
}


function fill(i) {
	document.getElementById('gene2').value = i;
	selectall();
	showGene3("");
//	alert('fill');
}




