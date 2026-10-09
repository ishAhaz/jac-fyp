package lk.jac.farmer.controller;

import lk.jac.common.CommonController;
import lk.jac.common.CurrentUserUtil;
import lk.jac.common.StatusReject;
import lk.jac.crop.controller.CropSuggestionPriceController;
import lk.jac.crop.dao.CropSuggestionPriceRepository;
import lk.jac.farmer.dao.CropHasFarmerRepository;
import lk.jac.farmer.dao.FarmerRepository;
import lk.jac.farmer.entity.CropHasFarmer;
import lk.jac.farmer.entity.Farmer;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.user.controller.UserController;
import lk.jac.user.dao.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.*;

@RestController
public class FarmerController implements CommonController<Farmer> {
    @Autowired
    private FarmerRepository farmerDao;

    @Autowired
    private CropSuggestionPriceController cropSuggestionPriceController;

    @Autowired
    private CropSuggestionPriceRepository cropSuggestionPriceDao;

    @Autowired
    private CropHasFarmerRepository cropHasFarmerDao;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    @Autowired
    private UserController userController;

    private static final String MODULE_NAME = "FARMER";

    @GetMapping("/farmer/farmerlist")
    public ModelAndView farmerPage(){
        ModelAndView farmerUI = new ModelAndView();
        farmerUI.setViewName("farmer.html");
        return farmerUI;
    }

    //========links========
    //=====================
    @GetMapping(value = "/farmer/farmerlist/byid/{fid}", produces = "application/json")
    public Farmer getFarmer(@PathVariable int fid){

        return farmerDao.findByIdAndDeleteddatetimeIsNull(fid);
    }
    @GetMapping(value = "/farmer/farmerlist/alldata/selected", produces = "application/json")
    public List<Farmer> getSelectedFarmerData() {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }

