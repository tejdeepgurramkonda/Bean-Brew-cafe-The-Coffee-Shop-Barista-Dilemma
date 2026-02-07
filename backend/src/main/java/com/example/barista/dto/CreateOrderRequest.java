package com.example.barista.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateOrderRequest {

    @NotBlank
    private String drinkType;

    @NotBlank
    private String customerName;

    @NotBlank
    @Pattern(regexp = "[0-9+ -]{7,15}", message = "Invalid phone number")
    private String customerPhone;

    private boolean loyaltyCustomer;
    private boolean rushOrder;
}
