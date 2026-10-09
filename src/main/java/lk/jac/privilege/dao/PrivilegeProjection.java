package lk.jac.privilege.dao;


public interface PrivilegeProjection {
    Long getPriSelect();
    Long getPriInsert();
    Long getPriUpdate();
    Long getPriDelete();

}