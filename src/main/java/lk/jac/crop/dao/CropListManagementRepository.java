package lk.jac.crop.dao;

import lk.jac.crop.entity.CropListManagement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CropListManagementRepository extends JpaRepository<CropListManagement, Integer> {

    //for compost form
    List<CropListManagement> findByDeleteddatetimeIsNull();

    //get data by id
    CropListManagement findByIdAndDeleteddatetimeIsNull(int crid);

    //duplicate and existing
    CropListManagement findByNameAndDeleteddatetimeIsNull(String name);

    //for ID
    @Query("SELECT c.cropid FROM CropListManagement c WHERE c.deleteddatetime IS NULL ORDER BY c.id DESC LIMIT 1")
    String getLastRegistrationNo();

    //for table
    @Query("SELECT c FROM CropListManagement c WHERE c.deleteddatetime IS NULL")
    List<CropListManagement> getSelectedCropData();

    long countByDeleteddatetimeIsNull();
    long countByDeleteddatetimeIsNotNull();
}