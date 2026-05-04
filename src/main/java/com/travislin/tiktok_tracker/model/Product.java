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
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String productId;

    @Column(nullable = false)
    private String title;

    private String category;
    private String shopName;
    private String sellerId;
    private String imageUrl;
    private String productUrl;
    private Double rating;
    private LocalDateTime firstSeen;
    private LocalDateTime lastUpdated;
}