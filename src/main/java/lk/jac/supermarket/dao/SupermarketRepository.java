package lk.jac.supermarket.dao;

import lk.jac.supermarket.entity.Supermarket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SupermarketRepository extends JpaRepository<Supermarket,Integer> {
    //edit
    Supermarket findByIdAndDeleteddatetimeIsNull(int superid);

    //table
    @Query("SELECT new lk.jac.supermarket.entity.Supermarket(s.id, s.name, s.contactperson, " +
            "s.contactpersonno, s.address, s.businessregno, s.email, s.status) " +
            "FROM Supermarket s WHERE s.deleteddatetime IS NULL")
    List<Supermarket> getSelectedSupermarketData();

    //duplicate check
    Supermarket findByNameAndDeleteddatetimeIsNull(String name);
    Supermarket findByBusinessregnoAndDeleteddatetimeIsNull(String businessregno);
    Supermarket findByContactpersonAndDeleteddatetimeIsNull(String contactperson);
    Supermarket findByContactpersonnoAndDeleteddatetimeIsNull(String contactpersonno);
    Supermarket findByEmailAndDeleteddatetimeIsNull(String email);
    Supermarket findByLandnumAndDeleteddatetimeIsNull(String landnum);

    @Query("SELECT s.number FROM Supermarket s ORDER BY s.id DESC LIMIT 1")
    String getLastRegistrationNo();

    List<Supermarket> findAllByDeleteddatetimeIsNull();
    @Query("SELECT COUNT(so) FROM Supermarket so " +
            "WHERE YEAR(so.addeddatetime) = :year " +
            "AND MONTH(so.addeddatetime) = :month")
    Integer countByYearAndMonth(int year, int month);
}
