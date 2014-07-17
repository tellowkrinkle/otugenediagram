<?php
$name= $_GET["q"];
$sub=$_GET["s"];
$pval=$_GET["p"];
$otu=$_GET["o"];


$database_name = 'abv'; // Set this to your Database Name
$database_username = 'geneforce'; // Set this to your MySQL username
$database_password = 'wqhew528hw'; // Set this to your MySQL password
$con = mysql_pconnect('localhost',$database_username, $database_password);


if (!$con){
  die('Could not connect: ' . mysql_error());
}
if (!mysql_select_db($database_name, $con)){
  die('Could not select database: ' . mysql_error());
}
$list = explode(',', $name);
foreach ($list as $value) {
$in_clause[] = "'".  mysql_real_escape_string($value) . "'";
}
$in_clause = join(',', $in_clause);
$list2 = explode(',', $otu);
foreach ($list2 as $value2) {
$in_clause2[] = "'".  mysql_real_escape_string($value2) . "'";
}
$in_clause2 = join(',', $in_clause2);
if ($otu == "") {
	if ($name != "") {
	$qstring = "select Gene as 'source' , OTU as 'target', Subsite as 'type' from small where Gene IN ($in_clause) and Subsite IN ($sub) and P < '$pval'";
	$result= mysql_query($qstring) or die (mysql_error()); 
	}
	
}
elseif ($otu !=""){ 
	if ($name != "") {
	$qstring = "select Gene as 'source' , OTU as 'target', Subsite as 'type' from small where Gene IN ($in_clause) and Subsite IN ($sub) and P < '$pval' and OTU IN ($in_clause2)";
	$result= mysql_query($qstring) or die (mysql_error()); 
	}
}


#$myquery = "select Gene as 'source' , OTU as 'target', Subsite as 'type' from small where Gene IN ('$name')";
#$query = mysql_query($myquery) or die (mysql_error());

$links= array();

for ($x = 0; $x < mysql_num_rows($result); $x++) {
        $links[] = mysql_fetch_assoc($result);
    }

echo json_encode($links);
mysql_close($con);


?> 