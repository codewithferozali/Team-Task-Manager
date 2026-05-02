package com.teamtask.dto.response;

import com.teamtask.entity.Task;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private Long projectId;
    private String projectName;
    private UserResponse assignedTo;
    private UserResponse createdBy;
    private LocalDate dueDate;
    private boolean overdue;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;

    public static TaskResponse from(Task task) {
        TaskResponse r = new TaskResponse();
        r.setId(task.getId());
        r.setTitle(task.getTitle());
        r.setDescription(task.getDescription());
        r.setStatus(task.getStatus().name());
        r.setPriority(task.getPriority().name());
        r.setDueDate(task.getDueDate());
        r.setCompletedAt(task.getCompletedAt());
        r.setCreatedAt(task.getCreatedAt());

        if (task.getProject() != null) {
            r.setProjectId(task.getProject().getId());
            r.setProjectName(task.getProject().getName());
        }
        if (task.getAssignedTo() != null) {
            r.setAssignedTo(UserResponse.from(task.getAssignedTo()));
        }
        if (task.getCreatedBy() != null) {
            r.setCreatedBy(UserResponse.from(task.getCreatedBy()));
        }

        r.setOverdue(task.getDueDate() != null
                && task.getDueDate().isBefore(LocalDate.now())
                && task.getStatus() != com.teamtask.entity.TaskStatus.COMPLETED);

        return r;
    }
}
