<?php

/** @var \App\Model\Category $category */
/** @var \App\Service\Router $router */

$title = "Edit Category {$category->getName()} ({$category->getId()})";
$bodyClass = 'edit';

ob_start(); ?>
    <h1><?= $title ?></h1>
    <form action="<?= $router->generatePath('category-edit') ?>" method="post" class="edit-form">
        <?php require __DIR__ . DIRECTORY_SEPARATOR . '_form.html.php'; ?>
        <input type="hidden" name="action" value="category-edit">
        <input type="hidden" name="id" value="<?= $category->getId() ?>">
    </form>

    <ul class="action-list">
        <li><a href="<?= $router->generatePath('category-index') ?>">Back to list</a></li>
        <li>
            <form action="<?= $router->generatePath('category-delete') ?>" method="post">
                <input type="submit" value="Delete" onclick="return confirm('Are you sure?')">
                <input type="hidden" name="action" value="category-delete">
                <input type="hidden" name="id" value="<?= $category->getId() ?>">
            </form>
        </li>
    </ul>
<?php $main = ob_get_clean();

include __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'base.html.php';
