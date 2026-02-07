package com.example.barista.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsTestCaseDto {

    private String id;
    private String label;
    private List<AnalyticsOrderDto> orders;
    private double averageWaitingMinutes;
    private double averageTurnaroundMinutes;
}
