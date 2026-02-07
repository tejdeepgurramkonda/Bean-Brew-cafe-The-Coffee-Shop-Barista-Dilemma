package com.example.barista.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String drinkType;
    private int prepTime; // minutes
    private LocalDateTime arrivalTime;

    private String customerName;
    private String customerPhone;
    private Long customerId;

    private boolean loyaltyCustomer;
    private boolean rushOrder;

    private double priorityScore;

    private String status; // WAITING, IN_PROGRESS, COMPLETED

    private int skippedByLaterCount;

    private Long assignedBaristaId;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}
