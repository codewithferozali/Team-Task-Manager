package com.teamtask.repository;

import com.teamtask.entity.Project;
import com.teamtask.entity.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("SELECT DISTINCT p FROM Project p JOIN p.members m WHERE m.user.id = :userId")
    List<Project> findByMemberId(@Param("userId") Long userId);

    List<Project> findByStatus(ProjectStatus status);

    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN p.members m WHERE m.user.id = :userId OR p.createdBy.id = :userId ORDER BY p.createdAt DESC")
    List<Project> findAccessibleByUser(@Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Project p SET p.createdBy = null WHERE p.createdBy.id = :userId")
    void nullifyCreatedBy(@Param("userId") Long userId);
}
