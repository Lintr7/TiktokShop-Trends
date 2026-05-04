package com.travislin.tiktok_tracker.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.travislin.tiktok_tracker.model.Product;
import com.travislin.tiktok_tracker.model.ProductSnapshot;
import com.travislin.tiktok_tracker.model.Shop;
import com.travislin.tiktok_tracker.model.ShopSnapshot;
import com.travislin.tiktok_tracker.repository.ProductRepository;
import com.travislin.tiktok_tracker.repository.ProductSnapshotRepository;
import com.travislin.tiktok_tracker.repository.ShopRepository;
import com.travislin.tiktok_tracker.repository.ShopSnapshotRepository;
import com.travislin.tiktok_tracker.service.TikTokShopService;

@RestController
@RequestMapping("/api")
public class TikTokController {

    private final TikTokShopService shopService;
    private final ProductRepository productRepository;
    private final ProductSnapshotRepository productSnapshotRepository;
    private final ShopRepository shopRepository;
    private final ShopSnapshotRepository shopSnapshotRepository;

    public TikTokController(TikTokShopService shopService,
                             ProductRepository productRepository,
                             ProductSnapshotRepository productSnapshotRepository,
                             ShopRepository shopRepository,
                             ShopSnapshotRepository shopSnapshotRepository) {
        this.shopService = shopService;
        this.productRepository = productRepository;
        this.productSnapshotRepository = productSnapshotRepository;
        this.shopRepository = shopRepository;
        this.shopSnapshotRepository = shopSnapshotRepository;
    }

    // ── Products ──────────────────────────────────────────────────────────────

    @PostMapping("/products/track")
    public ResponseEntity<?> trackProduct(@RequestParam String url) {
        try {
            Product product = shopService.trackProduct(url);
            return ResponseEntity.ok(product);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productRepository.findAll());
    }

    @GetMapping("/products/{productId}/history")
    public ResponseEntity<?> getProductHistory(@PathVariable String productId) {
        Optional<Product> product = productRepository.findByProductId(productId);
        if (product.isEmpty()) return ResponseEntity.notFound().build();
        List<ProductSnapshot> snapshots = productSnapshotRepository
            .findByProductOrderBySnapshotDateAsc(product.get());
        return ResponseEntity.ok(snapshots);
    }

    @PostMapping("/products/{productId}/refresh")
    public ResponseEntity<?> refreshProduct(@PathVariable String productId) {
        Optional<Product> product = productRepository.findByProductId(productId);
        if (product.isEmpty()) return ResponseEntity.notFound().build();
        try {
            shopService.trackProduct(product.get().getProductUrl());
            return ResponseEntity.ok("Refreshed");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Shops ─────────────────────────────────────────────────────────────────

    @PostMapping("/shops/track")
    public ResponseEntity<?> trackShop(@RequestParam String url) {
        try {
            Shop shop = shopService.trackShop(url);
            return ResponseEntity.ok(shop);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/shops")
    public ResponseEntity<List<Shop>> getAllShops() {
        return ResponseEntity.ok(shopRepository.findAll());
    }

    @GetMapping("/shops/{sellerId}/history")
    public ResponseEntity<?> getShopHistory(@PathVariable String sellerId) {
        Optional<Shop> shop = shopRepository.findBySellerId(sellerId);
        if (shop.isEmpty()) return ResponseEntity.notFound().build();
        List<ShopSnapshot> snapshots = shopSnapshotRepository
            .findByShopOrderBySnapshotDateAsc(shop.get());
        return ResponseEntity.ok(snapshots);
    }

    @PostMapping("/shops/{sellerId}/refresh")
    public ResponseEntity<?> refreshShop(@PathVariable String sellerId) {
        Optional<Shop> shop = shopRepository.findBySellerId(sellerId);
        if (shop.isEmpty()) return ResponseEntity.notFound().build();
        try {
            shopService.trackShop(shop.get().getShopUrl());
            return ResponseEntity.ok("Refreshed");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}