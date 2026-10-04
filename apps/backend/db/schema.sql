CREATE TABLE cards (
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
	price FLOAT, 
	PRIMARY KEY (id)
);

CREATE TABLE user_card_progress (
	user_id CHAR(32) NOT NULL, 
	cards_served INTEGER NOT NULL, 
	PRIMARY KEY (user_id), 
	CONSTRAINT cards_served_range CHECK (cards_served >= 0 AND cards_served <= 6)
);

CREATE TABLE user_info (
	user_id CHAR(32) NOT NULL, 
	data TEXT NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (user_id)
);

CREATE TABLE card_swipes (
	user_id CHAR(32) NOT NULL, 
	card_id CHAR(32) NOT NULL, 
	swipe BOOLEAN NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (user_id, card_id), 
	FOREIGN KEY(card_id) REFERENCES cards (id)
);
