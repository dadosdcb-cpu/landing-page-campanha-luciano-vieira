<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'https://lucianovieira4545.com.br',
    'https://www.lucianovieira4545.com.br',
    'http://127.0.0.1:8080',
    'http://localhost:8080'
];
if ($origin !== '' && !in_array($origin, $allowedOrigins, true)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'origin_not_allowed']);
    exit;
}

$contentLength = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength < 1 || $contentLength > 4096) {
    http_response_code(413);
    echo json_encode(['ok' => false, 'error' => 'invalid_payload_size']);
    exit;
}

$payload = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_json']);
    exit;
}

$allowedEvents = [
    'site_visit', 'page_view', 'video_30_seconds', 'file_download',
    'informativo_online_view', 'informativos_catalog_open',
    'partner_page_open', 'partner_ballot_start', 'partner_ballot_open',
    'ballot_complete', 'social_click', 'team_click', 'share',
    'video_share_menu_open', 'informativo_download_menu_open'
];

$event = strtolower(trim((string)($payload['event'] ?? '')));
if (!in_array($event, $allowedEvents, true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'event_not_allowed']);
    exit;
}

function clean_value(mixed $value, int $maxLength = 100): string
{
    $value = strtolower(trim((string)$value));
    $value = preg_replace('/[^a-z0-9_\-\.\/]/', '_', $value) ?? '';
    $value = preg_replace('/_+/', '_', $value) ?? '';
    return substr($value, 0, $maxLength);
}

function increment(array &$target, string $key): void
{
    if ($key === '') {
        $key = 'nao_informado';
    }
    $target[$key] = (int)($target[$key] ?? 0) + 1;
}

$params = is_array($payload['params'] ?? null) ? $payload['params'] : [];
$pagePath = clean_value($params['page_path'] ?? '/', 160);
$timezone = clean_value($payload['timezone'] ?? '', 60);
$item = '';

switch ($event) {
    case 'file_download':
        $item = clean_value($params['file_name'] ?? $params['item_id'] ?? 'arquivo');
        break;
    case 'informativo_online_view':
        $item = clean_value($params['item_id'] ?? $pagePath);
        break;
    case 'partner_ballot_start':
    case 'partner_ballot_open':
        $item = clean_value($params['partner'] ?? $params['item_id'] ?? 'parceiro');
        break;
    case 'ballot_complete':
        $item = clean_value($params['partner'] ?? $params['ballot_type'] ?? 'main');
        break;
    case 'share':
        $contentType = clean_value($params['content_type'] ?? 'conteudo');
        $itemId = clean_value($params['item_id'] ?? 'geral');
        $item = clean_value($contentType . '__' . $itemId);
        break;
    case 'video_30_seconds':
        $item = clean_value($params['video_id'] ?? $params['video_type'] ?? 'video');
        break;
    case 'social_click':
        $item = clean_value($params['network'] ?? 'social');
        break;
    case 'page_view':
        $item = $pagePath;
        break;
}

$zone = new DateTimeZone('America/Sao_Paulo');
$now = new DateTimeImmutable('now', $zone);
$dateKey = $now->format('Y-m-d');
$dataDirectory = __DIR__ . DIRECTORY_SEPARATOR . 'data';
$dataFile = $dataDirectory . DIRECTORY_SEPARATOR . 'analytics-data.json';

if (!is_dir($dataDirectory) && !mkdir($dataDirectory, 0755, true) && !is_dir($dataDirectory)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'storage_unavailable']);
    exit;
}

$handle = fopen($dataFile, 'c+');
if ($handle === false || !flock($handle, LOCK_EX)) {
    if (is_resource($handle)) {
        fclose($handle);
    }
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'storage_busy']);
    exit;
}

rewind($handle);
$raw = stream_get_contents($handle);
$store = is_string($raw) && $raw !== '' ? json_decode($raw, true) : null;
if (!is_array($store)) {
    $store = ['version' => 1, 'days' => []];
}
if (!isset($store['days'][$dateKey]) || !is_array($store['days'][$dateKey])) {
    $store['days'][$dateKey] = [
        'events' => [],
        'items' => [],
        'pages' => [],
        'timezones' => []
    ];
}

$day =& $store['days'][$dateKey];
increment($day['events'], $event);

if ($event === 'page_view') {
    increment($day['pages'], $pagePath);
}
if ($timezone !== '' && $event === 'site_visit') {
    increment($day['timezones'], $timezone);
}
if ($item !== '') {
    if (!isset($day['items'][$event]) || !is_array($day['items'][$event])) {
        $day['items'][$event] = [];
    }
    increment($day['items'][$event], $item);
}

$store['updated_at'] = $now->format(DATE_ATOM);
$encoded = json_encode($store, JSON_UNESCAPED_SLASHES);
if (!is_string($encoded)) {
    flock($handle, LOCK_UN);
    fclose($handle);
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'encoding_failed']);
    exit;
}

ftruncate($handle, 0);
rewind($handle);
fwrite($handle, $encoded);
fflush($handle);
flock($handle, LOCK_UN);
fclose($handle);

http_response_code(202);
echo json_encode(['ok' => true]);
