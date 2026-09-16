<?php
declare(strict_types=1);

require __DIR__ . '/auth.php';
panel_start_session();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

if (!panel_is_authenticated()) {
    http_response_code(401);
    echo json_encode(['error' => 'authentication_required']);
    exit;
}

$requestedDays = (int)($_GET['days'] ?? 30);
$days = in_array($requestedDays, [7, 30, 90], true) ? $requestedDays : 30;
$dataFile = dirname(__DIR__) . '/analytics-api/data/analytics-data.json';
$store = ['days' => [], 'updated_at' => null];

if (is_file($dataFile)) {
    $decoded = json_decode((string)file_get_contents($dataFile), true);
    if (is_array($decoded)) {
        $store = array_merge($store, $decoded);
    }
}

function add_counts(array &$target, array $source): void
{
    foreach ($source as $key => $value) {
        $target[$key] = (int)($target[$key] ?? 0) + (int)$value;
    }
}

function get_item_counts(array $day, string $event): array
{
    $items = $day['items'][$event] ?? [];
    return is_array($items) ? $items : [];
}

function date_keys(DateTimeImmutable $end, int $days): array
{
    $keys = [];
    for ($index = $days - 1; $index >= 0; $index--) {
        $keys[] = $end->modify("-{$index} days")->format('Y-m-d');
    }
    return $keys;
}

function display_label(string $value): string
{
    $value = rawurldecode($value);
    $value = preg_replace('/\.[a-z0-9]+$/i', '', $value) ?? $value;
    $value = str_replace(['-', '_'], ' ', $value);
    $value = trim($value);
    return function_exists('mb_convert_case')
        ? mb_convert_case($value, MB_CASE_TITLE, 'UTF-8')
        : ucwords(strtolower($value));
}

$zone = new DateTimeZone('America/Sao_Paulo');
$today = new DateTimeImmutable('today', $zone);
$currentKeys = date_keys($today, $days);
$previousEnd = $today->modify("-{$days} days");
$previousKeys = date_keys($previousEnd, $days);

$events = [];
$pages = [];
$timezones = [];
$details = [];
$dailyVisits = [];
$currentVisits = 0;
$previousVisits = 0;

foreach ($currentKeys as $key) {
    $day = is_array($store['days'][$key] ?? null) ? $store['days'][$key] : [];
    $dayEvents = is_array($day['events'] ?? null) ? $day['events'] : [];
    add_counts($events, $dayEvents);
    add_counts($pages, is_array($day['pages'] ?? null) ? $day['pages'] : []);
    add_counts($timezones, is_array($day['timezones'] ?? null) ? $day['timezones'] : []);
    foreach ((array)($day['items'] ?? []) as $eventName => $items) {
        if (!isset($details[$eventName])) {
            $details[$eventName] = [];
        }
        add_counts($details[$eventName], is_array($items) ? $items : []);
    }
    $visits = (int)($dayEvents['site_visit'] ?? 0);
    $currentVisits += $visits;
    $dailyVisits[] = ['date' => $key, 'value' => $visits];
}

foreach ($previousKeys as $key) {
    $day = is_array($store['days'][$key] ?? null) ? $store['days'][$key] : [];
    $previousVisits += (int)($day['events']['site_visit'] ?? 0);
}

$eventCount = static fn(string $name): int => (int)($events[$name] ?? 0);
$trend = $previousVisits > 0 ? (($currentVisits - $previousVisits) / $previousVisits) * 100 : 0.0;

$infoMap = [];
foreach ((array)($details['informativo_online_view'] ?? []) as $name => $views) {
    $infoMap[$name] = ['views' => (int)$views, 'downloads' => 0];
}
foreach ((array)($details['file_download'] ?? []) as $name => $downloads) {
    if (!isset($infoMap[$name])) {
        $infoMap[$name] = ['views' => 0, 'downloads' => 0];
    }
    $infoMap[$name]['downloads'] += (int)$downloads;
}
$info = [];
foreach ($infoMap as $name => $counts) {
    $info[] = [display_label($name), $counts['views'], $counts['downloads']];
}
usort($info, static fn(array $a, array $b): int => ($b[1] + $b[2]) <=> ($a[1] + $a[2]));

$partnerMap = [];
foreach ((array)($details['ballot_complete'] ?? []) as $name => $count) {
    if ($name === 'main' || $name === 'partner' || $name === 'nao_informado') {
        continue;
    }
    $partnerMap[$name] = ['ballots' => (int)$count, 'shares' => 0];
}
foreach ((array)($details['share'] ?? []) as $compound => $count) {
    if (strpos($compound, 'partner_ballot__') !== 0) {
        continue;
    }
    $name = substr($compound, strlen('partner_ballot__'));
    if (!isset($partnerMap[$name])) {
        $partnerMap[$name] = ['ballots' => 0, 'shares' => 0];
    }
    $partnerMap[$name]['shares'] += (int)$count;
}
$partners = [];
foreach ($partnerMap as $name => $counts) {
    $partners[] = [display_label($name), $counts['ballots'], $counts['shares']];
}
usort($partners, static fn(array $a, array $b): int => ($b[1] + $b[2]) <=> ($a[1] + $a[2]));

$timezoneLabels = [
    'america/sao_paulo' => ['Horário de Brasília', 'BR'],
    'america/manaus' => ['Região Amazônica', 'BR'],
    'america/cuiaba' => ['Centro-Oeste', 'BR'],
    'america/fortaleza' => ['Nordeste', 'BR'],
    'america/recife' => ['Nordeste', 'BR'],
    'america/bahia' => ['Bahia', 'BR'],
    'america/belem' => ['Pará', 'BR'],
    'america/rio_branco' => ['Acre', 'BR']
];
$locations = [];
arsort($timezones);
foreach (array_slice($timezones, 0, 8, true) as $timezone => $count) {
    $label = $timezoneLabels[$timezone] ?? [display_label($timezone), ''];
    $locations[] = [$label[0], $label[1], (int)$count];
}

$partnerBallots = array_sum(array_map(static fn(array $row): int => (int)$row[1], $partners));
$completed = $eventCount('ballot_complete');

echo json_encode([
    'generatedAt' => $store['updated_at'] ?? null,
    'days' => $days,
    'trend' => $trend,
    'metrics' => [
        'visits' => $currentVisits,
        'video30' => $eventCount('video_30_seconds'),
        'downloads' => $eventCount('file_download'),
        'onlineViews' => $eventCount('informativo_online_view'),
        'partnerClicks' => $eventCount('partner_page_open') + $eventCount('partner_ballot_start'),
        'completedBallots' => $completed,
        'socialClicks' => $eventCount('social_click'),
        'teamClicks' => $eventCount('team_click')
    ],
    'visits' => $dailyVisits,
    'actions' => [
        ['Colinha principal concluída', max(0, $completed - $partnerBallots)],
        ['Colinhas de parceiros', $partnerBallots],
        ['Compartilhamentos', $eventCount('share')],
        ['Redes sociais', $eventCount('social_click')],
        ['Time Luciano Vieira', $eventCount('team_click')]
    ],
    'info' => array_slice($info, 0, 12),
    'partners' => array_slice($partners, 0, 15),
    'locations' => $locations
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
