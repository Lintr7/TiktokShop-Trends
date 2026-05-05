package com.travislin.tiktok_tracker.service;

import com.travislin.tiktok_tracker.model.Product;
import com.travislin.tiktok_tracker.model.Shop;
import com.travislin.tiktok_tracker.repository.ProductRepository;
import com.travislin.tiktok_tracker.repository.ShopRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ScheduledTasks {

    private final TikTokShopService shopService;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;

    public ScheduledTasks(TikTokShopService shopService,
                          ProductRepository productRepository,
                          ShopRepository shopRepository) {
        this.shopService = shopService;
        this.productRepository = productRepository;
        this.shopRepository = shopRepository;
    }

    @Scheduled(cron = "0 0 */6 * * *")
    public void refreshAll() {
        System.out.println("Starting daily refresh...");

        List<Product> products = productRepository.findAll();
        for (Product product : products) {
            try {
                Thread.sleep(500);
                shopService.trackProduct(product.getProductUrl());
                System.out.println("Refreshed product: " + product.getProductId());
            } catch (Exception e) {
                System.err.println("Failed to refresh product " + product.getProductId() + ": " + e.getMessage());
            }
        }

        List<Shop> shops = shopRepository.findAll();
        for (Shop shop : shops) {
            try {
                Thread.sleep(500);
                shopService.trackShop(shop.getShopUrl());
                System.out.println("Refreshed shop: " + shop.getSellerId());
            } catch (Exception e) {
                System.err.println("Failed to refresh shop " + shop.getSellerId() + ": " + e.getMessage());
            }
        }

        System.out.println("Daily refresh complete.");
    }
}
