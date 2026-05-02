package com.teamtask.service;

import com.teamtask.dto.request.RoleUpdateRequest;
import com.teamtask.dto.response.UserResponse;
import com.teamtask.entity.Role;
import com.teamtask.entity.User;
import com.teamtask.exception.ResourceNotFoundException;
import com.teamtask.repository.ProjectRepository;
import com.teamtask.repository.TaskRepository;
import com.teamtask.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    public UserService(UserRepository userRepository, TaskRepository taskRepository, ProjectRepository projectRepository) {
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse updateRole(Long id, RoleUpdateRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setRole(Role.valueOf(req.getRole().toUpperCase()));
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found");
        }
        // Cleanup references in other tables
        taskRepository.nullifyCreatedBy(id);
        taskRepository.nullifyAssignedTo(id);
        projectRepository.nullifyCreatedBy(id);
        
        userRepository.deleteById(id);
    }
}
