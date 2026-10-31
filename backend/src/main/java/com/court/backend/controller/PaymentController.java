package com.court.backend.controller;

import com.court.backend.dto.request.CreatePaymentRequest;
import com.court.backend.dto.response.PageResponse;
import com.court.backend.dto.response.PaymentResponse;
import com.court.backend.dto.response.PaymentUrlResponse;
import com.court.backend.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@PreAuthorize("hasRole('USER')")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/vnpay")
    public ResponseEntity<PaymentUrlResponse> createVnpay(@AuthenticationPrincipal Jwt jwt,
                                                          @Valid @RequestBody CreatePaymentRequest request,
                                                          HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                paymentService.createVnpayPayment(currentUserId(jwt), request, httpRequest.getRemoteAddr()));
    }

    @GetMapping("/my")
    public PageResponse<PaymentResponse> listMine(@AuthenticationPrincipal Jwt jwt,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "10") int size) {
        return paymentService.listMine(currentUserId(jwt), page, size);
    }

    @GetMapping("/{id}")
    public PaymentResponse getMine(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return paymentService.getMine(currentUserId(jwt), id);
    }

    private Long currentUserId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}