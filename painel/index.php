<?php
declare(strict_types=1);

require __DIR__ . '/auth.php';
panel_start_session();

if (isset($_GET['logout'])) {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
    header('Location: ./');
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = (string)($_POST['password'] ?? '');
    if (panel_password_is_valid($password)) {
        session_regenerate_id(true);
        $_SESSION['panel_authenticated'] = true;
        header('Location: ./');
        exit;
    }
    usleep(350000);
    $error = 'Senha incorreta. Confira e tente novamente.';
}

if (!panel_is_authenticated()):
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="theme-color" content="#083e77" />
<meta name="robots" content="noindex,nofollow,noarchive" />
<title>Acesso privado — Painel Luciano Vieira</title>
<link rel="icon" href="../LOGOS/LOGO%20AZUL.png" />
<link rel="stylesheet" href="painel.css" />
</head>
<body class="login-page">
<main class="login-shell">
<section class="login-card" aria-labelledby="login-title">
<img src="../LOGOS/LOGO%20AZUL.png" alt="Luciano Vieira 4545" />
<p class="eyebrow">Painel privado</p>
<h1 id="login-title">Acesso aos resultados</h1>
<p>Entre com a senha do painel para visualizar somente os dados agregados da campanha.</p>
<form method="post" action="./">
<label for="password">Senha</label>
<input id="password" name="password" type="password" autocomplete="current-password" required autofocus />
<?php if ($error !== ''): ?><p class="login-error" role="alert"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p><?php endif; ?>
<button type="submit">Entrar no painel</button>
</form>
<small>Nomes, telefones, votos preenchidos e endereços IP não são exibidos.</small>
</section>
</main>
</body>
</html>
<?php
exit;
endif;
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="theme-color" content="#083e77" />
<meta name="robots" content="noindex,nofollow,noarchive" />
<title>Painel de resultados — Luciano Vieira</title>
<link rel="icon" href="../LOGOS/LOGO%20AZUL.png" />
<link rel="stylesheet" href="painel.css" />
<script src="painel.js" defer></script>
</head>
<body>
<button class="menu-toggle" id="menu-toggle" type="button" aria-label="Abrir menu" aria-controls="sidebar" aria-expanded="false"><span></span><span></span><span></span></button>
<aside class="sidebar" id="sidebar">
<a class="brand" href="#visao-geral" aria-label="Painel Luciano Vieira"><img src="../LOGOS/LOGO%20EM%20BRANCO_Prancheta%201.svg" alt="Luciano Vieira 4545" /></a>
<p class="sidebar-label">Painel de resultados</p>
<nav aria-label="Seções do painel">
<a class="active" href="#visao-geral"><span>01</span> Visão geral</a>
<a href="#engajamento"><span>02</span> Engajamento</a>
<a href="#conteudos"><span>03</span> Informativos</a>
<a href="#parceiros"><span>04</span> Parceiros</a>
<a href="#localizacao"><span>05</span> Localização</a>
</nav>
<div class="privacy-card"><span class="lock" aria-hidden="true">●</span><div><strong>Acesso privado</strong><small>Somente dados agregados</small></div></div>
<a class="logout-link" href="?logout=1">Sair do painel</a>
</aside>
<main class="dashboard">
<header class="topbar">
<div><p class="eyebrow">Campanha 2026</p><h1>Olá, Luciano.</h1><p class="subtitle">Veja como as pessoas estão interagindo com o site.</p></div>
<div class="topbar-actions"><span class="demo-badge live" id="data-status">Dados reais</span><label for="period">Período<select id="period"><option value="7">Últimos 7 dias</option><option value="30" selected>Últimos 30 dias</option><option value="90">Últimos 90 dias</option></select></label></div>
</header>
<section class="summary" id="visao-geral" aria-labelledby="summary-title">
<div class="section-heading"><div><p class="kicker">Resumo</p><h2 id="summary-title">Visão geral</h2></div><p class="updated" id="updated-at">Atualizando…</p></div>
<div class="metric-grid" id="metric-grid"></div>
</section>
<section class="content-grid two-columns" id="engajamento">
<article class="panel chart-panel">
<div class="panel-heading"><div><p class="kicker">Audiência</p><h2>Visitas ao site</h2></div><div class="chart-total"><strong id="chart-total">0</strong><span>no período</span></div></div>
<div class="chart-wrap"><svg id="visits-chart" viewBox="0 0 760 260" role="img" aria-label="Gráfico de visitas ao site"></svg></div>
<div class="chart-legend"><span><i class="blue-dot"></i>Visitas</span><strong id="chart-trend">Calculando comparação…</strong></div>
</article>
<article class="panel actions-panel">
<div class="panel-heading"><div><p class="kicker">Conversões</p><h2>Ações no site</h2></div></div>
<div class="action-list" id="action-list"></div>
</article>
</section>
<section class="panel" id="conteudos">
<div class="panel-heading"><div><p class="kicker">Conteúdo</p><h2>Desempenho dos informativos</h2></div><span class="panel-note">Visualizações e downloads</span></div>
<div class="table-wrap"><table><thead><tr><th>Informativo</th><th>Visualizações online</th><th>Downloads</th><th>Total de ações</th></tr></thead><tbody id="informative-table"></tbody></table></div>
</section>
<section class="content-grid partners-location">
<article class="panel" id="parceiros">
<div class="panel-heading"><div><p class="kicker">Dobradinhas</p><h2>Resultados por parceiro</h2></div><span class="panel-note">Mais acessados</span></div>
<div class="table-wrap"><table><thead><tr><th>Parceiro</th><th>Colinhas feitas</th><th>Compartilhamentos</th></tr></thead><tbody id="partner-table"></tbody></table></div>
</article>
<article class="panel" id="localizacao">
<div class="panel-heading"><div><p class="kicker">Localização aproximada</p><h2>Principais regiões</h2></div><span class="panel-note">Sem endereço ou IP armazenado</span></div>
<div class="location-list" id="location-list"></div>
</article>
</section>
<section class="privacy-banner"><div class="privacy-icon" aria-hidden="true">✓</div><div><h2>Privacidade preservada</h2><p>Este painel registra somente contagens agregadas. Nomes, telefones, votos preenchidos, endereços e IPs não aparecem.</p></div></section>
<footer><p>Painel privado · Luciano Vieira 4545</p><p>Dados agregados da campanha</p></footer>
</main>
</body>
</html>
