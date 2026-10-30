CREATE DATABASE IF NOT EXISTS wardwatch;
USE wardwatch;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(180) NOT NULL UNIQUE,
  ward VARCHAR(100) NOT NULL,
  role ENUM('citizen', 'staff') NOT NULL DEFAULT 'citizen',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  email VARCHAR(180) NOT NULL,
  ward VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 7) NULL,
  longitude DECIMAL(10, 7) NULL,
  description TEXT NOT NULL,
  department VARCHAR(180) NULL,
  status ENUM('Submitted', 'Assigned', 'In Progress', 'Resolved') NOT NULL DEFAULT 'Submitted',
  priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
  ai_confidence VARCHAR(50) NULL,
  ai_summary TEXT NULL,
  image_url TEXT NULL,
  upvotes INT NOT NULL DEFAULT 1,
  filed_date VARCHAR(50) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_complaints_mobile (mobile_number),
  INDEX idx_complaints_ward_category (ward, category),
  INDEX idx_complaints_status (status)
);

CREATE TABLE IF NOT EXISTS complaint_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id INT NOT NULL,
  stage VARCHAR(50) NOT NULL,
  message VARCHAR(500) NOT NULL,
  dot_color VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_complaint
    FOREIGN KEY (complaint_id) REFERENCES complaints(id)
    ON DELETE CASCADE,
  INDEX idx_history_complaint (complaint_id)
);

