package lk.jac.user.dao;

import lk.jac.employee.entity.Employee;
import lk.jac.farmer.entity.Farmer;
import lk.jac.ingredient.entity.Supplier;
import lk.jac.supermarket.entity.Supermarket;
import lk.jac.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserRepository extends JpaRepository<User,Integer> {

    @Query("SELECT DISTINCT u FROM User u " +
            "LEFT JOIN FETCH u.roles " +
            "LEFT JOIN FETCH u.employee " +
            "LEFT JOIN FETCH u.farmer " +
            "LEFT JOIN FETCH u.supermarket " +
            "WHERE u.deleteddatetime IS NULL " +
            "AND u.id NOT IN (" +
            "   SELECT u2.id FROM User u2 JOIN u2.roles r2 WHERE r2.name = 'Admin'" +
            ")")
    List<User> getSelectedColumns();

    User findByIdAndDeleteddatetimeIsNull(int uid);
    User findByUsernameAndEmployeeAndDeleteddatetimeIsNull(String username, Employee employee);

    //for user account check in employee
    List<User> findAllByEmployeeAndDeleteddatetimeIsNull(Employee employee);





    @Query(value =
            "SELECT t FROM (" +
                    "  SELECT 'crop' AS t FROM crop WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'farmer' FROM farmer WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'cropinventorytransaction' FROM cropinventorytransaction WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'cropsuggetionprice' FROM cropsuggetionprice WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'cropqualitycheck' FROM cropqualitycheck WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'cropprice' FROM cropprice WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'croppurchase' FROM croppurchase WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'grncrop' FROM grncrop WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'grningredient' FROM grningredient WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'purchaseorder' FROM purchaseorder WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'supplier' FROM supplier WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'ingredientqualitycheck' FROM ingredientqualitycheck WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'suggestionprice' FROM suggestionprice WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'ingredient' FROM ingredient WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'ingredientinventorytransaction' FROM ingredientinventorytransaction WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'ingredientprice' FROM ingredientprice WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'supermarketreturn' FROM supermarketreturn WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'supermarketorder' FROM supermarketorder WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'supermarket' FROM supermarket WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'expensepayment' FROM expensepayment WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'payment' FROM payment WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'invoice' FROM invoice WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'quotation' FROM quotation WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'compostsale' FROM compostsale WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'privilege' FROM privilege WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'compostreturn' FROM compostreturn WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'notification' FROM notification WHERE createdby_id = :userId " +
                    "  UNION ALL SELECT 'employee' FROM employee WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'delivery' FROM delivery WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'compostprice' FROM compostprice WHERE user_id = :userId " +
                    "  UNION ALL SELECT 'compost' FROM compost WHERE user_id = :userId " +
                    ") x LIMIT 3", nativeQuery = true)
    List<String> findUserInteractionModules(@Param("userId") int userId);


    //for login
    User findByUsernameAndDeleteddatetimeIsNull(String username);

    //for notification
    List<User> findByRoles_IdAndDeleteddatetimeIsNull(Integer roleId);

    //for security
    @Query(value = "SELECT u FROM User u WHERE u.username = ?1")
    User getByUsername(String username);

    User findByUsername(String username);


    List<User> findAllByFarmerAndDeleteddatetimeIsNull(Farmer farmer);
    List<User> findAllBySupplierAndDeleteddatetimeIsNull(Supplier supplier);
    List<User> findAllBySupermarketAndDeleteddatetimeIsNull(Supermarket supermarket);








}
