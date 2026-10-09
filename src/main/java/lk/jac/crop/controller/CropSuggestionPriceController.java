package lk.jac.crop.controller;

import lk.jac.common.CurrentUserUtil;
import lk.jac.common.StatusReject;
import lk.jac.common.SuggestionStatus;
import lk.jac.crop.dao.CropSuggestionPriceRepository;
import lk.jac.crop.entity.CropSuggestionPrice;
import lk.jac.farmer.dao.CropHasFarmerRepository;
import lk.jac.farmer.entity.CropHasFarmer;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.user.dao.UserRepository;
import lk.jac.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class CropSuggestionPriceController  {

    @Autowired
    private CropSuggestionPriceRepository  cropSuggestionPriceDao;

    @Autowired
    private CropHasFarmerRepository cropHasFarmerDao;

    @Autowired
    private CropPriceController cropPriceController;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    private static final String MODULE_NAME = "CROP_SUGGESTION_PRICE";

    @GetMapping("/crop/cropsuggestionprice")
    public ModelAndView cropSuggestionPricePage() {
        ModelAndView cropSuggestionPriceUI = new ModelAndView();
        cropSuggestionPriceUI.setViewName("cropsuggestionprice.html");
        return cropSuggestionPriceUI;
    }

    // ======== LINKS ========

    @GetMapping(value = "/crop/cropsuggestionprice/alldata/selected", produces = "application/json")
    public List<CropSuggestionPrice> getSelectedCropSuggestionPriceData() {


        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }

        return cropSuggestionPriceDao.getSelectedCropSuggestionPriceData();
    }

    @GetMapping(value = "/crop/cropsuggestionprice/byid/{id}", produces = "application/json")
    public CropSuggestionPrice getById(@PathVariable Integer id) {
        return cropSuggestionPriceDao.findById(id).orElse(null);
    }




    @PutMapping("/crop/cropsuggestionprice/update")
    public String updateData(@RequestBody CropSuggestionPrice cropSuggestionPrice) {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }

        CropSuggestionPrice existing = cropSuggestionPriceDao.findById(cropSuggestionPrice.getId()).orElse(null);
        if (existing == null) {
            return "Record not found";
        }

        try {
            // Load the related crop-has-farmer row BEFORE mutating anything, so we
            // can snapshot the "current highest approved price" baseline pre-update.
            Integer chfId = existing.getCrophasfarmer().getId();
            CropHasFarmer chf = cropHasFarmerDao.findById(chfId).orElse(null);
            if (chf == null) {
                return "Related farmer-crop record not found";
            }
            Integer cropId = chf.getCropListManagement().getId();

            // Snapshot the highest approved price for this crop BEFORE this update takes effect
            Double oldHighest = cropSuggestionPriceDao.findHighestPriceByCropId(cropId);

            existing.setStatus(cropSuggestionPrice.getStatus());
            existing.setNote(cropSuggestionPrice.getNote());
            // NOTE: suggestedprice is intentionally NOT overwritten from the incoming
            // payload here. It's a server-computed baseline (set at creation time and
            // refreshed on siblings below) — letting the frontend overwrite it was the
            // source of the stale-price bug in crop price auto-generation.

            // Stamp review datetime on Approved or Rejected
            if (cropSuggestionPrice.getStatus() == SuggestionStatus.Approved ||
                    cropSuggestionPrice.getStatus() == SuggestionStatus.Rejected) {
                existing.setReviewdatetime(LocalDateTime.now());
            } else {
                existing.setReviewdatetime(null);
            }

            cropSuggestionPriceDao.save(existing);

            // Sync status back to crop_has_farmer
            if (cropSuggestionPrice.getStatus() == SuggestionStatus.Approved) {
                chf.setStatus(StatusReject.Active);
                cropHasFarmerDao.save(chf);

                // Recompute the TRUE highest approved price now that `existing`
                // has been persisted with status Approved
                Double newHighest = cropSuggestionPriceDao.findHighestPriceByCropId(cropId);

                // Only auto-generate a CropPrice record when the highest approved
                // price actually changed (first-ever approval, or a higher price
                // than before got approved). A lower/equal approval must NOT
                // trigger a new crop price record.
                boolean highestChanged = (oldHighest == null && newHighest != null)
                        || (oldHighest != null && newHighest != null && newHighest > oldHighest);

                if (highestChanged) {
                    cropPriceController.createOrUpdateCropPrice(chf.getCropListManagement(), newHighest);
                }

                // Refresh suggestedprice on all other Pending rows for the same crop
                // so they compare against the current true highest going forward
                List<CropSuggestionPrice> siblings = cropSuggestionPriceDao.findPendingByCropId(cropId);
                for (CropSuggestionPrice sibling : siblings) {
                    if (!sibling.getId().equals(existing.getId())) {
                        sibling.setSuggestedprice(newHighest);
                        cropSuggestionPriceDao.save(sibling);
                    }
                }

            } else if (cropSuggestionPrice.getStatus() == SuggestionStatus.Rejected) {
                chf.setStatus(StatusReject.Rejected);
                cropHasFarmerDao.save(chf);

            } else {
                chf.setStatus(StatusReject.Pending);
                cropHasFarmerDao.save(chf);
            }

            return "OK";
        } catch (Exception e) {
            System.err.println("SuggestionPrice update error: " + e.getMessage());
            return "Something went wrong. Please try again";
        }
    }

    // ======== AUTO-CREATE called from SupplierController ========

    public void createOrUpdateSuggestion(CropHasFarmer chf) {
        try {
            Double highestPrice = cropSuggestionPriceDao.findHighestPriceByCropId(
                    chf.getCropListManagement().getId()
            );

            // real logged-in user, used for both create and update below
            String username = CurrentUserUtil.getCurrentUsername();
            User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);

            CropSuggestionPrice existing = cropSuggestionPriceDao
                    .findByCropHasFarmerId(chf.getId());

            if (existing == null) {
                CropSuggestionPrice newRecord = new CropSuggestionPrice();
                newRecord.setCrophasfarmer(chf);
                newRecord.setFarmerprice(chf.getPrice());
                newRecord.setSuggestedprice(highestPrice); // null if no approved price exists yet
                newRecord.setSuggesteddatetime(LocalDateTime.now());
                newRecord.setStatus(SuggestionStatus.Pending);
                newRecord.setUser(currentUser);
                cropSuggestionPriceDao.save(newRecord);
            } else {
                existing.setFarmerprice(chf.getPrice());
                existing.setSuggestedprice(highestPrice); // null if no approved price exists yet
                existing.setSuggesteddatetime(LocalDateTime.now());
                existing.setStatus(SuggestionStatus.Pending);
                existing.setReviewdatetime(null);
                existing.setNote(null);
                existing.setUser(currentUser);
                cropSuggestionPriceDao.save(existing);
            }
        } catch (Exception e) {
            System.err.println("Auto-create suggestion error: " + e.getMessage());
        }
    }


}