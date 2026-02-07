package com.example.barista.controller;

import com.example.barista.model.Barista;
import com.example.barista.repository.BaristaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/baristas")
@RequiredArgsConstructor
public class BaristaController {

    private final BaristaRepository baristaRepository;

    @GetMapping
    public List<Barista> getBaristas() {
        return baristaRepository.findAll();
    }

    @PostMapping("/seed")
    @ResponseStatus(HttpStatus.CREATED)
    public List<Barista> seedBaristas(@RequestParam(defaultValue = "3") int count) {
        int safeCount = Math.min(Math.max(count, 1), 3);
        List<Barista> existing = baristaRepository.findAll();
        if (!existing.isEmpty()) {
            return existing;
        }

        List<Barista> created = new ArrayList<>();
        String[] baristaNames = {"Emma", "Liam", "Sophia"};
        for (int i = 1; i <= safeCount; i++) {
            Barista barista = Barista.builder()
                    .name(baristaNames[i - 1])
                    .available(true)
                    .workloadMinutes(0)
                    .currentOrderId(null)
                    .build();
            created.add(baristaRepository.save(barista));
        }

        return created;
    }
}
