package com.court.backend.controller;

import com.court.backend.config.SecurityConfig;
import com.court.backend.dto.request.RegisterRequest;
import com.court.backend.entity.User;
import com.court.backend.enums.UserRole;
import com.court.backend.exception.GlobalExceptionHandler;
import com.court.backend.repository.UserRepository;
import com.court.backend.service.AuthService;
import com.court.backend.service.JwtService;
import com.court.backend.service.VenueService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Chạy controller, validation, BCrypt, JWT và phân quyền thật; repository giả lập để không sửa DB cá nhân.
@WebMvcTest(controllers = {AuthController.class, OwnerVenueController.class}, properties = {
        "app.jwt.secret=owner-registration-tests-only-secret-at-least-32-characters",
        "app.jwt.expiration-minutes=60"
})
@ContextConfiguration(classes = {AuthController.class, OwnerVenueController.class,
        SecurityConfig.class, AuthService.class, JwtService.class, GlobalExceptionHandler.class})
class OwnerRegistrationTest {
    private static final String PASSWORD = "SportCourt123!";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtDecoder jwtDecoder;
    @MockitoBean UserRepository users;
    @MockitoBean VenueService venues;

    private final List<User> savedUsers = new ArrayList<>();

    @BeforeEach
    void setUpRepository() {
        savedUsers.clear();
        when(users.existsByEmail(anyString())).thenAnswer(invocation ->
                savedUsers.stream().anyMatch(user -> invocation.getArgument(0).equals(user.getEmail())));
        when(users.existsByPhone(anyString())).thenAnswer(invocation ->
                savedUsers.stream().anyMatch(user -> invocation.getArgument(0).equals(user.getPhone())));
        when(users.findByEmail(anyString())).thenAnswer(invocation ->
                savedUsers.stream().filter(user -> invocation.getArgument(0).equals(user.getEmail())).findFirst());
        when(users.findByPhone(anyString())).thenAnswer(invocation ->
                savedUsers.stream().filter(user -> invocation.getArgument(0).equals(user.getPhone())).findFirst());
        when(users.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId((long) savedUsers.size() + 1);
            savedUsers.add(user);
            return user;
        });
    }

    @Test
    void ownerRegistrationCreatesActiveAccountAndUsableOwnerToken() throws Exception {
        var result = registerOwner(new RegisterRequest("  Chủ sân mới  ", "Owner@Example.test", "0912345678", PASSWORD))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("role").value("OWNER"))
                .andExpect(jsonPath("fullName").value("Chủ sân mới"))
                .andExpect(jsonPath("tokenType").value("Bearer"))
                .andExpect(jsonPath("expiresInSeconds").value(3600))
                .andReturn();

        assertThat(savedUsers).hasSize(1);
        User owner = savedUsers.getFirst();
        assertThat(owner.getEmail()).isEqualTo("owner@example.test");
        assertThat(owner.getRole()).isEqualTo(UserRole.OWNER);
        assertThat(owner.isActive()).isTrue();
        assertThat(owner.getPasswordHash()).isNotEqualTo(PASSWORD);
        assertThat(passwordEncoder.matches(PASSWORD, owner.getPasswordHash())).isTrue();
        String token = json.readTree(result.getResponse().getContentAsString()).get("accessToken").asString();
        assertThat(jwtDecoder.decode(token).getClaimAsString("role")).isEqualTo("OWNER");
        assertThat(jwtDecoder.decode(token).getSubject()).isEqualTo(owner.getId().toString());

        when(venues.listMine(owner.getId())).thenReturn(List.of());
        mvc.perform(get("/api/owner/venues").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
    }

    @ParameterizedTest
    @CsvSource(value = {"owner@example.test,NULL", "NULL,0912345678"}, nullValues = "NULL")
    void ownerCanRegisterWithEitherContactAndLoginAgain(String email, String phone) throws Exception {
        registerOwner(new RegisterRequest("Chủ sân", email, phone, PASSWORD)).andExpect(status().isCreated());
        var result = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("identifier", email != null ? email : phone, "password", PASSWORD))))
                .andExpect(status().isOk()).andExpect(jsonPath("role").value("OWNER")).andReturn();
        String token = json.readTree(result.getResponse().getContentAsString()).get("accessToken").asString();
        assertThat(jwtDecoder.decode(token).getClaimAsString("role")).isEqualTo("OWNER");
    }

    @Test
    void customerRegistrationCannotGrantOwnerRoleFromPayload() throws Exception {
        var result = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("fullName", "Khách hàng", "email", "user@example.test",
                                "password", PASSWORD, "role", "OWNER"))))
                .andExpect(status().isCreated()).andExpect(jsonPath("role").value("USER")).andReturn();
        assertThat(savedUsers.getFirst().getRole()).isEqualTo(UserRole.USER);
        String token = json.readTree(result.getResponse().getContentAsString()).get("accessToken").asString();
        mvc.perform(get("/api/owner/venues").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void ownerRegistrationIgnoresClientSelectedRole() throws Exception {
        mvc.perform(post("/api/auth/register-owner").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("fullName", "Chủ sân", "email", "owner@example.test",
                                "password", PASSWORD, "role", "ADMIN"))))
                .andExpect(status().isCreated()).andExpect(jsonPath("role").value("OWNER"));
        assertThat(savedUsers.getFirst().getRole()).isEqualTo(UserRole.OWNER);
    }

    @Test
    void duplicateEmailDoesNotPromoteAnExistingCustomer() throws Exception {
        var request = new RegisterRequest("Khách hàng", "customer@example.test", null, PASSWORD);
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(request)))
                .andExpect(status().isCreated());
        registerOwner(new RegisterRequest("Chủ sân", "CUSTOMER@example.test", null, PASSWORD))
                .andExpect(status().isConflict()).andExpect(jsonPath("message").value("Email đã được sử dụng"));
        assertThat(savedUsers).hasSize(1);
        assertThat(savedUsers.getFirst().getRole()).isEqualTo(UserRole.USER);
    }

    @Test
    void duplicatePhoneCannotCreateAnotherAccount() throws Exception {
        registerOwner(new RegisterRequest("Chủ sân", null, "0912345678", PASSWORD)).andExpect(status().isCreated());
        registerOwner(new RegisterRequest("Chủ sân khác", "another@example.test", "0912345678", PASSWORD))
                .andExpect(status().isConflict()).andExpect(jsonPath("message").value("Số điện thoại đã được sử dụng"));
        assertThat(savedUsers).hasSize(1);
    }

    @ParameterizedTest
    @MethodSource("invalidRequests")
    void invalidRegistrationNeverSavesAnAccount(RegisterRequest request) throws Exception {
        registerOwner(request).andExpect(status().isBadRequest());
        assertThat(savedUsers).isEmpty();
    }

    static Stream<RegisterRequest> invalidRequests() {
        return Stream.of(
                new RegisterRequest(" ", "owner@example.test", null, PASSWORD),
                new RegisterRequest("A".repeat(151), "owner@example.test", null, PASSWORD),
                new RegisterRequest("Chủ sân", "invalid-email", null, PASSWORD),
                new RegisterRequest("Chủ sân", null, "12345", PASSWORD),
                new RegisterRequest("Chủ sân", null, null, PASSWORD),
                new RegisterRequest("Chủ sân", "", null, PASSWORD),
                new RegisterRequest("Chủ sân", "owner@example.test", null, "short"),
                new RegisterRequest("Chủ sân", "owner@example.test", null, "        "),
                new RegisterRequest("Chủ sân", "owner@example.test", null, "a".repeat(73)),
                new RegisterRequest("Chủ sân", "owner@example.test", null, "ậ".repeat(25)));
    }

    private ResultActions registerOwner(RegisterRequest request) throws Exception {
        return mvc.perform(post("/api/auth/register-owner").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(request)));
    }
}
