<?php

/** @var \App\Model\Category $category */
/** @var \App\Service\Router $router */

$title = "{$category->getName()} ({$category->getId()})";
$bodyClass = 'show';

ob_start(); ?>
    <h1><?= $category->getName() ?></h1>
    <article>
        <?= $category->getDescription() ?>
    </article>

    <ul class="action-list">
        <li><a href="<?= $router->generatePath('category-index') ?>">Back to list</a></li>
        <li><a href="<?= $router->generatePath('category-edit', ['id' => $category->getId()]) ?>">Edit</a></li>
    </ul>
<?php $main = ob_get_clean();

include __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'base.html.php';
