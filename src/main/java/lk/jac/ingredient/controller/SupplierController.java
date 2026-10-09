package lk.jac.ingredient.controller;

import lk.jac.common.CommonController;
import lk.jac.common.CurrentUserUtil;
import lk.jac.common.StatusReject;
import lk.jac.ingredient.dao.SuggestionPriceInRepository;
import lk.jac.ingredient.dao.SupplierHasIngredientRepository;
import lk.jac.ingredient.dao.SupplierRepository;
import lk.jac.ingredient.entity.Supplier;
import lk.jac.ingredient.entity.SupplierHasIngredient;
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
public class SupplierController implements CommonController<Supplier> {

    @Autowired
    private SupplierRepository supplierDao;

    @Autowired
    private SuggestionPriceInController suggestionPriceInController;

    @Autowired
    private SuggestionPriceInRepository suggestionPriceInDao;

    @Autowired
    private SupplierHasIngredientRepository supplierHasIngredientDao;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    @Autowired
    private UserController userController;

    private static final String MODULE_NAME = "SUPPLIER";



    @GetMapping("/ingredient/supplier")
    public ModelAndView supplierPage() {
        ModelAndView supplierUI = new ModelAndView();
        supplierUI.setViewName("supplier.html");
        return supplierUI;
    }

    //====links=====
    //==============
    @GetMapping(value = "/ingredient/supplier/byid/{supid}", produces = "application/json")
    public Supplier getSupplierById(@PathVariable Integer supid) {
        return supplierDao.findByIdWithIngredients(supid);
    }

    @GetMapping(value = "/ingredient/supplier/alldata/selected", produces = "application/json")
    public List<Supplier> getSelectedSupplierData() {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }

