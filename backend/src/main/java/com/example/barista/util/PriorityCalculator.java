package com.example.barista.util;

import com.example.barista.model.Order;
import java.time.Duration;
import java.time.LocalDateTime;

public class PriorityCalculator {

    public static double calculate(Order order) {

        long waitMinutes = Duration.between(
                order.getArrivalTime(),
                LocalDateTime.now()
        ).toMinutes();

        double waitScore = Math.min(waitMinutes * 4, 40);
        double complexityScore = (6 - order.getPrepTime()) * 4;
        double loyaltyScore = order.isLoyaltyCustomer() ? 10 : 0;
        double urgencyScore = waitMinutes >= 8 ? 25 : waitMinutes * 3;
        double emergencyBoost = waitMinutes >= 8 ? 50 : 0;
        double fairnessPenalty = order.getSkippedByLaterCount() > 3 ? 15 : 0;
        double rushScore = order.isRushOrder() ? 5 : 0;

        return waitScore + complexityScore + loyaltyScore + urgencyScore + emergencyBoost + rushScore - fairnessPenalty;
    }
}
