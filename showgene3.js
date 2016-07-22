
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
	if (xmlhttp.readystate === 4) {
		if (xmlhttp.responseText) {
			response = JSON.parse(xmlhttp.responseText);
			redisplay();
		}
	}
};

// Setup HTML stuff
var svg;
window.onload = function() {
	svg = d3.select("#graph");
};

// Function to make sure that we have the data needed to display the requested results.
// Returns true if the required data is already cached and ready to be displayed, false if a request was made (but the current cached data isn't enough)
// If the function returns false, redisplay() will be run when the new data is received.
function updateData() {
	// TODO: Actually write this function!
	xmlhttp.open("GET", "queries.php?q=TP73,T,PLOD1,LRP8,MCTP2,CHIA,TPSG1,IMP3&s='anterior_nares','attached_keratinized_gingiva','buccal_mucosa','left_antecubital_fossa','hard_palate','left_retroauricular_crease','Palatine_Tonsils','right_retroauricular_crease','saliva','right_antecubital_fossa','stool','subgingival_plaque','Throat','supragingival_plaque','tongue_dorsum'&p=.0001&o=&sid=0.9060260635289157", true);
	xmlhttp.send();
	return false;
}

// Function to update the visual display using the currently cached data and the current filter options
function redisplay() {
	// TODO: Write this function!
}