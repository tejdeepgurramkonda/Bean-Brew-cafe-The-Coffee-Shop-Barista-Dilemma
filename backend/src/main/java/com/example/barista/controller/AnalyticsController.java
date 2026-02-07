package com.example.barista.controller;

import com.example.barista.dto.AnalyticsResponseDto;
import com.example.barista.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/test-cases")
    public AnalyticsResponseDto getTestCases(
            @RequestParam(defaultValue = "10") int testCases,
            @RequestParam(defaultValue = "200") int minOrders,
            @RequestParam(defaultValue = "300") int maxOrders
    ) {
        return analyticsService.generateTestCases(testCases, minOrders, maxOrders);
    }
}
