// --------------------------------------------------------------
// Hande diaplying of exon information in the table
// --------------------------------------------------------------

var xmlhttp;

// show information for the gene name passed as parameter, or for the current string in 'gene'
function showGene(str) {
	if(str == ""){
		str = document.getElementById('gene').value;
		sub = document.getElementById('subsite').value;	
		pval = document.getElementById('P-value').value;
		document.getElementById('gene2').value = str;
		document.getElementById('chart').style.display = 'inline';
		if(str == ""){
			return;
		}
	}
	xmlhttp=GetXmlHttpObject();
	if (xmlhttp==null) {
		alert ("Browser does not support HTTP Request");
		return;
	}
	var url="firsttryphp.php";
	url=url+"?q="+str + "&s="+ sub + "&p=" + pval;
	url=url+"&sid="+Math.random();
	xmlhttp.onreadystatechange=stateChanged;
	xmlhttp.open("GET",url,true);
	xmlhttp.send(null);
//	document.getElementById('autosuggest_results').style.display = "none";
//	alert(str);
	document.getElementById('header').style.display = 'none';
	document.getElementById('sidebar').style.display = 'inline';
	console.log('toggling');
}

function geneKeyUp(e) {
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
		showGene('');
		console.log(Enterkey);
		return false;
	}
	}

function showGene3(str) {
	if(str == ""){
		str = document.getElementById('gene2').value;
		var sub = $('input:checkbox[name="subsite2[]"]:checked').map(function () {
        return this.value;
    }).get();
		console.log(sub)
		pval = document.getElementById('P-value2').value;
		if(str == ""){
			return;
		}
	}
	xmlhttp=GetXmlHttpObject();
	if (xmlhttp==null) {
		alert ("Browser does not support HTTP Request");
		return;
	}
	var url="firsttryphp.php";
	url=url+"?q="+str + "&s="+ sub + "&p=" + pval;
	url=url+"&sid="+Math.random();
	xmlhttp.onreadystatechange=stateChanged;
	xmlhttp.open("GET",url,true);
	xmlhttp.send(null);
	console.log('refreshing')
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
		console.log(Enterkey);
		return false;
	}
}
function stateChanged() {
	if (xmlhttp.readyState==4) {
	//	document.getElementById("txtHint").innerHTML=xmlhttp.responseText;
		console.log(xmlhttp.status)
		console.log(xmlhttp.responseText)
		var jsonencoded = JSON.parse(xmlhttp.responseText);	
		$(".link").remove();
		$(".node").remove();
		graph(jsonencoded);
		console.log('working')
	}
}

function graph(links){
/* var svg = d3.select("#salvation").append("svg")
			.attr("width", 840)
			.attr("height", 600); */
var nodes = {};

var svg = d3.select("#chart");

// Compute the distinct nodes from the links.
links.forEach(function(link) {
    link.source = nodes[link.source] || 
        (nodes[link.source] = {name: link.source, value: '6', color: '#779ECB' });
    link.target = nodes[link.target] || 
        (nodes[link.target] = {name: link.target, value: '5', color: '#ccc'});
    link.value = +link.value;
});
var width = 860,
    height = 580;

var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(links)
    .size([width, height])
    .linkDistance(90)
    .charge(-700)
    .on("tick", tick)
    .start();


// add the links and the arrows
var path = svg.append("svg:g").selectAll("path")
    .data(force.links())
  .enter().append("svg:path")
    .attr("class", function(d) { return "link " + d.type; })
    .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });

// define the nodes
var node = svg.selectAll(".node")
    .data(force.nodes())
  .enter().append("g")
    .attr("class", "node")
 node.call(force.drag)

// add the nodes
node.append("circle")
   .attr("r", function(d) {return d.value;})
   .attr("fill",function(d) {return d.color;});

// add the text 
node.append("text")
  .attr("x", 12)
  .attr("dy", ".35em")
    .text(function(d) { return d.name; });

// add the curvy lines
function tick() {
    path.attr("d", function(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = (1500);
        return "M" + 
            d.source.x + "," + 
            d.source.y + "A" + 
            dr + "," + dr + " 0 0,1 " + 
            d.target.x + "," + 
            d.target.y;
    });

    node
        .attr("transform", function(d) { 
            return "translate(" + d.x + "," + d.y + ")"; });
	
}

d3.select("#save").on("click", function(){
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
document.getElementById('sidebar').style.display = 'none';	  
document.getElementById('chart').style.display = 'none';
document.getElementById('svgdataurl').style.display = 'inline';
document.getElementById('buttons').style.display = 'inline';
  d3.select("#buttons").append("input")
      .attr("type", "button")
      .attr("value", "Back to Search")
	  .attr("id", "back")
	  ;	
	d3.select("#back").on("click", function(){
	document.getElementById('sidebar').style.display = 'inline';	  
	document.getElementById('chart').style.display = 'inline';
	document.getElementById('svgdataurl').style.display = 'none';
	document.getElementById('buttons').style.display = 'none';
	console.log(arewethere);
});	
  });

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



