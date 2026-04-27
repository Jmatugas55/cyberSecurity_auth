-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 27, 2026 at 05:44 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `authdb`
--

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `department_id` int(11) NOT NULL,
  `department_name` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`department_id`, `department_name`) VALUES
(1, 'IT DEPARTMENT');

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `employee_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `department_id` int(11) DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `contact_number` varchar(50) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`employee_id`, `user_id`, `department_id`, `first_name`, `last_name`, `contact_number`, `address`, `created_at`) VALUES
(1, 2, 1, 'jboy', 'Matugas', '09380143953', '12345', '2026-04-27 00:56:22'),
(2, 3, NULL, NULL, NULL, NULL, NULL, '2026-04-27 00:57:09');

-- --------------------------------------------------------

--
-- Table structure for table `login_attempts`
--

CREATE TABLE `login_attempts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `success` tinyint(1) DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `login_attempts`
--

INSERT INTO `login_attempts` (`id`, `user_id`, `email`, `ip_address`, `success`, `timestamp`) VALUES
(1, 1, 'admin@example.com', '127.0.0.1', 1, '2026-04-26 16:54:20'),
(2, 2, 'j@gmail.com', '127.0.0.1', 1, '2026-04-26 16:57:22'),
(3, 1, 'admin@example.com', '127.0.0.1', 1, '2026-04-26 17:02:11'),
(4, 2, 'j@gmail.com', '127.0.0.1', 1, '2026-04-26 17:03:01'),
(7, 4, 'admin@example.com', '127.0.0.1', 1, '2026-04-26 17:15:40'),
(8, 4, 'admin@example.com', '127.0.0.1', 1, '2026-04-26 17:17:48'),
(9, 4, 'admin@example.com', '127.0.0.1', 1, '2026-04-26 17:33:42'),
(10, 3, 'k@gmail.com', '127.0.0.1', 0, '2026-04-26 17:34:02'),
(11, 3, 'k@gmail.com', '127.0.0.1', 0, '2026-04-26 17:34:03'),
(12, 3, 'k@gmail.com', '127.0.0.1', 0, '2026-04-26 17:34:04'),
(13, 3, 'k@gmail.com', '127.0.0.1', 0, '2026-04-26 17:34:04'),
(14, 3, 'k@gmail.com', '127.0.0.1', 0, '2026-04-26 17:34:05'),
(15, 4, 'admin@example.com', '127.0.0.1', 1, '2026-04-26 17:34:15'),
(17, 4, 'admin@example.com', '127.0.0.1', 1, '2026-04-26 17:35:04'),
(18, 4, 'admin@example.com', '127.0.0.1', 1, '2026-04-27 15:00:31'),
(19, 3, 'k@gmail.com', '127.0.0.1', 0, '2026-04-27 15:26:53'),
(20, 4, 'admin@example.com', '127.0.0.1', 1, '2026-04-27 15:27:08'),
(21, 4, 'admin@example.com', '127.0.0.1', 1, '2026-04-27 15:28:58'),
(22, 2, 'j@gmail.com', '127.0.0.1', 1, '2026-04-27 15:38:21'),
(23, 4, 'admin@example.com', '127.0.0.1', 1, '2026-04-27 15:38:39'),
(24, 5, 'admin@gmail.com', '127.0.0.1', 1, '2026-04-27 15:43:02');

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `token` varchar(255) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL,
  `reset_method` varchar(20) NOT NULL,
  `reset_key` varchar(255) DEFAULT NULL,
  `security_question` varchar(255) DEFAULT NULL,
  `security_answer` varchar(255) DEFAULT NULL,
  `blocked_until` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `role`, `reset_method`, `reset_key`, `security_question`, `security_answer`, `blocked_until`, `created_at`) VALUES
(1, 'admin@gmail.com\r\n', '$2b$12$M61chfigBrk1pckSQb2OAujnmVzTs4Ny07vWOwYFSQ42l3xYUniZW', 'admin', 'key', 'AdminKey-001', NULL, NULL, NULL, '2026-04-27 00:53:11'),
(2, 'j@gmail.com', '$2b$12$6dyJNYtUj65tvaT6KScU5eym9.VAzN1BIzWnzB5MppTCYdbBc3Tmi', 'employee', 'key', 'TempKey-1234', NULL, NULL, NULL, '2026-04-27 00:56:22'),
(3, 'k@gmail.com', '$2b$12$5HFzHxu380EucvGhLFvFaeurdSdIFTOkkAqlsjAUK0ZNjByoaWU0i', 'employee', 'question', NULL, 'What was your first pet\\\'s name?', '$2b$12$l5gxt2ulAnR940RSQUgnLeubx.e5LPgiQdgLVwqwyZZV880HVbuwe', '2026-04-27 15:41:53', '2026-04-27 00:57:09'),
(4, 'admin@example.com', '$2b$12$b.carXdBNYv5akkviYSKyestLhIDjlb6pU82GbchDJ.Oleo.WPuRq', 'admin', 'key', 'AdminKey-001', NULL, NULL, NULL, '2026-04-27 01:07:33'),
(5, 'admin@gmail.com', '$2b$12$30cay74HHF2Si42QA7GcZu99hslqTMsxIow5Hf0v94knibbem6Inq', 'admin', 'key', 'AdminKey-001', NULL, NULL, NULL, '2026-04-27 23:42:47');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`department_id`),
  ADD UNIQUE KEY `department_name` (`department_name`),
  ADD KEY `ix_departments_department_id` (`department_id`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`employee_id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `ix_employees_employee_id` (`employee_id`);

--
-- Indexes for table `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `ix_login_attempts_id` (`id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_password_resets_token` (`token`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `ix_password_resets_id` (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_users_email` (`email`),
  ADD KEY `ix_users_id` (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `department_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `employee_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `login_attempts`
--
ALTER TABLE `login_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employees_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`);

--
-- Constraints for table `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD CONSTRAINT `login_attempts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
