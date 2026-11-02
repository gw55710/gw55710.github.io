<?php

/** @var \App\Model\Category $category */
/** @var \App\Service\Router $router */

$title = 'Create Category';
$bodyClass = 'edit';

ob_start(); ?>
    <h1>Create Category</h1>
    <form action="<?= $router->generatePath('category-create') ?>" method="post" class="edit-form">
        <?php require __DIR__ . DIRECTORY_SEPARATOR . '_form.html.php'; ?>
        <input type="hidden" name="action" value="category-create">
    </form>

    <a href="<?= $router->generatePath('category-index') ?>">Back to list</a>
<?php $main = ob_get_clean();

include __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'base.html.php';
