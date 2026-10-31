package dk.ottes.life;

final class SharedContent {
    static final int MAX_TEXT_CHARS = 100_000;

    private SharedContent() {}

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
}
