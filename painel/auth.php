<?php
declare(strict_types=1);

const PANEL_AUTH_SALT = '4a47a92b2ae411873a2904b2f5bc027e651d361d526c5be8';
const PANEL_AUTH_HASH = '9df24f12d180a44acbdf631c0d6031a4070dc197e3bfd5e087f292a9fc65ad7e';

function panel_start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_name('luciano_painel');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/painel/',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Strict'
    ]);
    session_start();
}

function panel_password_is_valid(string $password): bool
{
    $candidate = hash('sha256', PANEL_AUTH_SALT . $password);
    return hash_equals(PANEL_AUTH_HASH, $candidate);
}

function panel_is_authenticated(): bool
{
    return isset($_SESSION['panel_authenticated']) && $_SESSION['panel_authenticated'] === true;
}
