package lk.jac.crop.dao;

import lk.jac.crop.entity.CropQualityCheckItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CropQualityCheckItemRepository extends JpaRepository<CropQualityCheckItem, Integer> {
}
