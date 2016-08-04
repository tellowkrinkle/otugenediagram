<?php

error_reporting(E_ALL);

$genelist = $_GET["genes"];
$table = $_GET["table"];

$database_name = 'abv'; // Set this to your Database Name
$database_username = 'geneforce'; // Set this to your MySQL username
$database_password = 'wqhew528hw'; // Set this to your MySQL password
$sql = mysqli_connect('localhost',$database_username, $database_password, $database_name);

// Quote the gene list and trim whitespace
$genes = explode(",", $genelist);
$quotedGenes = array();
foreach ($genes as $gene) {
	array_push($quotedGenes, "'" . $sql->real_escape_string(strtoupper(trim($gene))) . "'");
}
$quotedGenelist = join(",", $quotedGenes);

if ($table == "new") {
	$tablechoice = "newData";
}
else {
	$tablechoice = "short";
}

$queryString = "select Gene, OTU, Subsite, P from $tablechoice where UPPER(Gene) IN ($quotedGenelist)";

$result = $sql->query($queryString) or die (mysqli_error($sql));

$links = array();
while ($row = $result->fetch_row()) {
	array_push($links, $row);
}
$result->close();

echo json_encode($links);
$sql->close();

?>