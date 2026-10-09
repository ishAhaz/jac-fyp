package lk.jac.common;

public interface CommonController<T> {
//    public List<T> getAllData();
    public String saveData(T t);
    public String updateData(T t);
    public String deleteData(int id);
}
