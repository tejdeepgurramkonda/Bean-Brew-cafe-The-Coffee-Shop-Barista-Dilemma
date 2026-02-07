package com.example.barista.controller;

import com.example.barista.dto.CreateOrderRequest;
import com.example.barista.model.Barista;
import com.example.barista.model.Order;
import com.example.barista.repository.BaristaRepository;
import com.example.barista.service.OrderService;
import com.example.barista.service.SchedulingAgentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final SchedulingAgentService agentService;
    private final BaristaRepository baristaRepository;

    @PostMapping
    public Order createOrder(@Valid @RequestBody CreateOrderRequest request) {
        Order saved = orderService.createOrder(request);
        agentService.assignOrders();
        return saved;
    }

    @GetMapping
    public List<Order> getOrders(@RequestParam(required = false) String status) {
        return orderService.getOrdersByStatus(status);
    }

    @PostMapping("/{id}/complete")
    @ResponseStatus(HttpStatus.OK)
    public Order completeOrder(@PathVariable Long id) {
        Order order = orderService.getOrder(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        order.setStatus("COMPLETED");
        order.setCompletedAt(LocalDateTime.now());

        if (order.getAssignedBaristaId() != null) {
            Barista barista = baristaRepository.findById(order.getAssignedBaristaId())
                    .orElse(null);
            if (barista != null) {
                barista.setAvailable(true);
                barista.setCurrentOrderId(null);
                baristaRepository.save(barista);
            }
        }

        Order saved = orderService.updateOrder(order);
        agentService.assignOrders();
        return saved;
    }
}
