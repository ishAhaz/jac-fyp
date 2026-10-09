package lk.jac.compost.dao;

import lk.jac.compost.entity.CompostHasIngredient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompostHasIngredientRepository extends JpaRepository<CompostHasIngredient, Integer> {
    List<CompostHasIngredient> findByIngredient_Id(Integer ingredientId);
}