package com.teamtask.repository;

import com.teamtask.entity.Task;
import com.teamtask.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByAssignedToId(Long userId);

    List<Task> findByAssignedToIdOrCreatedById(Long assignedToId, Long createdById);

    @Query("SELECT DISTINCT t FROM Task t " +
           "LEFT JOIN t.project p " +
           "LEFT JOIN p.members m " +
           "WHERE t.assignedTo.id = :userId " +
           "OR t.createdBy.id = :userId " +
           "OR m.user.id = :userId " +
           "ORDER BY t.createdAt DESC")
    List<Task> findAccessibleByUser(@Param("userId") Long userId);

    List<Task> findByProjectId(Long projectId);

    List<Task> findByAssignedToIdAndStatus(Long userId, TaskStatus status);

    @Query("SELECT DISTINCT t FROM Task t " +
           "LEFT JOIN t.project p " +
           "LEFT JOIN p.members m " +
           "WHERE (t.assignedTo.id = :userId OR t.createdBy.id = :userId OR m.user.id = :userId) " +
           "AND t.dueDate < :today AND t.status <> com.teamtask.entity.TaskStatus.COMPLETED")
    List<Task> findOverdueTasks(@Param("userId") Long userId, @Param("today") LocalDate today);

    @Query("SELECT t FROM Task t WHERE t.dueDate < :today AND t.status <> com.teamtask.entity.TaskStatus.COMPLETED")
    List<Task> findAllOverdueTasks(@Param("today") LocalDate today);

    long countByAssignedToIdAndStatus(Long userId, TaskStatus status);

    @Query("SELECT COUNT(DISTINCT t) FROM Task t " +
           "LEFT JOIN t.project p " +
           "LEFT JOIN p.members m " +
           "WHERE (t.assignedTo.id = :userId OR t.createdBy.id = :userId OR m.user.id = :userId) " +
           "AND t.status = :status")
    long countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") TaskStatus status);

    long countByStatus(TaskStatus status);

    @Query("SELECT t FROM Task t WHERE t.assignedTo.id = :userId ORDER BY t.createdAt DESC")
    List<Task> findRecentByUser(@Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Task t SET t.createdBy = null WHERE t.createdBy.id = :userId")
    void nullifyCreatedBy(@Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Task t SET t.assignedTo = null WHERE t.assignedTo.id = :userId")
    void nullifyAssignedTo(@Param("userId") Long userId);
}
