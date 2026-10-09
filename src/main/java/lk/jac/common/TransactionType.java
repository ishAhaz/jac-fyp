package lk.jac.common;

public enum TransactionType {

        IN,          // stock added — e.g. quality check approved
        OUT,         // stock consumed — e.g. used in production
        ADJUSTMENT,  // manual correction after physical stock count
        WASTAGE      // stock written off — spoilage, damage, etc.

}
