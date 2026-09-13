package com.junglegym;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MariaDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers(disabledWithoutDocker = true)
class MariaDbMigrationTest {
    @Container
    static final MariaDBContainer<?> maria = new MariaDBContainer<>("mariadb:11.8")
            .withDatabaseName("jungle_gym").withUsername("jungle").withPassword("test-password");

    @Test
    void migrationRunsAndDatabaseRejectsDuplicateActiveVisit() throws Exception {
        var result = Flyway.configure().dataSource(maria.getJdbcUrl(), maria.getUsername(), maria.getPassword())
                .locations("classpath:db/migration").load().migrate();
        assertTrue(result.success);

        try (var connection = maria.createConnection(""); var statement = connection.createStatement()) {
            statement.executeUpdate("INSERT INTO users(email,nickname,name,password_hash,created_at) " +
                    "VALUES ('test@example.com','tester','Test','$2a$dummy',CURRENT_TIMESTAMP)");
            statement.executeUpdate("UPDATE users SET jungle_number='00999' WHERE id=1");
            assertThrows(SQLException.class, () -> statement.executeUpdate(
                    "INSERT INTO users(email,nickname,name,password_hash,created_at,jungle_number) " +
                            "VALUES ('other@example.com','other','Other','$2a$dummy',CURRENT_TIMESTAMP,'00999')"));
            statement.executeUpdate("INSERT INTO gym_visits(user_id,active_user_id,checked_in_at,workout_title) " +
                    "VALUES (1,1,CURRENT_TIMESTAMP,'')");
            assertThrows(SQLException.class, () -> statement.executeUpdate(
                    "INSERT INTO gym_visits(user_id,active_user_id,checked_in_at,workout_title) " +
                            "VALUES (1,1,CURRENT_TIMESTAMP,'')"));
        }
    }
}
