-- Makes cards.lat and cards.lng nullable (a place may not be geocoded yet).
-- SQLite cannot drop NOT NULL in place, so the table is rebuilt; rows and card_swipes are kept.
-- Safe to run once on a database created from the old schema.
PRAGMA foreign_keys = OFF;

BEGIN;

CREATE TABLE cards_new (
	id CHAR(32) NOT NULL,
	event_name VARCHAR(200) NOT NULL,
	color_code VARCHAR(7) NOT NULL,
	description TEXT NOT NULL,
	image_url VARCHAR(2048),
	starts_at DATETIME NOT NULL,
	ends_at DATETIME,
	address VARCHAR(300) NOT NULL,
	lat FLOAT,
	lng FLOAT,
	price FLOAT NOT NULL,
	PRIMARY KEY (id)
);

INSERT INTO cards_new
	(id, event_name, color_code, description, image_url, starts_at, ends_at, address, lat, lng, price)
SELECT id, event_name, color_code, description, image_url, starts_at, ends_at, address, lat, lng, price
FROM cards;

DROP TABLE cards;

ALTER TABLE cards_new RENAME TO cards;

COMMIT;

PRAGMA foreign_keys = ON;