        return farmerDao.getSelectedFarmerData();
    }
    @GetMapping(value = "/farmer/farmerlist/crophasfarmer/byfarmer/active/{farmerId}", produces = "application/json")
    public List<CropHasFarmer> getActiveCropByFarmer(@PathVariable Integer farmerId) {
        return cropHasFarmerDao.findActiveByFarmerId(farmerId);
    }
    @GetMapping(value = "/farmer/farmerlist/compost/active", produces = "application/json")// Farmer who buy compost
    public List<Farmer> getCompostFarmers() {
        return farmerDao.findByCompostTrueAndDeleteddatetimeIsNull();
    }
    //========links========
    //=====================

    //=====crud======
    //===============
    @PostMapping("/farmer/farmerlist/save")
    @Override
    public String saveData(@RequestBody Farmer farmer) {
        //user privilege
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canInsert()) {
            return "Access denied: insufficient privilege";
        }
        //data duplication
        Farmer existingNic = farmerDao.findByNicAndDeleteddatetimeIsNull(farmer.getNic());
        if (existingNic != null) {
            return "Farmer already exists for this NIC";
        }
        Farmer existingEmail = farmerDao.findByEmailAndDeleteddatetimeIsNull(farmer.getEmail());
        if (existingEmail != null) {
            return "Farmer already exists for this email";
        }
        Farmer existingNumber = farmerDao.findByMobilenoAndDeleteddatetimeIsNull(farmer.getMobileno());
        if (existingNumber != null) {
            return "Farmer already exists for this mobile number";
        }

        try{
            farmer.setAddeddatetime(LocalDateTime.now());
            farmer.setUpdateddatetime(null);
            farmer.setNumber("TEMP");

            for (CropHasFarmer c : farmer.getCrops()) {
                c.setFarmer(farmer);
                c.setStatus(StatusReject.Pending);
            }

            Farmer saved = farmerDao.save(farmer);
            saved.setNumber(generateRegistrationNo(saved.getAddeddatetime()));
            farmerDao.save(saved); // second save just updates the number

            userController.createPendingUserForFarmer(saved);

            // Reload crops from DB so IDs are populated
            List<CropHasFarmer> savedCrops =
                    cropHasFarmerDao.findByFarmerId(saved.getId());

            for (CropHasFarmer c : savedCrops) {
                cropSuggestionPriceController.createOrUpdateSuggestion(c);
            }

            return "OK";

        }
        catch (Exception e){
            System.err.println("Farmer save error:" + e.getMessage());
            String msg = e.getMessage();
            if(msg != null && msg.contains("nic_UNIQUE")){
                return "Farmer already exists for this NIC";
            }
            if(msg != null && msg.contains("email_UNIQUE")){
                return "Farmer already exists for this email";
            }
            if(msg != null && msg.contains("mobileno_UNIQUE")){
                return "Farmer already exists for this mobile number";
            }
            return "Something went wrong. Please try again";
        }
    }
    private String generateRegistrationNo(LocalDateTime registeredAt) {
        int year  = registeredAt.getYear();
        int month = registeredAt.getMonthValue();

        Integer count = farmerDao.countByYearAndMonth(year, month);

        String yy  = String.valueOf(year).substring(2);
        String mm  = String.format("%02d", month);
        String seq = String.format("%03d", count != null ? count : 1);

        return "PO" + yy + mm + seq;


    }
    @PutMapping("/farmer/farmerlist/update")
    @Override
    public String updateData(@RequestBody Farmer farmer) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }

        Farmer extFarmer = farmerDao.findByIdAndDeleteddatetimeIsNull(farmer.getId());
        if (extFarmer == null) {
            return "Farmer not found";
        }

        Farmer existingNIC = farmerDao.findByNicAndDeleteddatetimeIsNull(farmer.getNic());
        if (existingNIC != null && !existingNIC.getId().equals(farmer.getId())) {
            return "NIC already exists";
        }

        Farmer existingMobile = farmerDao.findByMobilenoAndDeleteddatetimeIsNull(farmer.getMobileno());
        if (existingMobile != null && !existingMobile.getId().equals(farmer.getId())) {
            return "Mobile number already exists";
        }

        Farmer existingEmail = farmerDao.findByEmailAndDeleteddatetimeIsNull(farmer.getEmail());
        if (existingEmail != null && !existingEmail.getId().equals(farmer.getId())) {
            return "Email already exists";
        }

        try{
            farmer.setAddeddatetime(extFarmer.getAddeddatetime());
            farmer.setUpdateddatetime(LocalDateTime.now());
            farmer.setNumber(extFarmer.getNumber());

            // Load existing active crops for comparison
            List<CropHasFarmer> existingCrops =
                    cropHasFarmerDao.findByFarmerId(farmer.getId());

            Map<Integer, CropHasFarmer> existingMap = new HashMap<>();
            for (CropHasFarmer c : existingCrops) {
                existingMap.put(c.getCropListManagement().getId(), c);
            }

            Set<Integer> incomingCropIds = new HashSet<>();

            if (farmer.getCrops() != null) {
                for (CropHasFarmer c : farmer.getCrops()) {
                    c.setFarmer(farmer);
                    incomingCropIds.add(c.getCropListManagement().getId());

                    CropHasFarmer existing = existingMap.get(c.getCropListManagement().getId());

                    if (existing == null) {
                        // New crop → Pending
                        c.setStatus(StatusReject.Pending);

                    } else if (!existing.getPrice().equals(c.getPrice())) {
                        // Price changed → soft-delete the OLD row
                        existing.setDeleteddatetime(LocalDateTime.now());
                        cropHasFarmerDao.save(existing);

                        // remove the old row's suggestion price too - it referred to the old price
                        cropSuggestionPriceDao.deleteByCrophasfarmer_Id(existing.getId());

                        // Incoming c should be treated as a brand new row — clear its id
                        c.setId(null);
                        c.setStatus(StatusReject.Pending);

                    } else {
                        // Price unchanged → keep existing status
                        c.setStatus(existing.getStatus());
                    }
                }
            }

            // Soft-delete crops that were removed from the form
            for (CropHasFarmer c : existingCrops) {
                if (!incomingCropIds.contains(c.getCropListManagement().getId())) {
                    c.setDeleteddatetime(LocalDateTime.now());
                    cropHasFarmerDao.save(c);

                    // crop removed from farmer → its suggestion price is no longer relevant
                    cropSuggestionPriceDao.deleteByCrophasfarmer_Id(c.getId());
                }
            }

            farmerDao.save(farmer);

            // Create/update suggestion only for Pending crops
            List<CropHasFarmer> updatedCrops =
                    cropHasFarmerDao.findByFarmerId(farmer.getId());

            for (CropHasFarmer c : updatedCrops) {
                if (c.getStatus() == StatusReject.Pending) {
                    cropSuggestionPriceController.createOrUpdateSuggestion(c);
                }
                // Active/Rejected → leave suggestion price record untouched
            }

            return "OK";
        } catch (Exception e) {

            System.err.println("Farmer save error:" + e.getMessage());
            String msg = e.getMessage();
            if(msg != null && msg.contains("nic_UNIQUE")){
                return "Farmer already exists for this NIC";
            }
            if(msg != null && msg.contains("email_UNIQUE")){
                return "Farmer already exists for this email";
            }
            if(msg != null && msg.contains("mobileno_UNIQUE")){
                return "Farmer already exists for this mobile number";
            }
            return "Something went wrong. Please try again";
        }
    }
    @DeleteMapping("/farmer/farmerlist/{id}")
    @Override
    public String deleteData(@PathVariable int id) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canDelete()) {
            return "Access denied: insufficient privilege";
        }

        Farmer existingFarmer = farmerDao.findByIdAndDeleteddatetimeIsNull(id);

        if (existingFarmer == null) {
            return "Farmer delete not completed: Farmer not available";
        }

        try{
            // Soft-delete all active crop_has_farmer links for this farmer,
            // and remove their linked suggestion price records
            List<CropHasFarmer> activeCrops = cropHasFarmerDao.findByFarmerId(existingFarmer.getId());

            for (CropHasFarmer c : activeCrops) {
                c.setDeleteddatetime(LocalDateTime.now());
                cropHasFarmerDao.save(c);

                cropSuggestionPriceDao.deleteByCrophasfarmer_Id(c.getId());
            }

            // soft delete farmer
            existingFarmer.setDeleteddatetime(LocalDateTime.now());
            farmerDao.save(existingFarmer);

            return "OK";
        } catch (Exception e) {
            System.err.println("Farmer delete error:" + e.getMessage());
            return "Farmer delete not completed";
        }
    }
    //=====crud======
    //===============
}

