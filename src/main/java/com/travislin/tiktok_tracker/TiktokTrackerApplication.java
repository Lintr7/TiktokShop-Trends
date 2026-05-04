package com.travislin.tiktok_tracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TiktokTrackerApplication {

	public static void main(String[] args) {
		SpringApplication.run(TiktokTrackerApplication.class, args);
	}

}