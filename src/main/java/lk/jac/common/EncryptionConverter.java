package lk.jac.common;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Converter
@Component
public class EncryptionConverter implements AttributeConverter<String, String> {

    // This reads the value from application.properties
    @Value("${encryption.secret-key}")
    private String secretKey;

    @Override
    public String convertToDatabaseColumn(String plainText) {
        if (plainText == null || plainText.isEmpty()) return plainText;
        return AESUtil.encrypt(plainText, secretKey);
    }

    @Override
    public String convertToEntityAttribute(String cipherText) {
        if (cipherText == null || cipherText.isEmpty()) return cipherText;
        return AESUtil.decrypt(cipherText, secretKey);
    }
}