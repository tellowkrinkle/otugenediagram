<?php
#$unsafe=$_GET["q"];
$name=$_GET["q"];
#$name= mysql_real_escape_string($unsafe);
$sub=$_GET["s"];
$pval=$_GET["p"];


$database_name = 'abv'; // Set this to your Database Name
$database_username = 'geneforce'; // Set this to your MySQL username
$database_password = 'wqhew528hw'; // Set this to your MySQL password
$con = mysql_pconnect('localhost',$database_username, $database_password);

#echo "name: " . $name . "\n";
$list = explode(',', $name);

if (!$con){
  die('Could not connect: ' . mysql_error());
}
if (!mysql_select_db($database_name, $con)){
  die('Could not select database: ' . mysql_error());
}

foreach ($list as $value) {
$in_clause[] = "'". mysql_real_escape_string($value) . "'";
}

$in_clause = join(',', $in_clause);
#echo "in_clause: " . $in_clause . "\n";

$qstring = "select Gene as 'source' , OTU as 'target', Subsite as 'type' from short where Gene IN ($in_clause) and Subsite IN ($sub) and P < '$pval'";
#$qstring = "select Gene as 'source', OTU as 'target', Subsite as 'type' from short where Gene = 'TP73'";
$result= mysql_query($qstring) or die (mysql_error()); 

#$myquery = "select Gene as 'source' , OTU as 'target', Subsite as 'type' from small where Gene IN ('$name')";
#$query = mysql_query($myquery) or die (mysql_error());
	
$links= array();
	
for ($x = 0; $x < mysql_num_rows($result); $x++) {
        $links[] = mysql_fetch_assoc($result);
    }

echo json_encode($links);
mysql_close($con);


?> 
