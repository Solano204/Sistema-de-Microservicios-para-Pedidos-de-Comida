package com.food.ordering.system.customer.service.application.handler;

import com.food.ordering.system.application.handler.GlobalExceptionHandler;
import com.food.ordering.system.customer.service.domain.exception.CustomerDomainException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.context.request.WebRequest;

import java.net.URI;

@Slf4j
@ControllerAdvice
public class CustomerGlobalExceptionHandler extends GlobalExceptionHandler {

    @ExceptionHandler(CustomerDomainException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ProblemDetail handleException(CustomerDomainException exception, WebRequest request) {
        log.error(exception.getMessage(), exception);
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setTitle("Customer domain rule violated");
        problem.setDetail(exception.getMessage());
        problem.setInstance(URI.create(rawPath(request)));
        return problem;
    }
}
