package com.example.barista.dto;

import com.example.barista.model.AuthProvider;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponse {
    private Long id;
    private String name;
    private String email;
    private AuthProvider provider;
}
