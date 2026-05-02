package com.teamtask.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TaskRequest {
    @NotBlank
    private String title;
    private String description;
    private String status;
    private String priority;
    private Long projectId;
    private Long assignedToId;
    private LocalDate dueDate;
}
