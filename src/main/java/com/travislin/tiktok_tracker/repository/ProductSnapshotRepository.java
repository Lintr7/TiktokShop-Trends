package com.travislin.tiktok_tracker.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.travislin.tiktok_tracker.model.Product;
import com.travislin.tiktok_tracker.model.ProductSnapshot;

@Repository
public interface ProductSnapshotRepository extends JpaRepository<ProductSnapshot, Long> {
    List<ProductSnapshot> findByProductOrderBySnapshotDateAsc(Product product);
    Optional<ProductSnapshot> findFirstByProductAndSnapshotDateAfter(Product product, LocalDateTime after);
}