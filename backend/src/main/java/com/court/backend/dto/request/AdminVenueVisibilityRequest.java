package com.court.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminVenueVisibilityRequest(
    @NotNull Boolean hidden, @Size(max = 2000) String reason) {}
