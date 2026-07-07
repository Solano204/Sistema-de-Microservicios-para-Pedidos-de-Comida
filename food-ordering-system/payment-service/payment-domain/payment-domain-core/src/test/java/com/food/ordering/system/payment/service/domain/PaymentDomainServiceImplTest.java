package com.food.ordering.system.payment.service.domain;

import com.food.ordering.system.domain.valueobject.CustomerId;
import com.food.ordering.system.domain.valueobject.Money;
import com.food.ordering.system.domain.valueobject.OrderId;
import com.food.ordering.system.domain.valueobject.PaymentStatus;
import com.food.ordering.system.payment.service.domain.entity.CreditEntry;
import com.food.ordering.system.payment.service.domain.entity.CreditHistory;
import com.food.ordering.system.payment.service.domain.entity.Payment;
import com.food.ordering.system.payment.service.domain.event.PaymentCancelledEvent;
import com.food.ordering.system.payment.service.domain.event.PaymentCompletedEvent;
import com.food.ordering.system.payment.service.domain.event.PaymentEvent;
import com.food.ordering.system.payment.service.domain.event.PaymentFailedEvent;
import com.food.ordering.system.payment.service.domain.valueobject.CreditEntryId;
import com.food.ordering.system.payment.service.domain.valueobject.CreditHistoryId;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static com.food.ordering.system.payment.service.domain.entity.CreditHistory.builder;
import static com.food.ordering.system.payment.service.domain.valueobject.TransactionType.CREDIT;
import static com.food.ordering.system.payment.service.domain.valueobject.TransactionType.DEBIT;
import static org.junit.jupiter.api.Assertions.*;

class PaymentDomainServiceImplTest {

    private final PaymentDomainService paymentDomainService = new PaymentDomainServiceImpl();

    private final CustomerId customerId = new CustomerId(UUID.randomUUID());
    private final OrderId orderId = new OrderId(UUID.randomUUID());

    private Payment payment(BigDecimal price) {
        return Payment.builder()
                .orderId(orderId)
                .customerId(customerId)
                .price(new Money(price))
                .build();
    }

    private CreditEntry creditEntry(BigDecimal totalCredit) {
        return CreditEntry.builder()
                .creditEntryId(new CreditEntryId(UUID.randomUUID()))
                .customerId(customerId)
                .totalCreditAmount(new Money(totalCredit))
                .build();
    }

    private CreditHistory history(BigDecimal amount, com.food.ordering.system.payment.service.domain.valueobject.TransactionType type) {
        return builder()
                .creditHistoryId(new CreditHistoryId(UUID.randomUUID()))
                .customerId(customerId)
                .amount(new Money(amount))
                .transactionType(type)
                .build();
    }

    @Test
    void validateAndInitiatePayment_success() {
        Payment payment = payment(new BigDecimal("100.00"));
        CreditEntry creditEntry = creditEntry(new BigDecimal("200.00"));
        List<CreditHistory> histories = new ArrayList<>(List.of(
                history(new BigDecimal("200.00"), CREDIT)));
        List<String> failureMessages = new ArrayList<>();

        PaymentEvent event = paymentDomainService.validateAndInitiatePayment(payment, creditEntry, histories, failureMessages);

        assertTrue(failureMessages.isEmpty());
        assertInstanceOf(PaymentCompletedEvent.class, event);
        assertEquals(PaymentStatus.COMPLETED, payment.getPaymentStatus());
        assertEquals(new Money(new BigDecimal("100.00")), creditEntry.getTotalCreditAmount());
        assertEquals(2, histories.size());
    }

    @Test
    void validateAndInitiatePayment_insufficientCredit_fails() {
        Payment payment = payment(new BigDecimal("300.00"));
        CreditEntry creditEntry = creditEntry(new BigDecimal("200.00"));
        List<CreditHistory> histories = new ArrayList<>(List.of(
                history(new BigDecimal("200.00"), CREDIT)));
        List<String> failureMessages = new ArrayList<>();

        PaymentEvent event = paymentDomainService.validateAndInitiatePayment(payment, creditEntry, histories, failureMessages);

        assertFalse(failureMessages.isEmpty());
        assertInstanceOf(PaymentFailedEvent.class, event);
        assertEquals(PaymentStatus.FAILED, payment.getPaymentStatus());
        assertTrue(failureMessages.get(0).contains("doesn't have enough credit for payment"));
    }

    @Test
    void validateAndInitiatePayment_creditHistoryMismatch_fails() {
        Payment payment = payment(new BigDecimal("50.00"));
        // creditEntry total does not reconcile with credit history (customer's ledger is inconsistent)
        CreditEntry creditEntry = creditEntry(new BigDecimal("200.00"));
        List<CreditHistory> histories = new ArrayList<>(List.of(
                history(new BigDecimal("100.00"), CREDIT)));
        List<String> failureMessages = new ArrayList<>();

        PaymentEvent event = paymentDomainService.validateAndInitiatePayment(payment, creditEntry, histories, failureMessages);

        assertFalse(failureMessages.isEmpty());
        assertInstanceOf(PaymentFailedEvent.class, event);
        assertTrue(failureMessages.stream().anyMatch(m -> m.contains("Credit history total is not equal")));
    }

    @Test
    void validateAndInitiatePayment_debitExceedsCredit_fails() {
        Payment payment = payment(new BigDecimal("50.00"));
        CreditEntry creditEntry = creditEntry(new BigDecimal("300.00"));
        List<CreditHistory> histories = new ArrayList<>(List.of(
                history(new BigDecimal("300.00"), CREDIT),
                history(new BigDecimal("300.00"), DEBIT)));
        List<String> failureMessages = new ArrayList<>();

        PaymentEvent event = paymentDomainService.validateAndInitiatePayment(payment, creditEntry, histories, failureMessages);

        assertFalse(failureMessages.isEmpty());
        assertInstanceOf(PaymentFailedEvent.class, event);
        assertTrue(failureMessages.stream()
                .anyMatch(m -> m.contains("doesn't have enough credit according to credit history")));
    }

    @Test
    void validateAndCancelPayment_success_refundsCredit() {
        Payment payment = payment(new BigDecimal("100.00"));
        CreditEntry creditEntry = creditEntry(new BigDecimal("100.00"));
        List<CreditHistory> histories = new ArrayList<>(List.of(
                history(new BigDecimal("200.00"), CREDIT),
                history(new BigDecimal("100.00"), DEBIT)));
        List<String> failureMessages = new ArrayList<>();

        PaymentEvent event = paymentDomainService.validateAndCancelPayment(payment, creditEntry, histories, failureMessages);

        assertTrue(failureMessages.isEmpty());
        assertInstanceOf(PaymentCancelledEvent.class, event);
        assertEquals(PaymentStatus.CANCELLED, payment.getPaymentStatus());
        assertEquals(new Money(new BigDecimal("200.00")), creditEntry.getTotalCreditAmount());
    }
}
