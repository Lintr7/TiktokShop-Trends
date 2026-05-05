package com.travislin.tiktok_tracker.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travislin.tiktok_tracker.model.Product;
import com.travislin.tiktok_tracker.model.ProductSnapshot;
import com.travislin.tiktok_tracker.model.Shop;
import com.travislin.tiktok_tracker.model.ShopSnapshot;
import com.travislin.tiktok_tracker.repository.ProductRepository;
import com.travislin.tiktok_tracker.repository.ProductSnapshotRepository;
import com.travislin.tiktok_tracker.repository.ShopRepository;
import com.travislin.tiktok_tracker.repository.ShopSnapshotRepository;

@Service
public class TikTokShopService {

    @Value("${rapidapi.key.shop}")
    private String shopApiKey;

    private static final String SHOP_HOST = "tiktok-shop-products-search-reviews.p.rapidapi.com";
    private static final String PRODUCT_URL = "https://tiktok-shop-products-search-reviews.p.rapidapi.com/shop/product";
    private static final String SHOP_PRODUCTS_URL = "https://tiktok-shop-products-search-reviews.p.rapidapi.com/shop/products";

    private final ProductRepository productRepository;
    private final ProductSnapshotRepository productSnapshotRepository;
    private final ShopRepository shopRepository;
    private final ShopSnapshotRepository shopSnapshotRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public TikTokShopService(ProductRepository productRepository,
                              ProductSnapshotRepository productSnapshotRepository,
                              ShopRepository shopRepository,
                              ShopSnapshotRepository shopSnapshotRepository) {
        this.productRepository = productRepository;
        this.productSnapshotRepository = productSnapshotRepository;
        this.shopRepository = shopRepository;
        this.shopSnapshotRepository = shopSnapshotRepository;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public Product trackProduct(String productUrl) throws Exception {
        String[] urlParts = productUrl.split("/");
        String productId = "";
        for (int i = urlParts.length - 1; i >= 0; i--) {
            String part = urlParts[i].split("\\?")[0];
            if (part.matches("\\d+") && !part.isEmpty()) {
                  productId = part;
                  break;
            }
        }
        if (productId.isEmpty()) throw new Exception("Could not extract product ID from URL");

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-RapidAPI-Key", shopApiKey);
        headers.set("X-RapidAPI-Host", SHOP_HOST);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        String url = PRODUCT_URL + "?product_id=" + productId;
        ResponseEntity<String> response = restTemplate.exchange(
            url, HttpMethod.GET, entity, String.class);

        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode data = root.path("data");

        JsonNode productBase = data.path("product_base");
        JsonNode priceNode = productBase.path("price");
        JsonNode seller = data.path("seller");

        String title = productBase.path("title").asText();
        if (title.isEmpty()) {
            for (int i = urlParts.length - 1; i >= 0; i--) {
                if (!urlParts[i].matches("\\d+") && !urlParts[i].isEmpty()) {
                    title = urlParts[i].split("\\?")[0].replace("-", " ");
                    break;
                }
            }
        }

        String imageUrl = "";
        JsonNode images = productBase.path("images");
        JsonNode firstImage = images.path("0");
        if (!firstImage.isMissingNode()) {
            JsonNode urlList = firstImage.path("url_list");
            if (!urlList.isMissingNode()) {
                imageUrl = urlList.path("0").asText();
            }
        }

        String category = productBase.path("category_name").asText();
        String sellerId = seller.path("seller_id").asText();
        String shopName = seller.path("name").asText();
        double rating = data.path("product_detail_review").path("product_rating").asDouble();

        final String finalProductId = productId;
        final String finalTitle = title;

        Product product = productRepository.findByProductId(finalProductId)
            .orElseGet(() -> {
                Product p = new Product();
                p.setProductId(finalProductId);
                p.setProductUrl(productUrl);
                p.setFirstSeen(LocalDateTime.now());
                return p;
            });

        product.setTitle(finalTitle);
        product.setCategory(category);
        product.setShopName(shopName);
        product.setSellerId(sellerId);
        product.setImageUrl(imageUrl);
        product.setRating(rating);
        product.setLastUpdated(LocalDateTime.now());

        productRepository.save(product);
        takeProductSnapshot(product, data, priceNode, productBase);

        return product;
    }

    public Shop trackShop(String shopUrl) throws Exception {
        String[] urlParts = shopUrl.split("/");
        String sellerId = "";
        for (int i = urlParts.length - 1; i >= 0; i--) {
            String part = urlParts[i].split("\\?")[0];
            if (part.matches("\\d+") && !part.isEmpty()) {
                  sellerId = part;
                  break;
            }
        }
        if (sellerId.isEmpty()) throw new Exception("Could not extract seller ID from URL");

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-RapidAPI-Key", shopApiKey);
        headers.set("X-RapidAPI-Host", SHOP_HOST);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        // Fetch all products — paginate
        List<JsonNode> allProducts = new ArrayList<>();
        String cursor = null;
        boolean hasMore = true;

        while (hasMore) {
            String url = SHOP_PRODUCTS_URL + "?url=" + shopUrl + "&shop_id=" + sellerId;
            if (cursor != null) url += "&cursor=" + cursor;

            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode data = root.path("data");
            JsonNode products = data.path("products");

            for (JsonNode p : products) allProducts.add(p);

            hasMore = data.path("has_more").asBoolean(false);
            cursor = data.path("cursor").asText(null);
            if (cursor == null || cursor.isEmpty()) hasMore = false;
            if (hasMore) Thread.sleep(300);
        }

        if (allProducts.isEmpty()) throw new Exception("No products found for shop: " + sellerId);
        
        String top1 = allProducts.size() > 0 ? allProducts.get(0).path("product_id").asText() : null;
        String top2 = allProducts.size() > 1 ? allProducts.get(1).path("product_id").asText() : null;
        String top3 = allProducts.size() > 2 ? allProducts.get(2).path("product_id").asText() : null;

        // Call /shop/product on top product to get shop-level stats
        ResponseEntity<String> topProductResponse = restTemplate.exchange(
            PRODUCT_URL + "?product_id=" + top1, HttpMethod.GET, entity, String.class);

        JsonNode topData = objectMapper.readTree(topProductResponse.getBody()).path("data");
        JsonNode seller = topData.path("seller");

        String shopImageUrl = "";
        JsonNode avatarUrlList = seller.path("avatar").path("url_list");
        if (!avatarUrlList.isMissingNode()) {
            shopImageUrl = avatarUrlList.path("0").asText();
        }

        String shopName = seller.path("name").asText();
        final String finalSellerId = sellerId;

        Shop shop = shopRepository.findBySellerId(finalSellerId)
            .orElseGet(() -> {
                Shop s = new Shop();
                s.setSellerId(finalSellerId);
                s.setFirstSeen(LocalDateTime.now());
                return s;
            });

        shop.setShopName(shopName);
        shop.setShopImageUrl(shopImageUrl);
        shop.setShopUrl(shopUrl);
        shop.setRegion(seller.path("seller_location").asText());
        shop.setLastUpdated(LocalDateTime.now());
        shopRepository.save(shop);

        // Calculate totals only
        long totalSold = 0;
        double totalRevenue = 0.0;
        LocalDate today = LocalDate.now();

        for (JsonNode p : allProducts) {
            long sold = p.path("sold_info").path("sold_count").asLong();
            double price = 0.0;
            try {
                price = Double.parseDouble(
                    p.path("product_price_info").path("sale_price_decimal").asText("0"));
            } catch (NumberFormatException ignored) {}
            totalSold += sold;
            totalRevenue += price * sold;
        }

        // Save only top 3 products with stock
        List<JsonNode> top3Products = allProducts.subList(0, Math.min(3, allProducts.size()));
            for (JsonNode p : top3Products) {
            String productId = p.path("product_id").asText();
            String productTitle = p.path("title").asText();
            String productImageUrl = "";
            JsonNode imgUrlList = p.path("image").path("url_list");
            if (!imgUrlList.isMissingNode()) {
                  productImageUrl = imgUrlList.path("0").asText();
            }

            Product product = productRepository.findByProductId(productId)
                  .orElseGet(() -> {
                        Product pr = new Product();
                        pr.setProductId(productId);
                        pr.setFirstSeen(LocalDateTime.now());
                        return pr;
                  });

            // Fetch full product details for stock and category
            ResponseEntity<String> productDetailResponse = restTemplate.exchange(
                  PRODUCT_URL + "?product_id=" + productId, HttpMethod.GET, entity, String.class);
            JsonNode productDetail = objectMapper.readTree(productDetailResponse.getBody()).path("data");

            product.setTitle(productTitle);
            product.setSellerId(finalSellerId);
            product.setShopName(shopName);
            product.setImageUrl(productImageUrl);
            product.setProductUrl(p.path("seo_url").path("canonical_url").asText());
            product.setRating(p.path("rate_info").path("score").asDouble());
            product.setCategory(productDetail.path("product_base").path("category_name").asText());
            product.setLastUpdated(LocalDateTime.now());
            productRepository.save(product);

            Optional<ProductSnapshot> existingSnapshot = productSnapshotRepository
                  .findByProductAndSnapshotDate(product, today);
            if (existingSnapshot.isEmpty()) {
                  ProductSnapshot snapshot = new ProductSnapshot();
                  snapshot.setProduct(product);
                  snapshot.setSnapshotDate(today);
                  snapshot.setSold((int) p.path("sold_info").path("sold_count").asLong());
                  snapshot.setReviews(p.path("rate_info").path("review_count").asInt());
                  snapshot.setRating(p.path("rate_info").path("score").asDouble());
                  try {
                        snapshot.setPrice(Double.parseDouble(
                        p.path("product_price_info").path("sale_price_decimal").asText("0")));
                        snapshot.setOriginalPrice(Double.parseDouble(
                        p.path("product_price_info").path("origin_price_decimal").asText("0")));
                  } catch (NumberFormatException ignored) {}
                  snapshot.setDiscount(p.path("product_price_info").path("discount_format").asText());
                  snapshot.setStock(productDetail.path("skus").path("0").path("stock").asInt());
                  productSnapshotRepository.save(snapshot);
            }
            }

        // Shop snapshot
        Optional<ShopSnapshot> existingShopSnapshot = shopSnapshotRepository
            .findByShopAndSnapshotDate(shop, today);
        if (existingShopSnapshot.isEmpty()) {
            ShopSnapshot shopSnapshot = new ShopSnapshot();
            shopSnapshot.setShop(shop);
            shopSnapshot.setSnapshotDate(today);
            shopSnapshot.setTotalSoldCount(totalSold);
            shopSnapshot.setTotalRevenueEstimate(totalRevenue);
            shopSnapshot.setTopProductId1(top1);
            shopSnapshot.setTopProductId2(top2);
            shopSnapshot.setTopProductId3(top3);

            JsonNode shopPerformance = topData.path("seller").path("shop_performance");
            shopSnapshot.setShopPerformance(shopPerformance.path("shop_performance_value").asInt());
            String shopRatingStr = seller.path("rating").asText("0");
            shopSnapshot.setShopRating(shopRatingStr.isEmpty() ? 0.0 : Double.parseDouble(shopRatingStr));

            JsonNode detailedMetrics = shopPerformance.path("detailed_metrics");
            for (JsonNode metric : detailedMetrics) {
                if (metric.path("type").asInt() == 1) {
                    shopSnapshot.setProductSatisfactionScore(metric.path("value").asInt());
                }
            }

            JsonNode sellerDetailInfos = topData.path("seller").path("seller_detail_infos");
            for (JsonNode info : sellerDetailInfos) {
                  String key = info.path("key").asText();
                  switch (key) {
                        case "followers_num" -> shopSnapshot.setFollowersCount(info.path("count").asLong());
                        case "review_num" -> shopSnapshot.setReviewCount(info.path("count").asInt());
                        case "items_num" -> shopSnapshot.setOnSellProductCount(info.path("count").asInt());
                  }
            }

            shopSnapshotRepository.save(shopSnapshot);
            System.out.println("Shop snapshot saved: " + finalSellerId);
        }

        return shop;
    }

    public void takeProductSnapshot(Product product, JsonNode data, JsonNode priceNode, JsonNode productBase) {
        LocalDate today = LocalDate.now();

        Optional<ProductSnapshot> existing = productSnapshotRepository
            .findByProductAndSnapshotDate(product, today);
        if (existing.isPresent()) return;

        ProductSnapshot snapshot = new ProductSnapshot();
        snapshot.setProduct(product);
        snapshot.setSnapshotDate(today);

        String realPrice = priceNode.path("real_price").asText().replace("$", "").trim();
      if (realPrice.isEmpty() || realPrice.contains("-")) {
      realPrice = priceNode.path("min_sku_price").asText().trim();
      }

      String originalPrice = priceNode.path("original_price").asText().replace("$", "").trim();
      if (originalPrice.isEmpty() || originalPrice.contains("-")) {
      originalPrice = priceNode.path("min_sku_original_price").asText().trim();
      }
        String discount = priceNode.path("discount").asText();

        if (!realPrice.isEmpty() && !realPrice.equals("null")) {
            try { snapshot.setPrice(Double.parseDouble(realPrice)); } catch (NumberFormatException ignored) {}
        }
        if (!originalPrice.isEmpty() && !originalPrice.equals("null")) {
            try { snapshot.setOriginalPrice(Double.parseDouble(originalPrice)); } catch (NumberFormatException ignored) {}
        }
        if (!discount.isEmpty() && !discount.equals("null")) {
            snapshot.setDiscount(discount);
        }

        snapshot.setSold((int) productBase.path("sold_count").asLong());

        JsonNode review = data.path("product_detail_review");
        snapshot.setRating(review.path("product_rating").asDouble());
        snapshot.setReviews(review.path("review_count").asInt());

        JsonNode skus = data.path("skus");
        JsonNode firstSku = skus.path("0");
        if (!firstSku.isMissingNode()) {
            snapshot.setStock(firstSku.path("stock").asInt());
        }

        productSnapshotRepository.save(snapshot);
        System.out.println("Product snapshot saved: " + product.getProductId());
    }

    public void takeShopSnapshot(JsonNode data, JsonNode seller, String sellerId, String shopName, String productUrl) {
        LocalDate today = LocalDate.now();

        String shopImageUrl = "";
        JsonNode avatarUrlList = seller.path("avatar").path("url_list");
        if (!avatarUrlList.isMissingNode()) {
            shopImageUrl = avatarUrlList.path("0").asText();
        }

        String shopUrl = seller.path("shop_link").asText();
        if (shopUrl.isEmpty() || shopUrl.startsWith("aweme://")) {
            String shopSlug = shopName.toLowerCase().replace(" ", "-");
            shopUrl = "https://www.tiktok.com/shop/store/" + shopSlug + "/" + sellerId;
        }

        Shop shop = shopRepository.findBySellerId(sellerId)
            .orElseGet(() -> {
                Shop s = new Shop();
                s.setSellerId(sellerId);
                s.setFirstSeen(LocalDateTime.now());
                return s;
            });

        shop.setShopName(shopName);
        shop.setShopImageUrl(shopImageUrl);
        shop.setShopUrl(shopUrl);
        shop.setRegion(seller.path("seller_location").asText());
        shop.setLastUpdated(LocalDateTime.now());
        shopRepository.save(shop);

        Optional<ShopSnapshot> existing = shopSnapshotRepository
            .findByShopAndSnapshotDate(shop, today);
        if (existing.isPresent()) return;

        ShopSnapshot snapshot = new ShopSnapshot();
        snapshot.setShop(shop);
        snapshot.setSnapshotDate(today);

        JsonNode shopPerformance = data.path("seller").path("shop_performance");
        String shopRatingStr = seller.path("rating").asText("0");
        snapshot.setShopRating(shopRatingStr.isEmpty() ? 0.0 : Double.parseDouble(shopRatingStr));
        snapshot.setShopPerformance(shopPerformance.path("shop_performance_value").asInt());

        JsonNode detailedMetrics = shopPerformance.path("detailed_metrics");
        for (JsonNode metric : detailedMetrics) {
            if (metric.path("type").asInt() == 1) {
                snapshot.setProductSatisfactionScore(metric.path("value").asInt());
            }
        }

        JsonNode sellerDetailInfos = data.path("seller").path("seller_detail_infos");
        for (JsonNode info : sellerDetailInfos) {
            String key = info.path("key").asText();
                switch (key) {
                    case "followers_num" -> snapshot.setFollowersCount(info.path("count").asLong());
                    case "review_num" -> snapshot.setReviewCount(info.path("count").asInt());
                    case "items_num" -> snapshot.setOnSellProductCount(info.path("count").asInt());
                    case "sales_num" -> snapshot.setTotalSoldCount(info.path("count").asLong());
                }
        }


        shopSnapshotRepository.save(snapshot);
        System.out.println("Shop snapshot saved: " + sellerId);
    }
}