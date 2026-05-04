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
@Table(name = "product_snapshots", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"product_id", "snapshot_date"})
})
public class ProductSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private LocalDate snapshotDate;

    private Double price;
    private Double originalPrice;
    private Integer sold;
    private Integer stock;
    private Integer reviews;
    private Double rating;
    private String discount;
}