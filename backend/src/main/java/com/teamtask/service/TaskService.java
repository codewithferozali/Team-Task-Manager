package com.teamtask.service;

import com.teamtask.dto.request.TaskRequest;
import com.teamtask.dto.response.DashboardStats;
import com.teamtask.dto.response.TaskResponse;
import com.teamtask.entity.*;
import com.teamtask.exception.ResourceNotFoundException;
import com.teamtask.repository.ProjectRepository;
import com.teamtask.repository.TaskRepository;
import com.teamtask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository, ProjectRepository projectRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksForUser(User user, String status, Long projectId) {
        List<Task> tasks = user.getRole() == Role.ADMIN
                ? taskRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))
                : taskRepository.findAccessibleByUser(user.getId());

        return tasks.stream()
                .filter(t -> status == null || t.getStatus().name().equalsIgnoreCase(status))
                .filter(t -> projectId == null || (t.getProject() != null && t.getProject().getId().equals(projectId)))
                .map(TaskResponse::from)
                .collect(Collectors.toList());
    }

    public TaskResponse getById(Long id) {
        return TaskResponse.from(findTask(id));
    }

    @Transactional
    public TaskResponse create(TaskRequest req, User creator) {
        Task task = Task.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .createdBy(creator)
                .build();

        applyRequest(task, req);
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse update(Long id, TaskRequest req) {
        Task task = findTask(id);
        task.setTitle(req.getTitle());
        task.setDescription(req.getDescription());
        applyRequest(task, req);
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateStatus(Long id, String status) {
        Task task = findTask(id);
        TaskStatus newStatus = TaskStatus.valueOf(status.toUpperCase());
        task.setStatus(newStatus);
        if (newStatus == TaskStatus.COMPLETED) {
            task.setCompletedAt(LocalDateTime.now());
        } else {
            task.setCompletedAt(null);
        }
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public void delete(Long id) {
        taskRepository.delete(findTask(id));
    }

    @Transactional(readOnly = true)
    public DashboardStats getDashboardStats(User user) {
        boolean isAdmin = user.getRole() == Role.ADMIN;
        LocalDate today = LocalDate.now();

        long total = isAdmin ? taskRepository.count()
                : taskRepository.findAccessibleByUser(user.getId()).size();
        
        long todo = isAdmin ? taskRepository.countByStatus(TaskStatus.TODO)
                : taskRepository.countByUserIdAndStatus(user.getId(), TaskStatus.TODO);
        
        long inProgress = isAdmin ? taskRepository.countByStatus(TaskStatus.IN_PROGRESS)
                : taskRepository.countByUserIdAndStatus(user.getId(), TaskStatus.IN_PROGRESS);
        
        long completed = isAdmin ? taskRepository.countByStatus(TaskStatus.COMPLETED)
                : taskRepository.countByUserIdAndStatus(user.getId(), TaskStatus.COMPLETED);
        
        long overdue = isAdmin
                ? taskRepository.findAllOverdueTasks(today).size()
                : taskRepository.findOverdueTasks(user.getId(), today).size();
        
        long projects = projectRepository.findAccessibleByUser(user.getId()).size();

        return DashboardStats.builder()
                .totalTasks(total).todoTasks(todo).inProgressTasks(inProgress)
                .completedTasks(completed).overdueTasks(overdue).totalProjects(projects)
                .build();
    }

    private void applyRequest(Task task, TaskRequest req) {
        if (req.getStatus() != null) task.setStatus(TaskStatus.valueOf(req.getStatus().toUpperCase()));
        if (req.getPriority() != null) task.setPriority(Priority.valueOf(req.getPriority().toUpperCase()));
        if (req.getDueDate() != null) task.setDueDate(req.getDueDate());
        if (req.getProjectId() != null) {
            task.setProject(projectRepository.findById(req.getProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found")));
        }
        if (req.getAssignedToId() != null) {
            task.setAssignedTo(userRepository.findById(req.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found")));
        }
    }

    private Task findTask(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }
}
