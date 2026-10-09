package lk.jac.privilege.dao;

import lk.jac.privilege.entity.AppModule;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ModuleRepository extends JpaRepository<AppModule,Integer> {
}
