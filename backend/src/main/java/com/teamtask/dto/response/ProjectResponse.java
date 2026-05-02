package com.teamtask.dto.response;

import com.teamtask.entity.Project;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class ProjectResponse {
    private Long id;
    private String name;
    private String description;
    private String status;
    private UserResponse createdBy;
    private List<MemberResponse> members;
    private int taskCount;
    private LocalDateTime createdAt;

    @Data
    public static class MemberResponse {
        private Long userId;
        private String name;
        private String email;
        private String role;
    }

    public static ProjectResponse from(Project project) {
        ProjectResponse r = new ProjectResponse();
        r.setId(project.getId());
        r.setName(project.getName());
        r.setDescription(project.getDescription());
        r.setStatus(project.getStatus().name());
        r.setCreatedAt(project.getCreatedAt());
        r.setTaskCount(project.getTasks().size());

        if (project.getCreatedBy() != null) {
            r.setCreatedBy(UserResponse.from(project.getCreatedBy()));
        }

        r.setMembers(project.getMembers().stream().map(m -> {
            MemberResponse mr = new MemberResponse();
            mr.setUserId(m.getUser().getId());
            mr.setName(m.getUser().getName());
            mr.setEmail(m.getUser().getEmail());
            mr.setRole(m.getRole().name());
            return mr;
        }).collect(Collectors.toList()));

        return r;
    }
}
