<?php
namespace App\Controller;

use App\Exception\NotFoundException;
use App\Model\Category;
use App\Service\Router;
use App\Service\Templating;

class CategoryController
{
    public function indexAction(Templating $templating, Router $router): ?string
    {
        $categories = Category::findAll();
        return $templating->render('category/index.html.php', [
            'categories' => $categories,
            'router' => $router,
        ]);
    }

    public function createAction(?array $requestPost, Templating $templating, Router $router): ?string
    {
        if ($requestPost) {
            $category = Category::fromArray($requestPost);
            // @todo missing validation
            $category->save();

            $router->redirect($router->generatePath('category-index'));
            return null;
        }

        $category = new Category();
        return $templating->render('category/create.html.php', [
            'category' => $category,
            'router' => $router,
        ]);
    }

    public function editAction(int $categoryId, ?array $requestPost, Templating $templating, Router $router): ?string
    {
        $category = Category::find($categoryId);
        if (! $category) {
            throw new NotFoundException("Missing category with id $categoryId");
        }

        if ($requestPost) {
            $category->fill($requestPost);
            // @todo missing validation
            $category->save();

            $router->redirect($router->generatePath('category-index'));
            return null;
        }

        return $templating->render('category/edit.html.php', [
            'category' => $category,
            'router' => $router,
        ]);
    }

    public function showAction(int $categoryId, Templating $templating, Router $router): ?string
    {
        $category = Category::find($categoryId);
        if (! $category) {
            throw new NotFoundException("Missing category with id $categoryId");
        }

        return $templating->render('category/show.html.php', [
            'category' => $category,
            'router' => $router,
        ]);
    }

    public function deleteAction(int $categoryId, Router $router): ?string
    {
        $category = Category::find($categoryId);
        if (! $category) {
            throw new NotFoundException("Missing category with id $categoryId");
        }

        $category->delete();
        $router->redirect($router->generatePath('category-index'));
        return null;
    }
}
