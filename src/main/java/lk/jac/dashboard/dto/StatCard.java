package lk.jac.dashboard.dto;

public class StatCard {

    private String label;
    private String value;
    private String icon;      // FontAwesome class, e.g. "fa-person-digging"
    private String bg;        // icon background color, e.g. "#d1e7dd"
    private String iconColor; // icon color, e.g. "#198754"

    public StatCard() {}

    public StatCard(String label, String value, String icon, String bg, String iconColor) {
        this.label = label;
        this.value = value;
        this.icon = icon;
        this.bg = bg;
        this.iconColor = iconColor;
    }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getBg() { return bg; }
    public void setBg(String bg) { this.bg = bg; }

    public String getIconColor() { return iconColor; }
    public void setIconColor(String iconColor) { this.iconColor = iconColor; }
}