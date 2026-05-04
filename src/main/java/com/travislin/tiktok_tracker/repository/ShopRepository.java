package com.travislin.tiktok_tracker.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.travislin.tiktok_tracker.model.Shop;

@Repository
public interface ShopRepository extends JpaRepository<Shop, Long> {
    Optional<Shop> findBySellerId(String sellerId);
}