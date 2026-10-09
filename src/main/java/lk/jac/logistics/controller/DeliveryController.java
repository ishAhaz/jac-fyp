package lk.jac.logistics.controller;

import jakarta.transaction.Transactional;
import lk.jac.common.CurrentUserUtil;
import lk.jac.logistics.dao.DeliveryRepository;
import lk.jac.logistics.entity.Delivery;
import lk.jac.payment.entity.Payment;
import lk.jac.payment.entity.PaymentStatus;
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
public class DeliveryController {

    @Autowired
    private DeliveryRepository deliveryDao;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    private static final String MODULE_NAME = "DELIVERY";

    @GetMapping("/logistics/delivery")
    public ModelAndView deliveryPage() {
        ModelAndView deliveryUI = new ModelAndView();
        deliveryUI.setViewName("delivery.html");
        return deliveryUI;
    }


    //=======links========
    //====================
    @GetMapping("/logistics/delivery/alldata/selected")
    public List<Delivery> getSelectedDeliveryData() {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }
        return deliveryDao.getSelectedDeliveryData();
    }

    @GetMapping(value = "/logistics/delivery/byid/{id}", produces = "application/json")
    public Delivery getDeliveryById(@PathVariable int id) {
        return deliveryDao.findById(id).orElse(null);
    }
    //=======links========
    //====================


    //=======crud=======
    //==================
    // No saveData()/deleteData() — Delivery records are only ever spawned
    // by createOrUpdateDeliveryForPayment() below, triggered when the
    // source Payment becomes Partial/Paid. The only user action against
    // an existing record is filling in the delivery date (and any other
    // logistics-side fields) once it's been auto-created.

    // Logistics staff use this to fill in / adjust the delivery date and
    // any other delivery-side fields (e.g. driver, vehicle, address notes)
    // once the record has been auto-created from a payment. paymentstatus
    // is deliberately NOT taken from the request body — it's read-only
    // here and only ever set by createOrUpdateDeliveryForPayment().
    @PutMapping("/logistics/delivery/update")
    public String updateData(@RequestBody Delivery delivery) {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }

        Delivery extDelivery = deliveryDao.findById(delivery.getId()).orElse(null);
        if (extDelivery == null) {
            return "Delivery not found";
        }

        try {
            // Editable fields — adjust this list to match whatever your
            // Delivery entity actually exposes for manual editing.
            extDelivery.setDeliverdate(delivery.getDeliverdate());

            // paymentstatus intentionally untouched — read-only, driven by Payment

            User updatingUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);
            extDelivery.setUser(updatingUser);
            extDelivery.setUpdateddatetime(LocalDateTime.now());

            deliveryDao.save(extDelivery);
            return "OK";
        } catch (Exception e) {
            System.err.println("Delivery update error: " + e.getMessage());
            return "Something went wrong. Please try again.";
        }
    }
    //=======crud=======
    //==================


    //======AUTO-GENERATION======
    //===========================
    // Called from PaymentController whenever a Payment's status becomes
    // Partial or Paid (mirrors invoiceController.createOrUpdateInvoiceForPayment()).
    // Creates the Delivery record on first call for a given payment, and
    // just refreshes its paymentstatus on subsequent calls (e.g. Partial -> Paid),
    // so a payment never ends up with more than one linked delivery.
    @Transactional
    public void createOrUpdateDeliveryForPayment(Payment payment) {
        try {

            PaymentStatus status = payment.getPaymentstatus();

            // Only Paid or Partial payments should have a delivery record.
            if (status != PaymentStatus.Paid && status != PaymentStatus.Partial) {
                return;
            }
            Delivery delivery = deliveryDao.findByPayment(payment);

            if (delivery == null) {
                delivery = new Delivery();
                delivery.setPayment(payment);
                delivery.setCompostSale(payment.getCompostsale());
                delivery.setSupermarketorder(payment.getSupermarketOrder());
                delivery.setAddeddatetime(LocalDateTime.now());
                // deliverdate intentionally left null here — it's optional
                // and gets filled in later by logistics staff via updateData()
            }

            delivery.setPaymentstatus(payment.getPaymentstatus()); // read-only, system-set
            delivery.setUpdateddatetime(LocalDateTime.now());

            deliveryDao.save(delivery);

        } catch (Exception e) {
            System.err.println("Auto-create/update delivery error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}