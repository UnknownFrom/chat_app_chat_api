<?php
require_once "./composer/vendor/autoload.php";
$client = new \phpcent\Client("http://localhost:8086");
$client->setSecret("qwtwetwqgbert");

if(isset($_POST['publish']) && trim($_POST['publish']) !== '')
{
    echo 'ok';
}