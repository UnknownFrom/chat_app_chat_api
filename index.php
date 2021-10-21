<?php

require_once "./composer/vendor/autoload.php";
$client = new \phpcent\Client("http://localhost:8086");
if(!isset($_SESSION['user']))
{
    $_SESSION['user'] = bin2hex(openssl_random_pseudo_bytes(20));
}
$user = $_SESSION['user'];
$timestamp = time();
$token = $client->setSecret("qwtwetwqgbert")->generateConnectionToken($user, $timestamp);
?>