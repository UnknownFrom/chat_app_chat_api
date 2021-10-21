<?php

require_once "./composer/vendor/autoload.php";
$client = new \phpcent\Client("http://localhost:8081");
if(!isset($_SESSION['user']))
{
    $_SESSION['user'] = bin2hex(openssl_random_pseudo_bytes(20));
}
$user = $_SESSION['user'];
$timestamp = time();
$token = $client->setSecret("qwtwetwqgbert")->generateConnectionToken($user, $timestamp);
?>

<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Чат</title>
    <link rel="stylesheet" href="./chat.css">

    <script src="./http_code.jquery.com_jquery-3.6.0.js"></script>
    <script src="//cdnjs.cloudflare.com/ajax/libs/json3/3.3.2/json3.min.js" type="text/javascript"></script>
    <script src="//cdn.jsdelivr.net/sockjs/1.1/sockjs.min.js" type="text/javascript"></script>
    <script src="./centrifuge.js" type="text/javascript"></script>
</head>
<body>
<div class='chat'>
    <div class='chat-messages'>
        <div class='chat-messages__content' id='messages'>
            Загрузка...
        </div>
    </div>
    <div class='chat-input'>
        <form method='post' class="form_message" id='chat-form'>
            <input type='text' id='message-text' class='chat-form__input' placeholder='Введите сообщение'> <input type='submit' id="send" class='chat-form__submit' value='Отправить'>
        </form>
    </div>
</div>
<script>
    $('input').on('keyup', function (event)
    {
        if(event.keyCode === 13){

            $(this).val('');
        }
    });

    let centrifuge = new Centrifuge({
        url: 'http://localhost:8081/connection',
        user: "<?php echo $_SESSION['user']; ?>",
        timestamp: "<?php echo $timestamp; ?>",
        token: "<?php echo $token; ?>"
    });

    centrifuge.subscribe("news", function(message) {
        console.log(message);
    });
</script>
<script type="text/javascript" src="http://chat.api.loc/index.php"></script>
<!--<script src="../assets/js/connect_centrifugo.js"></script>-->
</body>
</html>
<script>

</script>


centrifuge.connect();


//$client->setApiKey("");
//$client->publish("channel", ["message" => "Hello World"]);