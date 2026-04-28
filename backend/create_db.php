<?php
$host = '127.0.0.1';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->exec("CREATE DATABASE IF NOT EXISTS db_beone_rt");
    echo "Database created successfully\n";
} catch (PDOException $e) {
    echo "DB Error: " . $e->getMessage() . "\n";
}
