package com.court.backend.repository;

import com.court.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.List;
import com.court.backend.enums.UserRole;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.role = :role and u.active = true and u.deletedAt is null order by u.id")
    List<User> lockActiveAdministratorsByRole(@Param("role") UserRole role);

    default List<User> lockActiveAdministrators() {
        return lockActiveAdministratorsByRole(UserRole.ADMIN);
    }

    long countByDeletedAtIsNull();
    long countByDeletedAtIsNotNull();
    long countByDeletedAtIsNullAndActiveTrue();
    long countByDeletedAtIsNullAndRole(UserRole role);

    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    boolean existsByEmailAndIdNot(String email, Long id);

    boolean existsByPhoneAndIdNot(String phone, Long id);
}
