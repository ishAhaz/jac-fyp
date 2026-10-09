package lk.jac.dashboard.dto;

public class Shortcut {

    private String label;
    private String url;
    private String icon; // FontAwesome class, e.g. "fa-seedling"

    public Shortcut() {}

    public Shortcut(String label, String url, String icon) {
        this.label = label;
        this.url = url;
        this.icon = icon;
    }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
}