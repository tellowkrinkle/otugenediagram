<?php
$name= $_GET["q"];
$sub=$_GET["s"];
$pval=$_GET["p"];
$otu=$_GET["o"];


$database_name = 'abv'; // Set this to your Database Name
$database_username = 'geneforce'; // Set this to your MySQL username
$database_password = 'wqhew528hw'; // Set this to your MySQL password
$sql = mysqli_connect('localhost',$database_username, $database_password, $database_name);


if (mysqli_connect_errno()) {
	die("Connect failed: " . mysqli_connect_error());
}

$list = explode(',', $name);
foreach ($list as $value) {
	$in_clause[] = "'".  $sql->real_escape_string($value) . "'";
}
$in_clause = join(',', $in_clause);
$list2 = explode(',', $otu);
foreach ($list2 as $value2) {
	$in_clause2[] = "'".  $sql->real_escape_string($value2) . "'";
}
$in_clause2 = join(',', $in_clause2);

if ($otu == "") {
	if ($name != "") {
	$qstring = "select Gene as 'source' , OTU as 'target', Subsite as 'type' from short where Gene IN ($in_clause) and Subsite IN ($sub) and P < '$pval'";
	$result= $sql->query($qstring) or die (mysqli_error($sql)); 
	}
	
}
elseif ($otu !=""){ 
	if ($name != "") {
	$qstring = "select Gene as 'source' , OTU as 'target', Subsite as 'type' from short where Gene IN ($in_clause) and Subsite IN ($sub) and P < '$pval' and OTU IN ($in_clause2)";
	$result = $sql->query($qstring) or die (mysql_error($sql)); 
	}
}


#$myquery = "select Gene as 'source' , OTU as 'target', Subsite as 'type' from small where Gene IN ('$name')";
#$query = mysql_query($myquery) or die (mysql_error());

$links = array();

while ($row = $result->fetch_assoc()) {
	array_push($links, $row);
}
$result->close();

echo json_encode($links);
$sql->close();


?> 
