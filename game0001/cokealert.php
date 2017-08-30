<?php

mb_language("Japanese");
mb_internal_encoding("UTF-8");

$to      = 'ya400630@gmail.com';
$subject = 'Please by me coke!';
$message = 'コーラがない場合は夏だったら買って下さい';
$headers = 'From: info@hirokifreehost.tk' . "\r\n";

mb_send_mail($to, $subject, $message, $headers);
