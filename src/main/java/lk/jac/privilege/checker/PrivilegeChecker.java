package lk.jac.privilege.checker;

import lk.jac.privilege.dao.PrivilegeProjection;

public class PrivilegeChecker {

    private final PrivilegeProjection projection;

    public PrivilegeChecker(PrivilegeProjection projection) {
        this.projection = projection;
    }

    private boolean isTrue(Long value) {
        return value != null && value > 0;
    }

    public boolean canSelect()  { return projection != null && isTrue(projection.getPriSelect()); }
    public boolean canInsert()  { return projection != null && isTrue(projection.getPriInsert()); }
    public boolean canUpdate()  { return projection != null && isTrue(projection.getPriUpdate()); }
    public boolean canDelete()  { return projection != null && isTrue(projection.getPriDelete()); }

}
