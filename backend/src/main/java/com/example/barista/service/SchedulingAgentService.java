package com.example.barista.service;

import com.example.barista.model.Barista;
import com.example.barista.model.Order;
import com.example.barista.repository.BaristaRepository;
import com.example.barista.repository.OrderRepository;
import com.example.barista.util.PriorityCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SchedulingAgentService {

    private final OrderRepository orderRepository;
    private final BaristaRepository baristaRepository;

    @Scheduled(fixedRate = 30000)
    public void assignOrders() {

        List<Order> waitingOrders = orderRepository.findByStatusOrderByArrivalTimeAsc("WAITING");
        List<Barista> baristas = baristaRepository.findAll();

        waitingOrders.forEach(order ->
                order.setPriorityScore(PriorityCalculator.calculate(order))
        );

        waitingOrders.sort(
                Comparator.comparingDouble(Order::getPriorityScore).reversed()
        );

        double averageWorkload = baristas.stream()
                .mapToInt(Barista::getWorkloadMinutes)
                .average()
                .orElse(0);

        for (Barista barista : baristas) {
            if (barista.isAvailable() && !waitingOrders.isEmpty()) {

                Order order = getEmergencyOrder(waitingOrders)
                        .orElseGet(() -> selectOrderForBarista(barista, waitingOrders, averageWorkload));

                waitingOrders.remove(order);
                order.setStatus("IN_PROGRESS");
                order.setAssignedBaristaId(barista.getId());
                order.setStartedAt(LocalDateTime.now());

                barista.setAvailable(false);
                barista.setCurrentOrderId(order.getId());
                barista.setWorkloadMinutes(
                        barista.getWorkloadMinutes() + order.getPrepTime()
                );

                incrementFairnessSkips(waitingOrders, order);

                orderRepository.save(order);
                baristaRepository.save(barista);
            }
        }
    }

    @Scheduled(fixedRate = 5000)
    public void completeFinishedOrders() {
        List<Order> inProgressOrders = orderRepository.findByStatus("IN_PROGRESS");
        LocalDateTime now = LocalDateTime.now();
        boolean anyCompleted = false;

        for (Order order : inProgressOrders) {
            LocalDateTime startedAt = order.getStartedAt();
            if (startedAt == null) {
                continue;
            }

            LocalDateTime expectedComplete = startedAt.plusMinutes(order.getPrepTime());
            if (now.isBefore(expectedComplete)) {
                continue;
            }

            order.setStatus("COMPLETED");
            order.setCompletedAt(now);
            anyCompleted = true;

            if (order.getAssignedBaristaId() != null) {
                baristaRepository.findById(order.getAssignedBaristaId())
                        .ifPresent(barista -> {
                            barista.setAvailable(true);
                            barista.setCurrentOrderId(null);
                            baristaRepository.save(barista);
                        });
            }

            orderRepository.save(order);
        }

        if (anyCompleted) {
            assignOrders();
        }
    }

    private Order selectOrderForBarista(Barista barista, List<Order> waitingOrders, double averageWorkload) {
        if (averageWorkload <= 0) {
            return waitingOrders.get(0);
        }

        double ratio = barista.getWorkloadMinutes() / averageWorkload;
        boolean overloaded = ratio > 1.2;
        boolean underutilized = ratio < 0.8;

        if (overloaded) {
            Optional<Order> quickOrder = waitingOrders.stream()
                    .filter(order -> order.getPrepTime() <= 2)
                    .findFirst();
            if (quickOrder.isPresent()) {
                return quickOrder.get();
            }
        }

        if (underutilized) {
            Optional<Order> complexOrder = waitingOrders.stream()
                    .filter(order -> order.getPrepTime() >= 4)
                    .findFirst();
            if (complexOrder.isPresent()) {
                return complexOrder.get();
            }
        }

        return waitingOrders.get(0);
    }

    private void incrementFairnessSkips(List<Order> remainingOrders, Order servedOrder) {
        for (Order order : remainingOrders) {
            if (order.getArrivalTime().isBefore(servedOrder.getArrivalTime())) {
                order.setSkippedByLaterCount(order.getSkippedByLaterCount() + 1);
            }
        }
        orderRepository.saveAll(remainingOrders);
    }

    private Optional<Order> getEmergencyOrder(List<Order> waitingOrders) {
        LocalDateTime now = LocalDateTime.now();
        return waitingOrders.stream()
                .filter(order -> Duration.between(order.getArrivalTime(), now).toMinutes() >= 10)
                .findFirst();
    }
}
