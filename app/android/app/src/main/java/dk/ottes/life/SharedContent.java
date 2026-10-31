package dk.ottes.life;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

final class SharedContent {
    static final int MAX_TEXT_CHARS = 100_000;
    static final int MAX_IMAGE_BYTES = 25 * 1024 * 1024;
    private static final String ACTION_SEND = "android.intent.action.SEND";
    private static final String ACTION_SEND_MULTIPLE = "android.intent.action.SEND_MULTIPLE";

    private SharedContent() {}

    static boolean isShareAction(String action) {
        return ACTION_SEND.equals(action) || ACTION_SEND_MULTIPLE.equals(action);
    }

    static boolean isReadableImage(String scheme, String authority, String mimeType, String applicationId) {
        if (!"content".equalsIgnoreCase(scheme) || authority == null) {
            return false;
        }
        if (authority.equals(applicationId) || authority.startsWith(applicationId + ".")) {
            return false;
        }
        return mimeType != null && mimeType.startsWith("image/");
    }

    static String cappedText(String text) {
        return text == null || text.length() <= MAX_TEXT_CHARS ? text : text.substring(0, MAX_TEXT_CHARS);
    }

    static byte[] readCapped(InputStream input, int maxBytes) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[64 * 1024];
        int read;
        while ((read = input.read(buffer)) != -1) {
            output.write(buffer, 0, read);
            if (output.size() > maxBytes) {
                return null;
            }
        }
        return output.toByteArray();
    }
}
