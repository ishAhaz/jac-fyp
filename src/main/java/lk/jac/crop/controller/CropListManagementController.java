package lk.jac.crop.controller;

import lk.jac.common.CommonController;
import lk.jac.common.CurrentUserUtil;
import lk.jac.crop.dao.CropListManagementRepository;
import lk.jac.crop.entity.CropListManagement;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.user.dao.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class CropListManagementController implements CommonController<CropListManagement> {

    @Autowired
    private CropListManagementRepository cropListManagementDao;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    // module name as stored in the "module" table - verify this matches your DB row exactly
    private static final String MODULE_NAME = "CROP_LIST";

    @GetMapping("/crop/croplist")
    public ModelAndView cropPage() {
        ModelAndView cropUI = new ModelAndView();
        cropUI.setViewName("croplistmanagement.html");
        return cropUI;
    }

    //to compost
    @GetMapping(value = "/crop/croplist/dropdown/selected", produces = "application/json")
    public List<CropListManagement> getSelectedCropCompost() {
        return cropListManagementDao.findByDeleteddatetimeIsNull();
    }

    @GetMapping(value = "/crop/croplist/byid/{crid}", produces = "application/json")
    public CropListManagement getCropById(@PathVariable int crid) {
        return cropListManagementDao.findByIdAndDeleteddatetimeIsNull(crid);
    }

    @GetMapping(value = "/crop/croplist/alldata/selected", produces = "application/json")
    public List<CropListManagement> getSelectedCropData() {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }

        return cropListManagementDao.getSelectedCropData();
    }

    //=======crud=======
    //==================

    @PostMapping("/crop/croplist/save")
    @Override
    public String saveData(@RequestBody CropListManagement cropListManagement) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canInsert()) {
            return "Access denied: insufficient privilege";
        }

        //data duplication
        CropListManagement existing = cropListManagementDao.findByNameAndDeleteddatetimeIsNull(
                cropListManagement.getName());
        if (existing != null) {
            return "Crop already exists for this crop name";
        }

        try {
            //generate number
            String regNo = generateRegistrationNo();
            cropListManagement.setCropid(regNo);

            cropListManagement.setAddeddatetime(LocalDateTime.now());
            cropListManagement.setUpdateddatetime(LocalDateTime.now());

            cropListManagementDao.save(cropListManagement);
            return "OK";
        } catch (Exception e) {
            System.err.println("Crop save error: " + e.getMessage());

            String msg = e.getMessage();
            if (msg != null && msg.contains("name_UNIQUE")) {
                return "Crop name already exists";
            }
            return "Something went wrong. Please try again.";
        }
    }

    private String generateRegistrationNo() {
        String lastNumber = cropListManagementDao.getLastRegistrationNo();

        if (lastNumber == null) {
            return "CR001";
        }

        String numberPart = lastNumber.substring(2);

        int nextNumber = Integer.parseInt(numberPart) + 1;

        return String.format("CR%03d", nextNumber);
    }

    @PutMapping("/crop/croplist/update")
    @Override
    public String updateData(@RequestBody CropListManagement cropListManagement) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }

        // correct existence check
        CropListManagement extCrop = cropListManagementDao.findByIdAndDeleteddatetimeIsNull(cropListManagement.getId());
        if (extCrop == null) {
            return "Crop not found";
        }

        //  check Crop name duplicate but exclude current Crop
        CropListManagement existingCropName = cropListManagementDao.findByNameAndDeleteddatetimeIsNull(cropListManagement.getName());
        if (existingCropName != null && !existingCropName.getId().equals(cropListManagement.getId())) {
            return "Crop Name already exists";
        }

        try {
            // keep original addeddatetime
            cropListManagement.setAddeddatetime(extCrop.getAddeddatetime());
            cropListManagement.setUpdateddatetime(LocalDateTime.now());

            cropListManagementDao.save(cropListManagement);
            return "OK";

        } catch (Exception e) {

            System.err.println("Crop update error: " + e.getMessage());
            String msg = e.getMessage();
            if (msg != null && msg.contains("name_UNIQUE")) {
                return "Crop name already exists";
            }
            return "Something went wrong. Please try again.";
        }
    }

    @DeleteMapping("/crop/croplist/{id}")
    @Override
    public String deleteData(@PathVariable int id) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canDelete()) {
            return "Access denied: insufficient privilege";
        }

        //check existence
        CropListManagement existingCrop = cropListManagementDao.findByIdAndDeleteddatetimeIsNull(id);
        if (existingCrop == null) {
            return "Crop delete not completed: Crop not available";
        }
        try {
            //soft delete
            existingCrop.setDeleteddatetime(LocalDateTime.now());
            cropListManagementDao.save(existingCrop);
            return "OK";

        } catch (Exception e) {
            return "Crop delete not completed";
        }
    }
}