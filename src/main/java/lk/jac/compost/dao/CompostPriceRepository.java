package lk.jac.compost.dao;

import lk.jac.common.StatusPending;
import lk.jac.compost.entity.CompostPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CompostPriceRepository extends JpaRepository<CompostPrice, Integer> {

    CompostPrice findByIdAndDeleteddatetimeIsNull(int compid);

    @Query("SELECT cp FROM CompostPrice cp WHERE cp.deleteddatetime IS NULL AND cp.compost.deleteddatetime IS NULL")
    List<CompostPrice> getSelectedCompostPriceData();

    CompostPrice findByCompost_IdAndStatuspendingAndDeleteddatetimeIsNull(Integer compostId, StatusPending status);

    // used for priceid sequence generation (PREFIX+YY+MM+SEQ pattern)
    @Query("SELECT COUNT(cp) FROM CompostPrice cp")
    long countAllForIdGeneration();
}