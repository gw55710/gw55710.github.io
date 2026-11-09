<?php

namespace App\Entity;

use App\Repository\CategoryRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CategoryRepository::class)]
class Category
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $tiry = null;

    #[ORM\Column(length: 255)]
    private ?string $tirowcy = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTiry(): ?string
    {
        return $this->tiry;
    }

    public function setTiry(string $tiry): static
    {
        $this->tiry = $tiry;

        return $this;
    }

    public function getTirowcy(): ?string
    {
        return $this->tirowcy;
    }

    public function setTirowcy(string $tirowcy): static
    {
        $this->tirowcy = $tirowcy;

        return $this;
    }
}
