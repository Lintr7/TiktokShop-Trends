package com.travislin.tiktok_tracker.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "shops")
public class Shop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String sellerId;

    private String shopName;
    private String shopImageUrl;
    private String shopUrl;
    private String region;
    private LocalDateTime firstSeen;
    private LocalDateTime lastUpdated;
}