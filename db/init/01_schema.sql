CREATE TABLE categories (
    id   SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE products (
    id          BIGSERIAL PRIMARY KEY,
    category_id INT           NOT NULL REFERENCES categories (id),
    name        TEXT          NOT NULL,
    description TEXT,
    price       NUMERIC(10,2) NOT NULL,
    stock       INT           NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE orders (
    id           BIGSERIAL PRIMARY KEY,
    product_id   BIGINT        NOT NULL REFERENCES products (id),
    quantity     INT           NOT NULL CHECK (quantity > 0),
    total        NUMERIC(12,2) NOT NULL,
    status       TEXT          NOT NULL DEFAULT 'new',
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ
);

INSERT INTO categories (name)
SELECT 'Категория ' || g FROM generate_series(1, 50) AS g;

INSERT INTO products (category_id, name, description, price, stock)
SELECT (g % 50) + 1,
       'Товар ' || g || ' ' || md5(g::text),
       'Описание товара номер ' || g,
       round((random() * 10000 + 10)::numeric, 2),
       100 + (random() * 1000)::int
FROM generate_series(1, 200000) AS g;

INSERT INTO orders (product_id, quantity, total, status, created_at, processed_at)
SELECT (random() * 199999)::int + 1,
       1 + (random() * 4)::int,
       round((random() * 50000)::numeric, 2),
       'processed',
       t,
       t + interval '1 minute'
FROM (
    SELECT now() - random() * interval '90 days' AS t
    FROM generate_series(1, 500000)
) AS s;

ANALYZE;