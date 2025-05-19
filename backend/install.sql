CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);
CREATE TABLE trees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id INT NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);
CREATE TABLE persons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tree_id INT NOT NULL,
    firstname VARCHAR(255),
    lastname VARCHAR(255),
    birthdate DATE,
    deathdate DATE,
    x INT DEFAULT 0,
    y INT DEFAULT 0,
    FOREIGN KEY (tree_id) REFERENCES trees(id)
);
CREATE TABLE relations (
    parent_id INT NOT NULL,
    child_id INT NOT NULL,
    PRIMARY KEY (parent_id, child_id),
    FOREIGN KEY (parent_id) REFERENCES persons(id),
    FOREIGN KEY (child_id) REFERENCES persons(id)
);
