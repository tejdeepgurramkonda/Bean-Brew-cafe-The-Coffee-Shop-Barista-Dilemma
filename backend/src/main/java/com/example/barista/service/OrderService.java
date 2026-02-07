package com.example.barista.service;

import com.example.barista.dto.CreateOrderRequest;
import com.example.barista.model.Order;
import com.example.barista.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final Map<String, Integer> PREP_TIME_BY_DRINK = Map.of(
            "Cold Brew", 1,
            "Espresso", 2,
            "Americano", 2,
            "Cappuccino", 4,
            "Latte", 4,
            "Specialty", 6,
            "Mocha", 6
    );

    private final OrderRepository orderRepository;

    public Order createOrder(CreateOrderRequest request) {
        int prepTime = PREP_TIME_BY_DRINK.getOrDefault(request.getDrinkType(), 4);

        Order order = Order.builder()
                .drinkType(request.getDrinkType())
                .prepTime(prepTime)
                .arrivalTime(LocalDateTime.now())
            .customerName(request.getCustomerName())
            .customerPhone(request.getCustomerPhone())
            .customerId(0L)
                .loyaltyCustomer(request.isLoyaltyCustomer())
                .rushOrder(request.isRushOrder())
                .priorityScore(0)
                .status("WAITING")
                .build();

        return orderRepository.save(order);
    }

    public List<Order> getOrdersByStatus(String status) {
        if (status == null || status.isBlank()) {
            return orderRepository.findAll();
        }
        return orderRepository.findByStatus(status.toUpperCase());
    }

    public Optional<Order> getOrder(Long id) {
        return orderRepository.findById(id);
    }

    public Order updateOrder(Order order) {
        return orderRepository.save(order);
    }
}
