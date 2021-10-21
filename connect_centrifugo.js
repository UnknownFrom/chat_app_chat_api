var centrifuge = new Centrifuge({
    url: 'http://localhost:8081/connection',
    user: "<?php echo $_SESSION['user']; ?>",
    timestamp: "<?php echo $timestamp; ?>",
    token: "<?php echo $token; ?>"
});

centrifuge.subscribe("news", function(message) {
    console.log(message);
});

centrifuge.connect();