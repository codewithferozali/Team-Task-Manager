package com.teamtask.controller;

import com.teamtask.dto.request.TaskRequest;
import com.teamtask.dto.response.ApiResponse;
import com.teamtask.entity.User;
import com.teamtask.repository.UserRepository;
import com.teamtask.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;
    private final UserRepository userRepository;

    public TaskController(TaskService taskService, UserRepository userRepository) {
        this.taskService = taskService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getAll(@AuthenticationPrincipal UserDetails userDetails,
                                    @RequestParam(required = false) String status,
                                    @RequestParam(required = false) Long projectId) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(ApiResponse.ok(taskService.getTasksForUser(user, status, projectId)));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(ApiResponse.ok(taskService.getDashboardStats(user)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(taskService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody TaskRequest req,
                                    @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(ApiResponse.ok("Task created", taskService.create(req, user)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody TaskRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Task updated", taskService.update(id, req)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Status updated", taskService.updateStatus(id, body.get("status"))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        taskService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Task deleted", null));
    }

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
    }
}
