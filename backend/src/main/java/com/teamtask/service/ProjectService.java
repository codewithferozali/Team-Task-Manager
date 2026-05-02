package com.teamtask.service;

import com.teamtask.dto.request.MemberRequest;
import com.teamtask.dto.request.ProjectRequest;
import com.teamtask.dto.response.ProjectResponse;
import com.teamtask.entity.*;
import com.teamtask.exception.BadRequestException;
import com.teamtask.exception.ResourceNotFoundException;
import com.teamtask.repository.ProjectMemberRepository;
import com.teamtask.repository.ProjectRepository;
import com.teamtask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    public ProjectService(ProjectRepository projectRepository, ProjectMemberRepository projectMemberRepository, UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsForUser(User user) {
        List<Project> projects = user.getRole() == Role.ADMIN
                ? projectRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))
                : projectRepository.findAccessibleByUser(user.getId());
        return projects.stream().map(ProjectResponse::from).collect(Collectors.toList());
    }

    public ProjectResponse getById(Long id) {
        return ProjectResponse.from(findProject(id));
    }

    @Transactional
    public ProjectResponse create(ProjectRequest req, User creator) {
        Project project = Project.builder()
                .name(req.getName())
                .description(req.getDescription())
                .createdBy(creator)
                .build();
        return ProjectResponse.from(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponse update(Long id, ProjectRequest req) {
        Project project = findProject(id);
        project.setName(req.getName());
        if (req.getDescription() != null) project.setDescription(req.getDescription());
        if (req.getStatus() != null) project.setStatus(ProjectStatus.valueOf(req.getStatus().toUpperCase()));
        return ProjectResponse.from(projectRepository.save(project));
    }

    @Transactional
    public void delete(Long id) {
        projectRepository.delete(findProject(id));
    }

    @Transactional
    public ProjectResponse addMember(Long projectId, MemberRequest req) {
        Project project = findProject(projectId);
        User user = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, req.getUserId())) {
            throw new BadRequestException("User is already a member");
        }

        ProjectMember member = ProjectMember.builder()
                .project(project)
                .user(user)
                .id(new ProjectMember.ProjectMemberId(projectId, req.getUserId()))
                .role(req.getRole() != null ? MemberRole.valueOf(req.getRole().toUpperCase()) : MemberRole.MEMBER)
                .build();
        projectMemberRepository.save(member);
        return ProjectResponse.from(projectRepository.findById(projectId).get());
    }

    @Transactional
    public void removeMember(Long projectId, Long userId) {
        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new ResourceNotFoundException("Member not found in project");
        }
        projectMemberRepository.deleteByProjectIdAndUserId(projectId, userId);
    }

    private Project findProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }
}
