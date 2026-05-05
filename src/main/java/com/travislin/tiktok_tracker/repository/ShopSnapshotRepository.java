package com.travislin.tiktok_tracker.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.travislin.tiktok_tracker.model.Shop;
import com.travislin.tiktok_tracker.model.ShopSnapshot;

@Repository
public interface ShopSnapshotRepository extends JpaRepository<ShopSnapshot, Long> {
    List<ShopSnapshot> findByShopOrderBySnapshotDateAsc(Shop shop);
    Optional<ShopSnapshot> findFirstByShopAndSnapshotDateAfter(Shop shop, LocalDateTime after);
}