        return supplierDao.getSelectedSupplierData();
    }

    @GetMapping(value = "/ingredient/supplierhasingredient/bysupplier/active/{supplierId}", produces = "application/json")
    public List<SupplierHasIngredient> getActiveIngredientsBySupplier(@PathVariable Integer supplierId) {
        return supplierHasIngredientDao.findActiveBySupplierId(supplierId);
    }

    //====links=====
    //==============

    // ======== Crud ========
    //=======================

    @PostMapping("/ingredient/supplier/save")
    @Override
    public String saveData(@RequestBody Supplier supplier) {
        //===========================
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canInsert()) {
            return "Access denied: insufficient privilege";
        }
        //===========================
        Supplier existingContactPerson = supplierDao.findByContactpersonAndDeleteddatetimeIsNull(supplier.getContactperson());
        if (existingContactPerson != null) return "supplier already exists for this contact person name";

        Supplier existingCompanyName = supplierDao.findByCompanynameAndDeleteddatetimeIsNull(supplier.getCompanyname());
        if (existingCompanyName != null) return "supplier already exists for this company name";

        Supplier existingMobile = supplierDao.findByMobilenumAndDeleteddatetimeIsNull(supplier.getMobilenum());
        if (existingMobile != null) return "Supplier already exists for this mobile number";

        Supplier existingEmail = supplierDao.findByEmailAndDeleteddatetimeIsNull(supplier.getEmail());
        if (existingEmail != null) return "Supplier already exists for this email";

        try {
            supplier.setAddeddatetime(LocalDateTime.now());
            supplier.setUpdateddatetime(null);
            supplier.setSupplierid("TEMP");

            // Ingredients are no longer submitted from the Supplier Management
            // form — suppliers add their own from My Account after this record
            // exists. `supplier.getIngredients()` is normally null here; guard
            // against it so a new supplier with no ingredients yet doesn't NPE.
            if (supplier.getIngredients() != null) {
                for (SupplierHasIngredient shi : supplier.getIngredients()) {
                    shi.setSupplier(supplier);
                    shi.setStatus(StatusReject.Pending);
                }
            }

            Supplier saved = supplierDao.save(supplier);
            String regNo = generateRegistrationNo(saved.getAddeddatetime());
            saved.setSupplierid(regNo);
            supplierDao.save(saved);

            userController.createPendingUserForSupplier(saved);

            // Reload ingredients from DB so IDs are populated
            List<SupplierHasIngredient> savedIngredients =
                    supplierHasIngredientDao.findBySupplierId(saved.getId());

            for (SupplierHasIngredient shi : savedIngredients) {
                suggestionPriceInController.createOrUpdateSuggestion(shi);
            }

            return "OK";

        } catch (Exception e) {
            System.err.println("Supplier save error: " + e.getMessage());
            String msg = e.getMessage();
            if (msg != null && msg.contains("contactperson_UNIQUE")) return "Supplier already exists for this Contact person";
            if (msg != null && msg.contains("companyname_UNIQUE"))   return "Supplier already exists for this Company name";
            if (msg != null && msg.contains("email_UNIQUE"))         return "Supplier already exists for this Email";
            if (msg != null && msg.contains("mobilenum_UNIQUE"))     return "Supplier already exists for this mobile number";
            return "Something went wrong. Please try again";
        }
    }

    private String generateRegistrationNo(LocalDateTime registeredAt) {
        int year  = registeredAt.getYear();
        int month = registeredAt.getMonthValue();

        Integer count = supplierDao.countByYearAndMonth(year, month);

        String yy  = String.valueOf(year).substring(2);
        String mm  = String.format("%02d", month);
        String seq = String.format("%03d", count);

        return "SP" + yy + mm + seq;
    }

    // ======== UPDATE ========

    @PutMapping("/ingredient/supplier/update")
    @Override
    public String updateData(@RequestBody Supplier supplier) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }


        Supplier existingSupplier = supplierDao.findByIdAndDeleteddatetimeIsNull(supplier.getId());
        if (existingSupplier == null) return "supplier not found";

        Supplier existingContactPerson = supplierDao.findByContactpersonAndDeleteddatetimeIsNull(supplier.getContactperson());
        if (existingContactPerson != null && !existingContactPerson.getId().equals(supplier.getId()))
            return "Contact person name already exists";

        Supplier existingCompanyName = supplierDao.findByCompanynameAndDeleteddatetimeIsNull(supplier.getCompanyname());
        if (existingCompanyName != null && !existingCompanyName.getId().equals(supplier.getId()))
            return "Company Name already exists";

        Supplier existingMobile = supplierDao.findByMobilenumAndDeleteddatetimeIsNull(supplier.getMobilenum());
        if (existingMobile != null && !existingMobile.getId().equals(supplier.getId()))
            return "Mobile Number already exists";

        Supplier existingEmail = supplierDao.findByEmailAndDeleteddatetimeIsNull(supplier.getEmail());
        if (existingEmail != null && !existingEmail.getId().equals(supplier.getId()))
            return "Email already exists";

        try {
            supplier.setAddeddatetime(existingSupplier.getAddeddatetime());
            supplier.setUpdateddatetime(LocalDateTime.now());
            supplier.setSupplierid(existingSupplier.getSupplierid());

            // ------------------------------------------------------------
            // Ingredients are managed by the supplier from My Account now,
            // not from this form — the Supplier Management update payload
            // no longer includes an `ingredients` field at all.
            //
            // IMPORTANT: only touch/soft-delete ingredient rows when the
            // client explicitly sent a list. If `supplier.getIngredients()`
            // is null, this update is not trying to manage ingredients at
            // all, so leave every existing SupplierHasIngredient row alone.
            // (Previously this fell through to the removal loop below with
            // an empty `incomingIngredientIds` set regardless of whether
            // ingredients was null or empty, which soft-deleted ALL of a
            // supplier's ingredients on every basic-details edit.)
            // ------------------------------------------------------------
            if (supplier.getIngredients() != null) {

                // Load existing active ingredients for comparison
                List<SupplierHasIngredient> existingIngredients =
                        supplierHasIngredientDao.findBySupplierId(supplier.getId());

                Map<Integer, SupplierHasIngredient> existingMap = new HashMap<>();
                for (SupplierHasIngredient shi : existingIngredients) {
                    existingMap.put(shi.getIngredient().getId(), shi);
                }

                Set<Integer> incomingIngredientIds = new HashSet<>();

                for (SupplierHasIngredient shi : supplier.getIngredients()) {
                    shi.setSupplier(supplier);
                    incomingIngredientIds.add(shi.getIngredient().getId());

                    SupplierHasIngredient existing = existingMap.get(shi.getIngredient().getId());

                    if (existing == null) {
                        // New ingredient → Pending
                        shi.setStatus(StatusReject.Pending);

                    } else if (!existing.getPrice().equals(shi.getPrice())) {
                        // Price changed → soft-delete the OLD row
                        existing.setDeleteddatetime(LocalDateTime.now());
                        supplierHasIngredientDao.save(existing);

                        // Incoming shi should be treated as a brand new row — clear its id
                        shi.setId(null);
                        shi.setStatus(StatusReject.Pending);

                    } else {
                        // Price unchanged → keep existing status
                        shi.setStatus(existing.getStatus());
                    }
                }

                // Soft-delete ingredients that were removed from the form
                // SuggestionPriceIn is NOT touched — it stays, filtered out via SHI.deleteddatetime
                for (SupplierHasIngredient shi : existingIngredients) {
                    if (!incomingIngredientIds.contains(shi.getIngredient().getId())) {
                        shi.setDeleteddatetime(LocalDateTime.now());
                        supplierHasIngredientDao.save(shi);
                    }
                }
            }

            supplierDao.save(supplier);

            // Create/update suggestion only for Pending ingredients that
            // were actually touched above (no-op when ingredients was null).
            List<SupplierHasIngredient> updatedIngredients =
                    supplierHasIngredientDao.findBySupplierId(supplier.getId());

            for (SupplierHasIngredient shi : updatedIngredients) {
                if (shi.getStatus() == StatusReject.Pending) {
                    suggestionPriceInController.createOrUpdateSuggestion(shi);
                }
                // Active/Rejected → leave suggestion price record untouched
            }

            return "OK";

        } catch (Exception e) {
            System.err.println("Supplier update error: " + e.getMessage());
            String msg = e.getMessage();
            if (msg != null && msg.contains("contactperson_UNIQUE"))
                return "Supplier already exists for this Contact person";
            if (msg != null && msg.contains("companyname_UNIQUE"))
                return "Supplier already exists for this Company name";
            if (msg != null && msg.contains("email_UNIQUE"))
                return "Supplier already exists for this Email";
            if (msg != null && msg.contains("mobilenum_UNIQUE"))
                return "Supplier already exists for this mobile number";
            return "Something went wrong. Please try again";
        }
    }

    // ======== DELETE ========

    @DeleteMapping("/ingredient/supplier/{id}")
    @Override
    public String deleteData(@PathVariable int id) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canDelete()) {
            return "Access denied: insufficient privilege";
        }

        Supplier existingSupplier = supplierDao.findByIdAndDeleteddatetimeIsNull(id);
        if (existingSupplier == null) return "Supplier not found";

        try {
            existingSupplier.setDeleteddatetime(LocalDateTime.now());
            supplierDao.save(existingSupplier);
            return "OK";
        } catch (Exception e) {
            System.err.println("Supplier delete error: " + e.getMessage());
            return "Something went wrong. Please try again.";
        }
    }
}