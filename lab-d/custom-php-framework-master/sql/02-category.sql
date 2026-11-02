create table categories
(
    id          integer not null
        constraint categories_pk
            primary key autoincrement,
    name        text not null,
    description text not null
);
