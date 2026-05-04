package com.travislin.tiktok_tracker.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

@Data
@Entity
@Table(name = "shop_snapshots", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"shop_id", "snapshot_date"})
})
public class ShopSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @Column(nullable = false)
    private LocalDate snapshotDate;

    private Long totalSoldCount;
    private Double totalRevenueEstimate;
    private Integer shopPerformance;
    private Double shopRating;
    private Long followersCount;
    private Integer reviewCount;
    private Integer onSellProductCount;
    private Integer productSatisfactionScore;
    private String topProductId1;
    private String topProductId2;
    private String topProductId3;
}