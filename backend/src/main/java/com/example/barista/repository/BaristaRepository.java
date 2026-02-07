package com.example.barista.repository;

import com.example.barista.model.Barista;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BaristaRepository extends JpaRepository<Barista, Long> {
}
