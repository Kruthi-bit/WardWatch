CREATE DATABASE IF NOT EXISTS wardwatch;

USE wardwatch;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    mobile_number VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(150),
    ward VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    mobile_number VARCHAR(15),
    email VARCHAR(150),
    ward VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    description TEXT NOT NULL,
    department VARCHAR(150),
    status VARCHAR(50) DEFAULT 'Submitted',
    priority VARCHAR(50) DEFAULT 'Medium',
    ai_confidence VARCHAR(50),
    ai_summary TEXT,
    image_url LONGTEXT,
    filed_date VARCHAR(50),
    upvotes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaint_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    stage VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    dot_color VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_complaint_history
        FOREIGN KEY (complaint_id)
        REFERENCES complaints(id)
        ON DELETE CASCADE
);