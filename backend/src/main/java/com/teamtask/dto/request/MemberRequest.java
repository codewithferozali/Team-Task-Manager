package com.teamtask.dto.request;

import lombok.Data;

@Data
public class MemberRequest {
    private Long userId;
    private String role; // LEAD or MEMBER
}
