<?php

error_reporting(E_ALL);

$table = $_GET["table"];

$database_name = 'abv'; // Set this to your Database Name
$database_username = 'geneforce'; // Set this to your MySQL username
$database_password = 'wqhew528hw'; // Set this to your MySQL password
$sql = mysqli_connect('localhost',$database_username, $database_password, $database_name);

if ($table == "new") {
	$tablechoice = "newData";
}
else {
	$tablechoice = "short";
}

$queryString = "select distinct Gene from $tablechoice";
$result = $sql->query($queryString) or die (mysqli_error($sql));
$genes = array();
while ($row = $result->fetch_row()) {
	array_push($genes, $row[0]);
}
$result->close();

$queryString = "select distinct OTU from $tablechoice";
$result = $sql->query($queryString) or die (mysqli_error($sql));
$microbes = array();
while ($row = $result->fetch_row()) {
	array_push($microbes, $row[0]);
}
$result->close();

$output = array("genes" => $genes, "microbes" => $microbes);

echo json_encode($output);

$sql->close();

?>