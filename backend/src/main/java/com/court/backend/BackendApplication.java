package com.court.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	public CommandLineRunner initDatabase(JdbcTemplate jdbcTemplate) {
		return args -> {
			try {
				jdbcTemplate.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT");
				jdbcTemplate.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ");
				jdbcTemplate.execute(
						"ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by BIGINT REFERENCES users(id)");
				jdbcTemplate.execute(
						"ALTER TABLE bookings ADD COLUMN IF NOT EXISTS policy_cancellation_deadline_hours INT");
				jdbcTemplate.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS policy_deposit_refundable BOOLEAN");
				jdbcTemplate.execute(
						"ALTER TABLE bookings ADD COLUMN IF NOT EXISTS policy_full_payment_refundable BOOLEAN");
			} catch (Exception e) {
				System.err.println("Database init warning: " + e.getMessage());
			}
		};
	}
}
