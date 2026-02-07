package com.example.barista.service;

import com.example.barista.dto.AnalyticsOrderDto;
import com.example.barista.dto.AnalyticsResponseDto;
import com.example.barista.dto.AnalyticsTestCaseDto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private static final List<DrinkProfile> DRINKS = List.of(
            new DrinkProfile("Cold Brew", 2, 5),
            new DrinkProfile("Espresso", 1, 4),
            new DrinkProfile("Americano", 2, 5),
            new DrinkProfile("Cappuccino", 3, 6),
            new DrinkProfile("Latte", 3, 7),
            new DrinkProfile("Mocha", 4, 8)
    );

    private static final List<String> BARISTAS = List.of(
            "Ava",
            "Noah",
            "Maya",
            "Ethan",
            "Ivy"
    );

    public AnalyticsResponseDto generateTestCases(int testCaseCount, int minOrders, int maxOrders) {
        int safeCases = clamp(testCaseCount, 1, 20);
        int safeMin = Math.max(1, minOrders);
        int safeMax = Math.max(safeMin, maxOrders);

        List<AnalyticsTestCaseDto> cases = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (int caseIndex = 0; caseIndex < safeCases; caseIndex++) {
            int orderCount = randomBetween(safeMin, safeMax);
            LocalDateTime baseDate = now.minusDays(safeCases - 1L - caseIndex);
            List<OrderSpec> specs = buildOrderSpecs(orderCount, baseDate, caseIndex);
            SimulationResult result = simulateSchedule(specs);
            AnalyticsTestCaseDto testCase = new AnalyticsTestCaseDto(
                "case-" + (caseIndex + 1),
                "Test Case " + (caseIndex + 1),
                result.getOrders(),
                result.getAverageWaitingMinutes(),
                result.getAverageTurnaroundMinutes()
            );
            cases.add(testCase);
        }

        return new AnalyticsResponseDto(cases);
    }

    private List<OrderSpec> buildOrderSpecs(int count, LocalDateTime baseDate, int caseIndex) {
        List<OrderSpec> specs = new ArrayList<>();
        for (int index = 0; index < count; index++) {
            DrinkProfile drink = pickRandom(DRINKS);
            String barista = pickRandom(BARISTAS);
            int offsetMinutes = randomBetween(0, 360);
            LocalDateTime arrivalTime = baseDate.plusMinutes(offsetMinutes);
            int priority = randomBetween(1, 5);
            int prepTime = buildPrepTime(drink);
            String orderId = String.format("TC%d-%03d", caseIndex + 1, index + 1);

            specs.add(new OrderSpec(
                    orderId,
                    "Customer " + (index + 1),
                    drink.getName(),
                    barista,
                    arrivalTime,
                    priority,
                    prepTime
            ));
        }

        specs.sort(Comparator.comparing(OrderSpec::getArrivalTime));
        return specs;
    }

    private SimulationResult simulateSchedule(List<OrderSpec> specs) {
        Map<String, List<OrderSpec>> byBarista = specs.stream()
            .collect(Collectors.groupingBy(OrderSpec::getBarista));

        List<AnalyticsOrderDto> scheduled = new ArrayList<>();
        for (List<OrderSpec> baristaOrders : byBarista.values()) {
            scheduled.addAll(simulateBaristaQueue(baristaOrders));
        }

        double totalWait = scheduled.stream().mapToDouble(AnalyticsOrderDto::getWaitingMinutes).sum();
        double totalTurnaround = scheduled.stream().mapToDouble(AnalyticsOrderDto::getTurnaroundMinutes).sum();
        double avgWait = scheduled.isEmpty() ? 0 : totalWait / scheduled.size();
        double avgTurnaround = scheduled.isEmpty() ? 0 : totalTurnaround / scheduled.size();

        scheduled.sort(Comparator.comparing(AnalyticsOrderDto::getArrivalTime));
        return new SimulationResult(scheduled, avgWait, avgTurnaround);
    }

        private List<AnalyticsOrderDto> simulateBaristaQueue(List<OrderSpec> specs) {
        List<OrderSpec> orderedSpecs = new ArrayList<>(specs);
        orderedSpecs.sort(Comparator.comparing(OrderSpec::getArrivalTime));

        PriorityQueue<OrderSpec> readyQueue = new PriorityQueue<>(
            Comparator.comparingInt(OrderSpec::getPriority).reversed()
                .thenComparing(OrderSpec::getArrivalTime)
                .thenComparing(OrderSpec::getOrderId)
        );

        List<AnalyticsOrderDto> scheduled = new ArrayList<>();
        int index = 0;
        LocalDateTime currentTime = orderedSpecs.isEmpty()
            ? LocalDateTime.now()
            : orderedSpecs.get(0).getArrivalTime();

        while (index < orderedSpecs.size() || !readyQueue.isEmpty()) {
            while (index < orderedSpecs.size()
                && !orderedSpecs.get(index).getArrivalTime().isAfter(currentTime)) {
            readyQueue.offer(orderedSpecs.get(index));
            index++;
            }

            if (readyQueue.isEmpty()) {
            currentTime = orderedSpecs.get(index).getArrivalTime();
            continue;
            }

            OrderSpec next = readyQueue.poll();
            LocalDateTime startTime = currentTime.isAfter(next.getArrivalTime())
                ? currentTime
                : next.getArrivalTime();
            LocalDateTime completionTime = startTime.plusMinutes(next.getPrepTime());

            long waitingMinutes = java.time.Duration.between(next.getArrivalTime(), startTime).toMinutes();
            long turnaroundMinutes = java.time.Duration.between(next.getArrivalTime(), completionTime).toMinutes();

            AnalyticsOrderDto order = new AnalyticsOrderDto(
                next.getOrderId(),
                next.getCustomerName(),
                next.getDrinkType(),
                next.getBarista(),
                next.getArrivalTime(),
                completionTime,
                waitingMinutes,
                next.getOrderId(),
                next.getArrivalTime(),
                next.getPriority(),
                next.getPrepTime(),
                startTime,
                completionTime,
                waitingMinutes,
                turnaroundMinutes
            );
            scheduled.add(order);
            currentTime = completionTime;
        }

        return scheduled;
        }

    private int randomBetween(int min, int max) {
        return ThreadLocalRandom.current().nextInt(min, max + 1);
    }

    private int buildPrepTime(DrinkProfile drink) {
        int base = randomBetween(drink.getMinWait(), drink.getMaxWait());
        int buffer = randomBetween(0, 2);
        int waitMinutes = base + buffer;
        boolean addOverage = ThreadLocalRandom.current().nextInt(100) < 3;
        if (addOverage) {
            waitMinutes += randomBetween(1, 3);
        }
        return Math.max(1, waitMinutes);
    }

    private <T> T pickRandom(List<T> items) {
        return items.get(randomBetween(0, items.size() - 1));
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(value, max));
    }

    @Getter
    @AllArgsConstructor
    private static class DrinkProfile {
        private final String name;
        private final int minWait;
        private final int maxWait;
    }

    @Getter
    @AllArgsConstructor
    private static class OrderSpec {
        private final String orderId;
        private final String customerName;
        private final String drinkType;
        private final String barista;
        private final LocalDateTime arrivalTime;
        private final int priority;
        private final int prepTime;
    }

    @Getter
    @AllArgsConstructor
    private static class SimulationResult {
        private final List<AnalyticsOrderDto> orders;
        private final double averageWaitingMinutes;
        private final double averageTurnaroundMinutes;
    }
}
