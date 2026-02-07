package com.example.barista.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsOrderDto {

    private String id;
    private String customerName;
    private String drinkType;
    private String barista;
    private LocalDateTime orderedAt;
    private LocalDateTime completedAt;
    private double waitMinutes;
    private String orderId;
    private LocalDateTime arrivalTime;
    private int priority;
    private int prepTime;
    private LocalDateTime startTime;
    private LocalDateTime completionTime;
    private double waitingMinutes;
    private double turnaroundMinutes;
}
