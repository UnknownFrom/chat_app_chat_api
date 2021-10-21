<?php

use phpcent\Client;

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token');

require_once "./composer/vendor/autoload.php";
$client = new Client("http://localhost:8086");
/*if(!isset($_SESSION['user']))
{
    $_SESSION['user'] = bin2hex(openssl_random_pseudo_bytes(20));
}*/
$user = 'Pavel';//$_SESSION['user'];
$timestamp = time();
$token = $client->setSecret("qwtwetwqgbert")->generateConnectionToken($user, $timestamp);
$data['user'] = $user;
$data['timestamp'] = $timestamp;
$data['token'] = $token;
$json = json_encode($data);
echo $json;
?>

