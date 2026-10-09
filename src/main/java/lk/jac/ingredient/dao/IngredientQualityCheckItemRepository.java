package lk.jac.ingredient.dao;

import lk.jac.ingredient.entity.IngredientQualityCheckItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IngredientQualityCheckItemRepository extends JpaRepository<IngredientQualityCheckItem, Integer> {
}
