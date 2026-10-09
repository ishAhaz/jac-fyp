package lk.jac.supermarket.dao;

import lk.jac.supermarket.entity.SupermarketOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupermarketOrderItemRepository extends JpaRepository<SupermarketOrderItem, Integer> {
}